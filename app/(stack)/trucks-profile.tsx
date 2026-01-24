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
  Plus,
  Settings,
  Truck,
  User as UserIcon,
  Weight,
  Zap
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { THEME } from "../../theme";

import useDrivers from "../../hooks/useDriver";
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

const InfoItem = ({ label, value, icon, isDark }: any) => (
  <View className="mb-4 w-[48%]">
    <View className="flex-row items-center mb-1">
      {icon}
      <Text className="text-xs text-muted-foreground ml-1.5 font-medium uppercase tracking-wider">
        {label}
      </Text>
    </View>
    <Text className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
      {value || "—"}
    </Text>
  </View>
);

const DateItem = ({ label, date, isDark }: any) => {
  const expiring = isExpiringSoon(date);
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-border/40 last:border-0">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <View className="flex-row items-center">
        {expiring && (
          <View className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-md mr-2">
            <Text className="text-[10px] text-red-600 dark:text-red-400 font-bold">EXPIRING</Text>
          </View>
        )}
        <Text className={`font-medium ${expiring ? "text-red-600 dark:text-red-400" : isDark ? "text-white" : "text-gray-900"}`}>
          {formatDate(date)}
        </Text>
      </View>
    </View>
  );
};

const DocumentCard = ({ label, url, expiring, expiryDate, onPress, onEdit }: any) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? THEME.dark : THEME.light;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-[47%] bg-muted/40 rounded-xl p-3 border border-border/30 items-center justify-center relative"
    >
      {url ? (
        <Image source={{ uri: url }} className="w-full h-24 rounded-md mb-2" resizeMode="cover" />
      ) : (
        <View className="w-full h-24 rounded-md mb-2 bg-muted items-center justify-center">
          <FileText size={32} color={theme.mutedForeground} />
        </View>
      )}
      <Text className="text-xs font-semibold text-foreground mb-1">{label}</Text>
      {url && (
        <Text className={`text-[10px] ${expiring ? "text-red-500" : "text-muted-foreground"}`}>
          Exp: {expiryDate}
        </Text>
      )}
      {url && (
        <TouchableOpacity
          onPress={onEdit}
          className="absolute top-2 right-2 bg-background rounded-full p-1"
        >
          <Pencil size={14} color={theme.foreground} />
        </TouchableOpacity>
      )}
      {!url && (
        <View className="absolute top-2 right-2 bg-background rounded-full p-1">
          <Plus size={14} color={theme.foreground} />
        </View>
      )}
    </TouchableOpacity>
  );
};

/* ---------------- SCREEN ---------------- */

export default function TruckProfile() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  /* ---------------- ROUTE PARAM ---------------- */
  const { truck_id } = useLocalSearchParams<{ truck_id?: string | string[] }>();

  const id = useMemo(() => {
    if (!truck_id) return undefined;
    return Array.isArray(truck_id) ? truck_id[0] : truck_id;
  }, [truck_id]);

  /* ---------------- DATA HOOKS ---------------- */
  const { trucks, loading: trucksLoading, updateTruck, updateImportantDates } =
    useTrucks();

  const { documents, fetchDocuments, uploadDocument } =
    useTruckDocuments(id);

  const { trips } = useTrips();
  const { drivers } = useDrivers();

  /* ---------------- LOCAL STATE ---------------- */
  const [showDates, setShowDates] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showTrips, setShowTrips] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Date Picker State
  const [dateField, setDateField] = useState<string | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  // Edit State
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

  /* ---------------- DERIVED ---------------- */
  const truck = useMemo(() => {
    if (!id) return undefined;
    return trucks.find((t) => t._id === id);
  }, [trucks, id]);

  // Sync edit form when truck loads
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

  const truckTrips = trips.filter(
    (t: any) => (typeof t.truck === 'object' ? t.truck?._id : t.truck) === id
  );

  const driverMap = useMemo(() => {
    const map: Record<string, string> = {};
    (drivers || []).forEach((d) => {
      if (d && d._id) map[d._id] = d.driver_name;
    });
    return map;
  }, [drivers]);

  /* ---------------- ACTIONS ---------------- */
  const handleUpdateTruck = async () => {
    if (!id) return;
    try {
      const {
        registration_date,
        fitness_upto,
        pollution_upto,
        road_tax_upto,
        insurance_upto,
        permit_upto,
        national_permit_upto,
        ...basicInfo
      } = editForm;

      const dateUpdates = {
        registration_date: registration_date || null,
        fitness_upto: fitness_upto || null,
        pollution_upto: pollution_upto || null,
        road_tax_upto: road_tax_upto || null,
        insurance_upto: insurance_upto || null,
        permit_upto: permit_upto || null,
        national_permit_upto: national_permit_upto || null,
      };

      await Promise.all([
        updateTruck(id, {
          ...basicInfo,
          unladen_weight: basicInfo.unladen_weight ? Number(basicInfo.unladen_weight) : undefined,
          loading_capacity: basicInfo.loading_capacity ? Number(basicInfo.loading_capacity) : undefined,
        }),
        updateImportantDates(id, dateUpdates)
      ]);

      setShowEditModal(false);
      Alert.alert("Success", "Truck details updated");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to update truck details");
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setIsPickerVisible(false);
    if (selectedDate && dateField) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      setEditForm(prev => ({ ...prev, [dateField]: dateStr }));
    }
    setDateField(null);
  };

  const showDatePicker = (field: string) => {
    setDateField(field);
    setIsPickerVisible(true);
  };

  /* ---------------- UPLOAD ---------------- */
  const handleUpload = async (type: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.3,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      await uploadDocument({
        truck_id: id!,
        document_type: type,
        expiry_date: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        file: {
          uri: asset.uri,
          name: `${type}.jpg`,
          type: "image/jpeg",
        },
      });

      fetchDocuments();
    } catch (e) {
      console.error(e);
    }
  };

  /* ---------------- GUARDS ---------------- */
  if (trucksLoading || !id) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  if (!truck) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Truck not found</Text>
      </SafeAreaView>
    );
  }

  const iconColor = isDark ? "#9ca3af" : "#64748b";
  const theme = isDark ? THEME.dark : THEME.light;

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-border/30">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">Truck Profile</Text>
        <TouchableOpacity onPress={() => setShowEditModal(true)}>
          <Pencil size={20} color={isDark ? "#FFF" : "#000"} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* MAIN CARD (EXPANDED) */}
        <View className="bg-card rounded-2xl p-5 mb-4 shadow-sm border border-border/50">
          <View className="flex-row items-center mb-6">
            <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl items-center justify-center mr-4">
              <Truck size={32} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold tracking-tight text-foreground">
                {truck.registration_number}
              </Text>
              <Text className="text-sm text-muted-foreground mt-0.5">
                {truck.make} {truck.vehicle_model}
              </Text>
            </View>
            <View className="bg-muted px-3 py-1 rounded-full">
              <Text className="text-[10px] uppercase font-bold text-muted-foreground">
                {truck.vehicle_class || "N/A"}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap justify-between">
            <InfoItem label="Chassis No." value={truck.chassis_number} isDark={isDark} icon={<Settings size={14} color={iconColor} />} />
            <InfoItem label="Engine No." value={truck.engine_number} isDark={isDark} icon={<Cpu size={14} color={iconColor} />} />
            <InfoItem label="Owner" value={truck.registered_owner_name} isDark={isDark} icon={<UserIcon size={14} color={iconColor} />} />
            <InfoItem label="Fuel" value={`${truck.fuel_type || ""} ${truck.fuel_norms || ""}`} isDark={isDark} icon={<Zap size={14} color={iconColor} />} />
            <InfoItem label="Weight" value={truck.unladen_weight ? `${truck.unladen_weight} kg` : ""} isDark={isDark} icon={<Weight size={14} color={iconColor} />} />
            <InfoItem label="RTO" value={truck.registered_rto} isDark={isDark} icon={<MapPin size={14} color={iconColor} />} />
          </View>
        </View>

        {/* IMPORTANT DATES */}
        <View className="bg-card rounded-2xl overflow-hidden mb-4 border border-border/50">
          <TouchableOpacity onPress={() => setShowDates(!showDates)} className="flex-row justify-between items-center p-4 bg-muted/30">
            <View className="flex-row items-center">
              <Calendar size={20} color={isDark ? "#FFF" : "#000"} />
              <Text className="text-base font-bold ml-3">Important Dates</Text>
            </View>
            {showDates ? <ChevronUp size={20} color={isDark ? "#FFF" : "#000"} /> : <ChevronDown size={20} color={isDark ? "#FFF" : "#000"} />}
          </TouchableOpacity>

          {showDates && (
            <View className="p-4 pt-1">
              <DateItem label="Registration Date" date={truck.registration_date ? new Date(truck.registration_date).toISOString() : undefined} isDark={isDark} />
              <View className="flex-row justify-between items-center py-3 border-b border-border/40">
                <Text className="text-sm text-muted-foreground">Vehicle Age</Text>
                <Text className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  {getVehicleAge(truck.registration_date ? new Date(truck.registration_date).toISOString() : undefined)}
                </Text>
              </View>
              <DateItem label="Fitness Upto" date={truck.fitness_upto ? new Date(truck.fitness_upto).toISOString() : undefined} isDark={isDark} />
              <DateItem label="Pollution Upto" date={truck.pollution_upto ? new Date(truck.pollution_upto).toISOString() : undefined} isDark={isDark} />
              <DateItem label="Road Tax Upto" date={truck.road_tax_upto ? new Date(truck.road_tax_upto).toISOString() : undefined} isDark={isDark} />
              <DateItem label="Insurance Upto" date={truck.insurance_upto ? new Date(truck.insurance_upto).toISOString() : undefined} isDark={isDark} />
              <DateItem label="Permit Valid Upto" date={truck.permit_upto ? new Date(truck.permit_upto).toISOString() : undefined} isDark={isDark} />
              <DateItem label="National Permit Upto" date={truck.national_permit_upto ? new Date(truck.national_permit_upto).toISOString() : undefined} isDark={isDark} />
            </View>
          )}
        </View>

        {/* DOCUMENTS */}
        <View className="bg-card rounded-2xl overflow-hidden mb-4 border border-border/50">
          <TouchableOpacity onPress={() => setShowDocs(!showDocs)} className="flex-row justify-between items-center p-4 bg-muted/30">
            <View className="flex-row items-center">
              <FileCheck size={20} color={isDark ? "#FFF" : "#000"} />
              <Text className="text-base font-bold ml-3">Documents</Text>
            </View>
            {showDocs ? <ChevronUp size={20} color={isDark ? "#FFF" : "#000"} /> : <ChevronDown size={20} color={isDark ? "#FFF" : "#000"} />}
          </TouchableOpacity>

          {showDocs && (
            <View className="p-4">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {DOCUMENT_TYPES.map((type) => {
                  const doc = documents.find((d) => d.document_type === type);
                  const expiryString = doc?.expiry_date ? new Date(doc.expiry_date).toISOString() : "";
                  const expiring = doc && isExpiringSoon(expiryString);

                  return (
                    <DocumentCard
                      key={type}
                      label={type}
                      url={getFileUrl(doc?.file_url)}
                      expiring={expiring}
                      expiryDate={formatDate(expiryString)}
                      onPress={() => doc?.file_url ? setPreviewImage(getFileUrl(doc.file_url)) : handleUpload(type)}
                      onEdit={() => handleUpload(type)}
                    />
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* TRIPS */}
        <View className="bg-card rounded-2xl overflow-hidden mb-6 border border-border/50">
          <TouchableOpacity onPress={() => setShowTrips(!showTrips)} className="flex-row justify-between items-center p-4 bg-muted/30">
            <View className="flex-row items-center">
              <MapPin size={20} color={isDark ? "#FFF" : "#000"} />
              <Text className="text-base font-bold ml-3">Trip History</Text>
            </View>
            {showTrips ? <ChevronUp size={20} color={isDark ? "#FFF" : "#000"} /> : <ChevronDown size={20} color={isDark ? "#FFF" : "#000"} />}
          </TouchableOpacity>

          {showTrips && (
            <View className="p-4">
              {truckTrips.length === 0 ? (
                <View className="items-center py-6">
                  <Text className="text-muted-foreground">No trips found for this truck</Text>
                </View>
              ) : (
                truckTrips.map((t) => (
                  <View key={t._id} className="bg-muted/40 rounded-xl p-4 mb-3 border border-border/30">
                    <View className="flex-row justify-between items-start mb-2">
                      <View>
                        <Text className="font-bold text-base">Trip #{t._id.slice(-6)}</Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">{formatDate(t.trip_date as string)}</Text>
                      </View>
                      <View className={`px-2 py-1 rounded ${t.invoiced_status === 'invoiced' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                        <Text className={`font-bold text-xs ${t.invoiced_status === 'invoiced' ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                          {t.invoiced_status === 'invoiced' ? 'Invoiced' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between mt-2 pt-2 border-t border-border/20">
                      <View>
                        <Text className="text-xs text-muted-foreground uppercase">Revenue</Text>
                        <Text className="font-semibold text-sm">₹{Number(t.cost_of_trip).toLocaleString()}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-muted-foreground uppercase">Driver</Text>
                        <Text className="font-semibold text-sm">{driverMap[typeof t.driver === 'object' ? (t.driver as any)?._id : t.driver] || "Unknown"}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      {showDocs && (
        <TouchableOpacity onPress={() => handleUpload("RC")} className="absolute bottom-8 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg" style={{ elevation: 5 }}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      )}

      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-background rounded-t-3xl h-[85%]">
              <View className="px-6 py-4 border-b border-border/30 flex-row justify-between items-center">
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.foreground }}>Edit Truck Details</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ backgroundColor: theme.muted, padding: 8, borderRadius: 20 }}>
                  <Ionicons name="close" size={20} color={theme.foreground} />
                </TouchableOpacity>
              </View>
              <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 16 }}>
                  {/* BASIC INFO SECTION */}
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#16a34a', marginTop: 8, textTransform: 'uppercase' }}>Basic Information</Text>

                  {[
                    { label: "Registration Number", key: "registration_number", placeholder: "e.g. MH 12 AB 1234", caps: true },
                    { label: "Registered Owner", key: "registered_owner_name", placeholder: "Full Owner Name" },
                    { label: "Make", key: "make", placeholder: "e.g. Tata, Mahindra" },
                    { label: "Model", key: "model", placeholder: "e.g. Prima 4425" },
                    { label: "Vehicle Class", key: "vehicle_class", placeholder: "e.g. LCV, HCV" },
                    { label: "Registered RTO", key: "registered_rto", placeholder: "e.g. Pune RTO" },
                  ].map((field) => (
                    <View key={field.key}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.mutedForeground, marginBottom: 4, textTransform: 'uppercase' }}>{field.label}</Text>
                      <TextInput
                        value={(editForm as any)[field.key]}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, [field.key]: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        style={{ color: theme.foreground }}
                        placeholder={field.placeholder}
                        placeholderTextColor={theme.mutedForeground}
                        autoCapitalize={field.caps ? "characters" : "words"}
                      />
                    </View>
                  ))}

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.mutedForeground, marginBottom: 4, textTransform: 'uppercase' }}>Unladen Weight (KG)</Text>
                      <TextInput
                        value={editForm.unladen_weight}
                        keyboardType="numeric"
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, unladen_weight: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        style={{ color: theme.foreground }}
                        placeholder="0"
                        placeholderTextColor={theme.mutedForeground}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.mutedForeground, marginBottom: 4, textTransform: 'uppercase' }}>Fuel Type</Text>
                      <TextInput
                        value={editForm.fuel_type}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, fuel_type: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        style={{ color: theme.foreground }}
                        placeholder="Diesel/EV"
                        placeholderTextColor={theme.mutedForeground}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.mutedForeground, marginBottom: 4, textTransform: 'uppercase' }}>Loading Capacity</Text>
                      <TextInput
                        value={editForm.loading_capacity}
                        keyboardType="numeric"
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, loading_capacity: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        style={{ color: theme.foreground }}
                        placeholder="0"
                        placeholderTextColor={theme.mutedForeground}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.mutedForeground, marginBottom: 4, textTransform: 'uppercase' }}>Dimension</Text>
                      <TextInput
                        value={editForm.container_dimension}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, container_dimension: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        style={{ color: theme.foreground }}
                        placeholder="e.g. 20ft"
                        placeholderTextColor={theme.mutedForeground}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.mutedForeground, marginBottom: 4, textTransform: 'uppercase' }}>Chassis Number</Text>
                      <TextInput
                        value={editForm.chassis_number}
                        autoCapitalize="characters"
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, chassis_number: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        style={{ color: theme.foreground }}
                        placeholder="Chassis No."
                        placeholderTextColor={theme.mutedForeground}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.mutedForeground, marginBottom: 4, textTransform: 'uppercase' }}>Engine Number</Text>
                      <TextInput
                        value={editForm.engine_number}
                        autoCapitalize="characters"
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, engine_number: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        style={{ color: theme.foreground }}
                        placeholder="Engine No."
                        placeholderTextColor={theme.mutedForeground}
                      />
                    </View>
                  </View>

                  {/* DATES SECTION */}
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#16a34a', marginTop: 16, textTransform: 'uppercase' }}>Important Dates</Text>

                  {[
                    { label: "Registration Date", key: "registration_date" },
                    { label: "Fitness Validity", key: "fitness_upto" },
                    { label: "Pollution Expiry", key: "pollution_upto" },
                    { label: "Road Tax Expiry", key: "road_tax_upto" },
                    { label: "Insurance Expiry", key: "insurance_upto" },
                    { label: "Permit Expiry", key: "permit_upto" },
                    { label: "National Permit Expiry", key: "national_permit_upto" },
                  ].map((field) => (
                    <TouchableOpacity
                      key={field.key}
                      onPress={() => showDatePicker(field.key)}
                      style={{ marginBottom: 4 }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.mutedForeground, marginBottom: 4, textTransform: 'uppercase' }}>{field.label}</Text>
                      <View className="bg-muted px-4 py-3 rounded-xl flex-row justify-between items-center">
                        <Text style={{ fontSize: 16, color: (editForm as any)[field.key] ? theme.foreground : theme.mutedForeground }}>
                          {(editForm as any)[field.key] || "Select Date"}
                        </Text>
                        <Calendar size={18} color={theme.mutedForeground} />
                      </View>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    onPress={handleUpdateTruck}
                    style={{ backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Save All Changes</Text>
                  </TouchableOpacity>

                  <View className="h-10" />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>

        {isPickerVisible && (
          <DateTimePicker
            value={(editForm as any)[dateField!] ? new Date((editForm as any)[dateField!]) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
      </Modal>

      {/* IMAGE PREVIEW */}
      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setPreviewImage(null)} className="flex-1 bg-black/95">
          <TouchableOpacity onPress={() => setPreviewImage(null)} className="absolute top-12 right-6 z-10 bg-white/20 p-3 rounded-full" style={{ elevation: 5 }}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          {previewImage && (
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} className="flex-1 items-center justify-center">
              <Image source={{ uri: previewImage }} style={{ width: "90%", height: "80%" }} resizeMode="contain" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
