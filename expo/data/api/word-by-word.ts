const QURAN_API_BASE = 'https://api.quran.com/api/v4';

interface QuranApiWord {
  translation?: { text?: string };
}

interface QuranApiVerse {
  verse_number?: number;
  words?: QuranApiWord[];
}

interface QuranApiResponse {
  verses?: QuranApiVerse[];
}

/**
 * Fetches per-word English glosses for every ayah in a surah, keyed by ayah number,
 * then by word index within that ayah. Defensive against API shape drift — any
 * missing/unexpected field simply results in no gloss for that word rather than
 * a thrown error.
 */
export async function fetchSurahWordGlosses(surahNumber: number): Promise<Record<number, string[]>> {
  const url = `${QURAN_API_BASE}/verses/by_chapter/${surahNumber}?language=en&words=true&word_translation_language=en&fields=text_uthmani&per_page=300`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`quran.com API ${response.status} for surah ${surahNumber}`);
  }

  const json = (await response.json().catch(() => null)) as QuranApiResponse | null;
  const verses = json?.verses ?? [];

  const byAyah: Record<number, string[]> = {};

  for (const verse of verses) {
    const ayahNumber = verse?.verse_number;
    if (typeof ayahNumber !== 'number') continue;

    const words = verse?.words ?? [];
    // Skip the last word, which is typically the end-of-ayah marker, not a real word.
    const glossWords = words.slice(0, Math.max(0, words.length - 1));
    byAyah[ayahNumber] = glossWords.map((w) => w?.translation?.text ?? '');
  }

  return byAyah;
}