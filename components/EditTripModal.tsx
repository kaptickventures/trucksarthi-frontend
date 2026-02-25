import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../global.css";
import { useThemeStore } from "../hooks/useThemeStore";

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
  onSave: (tripId: string, data: any) => Promise<void> | void;
  onDelete: (tripId: string) => Promise<void> | void;
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
  const { theme: themeName, colors: theme } = useThemeStore();
  const isDark = themeName === "dark";
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(0)).current;
  const SCROLL_THRESHOLD = 40;

  /* ---------------- Dropdown State ---------------- */
  const [dropdowns, setDropdowns] = useState<Record<DropdownKey, boolean>>({
    truck: false,
    driver: false,
    client: false,
    start: false,
    end: false,
  });

  const closeAllDropdowns = () =>
    setDropdowns({ truck: false, driver: false, client: false, start: false, end: false });

  /* ---------------- Form State ---------------- */
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

  const [rawTripDate, setRawTripDate] = useState<string>("");

  const getDisplayDate = (raw: string) => {
    try {
      if (!raw) return "";
      const d = new Date(raw);
      return isNaN(d.getTime()) ? raw : d.toISOString().split("T")[0];
    } catch {
      return raw;
    }
  };

  const getId = (obj: any): string => (typeof obj === "object" ? obj?._id : obj);

  useEffect(() => {
    if (!trip) return;

    setRawTripDate(String(trip.trip_date ?? ""));

    setForm({
      truck_id: String(getId(trip.truck) ?? ""),
      driver_id: String(getId(trip.driver) ?? ""),
      client_id: String(getId(trip.client) ?? ""),
      start_location_id: String(getId(trip.start_location) ?? ""),
      end_location_id: String(getId(trip.end_location) ?? ""),
      cost_of_trip: String(trip.cost_of_trip ?? ""),
      miscellaneous_expense: String(trip.miscellaneous_expense ?? ""),
      notes: trip.notes ?? "",
    });

    closeAllDropdowns();
  }, [trip]);

  /* ---------------- Modal Pan Gestures ---------------- */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, g) => g.y0 < SCROLL_THRESHOLD,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120) closeModal();
        else
          Animated.timing(translateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
      },
    })
  ).current;

  const closeModal = () => {
    closeAllDropdowns();
    Animated.timing(translateY, {
      toValue: 800,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      onClose();
    });
  };

  if (!trip) return null;

  /* ---------------- Dropdown Config ---------------- */
  const dropdownConfig = [
    {
      label: "Truck",
      key: "truck_id" as FormKey,
      openKey: "truck" as DropdownKey,
      items: trucks.map((t) => ({ label: t.registration_number, value: t._id })),
    },
    {
      label: "Driver",
      key: "driver_id" as FormKey,
      openKey: "driver" as DropdownKey,
      items: drivers.map((d) => ({ label: d.driver_name, value: d._id })),
    },
    {
      label: "Client",
      key: "client_id" as FormKey,
      openKey: "client" as DropdownKey,
      items: clients.map((c) => ({ label: c.client_name, value: c._id })),
    },
    {
      label: "Start Location",
      key: "start_location_id" as FormKey,
      openKey: "start" as DropdownKey,
      items: locations.map((l) => ({ label: l.location_name, value: l._id })),
    },
    {
      label: "End Location",
      key: "end_location_id" as FormKey,
      openKey: "end" as DropdownKey,
      items: locations.map((l) => ({ label: l.location_name, value: l._id })),
    },
  ] as const;

  /* ---------------- Action Handlers ---------------- */
  const handleSavePress = async () => {
    if (
      !form.truck_id ||
      !form.driver_id ||
      !form.client_id ||
      !form.start_location_id ||
      !form.end_location_id ||
      !form.cost_of_trip
    ) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }

    const payload = {
      trip_date: rawTripDate,
      truck: form.truck_id,
      driver: form.driver_id,
      client: form.client_id,
      start_location: form.start_location_id,
      end_location: form.end_location_id,
      cost_of_trip: Number(form.cost_of_trip),
      miscellaneous_expense: Number(form.miscellaneous_expense || 0),
      notes: form.notes,
    };

    try {
      await onSave(trip._id, payload);
    } catch {
      Alert.alert("Error", "Failed to save trip");
    }
  };

  const handleDeletePress = () => {
    Alert.alert("Delete Trip", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await onDelete(trip._id);
          } catch {
            Alert.alert("Error", "Failed to delete trip");
          }
        },
      },
    ]);
  };

  /* ---------------- UI ---------------- */
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable className="flex-1 bg-black/40" onPress={closeModal}>
        <Animated.View
          {...panResponder.panHandlers}
          className="absolute bottom-0 w-full rounded-t-3xl"
          style={{
            height: "100%",
            paddingHorizontal: 20,
            paddingTop: insets.top + 20,
            backgroundColor: theme.background,
            transform: [{ translateY }],
          }}
        >
          <View
            className="w-14 h-1.5 rounded-full self-center mb-4 opacity-60"
            style={{ backgroundColor: theme.muted }}
          />

          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-2xl font-semibold" style={{ color: theme.foreground }}>Edit Trip</Text>
            <TouchableOpacity onPress={closeModal}>
              <X size={28} color={theme.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Date (readonly) */}
            <Text className="mb-1 font-medium" style={{ color: theme.mutedForeground }}>Trip Date</Text>
            <TextInput
              editable={false}
              value={getDisplayDate(rawTripDate)}
              className="border rounded-xl p-3 mb-4 opacity-90"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.foreground
              }}
            />

            {/* Dropdowns */}
            {dropdownConfig.map((d, i) => (
              <View key={d.key} style={{ marginBottom: 20, zIndex: 5000 - i }}>
                <Text className="mb-1 font-medium" style={{ color: theme.mutedForeground }}>{d.label}</Text>

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
                  setValue={(cb) =>
                    setForm((prev) => ({ ...prev, [d.key]: cb(prev[d.key]) }))
                  }
                  placeholder={`Select ${d.label}`}
                  listMode="SCROLLVIEW"
                  maxHeight={150}
                  scrollViewProps={{ nestedScrollEnabled: true }}
                  style={{
                    height: 48,
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  }}
                  textStyle={{ color: theme.foreground }}
                  placeholderStyle={{ color: theme.mutedForeground }}
                />
              </View>
            ))}

            {/* Cost */}
            <Text className="mb-1 font-medium" style={{ color: theme.mutedForeground }}>Cost of Trip (₹)</Text>
            <TextInput
              keyboardType="numeric"
              value={form.cost_of_trip}
              onChangeText={(v: string) => setForm((p) => ({ ...p, cost_of_trip: v }))}
              className="border rounded-xl p-3 mb-4"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.foreground
              }}
              placeholderTextColor={theme.mutedForeground}
            />

            {/* Misc */}
            <Text className="mb-1 font-medium" style={{ color: theme.mutedForeground }}>Miscellaneous Expense (₹)</Text>
            <TextInput
              keyboardType="numeric"
              value={form.miscellaneous_expense}
              onChangeText={(v: string) => setForm((p) => ({ ...p, miscellaneous_expense: v }))}
              className="border rounded-xl p-3 mb-4"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.foreground
              }}
              placeholderTextColor={theme.mutedForeground}
            />

            {/* Notes */}
            <Text className="mb-1 font-medium" style={{ color: theme.mutedForeground }}>Notes</Text>
            <TextInput
              multiline
              numberOfLines={3}
              value={form.notes}
              onChangeText={(v: string) => setForm((p) => ({ ...p, notes: v }))}
              className="border rounded-xl p-3 mb-6"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.foreground
              }}
              placeholderTextColor={theme.mutedForeground}
            />

            {/* Actions */}
            <TouchableOpacity onPress={handleSavePress} className="bg-primary p-4 rounded-xl mb-3">
              <Text className="text-center font-semibold" style={{ color: theme.primaryForeground }}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeletePress}
              className="p-4 rounded-xl mb-3"
              style={{ backgroundColor: theme.destructive }}
            >
              <Text className="text-center font-semibold" style={{ color: 'white' }}>Delete Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeModal}
              className="border p-4 rounded-xl"
              style={{ borderColor: theme.border }}
            >
              <Text className="text-center" style={{ color: theme.mutedForeground }}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
