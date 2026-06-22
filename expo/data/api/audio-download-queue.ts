import { downloadAyahAudio, getCachedAudioUri, hasRoomForAggressiveAudioPrefetch, type AudioCacheKey } from '@/data/api/audio-cache';

type PrioritizeInput = AudioCacheKey & { totalAyahs: number; completeSurah?: boolean };

type DownloadJob = AudioCacheKey & { priority: number; id: string };

const MAX_CONCURRENT_DOWNLOADS = 2;

function jobId(key: AudioCacheKey) {
  return `${key.reciterId}:${key.surah}:${key.ayah}`;
}

class AudioDownloadQueue {
  private jobs = new Map<string, DownloadJob>();
  private active = 0;
  private generation = 0;

  clear() {
    this.jobs.clear();
    this.generation += 1;
  }

  prioritize({ reciterId, surah, ayah, totalAyahs, completeSurah = true }: PrioritizeInput) {
    const canCompleteSurah = completeSurah && hasRoomForAggressiveAudioPrefetch();
    const jobs: DownloadJob[] = [{ reciterId, surah, ayah, priority: 0, id: jobId({ reciterId, surah, ayah }) }];

    if (ayah + 1 <= totalAyahs) jobs.push({ reciterId, surah, ayah: ayah + 1, priority: 10, id: jobId({ reciterId, surah, ayah: ayah + 1 }) });
    if (ayah + 2 <= totalAyahs) jobs.push({ reciterId, surah, ayah: ayah + 2, priority: 20, id: jobId({ reciterId, surah, ayah: ayah + 2 }) });

    if (canCompleteSurah) {
      for (let next = ayah + 3; next <= totalAyahs; next += 1) {
        jobs.push({ reciterId, surah, ayah: next, priority: 50 + (next - ayah), id: jobId({ reciterId, surah, ayah: next }) });
      }
      for (let previous = 1; previous < ayah; previous += 1) {
        jobs.push({ reciterId, surah, ayah: previous, priority: 80 + previous, id: jobId({ reciterId, surah, ayah: previous }) });
      }
    }

    jobs.forEach((job) => {
      const existing = this.jobs.get(job.id);
      if (!existing || job.priority < existing.priority) {
        this.jobs.set(job.id, job);
      }
    });

    this.pump();
  }

  private nextJob() {
    const sorted = [...this.jobs.values()].sort((a, b) => a.priority - b.priority || a.ayah - b.ayah);
    const job = sorted[0];
    if (job) {
      this.jobs.delete(job.id);
    }
    return job;
  }

  private pump() {
    while (this.active < MAX_CONCURRENT_DOWNLOADS) {
      const job = this.nextJob();
      if (!job) return;
      const generation = this.generation;
      this.active += 1;
      void this.runJob(job, generation);
    }
  }

  private async runJob(job: DownloadJob, generation: number) {
    try {
      if (generation === this.generation && !(await getCachedAudioUri(job))) {
        await downloadAyahAudio(job);
      }
    } catch (error) {
      console.warn('Audio cache download failed', error);
    } finally {
      this.active = Math.max(0, this.active - 1);
      if (generation === this.generation) {
        this.pump();
      }
    }
  }
}

export const audioDownloadQueue = new AudioDownloadQueue();
