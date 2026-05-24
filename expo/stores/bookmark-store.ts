import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface BookmarkEntry {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  savedAt: string;
}

export interface ReadingProgressEntry {
  surahNumber: number;
  lastAyah: number;
  lastVisited: string;
}

interface BookmarkStore {
  bookmarks: BookmarkEntry[];
  progress: ReadingProgressEntry[];
  addBookmark: (surahNumber: number, surahName: string, ayahNumber: number) => void;
  removeBookmark: (surahNumber: number, ayahNumber: number) => void;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  updateProgress: (surahNumber: number, ayahNumber: number) => void;
  progressForSurah: (surahNumber: number) => ReadingProgressEntry | undefined;
  recentlyRead: () => ReadingProgressEntry[];
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      progress: [],
      addBookmark: (surahNumber, surahName, ayahNumber) =>
        set((state) => {
          const exists = state.bookmarks.some(
            (bookmark) => bookmark.surahNumber === surahNumber && bookmark.ayahNumber === ayahNumber
          );

          if (exists) {
            return state;
          }

          return {
            bookmarks: [
              { surahNumber, surahName, ayahNumber, savedAt: new Date().toISOString() },
              ...state.bookmarks,
            ],
          };
        }),
      removeBookmark: (surahNumber, ayahNumber) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter(
            (bookmark) => !(bookmark.surahNumber === surahNumber && bookmark.ayahNumber === ayahNumber)
          ),
        })),
      isBookmarked: (surahNumber, ayahNumber) =>
        get().bookmarks.some(
          (bookmark) => bookmark.surahNumber === surahNumber && bookmark.ayahNumber === ayahNumber
        ),
      updateProgress: (surahNumber, ayahNumber) =>
        set((state) => {
          const now = new Date().toISOString();
          const existing = state.progress.find((entry) => entry.surahNumber === surahNumber);

          if (!existing) {
            return {
              progress: [{ surahNumber, lastAyah: ayahNumber, lastVisited: now }, ...state.progress],
            };
          }

          return {
            progress: state.progress.map((entry) =>
              entry.surahNumber === surahNumber
                ? {
                    ...entry,
                    lastAyah: ayahNumber > entry.lastAyah ? ayahNumber : entry.lastAyah,
                    lastVisited: now,
                  }
                : entry
            ),
          };
        }),
      progressForSurah: (surahNumber) => get().progress.find((entry) => entry.surahNumber === surahNumber),
      recentlyRead: () =>
        [...get().progress]
          .sort((a, b) => new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime())
          .slice(0, 5),
    }),
    { name: 'quran-journal-bookmarks', storage: createJSONStorage(() => AsyncStorage) }
  )
);
