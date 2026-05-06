import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>404</Text>
          <Text style={styles.title}>This page isn’t in the mushaf.</Text>
          <Text style={styles.body}>Let’s take you back to the main reading view.</Text>
          <Link href="/" style={styles.link} testID="not-found-home-link">
            Return home
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 24,
    gap: 10,
  },
  eyebrow: {
    color: palette.rose,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  body: {
    color: palette.smoke,
    fontSize: 15,
    lineHeight: 23,
  },
  link: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 16,
    backgroundColor: palette.forest,
    color: palette.white,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontWeight: '700',
  },
});
