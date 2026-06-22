import { Audio, type AVPlaybackStatus } from 'expo-av';

import { deleteCachedAyah, getOrDownloadAyahAudio, type AudioCacheKey } from '@/data/api/audio-cache';
import { audioDownloadQueue } from '@/data/api/audio-download-queue';

type TrackKey = AudioCacheKey;
type QueueTrack = TrackKey & { totalAyahs: number };

type LoadedSound = {
  key: TrackKey;
  sound: Audio.Sound;
};

type PlaybackQueueOptions = {
  onFinish: () => void;
  onFatalError: (error: unknown) => void;
};

type CurrentTrackInfo = QueueTrack | null;

const CREATE_BACKOFF_MS = [250, 750] as const;
const EARLY_ADVANCE_MS = 350;
const OVERLAP_MS = 150;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function sameTrack(a: TrackKey | null | undefined, b: TrackKey | null | undefined) {
  return Boolean(a && b && a.reciterId === b.reciterId && a.surah === b.surah && a.ayah === b.ayah);
}

function nextTrack(track: QueueTrack): QueueTrack | null {
  if (track.ayah >= track.totalAyahs) {
    return null;
  }
  return { ...track, ayah: track.ayah + 1 };
}

class AudioPlaybackQueue {
  private current: LoadedSound | null = null;
  private preloaded: LoadedSound | null = null;
  private loadingToken = 0;
  private options: PlaybackQueueOptions | null = null;
  private currentTrackInfo: CurrentTrackInfo = null;
  private trackGeneration = 0;
  private advancedForGeneration = -1;

  setOptions(options: PlaybackQueueOptions) {
    this.options = options;
  }

  async clear() {
    this.loadingToken += 1;
    this.trackGeneration += 1;
    this.advancedForGeneration = -1;
    this.currentTrackInfo = null;
    audioDownloadQueue.clear();
    await Promise.all([this.unloadCurrent(), this.unloadPreloaded()]);
  }

  async load(track: QueueTrack, shouldPlay: boolean) {
    const token = this.loadingToken + 1;
    this.loadingToken = token;
    this.trackGeneration += 1;
    this.advancedForGeneration = -1;

    audioDownloadQueue.prioritize(track);
    this.currentTrackInfo = track;

    if (sameTrack(this.current?.key, track)) {
      if (shouldPlay) {
        await this.current?.sound.playAsync();
      }
      this.preloadNext(track, token);
      return;
    }

    if (sameTrack(this.preloaded?.key, track)) {
      await this.unloadCurrent();
      const promoted = this.preloaded;
      if (!promoted) return;
      this.current = promoted;
      this.preloaded = null;
      this.attachFinishHandler(promoted.sound, track);
      if (shouldPlay) {
        await promoted.sound.playAsync();
      }
      this.preloadNext(track, token);
      return;
    }

    await this.unloadCurrent();
    const loaded = await this.createLoadedSound(track, shouldPlay, token);
    if (token !== this.loadingToken) {
      await loaded.sound.unloadAsync();
      return;
    }
    await this.unloadPreloaded();
    this.current = loaded;
    this.attachFinishHandler(loaded.sound, track);
    this.preloadNext(track, token);
  }

  async setPlaying(isPlaying: boolean) {
    if (!this.current) {
      return;
    }

    if (isPlaying) {
      await this.current.sound.playAsync();
    } else {
      await this.current.sound.pauseAsync();
    }
  }

  private preloadNext(track: QueueTrack, token: number) {
    const upcoming = nextTrack(track);
    if (!upcoming || sameTrack(this.preloaded?.key, upcoming)) {
      return;
    }

    void (async () => {
      try {
        const loaded = await this.createLoadedSound(upcoming, false, token);
        if (token !== this.loadingToken) {
          await loaded.sound.unloadAsync();
          return;
        }
        await this.unloadPreloaded();
        this.preloaded = loaded;
      } catch (error) {
        console.warn('Audio preload failed', error);
      }
    })();
  }

  private async createLoadedSound(track: TrackKey, shouldPlay: boolean, token: number): Promise<LoadedSound> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= CREATE_BACKOFF_MS.length; attempt += 1) {
      try {
        const uri = await getOrDownloadAyahAudio(track);
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay });
        return { key: track, sound };
      } catch (error) {
        lastError = error;
        deleteCachedAyah(track);
        if (attempt < CREATE_BACKOFF_MS.length) {
          await sleep(CREATE_BACKOFF_MS[attempt]);
        }
      }
    }

    this.options?.onFatalError(lastError);
    throw lastError instanceof Error ? lastError : new Error('Audio playback creation failed');
  }

  private attachFinishHandler(sound: Audio.Sound, track: QueueTrack) {
    const generation = this.trackGeneration;

    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (!status.isLoaded || generation !== this.trackGeneration) return;

      const upcoming = nextTrack(track);

      if (
        upcoming &&
        status.durationMillis &&
        status.positionMillis >= status.durationMillis - EARLY_ADVANCE_MS &&
        this.advancedForGeneration !== generation
      ) {
        this.advancedForGeneration = generation;
        this.promotePreloadedAndPlay(track, true);
        this.options?.onFinish();
        return;
      }

      if (status.didJustFinish && this.advancedForGeneration !== generation) {
        this.promotePreloadedAndPlay(track, false);
        this.options?.onFinish();
      }
    });
  }

  private promotePreloadedAndPlay(finishedTrack: QueueTrack, keepOverlap: boolean) {
    const upcoming = nextTrack(finishedTrack);
    if (!upcoming || !this.preloaded || !sameTrack(this.preloaded.key, upcoming)) {
      return;
    }

    const old = this.current;
    const promoted = this.preloaded;
    this.current = promoted;
    this.preloaded = null;
    this.currentTrackInfo = upcoming;
    this.trackGeneration += 1;

    this.attachFinishHandler(promoted.sound, upcoming);
    void promoted.sound.playAsync();
    this.preloadNext(upcoming, this.loadingToken);

    if (old) {
      if (keepOverlap) {
        setTimeout(() => void old.sound.unloadAsync(), OVERLAP_MS);
      } else {
        void old.sound.unloadAsync();
      }
    }
  }

  private async unloadCurrent() {
    if (!this.current) return;
    const sound = this.current.sound;
    this.current = null;
    await sound.unloadAsync();
  }

  private async unloadPreloaded() {
    if (!this.preloaded) return;
    const sound = this.preloaded.sound;
    this.preloaded = null;
    await sound.unloadAsync();
  }
}

export const audioPlaybackQueue = new AudioPlaybackQueue();