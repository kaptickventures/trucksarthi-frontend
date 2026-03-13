import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { NotificationBadge } from "../../../components/NotificationBadge";
import {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  RefreshControl
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useThemeStore } from "../../../hooks/useThemeStore";
import { Calendar, MapPin, Truck, User, IndianRupee, FileText, ChevronDown, Plus, Navigation } from 'lucide-react-native';

import ClientFormModal from "../../../components/ClientModal";
import DriverFormModal from "../../../components/DriverModal";
import SideMenu from "../../../components/SideMenu";
import TruckFormModal from "../../../components/TruckModal";
import { SelectionModal } from "../../../components/SelectionModal";
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

export default function AddTrip() {
  const navigation = useNavigation();
  const router = useRouter();
  const { colors, theme } = useThemeStore();
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
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
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
          onPress={() => router.push("/(stack)/notifications" as any)}
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
    notes: "",
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");

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

  /* ---------------- Add Entity Modals ---------------- */
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);
  const [isTruckModalVisible, setIsTruckModalVisible] = useState(false);
  const [clientFormData, setClientFormData] = useState({ client_name: "", contact_person_name: "", contact_number: "", alternate_contact_number: "", email_address: "", office_address: "", gstin: "" });
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
    const { truck_id, driver_id, client_id, cost_of_trip } = formData;
    const trimmedStart = startQuery.trim();
    const trimmedEnd = endQuery.trim();

    if (!truck_id || !driver_id || !client_id || !trimmedStart || !trimmedEnd || !cost_of_trip) {
      Alert.alert("Missing Fields", "Please complete all required fields (*)");
      return;
    }

    try {
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
        notes: "",
      });
      setStartQuery("");
      setEndQuery("");
    } catch {
      Alert.alert("Error", "Failed to save trip. Please try again.");
    }
  };

  if (userLoading && !user) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color={colors.primary} /></View>;

  const startSuggestions = getLocationSuggestions(startQuery);
  const endSuggestions = getLocationSuggestions(endQuery);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
          <View className="mb-3">
            <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('addNewTrip')}</Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{t('recordJourney')}</Text>
          </View>

          {/* Date Selector */}
          <InputLabel label={t('tripDate')} required />
          <TouchableOpacity
            style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <View className="flex-row items-center flex-1">
              <Calendar size={20} color={colors.primary} />
              <Text className="ml-3 text-base" style={{ color: colors.foreground }}>{formatDate(formData.date.toISOString().split('T')[0])}</Text>
            </View>
            <ChevronDown size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Client Selector */}
          <InputLabel label={t('client')} required />
          <TouchableOpacity
            style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={() => setActiveModal('client')}
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

          {/* Origin */}
          <View>
            <InputLabel label={t('origin')} required />
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
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

          {/* Destination */}
          <View>
            <InputLabel label={t('destination')} required />
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
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

          <View className="flex-row gap-4">
            {/* Truck */}
            <View className="flex-1">
              <InputLabel label={t('truck')} required />
              <TouchableOpacity
                style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
                onPress={() => setActiveModal('truck')}
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
                style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
                onPress={() => setActiveModal('driver')}
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
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
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
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
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

          {/* Notes */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
            style={{ width: '100%' }}
          >
            <InputLabel label={t('tripNotes')} />
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF', height: 100, alignItems: 'flex-start', paddingTop: 16 }]}>
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
            style={{ backgroundColor: colors.primary }}
            className="mt-8 h-16 rounded-2xl items-center justify-center shadow-lg shadow-primary/30"
            onPress={handleSave}
          >
            <View className="flex-row items-center">
              <Plus size={24} color="white" strokeWidth={3} />
              <Text className="text-white text-xl font-bold ml-2">{t('recordTrip')}</Text>
            </View>
          </TouchableOpacity>

        </KeyboardAwareScrollView>

      {/* Select Modals */}
      <SelectionModal
        visible={activeModal === 'truck'}
        onClose={() => setActiveModal(null)}
        title="Select Truck"
        items={trucks.map(t => ({ label: t.registration_number, value: t._id }))}
        onSelect={(val) => setFormData({ ...formData, truck_id: val })}
        selectedValue={formData.truck_id}
        onAddItem={() => setIsTruckModalVisible(true)}
      />
      <SelectionModal
        visible={activeModal === 'driver'}
        onClose={() => setActiveModal(null)}
        title="Select Driver"
        items={drivers.map(d => ({ label: d.name || d.driver_name || "Driver", value: d._id }))}
        onSelect={(val) => setFormData({ ...formData, driver_id: val })}
        selectedValue={formData.driver_id}
        onAddItem={() => setIsDriverModalVisible(true)}
      />
      <SelectionModal
        visible={activeModal === 'client'}
        onClose={() => setActiveModal(null)}
        title="Select Client"
        items={clients.map(c => ({ label: c.client_name, value: c._id }))}
        onSelect={(val) => setFormData({ ...formData, client_id: val })}
        selectedValue={formData.client_id}
        onAddItem={() => setIsClientModalVisible(true)}
      />

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
      }} onClose={() => setIsTruckModalVisible(true)} />

      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} topOffset={0} />
    </View>
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
