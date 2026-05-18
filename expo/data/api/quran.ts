import quranOffline from '@/data/quran-offline.json';
import surahList from '@/data/surah-list.json';
import type { SurahDetail, SurahSummary, Verse } from '@/types/quran';

interface OfflineVerse {
  numberInSurah: number;
  arabic: string;
  translation: string;
}

type QuranOfflineData = Record<string, OfflineVerse[]>;

export async function fetchSurahList(): Promise<SurahSummary[]> {
  return surahList as SurahSummary[];
}

export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const surah = (surahList as SurahSummary[]).find((item) => item.number === surahNumber);

  if (!surah) {
    throw new Error(`Surah ${surahNumber} not found`);
  }

  const verses = ((quranOffline as QuranOfflineData)[String(surahNumber)] ?? []) as Verse[];

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
