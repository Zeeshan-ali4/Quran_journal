import { Tabs } from 'expo-router';
import { BookOpenText, NotebookText } from 'lucide-react-native';
import React from 'react';
import Colors from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors.light.tabIconSelected, tabBarInactiveTintColor: Colors.light.tabIconDefault }}>
      <Tabs.Screen name="index" options={{ title: 'Read', tabBarIcon: ({ color, size }) => <BookOpenText color={color} size={size} /> }} />
      <Tabs.Screen name="notes" options={{ title: 'Notes', tabBarIcon: ({ color, size }) => <NotebookText color={color} size={size} /> }} />
    </Tabs>
  );
}
