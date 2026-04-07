import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useTruckDocuments from "../../hooks/useTruckDocuments";
import useTrucks from "../../hooks/useTruck";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate, formatLabel } from "../../lib/utils";

type ReminderRow = {
  truckName: string;
  docLabel: string;
  expiryDate: Date;
  isExpired: boolean;
  id: string;
};

export default function ReminderDetailScreen() {
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const router = useRouter();
  const { title, status, reminderId } = useLocalSearchParams<{ title?: string; status?: string; reminderId?: string }>();
  const { documents } = useTruckDocuments();
  const { trucks } = useTrucks();
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const parseExpiryDate = (value: any): Date | null => {
    if (!value) return null;
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;
    return null;
  };

  const getDaysLeft = (expiry: Date) => {
    const today = new Date();
    const expiryStart = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = expiryStart.getTime() - todayStart.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const rows = useMemo<ReminderRow[]>(() => {
    const desiredState = status === "expired" ? "expired" : "expiring";
    return documents
      .map((doc) => {
        const expiry = parseExpiryDate(doc.expiry_date);
        if (!expiry) return null;
        const daysLeft = getDaysLeft(expiry);
        const isExpired = daysLeft < 0;
        if (desiredState === "expired" && !isExpired) return null;
        if (desiredState === "expiring" && isExpired) return null;
        const truckId = typeof doc.truck === "object" ? doc.truck?._id : doc.truck;
        const truck = trucks.find((t) => String(t._id) === String(truckId));
        return {
          id: `${doc._id}`,
          truckName: truck?.registration_number || (typeof doc.truck === "object" ? doc.truck?.registration_number : "N/A"),
          docLabel: formatLabel(doc.document_type || "Document"),
          expiryDate: expiry,
          isExpired,
        };
      })
      .filter(Boolean) as ReminderRow[];
  }, [documents, trucks, status]);

  const markComplete = async (itemId: string) => {
    const next = new Set([...doneIds, itemId]);
    setDoneIds(next);
    try {
      const completedReminderStorageKey = "notifications:completed-reminders";
      const existing = await AsyncStorage.getItem(completedReminderStorageKey);
      const parsed = existing ? JSON.parse(existing) : [];
      const merged = Array.from(new Set([...(Array.isArray(parsed) ? parsed : []), String(reminderId || ""), itemId]));
      await AsyncStorage.setItem(completedReminderStorageKey, JSON.stringify(merged));
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={{ marginBottom: 14 }}>
          <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "900" }}>{title || "Reminder Details"}</Text>
          <Text style={{ color: colors.mutedForeground, marginTop: 6 }}>
            Tick renewed items to remove them from reminders.
          </Text>
        </View>

        {rows.filter((r) => !doneIds.has(r.id)).length === 0 ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.mutedForeground }}>No matching reminders found.</Text>
          </View>
        ) : (
          rows
            .filter((r) => !doneIds.has(r.id))
            .map((row) => (
              <View
                key={row.id}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "800" }}>{row.truckName}</Text>
                <Text style={{ color: colors.mutedForeground, marginTop: 4, fontSize: 13 }}>{row.docLabel}</Text>
                <Text style={{ color: row.isExpired ? colors.destructive : colors.warning, marginTop: 2, fontSize: 12, fontWeight: "700" }}>
                  {row.isExpired ? "Expired" : "Expiring"} on {formatDate(row.expiryDate)}
                </Text>
                <TouchableOpacity
                  onPress={() => void markComplete(row.id)}
                  style={{
                    marginTop: 10,
                    alignSelf: "flex-end",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    borderWidth: 1,
                    borderColor: colors.success + "55",
                    backgroundColor: colors.successSoft,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Ionicons name="checkmark" size={14} color={colors.success} />
                  <Text style={{ color: colors.success, fontWeight: "800", fontSize: 12 }}>Renewed</Text>
                </TouchableOpacity>
              </View>
            ))
        )}

        <TouchableOpacity
          onPress={() => {
            Alert.alert("Done", "Reminder statuses updated.");
            router.back();
          }}
          style={{
            marginTop: 8,
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Back to Notifications</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

