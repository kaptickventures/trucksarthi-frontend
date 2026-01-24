import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileCheck,
  FileText,
  MapPin,
  Pencil,
  Settings,
  Truck,
  User as UserIcon,
  Weight,
  X,
  Zap
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useDrivers from "../../hooks/useDriver";
import { useThemeStore } from "../../hooks/useThemeStore";
import useTrips from "../../hooks/useTrip";
import useTrucks from "../../hooks/useTruck";
import useTruckDocuments from "../../hooks/useTruckDocuments";
import { getFileUrl } from "../../lib/utils";

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

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const DOCUMENT_TYPES = ["RC", "INSURANCE", "PERMIT", "FITNESS"];

/* ---------------- COMPONENTS ---------------- */

const InfoItem = ({ label, value, icon }: any) => {
  const { colors } = useThemeStore();
  return (
    <View className="mb-6 w-[48%]">
      <View className="flex-row items-center mb-1.5 opacity-70">
        {React.cloneElement(icon, { size: 14, color: colors.primary })}
        <Text style={{ color: colors.mutedForeground }} className="text-[10px] font-bold uppercase tracking-wider ml-2">
          {label}
        </Text>
      </View>
      <Text style={{ color: colors.foreground }} className="text-sm font-bold ml-5">
        {value || "—"}
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
  const isDark = theme === 'dark';

  const { truck_id } = useLocalSearchParams<{ truck_id?: string | string[] }>();
  const id = useMemo(() => Array.isArray(truck_id) ? truck_id[0] : truck_id, [truck_id]);

  const { trucks, loading: trucksLoading, updateTruck, updateImportantDates } = useTrucks();
  const { documents, fetchDocuments, uploadDocument } = useTruckDocuments(id);
  const { trips } = useTrips();
  const { drivers } = useDrivers();

  const [showDates, setShowDates] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showTrips, setShowTrips] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [dateField, setDateField] = useState<string | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
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

  const truckTrips = trips.filter(t => (typeof t.truck === 'object' ? t.truck?._id : t.truck) === id);

  const driverMap = useMemo(() => {
    const map: Record<string, string> = {};
    (drivers || []).forEach((d) => { if (d && d._id) map[d._id] = d.driver_name; });
    return map;
  }, [drivers]);

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

  const handleUpload = async (type: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.3 });
      if (result.canceled) return;
      await uploadDocument({ truck_id: id!, document_type: type, expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], file: { uri: result.assets[0].uri, name: `${type}.jpg`, type: "image/jpeg" } });
      fetchDocuments();
    } catch (e) { console.error(e); }
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
        <TouchableOpacity onPress={() => setShowEditModal(true)}>
          <Pencil size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* HERO CARD */}
        <View style={{ padding: 24, backgroundColor: colors.card, marginHorizontal: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={32} color="white" />
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.foreground }} className="uppercase tracking-tight">{truck.registration_number}</Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{truck.make} {truck.vehicle_model}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 24, opacity: 0.5 }} />

          <View className="flex-row flex-wrap justify-between">
            <InfoItem label="Chassis" value={truck.chassis_number} icon={<Settings />} />
            <InfoItem label="Engine" value={truck.engine_number} icon={<Cpu />} />
            <InfoItem label="Owner" value={truck.registered_owner_name} icon={<UserIcon />} />
            <InfoItem label="Norms" value={truck.fuel_norms || "BS-VI"} icon={<Zap />} />
            <InfoItem label="Weight" value={truck.unladen_weight ? `${truck.unladen_weight} kg` : "-"} icon={<Weight />} />
            <InfoItem label="Class" value={truck.vehicle_class || "HCV"} icon={<FileText />} />
          </View>
        </View>

        {/* IMPORTANT DATES ACCORDION */}
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
              <DateItem label="Registration Date" date={truck.registration_date} />
              <View className="flex-row justify-between items-center py-4 border-b border-border/10">
                <Text style={{ color: colors.mutedForeground }} className="text-xs font-bold opacity-80">Vehicle Age</Text>
                <Text style={{ color: colors.foreground }} className="font-bold text-xs">{getVehicleAge(truck.registration_date as string)}</Text>
              </View>
              <DateItem label="Fitness Upto" date={truck.fitness_upto} />
              <DateItem label="Pollution Upto" date={truck.pollution_upto} />
              <DateItem label="Road Tax Upto" date={truck.road_tax_upto} />
              <DateItem label="Insurance Upto" date={truck.insurance_upto} />
              <DateItem label="Permit Upto" date={truck.permit_upto} />
              <DateItem label="National Permit Upto" date={truck.national_permit_upto} />
            </View>
          )}
        </View>

        {/* DOCUMENTS ACCORDION */}
        <View style={{ backgroundColor: colors.card, marginHorizontal: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDocs(!showDocs)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: colors.muted + '20' }}
          >
            <View className="flex-row items-center">
              <FileCheck size={20} color={colors.primary} />
              <Text style={{ color: colors.foreground }} className="text-base font-bold ml-3">Vault Documents</Text>
            </View>
            {showDocs ? <ChevronUp size={20} color={colors.mutedForeground} /> : <ChevronDown size={20} color={colors.mutedForeground} />}
          </TouchableOpacity>

          {showDocs && (
            <View className="p-5">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {DOCUMENT_TYPES.map((type) => {
                  const doc = documents.find((d) => d.document_type === type);
                  const expiring = doc && isExpiringSoon(doc.expiry_date as string);
                  return (
                    <View key={type} style={{ width: '48%' }}>
                      <DocumentCard
                        label={type}
                        url={getFileUrl(doc?.file_url)}
                        expiring={expiring}
                        expiryDate={formatDate(doc?.expiry_date as string)}
                        onPress={() => doc?.file_url ? setPreviewImage(getFileUrl(doc.file_url)) : handleUpload(type)}
                        onEdit={() => handleUpload(type)}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* RECENT LOGS ACCORDION */}
        <View style={{ backgroundColor: colors.card, marginHorizontal: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowTrips(!showTrips)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: colors.muted + '20' }}
          >
            <View className="flex-row items-center">
              <MapPin size={20} color={colors.primary} />
              <Text style={{ color: colors.foreground }} className="text-base font-bold ml-3">Recent Trip Logs</Text>
            </View>
            {showTrips ? <ChevronUp size={20} color={colors.mutedForeground} /> : <ChevronDown size={20} color={colors.mutedForeground} />}
          </TouchableOpacity>

          {showTrips && (
            <View className="p-5">
              {truckTrips.length === 0 ? (
                <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginVertical: 20 }}>No logs recorded.</Text>
              ) : (
                truckTrips.slice(0, 5).map((t) => (
                  <View key={t._id} style={{ backgroundColor: colors.background, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={{ fontWeight: '700', color: colors.foreground }}>Trip #{t._id.slice(-6)}</Text>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>{formatDate(t.trip_date as string)}</Text>
                      </View>
                      <Text style={{ fontWeight: '800', fontSize: 16, color: colors.primary }}>
                        ₹{Number(t.cost_of_trip).toLocaleString()}
                      </Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12, opacity: 0.5 }} />
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                      Operator: <Text style={{ color: colors.foreground, fontWeight: '600' }}>{driverMap[typeof t.driver === 'object' ? (t.driver as any)?._id : t.driver] || "N/A"}</Text>
                    </Text>
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
                      <Text style={{ color: (editForm as any)[f.key] ? colors.foreground : colors.mutedForeground }}>{(editForm as any)[f.key] || "Select Date"}</Text>
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

      {/* IMAGE PREVIEW */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setPreviewImage(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <Image source={{ uri: previewImage || "" }} style={{ width: '90%', height: '80%' }} resizeMode="contain" />
          <TouchableOpacity onPress={() => setPreviewImage(null)} style={{ position: 'absolute', top: 50, right: 24, backgroundColor: 'white', padding: 8, borderRadius: 24 }}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function DocumentCard({ label, url, onPress, onEdit }: any) {
  const { colors } = useThemeStore();
  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ aspectRatio: 1.2, width: "100%", backgroundColor: colors.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
        {url ? (
          <>
            <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <TouchableOpacity onPress={onEdit} style={{ position: "absolute", bottom: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", padding: 6, borderRadius: 12 }}>
              <Pencil size={12} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: "center", opacity: 0.5 }}>
            <FileText size={24} color={colors.mutedForeground} />
            <Text style={{ fontSize: 9, fontWeight: "bold", marginTop: 4, color: colors.mutedForeground }}>MISSING</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={{ textAlign: 'center', fontSize: 11, fontWeight: "bold", marginTop: 6, color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}

