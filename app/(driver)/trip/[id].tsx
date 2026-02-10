import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Briefcase, ChevronLeft, Clock, MapPin, Plus, User, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDriverAppContext } from '../../../context/DriverAppContext';
import { useThemeStore } from '../../../hooks/useThemeStore';

export default function TripDetailsScreen() {
  const { colors, theme } = useThemeStore();
  const isDark = theme === 'dark';
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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Trip not found</Text>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Trip Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ChevronLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>TRIP ID</Text>
              <Text style={[styles.value, { color: colors.foreground }]}>#{trip.id.slice(-6)}</Text>
            </View>
            <Text style={[styles.status, { color: colors.primary }]}>{trip.status}</Text>
          </View>

          {trip.startTime && <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{new Date(trip.startTime).toDateString()}</Text>}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <User size={16} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>Driver: <Text style={styles.bold}>{trip.driverName}</Text></Text>
          </View>
          <View style={styles.infoRow}>
            <Briefcase size={16} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>Client: <Text style={styles.bold}>{trip.clientName}</Text></Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <MapPin color={colors.primary} size={20} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Route</Text>
          </View>
          <View style={[styles.timeline, { borderLeftColor: colors.border }]}>
            <Text style={[styles.timelinePoint, { color: colors.foreground }]}>From: {trip.source}</Text>
            <Text style={[styles.timelinePoint, { color: colors.foreground }]}>To: {trip.destination}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>VEHICLE</Text>
          <Text style={[styles.value, { color: colors.foreground }]}>{trip.truckNumber}</Text>
        </View>

        {tripExpenses.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trip Expenses</Text>
              <Text style={[styles.sectionTitle, { color: colors.destructive }]}>Rs {totalTripExpenses}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {tripExpenses.map((expense) => (
              <View key={String(expense._id)} style={styles.expenseItem}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.expenseDesc, { color: colors.foreground }]}>{expense.remarks}</Text>
                  <Text style={[styles.expenseDate, { color: colors.mutedForeground }]}>{new Date(String(expense.createdAt || expense.entry_date)).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.expenseAmount, { color: colors.destructive }]}>Rs {expense.amount}</Text>
              </View>
            ))}
          </View>
        )}

        {isActive && (
          <TouchableOpacity
            style={[styles.expenseButton, { borderColor: colors.primary, backgroundColor: colors.card }]}
            onPress={() => setExpenseModalVisible(true)}
          >
            <Plus color={colors.primary} size={20} />
            <Text style={[styles.expenseButtonText, { color: colors.primary }]}>Add Trip Expense</Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleCompleteTrip}>
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
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Trip Expense</Text>
                <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                  <X color={colors.mutedForeground} size={24} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>For Trip #{trip.id.slice(-6)}</Text>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>Amount (Rs)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                keyboardType="numeric"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={[styles.label, { color: colors.mutedForeground }]}>Vendor Name and Description</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                value={expenseDesc}
                onChangeText={setExpenseDesc}
                placeholder="e.g. Fuel - Diesel"
                placeholderTextColor={colors.mutedForeground}
              />

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleAddExpense}>
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
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dateLabel: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  expenseDesc: {
    fontSize: 14,
    fontWeight: '500',
  },
  expenseDate: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 14,
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
  },
  bold: {
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeline: {
    marginLeft: 8,
    borderLeftWidth: 2,
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
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 24,
  },
  expenseButtonText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

