import { useRouter } from 'expo-router';
import { Calendar, Wallet } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TripCard } from '../../../components/driver/TripCard';
import { useDriverAppContext } from '../../../context/DriverAppContext';
import { BorderRadius, Colors, Spacing } from '../../../constants/driver/theme';
import { translations } from '../../../constants/driver/translations';

export default function DashboardScreen() {
  const router = useRouter();
  const {
    activeTrip,
    completedToday,
    getTripExpenses,
    language,
    netKhata,
    tripsThisMonth,
  } = useDriverAppContext();

  const t = translations[language];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.metricCard}>
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t.tripsThisMonth}</Text>
            <View style={styles.metricValueRow}>
              <Calendar color={Colors.primary} size={20} />
              <Text style={styles.metricValue}>{tripsThisMonth}</Text>
            </View>
          </View>
          <View style={styles.dividerVertical} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t.netKhata}</Text>
            <View style={styles.metricValueRow}>
              <Wallet color={netKhata >= 0 ? Colors.success : Colors.error} size={20} />
              <Text style={[styles.metricValue, { color: netKhata >= 0 ? Colors.success : Colors.error }]}>
                Rs {Math.abs(netKhata)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t.activeTrips}</Text>
      {activeTrip ? (
        <TripCard
          trip={activeTrip}
          isActive
          onPress={() => router.push(`/(driver)/trip/${activeTrip.id}` as any)}
          totalExpenses={getTripExpenses(activeTrip.id)}
          expensesLabel={t.totalExpenses}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t.noActiveTrips}</Text>
        </View>
      )}

      {completedToday.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>{t.completedToday}</Text>
          {completedToday.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onPress={() => router.push(`/(driver)/trip/${trip.id}` as any)}
              totalExpenses={getTripExpenses(trip.id)}
              expensesLabel={t.totalExpenses}
            />
          ))}
        </>
      )}
    </ScrollView>
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
  metricCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  emptyState: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
