import quranOffline from '@/data/quran-offline.json';
import surahList from '@/data/surah-list.json';
import type { TranslationId } from '@/stores/quran-settings-store';
import type { SurahDetail, SurahSummary, Verse } from '@/types/quran';

interface OfflineVerse {
  numberInSurah: number;
  arabic: string;
  translation: string;
}

type QuranOfflineData = Record<string, OfflineVerse[]>;

interface AlquranAyah {
  numberInSurah: number;
  text: string;
}

const ALQURAN_BASE = 'https://api.alquran.cloud/v1';

async function fetchEditions(surahNumber: number, editions: string[]): Promise<AlquranAyah[][]> {
  const url =
    editions.length === 1
      ? `${ALQURAN_BASE}/surah/${surahNumber}/${editions[0]}`
      : `${ALQURAN_BASE}/surah/${surahNumber}/editions/${editions.join(',')}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`alquran.cloud ${res.status} for surah ${surahNumber}`);

  const json = (await res.json()) as { data: { ayahs: AlquranAyah[] } | { ayahs: AlquranAyah[] }[] };

  if (Array.isArray(json.data)) {
    return json.data.map((d) => d.ayahs);
  }
  return [json.data.ayahs];
}

export async function fetchSurahList(): Promise<SurahSummary[]> {
  return surahList as SurahSummary[];
}

export async function fetchSurahDetail(
  surahNumber: number,
  translationId: TranslationId = 'bundled',
  showTransliteration = false,
): Promise<SurahDetail> {
  const surah = (surahList as SurahSummary[]).find((item) => item.number === surahNumber);
  if (!surah) throw new Error(`Surah ${surahNumber} not found`);

  const raw = ((quranOffline as QuranOfflineData)[String(surahNumber)] ?? []) as OfflineVerse[];

  let verses: Verse[];

  if (translationId === 'bundled') {
    if (showTransliteration) {
      const [translitAyahs] = await fetchEditions(surahNumber, ['en.transliteration']);
      const translitMap = new Map(translitAyahs.map((a) => [a.numberInSurah, a.text]));
      verses = raw.map((v) => ({ ...v, transliteration: translitMap.get(v.numberInSurah) }));
    } else {
      verses = raw as Verse[];
    }
  } else {
    const editions = showTransliteration ? [translationId, 'en.transliteration'] : [translationId];
    const results = await fetchEditions(surahNumber, editions);

    const transMap = new Map(results[0].map((a) => [a.numberInSurah, a.text]));
    const translitMap = showTransliteration
      ? new Map(results[1].map((a) => [a.numberInSurah, a.text]))
      : undefined;

    verses = raw.map((v) => ({
      numberInSurah: v.numberInSurah,
      arabic: v.arabic,
      translation: transMap.get(v.numberInSurah) ?? v.translation,
      ...(translitMap ? { transliteration: translitMap.get(v.numberInSurah) } : {}),
    }));
  }

  return {
    number: surah.number,
    name: surah.name,
    englishName: surah.englishName,
    englishNameTranslation: surah.englishNameTranslation,
    numberOfAyahs: surah.numberOfAyahs,
    revelationType: surah.revelationType,
    verses,
  };
}
