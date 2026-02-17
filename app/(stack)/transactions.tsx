import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    StatusBar,
    FlatList,
    Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeStore } from "../../hooks/useThemeStore";
import { Skeleton } from "../../components/Skeleton";
import useFinance from "../../hooks/useFinance";
import { ArrowDownLeft, ArrowUpRight, Calendar, Filter } from "lucide-react-native";
import { formatDate } from "../../lib/utils";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function TransactionsScreen() {
    const router = useRouter();
    const { colors, theme } = useThemeStore();
    const isDark = theme === "dark";
    const { loading, transactions, fetchTransactions } = useFinance();
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
        endDate: new Date(),
        category: "",
        direction: ""
    });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(null);

    const loadData = useCallback(async () => {
        setRefreshing(true);
        await fetchTransactions({
            startDate: filters.startDate.toISOString(),
            endDate: filters.endDate.toISOString(),
            category: filters.category,
            direction: filters.direction
        });
        setRefreshing(false);
    }, [filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onDateChange = (event: any, selectedDate?: Date) => {
        const type = showDatePicker;
        setShowDatePicker(null);
        if (selectedDate && type) {
            setFilters(prev => ({
                ...prev,
                [type === "start" ? "startDate" : "endDate"]: selectedDate
            }));
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isIncome = item.direction === "INCOME";
        const iconColor = isIncome ? "#16a34a" : "#dc2626";
        const bgColor = isIncome ? "#dcfce7" : "#fee2e2";
        const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

        return (
            <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Icon size={20} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>{item.category}</Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{item.notes || item.sourceModule}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{formatDate(item.date)}</Text>
                        {item.approvalStatus === 'PENDING' && (
                            <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: 'bold' }}>PENDING</Text>
                        )}
                    </View>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: iconColor }}>
                    {isIncome ? "+" : "-"}₹{item.amount.toLocaleString()}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>Transactions</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(true)}>
                    <Filter size={24} color={colors.foreground} />
                </TouchableOpacity>
            </View>

            {loading && !transactions.length ? (
                <View style={{ padding: 20 }}>
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} width="100%" height={70} borderRadius={12} style={{ marginBottom: 12 }} />)}
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: colors.mutedForeground }}>No transactions found.</Text>
                        </View>
                    }
                />
            )}

            {/* Filter Modal */}
            <Modal visible={showFilterModal} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: colors.background, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground }}>Filter Transactions</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Date Range</Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                            <TouchableOpacity onPress={() => setShowDatePicker("start")} style={{ flex: 1, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Calendar size={16} color={colors.mutedForeground} />
                                <Text style={{ color: colors.foreground }}>{formatDate(filters.startDate)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowDatePicker("end")} style={{ flex: 1, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Calendar size={16} color={colors.mutedForeground} />
                                <Text style={{ color: colors.foreground }}>{formatDate(filters.endDate)}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>Type</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                            {["ALL", "INCOME", "EXPENSE"].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setFilters(prev => ({ ...prev, direction: type === "ALL" ? "" : type }))}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        backgroundColor: (filters.direction === type || (type === "ALL" && !filters.direction)) ? colors.primary : colors.card,
                                        borderWidth: 1,
                                        borderColor: colors.border
                                    }}
                                >
                                    <Text style={{
                                        fontWeight: '600',
                                        color: (filters.direction === type || (type === "ALL" && !filters.direction)) ? 'white' : colors.foreground
                                    }}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => { setShowFilterModal(false); loadData(); }}
                            style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {showDatePicker && (
                <DateTimePicker
                    value={showDatePicker === "start" ? filters.startDate : filters.endDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}
        </SafeAreaView>
    );
}
