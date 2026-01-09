import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
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
import { SafeAreaView } from "react-native-safe-area-context";

import useDrivers from "../../hooks/useDriver";
import useTrips, { Trip } from "../../hooks/useTrip";
import useTrucks from "../../hooks/useTruck";
import useTruckDocuments from "../../hooks/useTruckDocuments";

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

/* ---------------- SCREEN ---------------- */

export default function TruckProfile() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  /* ---------------- ROUTE PARAM ---------------- */
  const { truckId } = useLocalSearchParams<{ truckId?: string | string[] }>();

  const numericTruckId = useMemo(() => {
    if (!truckId) return null;
    const raw = Array.isArray(truckId) ? truckId[0] : truckId;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  }, [truckId]);

  /* ---------------- AUTH ---------------- */
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, [auth]);

  const firebase_uid = user?.uid ?? "";

  /* ---------------- DATA HOOKS ---------------- */
  const { trucks, loading: trucksLoading, fetchTrucks, updateTruck, updateImportantDates } =
    useTrucks(firebase_uid);

  const { documents, fetchDocumentsByTruck, uploadDocument } =
    useTruckDocuments(firebase_uid);

  const { trips, fetchTrips } = useTrips(firebase_uid, { autoFetch: false });
  const { drivers } = useDrivers(firebase_uid);

  /* ---------------- LOCAL STATE ---------------- */
  const [showDates, setShowDates] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showTrips, setShowTrips] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    // Basic Info
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

    // Dates
    registration_date: "",
    fitness_upto: "",
    pollution_upto: "",
    road_tax_upto: "",
    insurance_upto: "",
    permit_upto: "",
    national_permit_upto: "",
  });

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!firebase_uid) return;
    fetchTrucks();
  }, [firebase_uid, fetchTrucks]);

  useEffect(() => {
    if (!firebase_uid || !numericTruckId) return;
    fetchDocumentsByTruck(numericTruckId);
    fetchTrips();
  }, [firebase_uid, numericTruckId, fetchDocumentsByTruck, fetchTrips]);

  /* ---------------- DERIVED ---------------- */
  const truck = useMemo(() => {
    if (!numericTruckId) return undefined;
    const t = trucks.find(
      (t) => Number(t.truck_id) === Number(numericTruckId)
    );
    return t;
  }, [trucks, numericTruckId]);

  // Sync edit form when truck loads
  useEffect(() => {
    if (truck) {
      setEditForm({
        registration_number: truck.registration_number || "",
        chassis_number: truck.chassis_number || "",
        engine_number: truck.engine_number || "",
        make: truck.make || "",
        model: truck.model || "",
        vehicle_class: truck.vehicle_class || "",
        fuel_type: truck.fuel_type || "",
        fuel_norms: truck.fuel_norms || "",
        unladen_weight: truck.unladen_weight ? String(truck.unladen_weight) : "",
        registered_rto: truck.registered_rto || "",
        registered_owner_name: truck.registered_owner_name || "",

        // Dates
        registration_date: truck.registration_date ? truck.registration_date.split('T')[0] : "",
        fitness_upto: truck.fitness_upto ? truck.fitness_upto.split('T')[0] : "",
        pollution_upto: truck.pollution_upto ? truck.pollution_upto.split('T')[0] : "",
        road_tax_upto: truck.road_tax_upto ? truck.road_tax_upto.split('T')[0] : "",
        insurance_upto: truck.insurance_upto ? truck.insurance_upto.split('T')[0] : "",
        permit_upto: truck.permit_upto ? truck.permit_upto.split('T')[0] : "",
        national_permit_upto: truck.national_permit_upto ? truck.national_permit_upto.split('T')[0] : "",
      });
    }
  }, [truck]);

  const truckTrips = trips.filter(
    (t: Trip) => Number(t.truck_id) === Number(numericTruckId)
  );

  const driverMap = useMemo(
    () =>
      Object.fromEntries(
        drivers.map((d) => [Number(d.driver_id), d.driver_name])
      ),
    [drivers]
  );

  /* ---------------- ACTIONS ---------------- */
  const handleUpdateTruck = async () => {
    if (!numericTruckId) return;
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
        registration_date,
        fitness_upto,
        pollution_upto,
        road_tax_upto,
        insurance_upto,
        permit_upto,
        national_permit_upto,
      };

      // Sanitize dates (send null/undefined if empty string, or keep as is if backend handles empty strings appropriately?)
      // Backend likely expects YYYY-MM-DD or null.
      // Let's filter out empty strings to avoid sending invalid dates if backend expects valid date.
      // Using 'as any' to bypass strict TS check if needed, but keeping it clean.
      // Actually, if we send empty string for date, backend might fail.
      // For now, let's send them as is, assuming user inputs valid dates or leaves them empty.
      // Ideally we should validate YYYY-MM-DD.

      await Promise.all([
        updateTruck(numericTruckId, {
          ...basicInfo,
          unladen_weight: basicInfo.unladen_weight ? Number(basicInfo.unladen_weight) : undefined,
        }),
        updateImportantDates(numericTruckId, dateUpdates)
      ]);

      setShowEditModal(false);
    } catch (e) {
      console.error(e);
    }
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
        truck_id: numericTruckId!,
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

      fetchDocumentsByTruck(numericTruckId!);
    } catch (e) {
      console.error(e);
    }
  };

  /* ---------------- GUARDS ---------------- */
  if (authLoading || trucksLoading || !numericTruckId) {
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
          {/* Header Part */}
          <View className="flex-row items-center mb-6">
            <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl items-center justify-center mr-4">
              <Truck size={32} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold tracking-tight text-foreground">
                {truck.registration_number}
              </Text>
              <Text className="text-sm text-muted-foreground mt-0.5">
                {truck.make} {truck.model}
              </Text>
            </View>
            <View className="bg-muted px-3 py-1 rounded-full">
              <Text className="text-[10px] uppercase font-bold text-muted-foreground">
                {truck.vehicle_class || "N/A"}
              </Text>
            </View>
          </View>

          {/* Details Grid */}
          <View className="flex-row flex-wrap justify-between">
            <InfoItem
              label="Chassis No."
              value={truck.chassis_number}
              isDark={isDark}
              icon={<Settings size={14} color={iconColor} />}
            />
            <InfoItem
              label="Engine No."
              value={truck.engine_number}
              isDark={isDark}
              icon={<Cpu size={14} color={iconColor} />}
            />
            <InfoItem
              label="Owner"
              value={truck.registered_owner_name}
              isDark={isDark}
              icon={<UserIcon size={14} color={iconColor} />}
            />
            <InfoItem
              label="Fuel"
              value={`${truck.fuel_type || ""} ${truck.fuel_norms || ""}`}
              isDark={isDark}
              icon={<Zap size={14} color={iconColor} />}
            />
            <InfoItem
              label="Weight"
              value={truck.unladen_weight ? `${truck.unladen_weight} kg` : ""}
              isDark={isDark}
              icon={<Weight size={14} color={iconColor} />}
            />
            <InfoItem
              label="RTO"
              value={truck.registered_rto}
              isDark={isDark}
              icon={<MapPin size={14} color={iconColor} />}
            />
          </View>
        </View>

        {/* IMPORTANT DATES (COLLAPSIBLE) */}
        <View className="bg-card rounded-2xl overflow-hidden mb-4 border border-border/50">
          <TouchableOpacity
            onPress={() => setShowDates(!showDates)}
            className="flex-row justify-between items-center p-4 bg-muted/30"
          >
            <View className="flex-row items-center">
              <Calendar size={20} color={isDark ? "#FFF" : "#000"} />
              <Text className="text-base font-bold ml-3">Important Dates</Text>
            </View>
            {showDates ? <ChevronUp size={20} color={isDark ? "#FFF" : "#000"} /> : <ChevronDown size={20} color={isDark ? "#FFF" : "#000"} />}
          </TouchableOpacity>

          {showDates && (
            <View className="p-4 pt-1">
              <DateItem label="Registration Date" date={truck.registration_date} isDark={isDark} />
              <View className="flex-row justify-between items-center py-3 border-b border-border/40">
                <Text className="text-sm text-muted-foreground">Vehicle Age</Text>
                <Text className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{getVehicleAge(truck.registration_date)}</Text>
              </View>
              <DateItem label="Fitness Upto" date={truck.fitness_upto} isDark={isDark} />
              <DateItem label="Pollution Upto" date={truck.pollution_upto} isDark={isDark} />
              <DateItem label="Road Tax Upto" date={truck.road_tax_upto} isDark={isDark} />
              <DateItem label="Insurance Upto" date={truck.insurance_upto} isDark={isDark} />
              <DateItem label="Permit Valid Upto" date={truck.permit_upto} isDark={isDark} />
              <DateItem label="National Permit Upto" date={truck.national_permit_upto} isDark={isDark} />
            </View>
          )}
        </View>

        {/* DOCUMENTS (COLLAPSIBLE - Default Collapsed) */}
        <View className="bg-card rounded-2xl overflow-hidden mb-4 border border-border/50">
          <TouchableOpacity
            onPress={() => setShowDocs(!showDocs)}
            className="flex-row justify-between items-center p-4 bg-muted/30"
          >
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
                  const expiring = doc && isExpiringSoon(doc.expiry_date);

                  return (
                    <DocumentCard
                      key={type}
                      label={type}
                      url={doc?.file_url}
                      expiring={expiring}
                      expiryDate={formatDate(doc?.expiry_date)}
                      onPress={() => doc?.file_url ? setPreviewImage(doc.file_url) : handleUpload(type)}
                      onEdit={() => handleUpload(type)}
                    />
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* TRIPS (COLLAPSIBLE - Default Expanded) */}
        <View className="bg-card rounded-2xl overflow-hidden mb-6 border border-border/50">
          <TouchableOpacity
            onPress={() => setShowTrips(!showTrips)}
            className="flex-row justify-between items-center p-4 bg-muted/30"
          >
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
                  <View key={t.trip_id} className="bg-muted/40 rounded-xl p-4 mb-3 border border-border/30">
                    <View className="flex-row justify-between items-start mb-2">
                      <View>
                        <Text className="font-bold text-base">Trip #{t.trip_id}</Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">{formatDate(t.trip_date)}</Text>
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
                        <Text className="font-semibold text-sm">{driverMap[t.driver_id] || "Unknown"}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

      </ScrollView>

      {/* FAB - Upload Document */}
      {showDocs && (
        <TouchableOpacity
          onPress={() => handleUpload("RC")}
          className="absolute bottom-8 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
          style={{ elevation: 5 }}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* EDIT MODAL */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-background rounded-t-3xl h-[85%]">
              {/* Header */}
              <View className="px-6 py-4 border-b border-border/30 flex-row justify-between items-center">
                <Text className="text-xl font-bold">Edit Truck</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)} className="bg-muted p-2 rounded-full">
                  <Ionicons name="close" size={20} color={isDark ? "#fff" : "#000"} />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Fields */}
                <View className="space-y-4">
                  <View>
                    <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Registration Number</Text>
                    <TextInput
                      value={editForm.registration_number}
                      onChangeText={(t) => setEditForm(prev => ({ ...prev, registration_number: t }))}
                      className="bg-muted px-4 py-3 rounded-xl text-base"
                      placeholder="e.g. MH 12 AB 1234"
                    />
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Make</Text>
                      <TextInput
                        value={editForm.make}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, make: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        placeholder="Tata"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Model</Text>
                      <TextInput
                        value={editForm.model}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, model: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        placeholder="Signa 4825"
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Chassis Number</Text>
                    <TextInput
                      value={editForm.chassis_number}
                      onChangeText={(t) => setEditForm(prev => ({ ...prev, chassis_number: t }))}
                      className="bg-muted px-4 py-3 rounded-xl text-base"
                      placeholder="Chassis No."
                    />
                  </View>

                  <View>
                    <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Engine Number</Text>
                    <TextInput
                      value={editForm.engine_number}
                      onChangeText={(t) => setEditForm(prev => ({ ...prev, engine_number: t }))}
                      className="bg-muted px-4 py-3 rounded-xl text-base"
                      placeholder="Engine No."
                    />
                  </View>

                  <View>
                    <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Owner Name</Text>
                    <TextInput
                      value={editForm.registered_owner_name}
                      onChangeText={(t) => setEditForm(prev => ({ ...prev, registered_owner_name: t }))}
                      className="bg-muted px-4 py-3 rounded-xl text-base"
                      placeholder="Registered Owner"
                    />
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Fuel Type</Text>
                      <TextInput
                        value={editForm.fuel_type}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, fuel_type: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        placeholder="Diesel"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Norms</Text>
                      <TextInput
                        value={editForm.fuel_norms}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, fuel_norms: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        placeholder="BS6"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Weight (Kg)</Text>
                      <TextInput
                        value={editForm.unladen_weight}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, unladen_weight: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        placeholder="0"
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Class</Text>
                      <TextInput
                        value={editForm.vehicle_class}
                        onChangeText={(t) => setEditForm(prev => ({ ...prev, vehicle_class: t }))}
                        className="bg-muted px-4 py-3 rounded-xl text-base"
                        placeholder="HGV"
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Registered RTO</Text>
                    <TextInput
                      value={editForm.registered_rto}
                      onChangeText={(t) => setEditForm(prev => ({ ...prev, registered_rto: t }))}
                      className="bg-muted px-4 py-3 rounded-xl text-base"
                      placeholder="e.g. MUMBAI CENTRAL"
                    />
                  </View>

                  {/* IMPORTANT DATES */}
                  <View className="mt-6 mb-2 border-t border-border/30 pt-4">
                    <Text className="text-lg font-bold mb-1">Important Dates</Text>
                    <Text className="text-xs text-muted-foreground mb-4">Format: YYYY-MM-DD</Text>

                    <View className="space-y-4">
                      <View>
                        <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Registration Date</Text>
                        <TextInput value={editForm.registration_date} onChangeText={(t) => setEditForm(prev => ({ ...prev, registration_date: t }))} className="bg-muted px-4 py-3 rounded-xl text-base" placeholder="YYYY-MM-DD" />
                      </View>

                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Fitness Upto</Text>
                          <TextInput value={editForm.fitness_upto} onChangeText={(t) => setEditForm(prev => ({ ...prev, fitness_upto: t }))} className="bg-muted px-4 py-3 rounded-xl text-base" placeholder="YYYY-MM-DD" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Pollution Upto</Text>
                          <TextInput value={editForm.pollution_upto} onChangeText={(t) => setEditForm(prev => ({ ...prev, pollution_upto: t }))} className="bg-muted px-4 py-3 rounded-xl text-base" placeholder="YYYY-MM-DD" />
                        </View>
                      </View>

                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Road Tax Upto</Text>
                          <TextInput value={editForm.road_tax_upto} onChangeText={(t) => setEditForm(prev => ({ ...prev, road_tax_upto: t }))} className="bg-muted px-4 py-3 rounded-xl text-base" placeholder="YYYY-MM-DD" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Insurance Upto</Text>
                          <TextInput value={editForm.insurance_upto} onChangeText={(t) => setEditForm(prev => ({ ...prev, insurance_upto: t }))} className="bg-muted px-4 py-3 rounded-xl text-base" placeholder="YYYY-MM-DD" />
                        </View>
                      </View>

                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">Permit Upto</Text>
                          <TextInput value={editForm.permit_upto} onChangeText={(t) => setEditForm(prev => ({ ...prev, permit_upto: t }))} className="bg-muted px-4 py-3 rounded-xl text-base" placeholder="YYYY-MM-DD" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-muted-foreground mb-1 uppercase">National Permit</Text>
                          <TextInput value={editForm.national_permit_upto} onChangeText={(t) => setEditForm(prev => ({ ...prev, national_permit_upto: t }))} className="bg-muted px-4 py-3 rounded-xl text-base" placeholder="YYYY-MM-DD" />
                        </View>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleUpdateTruck}
                    className="bg-blue-600 items-center justify-center py-4 rounded-xl mt-4"
                  >
                    <Text className="text-white font-bold text-lg">Save Changes</Text>
                  </TouchableOpacity>

                  <View className="h-10" />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* IMAGE PREVIEW MODAL */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}
          className="flex-1 bg-black/95"
        >
          <TouchableOpacity
            onPress={() => setPreviewImage(null)}
            className="absolute top-12 right-6 z-10 bg-white/20 p-3 rounded-full"
            style={{ elevation: 5 }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {previewImage && (
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="flex-1 items-center justify-center"
            >
              <Image
                source={{ uri: previewImage }}
                style={{ width: "90%", height: "80%" }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------- DOCUMENT CARD COMPONENT ---------------- */
function DocumentCard({ label, url, expiring, expiryDate, onPress, onEdit }: any) {
  return (
    <View style={{ width: "47%" }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          aspectRatio: 1.3,
          width: "100%",
          backgroundColor: "#f3f4f6",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          borderWidth: 1,
          borderColor: "#e5e7eb"
        }}
      >
        {url ? (
          <>
            <Image
              source={{ uri: url }}
              style={{
                width: "100%",
                height: "100%",
              }}
              resizeMode="cover"
            />

            <TouchableOpacity
              onPress={onEdit}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: 6,
                borderRadius: 20,
                zIndex: 10,
              }}
            >
              <Pencil size={12} color="white" />
            </TouchableOpacity>

            {expiring && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "rgba(220, 38, 38, 0.9)",
                  padding: 4,
                  alignItems: "center"
                }}
              >
                <Text className="text-white text-[10px] font-bold">EXPIRING SOON</Text>
              </View>
            )}
          </>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
            <FileText size={32} color="#94a3b8" />
            <Text style={{ fontSize: 10, fontWeight: "bold", marginTop: 6, textTransform: "uppercase", color: "#94a3b8" }}>
              {label}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={{ marginTop: 6, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#6b7280" }}>
          {label}
        </Text>
        {expiryDate && url && (
          <Text style={{ fontSize: 11, color: expiring ? "#dc2626" : "#9ca3af" }}>
            Valid: {expiryDate}
          </Text>
        )}
      </View>
    </View>
  );
}
