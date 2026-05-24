import { Check, Headphones } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/colors';
import { RECITERS } from '@/data/api/audio';
import { useAudioStore } from '@/stores/audio-store';

interface ReciterPickerProps {
  visible: boolean;
  onClose: () => void;
}

export function ReciterPicker({ visible, onClose }: ReciterPickerProps) {
  const { reciterId, setReciter, stop } = useAudioStore();

  const handleSelect = (id: string) => {
    setReciter(id);
    stop();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Headphones color={palette.forest} size={18} />
          <Text style={styles.sheetTitle}>Reciter</Text>
        </View>

        {RECITERS.map((reciter) => (
          <Pressable
            key={reciter.id}
            style={[styles.option, reciterId === reciter.id && styles.optionSelected]}
            onPress={() => handleSelect(reciter.id)}
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
  optionArabic: {
    fontSize: 12,
    color: palette.smoke,
  },
});
