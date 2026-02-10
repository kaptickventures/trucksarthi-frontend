import { Calendar, MapPin, Truck } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DriverTripView } from '../../context/DriverAppContext';
import { useThemeStore } from '../../hooks/useThemeStore';

interface TripCardProps {
  trip: DriverTripView;
  onPress: () => void;
  isActive?: boolean;
  totalExpenses?: number;
  expensesLabel?: string;
}

export function TripCard({ trip, onPress, isActive = false, totalExpenses, expensesLabel }: TripCardProps) {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : colors.border,
          borderWidth: isActive ? 2 : 1
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.idContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.tripId, { color: colors.foreground }]}>#{trip.id.slice(-6)}</Text>
        </View>
        <Text style={[styles.status, { color: isActive ? colors.primary : colors.mutedForeground }]}>
          {trip.status}
        </Text>
      </View>

      <View style={styles.row}>
        <MapPin size={16} color={colors.mutedForeground} />
        <Text style={[styles.locationText, { color: colors.foreground }]}>{trip.source}  {'->'}  {trip.destination}</Text>
      </View>

      <View style={styles.row}>
        <Truck size={16} color={colors.mutedForeground} />
        <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{trip.truckNumber}</Text>
      </View>

      {trip.startTime && (
        <View style={styles.row}>
          <Calendar size={16} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{new Date(trip.startTime).toLocaleDateString()}</Text>
        </View>
      )}

      {totalExpenses !== undefined && totalExpenses > 0 && (
        <View style={[styles.expenseRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.detailText, { color: colors.mutedForeground, marginLeft: 0 }]}>{expensesLabel || 'Expenses'}:</Text>
          <Text style={[styles.expenseText, { color: colors.destructive }]}>Rs {totalExpenses}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  idContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tripId: {
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  expenseText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

