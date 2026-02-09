import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../../../hooks/useThemeStore';
import { getCurrentUser } from '../../../hooks/useAuth';
import { Truck, MapPin, Clock, Wallet, ChevronRight } from 'lucide-react-native';

export default function DriverHome() {
    const { colors, theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await getCurrentUser();
        setUser(userData);
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ padding: 20, paddingTop: 60 }}
        >
            <View style={{ marginBottom: 30 }}>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Welcome back,
                </Text>
                <Text style={{ fontSize: 28, fontWeight: '800', color: colors.foreground, marginTop: 4 }}>
                    {user?.name || 'Driver'} 👋
                </Text>
            </View>

            {/* Stats Cards */}
            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 30 }}>
                <View style={{
                    flex: 1,
                    backgroundColor: isDark ? colors.card : '#F0F9FF',
                    padding: 20,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: isDark ? colors.border : '#E0F2FE'
                }}>
                    <View style={{ backgroundColor: '#0EA5E9', width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                        <Truck size={20} color="white" />
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground }}>12</Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600', marginTop: 4 }}>Trips this month</Text>
                </View>

                <View style={{
                    flex: 1,
                    backgroundColor: isDark ? colors.card : '#F0FDF4',
                    padding: 20,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: isDark ? colors.border : '#DCFCE7'
                }}>
                    <View style={{ backgroundColor: '#22C55E', width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                        <Wallet size={20} color="white" />
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground }}>₹4.5k</Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600', marginTop: 4 }}>Net Earnings</Text>
                </View>
            </View>

            {/* Active Trip Section */}
            <View style={{ marginBottom: 30 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.foreground, marginBottom: 15 }}>
                    Active Trip
                </Text>

                <View style={{
                    backgroundColor: isDark ? colors.card : 'white',
                    borderRadius: 28,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: isDark ? colors.border : '#F1F5F9',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 2
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
                            <Text style={{ color: '#D97706', fontSize: 12, fontWeight: '800' }}>IN PROGRESS</Text>
                        </View>
                        <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '600' }}>TRP-8829</Text>
                    </View>

                    <View style={{ gap: 20 }}>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <View style={{ alignItems: 'center' }}>
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />
                                <View style={{ width: 2, flex: 1, backgroundColor: isDark ? colors.border : '#E2E8F0', marginVertical: 4 }} />
                                <MapPin size={16} color="#64748B" />
                            </View>
                            <View style={{ flex: 1, gap: 15 }}>
                                <View>
                                    <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600' }}>FROM</Text>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>Mumbai Port, MH</Text>
                                </View>
                                <View>
                                    <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600' }}>TO</Text>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>Bangalore Terminal, KA</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={{
                        backgroundColor: colors.primary,
                        borderRadius: 18,
                        paddingVertical: 16,
                        alignItems: 'center',
                        marginTop: 25,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8
                    }}>
                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>View Details</Text>
                        <ChevronRight size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* History Section */}
            <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.foreground }}>Recent History</Text>
                    <TouchableOpacity>
                        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>View All</Text>
                    </TouchableOpacity>
                </View>

                {[1, 2].map((i) => (
                    <TouchableOpacity key={i} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isDark ? colors.card : 'white',
                        padding: 16,
                        borderRadius: 20,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: isDark ? colors.border : '#F1F5F9'
                    }}>
                        <View style={{ backgroundColor: isDark ? colors.background : '#F8FAFC', width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                            <Clock size={22} color={colors.mutedForeground} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>Delhi to Jaipur</Text>
                            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>Completed on 12 Feb</Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.foreground }}>₹1,200</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}
