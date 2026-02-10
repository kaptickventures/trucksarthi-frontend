import { Stack } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useDriverAppContext } from '../../context/DriverAppContext';
import { useThemeStore } from '../../hooks/useThemeStore';

export default function NotificationsScreen() {
  const { colors, theme } = useThemeStore();
  const { notifications } = useDriverAppContext();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { color: colors.foreground }
        }}
      />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AlertCircle color={colors.primary} size={24} style={styles.icon} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.text, { color: colors.mutedForeground }]}>{item.message}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No new notifications</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  icon: {
    marginRight: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  text: {
    flex: 1,
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
  },
});

