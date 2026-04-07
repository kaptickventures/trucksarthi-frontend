import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";

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
  const { title, reminderId, trucks, docLabel } = useLocalSearchParams<{ title?: string; status?: string; reminderId?: string; trucks?: string; docLabel?: string }>();
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const rows = useMemo<ReminderRow[]>(() => {
    try {
      const parsed = JSON.parse(String(trucks || "[]"));
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item: any, idx: number) => {
          const expiry = new Date(item?.expiryDate);
          const validExpiry = !Number.isNaN(expiry.getTime()) ? expiry : new Date();
          const today = new Date();
          const isExpired = validExpiry.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          return {
            id: String(item?.truckName || `truck-${idx}`),
            truckName: String(item?.truckName || "N/A"),
            docLabel: String(docLabel || "Document"),
            expiryDate: validExpiry,
            isExpired,
          };
        })
        .filter(Boolean) as ReminderRow[];
    } catch {
      return [];
    }
  }, [trucks, docLabel]);

  const markComplete = async (itemId: string) => {
    const next = new Set([...doneIds, itemId]);
    setDoneIds(next);
    try {
      const truckMapKey = "notifications:completed-reminder-trucks";
      const completedReminderStorageKey = "notifications:completed-reminders";
      const [existingMapRaw, existingDoneRaw] = await Promise.all([
        AsyncStorage.getItem(truckMapKey),
        AsyncStorage.getItem(completedReminderStorageKey),
      ]);
      const parsedMap = existingMapRaw ? JSON.parse(existingMapRaw) : {};
      const parsedDone = existingDoneRaw ? JSON.parse(existingDoneRaw) : [];

      const reminderKey = String(reminderId || "");
      const existingForReminder = Array.isArray(parsedMap?.[reminderKey]) ? parsedMap[reminderKey] : [];
      const nextForReminder = Array.from(new Set([...existingForReminder, itemId]));
      const nextMap = { ...(parsedMap || {}), [reminderKey]: nextForReminder };
      await AsyncStorage.setItem(truckMapKey, JSON.stringify(nextMap));

      const remainingAfterThis = rows.filter((row) => !next.has(row.id));
      if (remainingAfterThis.length === 0 && reminderKey) {
        const mergedDone = Array.from(new Set([...(Array.isArray(parsedDone) ? parsedDone : []), reminderKey]));
        await AsyncStorage.setItem(completedReminderStorageKey, JSON.stringify(mergedDone));
      }
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
            if (typeof router.canGoBack === "function" && router.canGoBack()) {
              router.back();
              return;
            }
            router.replace("/(stack)/notifications?tab=reminders" as any);
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
