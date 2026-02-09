import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { TripCard } from '../../../components/driver/TripCard';
import { useDriverAppContext } from '../../../context/DriverAppContext';
import { Colors, Spacing } from '../../../constants/driver/theme';
import { translations } from '../../../constants/driver/translations';

export default function HistoryScreen() {
  const router = useRouter();
  const { tripHistory, language, getTripExpenses } = useDriverAppContext();
  const t = translations[language];

  return (
    <View style={styles.container}>
      <FlatList
        data={tripHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() => router.push(`/(driver)/trip/${item.id}` as any)}
            totalExpenses={getTripExpenses(item.id)}
            expensesLabel={t.totalExpenses}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No Trip History</Text>
          </View>
        }
      />
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
  },
  emptyState: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
  },
});
