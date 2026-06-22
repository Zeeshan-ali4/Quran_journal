import { Directory, File, Paths } from 'expo-file-system';

import { getAudioUrl } from '@/data/api/audio';

export type AudioCacheKey = {
  reciterId: string;
  surah: number;
  ayah: number;
};

const CACHE_ROOT = 'quran-audio-cache';
const MIN_VALID_AUDIO_BYTES = 1024;
const GLOBAL_CACHE_LIMIT_BYTES = 200 * 1024 * 1024;
const SURAH_CACHE_SOFT_LIMIT_BYTES = 120 * 1024 * 1024;
const MIN_AGGRESSIVE_PREFETCH_FREE_BYTES = 500 * 1024 * 1024;
const DOWNLOAD_BACKOFF_MS = [500, 1500, 3000] as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function cacheRootDirectory() {
  return new Directory(Paths.cache, CACHE_ROOT);
}

function reciterDirectory(reciterId: string) {
  return new Directory(cacheRootDirectory(), reciterId);
}

function surahDirectory(reciterId: string, surah: number) {
  return new Directory(reciterDirectory(reciterId), String(surah));
}

export function getAyahAudioFile({ reciterId, surah, ayah }: AudioCacheKey) {
  return new File(surahDirectory(reciterId, surah), `${ayah}.mp3`);
}

function ensureSurahDirectory(key: AudioCacheKey) {
  surahDirectory(key.reciterId, key.surah).create({ intermediates: true, idempotent: true });
}

export function hasRoomForAggressiveAudioPrefetch() {
  return Paths.availableDiskSpace >= MIN_AGGRESSIVE_PREFETCH_FREE_BYTES;
}

export function isCachedAyahValid(key: AudioCacheKey) {
  const file = getAyahAudioFile(key);
  return file.exists && file.size >= MIN_VALID_AUDIO_BYTES;
}

export function deleteCachedAyah(key: AudioCacheKey) {
  const file = getAyahAudioFile(key);
  if (file.exists) {
    file.delete();
  }
}

async function downloadOnce(key: AudioCacheKey) {
  ensureSurahDirectory(key);
  const file = getAyahAudioFile(key);
  await File.downloadFileAsync(getAudioUrl(key.surah, key.ayah, key.reciterId), file, { idempotent: true });

  if (!isCachedAyahValid(key)) {
    deleteCachedAyah(key);
    throw new Error(`Downloaded audio was invalid for ${key.reciterId}/${key.surah}/${key.ayah}`);
  }

  return file.uri;
}

export async function getCachedAudioUri(key: AudioCacheKey) {
  if (isCachedAyahValid(key)) {
    return getAyahAudioFile(key).uri;
  }

  deleteCachedAyah(key);
  return null;
}

export async function downloadAyahAudio(key: AudioCacheKey) {
  for (let attempt = 0; attempt < DOWNLOAD_BACKOFF_MS.length; attempt += 1) {
    try {
      return await downloadOnce(key);
    } catch (error) {
      if (attempt === DOWNLOAD_BACKOFF_MS.length - 1) {
        throw error;
      }
      await sleep(DOWNLOAD_BACKOFF_MS[attempt]);
    }
  }

  throw new Error('Audio download retries exhausted');
}

export async function getOrDownloadAyahAudio(key: AudioCacheKey) {
  const cached = await getCachedAudioUri(key);
  return cached ?? downloadAyahAudio(key);
}

function directorySize(directory: Directory): number {
  if (!directory.exists) {
    return 0;
  }

  return directory.list().reduce((sum, item) => {
    if (item instanceof File) {
      return sum + item.size;
    }
    return sum + directorySize(item);
  }, 0);
}

function listSurahDirectories() {
  const root = cacheRootDirectory();
  if (!root.exists) {
    return [];
  }

  return root.list().flatMap((reciterEntry) => {
    if (!(reciterEntry instanceof Directory) || !reciterEntry.exists) {
      return [];
    }

    return reciterEntry.list().filter((surahEntry): surahEntry is Directory => surahEntry instanceof Directory);
  });
}

function oldestModifiedTime(directory: Directory) {
  const entries = directory.exists ? directory.list() : [];
  const times = entries.map((entry) => (entry instanceof File ? entry.modificationTime : entry.info().modificationTime)).filter((time): time is number => typeof time === 'number');
  return Math.min(...times, directory.info().modificationTime ?? Date.now());
}

export async function cleanupAudioCache() {
  const root = cacheRootDirectory();
  root.create({ intermediates: true, idempotent: true });

  for (const directory of listSurahDirectories()) {
    if (directorySize(directory) > SURAH_CACHE_SOFT_LIMIT_BYTES) {
      directory.delete();
    }
  }

  let surahDirectories = listSurahDirectories().map((directory) => ({ directory, size: directorySize(directory), modified: oldestModifiedTime(directory) }));
  let totalSize = surahDirectories.reduce((sum, entry) => sum + entry.size, 0);

  for (const entry of surahDirectories.sort((a, b) => a.modified - b.modified)) {
    if (totalSize <= GLOBAL_CACHE_LIMIT_BYTES) {
      break;
    }
    entry.directory.delete();
    totalSize -= entry.size;
  }
}
