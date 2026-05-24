import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { NoteCard } from '@/components/note-card';
import { NoteComposer } from '@/components/note-composer';
import { palette } from '@/constants/colors';
import { REFLECTION_PROMPTS } from '@/constants/reflection-prompts';
import { fetchSurahDetail } from '@/data/api/quran';
import { useNotes } from '@/providers/notes-provider';
import type { NoteTag, UserNote } from '@/types/quran';

type Selection =
  | { type: 'surah' }
  | { type: 'ayah'; ayahNumber: number }
  | { type: 'word'; ayahNumber: number; wordIndex: number; wordText: string };

function AyahCard({
  arabic,
  translation,
  onAyahPress,
  onWordPress,
  wordHasNotes,
  ayahNoteCount,
}: {
  arabic: string;
  translation: string;
  onAyahPress: () => void;
  onWordPress: (wordIndex: number, wordText: string) => void;
  wordHasNotes: Set<number>;
  ayahNoteCount: number;
}) {
  const words = useMemo(() => arabic.split(' ').filter(Boolean), [arabic]);

  return (
    <View style={styles.ayahCard}>
      <View style={styles.arabicWordsRow}>
        {words.map((word, wordIndex) => (
          <Pressable key={`${word}-${wordIndex}`} style={[styles.wordChip, wordHasNotes.has(wordIndex) && styles.wordChipAnnotated]} onPress={() => onWordPress(wordIndex, word)}>
            <Text style={styles.arabicWord}>{word}</Text>
            {wordHasNotes.has(wordIndex) ? (
              <View style={styles.wordNoteBadge}>
                <Text style={styles.wordNoteBadgeText}>1</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onAyahPress}>
        <Text>{translation}</Text>
      </Pressable>
      {ayahNoteCount > 0 ? (
        <View style={styles.ayahBadge}>
          <Text style={styles.ayahBadgeText}>{ayahNoteCount} notes</Text>
        </View>
      ) : null}
    </View>
  );
}

function ReflectionPanel({ selectedAyah, onPromptPress, onOpenComposer }: {
  selectedAyah: number;
  onPromptPress: (prompt: string) => void;
  onOpenComposer: () => void;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Ayah {selectedAyah} — My Reflection</Text>
      <View style={styles.promptsRow}>
        {REFLECTION_PROMPTS.map((prompt, index) => (
          <Pressable key={prompt} style={styles.promptChip} onPress={() => onPromptPress(prompt)} testID={`prompt-chip-${index}`}>
            <Text style={styles.promptText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onOpenComposer}>
        <Text style={styles.buttonText}>Add Reflection Note</Text>
      </Pressable>
    </View>
  );
}

function NoteRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.noteRow}>{children}</View>;
}

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const surahNumber = Number(id || 1);
  const query = useQuery({
    queryKey: ['surah', surahNumber],
    queryFn: () => fetchSurahDetail(surahNumber),
  });

  const [selection, setSelection] = useState<Selection>({ type: 'surah' });
  const [composerVisible, setComposerVisible] = useState(false);
  const [composerInitialContent, setComposerInitialContent] = useState('');
  const [composerInitialTags, setComposerInitialTags] = useState<NoteTag[] | undefined>(undefined);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const { notes, notesForAyah, notesForSurah, addNote, updateNote, deleteNote } = useNotes();

  const chapterNotes = useMemo(() => notesForSurah(surahNumber), [notesForSurah, surahNumber]);
  const selectedNotes = useMemo(() => {
    if (selection.type === 'surah') {
      return chapterNotes;
    }

    if (selection.type === 'ayah') {
      return notesForAyah(surahNumber, selection.ayahNumber);
    }

    return notes.filter((note) => (
      note.referenceType === 'word'
      && note.surahNumber === surahNumber
      && note.ayahNumber === selection.ayahNumber
      && note.wordIndex === selection.wordIndex
    ));
  }, [chapterNotes, notes, notesForAyah, selection, surahNumber]);

  const ayahNoteCounts = useMemo(() => {
    const counts = new Map<number, number>();
    notes.forEach((note) => {
      if (note.referenceType === 'ayah' && note.surahNumber === surahNumber && note.ayahNumber) {
        counts.set(note.ayahNumber, (counts.get(note.ayahNumber) ?? 0) + 1);
      }
    });
    return counts;
  }, [notes, surahNumber]);

  const wordNoteMap = useMemo(() => {
    const map = new Map<number, Set<number>>();
    notes.forEach((note) => {
      if (note.referenceType === 'word' && note.surahNumber === surahNumber && note.ayahNumber && typeof note.wordIndex === 'number') {
        const ayahSet = map.get(note.ayahNumber) ?? new Set<number>();
        ayahSet.add(note.wordIndex);
        map.set(note.ayahNumber, ayahSet);
      }
    });
    return map;
  }, [notes, surahNumber]);

  const openComposer = () => {
    setEditingNoteId(null);
    setComposerInitialContent('');
    setComposerInitialTags(undefined);
    setComposerVisible(true);
  };

  const handlePromptPress = (prompt: string) => {
    const promptContent = `${prompt}\n\n`;
    setEditingNoteId(null);
    setComposerInitialTags(undefined);
    setComposerInitialContent((current) => (current ? `${current}\n\n${promptContent}` : promptContent));
    setComposerVisible(true);
  };

  const handleEditNote = (note: UserNote) => {
    setEditingNoteId(note.id);
    setComposerInitialContent(note.content);
    setComposerInitialTags(note.tags);
    setComposerVisible(true);
  };

  const handleSaveNote = (content: string, tags: string[]) => {
    if (editingNoteId) {
      void updateNote(editingNoteId, { content, tags: tags as NoteTag[] });
      setEditingNoteId(null);
    } else {
      const referencePayload = selection.type === 'surah'
        ? { referenceType: 'surah' as const, surahNumber }
        : selection.type === 'ayah'
          ? { referenceType: 'ayah' as const, surahNumber, ayahNumber: selection.ayahNumber }
          : {
            referenceType: 'word' as const,
            surahNumber,
            ayahNumber: selection.ayahNumber,
            wordIndex: selection.wordIndex,
          };

      void addNote({
        ...referencePayload,
        content,
        tags: tags as NoteTag[],
      });
    }

    setComposerInitialContent('');
    setComposerInitialTags(undefined);
    setComposerVisible(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{query.data?.englishName || 'Surah'}</Text>

      <View style={styles.panel}>
        <Text style={styles.title}>Chapter Notes</Text>
        <Pressable
          onPress={() => {
            setSelection({ type: 'surah' });
            openComposer();
          }}
        >
          <Text style={styles.buttonText}>+ Add chapter note</Text>
        </Pressable>
        {chapterNotes.map((note) => (
          <NoteRow key={note.id}>
            <NoteCard note={note} onDelete={deleteNote} onEdit={handleEditNote} />
          </NoteRow>
        ))}
      </View>

      {query.data?.verses.map((verse) => (
        <AyahCard
          key={verse.numberInSurah}
          arabic={verse.arabic}
          translation={verse.translation}
          onAyahPress={() => setSelection({ type: 'ayah', ayahNumber: verse.numberInSurah })}
          onWordPress={(wordIndex, wordText) => {
            setSelection({ type: 'word', ayahNumber: verse.numberInSurah, wordIndex, wordText });
            openComposer();
          }}
          wordHasNotes={wordNoteMap.get(verse.numberInSurah) ?? new Set<number>()}
          ayahNoteCount={ayahNoteCounts.get(verse.numberInSurah) ?? 0}
        />
      ))}

      {selection.type === 'ayah' ? (
        <>
          <ReflectionPanel selectedAyah={selection.ayahNumber} onPromptPress={handlePromptPress} onOpenComposer={openComposer} />

          {selectedNotes.map((note) => (
            <NoteRow key={note.id}>
              <NoteCard note={note} onDelete={deleteNote} onEdit={handleEditNote} />
            </NoteRow>
          ))}
        </>
      ) : null}

      <NoteComposer
        visible={composerVisible}
        referenceType={selection.type}
        surahNumber={surahNumber}
        ayahNumber={selection.type === 'surah' ? undefined : selection.ayahNumber}
        wordIndex={selection.type === 'word' ? selection.wordIndex : undefined}
        wordText={selection.type === 'word' ? selection.wordText : undefined}
        surahName={query.data?.englishName || 'Surah'}
        initialContent={composerInitialContent}
        initialTags={composerInitialTags}
        onClose={() => setComposerVisible(false)}
        onSave={handleSaveNote}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
  },
  ayahCard: {
    backgroundColor: palette.white,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  arabic: {
    fontSize: 22,
    textAlign: 'right',
  },
  arabicWordsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    alignItems: 'center',
    position: 'relative',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  wordChipAnnotated: {
    backgroundColor: palette.sand,
    borderColor: palette.forest,
  },
  arabicWord: {
    fontSize: 22,
    color: palette.ink,
  },
  wordNoteBadge: {
    position: 'absolute',
    right: 2,
    bottom: 1,
  },
  wordNoteBadgeText: {
    color: palette.rose,
    fontSize: 10,
    fontWeight: '700',
  },
  ayahBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.sand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ayahBadgeText: {
    color: palette.forest,
    fontWeight: '600',
    fontSize: 12,
  },
  panel: {
    backgroundColor: palette.mist,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  title: {
    fontWeight: '700',
  },
  promptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptChip: {
    borderRadius: 999,
    backgroundColor: palette.sand,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promptText: {
    color: palette.forest,
    fontWeight: '600',
  },
  buttonText: {
    backgroundColor: palette.forest,
    color: palette.white,
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'center',
  },
  noteRow: {
    borderRadius: 8,
  },
});
