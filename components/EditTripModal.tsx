import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  Animated,
  PanResponder,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ---------------- Types ---------------- */
type DropdownKey = "truck" | "driver" | "client" | "start" | "end";

type FormKey =
  | "truck_id"
  | "driver_id"
  | "client_id"
  | "start_location_id"
  | "end_location_id"
  | "cost_of_trip"
  | "miscellaneous_expense"
  | "notes";

interface Props {
  visible: boolean;
  onClose: () => void;
  trip: any | null;
  trucks: any[];
  drivers: any[];
  clients: any[];
  locations: any[];
  onSave: (tripId: number, data: any) => Promise<void> | void;
  onDelete: (tripId: number) => Promise<void> | void;
}

export default function EditTripModal({
  visible,
  onClose,
  trip,
  trucks,
  drivers,
  clients,
  locations,
  onSave,
  onDelete,
}: Props) {
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const SCROLL_THRESHOLD = 40;

  // Dropdown open state
  const [dropdowns, setDropdowns] = useState<Record<DropdownKey, boolean>>({
    truck: false,
    driver: false,
    client: false,
    start: false,
    end: false,
  });

  const closeAllDropdowns = () =>
    setDropdowns({ truck: false, driver: false, client: false, start: false, end: false });

  // Form fields (excluding raw trip_date which we keep separately)
  const [form, setForm] = useState<Record<FormKey, string>>({
    truck_id: "",
    driver_id: "",
    client_id: "",
    start_location_id: "",
    end_location_id: "",
    cost_of_trip: "",
    miscellaneous_expense: "",
    notes: "",
  });

  // Keep raw trip_date returned by backend (send this exact string back)
  const [rawTripDate, setRawTripDate] = useState<string>("");

  // Derived display date (human-friendly). Will be read-only.
  const getDisplayDate = (raw: string) => {
    try {
      if (!raw) return "";
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toISOString().split("T")[0]; // YYYY-MM-DD display
    } catch {
      return raw;
    }
  };

  // Prefill when trip changes
  useEffect(() => {
    if (!trip) return;
    setRawTripDate(String(trip.trip_date ?? ""));
    setForm({
      truck_id: String(trip.truck_id ?? ""),
      driver_id: String(trip.driver_id ?? ""),
      client_id: String(trip.client_id ?? ""),
      start_location_id: String(trip.start_location_id ?? ""),
      end_location_id: String(trip.end_location_id ?? ""),
      cost_of_trip: String(trip.cost_of_trip ?? ""),
      miscellaneous_expense: String(trip.miscellaneous_expense ?? ""),
      notes: trip.notes ?? "",
    });
    // close dropdowns on open
    closeAllDropdowns();
  }, [trip]);

  // PanResponder for dragging modal down
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, g) => g.y0 < SCROLL_THRESHOLD,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120) closeModal();
        else
          Animated.timing(translateY, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      },
    })
  ).current;

  const closeModal = () => {
    closeAllDropdowns();
    Animated.timing(translateY, { toValue: 800, duration: 200, useNativeDriver: true }).start(() => {
      translateY.setValue(0);
      onClose();
    });
  };

  if (!trip) return null;

  const dropdownConfig = [
    {
      label: "Truck",
      key: "truck_id" as FormKey,
      openKey: "truck" as DropdownKey,
      items: trucks.map((t) => ({ label: t.registration_number, value: String(t.truck_id) })),
    },
    {
      label: "Driver",
      key: "driver_id" as FormKey,
      openKey: "driver" as DropdownKey,
      items: drivers.map((d) => ({ label: d.driver_name, value: String(d.driver_id) })),
    },
    {
      label: "Client",
      key: "client_id" as FormKey,
      openKey: "client" as DropdownKey,
      items: clients.map((c) => ({ label: c.client_name, value: String(c.client_id) })),
    },
    {
      label: "Start Location",
      key: "start_location_id" as FormKey,
      openKey: "start" as DropdownKey,
      items: locations.map((l) => ({ label: l.location_name, value: String(l.location_id) })),
    },
    {
      label: "End Location",
      key: "end_location_id" as FormKey,
      openKey: "end" as DropdownKey,
      items: locations.map((l) => ({ label: l.location_name, value: String(l.location_id) })),
    },
  ] as const;

  const handleSavePress = async () => {
    // validation
    if (
      !form.truck_id ||
      !form.driver_id ||
      !form.client_id ||
      !form.start_location_id ||
      !form.end_location_id ||
      !form.cost_of_trip
    ) {
      Alert.alert("Missing fields", "Please fill required fields (truck, driver, client, start, end, cost).");
      return;
    }

    // Payload: include trip_date exactly as returned by backend (rawTripDate)
    const payload = {
      trip_date: rawTripDate, // send EXACT backend value (Option C)
      truck_id: Number(form.truck_id),
      driver_id: Number(form.driver_id),
      client_id: Number(form.client_id),
      start_location_id: Number(form.start_location_id),
      end_location_id: Number(form.end_location_id),
      cost_of_trip: Number(form.cost_of_trip),
      miscellaneous_expense: Number(form.miscellaneous_expense || 0),
      notes: form.notes,
    };

    try {
      await onSave(trip.trip_id, payload);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save changes");
    }
  };

  const handleDeletePress = () => {
    Alert.alert("Confirm Delete", "Delete this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await onDelete(trip.trip_id);
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to delete trip");
          }
        },
      },
    ]);
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable className="flex-1 bg-black/40" onPress={closeModal}>
        <Animated.View
          {...panResponder.panHandlers}
          className="absolute bottom-0 w-full bg-background rounded-t-3xl"
          style={{ height: "100%", paddingHorizontal: 20, paddingTop: insets.top + 20, transform: [{ translateY }] }}
        >
          <View className="w-14 h-1.5 bg-muted rounded-full self-center mb-4 opacity-60" />

          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Edit Trip</Text>
            <TouchableOpacity onPress={closeModal}>
              <X size={28} color={isDark ? "#AAA" : "#666"} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Read-only date display (human-friendly) */}
            <Text className="text-muted-foreground mb-1 font-medium">Trip Date</Text>
            <TextInput value={getDisplayDate(rawTripDate)} editable={false} className="border border-input text-input-text rounded-xl p-3 mb-4 bg-input-bg opacity-90" />

            {/* Dropdowns */}
            {dropdownConfig.map((d, i) => (
              <View key={d.key} style={{ marginBottom: 20, zIndex: 5000 - i }}>
                <Text className="text-muted-foreground mb-1 font-medium">{d.label}</Text>

                <DropDownPicker
                  open={dropdowns[d.openKey]}
                  value={form[d.key]}
                  items={d.items}
                  setOpen={(open) => {
                    closeAllDropdowns();
                    setDropdowns((prev) => ({
                      ...prev,
                      [d.openKey]: typeof open === "function" ? open(prev[d.openKey]) : open,
                    }));
                  }}
                  setValue={(cb) => setForm((prev) => ({ ...prev, [d.key]: cb(prev[d.key]) }))}
                  placeholder={`Select ${d.label}`}
                  listMode="SCROLLVIEW"
                  maxHeight={150}
                  scrollViewProps={{ nestedScrollEnabled: true }}
                  style={{
                    height: 48,
                    backgroundColor: isDark ? "hsl(220 10% 18%)" : "hsl(0 0% 98%)",
                    borderColor: isDark ? "hsl(220 10% 35%)" : "hsl(0 0% 88%)",
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: isDark ? "hsl(220 15% 12%)" : "hsl(0 0% 98%)",
                    borderColor: isDark ? "hsl(220 10% 35%)" : "hsl(0 0% 88%)",
                  }}
                  textStyle={{ color: isDark ? "white" : "black" }}
                  placeholderStyle={{ color: isDark ? "#AAA" : "#555" }}
                />
              </View>
            ))}

            {/* Cost */}
            <Text className="text-muted-foreground mb-1 font-medium">Cost of Trip (₹)</Text>
            <TextInput keyboardType="numeric" value={form.cost_of_trip} onChangeText={(v) => setForm((p) => ({ ...p, cost_of_trip: v }))} className="border border-input text-input-text rounded-xl p-3 mb-4 bg-input-bg" />

            {/* Misc */}
            <Text className="text-muted-foreground mb-1 font-medium">Miscellaneous Expense (₹)</Text>
            <TextInput keyboardType="numeric" value={form.miscellaneous_expense} onChangeText={(v) => setForm((p) => ({ ...p, miscellaneous_expense: v }))} className="border border-input text-input-text rounded-xl p-3 mb-4 bg-input-bg" />

            {/* Notes */}
            <Text className="text-muted-foreground mb-1 font-medium">Notes</Text>
            <TextInput multiline numberOfLines={3} value={form.notes} onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))} className="border border-input text-input-text rounded-xl p-3 mb-6 bg-input-bg" />

            {/* Actions */}
            <TouchableOpacity onPress={handleSavePress} className="bg-primary p-4 rounded-xl mb-3">
              <Text className="text-center text-primary-foreground font-semibold">Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeletePress} className="bg-red-500 p-4 rounded-xl mb-3">
              <Text className="text-center text-white font-semibold">Delete Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={closeModal} className="border border-border p-4 rounded-xl">
              <Text className="text-center text-muted-foreground">Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
