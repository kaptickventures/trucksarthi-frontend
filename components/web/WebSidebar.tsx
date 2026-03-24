import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/hooks/useThemeStore';
import {
  Home,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from 'lucide-react-native';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  route?: string;
  subItems?: { label: string; route: string }[];
  onNavigate?: (route: string) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  route,
  subItems,
  onNavigate,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useThemeStore();
  const router = useRouter();

  const handlePress = () => {
    if (subItems) {
      setExpanded(!expanded);
    } else if (route) {
      router.push(route as any);
      onNavigate?.(route);
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 6,
          marginVertical: 4,
          backgroundColor: 'transparent',
        }}
      >
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {icon}
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
            {label}
          </Text>
        </View>
        {subItems && (expanded ? <ChevronDown size={16} color={colors.foreground} /> : <ChevronRight size={16} color={colors.foreground} />)}
      </TouchableOpacity>

      {subItems && expanded && (
        <View style={{ paddingLeft: 20 }}>
          {subItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                router.push(item.route as any);
                onNavigate?.(item.route);
              }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                • {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

interface WebSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const WebSidebar: React.FC<WebSidebarProps> = ({ isOpen = true, onClose }) => {
  const { colors } = useThemeStore();

  if (Platform.OS !== 'web') return null;

  const menuItems: MenuItemProps[] = [
    {
      icon: <Home size={18} color={colors.foreground} />,
      label: 'Dashboard',
      route: '/web',
    },
    {
      icon: <TrendingUp size={18} color={colors.foreground} />,
      label: 'Trips',
      subItems: [
        { label: 'New Trip', route: '/(tabs)/addTrip' },
        { label: 'Trip History', route: '/(tabs)/tripLog' },
      ],
    },
    {
      icon: <Users size={18} color={colors.foreground} />,
      label: 'Management',
      subItems: [
        { label: 'Drivers', route: '/web/drivers' },
        { label: 'Clients', route: '/web/clients' },
        { label: 'Trucks', route: '/web/trucks' },
      ],
    },
    {
      icon: <DollarSign size={18} color={colors.foreground} />,
      label: 'Finance',
      route: '/web/finance',
    },
    {
      icon: <BarChart3 size={18} color={colors.foreground} />,
      label: 'Reports',
      route: '/web/reports',
    },
    {
      icon: <FileText size={18} color={colors.foreground} />,
      label: 'Settings',
      route: '/web/profile',
    },
  ];

  return (
    <View
      style={{
        width: 280,
        backgroundColor: colors.card,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        height: '100%',
        display: isOpen ? 'flex' : 'none',
      }}
    >
      <ScrollView
        style={{ flex: 1, paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
            Menu
          </Text>
        </View>

        <View style={{ paddingHorizontal: 8 }}>
          {menuItems.map((item, idx) => (
            <MenuItem
              key={idx}
              icon={item.icon}
              label={item.label}
              route={item.route}
              subItems={item.subItems}
              onNavigate={onClose}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default WebSidebar;
