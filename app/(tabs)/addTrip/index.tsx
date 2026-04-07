import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { NotificationBadge } from "../../../components/NotificationBadge";
import {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
  useRef
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useThemeStore } from "../../../hooks/useThemeStore";
import { Calendar, MapPin, Truck, User, IndianRupee, FileText, ChevronDown, Plus, Navigation } from 'lucide-react-native';

import ClientFormModal, { type ClientFormData } from "../../../components/ClientModal";
import DriverFormModal from "../../../components/DriverModal";
import SideMenu from "../../../components/SideMenu";
import TruckFormModal from "../../../components/TruckModal";
import { DatePickerModal } from "../../../components/DatePickerModal";

import "../../../global.css";
import { formatDate } from "../../../lib/utils";
import { useTranslation } from "../../../context/LanguageContext";


/* ---------------- Hooks ---------------- */
import useClients from "../../../hooks/useClient";
import useDrivers from "../../../hooks/useDriver";
import useLocations from "../../../hooks/useLocation";
import useTrips from "../../../hooks/useTrip";
import useTrucks from "../../../hooks/useTruck";
import { useUser } from "../../../hooks/useUser";

type SheetItem = {
  label: string;
  value: string;
};

export default function AddTrip() {
  const navigation = useNavigation();
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setMenuVisible(false);
    }, [])
  );


  /* ---------------- Header ---------------- */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerShadowVisible: false,
      headerStyle: {
        backgroundColor: "transparent",
      },
      headerBackground: () => (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        />
      ),
      headerTitleStyle: { color: colors.foreground, fontWeight: "800", fontSize: 22 },
      headerTintColor: colors.foreground,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible((prev) => !prev)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={menuVisible ? "close" : "menu"}
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.replace("/(stack)/notifications" as any)}
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <NotificationBadge
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
      ),
    });
  }, [colors, isDark, menuVisible, navigation, router]);

  /* ---------------- Data Hooks ---------------- */
  const { user, loading: userLoading } = useUser();
  const { trucks, addTruck, fetchTrucks } = useTrucks();
  const { drivers, addDriver, fetchDrivers } = useDrivers();
  const { clients, addClient, fetchClients } = useClients();
  const { locations, addLocation, fetchLocations } = useLocations();
  const { addTrip } = useTrips();
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchClients(),
        fetchDrivers(),
        fetchTrucks(),
        fetchLocations()
      ]);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchDrivers();
    fetchTrucks();
    fetchLocations();
  }, [fetchClients, fetchDrivers, fetchTrucks, fetchLocations]);

  /* ---------------- Form State ---------------- */
  const [formData, setFormData] = useState({
    date: new Date(),
    truck_id: "",
    driver_id: "",
    client_id: "",
    start_location_id: "",
    end_location_id: "",
    cost_of_trip: "",
    miscellaneous_expense: "",
    advance: "",
    notes: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");

  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["70%"], []);
  const [sheetType, setSheetType] = useState<"truck" | "driver" | "client" | null>(null);
  const [sheetSearch, setSheetSearch] = useState("");

  /* ---------------- Entity Selectors ---------------- */
  const getSelectedLabel = (type: 'truck' | 'driver' | 'client') => {
    switch (type) {
      case 'truck': return trucks.find(t => t._id === formData.truck_id)?.registration_number;
      case 'driver': {
        const driver = drivers.find(d => d._id === formData.driver_id);
        return driver?.name || driver?.driver_name;
      }
      case 'client': return clients.find(c => c._id === formData.client_id)?.client_name;
      default: return "";
    }
  };

  const openSheet = (type: "truck" | "driver" | "client") => {
    Keyboard.dismiss();
    setSheetSearch("");
    setSheetType(type);
    sheetRef.current?.present();
  };

  const closeSheet = () => {
    sheetRef.current?.dismiss();
  };

  const sheetItems = useMemo<SheetItem[]>(() => {
    const query = sheetSearch.trim().toLowerCase();
    if (sheetType === "truck") {
      return trucks
        .map((t) => ({ label: t.registration_number, value: t._id }))
        .filter((t) => t.label.toLowerCase().includes(query));
    }
    if (sheetType === "driver") {
      return drivers
        .map((d) => ({ label: d.name || d.driver_name || "Driver", value: d._id }))
        .filter((d) => d.label.toLowerCase().includes(query));
    }
    if (sheetType === "client") {
      return clients
        .map((c) => ({ label: c.client_name, value: c._id }))
        .filter((c) => c.label.toLowerCase().includes(query));
    }
    return [];
  }, [sheetType, sheetSearch, trucks, drivers, clients]);

  /* ---------------- Add Entity Modals ---------------- */
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);
  const [isTruckModalVisible, setIsTruckModalVisible] = useState(false);
  const [clientFormData, setClientFormData] = useState<ClientFormData>({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
    gstin: "",
  });
  const [driverFormData, setDriverFormData] = useState({ driver_name: "", contact_number: "", identity_card_url: "", license_card_url: "" });
  const [truckFormData, setTruckFormData] = useState({ registration_number: "", chassis_number: "", engine_number: "", registered_owner_name: "", container_dimension: "", loading_capacity: "" });
  const normalizeLocation = (value: string) => value.trim().toLowerCase();
  const findLocationByName = (name: string) =>
    locations.find((loc) => normalizeLocation(loc.location_name) === normalizeLocation(name));

  const getLocationSuggestions = (query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return locations
      .filter((loc) => loc.location_name.toLowerCase().includes(trimmed))
      .slice(0, 6);
  };

  const handleSave = async () => {
    if (isSaving) return;
    const { truck_id, driver_id, client_id, cost_of_trip } = formData;
    const trimmedStart = startQuery.trim();
    const trimmedEnd = endQuery.trim();

    if (!truck_id || !driver_id || !client_id || !trimmedStart || !trimmedEnd || !cost_of_trip) {
      Alert.alert("Missing Fields", "Please complete all required fields (*)");
      return;
    }

    try {
      setIsSaving(true);
      let startLocationId = formData.start_location_id;
      let endLocationId = formData.end_location_id;

      if (!startLocationId) {
        const existingStart = findLocationByName(trimmedStart);
        if (existingStart) {
          startLocationId = existingStart._id;
        } else {
          const created = await addLocation({ location_name: trimmedStart, complete_address: trimmedStart });
          startLocationId = created._id;
        }
      }

      if (!endLocationId) {
        const existingEnd = findLocationByName(trimmedEnd);
        if (existingEnd) {
          endLocationId = existingEnd._id;
        } else {
          const created = await addLocation({ location_name: trimmedEnd, complete_address: trimmedEnd });
          endLocationId = created._id;
        }
      }

      await addTrip({
        truck: truck_id,
        driver: driver_id,
        client: client_id,
        start_location: startLocationId,
        end_location: endLocationId,
        cost_of_trip: Number(cost_of_trip),
        miscellaneous_expense: Number(formData.miscellaneous_expense || 0),
        advance: Number(formData.advance || 0),
        notes: formData.notes,
        date: formData.date.toISOString(),
      });
      Alert.alert("Success", "Trip recorded successfully!");
      setFormData({
        date: new Date(),
        truck_id: "",
        driver_id: "",
        client_id: "",
        start_location_id: "",
        end_location_id: "",
        cost_of_trip: "",
        miscellaneous_expense: "",
        advance: "",
        notes: "",
      });
      setStartQuery("");
      setEndQuery("");
    } catch {
      Alert.alert("Error", "Failed to save trip. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading && !user) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color={colors.primary} /></View>;

  const startSuggestions = getLocationSuggestions(startQuery);
  const endSuggestions = getLocationSuggestions(endQuery);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={150} // increased to bring to middle
        extraHeight={200}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
          {/* Header Title Section */}
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('addNewTrip')}</Text>
              <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{t('recordJourney')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(stack)/locations-manager" as any)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Date Selector */}
          <InputLabel label={t('tripDate')} required />
          <TouchableOpacity
            style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}
            onPress={() => setShowDatePicker(true)}
          >
            <View className="flex-row items-center flex-1">
              <Calendar size={20} color={colors.primary} />
              <Text className="ml-3 text-base" style={{ color: colors.foreground }}>{formatDate(formData.date)}</Text>
            </View>
            <ChevronDown size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Client Selector */}
          <InputLabel label={t('client')} required />
          <TouchableOpacity
            style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}
            onPress={() => openSheet("client")}
          >
            <View className="flex-row items-center flex-1">
              <User size={20} color={colors.primary} />
              <Text
                numberOfLines={1}
                className="ml-3 text-base"
                style={{ color: getSelectedLabel('client') ? colors.foreground : colors.mutedForeground }}
              >
                {getSelectedLabel('client') || t('selectClient')}
              </Text>
            </View>
            <ChevronDown size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Origin + Destination */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <InputLabel label={t('origin')} required />
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}>
                <MapPin size={20} color={colors.primary} />
                <TextInput
                  placeholder={t('from')}
                  className="flex-1 ml-2 text-base"
                  style={{ color: colors.foreground }}
                  value={startQuery}
                  onChangeText={(text) => {
                    setStartQuery(text);
                    if (formData.start_location_id) setFormData((prev) => ({ ...prev, start_location_id: "" }));
                  }}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              {startQuery.trim().length > 0 && !formData.start_location_id && (
                <View style={[styles.suggestionBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  {startSuggestions.map((loc) => (
                    <TouchableOpacity
                      key={loc._id}
                      style={[styles.suggestionItem, { borderBottomColor: colors.border + "55" }]}
                      onPress={() => {
                        setStartQuery(loc.location_name);
                        setFormData((prev) => ({ ...prev, start_location_id: loc._id }));
                      }}
                    >
                      <Text style={{ color: colors.foreground }} numberOfLines={1}>{loc.location_name}</Text>
                    </TouchableOpacity>
                  ))}
                  {startSuggestions.length === 0 && (
                    <View style={styles.suggestionEmpty}>
                      <Text style={{ color: colors.mutedForeground }} numberOfLines={1}>No match. Will add on save.</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View className="flex-1">
              <InputLabel label={t('destination')} required />
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}>
                <Navigation size={20} color={colors.primary} />
                <TextInput
                  placeholder={t('to')}
                  className="flex-1 ml-2 text-base"
                  style={{ color: colors.foreground }}
                  value={endQuery}
                  onChangeText={(text) => {
                    setEndQuery(text);
                    if (formData.end_location_id) setFormData((prev) => ({ ...prev, end_location_id: "" }));
                  }}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              {endQuery.trim().length > 0 && !formData.end_location_id && (
                <View style={[styles.suggestionBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  {endSuggestions.map((loc) => (
                    <TouchableOpacity
                      key={loc._id}
                      style={[styles.suggestionItem, { borderBottomColor: colors.border + "55" }]}
                      onPress={() => {
                        setEndQuery(loc.location_name);
                        setFormData((prev) => ({ ...prev, end_location_id: loc._id }));
                      }}
                    >
                      <Text style={{ color: colors.foreground }} numberOfLines={1}>{loc.location_name}</Text>
                    </TouchableOpacity>
                  ))}
                  {endSuggestions.length === 0 && (
                    <View style={styles.suggestionEmpty}>
                      <Text style={{ color: colors.mutedForeground }} numberOfLines={1}>No match. Will add on save.</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          <View className="flex-row gap-4">
            {/* Truck */}
            <View className="flex-1">
              <InputLabel label={t('truck')} required />
              <TouchableOpacity
                style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}
                onPress={() => openSheet("truck")}
              >
                <View className="flex-row items-center flex-1">
                  <Truck size={20} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    className="ml-2 text-base"
                    style={{ color: getSelectedLabel('truck') ? colors.foreground : colors.mutedForeground }}
                  >
                    {getSelectedLabel('truck') || t('truck')}
                  </Text>
                </View>
                <ChevronDown size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Driver */}
            <View className="flex-1">
              <InputLabel label={t('driver')} required />
              <TouchableOpacity
                style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}
                onPress={() => openSheet("driver")}
              >
                <View className="flex-row items-center flex-1">
                  <User size={20} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    className="ml-2 text-base"
                    style={{ color: getSelectedLabel('driver') ? colors.foreground : colors.mutedForeground }}
                  >
                    {getSelectedLabel('driver') || t('driver')}
                  </Text>
                </View>
                <ChevronDown size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pricing Row */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <InputLabel label={t('freightCost')} required />
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}>
                <IndianRupee size={18} color={colors.primary} />
                <TextInput
                  placeholder="0.00"
                  keyboardType="numeric"
                  className="flex-1 ml-2 text-base"
                  style={{ color: colors.foreground }}
                  value={formData.cost_of_trip}
                  onChangeText={(t) => setFormData({ ...formData, cost_of_trip: t })}
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
                  className="flex-1 ml-2 text-base"
                  style={{ color: colors.foreground }}
                  value={formData.miscellaneous_expense}
                  onChangeText={(t) => setFormData({ ...formData, miscellaneous_expense: t })}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>
          </View>

          <View>
            <InputLabel label="Advance Received" />
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input }]}>
              <IndianRupee size={18} color={colors.primary} />
              <TextInput
                placeholder="0.00"
                keyboardType="numeric"
                className="flex-1 ml-2 text-base"
                style={{ color: colors.foreground }}
                value={formData.advance}
                onChangeText={(t) => setFormData({ ...formData, advance: t })}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          {/* Notes */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
            style={{ width: '100%' }}
          >
            <InputLabel label={t('tripNotes')} />
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input, height: 100, alignItems: 'flex-start', paddingTop: 16 }]}>
              <View style={{ marginTop: 2 }}>
                <FileText size={18} color={colors.primary} />
              </View>
              <TextInput
                placeholder={t('anyAdditionalDetails')}
                multiline
                numberOfLines={4}
                className="flex-1 ml-2 text-base"
                style={{ color: colors.foreground, textAlignVertical: 'top', marginTop: -4 }}
                value={formData.notes}
                onChangeText={(t) => setFormData({ ...formData, notes: t })}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </KeyboardAvoidingView>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isSaving}
            style={{ backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }}
            className="mt-8 h-16 rounded-2xl items-center justify-center shadow-lg shadow-primary/30"
            onPress={handleSave}
          >
            <View className="flex-row items-center">
              {isSaving ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Plus size={24} color={colors.primaryForeground} strokeWidth={3} />
              )}
              <Text className="text-xl font-bold ml-2" style={{ color: colors.primaryForeground }}>
                {isSaving ? "Saving..." : t('recordTrip')}
              </Text>
            </View>
          </TouchableOpacity>

        </KeyboardAwareScrollView>

      {/* Select Sheet */}
      <BottomSheetModal
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        onDismiss={() => setSheetType(null)}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior="close"
          />
        )}
        handleIndicatorStyle={{ backgroundColor: colors.mutedForeground, opacity: 0.4 }}
        backgroundStyle={{ backgroundColor: colors.card }}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
              {sheetType === "truck" ? t("selectTruck") : sheetType === "driver" ? t("selectDriver") : t("selectClient")}
            </Text>
            <TouchableOpacity onPress={closeSheet}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.input, height: 48 }]}>
            <Ionicons name="search" size={18} color={colors.mutedForeground} />
            <BottomSheetTextInput
              value={sheetSearch}
              onChangeText={setSheetSearch}
              placeholder="Search..."
              placeholderTextColor={colors.mutedForeground}
              style={{ flex: 1, marginLeft: 10, color: colors.foreground, fontSize: 16 }}
            />
          </View>

          <BottomSheetFlatList<SheetItem>
            data={sheetItems}
            keyExtractor={(item: SheetItem) => item.value}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }: { item: SheetItem }) => {
              const isSelected =
                (sheetType === "truck" && formData.truck_id === item.value) ||
                (sheetType === "driver" && formData.driver_id === item.value) ||
                (sheetType === "client" && formData.client_id === item.value);
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (sheetType === "truck") setFormData({ ...formData, truck_id: item.value });
                    if (sheetType === "driver") setFormData({ ...formData, driver_id: item.value });
                    if (sheetType === "client") setFormData({ ...formData, client_id: item.value });
                    closeSheet();
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: isSelected ? colors.secondary : "transparent",
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: isSelected ? colors.primary : colors.foreground, fontWeight: isSelected ? "700" : "500" }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <Text style={{ color: colors.mutedForeground }}>No results found</Text>
              </View>
            }
          />

          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 12, alignItems: "center" }}
            onPress={() => {
              closeSheet();
              Keyboard.dismiss();
              if (sheetType === "truck") setIsTruckModalVisible(true);
              if (sheetType === "driver") setIsDriverModalVisible(true);
              if (sheetType === "client") setIsClientModalVisible(true);
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>Add New</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        date={formData.date}
        onChange={(d) => setFormData({ ...formData, date: d })}
      />

      {/* Creation Modals */}
      <ClientFormModal visible={isClientModalVisible} editing={false} formData={clientFormData} setFormData={setClientFormData} onSubmit={async () => {
        if (!clientFormData.client_name?.trim()) return Alert.alert("Missing Fields", "Client name is required.");
        const normalizedClientName = clientFormData.client_name.trim();
        const res = await addClient({
          ...clientFormData,
          client_name: normalizedClientName,
          contact_person_name: clientFormData.contact_person_name?.trim() || normalizedClientName,
          contact_number: clientFormData.contact_number?.trim() || "NA",
          gstin: clientFormData.gstin?.trim().toUpperCase() || undefined,
        });
        setFormData(p => ({ ...p, client_id: res._id }));
        setIsClientModalVisible(false);
        fetchClients();
      }} onClose={() => setIsClientModalVisible(false)} />

      <DriverFormModal
        visible={isDriverModalVisible}
        editing={false}
        formData={driverFormData}
        setFormData={setDriverFormData}
        onSubmit={async () => {
          if (!driverFormData.driver_name || !driverFormData.contact_number) return Alert.alert("Missing Fields", "Name and contact required.");
          try {
            const res = await addDriver(driverFormData);
            setFormData(p => ({ ...p, driver_id: res._id }));
            setIsDriverModalVisible(false);
            fetchDrivers();
          } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to add driver";
            Alert.alert("Error", msg);
          }
        }} onClose={() => setIsDriverModalVisible(false)} />

      <TruckFormModal visible={isTruckModalVisible} editing={false} formData={truckFormData} setFormData={setTruckFormData} onSubmit={async () => {
        if (!truckFormData.registration_number) return Alert.alert("Missing Fields", "Registration number required.");
        const res = await addTruck({ ...truckFormData, loading_capacity: truckFormData.loading_capacity ? Number(truckFormData.loading_capacity) : undefined });
        setFormData(p => ({ ...p, truck_id: res._id }));
        setIsTruckModalVisible(false);
        fetchTrucks();
      }} onClose={() => setIsTruckModalVisible(false)} />

      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}

function InputLabel({ label, required }: { label: string; required?: boolean }) {
  const { colors } = useThemeStore();
  return (
    <Text className="text-[12px] font-bold uppercase tracking-wider mb-2 mt-4 ml-1 opacity-60" style={{ color: colors.foreground }}>
      {label} {required && <Text style={{ color: colors.destructive }}>*</Text>}
    </Text>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  inputContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  suggestionBox: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  suggestionEmpty: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

