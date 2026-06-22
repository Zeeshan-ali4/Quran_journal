import { useLocalSearchParams } from 'expo-router';
import { Bookmark, MessageSquarePlus, Play, SlidersHorizontal } from 'lucide-react-native';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { NoteCard } from '@/components/note-card';
import { NoteComposer } from '@/components/note-composer';
import { ReadingSettingsSheet } from '@//components/reading-settings-sheet';
import { palette } from '@/constants/colors';
import { REFLECTION_PROMPTS } from '@/constants/reflection-prompts';
import { fetchSurahDetail } from '@/data/api/quran';
import { RECITERS } from '@/data/api/audio';
import { audioDownloadQueue } from '@/data/api/audio-download-queue';
import { useAudioStore } from '@/stores/audio-store';
import { fetchSurahTafsir, TafsirError } from '@/data/api/tafsir';
import { fetchSurahWordGlosses } from '@//data/api/word-by-word';
import { useNotesStore } from '@/stores/notes-store';
import { TRANSLATIONS, useQuranSettingsStore } from '@/stores/quran-settings-store';
import { useBookmarkStore } from '@/stores/bookmark-store';
import type { NoteTag, UserNote, Verse } from '@/types/quran';

type Selection =
  | { type: 'surah' }
  | { type: 'ayah'; ayahNumber: number }
  | { type: 'word'; ayahNumber: number; wordIndex: number; wordText: string };

type SurahListItem =
  | { type: 'chapterNotes' }
  | { type: 'verse'; verse: Verse }
  | { type: 'ayahNotes' };

const QURANIC_PAUSE_MARK_TOKEN_REGEX = /^[\u06D6-\u06ED]+$/;

function getArabicWordTokens(arabic: string) {
  return arabic.split(/\s+/).filter((token) => token && !QURANIC_PAUSE_MARK_TOKEN_REGEX.test(token));
}

const AyahCard = memo(function AyahCard({
  ayahNumber,
  arabic,
  translation,
  transliteration,
  tafsir,
  tafsirSourceLabel,
  glosses,
  wordByWord,
  onAyahPress,
  onWordPress,
  onBookmarkPress,
  isBookmarked,
  wordHasNotes,
  isActive,
}: {
  ayahNumber: number;
  arabic: string;
  translation: string;
  transliteration?: string;
  tafsir?: string;
  tafsirSourceLabel: string;
  glosses?: string[];
  wordByWord: boolean;
  onAyahPress: () => void;
  onWordPress: (wordIndex: number, wordText: string) => void;
  onBookmarkPress: () => void;
  isBookmarked: boolean;
  wordHasNotes: Set<number>;
  isActive: boolean;
}) {
  const words = useMemo(() => getArabicWordTokens(arabic), [arabic]);

  return (
    <View style={[styles.ayahCard, isActive ? styles.ayahCardActive : null, isBookmarked ? styles.ayahCardBookmarked : null]}>
      <View style={styles.ayahNumberBadge}>
        <Text style={styles.ayahNumberText}>{ayahNumber}</Text>
      </View>

      <Text style={styles.arabicVerse}>{arabic}</Text>

      <View style={styles.ayahActionsRow}>
        <Pressable style={styles.ayahNoteButton} onPress={onAyahPress}>
          <MessageSquarePlus color={palette.ink} size={14} />
          <Text style={styles.ayahNoteButtonText}>Ayah note</Text>
        </Pressable>
        <Pressable style={styles.ayahBookmarkButton} onPress={onBookmarkPress}>
          <Bookmark
            color={isBookmarked ? palette.gold : palette.smoke}
            fill={isBookmarked ? palette.gold : 'transparent'}
            size={15}
          />
        </Pressable>
      </View>

      {transliteration ? <Text style={styles.transliterationText}>{transliteration}</Text> : null}
      <Text style={styles.translationText}>{translation}</Text>

      {wordByWord ? (
        <View style={styles.wordChipsRow}>
          {words.map((word, wordIndex) => {
            const hasNote = wordHasNotes.has(wordIndex);
            const gloss = glosses?.[wordIndex];
            return (
              <Pressable
                key={`${word}-${wordIndex}`}
                style={[styles.wordGlossChip, hasNote ? styles.wordChipActive : null]}
                onPress={() => onWordPress(wordIndex, word)}
              >
                <Text style={[styles.wordChipArabic, hasNote ? styles.wordChipTextActive : null]}>{word}</Text>
                {gloss ? <Text style={styles.wordGlossText}>{gloss}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.wordChipsRow}>
          {words.map((word, wordIndex) => {
            const hasNote = wordHasNotes.has(wordIndex);
            return (
              <Pressable
                key={`${word}-${wordIndex}`}
                style={[styles.wordChip, hasNote ? styles.wordChipActive : null]}
                onPress={() => onWordPress(wordIndex, word)}
              >
                <Text style={[styles.wordChipText, hasNote ? styles.wordChipTextActive : null]}>{word}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {tafsir ? (
        <View style={styles.tafsirContainer}>
          <View style={styles.tafsirLabelRow}>
            <View style={styles.tafsirLabelLeft}>
              <View style={styles.tafsirDot} />
              <Text style={styles.tafsirLabel}>TAFSIR · {tafsirSourceLabel}</Text>
            </View>
          </View>
          <Text style={styles.tafsirBody}>{tafsir}</Text>
        </View>
      ) : null}
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
  const { id, ayah } = useLocalSearchParams<{ id: string; ayah?: string }>();
  const surahNumber = Number(id || 1);
  const { translationId, showTransliteration, showTafsir, tafsirSlug, wordByWord } = useQuranSettingsStore();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const listRef = useRef<FlatList<SurahListItem>>(null);
  const { currentSurah, currentAyah, isPlaying, play, resume } = useAudioStore();
  const { reciterId } = useAudioStore();

  const query = useQuery({
    queryKey: ['surah', surahNumber, translationId, showTransliteration],
    queryFn: () => fetchSurahDetail(surahNumber, translationId, showTransliteration),
  });

  const activeTranslationLabel = TRANSLATIONS.find((t) => t.id === translationId)?.label ?? 'Translation';
  const activeReciterLabel = RECITERS.find((r) => r.id === reciterId)?.label ?? 'Reciter';

  const { data: tafsirTexts, error: tafsirError, refetch: refetchTafsir } = useQuery({
    queryKey: ['tafsir', surahNumber, tafsirSlug],
    queryFn: () => fetchSurahTafsir(tafsirSlug, surahNumber, query.data?.verses.length ?? 0),
    enabled: showTafsir && (query.data?.verses.length ?? 0) > 0,
    staleTime: Infinity,
    retry: 2,
  });

  useEffect(() => {
    if (tafsirError) {
      console.error('Failed to fetch tafsir', tafsirError);
    }
  }, [tafsirError]);

  const tafsirStatusMessage = tafsirTexts?.status === 'empty'
    ? tafsirTexts.reason === 'source_missing'
      ? 'This tafsir source could not be loaded. Try another tafsir.'
      : 'This tafsir source does not include this surah.'
    : tafsirError instanceof TafsirError
      ? tafsirError.kind === 'offline'
        ? 'This tafsir source does not include this surah.'
        : 'This tafsir source does not include this surah.'
      : tafsirError
        ? 'This tafsir source does not include this surah.'
        : '';
  const shouldShowTafsirRetry = tafsirError instanceof TafsirError;
  const shouldShowTafsirStatus = showTafsir && (tafsirTexts?.status === 'empty' || Boolean(tafsirError));

  const { data: wordGlosses } = useQuery({
    queryKey: ['word-glosses', surahNumber],
    queryFn: () => fetchSurahWordGlosses(surahNumber),
    enabled: wordByWord,
    staleTime: Infinity,
  });

  const [selection, setSelection] = useState<Selection>({ type: 'surah' });
  const [composerVisible, setComposerVisible] = useState(false);
  const [composerInitialContent, setComposerInitialContent] = useState('');
  const [composerInitialTags, setComposerInitialTags] = useState<NoteTag[] | undefined>(undefined);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const { notes, notesForAyah, notesForSurah, notesForWord, addNote, updateNote, deleteNote } = useNotesStore();
  const addBookmark = useBookmarkStore((state) => state.addBookmark);
  const removeBookmark = useBookmarkStore((state) => state.removeBookmark);
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const updateProgress = useBookmarkStore((state) => state.updateProgress);

  useEffect(() => {
    const selectedAyah = Number(ayah);
    if (Number.isFinite(selectedAyah) && selectedAyah > 0) {
      setSelection({ type: 'ayah', ayahNumber: selectedAyah });
    } else {
      setSelection({ type: 'surah' });
    }
  }, [ayah, surahNumber]);

  const chapterNotes = useMemo(() => notesForSurah(surahNumber), [notesForSurah, surahNumber]);
  const selectedNotes = useMemo(() => {
    if (selection.type === 'surah') {
      return chapterNotes;
    }

    if (selection.type === 'ayah') {
      return notesForAyah(surahNumber, selection.ayahNumber);
    }

    return notesForWord(surahNumber, selection.ayahNumber, selection.wordIndex);
  }, [chapterNotes, notesForAyah, notesForWord, selection, surahNumber]);

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
    const versesWithTafsir = verses.map((verse, index) => ({
      ...verse,
      tafsir: showTafsir && tafsirTexts?.status === 'ready' ? tafsirTexts.data[index] : undefined,
    }));

    const items: SurahListItem[] = [{ type: 'chapterNotes' }];
    versesWithTafsir.forEach((verse) => {
      items.push({ type: 'verse', verse });
    });
    items.push({ type: 'ayahNotes' });
    return items;
  }, [query.data?.verses, showTafsir, tafsirTexts]);

  useEffect(() => {
    if (currentSurah !== surahNumber || !currentAyah) {
      return;
    }

    try {
      listRef.current?.scrollToIndex({ index: currentAyah, animated: true, viewPosition: 0.2 });
    } catch {}
  }, [currentAyah, currentSurah, surahNumber]);

  useEffect(() => {
    const target = Number(ayah);
    if (!Number.isFinite(target) || target <= 0 || !query.data) return;
    try {
      listRef.current?.scrollToIndex({ index: target, animated: true, viewPosition: 0.2 });
    } catch {}
  }, [ayah, query.data]);

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
        ref={listRef}
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={listData}
        keyExtractor={(item) => (item.type === 'verse' ? `verse-${item.verse.numberInSurah}` : item.type)}
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={30}
        removeClippedSubviews
        onScrollToIndexFailed={({ index }) => {
          listRef.current?.scrollToOffset({
            offset: index * 200,
            animated: true,
          });
        }}
        renderItem={({ item }) => {
          if (item.type === 'chapterNotes') {
            return (
              <>
                <View style={styles.surahHeader}>
                  <Text style={styles.headingArabic}>{query.data?.name}</Text>
                  <Text style={styles.heading}>
                    {query.data?.englishName || 'Surah'}
                    {query.data?.englishNameTranslation ? ` · ${query.data.englishNameTranslation}` : ''}
                  </Text>
                  <Text style={styles.headingMeta}>
                    {query.data ? `${query.data.numberOfAyahs} verses · ${query.data.revelationType}` : ''}
                  </Text>
                </View>

                <View style={styles.controlBar}>
                  <Pressable
                    style={styles.playButton}
                    onPress={() => {
                      if (currentSurah === surahNumber && !isPlaying) {
                        resume();
                        return;
                      }

                      audioDownloadQueue.prioritize({ reciterId, surah: surahNumber, ayah: 1, totalAyahs: query.data?.numberOfAyahs ?? 0 });
                      play(surahNumber, 1);
                    }}
                  >
                    <Play color={palette.white} size={16} fill={palette.white} />
                  </Pressable>
                  <Pressable style={styles.controlPill} onPress={() => setSettingsVisible(true)}>
                    <Text style={styles.controlPillText}>{activeReciterLabel.split(' ')[0]}</Text>
                  </Pressable>
                  <Pressable style={styles.controlPill} onPress={() => setSettingsVisible(true)}>
                    <Text style={styles.controlPillText}>{activeTranslationLabel.split(' ')[0]}</Text>
                  </Pressable>
                  <Pressable style={styles.settingsButton} onPress={() => setSettingsVisible(true)}>
                    <SlidersHorizontal color={palette.forest} size={17} />
                  </Pressable>
                </View>

                <Pressable
                  style={styles.addChapterNoteButton}
                  onPress={() => {
                    setSelection({ type: 'surah' });
                    openComposer();
                  }}
                >
                  <Text style={styles.addChapterNoteText}>+ Add chapter note</Text>
                </Pressable>

                {surahNumber !== 9 ? <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text> : null}

                {shouldShowTafsirStatus ? (
                  <View style={styles.tafsirErrorCard}>
                    <Text style={styles.tafsirErrorTitle}>Tafsir could not load</Text>
                    <Text style={styles.tafsirErrorBody}>{tafsirStatusMessage}</Text>
                    {shouldShowTafsirRetry ? (
                      <Pressable style={styles.tafsirRetryButton} onPress={() => void refetchTafsir()}>
                        <Text style={styles.tafsirRetryText}>Retry tafsir</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                {chapterNotes.length > 0 ? (
                  <View style={styles.panel}>
                    <Text style={styles.title}>Chapter Notes</Text>
                    {chapterNotes.map((note) => (
                      <NoteRow key={note.id}>
                        <NoteCard note={note} onDelete={deleteNote} onEdit={handleEditNote} />
                      </NoteRow>
                    ))}
                  </View>
                ) : null}
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
              transliteration={item.verse.transliteration}
              tafsir={item.verse.tafsir}
              tafsirSourceLabel="IBN KATHĪR"
              glosses={wordGlosses?.[item.verse.numberInSurah]}
              wordByWord={wordByWord}
              onAyahPress={() => {
                const ayahNumber = item.verse.numberInSurah;
                updateProgress(surahNumber, ayahNumber);
                audioDownloadQueue.prioritize({ reciterId, surah: surahNumber, ayah: ayahNumber, totalAyahs: query.data?.numberOfAyahs ?? 0 });
                setSelection({ type: 'ayah', ayahNumber });
                openComposer();
              }}
              onWordPress={(wordIndex, wordText) => {
                setSelection({ type: 'word', ayahNumber: item.verse.numberInSurah, wordIndex, wordText });
                openComposer();
              }}
              isBookmarked={bookmarks.some(
                (b) => b.surahNumber === surahNumber && b.ayahNumber === item.verse.numberInSurah
              )}
              onBookmarkPress={() => {
                const ayahNumber = item.verse.numberInSurah;
                const alreadyBookmarked = bookmarks.some(
                  (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
                );
                updateProgress(surahNumber, ayahNumber);
                if (alreadyBookmarked) {
                  removeBookmark(surahNumber, ayahNumber);
                  return;
                }

                addBookmark(surahNumber, query.data?.englishName ?? '', ayahNumber);
              }}
              wordHasNotes={wordNoteMap.get(item.verse.numberInSurah) ?? new Set<number>()}
              isActive={currentSurah === surahNumber && currentAyah === item.verse.numberInSurah}
            />
          );
        }}
      />

      <ReadingSettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

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
    paddingBottom: 170,
  },
  surahHeader: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  headingArabic: {
    fontSize: 30,
    color: palette.ink,
    marginBottom: 2,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    textAlign: 'center',
  },
  headingMeta: {
    fontSize: 13,
    color: palette.smoke,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.white,
    borderRadius: 999,
    padding: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cream,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  controlPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.forest,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cream,
  },
  addChapterNoteButton: {
    borderWidth: 1.5,
    borderColor: palette.border,
    borderStyle: 'dashed',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  addChapterNoteText: {
    color: palette.smoke,
    fontWeight: '600',
    fontSize: 14,
  },
  bismillah: {
    textAlign: 'center',
    fontSize: 26,
    color: palette.olive,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  transliterationText: {
    fontSize: 13,
    color: palette.smoke,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  ayahCard: {
    backgroundColor: palette.white,
    padding: 16,
    paddingTop: 22,
    borderRadius: 16,
    gap: 12,
  },
  ayahCardActive: {
    borderLeftWidth: 3,
    borderLeftColor: palette.gold,
    backgroundColor: 'rgba(196, 154, 83, 0.15)',
  },
  ayahCardBookmarked: {
    backgroundColor: 'rgba(196, 154, 83, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: palette.gold,
  },
  ayahNumberBadge: {
    position: 'absolute',
    top: -12,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.badgeBg,
    borderWidth: 1,
    borderColor: palette.badgeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  ayahNumberText: {
    color: palette.ink,
    fontWeight: '700',
    fontSize: 12,
  },
  ayahActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  ayahBookmarkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: palette.mist,
    borderWidth: 1,
    borderColor: palette.border,
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

  tafsirErrorCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  tafsirErrorTitle: {
    color: '#9A3412',
    fontWeight: '700',
    fontSize: 14,
  },
  tafsirErrorBody: {
    color: '#9A3412',
    fontSize: 12,
    lineHeight: 18,
  },
  tafsirRetryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#9A3412',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tafsirRetryText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 12,
  },
  tafsirContainer: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 10,
    gap: 8,
  },
  tafsirLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tafsirLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tafsirDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.olive,
  },
  tafsirLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: palette.smoke,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  tafsirBody: {
    fontSize: 13,
    color: palette.smoke,
    lineHeight: 20,
    backgroundColor: palette.paper,
    padding: 10,
    borderRadius: 8,
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
  wordGlossChip: {
    alignItems: 'center',
    gap: 2,
    backgroundColor: palette.chipTan,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 44,
  },
  wordChipActive: {
    borderColor: palette.forest,
  },
  wordChipText: {
    fontSize: 15,
    color: palette.smoke,
    fontWeight: '500',
  },
  wordChipArabic: {
    fontSize: 16,
    color: palette.ink,
    fontWeight: '500',
  },
  wordGlossText: {
    fontSize: 10,
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