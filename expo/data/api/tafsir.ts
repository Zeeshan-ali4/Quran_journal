const BASE = 'https://api.quran.com/api/v4';

export interface TafsirMeta {
  id: number;
  name: string;
  language: string;
  author: string;
}

interface QuranComTafsirEntry {
  id: number;
  resource_id: number;
  verse_key: string;
  text: string;
}

interface QuranComTafsirListItem {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function fetchAvailableTafsirs(): Promise<TafsirMeta[]> {
  const response = await fetch(`${BASE}/resources/tafsirs?language=en`);

  if (!response.ok) {
    throw new Error(`quran.com ${response.status} while fetching tafsir list`);
  }

  const json = (await response.json()) as { tafsirs: QuranComTafsirListItem[] };

  return json.tafsirs
    .filter((t) => t.language_name === 'english')
    .map((t) => ({
      id: t.id,
      name: t.name,
      language: t.language_name,
      author: t.author_name,
    }));
}

export async function fetchSurahTafsir(
  tafsirId: number,
  surahNumber: number,
  ayahCount: number,
): Promise<string[]> {
  const response = await fetch(`${BASE}/tafsirs/${tafsirId}/by_chapter/${surahNumber}`);

  if (!response.ok) {
    throw new Error(`quran.com ${response.status} for tafsir ${tafsirId}/surah ${surahNumber}`);
  }

  const json = (await response.json()) as { tafsirs: QuranComTafsirEntry[] };

  const byAyah = new Map<number, string>();
  for (const entry of json.tafsirs) {
    const ayahNumber = parseInt(entry.verse_key.split(':')[1], 10);
    byAyah.set(ayahNumber, stripHtml(entry.text));
  }

  return Array.from({ length: ayahCount }, (_, i) => byAyah.get(i + 1) ?? '');
}
