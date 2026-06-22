import { Audio, type AVPlaybackStatus } from 'expo-av';

import { deleteCachedAyah, getOrDownloadAyahAudio, type AudioCacheKey } from '@/data/api/audio-cache';
import { audioDownloadQueue } from '@/data/api/audio-download-queue';

type TrackKey = AudioCacheKey;
type QueueTrack = TrackKey & { totalAyahs: number };

type LoadedSound = {
  key: TrackKey;
  sound: Audio.Sound;
  requestedAdvance: boolean;
  canAdvanceBeforeEnd: boolean;
};

type PlaybackQueueOptions = {
  onFinish: () => void;
  onFatalError: (error: unknown) => void;
};

const CREATE_BACKOFF_MS = [250, 750] as const;
const NEAR_END_ADVANCE_MS = 350;
const PLAYBACK_STATUS_INTERVAL_MS = 100;
const OVERLAP_UNLOAD_DELAY_MS = 150;

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

  setOptions(options: PlaybackQueueOptions) {
    this.options = options;
  }

  async clear() {
    this.loadingToken += 1;
    audioDownloadQueue.clear();
    await Promise.all([this.unloadCurrent(), this.unloadPreloaded()]);
  }

  async load(track: QueueTrack, shouldPlay: boolean) {
    const token = this.loadingToken + 1;
    this.loadingToken = token;

    audioDownloadQueue.prioritize(track);

    if (sameTrack(this.current?.key, track)) {
      if (shouldPlay) {
        await this.current?.sound.playAsync();
      }
      this.preloadNext(track, token);
      return;
    }

    if (sameTrack(this.preloaded?.key, track)) {
      const previous = this.current;
      const promoted = this.preloaded;
      if (!promoted) return;
      this.current = promoted;
      this.preloaded = null;
      this.attachFinishHandler(promoted);
      if (shouldPlay) {
        await promoted.sound.playAsync();
      }
      this.unloadAfterOverlap(previous);
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
    this.attachFinishHandler(loaded);
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

  private async createLoadedSound(track: QueueTrack, shouldPlay: boolean, token: number): Promise<LoadedSound> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= CREATE_BACKOFF_MS.length; attempt += 1) {
      try {
        const uri = await getOrDownloadAyahAudio(track);
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { progressUpdateIntervalMillis: PLAYBACK_STATUS_INTERVAL_MS, shouldPlay }
        );
        return { key: track, canAdvanceBeforeEnd: track.ayah < track.totalAyahs, requestedAdvance: false, sound };
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

  private attachFinishHandler(loaded: LoadedSound) {
    loaded.sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (!status.isLoaded || this.current !== loaded) {
        return;
      }

      const remainingMillis = typeof status.durationMillis === 'number'
        ? status.durationMillis - status.positionMillis
        : null;

      if (
        loaded.canAdvanceBeforeEnd
        && !loaded.requestedAdvance
        && remainingMillis !== null
        && remainingMillis <= NEAR_END_ADVANCE_MS
      ) {
        loaded.requestedAdvance = true;
        this.options?.onFinish();
        return;
      }

      if (status.didJustFinish && !loaded.requestedAdvance) {
        loaded.requestedAdvance = true;
        this.options?.onFinish();
      }
    });
  }

  private unloadAfterOverlap(loaded: LoadedSound | null) {
    if (!loaded) return;
    loaded.sound.setOnPlaybackStatusUpdate(null);
    setTimeout(() => {
      void loaded.sound.unloadAsync();
    }, OVERLAP_UNLOAD_DELAY_MS);
  }

  private async unloadCurrent() {
    if (!this.current) return;
    const sound = this.current.sound;
    this.current = null;
    sound.setOnPlaybackStatusUpdate(null);
    await sound.unloadAsync();
  }

  private async unloadPreloaded() {
    if (!this.preloaded) return;
    const sound = this.preloaded.sound;
    this.preloaded = null;
    sound.setOnPlaybackStatusUpdate(null);
    await sound.unloadAsync();
  }
}

export const audioPlaybackQueue = new AudioPlaybackQueue();