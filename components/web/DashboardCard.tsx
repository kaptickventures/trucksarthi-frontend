import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useThemeStore } from '@/hooks/useThemeStore';
import { ArrowRight } from 'lucide-react-native';

interface DashboardCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  onPress?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  onPress,
  trend,
}) => {
  const { colors } = useThemeStore();

  if (Platform.OS !== 'web') return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 20,
        flex: 1,
        minHeight: 160,
        justifyContent: 'space-between',
      }}
    >
      <View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '500' }}>
            {title}
          </Text>
          {icon && (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: color || colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </View>
          )}
        </View>

        {value !== undefined && (
          <Text
            style={{
              color: colors.foreground,
              fontSize: 28,
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            {value}
          </Text>
        )}

        {subtitle && (
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {subtitle}
          </Text>
        )}

        {trend && (
          <View style={{ marginTop: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
              style={{
                color: trend.isPositive ? '#22c55e' : '#ef4444',
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {trend.isPositive ? '+' : '-'} {Math.abs(trend.value)}%
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              vs last month
            </Text>
          </View>
        )}
      </View>

      {onPress && (
        <View
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            marginTop: 12,
          }}
        >
          <ArrowRight size={16} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default DashboardCard;
