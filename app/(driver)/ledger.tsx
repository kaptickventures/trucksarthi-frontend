import { ArrowDownLeft, ArrowUpRight, Clock, Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDriverAppContext } from '../../context/DriverAppContext';
import { translations } from '../../constants/driver/translations';
import { useThemeStore } from '../../hooks/useThemeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SideMenu from '../../components/SideMenu';

export default function LedgerScreen() {
  const { colors } = useThemeStore();
    const insets = useSafeAreaInsets();
    const { ledgerEntries, addLedgerExpense, netKhata, language, refreshAll, refreshing, loading } = useDriverAppContext();
    const t = translations[language];

    const [modalVisible, setModalVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const sortedEntries = useMemo(() => {
        return [...ledgerEntries].sort((a, b) => {
            const at = new Date(String(a.createdAt || a.entry_date || 0)).getTime();
            const bt = new Date(String(b.createdAt || b.entry_date || 0)).getTime();
            return bt - at;
        });
    }, [ledgerEntries]);

    const handleSave = async () => {
        if (!amount || !description) {
            Alert.alert(t.error, 'Please fill all fields');
            return;
        }

        try {
            await addLedgerExpense(Number(amount), description);
            setModalVisible(false);
            setAmount('');
            setDescription('');
        } catch {
            // alerts handled in hooks
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const paidByDriver = item.transaction_nature === 'paid_by_driver';
        const Icon = paidByDriver ? ArrowUpRight : ArrowDownLeft;
        const color = paidByDriver ? colors.destructive : colors.primary;
        const sign = paidByDriver ? '-' : '+';

        const dateValue = String(item.createdAt || item.entry_date || new Date().toISOString());
        const time = new Date(dateValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const isPending = item.approvalStatus === 'PENDING';
        const isRejected = item.approvalStatus === 'REJECTED';
        const isLegacy = item.source === 'OLD';

        return (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
                    <Icon color={color} size={24} />
                </View>

                <View style={styles.details}>
                    <Text style={[styles.desc, { color: colors.foreground }]}>{item.remarks || item.title || 'Ledger Entry'}</Text>

                    <View style={styles.metaRow}>
                        <Clock size={12} color={colors.mutedForeground} />
                        <Text style={[styles.date, { color: colors.mutedForeground }]}>{new Date(dateValue).toLocaleDateString()} | {time}</Text>
                    </View>

                    {/* Tags Row */}
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {/* Status Badge */}
                        {isPending && (
                            <View style={{ backgroundColor: '#fff7ed', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fdba74' }}>
                                <Text style={{ fontSize: 10, color: '#c2410c', fontWeight: '600' }}>PENDING</Text>
                            </View>
                        )}
                        {isRejected && (
                            <View style={{ backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fca5a5' }}>
                                <Text style={{ fontSize: 10, color: '#b91c1c', fontWeight: '600' }}>REJECTED</Text>
                            </View>
                        )}
                        {!isPending && !isRejected && !isLegacy && (
                            <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#86efac' }}>
                                <Text style={{ fontSize: 10, color: '#15803d', fontWeight: '600' }}>APPROVED</Text>
                            </View>
                        )}

                        {/* Legacy Badge */}
                        {isLegacy && (
                            <View style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 10, color: '#4b5563' }}>LEGACY</Text>
                            </View>
                        )}

                        {/* Trip Badge */}
                        {item.tripId && (
                            <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 10, color: '#1d4ed8' }}>TRIP LINKED</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.rightSide}>
                    <Text style={[styles.amount, { color }]}>{sign}Rs {item.amount}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Custom Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                paddingTop: insets.top + 12,
                backgroundColor: colors.background,
                borderBottomWidth: 1,
                borderBottomColor: colors.border
            }}>
                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                    <Ionicons name="menu" size={28} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>Trucksarthi</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>{t.totalBalance}</Text>
                <Text style={[styles.balanceValue, { color: netKhata >= 0 ? colors.primary : colors.destructive }]}>
                    {netKhata >= 0 ? '+' : '-'}Rs {Math.abs(netKhata)}
                </Text>
            </View>

            <FlatList
                data={sortedEntries}
                keyExtractor={(item) => String(item._id)}
                renderItem={renderItem}
                contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
                ListEmptyComponent={
                    loading ? (
                        <View style={{ paddingTop: 36, alignItems: "center" }}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : (
                        <View style={{ paddingTop: 36, alignItems: "center" }}>
                            <Text style={{ color: colors.mutedForeground }}>No transactions yet.</Text>
                        </View>
                    )
                }
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={8}
                removeClippedSubviews
            />

            <TouchableOpacity
                style={[
                    styles.fab,
                    {
                        backgroundColor: colors.primary,
                        bottom: 80 + insets.bottom,
                    }
                ]}
                onPress={() => setModalVisible(true)}
            >
                <Plus color="white" size={24} />
                <Text style={styles.fabText}>{t.addEntry}</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Expense</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color={colors.mutedForeground} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.amount}</Text>
                            <TextInput
                                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                placeholder={t.enterAmount}
                                placeholderTextColor={colors.mutedForeground}
                            />

                            <Text style={[styles.label, { color: colors.mutedForeground }]}>{t.description}</Text>
                            <TextInput
                                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder={t.enterDesc}
                                placeholderTextColor={colors.mutedForeground}
                            />

                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={[styles.actionButton, { width: '100%', backgroundColor: colors.destructive }]} onPress={handleSave}>
                                    <ArrowUpRight color="white" size={20} />
                                    <Text style={styles.actionButtonText}>Save Expense</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} topOffset={insets.top + 52} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    balanceCard: {
        padding: 16,
        margin: 16,
        marginBottom: 0,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 4,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        elevation: 2,
    },
    iconBox: {
        padding: 8,
        borderRadius: 999,
        marginRight: 16,
    },
    details: {
        flex: 1,
    },
    desc: {
        fontSize: 16,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    date: {
        fontSize: 12,
        marginLeft: 4,
    },
    rightSide: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 32,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 999,
        elevation: 5,
    },
    fabText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 16,
    },
    modalContent: {
        borderRadius: 16,
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
