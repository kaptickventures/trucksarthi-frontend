import { Calendar, MapPin, Truck } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DriverTripView } from '../../context/DriverAppContext';
import { BorderRadius, Colors, Spacing } from '../../constants/driver/theme';

interface TripCardProps {
  trip: DriverTripView;
  onPress: () => void;
  isActive?: boolean;
  totalExpenses?: number;
  expensesLabel?: string;
}

export function TripCard({ trip, onPress, isActive = false, totalExpenses, expensesLabel }: TripCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.activeCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.idContainer}>
          <Text style={styles.tripId}>#{trip.id.slice(-6)}</Text>
        </View>
        <Text style={[styles.status, { color: isActive ? Colors.primary : Colors.textSecondary }]}>
          {trip.status}
        </Text>
      </View>

      <View style={styles.row}>
        <MapPin size={16} color={Colors.textSecondary} />
        <Text style={styles.locationText}>{trip.source}  {'->'}  {trip.destination}</Text>
      </View>

      <View style={styles.row}>
        <Truck size={16} color={Colors.textSecondary} />
        <Text style={styles.detailText}>{trip.truckNumber}</Text>
      </View>

      {trip.startTime && (
        <View style={styles.row}>
          <Calendar size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{new Date(trip.startTime).toLocaleDateString()}</Text>
        </View>
      )}

      {totalExpenses !== undefined && totalExpenses > 0 && (
        <View style={styles.expenseRow}>
          <Text style={styles.detailText}>{expensesLabel || 'Expenses'}:</Text>
          <Text style={styles.expenseText}>Rs {totalExpenses}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  idContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tripId: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  locationText: {
    marginLeft: Spacing.sm,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  detailText: {
    marginLeft: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expenseText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: Spacing.sm,
  },
});
