import { BookOpen, Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { palette } from '@/constants/colors';
import { fetchAvailableTafsirs } from '@/data/api/tafsir';
import { useQuranSettingsStore } from '@/stores/quran-settings-store';

interface TafsirMeta {
  id: number;
  name: string;
  language: string;
  author: string;
}

interface TafsirPickerProps {
  visible: boolean;
  onClose: () => void;
}

export function TafsirPicker({ visible, onClose }: TafsirPickerProps) {
  const { tafsirId, showTafsir, setTafsirId, setShowTafsir } = useQuranSettingsStore();
  const [tafseers, setTafseers] = useState<TafsirMeta[]>([]);

  useEffect(() => {
    if (!visible || tafseers.length > 0) {
      return;
    }

    void fetchAvailableTafsirs()
      .then((results) => setTafseers(results.filter((entry) => entry.language === 'en')))
      .catch(() => setTafseers([]));
  }, [tafseers.length, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <BookOpen color={palette.forest} size={18} />
          <Text style={styles.sheetTitle}>Tafsir</Text>
        </View>

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Show Tafsir in verses</Text>
            <Text style={styles.toggleSub}>Display commentary alongside each ayah</Text>
          </View>
          <Switch
            value={showTafsir}
            onValueChange={setShowTafsir}
            trackColor={{ true: palette.forest }}
            thumbColor={palette.white}
          />
        </View>

        <View style={styles.divider} />

        {tafseers.map((tafsir) => (
          <Pressable
            key={tafsir.id}
            style={[styles.option, tafsirId === tafsir.id && styles.optionSelected]}
            onPress={() => setTafsirId(tafsir.id)}
          >
            <View style={styles.optionText}>
              <Text style={[styles.optionLabel, tafsirId === tafsir.id && styles.optionLabelSelected]}>
                {tafsir.name}
              </Text>
              <Text style={styles.optionAuthor}>{tafsir.author}</Text>
            </View>
            {tafsirId === tafsir.id && <Check color={palette.forest} size={18} />}
          </Pressable>
        ))}
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
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 12,
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
  optionAuthor: {
    fontSize: 12,
    color: palette.smoke,
  },
});
