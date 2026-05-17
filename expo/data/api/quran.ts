import surahList from '@/data/surah-list.json';
import type { SurahDetail, SurahSummary, Verse } from '@/types/quran';

interface SurahListResponse {
  code: number;
  status: string;
  data: SurahSummary[];
}

interface EditionAyah {
  numberInSurah: number;
  text: string;
}

interface EditionData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: EditionAyah[];
}

interface SurahEditionsResponse {
  code: number;
  status: string;
  data: [EditionData, EditionData] | EditionData[];
}

const API_BASE_URL = 'https://api.alquran.cloud/v1';

function assertOk(response: Response) {
  if (!response.ok) {
    throw new Error(`Network request failed with status ${response.status}`);
  }
}

export async function fetchSurahList(): Promise<SurahSummary[]> {
  return surahList as SurahSummary[];
}

export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  console.log('[QuranAPI] Fetching surah detail', { surahNumber });
  const response = await fetch(
    `${API_BASE_URL}/surah/${surahNumber}/editions/quran-uthmani,en.asad`
  );
  assertOk(response);

  const payload = (await response.json()) as SurahEditionsResponse;
  if (!Array.isArray(payload.data) || payload.data.length < 2) {
    throw new Error('Invalid surah detail response');
  }

  const arabicEdition = payload.data[0];
  const translationEdition = payload.data[1];

  const verses: Verse[] = arabicEdition.ayahs.map((ayah, index) => ({
    numberInSurah: ayah.numberInSurah,
    arabic: ayah.text,
    translation: translationEdition.ayahs[index]?.text ?? '',
  }));

  return {
    number: arabicEdition.number,
    name: arabicEdition.name,
    englishName: arabicEdition.englishName,
    englishNameTranslation: arabicEdition.englishNameTranslation,
    numberOfAyahs: arabicEdition.numberOfAyahs,
    revelationType: arabicEdition.revelationType,
    verses,
  };
}