import { useLocalSearchParams } from 'expo-router';
import { MessageSquarePlus, Type } from 'lucide-react-native';
import React, { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { NoteCard } from '@/components/note-card';
import { NoteComposer } from '@/components/note-composer';
import { palette } from '@/constants/colors';
import { REFLECTION_PROMPTS } from '@/constants/reflection-prompts';
import { fetchSurahDetail } from '@/data/api/quran';
import { useNotes } from '@/providers/notes-provider';
import type { NoteTag, UserNote, Verse } from '@/types/quran';

type Selection =
  | { type: 'surah' }
  | { type: 'ayah'; ayahNumber: number }
  | { type: 'word'; ayahNumber: number; wordIndex: number; wordText: string };

type SurahListItem =
  | { type: 'chapterNotes' }
  | { type: 'verse'; verse: Verse }
  | { type: 'ayahNotes' };

const AyahCard = memo(function AyahCard({
  ayahNumber,
  arabic,
  translation,
  onAyahPress,
  onWordPress,
  wordHasNotes,
}: {
  ayahNumber: number;
  arabic: string;
  translation: string;
  onAyahPress: () => void;
  onWordPress: (wordIndex: number, wordText: string) => void;
  wordHasNotes: Set<number>;
}) {
  const words = useMemo(() => arabic.split(' ').filter(Boolean), [arabic]);

  return (
    <View style={styles.ayahCard}>
      <View style={styles.ayahHeader}>
        <View style={styles.ayahNumberBadge}>
          <Text style={styles.ayahNumberText}>{ayahNumber}</Text>
        </View>
        <Pressable style={styles.ayahNoteButton} onPress={onAyahPress}>
          <MessageSquarePlus color={palette.ink} size={15} />
          <Text style={styles.ayahNoteButtonText}>Ayah note</Text>
        </Pressable>
      </View>

      <Text style={styles.arabicVerse}>{arabic}</Text>
      <Text style={styles.translationText}>{translation}</Text>

      <View style={styles.wordChipsRow}>
        {words.map((word, wordIndex) => {
          const hasNote = wordHasNotes.has(wordIndex);
          return (
            <Pressable
              key={`${word}-${wordIndex}`}
              style={[styles.wordChip, hasNote ? styles.wordChipActive : null]}
              onPress={() => onWordPress(wordIndex, word)}
            >
              <Type color={hasNote ? palette.forest : palette.smoke} size={12} />
              <Text style={[styles.wordChipText, hasNote ? styles.wordChipTextActive : null]}>{word}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

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

  const listData = useMemo<SurahListItem[]>(() => {
    const verses = query.data?.verses ?? [];
    const items: SurahListItem[] = [{ type: 'chapterNotes' }];
    verses.forEach((verse) => {
      items.push({ type: 'verse', verse });
    });
    items.push({ type: 'ayahNotes' });
    return items;
  }, [query.data?.verses]);

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
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={listData}
        keyExtractor={(item) => (item.type === 'verse' ? `verse-${item.verse.numberInSurah}` : item.type)}
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={30}
        removeClippedSubviews
        renderItem={({ item }) => {
          if (item.type === 'chapterNotes') {
            return (
              <>
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
              </>
            );
          }

          if (item.type === 'ayahNotes') {
            if (selection.type !== 'ayah') {
              return null;
            }

            return (
              <>
                <ReflectionPanel selectedAyah={selection.ayahNumber} onPromptPress={handlePromptPress} onOpenComposer={openComposer} />
                {selectedNotes.map((note) => (
                  <NoteRow key={note.id}>
                    <NoteCard note={note} onDelete={deleteNote} onEdit={handleEditNote} />
                  </NoteRow>
                ))}
              </>
            );
          }

          return (
            <AyahCard
              ayahNumber={item.verse.numberInSurah}
              arabic={item.verse.arabic}
              translation={item.verse.translation}
              onAyahPress={() => setSelection({ type: 'ayah', ayahNumber: item.verse.numberInSurah })}
              onWordPress={(wordIndex, wordText) => {
                setSelection({ type: 'word', ayahNumber: item.verse.numberInSurah, wordIndex, wordText });
                openComposer();
              }}
              wordHasNotes={wordNoteMap.get(item.verse.numberInSurah) ?? new Set<number>()}
            />
          );
        }}
      />

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
    </>
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
    paddingBottom: 32,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
  },
  ayahCard: {
    backgroundColor: palette.white,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  ayahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ayahNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumberText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 14,
  },
  ayahNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.sand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ayahNoteButtonText: {
    color: palette.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  arabicVerse: {
    fontSize: 26,
    textAlign: 'right',
    color: palette.ink,
    lineHeight: 42,
  },
  translationText: {
    fontSize: 15,
    color: palette.smoke,
    lineHeight: 22,
  },
  wordChipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.sand,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  wordChipActive: {
    backgroundColor: palette.sand,
    borderColor: palette.forest,
  },
  wordChipText: {
    fontSize: 15,
    color: palette.smoke,
    fontWeight: '500',
  },
  wordChipTextActive: {
    color: palette.forest,
    fontWeight: '700',
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
