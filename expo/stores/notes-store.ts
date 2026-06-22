import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import type { UserNote } from '@/types/quran';

const STORAGE_KEY = 'quran-journal-user-notes';

interface NotesStore {
  notes: UserNote[];
  isLoaded: boolean;
  isLoading: boolean;
  addNote: (payload: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, patch: Partial<Pick<UserNote, 'content' | 'tags'>>) => void;
  deleteNote: (id: string) => void;
  notesForSurah: (surahNumber: number) => UserNote[];
  notesForAyah: (surahNumber: number, ayahNumber: number) => UserNote[];
  notesForWord: (surahNumber: number, ayahNumber: number, wordIndex: number) => UserNote[];
  searchNotes: (query: string) => UserNote[];
  setIsLoaded: (isLoaded: boolean) => void;
}

type PersistedNotesState = Pick<NotesStore, 'notes'>;

const noteId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function isUserNoteArray(value: unknown): value is UserNote[] {
  return Array.isArray(value);
}

const notesStorage: PersistStorage<PersistedNotesState> = {
  getItem: async (name) => {
    const raw = await AsyncStorage.getItem(name);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StorageValue<PersistedNotesState> | UserNote[];
    if (isUserNoteArray(parsed)) {
      return { state: { notes: parsed }, version: 0 };
    }

    return parsed;
  },
  setItem: (name, value) => AsyncStorage.setItem(name, JSON.stringify(value)),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      isLoaded: false,
      isLoading: true,
      addNote: (payload) =>
        set((state) => {
          const now = new Date().toISOString();
          return { notes: [{ id: noteId(), createdAt: now, updatedAt: now, ...payload }, ...state.notes] };
        }),
      updateNote: (id, patch) =>
        set((state) => ({
          notes: state.notes.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note)),
        })),
      deleteNote: (id) => set((state) => ({ notes: state.notes.filter((note) => note.id !== id) })),
      notesForSurah: (surahNumber) =>
        get().notes.filter((note) => note.referenceType === 'surah' && note.surahNumber === surahNumber),
      notesForAyah: (surahNumber, ayahNumber) =>
        get().notes.filter((note) => note.referenceType === 'ayah' && note.surahNumber === surahNumber && note.ayahNumber === ayahNumber),
      notesForWord: (surahNumber, ayahNumber, wordIndex) =>
        get().notes.filter((note) => (
          note.referenceType === 'word'
          && note.surahNumber === surahNumber
          && note.ayahNumber === ayahNumber
          && note.wordIndex === wordIndex
        )),
      searchNotes: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return get().notes;
        return get().notes.filter((note) => (
          note.content.toLowerCase().includes(q)
          || note.tags.some((tag) => tag.toLowerCase().includes(q))
        ));
      },
      setIsLoaded: (isLoaded) => set({ isLoaded, isLoading: !isLoaded }),
    }),
    {
      name: STORAGE_KEY,
      storage: notesStorage,
      version: 1,
      partialize: (state) => ({ notes: state.notes }),
      migrate: (persistedState): PersistedNotesState => {
        if (isUserNoteArray(persistedState)) {
          return { notes: persistedState };
        }

        if (persistedState && typeof persistedState === 'object' && 'notes' in persistedState) {
          const notes = (persistedState as { notes?: unknown }).notes;
          return { notes: isUserNoteArray(notes) ? notes : [] };
        }

        return { notes: [] };
      },
      onRehydrateStorage: () => (state) => {
        state?.setIsLoaded(true);
      },
    }
  )
);
