import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useThemeStore } from '@/hooks/useThemeStore';
import DataTable from '@/components/web/DataTable';
import { Plus, Search } from 'lucide-react-native';

interface Client {
  id: string;
  name: string;
  phone: string;
  company: string;
  totalTrips: number;
  totalAmount: number;
  status: 'active' | 'inactive';
}

export default function WebClients() {
  const { colors } = useThemeStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const result = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from API
      setClients([
        {
          id: '1',
          name: 'Shyam Transport',
          phone: '+91 9876543220',
          company: 'Shyam Transport Ltd',
          totalTrips: 156,
          totalAmount: 450000,
          status: 'active',
        },
        {
          id: '2',
          name: 'Global Logistics',
          phone: '+91 9876543221',
          company: 'Global Logistics Inc',
          totalTrips: 89,
          totalAmount: 280000,
          status: 'active',
        },
        {
          id: '3',
          name: 'Local Traders',
          phone: '+91 9876543222',
          company: 'Local Traders Co',
          totalTrips: 45,
          totalAmount: 120000,
          status: 'inactive',
        },
      ]);
    } catch (error) {
      console.error('Error loading clients:', error);
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
      key: 'company' as const,
      title: 'Company',
      width: '25%',
    },
    {
      key: 'phone' as const,
      title: 'Phone',
      width: '18%',
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
            backgroundColor: status === 'active' ? '#dcfce7' : '#fee2e2',
          }}
        >
          <Text
            style={{
              color: status === 'active' ? '#15803d' : '#dc2626',
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
      key: 'totalAmount' as const,
      title: 'Total Amount',
      width: '13%',
      render: (value: number) => `₹${(value / 1000).toFixed(0)}K`,
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
            Clients
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
            Manage all client accounts
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
          <Text style={{ color: 'white', fontWeight: '600' }}>Add Client</Text>
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
          placeholder="Search by name or company..."
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
        emptyMessage="No clients found"
      />
    </ScrollView>
  );
}
