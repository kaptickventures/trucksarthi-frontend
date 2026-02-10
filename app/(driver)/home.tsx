import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useLayoutEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripCard } from '../../components/driver/TripCard';
import { useDriverAppContext } from '../../context/DriverAppContext';
import { translations } from '../../constants/driver/translations';
import { useThemeStore } from '../../hooks/useThemeStore';
import SideMenu from '../../components/SideMenu';

export default function DashboardScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { colors } = useThemeStore();
    const insets = useSafeAreaInsets();
    const [menuVisible, setMenuVisible] = useState(false);
    const {
        activeTrip,
        completedToday,
        getTripExpenses,
        language,
        netKhata,
        tripsThisMonth,
    } = useDriverAppContext();

    const t = translations[language];

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false, // We'll handle header manually or let Tabs handle it, but wait, Tabs does weird heavy lifting
            // Let's rely on Tabs header or custom one.
            // Actually, we want a custom header with Menu button.
            // Since we are now DIRECT children of Tabs, navigation.setOptions applies to Tab Stack.
            // But Tabs headers are static.
            // Better to hide header in _layout and implement custom header here?
            // Or use navigation.setOptions to inject buttons into Tab Header.
            /* 
            Update: The user asked to remove (tabs) folder structure.
            So now (driver)/_layout.tsx is the TABS navigator.
            (driver)/home.tsx is the Home Tab.
             */
        });
    }, [navigation, colors, menuVisible]);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Custom Header for Home Tab */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                paddingTop: insets.top + 12,
                backgroundColor: colors.background
            }}>
                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                    <Ionicons name="menu" size={28} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>Trucksarthi</Text>
                <TouchableOpacity onPress={() => router.push("/(driver)/notifications" as any)}>
                    <Ionicons name="notifications-outline" size={26} color={colors.foreground} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.metricRow}>
                        <View style={styles.metricItem}>
                            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{t.tripsThisMonth}</Text>
                            <View style={styles.metricValueRow}>
                                <Ionicons name="calendar-outline" color={colors.primary} size={20} />
                                <Text style={[styles.metricValue, { color: colors.foreground }]}>{tripsThisMonth}</Text>
                            </View>
                        </View>
                        <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
                        <View style={styles.metricItem}>
                            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{t.netKhata}</Text>
                            <View style={styles.metricValueRow}>
                                <Ionicons name="wallet-outline" color={netKhata >= 0 ? colors.primary : colors.destructive} size={20} />
                                <Text style={[styles.metricValue, { color: netKhata >= 0 ? colors.primary : colors.destructive }]}>
                                    Rs {Math.abs(netKhata)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.activeTrips}</Text>
                {activeTrip ? (
                    <TripCard
                        trip={activeTrip}
                        isActive
                        onPress={() => router.push(`/(driver)/trip/${activeTrip.id}` as any)}
                        totalExpenses={getTripExpenses(activeTrip.id)}
                        expensesLabel={t.totalExpenses}
                    />
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t.noActiveTrips}</Text>
                    </View>
                )}

                {completedToday.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 16, color: colors.foreground }]}>{t.completedToday}</Text>
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
            <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} topOffset={insets.top + 52} />
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    metricCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
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
        textTransform: 'uppercase',
        marginBottom: 8,
        fontWeight: '600',
    },
    metricValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    dividerVertical: {
        width: 1,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 8,
    },
    emptyState: {
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
});
