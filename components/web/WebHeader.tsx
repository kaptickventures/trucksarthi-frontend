import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useThemeStore } from '@/hooks/useThemeStore';
import { useRouter } from 'expo-router';
import { Bell, LogOut, Settings } from 'lucide-react-native';

interface WebHeaderProps {
  title?: string;
  showNotifications?: boolean;
  onMenuClick?: () => void;
}

const WebHeader: React.FC<WebHeaderProps> = ({
  title = 'Trucksarthi',
  showNotifications = true,
  onMenuClick
}) => {
  const { logout, user } = useAuth();
  const { colors } = useThemeStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    // Web: redirect to QR screen, not mobile auth
    router.replace('/(stack)/desktop-qr');
  };

  if (Platform.OS !== 'web') return null;

  return (
    <View
      className="web"
      style={{
        height: 70,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
      }}
    >
      {/* Left section */}
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {onMenuClick && (
          <TouchableOpacity
            onPress={onMenuClick}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: colors.card,
            }}
          >
            <Text style={{ color: colors.foreground }}>☰</Text>
          </TouchableOpacity>
        )}
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700' }}>
          {title}
        </Text>
      </View>

      {/* Right section */}
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 15 }}>
        {showNotifications && (
          <TouchableOpacity
            onPress={() => router.push('/(stack)/notifications')}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: colors.card,
            }}
          >
            <Bell size={20} color={colors.foreground} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.push('/(stack)/settings')}
          style={{
            padding: 8,
            borderRadius: 6,
            backgroundColor: colors.card,
          }}
        >
          <Settings size={20} color={colors.foreground} />
        </TouchableOpacity>

        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View>
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 14 }}>
              {user?.name || 'User'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {user?.user_type || 'Fleet Owner'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: '#ff4444',
            }}
          >
            <LogOut size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default WebHeader;
