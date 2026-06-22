const BASE_URLS = [
  'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir',
  'https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir',
];

const REQUEST_TIMEOUT_MS = 12000;

export interface TafsirMeta {
  id: string;
  name: string;
  language: string;
  author: string;
}

interface TafsirEdition {
  author_name: string;
  language_name: string;
  name: string;
  slug: string;
}

interface SurahTafsirAyah {
  ayah?: number;
  text: string;
}

type SurahTafsirResponse = { ayahs: SurahTafsirAyah[] } | SurahTafsirAyah[];

export class TafsirError extends Error {
  cause?: unknown;

  constructor(public kind: 'offline' | 'unavailable', cause?: unknown) {
    super(kind);
    this.name = 'TafsirError';
    this.cause = cause;
  }
}

export type TafsirResult =
  | { status: 'ready'; data: string[] }
  | { status: 'empty'; reason: 'source_missing' | 'surah_missing' };

type TafsirFetchFailure = {
  url: string;
  error: unknown;
  status?: number;
};

class TafsirHttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
    this.name = 'TafsirHttpError';
  }
}

function isOfflineFailure(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'AbortError'
    || (error instanceof TypeError && error.message === 'Network request failed')
    || error.message.toLowerCase().includes('timeout')
  );
}

async function fetchJsonWithFallback<T>(path: string): Promise<T> {
  const errors: string[] = [];

  for (const baseUrl of BASE_URLS) {
    const url = `${baseUrl}/${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new TafsirHttpError(response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${url}: ${message}`);
      console.error(`Failed to fetch tafsir data from ${url}`, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Unable to fetch tafsir data. Tried ${errors.join(' | ')}`);
}

export async function fetchAvailableTafsirs(): Promise<TafsirMeta[]> {
  const editions = await fetchJsonWithFallback<TafsirEdition[]>('editions.json');

  return editions
    .filter((t) => t.language_name === 'english')
    .map((t) => ({
      id: t.slug,
      name: t.name,
      language: t.language_name,
      author: t.author_name,
    }));
}

export async function fetchSurahTafsir(
  tafsirSlug: string,
  surahNumber: number,
  ayahCount: number,
): Promise<TafsirResult> {
  const path = `${tafsirSlug}/${surahNumber}.json`;
  const failures: TafsirFetchFailure[] = [];

  for (const baseUrl of BASE_URLS) {
    const url = `${baseUrl}/${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new TafsirHttpError(response.status);
      }

      const json = (await response.json()) as SurahTafsirResponse;
      const ayahs = Array.isArray(json) ? json : json.ayahs;

      if (!Array.isArray(ayahs) || ayahs.length === 0) {
        console.error(`Malformed or empty tafsir ayah array from ${url}`, json);
        return { status: 'empty', reason: 'surah_missing' };
      }

      const byAyah = new Map<number, string>();
      ayahs.forEach((entry, index) => {
        if (entry && typeof entry.text === 'string') {
          byAyah.set(entry.ayah ?? index + 1, entry.text);
        }
      });

      const data = Array.from({ length: ayahCount }, (_, i) => byAyah.get(i + 1) ?? '');

      if (data.every((text) => text.trim().length === 0)) {
        console.error(`Tafsir response did not include usable ayah text from ${url}`, json);
        return { status: 'empty', reason: 'surah_missing' };
      }

      return { status: 'ready', data };
    } catch (error) {
      const status = error instanceof TafsirHttpError ? error.status : undefined;
      failures.push({ url, error, status });
      console.error(`Failed to fetch tafsir data from ${url}`, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  if (failures.length === BASE_URLS.length && failures.every((failure) => failure.status === 404)) {
    console.error('Tafsir source missing from all fallback URLs', failures);
    return { status: 'empty', reason: 'source_missing' };
  }

  if (failures.length === BASE_URLS.length && failures.every((failure) => isOfflineFailure(failure.error))) {
    throw new TafsirError('offline', failures);
  }

  throw new TafsirError('unavailable', failures);
}
