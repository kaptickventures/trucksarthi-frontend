import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Platform } from 'react-native';
import { useThemeStore } from '@/hooks/useThemeStore';
import { useAuth } from '@/context/AuthContext';
import DashboardCard from '@/components/web/DashboardCard';
import {
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';

interface DashboardStats {
  totalTrips: number;
  activeTrips: number;
  totalDrivers: number;
  totalClients: number;
  totalRevenue: number;
  totalExpenses: number;
  pendingApprovals: number;
  completedToday: number;
}

export default function WebDashboard() {
  const { colors } = useThemeStore();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // TODO: Fetch actual stats from API
      // For now, mock data
      setStats({
        totalTrips: 245,
        activeTrips: 12,
        totalDrivers: 18,
        totalClients: 42,
        totalRevenue: 524000,
        totalExpenses: 156000,
        pendingApprovals: 5,
        completedToday: 8,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (Platform.OS !== 'web') return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Header */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: '700', marginBottom: 8 }}>
          Welcome Back, {user?.name || 'User'}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          Here is an overview of your business
        </Text>
      </View>

      {/* Key Metrics Grid */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
          Overview
        </Text>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <View style={{ flex: 1, minWidth: 250 }}>
            <DashboardCard
              title="Active Trips"
              value={stats?.activeTrips || 0}
              subtitle="Currently running"
              icon={<Truck size={20} color="white" />}
              color="#3b82f6"
              trend={{ value: 12, isPositive: true }}
            />
          </View>
          <View style={{ flex: 1, minWidth: 250 }}>
            <DashboardCard
              title="Total Drivers"
              value={stats?.totalDrivers || 0}
              subtitle="Active drivers"
              icon={<Users size={20} color="white" />}
              color="#8b5cf6"
            />
          </View>
          <View style={{ flex: 1, minWidth: 250 }}>
            <DashboardCard
              title="Total Revenue"
              value={`₹${(stats?.totalRevenue || 0) / 1000}K`}
              subtitle="This month"
              icon={<DollarSign size={20} color="white" />}
              color="#22c55e"
              trend={{ value: 8, isPositive: true }}
            />
          </View>
          <View style={{ flex: 1, minWidth: 250 }}>
            <DashboardCard
              title="Total Expenses"
              value={`₹${(stats?.totalExpenses || 0) / 1000}K`}
              subtitle="This month"
              icon={<TrendingUp size={20} color="white" />}
              color="#f59e0b"
              trend={{ value: 3, isPositive: false }}
            />
          </View>
        </View>
      </View>

      {/* Action Items */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
          Action Items
        </Text>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
          }}
        >
          <View style={{ flex: 1, minWidth: 250 }}>
            <DashboardCard
              title="Pending Approvals"
              value={stats?.pendingApprovals || 0}
              subtitle="Awaiting review"
              icon={<AlertCircle size={20} color="white" />}
              color="#ef4444"
            />
          </View>
          <View style={{ flex: 1, minWidth: 250 }}>
            <DashboardCard
              title="Completed Today"
              value={stats?.completedToday || 0}
              subtitle="Trips finished"
              icon={<CheckCircle size={20} color="white" />}
              color="#22c55e"
            />
          </View>
        </View>
      </View>

      {/* Quick Stats Table */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 20,
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
          Monthly Summary
        </Text>
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {[
            { label: 'Total Trips', value: stats?.totalTrips || 0 },
            { label: 'Total Clients', value: stats?.totalClients || 0 },
            { label: 'Net Profit', value: `₹${((stats?.totalRevenue || 0) - (stats?.totalExpenses || 0)) / 1000}K` },
            { label: 'Profit Margin', value: `${Math.round(((stats?.totalRevenue || 0) - (stats?.totalExpenses || 0)) / (stats?.totalRevenue || 1) * 100)}%` },
          ].map((item, idx) => (
            <View
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: idx < 3 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 14 }}>
                {item.label}
              </Text>
              <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 14 }}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
