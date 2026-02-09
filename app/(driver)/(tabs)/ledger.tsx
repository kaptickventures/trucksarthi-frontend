import { ArrowDownLeft, ArrowUpRight, Clock, Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDriverAppContext } from '../../../context/DriverAppContext';
import { BorderRadius, Colors, Spacing } from '../../../constants/driver/theme';
import { translations } from '../../../constants/driver/translations';

export default function LedgerScreen() {
  const { ledgerEntries, addLedgerExpense, netKhata, language } = useDriverAppContext();
  const t = translations[language];

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const sortedEntries = useMemo(() => {
    return [...ledgerEntries].sort((a, b) => {
      const at = new Date(String(a.createdAt || a.entry_date || 0)).getTime();
      const bt = new Date(String(b.createdAt || b.entry_date || 0)).getTime();
      return bt - at;
    });
  }, [ledgerEntries]);

  const handleSave = async () => {
    if (!amount || !description) {
      Alert.alert(t.error, 'Please fill all fields');
      return;
    }

    try {
      await addLedgerExpense(Number(amount), description);
      setModalVisible(false);
      setAmount('');
      setDescription('');
    } catch {
      // alerts handled in hooks
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const paidByDriver = item.transaction_nature === 'paid_by_driver';
    const Icon = paidByDriver ? ArrowUpRight : ArrowDownLeft;
    const color = paidByDriver ? Colors.error : Colors.success;
    const sign = paidByDriver ? '-' : '+';

    const dateValue = String(item.createdAt || item.entry_date || new Date().toISOString());
    const time = new Date(dateValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
          <Icon color={color} size={24} />
        </View>

        <View style={styles.details}>
          <Text style={styles.desc}>{item.remarks || item.title || 'Ledger Entry'}</Text>
          <View style={styles.metaRow}>
            <Clock size={12} color={Colors.textSecondary} />
            <Text style={styles.date}>{new Date(dateValue).toLocaleDateString()} | {time}</Text>
          </View>
        </View>

        <View style={styles.rightSide}>
          <Text style={[styles.amount, { color }]}>{sign}Rs {item.amount}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t.totalBalance}</Text>
        <Text style={[styles.balanceValue, { color: netKhata >= 0 ? Colors.success : Colors.error }]}>
          {netKhata >= 0 ? '+' : '-'}Rs {Math.abs(netKhata)}
        </Text>
      </View>

      <FlatList
        data={sortedEntries}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color={Colors.white} size={24} />
        <Text style={styles.fabText}>{t.addEntry}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.label}>{t.amount}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder={t.enterAmount}
              />

              <Text style={styles.label}>{t.description}</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder={t.enterDesc}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, styles.givenButton, { width: '100%' }]} onPress={handleSave}>
                  <ArrowUpRight color={Colors.white} size={20} />
                  <Text style={styles.actionButtonText}>Save Expense</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  balanceCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    margin: Spacing.md,
    marginBottom: 0,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconBox: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.md,
  },
  details: {
    flex: 1,
  },
  desc: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.round,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  givenButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
