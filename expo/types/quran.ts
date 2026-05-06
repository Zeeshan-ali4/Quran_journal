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
}

export interface SurahDetail extends SurahSummary {
  verses: Verse[];
}

export type NoteTargetType = 'chapter' | 'verse' | 'word';
export type SocialRelation = 'you' | 'following' | 'follower' | 'mutual' | 'none';

export interface NoteTarget {
  type: NoteTargetType;
  surahNumber: number;
  surahName: string;
  verseNumber?: number;
  word?: string;
}

export interface NoteAuthor {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  relation: SocialRelation;
}

export interface NoteItem {
  id: string;
  target: NoteTarget;
  content: string;
  createdAt: string;
  author: NoteAuthor;
  isShared: boolean;
}

export interface SocialPreferences {
  shareNotesToFollowers: boolean;
  showFollowerNotes: boolean;
}

export interface SocialProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  city: string;
  favoriteSurah: string;
  followersCount: number;
  followingCount: number;
  notesSharedCount: number;
  relation: SocialRelation;
}