import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { Slot } from 'expo-router';
import { useThemeStore } from '@/hooks/useThemeStore';
import WebHeader from '@/components/web/WebHeader';
import WebSidebar from '@/components/web/WebSidebar';

export default function WebLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { colors } = useThemeStore();

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, display: 'flex', flexDirection: 'column' }}>
      <WebHeader
        title="Trucksarthi"
        showNotifications
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <View style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
        <WebSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <View style={{ flex: 1, overflow: 'scroll', display: 'flex' }}>
          <Slot />
        </View>
      </View>
    </View>
  );
}
