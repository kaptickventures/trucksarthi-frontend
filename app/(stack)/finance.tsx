import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { useState, useCallback, useEffect, useLayoutEffect } from "react";
import {
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    StatusBar,
    Alert
} from "react-native";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { Skeleton } from "../../components/Skeleton";
import useFinance from "../../hooks/useFinance";
import { ArrowDownLeft, ArrowUpRight, Wallet, PieChart, TrendingUp, TrendingDown, DollarSign } from "lucide-react-native";

export default function FinanceScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { colors, theme } = useThemeStore();
    const isDark = theme === "dark";
    const { user, loading: userLoading } = useUser();
    const { summary: metrics, fetchSummary, loading: financeLoading } = useFinance();
    const [refreshing, setRefreshing] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "Trucksarthi",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
            headerTitleStyle: { color: colors.foreground, fontWeight: "800", fontSize: 22 },
            headerTintColor: colors.foreground,
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => router.push("/(stack)/notifications" as any)}
                    style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                >
                    <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, colors, router]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSummary();
        setRefreshing(false);
    }, [fetchSummary]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    // Sections
    const SECTIONS = [
        {
            title: "Transactions",
            description: "View all financial transactions",
            icon: "list-outline",
            color: "#3b82f6",
            route: "/(stack)/transactions"
        },
        {
            title: "Driver Ledger",
            description: "Manage driver payments & expenses",
            icon: "people-outline",
            color: "#f59e0b",
            route: "/(stack)/driver-ledger"
        },
        {
            title: "Client Ledger",
            description: "Client payments & invoices",
            icon: "business-outline",
            color: "#10b981",
            route: "/(stack)/client-ledger"
        },
        {
            title: "Client Payments",
            description: "Full & partial receipts view",
            icon: "card-outline",
            color: "#0ea5e9",
            route: "/(stack)/client-payments"
        },
        {
            title: "Expense Manager",
            description: "Fuel, Maintenance & Trip Expenses",
            icon: "wallet-outline",
            color: "#ef4444",
            route: "/(stack)/expense-manager"
        },
        {
            title: "Misc Transactions",
            description: "Office and non-core entries",
            icon: "apps-outline",
            color: "#f97316",
            route: "/(stack)/misc-transactions"
        }
    ];

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                <View style={{ marginBottom: 24, paddingHorizontal: 4, marginTop: 8 }}>
                    <Text style={{ fontSize: 30, fontWeight: '900', color: colors.foreground }}>Finance Hub</Text>
                    <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 4 }}>Monitor your business finances</Text>
                </View>

                {/* SUMMARY CARDS */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <View style={{ flex: 1, backgroundColor: colors.card, padding: 16, borderRadius: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <View style={{ padding: 6, backgroundColor: '#dcfce7', borderRadius: 20 }}>
                                <ArrowDownLeft size={16} color="#16a34a" />
                            </View>
                            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600' }}>INCOME</Text>
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>₹{metrics.income.toLocaleString()}</Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: colors.card, padding: 16, borderRadius: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <View style={{ padding: 6, backgroundColor: '#fee2e2', borderRadius: 20 }}>
                                <ArrowUpRight size={16} color="#dc2626" />
                            </View>
                            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600' }}>EXPENSE</Text>
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>₹{metrics.expense.toLocaleString()}</Text>
                    </View>
                </View>

                {/* NET PROFIT */}
                <View style={{ backgroundColor: colors.primary, padding: 20, borderRadius: 20, marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>NET PROFIT</Text>
                        <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>₹{metrics.net.toLocaleString()}</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                        <PieChart size={32} color="white" />
                    </View>
                </View>

                {/* QUICK ACTIONS GRID */}
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 16 }}>Management</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {SECTIONS.map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            onPress={() => router.push(item.route as any)}
                            style={{ width: '48%', backgroundColor: colors.card, padding: 16, borderRadius: 16, minHeight: 110, justifyContent: 'space-between' }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${item.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name={item.icon as any} size={22} color={item.color} />
                            </View>
                            <View>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>{item.title}</Text>
                                <Text style={{ fontSize: 11, color: colors.mutedForeground }} numberOfLines={2}>{item.description}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}
