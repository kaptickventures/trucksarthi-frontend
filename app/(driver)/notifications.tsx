import { Stack } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useDriverAppContext } from '../../context/DriverAppContext';
import { BorderRadius, Colors, Spacing } from '../../constants/driver/theme';

export default function NotificationsScreen() {
  const { notifications } = useDriverAppContext();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notifications', headerShown: true }} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <AlertCircle color={Colors.warning} size={24} style={styles.icon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.text}>{item.message}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No new notifications</Text>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  emptyText: {
    color: Colors.textSecondary,
  },
});
