import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useThemeStore } from '@/hooks/useThemeStore';
import DataTable from '@/components/web/DataTable';
import { Plus, Search } from 'lucide-react-native';

interface Truck {
  id: string;
  registrationNumber: string;
  model: string;
  capacity: string;
  status: 'active' | 'maintenance' | 'inactive';
  totalTrips: number;
  totalKms: number;
  owner: string;
}

export default function WebTrucks() {
  const { colors } = useThemeStore();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [filtered, setFiltered] = useState<Truck[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrucks();
  }, []);

  useEffect(() => {
    const result = trucks.filter(
      (t) =>
        t.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.model.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, trucks]);

  const loadTrucks = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from API
      setTrucks([
        {
          id: '1',
          registrationNumber: 'TN-01-AB-1234',
          model: 'Ashok Leyland 2523',
          capacity: '25 Tons',
          status: 'active',
          totalTrips: 234,
          totalKms: 45600,
          owner: 'Raj Kumar',
        },
        {
          id: '2',
          registrationNumber: 'TN-01-AB-5678',
          model: 'Tata 2518',
          capacity: '18 Tons',
          status: 'active',
          totalTrips: 189,
          totalKms: 35400,
          owner: 'Amit Singh',
        },
        {
          id: '3',
          registrationNumber: 'TN-01-AB-9012',
          model: 'Hino 700',
          capacity: '20 Tons',
          status: 'maintenance',
          totalTrips: 156,
          totalKms: 28500,
          owner: 'Vikram Patel',
        },
      ]);
    } catch (error) {
      console.error('Error loading trucks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS !== 'web') return null;

  const columns = [
    {
      key: 'registrationNumber' as const,
      title: 'Registration',
      width: '18%',
    },
    {
      key: 'model' as const,
      title: 'Model',
      width: '20%',
    },
    {
      key: 'capacity' as const,
      title: 'Capacity',
      width: '12%',
    },
    {
      key: 'status' as const,
      title: 'Status',
      width: '12%',
      render: (status: string) => (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor:
              status === 'active'
                ? '#dcfce7'
                : status === 'maintenance'
                  ? '#fef3c7'
                  : '#f3f4f6',
          }}
        >
          <Text
            style={{
              color:
                status === 'active'
                  ? '#15803d'
                  : status === 'maintenance'
                    ? '#b45309'
                    : '#6b7280',
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'capitalize',
            }}
          >
            {status}
          </Text>
        </View>
      ),
    },
    {
      key: 'totalTrips' as const,
      title: 'Total Trips',
      width: '12%',
    },
    {
      key: 'totalKms' as const,
      title: 'KMs',
      width: '12%',
      render: (value: number) => `${(value / 1000).toFixed(1)}K`,
    },
    {
      key: 'owner' as const,
      title: 'Owner',
      width: '14%',
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
            Trucks
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
            Manage your truck fleet
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
          <Text style={{ color: 'white', fontWeight: '600' }}>Add Truck</Text>
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
          placeholder="Search by registration or model..."
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
        emptyMessage="No trucks found"
      />
    </ScrollView>
  );
}
