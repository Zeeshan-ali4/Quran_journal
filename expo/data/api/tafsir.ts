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
  ayah: number;
  text: string;
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
        throw new Error(`HTTP ${response.status}`);
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
): Promise<string[]> {
  const json = await fetchJsonWithFallback<{ ayahs: SurahTafsirAyah[] } | SurahTafsirAyah[]>(
    `${tafsirSlug}/${surahNumber}.json`,
  );

  const ayahs = Array.isArray(json) ? json : json?.ayahs;

  if (!Array.isArray(ayahs)) {
    throw new Error(`Unexpected tafsir response shape for ${tafsirSlug}/${surahNumber}.json`);
  }

  const byAyah = new Map<number, string>();
  for (const entry of ayahs) {
    byAyah.set(entry.ayah, entry.text);
  }

  return Array.from({ length: ayahCount }, (_, i) => byAyah.get(i + 1) ?? '');
}
