import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/colors';

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    console.log('[ErrorBoundary] App crashed', { error });
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Something went wrong</Text>
            <Text style={styles.title}>The page hit a snag.</Text>
            <Text style={styles.body}>
              Please try again. Your notes are still saved on this device.
            </Text>
            <Pressable onPress={this.handleReset} style={styles.button} testID="retry-app-button">
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.paper,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: palette.white,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  eyebrow: {
    color: palette.rose,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    color: palette.smoke,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: palette.forest,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '700',
  },
});