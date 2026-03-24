import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useThemeStore } from '@/hooks/useThemeStore';
import DataTable from '@/components/web/DataTable';
import { Plus, Search } from 'lucide-react-native';

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive' | 'on_trip';
  trips: number;
  totalEarnings: number;
  rating: number;
}

export default function WebDrivers() {
  const { colors } = useThemeStore();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filtered, setFiltered] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    const result = drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.phone.includes(search)
    );
    setFiltered(result);
  }, [search, drivers]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from API
      setDrivers([
        {
          id: '1',
          name: 'Raj Kumar',
          phone: '+91 9876543210',
          status: 'on_trip',
          trips: 45,
          totalEarnings: 125000,
          rating: 4.8,
        },
        {
          id: '2',
          name: 'Amit Singh',
          phone: '+91 9876543211',
          status: 'active',
          trips: 38,
          totalEarnings: 98000,
          rating: 4.6,
        },
        {
          id: '3',
          name: 'Vikram Patel',
          phone: '+91 9876543212',
          status: 'inactive',
          trips: 22,
          totalEarnings: 65000,
          rating: 4.3,
        },
      ]);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS !== 'web') return null;

  const columns = [
    {
      key: 'name' as const,
      title: 'Name',
      width: '20%',
    },
    {
      key: 'phone' as const,
      title: 'Phone',
      width: '20%',
    },
    {
      key: 'status' as const,
      title: 'Status',
      width: '15%',
      render: (status: string) => (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor:
              status === 'active'
                ? '#dcfce7'
                : status === 'on_trip'
                  ? '#dbeafe'
                  : '#f3f4f6',
          }}
        >
          <Text
            style={{
              color:
                status === 'active'
                  ? '#15803d'
                  : status === 'on_trip'
                    ? '#1e40af'
                    : '#6b7280',
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'capitalize',
            }}
          >
            {status.replace('_', ' ')}
          </Text>
        </View>
      ),
    },
    {
      key: 'trips' as const,
      title: 'Trips',
      width: '10%',
    },
    {
      key: 'totalEarnings' as const,
      title: 'Total Earnings',
      width: '15%',
      render: (value: number) => `₹${value.toLocaleString()}`,
    },
    {
      key: 'rating' as const,
      title: 'Rating',
      width: '10%',
      render: (value: number) => `${value.toFixed(1)} ⭐`,
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Header */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <View>
          <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700' }}>
            Drivers
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
            Manage and track all drivers
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Plus size={18} color="white" />
          <Text style={{ color: 'white', fontWeight: '600' }}>Add Driver</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Search size={18} color={colors.muted} />
        <TextInput
          style={{
            flex: 1,
            color: colors.foreground,
            fontSize: 14,
            padding: 0,
          }}
          placeholder="Search by name or phone..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        emptyMessage="No drivers found"
        onRowClick={(driver) => {
          // TODO: Navigate to driver details
          console.log('Clicked driver:', driver);
        }}
      />
    </ScrollView>
  );
}
