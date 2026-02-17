import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Pencil,
  Share2,
  Truck,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import { formatDate as globalFormatDate } from "../../lib/utils";

/* ---------------- HELPERS ---------------- */

const isExpiringSoon = (date: string) => {
  if (!date) return false;
  const diff =
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 30;
};

const getVehicleAge = (dateString?: string) => {
  if (!dateString) return "N/A";
  const regDate = new Date(dateString);
  const now = new Date();

  let years = now.getFullYear() - regDate.getFullYear();
  let months = now.getMonth() - regDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years}y ${months}m`;
};

const formatDate = (dateString?: string) => globalFormatDate(dateString);

const toIsoDate = (input?: string) => {
  if (!input) return undefined;
  const trimmed = input.trim();

  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return undefined;
};

const formatLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeDisplayValue = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "na") return null;
    return trimmed;
  }
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const parts = value.map((item) => normalizeDisplayValue(item)).filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }
  if (typeof value === "object") {
    const serialized = JSON.stringify(value);
    return serialized === "{}" ? null : serialized;
  }
  return String(value);
};

/* ---------------- COMPONENTS ---------------- */

const DetailItem = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useThemeStore();
  return (
    <View className="mb-6 w-[48%]">
      <Text style={{ color: colors.mutedForeground }} className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </Text>
      <Text style={{ color: colors.foreground }} className="text-sm font-bold mt-1">
        {value}
      </Text>
    </View>
  );
};

const DateItem = ({ label, date }: any) => {
  const { colors } = useThemeStore();
  const expiring = isExpiringSoon(date);
  return (
    <View className="flex-row justify-between items-center py-4 border-b border-border/10 last:border-0">
      <Text style={{ color: colors.mutedForeground }} className="text-xs font-bold opacity-80">{label}</Text>
      <View className="flex-row items-center">
        {expiring && (
          <View className="bg-red-500/10 px-2 py-0.5 rounded mr-2">
            <Text className="text-[9px] text-red-500 font-black uppercase">Urgent</Text>
          </View>
        )}
        <Text style={{ color: expiring ? colors.destructive : colors.foreground }} className="font-bold text-xs">
          {formatDate(date)}
        </Text>
      </View>
    </View>
  );
};

/* ---------------- SCREEN ---------------- */

export default function TruckProfile() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();

  const { truck_id } = useLocalSearchParams<{ truck_id?: string | string[] }>();
  const id = useMemo(() => Array.isArray(truck_id) ? truck_id[0] : truck_id, [truck_id]);

  const { trucks, loading: trucksLoading, updateTruck, updateImportantDates, fetchTrucks } = useTrucks();

  const [refreshing, setRefreshing] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [showOtherDetails, setShowOtherDetails] = useState(false);

  const [dateField, setDateField] = useState<string | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Record<string, boolean>>({
    registration_number: true,
    make_model: true,
    registered_owner_name: true,
    chassis_number: false,
    engine_number: false,
    fuel_norms: false,
    unladen_weight: false,
    vehicle_age: false,
    fitness_upto: false,
    insurance_upto: false,
  });

  const [editForm, setEditForm] = useState({
    registration_number: "",
    chassis_number: "",
    engine_number: "",
    make: "",
    model: "",
    vehicle_class: "",
    fuel_type: "",
    fuel_norms: "",
    unladen_weight: "",
    registered_rto: "",
    registered_owner_name: "",
    container_dimension: "",
    loading_capacity: "",
    registration_date: "",
    fitness_upto: "",
    pollution_upto: "",
    road_tax_upto: "",
    insurance_upto: "",
    permit_upto: "",
    national_permit_upto: "",
  });

  const truck = useMemo(() => trucks.find((t) => t._id === id), [trucks, id]);
  const sectionOneItems = useMemo(() => {
    if (!truck) return [];
    const resolvedRegistrationDate =
      toIsoDate(String(truck.registration_date || "")) ||
      toIsoDate(truck.rc_details?.reg_date) ||
      toIsoDate(truck.rc_details?.status_as_on);
    return [
      { key: "chassis_number", label: "Chassis No.", value: normalizeDisplayValue(truck.chassis_number) },
      { key: "engine_number", label: "Engine No.", value: normalizeDisplayValue(truck.engine_number) },
      { key: "vehicle_class", label: "Vehicle Class", value: normalizeDisplayValue(truck.vehicle_class || truck.rc_details?.class) },
      { key: "fuel_norms", label: "Norms", value: normalizeDisplayValue(truck.fuel_norms || truck.rc_details?.norms_type) },
      {
        key: "registration_date",
        label: "Registration Date",
        value: resolvedRegistrationDate ? normalizeDisplayValue(formatDate(resolvedRegistrationDate as string)) : null
      },
      {
        key: "vehicle_age",
        label: "Vehicle Age",
        value: resolvedRegistrationDate ? normalizeDisplayValue(getVehicleAge(resolvedRegistrationDate as string)) : null
      },
    ].filter((item) => Boolean(item.value));
  }, [truck]);
  const importantDateItems = useMemo(() => {
    if (!truck) return [];
    return [
      { label: "Insurance Upto", date: truck.insurance_upto },
      { label: "PUCC Upto", date: truck.pollution_upto },
      { label: "Fitness Upto", date: truck.fitness_upto },
      { label: "Road Tax Upto", date: truck.road_tax_upto },
      { label: "Permit Upto", date: truck.permit_upto },
      { label: "National Permit Upto", date: truck.national_permit_upto },
    ].filter((item) => normalizeDisplayValue(item.date));
  }, [truck]);
  const moreDetailsEntries = useMemo(() => {
    if (!truck) return [];

    const primaryKeys = new Set([
      "registration_number",
      "registered_owner_name",
      "vehicle_class",
      "fuel_norms",
      "registration_date",
      "insurance_upto",
      "pollution_upto",
      "fitness_upto",
      "road_tax_upto",
      "permit_upto",
      "national_permit_upto",
      "chassis_number",
      "engine_number",
      "rc_details",
      "_id",
      "user",
      "createdAt",
      "updatedAt",
      "__v",
      "split_present_address",
      "split_permanent_address",
    ]);

    const detailsMap = new Map<string, string>();
    const addEntry = (key: string, raw: any) => {
      const val = normalizeDisplayValue(raw);
      if (!val || primaryKeys.has(key)) return;
      detailsMap.set(key, val);
    };

    Object.entries(truck).forEach(([key, value]) => addEntry(key, value));
    if (truck.rc_details && typeof truck.rc_details === "object") {
      Object.entries(truck.rc_details).forEach(([key, value]) => addEntry(key, value));
    }

    return Array.from(detailsMap.entries()).map(([key, value]) => ({ key, label: formatLabel(key), value }));
  }, [truck]);

  useEffect(() => {
    if (truck) {
      setEditForm({
        registration_number: truck.registration_number || "",
        chassis_number: truck.chassis_number || "",
        engine_number: truck.engine_number || "",
        make: truck.make || "",
        model: truck.vehicle_model || "",
        vehicle_class: truck.vehicle_class || "",
        fuel_type: truck.fuel_type || "",
        fuel_norms: truck.fuel_norms || "",
        unladen_weight: truck.unladen_weight ? String(truck.unladen_weight) : "",
        registered_rto: truck.registered_rto || "",
        registered_owner_name: truck.registered_owner_name || "",
        container_dimension: truck.container_dimension || "",
        loading_capacity: truck.loading_capacity ? String(truck.loading_capacity) : "",
        registration_date: truck.registration_date ? new Date(truck.registration_date).toISOString().split('T')[0] : "",
        fitness_upto: truck.fitness_upto ? new Date(truck.fitness_upto).toISOString().split('T')[0] : "",
        pollution_upto: truck.pollution_upto ? new Date(truck.pollution_upto).toISOString().split('T')[0] : "",
        road_tax_upto: truck.road_tax_upto ? new Date(truck.road_tax_upto).toISOString().split('T')[0] : "",
        insurance_upto: truck.insurance_upto ? new Date(truck.insurance_upto).toISOString().split('T')[0] : "",
        permit_upto: truck.permit_upto ? new Date(truck.permit_upto).toISOString().split('T')[0] : "",
        national_permit_upto: truck.national_permit_upto ? new Date(truck.national_permit_upto).toISOString().split('T')[0] : "",
      });
    }
  }, [truck]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTrucks();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchTrucks]);



  const handleUpdateTruck = async () => {
    if (!id) return;
    try {
      const { registration_date, fitness_upto, pollution_upto, road_tax_upto, insurance_upto, permit_upto, national_permit_upto, ...basicInfo } = editForm;
      const dateUpdates = { registration_date: registration_date || null, fitness_upto: fitness_upto || null, pollution_upto: pollution_upto || null, road_tax_upto: road_tax_upto || null, insurance_upto: insurance_upto || null, permit_upto: permit_upto || null, national_permit_upto: national_permit_upto || null };

      await Promise.all([
        updateTruck(id, { ...basicInfo, unladen_weight: basicInfo.unladen_weight ? Number(basicInfo.unladen_weight) : undefined, loading_capacity: basicInfo.loading_capacity ? Number(basicInfo.loading_capacity) : undefined }),
        updateImportantDates(id, dateUpdates)
      ]);
      setShowEditModal(false);
      Alert.alert("Success", "Truck details updated");
    } catch (e) {
      Alert.alert("Error", "Failed to update truck details");
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setIsPickerVisible(false);
    if (selectedDate && dateField) {
      setEditForm(prev => ({ ...prev, [dateField]: selectedDate.toISOString().split("T")[0] }));
    }
    setDateField(null);
  };

  const handleShareDetails = async () => {
    if (!truck) return;
    try {
      let message = `🚚 *Truck Details: ${truck.registration_number}*\n\n`;

      if (selectedTags.make_model) message += `🔹 Brand: ${truck.make} ${truck.vehicle_model}\n`;
      if (selectedTags.registered_owner_name) message += `👤 Owner: ${truck.registered_owner_name}\n`;
      if (selectedTags.chassis_number) message += `🔢 Chassis: ${truck.chassis_number}\n`;
      if (selectedTags.engine_number) message += `⚙️ Engine: ${truck.engine_number}\n`;
      if (selectedTags.fuel_norms) message += `⛽ Norms: ${truck.fuel_norms || "BS-VI"}\n`;
      if (selectedTags.unladen_weight) message += `⚖️ Weight: ${truck.unladen_weight || "-"} kg\n`;
      if (selectedTags.vehicle_age) message += `⏳ Age: ${getVehicleAge(truck.registration_date as string)}\n`;
      if (selectedTags.fitness_upto) message += `✅ Fitness: ${formatDate(truck.fitness_upto as string)}\n`;
      if (selectedTags.insurance_upto) message += `🛡️ Insurance: ${formatDate(truck.insurance_upto as string)}\n`;

      message += `\nShared via Trucksarthi`;

      await Share.share({ message });
      setShowShareModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to share details");
    }
  };

  if (trucksLoading || !id) {
    return (
      <View style={{ backgroundColor: colors.background }} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!truck) {
    return (
      <View style={{ backgroundColor: colors.background }} className="flex-1 items-center justify-center">
        <Text style={{ color: colors.mutedForeground }}>Truck not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

      <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginLeft: 16 }}>Truck Profile</Text>
        <View style={{ flex: 1 }} />
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => setShowShareModal(true)}>
            <Share2 size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEditModal(true)}>
            <Pencil size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* HERO CARD */}
        <View style={{ padding: 24, backgroundColor: colors.card, marginHorizontal: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={32} color="white" />
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.foreground }} className="uppercase tracking-tight">{truck.registration_number}</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground, marginTop: 2 }}>
                {normalizeDisplayValue(truck.registered_owner_name) || "Owner not available"}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 12, opacity: 0.5 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {sectionOneItems.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>No basic details available.</Text>
            ) : (
              sectionOneItems.map((item) => (
                <DetailItem key={item.key} label={item.label} value={item.value as string} />
              ))
            )}
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, marginHorizontal: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDates(!showDates)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: colors.muted + '20' }}
          >
            <View className="flex-row items-center">
              <Calendar size={20} color={colors.primary} />
              <Text style={{ color: colors.foreground }} className="text-base font-bold ml-3">Important Dates</Text>
            </View>
            {showDates ? <ChevronUp size={20} color={colors.mutedForeground} /> : <ChevronDown size={20} color={colors.mutedForeground} />}
          </TouchableOpacity>
          {showDates && (
            <View className="px-5 pb-4">
              {importantDateItems.length === 0 ? (
                <Text style={{ color: colors.mutedForeground, fontSize: 13, paddingTop: 12 }}>
                  No important dates available.
                </Text>
              ) : (
                importantDateItems.map((item) => (
                  <DateItem key={item.label} label={item.label} date={item.date} />
                ))
              )}
            </View>
          )}
        </View>

        <View style={{ backgroundColor: colors.card, marginHorizontal: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowOtherDetails(!showOtherDetails)}
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: colors.muted + "20" }}
          >
            <View className="flex-row items-center">
              <FileText size={20} color={colors.primary} />
              <Text style={{ color: colors.foreground }} className="text-base font-bold ml-3">Other Details</Text>
            </View>
            {showOtherDetails ? <ChevronUp size={20} color={colors.mutedForeground} /> : <ChevronDown size={20} color={colors.mutedForeground} />}
          </TouchableOpacity>
          {showOtherDetails && (
            <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
              {moreDetailsEntries.length === 0 ? (
                <Text style={{ color: colors.mutedForeground, fontSize: 13, paddingVertical: 12 }}>
                  No additional details available.
                </Text>
              ) : (
                moreDetailsEntries.map((item) => (
                  <View key={item.key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border + "30" }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", flex: 0.42 }}>{item.label}</Text>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", flex: 0.56, textAlign: "right" }}>{item.value}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '80%' }}>
            <View style={{ width: 40, height: 5, backgroundColor: colors.border, alignSelf: 'center', borderRadius: 3, marginBottom: 24 }} />
            <View className="flex-row justify-between items-center mb-6">
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>Edit Truck</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8 }}>Plate Number</Text>
                  <TextInput value={editForm.registration_number} onChangeText={t => setEditForm(p => ({ ...p, registration_number: t }))} style={{ backgroundColor: colors.card, color: colors.foreground, padding: 16, borderRadius: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border }} />
                </View>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8 }}>Brand / Make</Text>
                  <TextInput value={editForm.make} onChangeText={t => setEditForm(p => ({ ...p, make: t }))} style={{ backgroundColor: colors.card, color: colors.foreground, padding: 16, borderRadius: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border }} />
                </View>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8 }}>Owner Name</Text>
                  <TextInput value={editForm.registered_owner_name} onChangeText={t => setEditForm(p => ({ ...p, registered_owner_name: t }))} style={{ backgroundColor: colors.card, color: colors.foreground, padding: 16, borderRadius: 16, fontSize: 16, borderWidth: 1, borderColor: colors.border }} />
                </View>

                {[
                  { label: "Fitness Expiry", key: "fitness_upto" },
                  { label: "Insurance Expiry", key: "insurance_upto" },
                  { label: "National Permit", key: "national_permit_upto" },
                ].map(f => (
                  <TouchableOpacity key={f.key} activeOpacity={0.7} onPress={() => { setDateField(f.key); setIsPickerVisible(true); }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 8 }}>{f.label}</Text>
                    <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: (editForm as any)[f.key] ? colors.foreground : colors.mutedForeground }}>{(editForm as any)[f.key] ? globalFormatDate((editForm as any)[f.key]) : "Select Date"}</Text>
                      <Calendar size={18} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity onPress={handleUpdateTruck} style={{ backgroundColor: colors.primary, padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 24 }}>
              <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', fontSize: 16 }}>Update Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isPickerVisible && (
          <DateTimePicker value={(editForm as any)[dateField!] ? new Date((editForm as any)[dateField!]) : new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} />
        )}
      </Modal>

      {/* SHARE MODAL */}
      <Modal visible={showShareModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
            <View style={{ width: 40, height: 5, backgroundColor: colors.border, alignSelf: 'center', borderRadius: 3, marginBottom: 24 }} />
            <View className="flex-row justify-between items-center mb-6">
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>Select details to share</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap gap-2 mb-8">
              {[
                { label: "Number", key: "registration_number" },
                { label: "Make/Model", key: "make_model" },
                { label: "Owner", key: "registered_owner_name" },
                { label: "Chassis", key: "chassis_number" },
                { label: "Engine", key: "engine_number" },
                { label: "Norms", key: "fuel_norms" },
                { label: "Weight", key: "unladen_weight" },
                { label: "Vehicle Age", key: "vehicle_age" },
                { label: "Fitness Date", key: "fitness_upto" },
                { label: "Insurance Date", key: "insurance_upto" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setSelectedTags(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`px-4 py-2 rounded-full border ${selectedTags[item.key] ? 'bg-primary border-primary' : 'bg-transparent border-border'}`}
                >
                  <Text style={{ color: selectedTags[item.key] ? colors.primaryForeground : colors.mutedForeground }} className="text-xs font-bold">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleShareDetails}
              style={{ backgroundColor: colors.primary }}
              className="py-4 rounded-2xl items-center mb-4"
            >
              <Text className="text-white font-bold text-base">Share Selected Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


