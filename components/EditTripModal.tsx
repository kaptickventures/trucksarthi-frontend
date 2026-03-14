import { X, Calendar, MapPin, Truck, User, IndianRupee, FileText, ChevronDown, Navigation, Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../global.css";
import { useThemeStore } from "../hooks/useThemeStore";
import { SelectionModal } from "./SelectionModal";
import { DatePickerModal } from "./DatePickerModal";
import { formatDate } from "../lib/utils";
import BottomSheet from "./BottomSheet";

/* ---------------- Types ---------------- */
type ModalKey = "truck" | "driver" | "client" | "start" | "end" | null;

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
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();

  /* ---------------- Modal State ---------------- */
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const [rawTripDate, setRawTripDate] = useState<Date>(new Date());

  const getId = (obj: any): string => (typeof obj === "object" ? obj?._id : obj);

  useEffect(() => {
    if (!trip) return;

    try {
      if (trip.trip_date) {
        const d = new Date(trip.trip_date);
        if (!isNaN(d.getTime())) setRawTripDate(d);
      }
    } catch { }

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

  }, [trip]);

  const closeModal = () => {
    onClose();
  };

  if (!trip) return null;

  /* ---------------- Entity Selectors ---------------- */
  const getSelectedLabel = (type: 'truck' | 'driver' | 'client' | 'start' | 'end') => {
    switch (type) {
      case 'truck': return trucks.find(t => t._id === form.truck_id)?.registration_number;
      case 'driver': {
        const driver = drivers.find(d => d._id === form.driver_id);
        return driver?.name || driver?.driver_name;
      }
      case 'client': return clients.find(c => c._id === form.client_id)?.client_name;
      case 'start': return locations.find(l => l._id === form.start_location_id)?.location_name;
      case 'end': return locations.find(l => l._id === form.end_location_id)?.location_name;
      default: return "";
    }
  };

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
      trip_date: rawTripDate.toISOString(),
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
      closeModal();
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
            closeModal();
          } catch {
            Alert.alert("Error", "Failed to delete trip");
          }
        },
      },
    ]);
  };

  /* ---------------- UI Components ---------------- */
  function InputLabel({ label, required }: { label: string; required?: boolean }) {
    return (
      <Text className="text-[12px] font-bold uppercase tracking-wider mb-2 mt-4 ml-1 opacity-60" style={{ color: colors.foreground }}>
        {label} {required && <Text style={{ color: colors.destructive }}>*</Text>}
      </Text>
    );
  }

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={closeModal}
        title="Edit Trip"
        subtitle={`${trip?.public_id ? `${trip.public_id} • ` : ''}Update journey`}
      >

              {/* Header */}
              <View className="flex-row justify-between items-center mb-6 px-6">
                <View>
                  <Text style={{ color: colors.foreground }} className="text-2xl font-black tracking-tight">Edit Trip</Text>
                  <Text className="text-muted-foreground text-[10px] font-black mt-1 uppercase tracking-[2px] opacity-60">
                    {trip?.public_id ? `${trip.public_id} • ` : ''}Update journey
                  </Text>
                </View>
                <TouchableOpacity onPress={closeModal} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.muted + '40' }}>
                  <X size={22} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={140}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
              >
                {/* Date Selector */}
                <InputLabel label={"Trip Date"} required />
                <TouchableOpacity
                  style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View className="flex-row items-center flex-1">
                    <Calendar size={20} color={colors.primary} />
                    <Text className="ml-3 text-base font-bold" style={{ color: colors.foreground }}>{formatDate(rawTripDate.toISOString().split('T')[0])}</Text>
                  </View>
                  <ChevronDown size={20} color={colors.mutedForeground} />
                </TouchableOpacity>

                {/* Client Selector */}
                <InputLabel label={"Client"} required />
                <TouchableOpacity
                  style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}
                  onPress={() => setActiveModal('client')}
                >
                  <View className="flex-row items-center flex-1">
                    <User size={20} color={colors.primary} />
                    <Text
                      numberOfLines={1}
                      className="ml-3 text-base font-bold"
                      style={{ color: getSelectedLabel('client') ? colors.foreground : colors.mutedForeground }}
                    >
                      {getSelectedLabel('client') || "Select Client"}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={colors.mutedForeground} />
                </TouchableOpacity>

                <View className="flex-row gap-4">
                  {/* Origin */}
                  <View className="flex-1">
                    <InputLabel label={"Origin"} required />
                    <TouchableOpacity
                      style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}
                      onPress={() => setActiveModal('start')}
                    >
                      <View className="flex-row items-center flex-1">
                        <MapPin size={20} color={colors.primary} />
                        <Text
                          numberOfLines={1}
                          className="ml-2 text-base font-bold"
                          style={{ color: getSelectedLabel('start') ? colors.foreground : colors.mutedForeground }}
                        >
                          {getSelectedLabel('start') || "From"}
                        </Text>
                      </View>
                      <ChevronDown size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  {/* Destination */}
                  <View className="flex-1">
                    <InputLabel label={"Destination"} required />
                    <TouchableOpacity
                      style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}
                      onPress={() => setActiveModal('end')}
                    >
                      <View className="flex-row items-center flex-1">
                        <Navigation size={20} color={colors.primary} />
                        <Text
                          numberOfLines={1}
                          className="ml-2 text-base font-bold"
                          style={{ color: getSelectedLabel('end') ? colors.foreground : colors.mutedForeground }}
                        >
                          {getSelectedLabel('end') || "To"}
                        </Text>
                      </View>
                      <ChevronDown size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row gap-4">
                  {/* Truck */}
                  <View className="flex-1">
                    <InputLabel label={"Truck"} required />
                    <TouchableOpacity
                      style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}
                      onPress={() => setActiveModal('truck')}
                    >
                      <View className="flex-row items-center flex-1">
                        <Truck size={20} color={colors.primary} />
                        <Text
                          numberOfLines={1}
                          className="ml-2 text-base font-bold"
                          style={{ color: getSelectedLabel('truck') ? colors.foreground : colors.mutedForeground }}
                        >
                          {getSelectedLabel('truck') || "Truck"}
                        </Text>
                      </View>
                      <ChevronDown size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  {/* Driver */}
                  <View className="flex-1">
                    <InputLabel label={"Driver"} required />
                    <TouchableOpacity
                      style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}
                      onPress={() => setActiveModal('driver')}
                    >
                      <View className="flex-row items-center flex-1">
                        <User size={20} color={colors.primary} />
                        <Text
                          numberOfLines={1}
                          className="ml-2 text-base font-bold"
                          style={{ color: getSelectedLabel('driver') ? colors.foreground : colors.mutedForeground }}
                        >
                          {getSelectedLabel('driver') || "Driver"}
                        </Text>
                      </View>
                      <ChevronDown size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Pricing Row */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <InputLabel label={"Freight Cost"} required />
                    <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}>
                      <IndianRupee size={18} color={colors.primary} />
                      <TextInput
                        placeholder="0.00"
                        keyboardType="numeric"
                        className="flex-1 ml-2 text-base font-bold"
                        style={{ color: colors.foreground }}
                        value={form.cost_of_trip}
                        onChangeText={(t) => setForm({ ...form, cost_of_trip: t })}
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                  </View>
                  <View className="flex-1">
                    <InputLabel label="Misc Expenses" />
                    <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}>
                      <IndianRupee size={18} color={colors.primary} />
                      <TextInput
                        placeholder="0.00"
                        keyboardType="numeric"
                        className="flex-1 ml-2 text-base font-bold"
                        style={{ color: colors.foreground }}
                        value={form.miscellaneous_expense}
                        onChangeText={(t) => setForm({ ...form, miscellaneous_expense: t })}
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                  </View>
                </View>

                {/* Notes */}
                <InputLabel label={"Trip Notes"} />
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input, height: 100, alignItems: 'flex-start', paddingTop: 16 }]}>
                  <View style={{ marginTop: 2 }}>
                    <FileText size={18} color={colors.primary} />
                  </View>
                  <TextInput
                    placeholder={"Any additional details..."}
                    multiline
                    numberOfLines={4}
                    className="flex-1 ml-2 text-base font-bold"
                    style={{ color: colors.foreground, textAlignVertical: 'top', marginTop: -4 }}
                    value={form.notes}
                    onChangeText={(t) => setForm({ ...form, notes: t })}
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{ backgroundColor: colors.primary }}
                  className="mt-8 h-16 rounded-[22px] items-center justify-center shadow-lg shadow-primary/30"
                  onPress={handleSavePress}
                >
                  <Text className="text-white text-lg font-black tracking-wide">SAVE CHANGES</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeletePress}
                  className="mt-4 p-4 rounded-xl mb-3 flex-row items-center justify-center"
                  style={{ backgroundColor: colors.destructive + '15' }}
                >
                  <Text className="text-center font-bold" style={{ color: colors.destructive }}>DELETE TRIP</Text>
                </TouchableOpacity>

              </KeyboardAwareScrollView>

        {/* Select Modals */}
        <SelectionModal
          visible={activeModal === 'truck'}
          onClose={() => setActiveModal(null)}
          title="Select Truck"
          items={trucks.map(t => ({ label: t.registration_number, value: t._id }))}
          onSelect={(val) => setForm({ ...form, truck_id: val })}
          selectedValue={form.truck_id}
        />
        <SelectionModal
          visible={activeModal === 'driver'}
          onClose={() => setActiveModal(null)}
          title="Select Driver"
          items={drivers.map(d => ({ label: d.driver_name || d.name || "Driver", value: d._id }))}
          onSelect={(val) => setForm({ ...form, driver_id: val })}
          selectedValue={form.driver_id}
        />
        <SelectionModal
          visible={activeModal === 'client'}
          onClose={() => setActiveModal(null)}
          title="Select Client"
          items={clients.map(c => ({ label: c.client_name, value: c._id }))}
          onSelect={(val) => setForm({ ...form, client_id: val })}
          selectedValue={form.client_id}
        />
        <SelectionModal
          visible={activeModal === 'start'}
          onClose={() => setActiveModal(null)}
          title="Select Origin"
          items={locations.map(l => ({ label: l.location_name, value: l._id }))}
          onSelect={(val) => setForm({ ...form, start_location_id: val })}
          selectedValue={form.start_location_id}
        />
        <SelectionModal
          visible={activeModal === 'end'}
          onClose={() => setActiveModal(null)}
          title="Select Destination"
          items={locations.map(l => ({ label: l.location_name, value: l._id }))}
          onSelect={(val) => setForm({ ...form, end_location_id: val })}
          selectedValue={form.end_location_id}
        />

        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          date={rawTripDate}
          onChange={(d) => setRawTripDate(d)}
        />

      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }
});
