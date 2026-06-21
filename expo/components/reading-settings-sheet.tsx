import { Check, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { palette } from '@/constants/colors';
import { fetchAvailableTafsirs, type TafsirMeta } from '@/data/api/tafsir';
import { RECITERS } from '@/data/api/audio';
import { useAudioStore } from '@/stores/audio-store';
import { TRANSLATIONS, useQuranSettingsStore } from '@/stores/quran-settings-store';
import type { TranslationId } from '@/stores/quran-settings-store';

interface ReadingSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

type ExpandedSection = 'reciter' | 'translation' | 'tafsir' | null;

function DropdownRow({
  label,
  value,
  expanded,
  onPress,
}: {
  label: string;
  value: string;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.dropdownRow} onPress={onPress}>
      <Text style={styles.dropdownValue}>{value}</Text>
      {expanded ? (
        <ChevronUp color={palette.smoke} size={18} />
      ) : (
        <ChevronDown color={palette.smoke} size={18} />
      )}
    </Pressable>
  );
}

export function ReadingSettingsSheet({ visible, onClose }: ReadingSettingsSheetProps) {
  const {
    translationId,
    showTransliteration,
    tafsirSlug,
    wordByWord,
    setTranslation,
    setShowTransliteration,
    setTafsirSlug,
    setWordByWord,
  } = useQuranSettingsStore();
  const { reciterId, setReciter, stop } = useAudioStore();

  const [expanded, setExpanded] = useState<ExpandedSection>(null);
  const [tafseers, setTafseers] = useState<TafsirMeta[]>([]);

  useEffect(() => {
    if (!visible || tafseers.length > 0) {
      return;
    }

    void fetchAvailableTafsirs()
      .then((results) => setTafseers(results.filter((entry) => entry.language === 'en')))
      .catch(() => setTafseers([]));
  }, [tafseers.length, visible]);

  useEffect(() => {
    if (!visible) {
      setExpanded(null);
    }
  }, [visible]);

  const toggleSection = (section: ExpandedSection) => {
    setExpanded((current) => (current === section ? null : section));
  };

  const currentReciter = RECITERS.find((r) => r.id === reciterId);
  const currentTranslation = TRANSLATIONS.find((t) => t.id === translationId);
  const currentTafsir = tafseers.find((t) => t.id === tafsirSlug);

  const handleSelectReciter = (id: string) => {
    setReciter(id);
    stop();
    setExpanded(null);
  };

  const handleSelectTranslation = (id: TranslationId) => {
    setTranslation(id);
    setExpanded(null);
  };

  const handleSelectTafsir = (slug: string) => {
    setTafsirSlug(slug);
    setExpanded(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.sheetTitle}>Reading settings</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X color={palette.ink} size={20} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Text style={styles.sectionLabel}>RECITER</Text>
          <DropdownRow
            label="Reciter"
            value={currentReciter?.label ?? 'Select reciter'}
            expanded={expanded === 'reciter'}
            onPress={() => toggleSection('reciter')}
          />
          {expanded === 'reciter' ? (
            <View style={styles.optionList}>
              {RECITERS.map((reciter) => (
                <Pressable
                  key={reciter.id}
                  style={[styles.option, reciterId === reciter.id && styles.optionSelected]}
                  onPress={() => handleSelectReciter(reciter.id)}
                >
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, reciterId === reciter.id && styles.optionLabelSelected]}>
                      {reciter.label}
                    </Text>
                    <Text style={styles.optionArabic}>{reciter.arabicName}</Text>
                  </View>
                  {reciterId === reciter.id && <Check color={palette.forest} size={18} />}
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>TRANSLATION</Text>
          <DropdownRow
            label="Translation"
            value={currentTranslation?.label ?? 'Select translation'}
            expanded={expanded === 'translation'}
            onPress={() => toggleSection('translation')}
          />
          {expanded === 'translation' ? (
            <View style={styles.optionList}>
              {TRANSLATIONS.map((t) => (
                <Pressable
                  key={t.id}
                  style={[styles.option, translationId === t.id && styles.optionSelected]}
                  onPress={() => handleSelectTranslation(t.id)}
                >
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, translationId === t.id && styles.optionLabelSelected]}>
                      {t.label}
                    </Text>
                    <Text style={styles.optionAuthor}>{t.author}</Text>
                  </View>
                  {translationId === t.id && <Check color={palette.forest} size={18} />}
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>TAFSIR SOURCE</Text>
          <DropdownRow
            label="Tafsir source"
            value={currentTafsir?.name ?? 'Select tafsir'}
            expanded={expanded === 'tafsir'}
            onPress={() => toggleSection('tafsir')}
          />
          {expanded === 'tafsir' ? (
            <View style={styles.optionList}>
              {tafseers.map((tafsir) => (
                <Pressable
                  key={tafsir.id}
                  style={[styles.option, tafsirSlug === tafsir.id && styles.optionSelected]}
                  onPress={() => handleSelectTafsir(tafsir.id)}
                >
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, tafsirSlug === tafsir.id && styles.optionLabelSelected]}>
                      {tafsir.name}
                    </Text>
                    <Text style={styles.optionAuthor}>{tafsir.author}</Text>
                  </View>
                  {tafsirSlug === tafsir.id && <Check color={palette.forest} size={18} />}
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>DISPLAY</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Transliteration</Text>
            <Switch
              value={showTransliteration}
              onValueChange={setShowTransliteration}
              trackColor={{ true: palette.forest }}
              thumbColor={palette.white}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Word-by-word</Text>
            <Switch
              value={wordByWord}
              onValueChange={setWordByWord}
              trackColor={{ true: palette.forest }}
              thumbColor={palette.white}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: palette.overlay,
  },
  sheet: {
    backgroundColor: palette.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.sand,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  scroll: {
    flexGrow: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.smoke,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  dropdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.ink,
  },
  optionList: {
    backgroundColor: palette.white,
    borderRadius: 14,
    marginTop: 6,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  optionSelected: {
    backgroundColor: palette.paper,
  },
  optionText: {
    gap: 2,
    flex: 1,
    paddingRight: 8,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.ink,
  },
  optionLabelSelected: {
    color: palette.forest,
    fontWeight: '700',
  },
  optionArabic: {
    fontSize: 12,
    color: palette.smoke,
  },
  optionAuthor: {
    fontSize: 12,
    color: palette.smoke,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.ink,
  },
});