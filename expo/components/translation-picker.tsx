import { Check, Languages } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { palette } from '@/constants/colors';
import { TRANSLATIONS, useQuranSettingsStore } from '@/stores/quran-settings-store';
import type { TranslationId } from '@/stores/quran-settings-store';

interface TranslationPickerProps {
  visible: boolean;
  onClose: () => void;
}

export function TranslationPicker({ visible, onClose }: TranslationPickerProps) {
  const { translationId, showTransliteration, setTranslation, setShowTransliteration } =
    useQuranSettingsStore();

  const handleSelect = (id: TranslationId) => {
    setTranslation(id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Languages color={palette.forest} size={18} />
          <Text style={styles.sheetTitle}>Translation</Text>
        </View>

        {TRANSLATIONS.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.option, translationId === t.id && styles.optionSelected]}
            onPress={() => handleSelect(t.id)}
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

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Transliteration</Text>
            <Text style={styles.toggleSub}>Show romanized pronunciation</Text>
          </View>
          <Switch
            value={showTransliteration}
            onValueChange={setShowTransliteration}
            trackColor={{ true: palette.forest }}
            thumbColor={palette.white}
          />
        </View>
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
    backgroundColor: palette.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 4,
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
    gap: 8,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.ink,
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
  optionAuthor: {
    fontSize: 12,
    color: palette.smoke,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.ink,
  },
  toggleSub: {
    fontSize: 12,
    color: palette.smoke,
    marginTop: 2,
  },
});
