import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useLayoutEffect, useState } from 'react';
import { TripCard } from '../../../../components/driver/TripCard';
import { useDriverAppContext } from '../../../../context/DriverAppContext';
import { translations } from '../../../../constants/driver/translations';
import { useThemeStore } from '../../../../hooks/useThemeStore';
import SideMenu from '../../../../components/SideMenu';

export default function DashboardScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { colors } = useThemeStore();
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
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => setMenuVisible((prev) => !prev)}
                    style={{ paddingLeft: 16 }}
                >
                    <Ionicons
                        name={menuVisible ? "close" : "menu"}
                        size={24}
                        color={colors.foreground}
                    />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => router.push("/(driver)/notifications" as any)}
                    style={{ paddingRight: 16 }}
                >
                    <Ionicons
                        name="notifications-outline"
                        size={24}
                        color={colors.foreground}
                    />
                </TouchableOpacity>
            ),
        });
    }, [navigation, colors, menuVisible]);

    return (
        <>
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.content}
            >
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
            <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
        </>
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
    metricCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
