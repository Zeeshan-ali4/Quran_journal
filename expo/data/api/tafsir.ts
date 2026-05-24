const BASE = 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir';

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

export async function fetchAvailableTafsirs(): Promise<TafsirMeta[]> {
  const response = await fetch(`${BASE}/editions.json`);

  if (!response.ok) {
    throw new Error(`tafsir_api ${response.status} while fetching tafsir list`);
  }

  const editions = (await response.json()) as TafsirEdition[];

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
  const response = await fetch(`${BASE}/${tafsirSlug}/${surahNumber}.json`);

  if (!response.ok) {
    throw new Error(`tafsir_api ${response.status} for tafsir ${tafsirSlug}/surah ${surahNumber}`);
  }

  const json = (await response.json()) as { ayahs: SurahTafsirAyah[] };

  const byAyah = new Map<number, string>();
  for (const entry of json.ayahs) {
    byAyah.set(entry.ayah, entry.text);
  }

  return Array.from({ length: ayahCount }, (_, i) => byAyah.get(i + 1) ?? '');
}
