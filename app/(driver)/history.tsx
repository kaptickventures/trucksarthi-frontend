import { useRouter, useNavigation } from 'expo-router';
import { FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useLayoutEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TripCard } from '../../components/driver/TripCard';
import { useDriverAppContext } from '../../context/DriverAppContext';
import { translations } from '../../constants/driver/translations';
import { useThemeStore } from '../../hooks/useThemeStore';
import SideMenu from '../../components/SideMenu';

export default function HistoryScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { colors } = useThemeStore();
    const [menuVisible, setMenuVisible] = useState(false);
    const { tripHistory, language, getTripExpenses } = useDriverAppContext();
    const t = translations[language];

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Custom Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: colors.background,
                borderBottomWidth: 1,
                borderBottomColor: colors.border
            }}>
                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                    <Ionicons name="menu" size={28} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>{t.history}</Text>
                <View style={{ width: 28 }} />
            </View>

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
                        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No Trip History</Text>
                    </View>
                }
            />
            <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
    },
    emptyState: {
        marginTop: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
});
