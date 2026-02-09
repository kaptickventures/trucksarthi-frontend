import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Briefcase, ChevronLeft, Clock, MapPin, Plus, User, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDriverAppContext } from '../../../context/DriverAppContext';
import { BorderRadius, Colors, Spacing } from '../../../constants/driver/theme';

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const {
    activeTrip,
    tripHistory,
    getTripExpenseEntries,
    addLedgerExpense,
    completeTrip,
  } = useDriverAppContext();

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  const allTrips = useMemo(() => {
    return activeTrip ? [activeTrip, ...tripHistory] : tripHistory;
  }, [activeTrip, tripHistory]);

  const trip = useMemo(() => {
    return allTrips.find((t) => t.id === String(id));
  }, [allTrips, id]);

  const tripExpenses = useMemo(() => {
    if (!trip) return [];
    return getTripExpenseEntries(trip.id);
  }, [getTripExpenseEntries, trip]);

  const totalTripExpenses = tripExpenses.reduce((sum, entry) => sum + entry.amount, 0);

  if (!trip) {
    return (
      <View style={styles.centered}>
        <Text>Trip not found</Text>
      </View>
    );
  }

  const isActive = trip.status !== 'Completed';

  const handleCompleteTrip = () => {
    Alert.alert('Confirm Completion', 'Are you sure you want to complete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          try {
            await completeTrip(trip);
            Alert.alert('Success', 'Trip completed successfully');
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to complete trip');
          }
        },
      },
    ]);
  };

  const handleAddExpense = async () => {
    if (!expenseAmount || !expenseDesc) {
      Alert.alert('Error', 'Please fill amount and description');
      return;
    }

    try {
      await addLedgerExpense(Number(expenseAmount), expenseDesc, trip.id);
      setExpenseModalVisible(false);
      setExpenseAmount('');
      setExpenseDesc('');
      Alert.alert('Success', 'Expense added');
    } catch {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Trip Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.label}>TRIP ID</Text>
              <Text style={styles.value}>#{trip.id.slice(-6)}</Text>
            </View>
            <Text style={styles.status}>{trip.status}</Text>
          </View>

          {trip.startTime && <Text style={styles.dateLabel}>{new Date(trip.startTime).toDateString()}</Text>}

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <User size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>Driver: <Text style={styles.bold}>{trip.driverName}</Text></Text>
          </View>
          <View style={styles.infoRow}>
            <Briefcase size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>Client: <Text style={styles.bold}>{trip.clientName}</Text></Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <MapPin color={Colors.primary} size={20} />
            <Text style={styles.sectionTitle}>Route</Text>
          </View>
          <View style={styles.timeline}>
            <Text style={styles.timelinePoint}>From: {trip.source}</Text>
            <Text style={styles.timelinePoint}>To: {trip.destination}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>VEHICLE</Text>
          <Text style={styles.value}>{trip.truckNumber}</Text>
        </View>

        {tripExpenses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Trip Expenses</Text>
              <Text style={[styles.sectionTitle, { color: Colors.error }]}>Rs {totalTripExpenses}</Text>
            </View>

            <View style={styles.divider} />

            {tripExpenses.map((expense) => (
              <View key={String(expense._id)} style={styles.expenseItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseDesc}>{expense.remarks}</Text>
                  <Text style={styles.expenseDate}>{new Date(String(expense.createdAt || expense.entry_date)).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.expenseAmount}>Rs {expense.amount}</Text>
              </View>
            ))}
          </View>
        )}

        {isActive && (
          <TouchableOpacity style={styles.expenseButton} onPress={() => setExpenseModalVisible(true)}>
            <Plus color={Colors.primary} size={20} />
            <Text style={styles.expenseButtonText}>Add Trip Expense</Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={handleCompleteTrip}>
              <Text style={styles.buttonText}>Complete Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={expenseModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setExpenseModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Trip Expense</Text>
                <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                  <X color={Colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>For Trip #{trip.id.slice(-6)}</Text>

              <Text style={styles.label}>Amount (Rs)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                placeholder="0.00"
              />

              <Text style={styles.label}>Vendor Name and Description</Text>
              <TextInput
                style={styles.input}
                value={expenseDesc}
                onChangeText={setExpenseDesc}
                placeholder="e.g. Fuel - Diesel"
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleAddExpense}>
                <Text style={styles.saveButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -4,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingVertical: 4,
  },
  expenseDesc: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  expenseDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  expenseAmount: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  bold: {
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeline: {
    marginLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
    paddingLeft: 16,
    paddingVertical: 8,
  },
  timelinePoint: {
    fontSize: 16,
    marginBottom: 12,
  },
  expenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.white,
  },
  expenseButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    marginTop: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
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
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
