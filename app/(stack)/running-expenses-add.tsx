import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QuickActionButton from "../../components/finance/QuickActionButton";
import useFinance from "../../hooks/useFinance";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";

const RUNNING_CATEGORIES = ["FUEL", "FASTAG_RECHARGE", "LOADING", "UNLOADING", "CHALLAN"] as const;

export default function RunningExpenseAddScreen() {
  const router = useRouter();
  const { truckId, category } = useLocalSearchParams<{ truckId?: string; category?: string }>();
  const { colors, theme } = useThemeStore();
  const { trucks } = useTrucks();
  const { loading, addRunningExpense } = useFinance();

  const [expenseCategory, setExpenseCategory] = useState<string>(
    RUNNING_CATEGORIES.includes((category || "") as any) ? String(category) : "FUEL"
  );
  const [amount, setAmount] = useState("");
  const [litres, setLitres] = useState("");
  const [kmReading, setKmReading] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [notes, setNotes] = useState("");

  const selectedTruck = useMemo(() => (trucks || []).find((t: any) => String(t._id) === String(truckId)), [trucks, truckId]);

  const onSave = async () => {
    if (!truckId) {
      Alert.alert("Truck Required", "Select a truck.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid amount.");
      return;
    }
    if (expenseCategory === "FUEL" && (!litres || !kmReading)) {
      Alert.alert("Missing Fields", "Fuel needs litres and KM.");
      return;
    }

    await addRunningExpense({
      truckId,
      category: expenseCategory,
      amount: Number(amount),
      paymentMode,
      notes,
      date: new Date().toISOString(),
      ...(expenseCategory === "FUEL" ? { litres: Number(litres), kmReading: Number(kmReading) } : {}),
    });

    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginLeft: 14 }}>Add Running</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 4 }}>Truck</Text>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "800" }}>{selectedTruck?.registration_number || "-"}</Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>Category</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {RUNNING_CATEGORIES.map((item) => (
              <QuickActionButton key={item} label={item.replace("_", " ")} active={expenseCategory === item} onPress={() => setExpenseCategory(item)} />
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          {expenseCategory === "FUEL" && (
            <>
              <Input label="Litres" value={litres} onChangeText={setLitres} keyboardType="numeric" />
              <Input label="KM" value={kmReading} onChangeText={setKmReading} keyboardType="numeric" />
            </>
          )}
          <Input label="Payment" value={paymentMode} onChangeText={setPaymentMode} />
          <Input label="Notes" value={notes} onChangeText={setNotes} />
          <TouchableOpacity onPress={onSave} style={{ backgroundColor: colors.primary, borderRadius: 10, alignItems: "center", padding: 13, marginTop: 6 }}>
            <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>{loading ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({ label, value, onChangeText, keyboardType }: { label: string; value: string; onChangeText: (v: string) => void; keyboardType?: "default" | "numeric" }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: colors.mutedForeground, marginBottom: 6, fontSize: 12, fontWeight: "700" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        placeholder={label}
        placeholderTextColor={colors.mutedForeground}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground }}
      />
    </View>
  );
}

