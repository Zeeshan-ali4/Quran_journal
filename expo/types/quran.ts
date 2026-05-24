export interface SurahSummary {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Verse {
  numberInSurah: number;
  arabic: string;
  translation: string;
  transliteration?: string;
  tafsir?: string;
}

export interface SurahDetail extends SurahSummary {
  verses: Verse[];
}

export interface QuranAyah {
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation: string;
}

export type NoteReferenceType = 'surah' | 'ayah' | 'word';
export type NoteTag = 'reflection' | 'action' | 'question' | "du'a" | 'theme';

export interface UserNote {
  id: string;
  referenceType: NoteReferenceType;
  surahNumber: number;
  ayahNumber?: number;
  wordIndex?: number;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TafsirEntry {
  id: string;
  source: string;
  surahNumber: number;
  ayahNumber: number;
  content: string;
}

export interface HadithLink {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  hadithReference: string;
  text: string;
  grading: string;
  source: string;
}
