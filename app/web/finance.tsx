import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useThemeStore } from '@/hooks/useThemeStore';
import DataTable from '@/components/web/DataTable';
import { Search, Download } from 'lucide-react-native';

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending';
}

export default function WebFinance() {
  const { colors } = useThemeStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    const result = transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, transactions]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from API
      setTransactions([
        {
          id: '1',
          date: '2024-03-20',
          type: 'income',
          category: 'Trip Revenue',
          description: 'Trip TN-001-2024',
          amount: 5000,
          status: 'completed',
        },
        {
          id: '2',
          date: '2024-03-19',
          type: 'expense',
          category: 'Fuel',
          description: 'Fuel for TN-01-AB-1234',
          amount: 2500,
          status: 'completed',
        },
        {
          id: '3',
          date: '2024-03-18',
          type: 'income',
          category: 'Trip Revenue',
          description: 'Trip TN-002-2024',
          amount: 4500,
          status: 'pending',
        },
        {
          id: '4',
          date: '2024-03-17',
          type: 'expense',
          category: 'Maintenance',
          description: 'Truck maintenance',
          amount: 1200,
          status: 'completed',
        },
      ]);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  if (Platform.OS !== 'web') return null;

  const columns = [
    {
      key: 'date' as const,
      title: 'Date',
      width: '15%',
    },
    {
      key: 'category' as const,
      title: 'Category',
      width: '15%',
    },
    {
      key: 'description' as const,
      title: 'Description',
      width: '30%',
    },
    {
      key: 'type' as const,
      title: 'Type',
      width: '12%',
      render: (type: string) => (
        <Text
          style={{
            color: type === 'income' ? '#22c55e' : '#ef4444',
            fontWeight: '600',
            fontSize: 13,
            textTransform: 'capitalize',
          }}
        >
          {type}
        </Text>
      ),
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
            backgroundColor: status === 'completed' ? '#dcfce7' : '#fef3c7',
          }}
        >
          <Text
            style={{
              color: status === 'completed' ? '#15803d' : '#b45309',
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
      key: 'amount' as const,
      title: 'Amount',
      width: '16%',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
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
            Finance
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
            Transaction history and ledger
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Download size={18} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 13 }}>Total Income</Text>
          <Text
            style={{
              color: '#22c55e',
              fontSize: 24,
              fontWeight: '700',
              marginTop: 8,
            }}
          >
            ₹{totalIncome.toLocaleString()}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 13 }}>Total Expense</Text>
          <Text
            style={{
              color: '#ef4444',
              fontSize: 24,
              fontWeight: '700',
              marginTop: 8,
            }}
          >
            ₹{totalExpense.toLocaleString()}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 13 }}>Net Profit</Text>
          <Text
            style={{
              color: totalIncome - totalExpense > 0 ? '#22c55e' : '#ef4444',
              fontSize: 24,
              fontWeight: '700',
              marginTop: 8,
            }}
          >
            ₹{(totalIncome - totalExpense).toLocaleString()}
          </Text>
        </View>
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
          placeholder="Search transactions..."
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
        emptyMessage="No transactions found"
      />
    </ScrollView>
  );
}
