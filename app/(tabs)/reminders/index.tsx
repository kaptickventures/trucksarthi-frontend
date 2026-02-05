import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
    ScrollView,
    Text,
    View,
    RefreshControl,
    TouchableOpacity
} from "react-native";
import "../../../global.css";
import { useThemeStore } from "../../../hooks/useThemeStore";
import useTruckDocuments from "../../../hooks/useTruckDocuments";
import { formatDate } from "../../../lib/utils";
import { useRouter } from "expo-router";

export default function RemindersScreen() {
    const { colors } = useThemeStore();
    const { documents, loading, fetchDocuments } = useTruckDocuments();
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDocuments();
        setRefreshing(false);
    }, [fetchDocuments]);

    const expiringDocs = documents.filter(doc => {
        if (!doc.expiry_date || doc.status === 'expired') return false;
        const expiry = new Date(doc.expiry_date);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
    });

    return (
        <ScrollView
            className="flex-1 p-4"
            style={{ backgroundColor: colors.background }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {expiringDocs.length === 0 ? (
                <View className="flex-1 items-center justify-center mt-32">
                    <Ionicons
                        name="notifications-off-outline"
                        size={60}
                        color={colors.mutedForeground}
                    />
                    <Text style={{ color: colors.mutedForeground }} className="text-lg font-medium mt-4">
                        No active reminders
                    </Text>
                    <Text style={{ color: colors.mutedForeground }} className="text-sm text-center px-8 mt-2">
                        We'll notify you here when your truck documents are about to expire.
                    </Text>
                </View>
            ) : (
                <>
                    <Text style={{ color: colors.foreground }} className="text-sm font-medium mb-4 ml-1">
                        YOU HAVE {expiringDocs.length} IMPORTANT REMINDERS
                    </Text>
                    {expiringDocs.map((doc) => {
                        const dateStr = doc.expiry_date ? formatDate(doc.expiry_date) : "No Date";
                        const getId = (obj: any): string => typeof obj === "object" ? obj?._id : obj;
                        const truckId = getId(doc.truck);

                        return (
                            <TouchableOpacity
                                key={doc._id}
                                onPress={() => router.push({
                                    pathname: "/document-details",
                                    params: { id: doc._id }
                                })}
                                style={{ backgroundColor: colors.card }}
                                className="rounded-2xl p-4 mb-3 flex-row items-center border border-transparent active:border-primary/20"
                            >
                                <View className="bg-red-100 p-2 rounded-full mr-4">
                                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start">
                                        <Text style={{ color: colors.foreground }} className="font-semibold text-base">
                                            {doc.document_type} Expiring
                                        </Text>
                                        <Text style={{ color: colors.destructive }} className="font-bold text-xs">
                                            {dateStr}
                                        </Text>
                                    </View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-xs mt-1">
                                        Truck ID: {truckId ? truckId.toString().slice(-6) : 'N/A'}
                                    </Text>
                                    <Text style={{ color: colors.primary }} className="text-[10px] mt-2 font-medium">
                                        TAP TO VIEW DETAILS →
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </>
            )}
            <View className="h-20" />
        </ScrollView>
    );
}
