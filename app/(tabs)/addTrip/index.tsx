import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet
} from "react-native";
import { useThemeStore } from "../../../hooks/useThemeStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, MapPin, Truck, User, IndianRupee, FileText, ChevronDown, Plus, Navigation } from 'lucide-react-native';

import ClientFormModal from "../../../components/ClientModal";
import DriverFormModal from "../../../components/DriverModal";
import LocationFormModal from "../../../components/LocationModal";
import SideMenu from "../../../components/SideMenu";
import TruckFormModal from "../../../components/TruckModal";
import { SelectionModal } from "../../../components/SelectionModal";
import { DatePickerModal } from "../../../components/DatePickerModal";

import "../../../global.css";
import { formatDate } from "../../../lib/utils";
import { THEME } from "../../../theme";

/* ---------------- Hooks ---------------- */
import useClients from "../../../hooks/useClient";
import useDrivers from "../../../hooks/useDriver";
import useLocations from "../../../hooks/useLocation";
import useTrips from "../../../hooks/useTrip";
import useTrucks from "../../../hooks/useTruck";
import { useUser } from "../../../hooks/useUser";

type EntityType = "Client" | "Driver" | "Truck" | "Location";

export default function AddTrip() {
  const navigation = useNavigation();
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();

  /* ---------------- Header ---------------- */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
      headerTitleStyle: { color: colors.foreground, fontWeight: "600", fontSize: 18 },
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
          onPress={() => router.push("/notifications")}
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, menuVisible]);

  /* ---------------- Data Hooks ---------------- */
  const { user, loading: userLoading } = useUser();
  const { trucks, addTruck, fetchTrucks } = useTrucks();
  const { drivers, addDriver, fetchDrivers } = useDrivers();
  const { clients, addClient, fetchClients } = useClients();
  const { locations, addLocation, fetchLocations } = useLocations();
  const { addTrip } = useTrips();

  useEffect(() => {
    fetchClients();
    fetchDrivers();
    fetchTrucks();
    fetchLocations();
  }, []);

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

  /* ---------------- Entity Selectors ---------------- */
  const getSelectedLabel = (type: 'truck' | 'driver' | 'client' | 'start' | 'end') => {
    switch (type) {
      case 'truck': return trucks.find(t => t._id === formData.truck_id)?.registration_number;
      case 'driver': return drivers.find(d => d._id === formData.driver_id)?.driver_name;
      case 'client': return clients.find(c => c._id === formData.client_id)?.client_name;
      case 'start': return locations.find(l => l._id === formData.start_location_id)?.location_name;
      case 'end': return locations.find(l => l._id === formData.end_location_id)?.location_name;
      default: return "";
    }
  };

  /* ---------------- Add Entity Modals ---------------- */
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);
  const [isTruckModalVisible, setIsTruckModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const [clientFormData, setClientFormData] = useState({ client_name: "", contact_person_name: "", contact_number: "", alternate_contact_number: "", email_address: "", office_address: "" });
  const [driverFormData, setDriverFormData] = useState({ driver_name: "", contact_number: "", identity_card_url: "", license_card_url: "" });
  const [truckFormData, setTruckFormData] = useState({ registration_number: "", chassis_number: "", engine_number: "", registered_owner_name: "", container_dimension: "", loading_capacity: "" });
  const [locationFormData, setLocationFormData] = useState({ location_name: "", complete_address: "" });

  const handleSave = async () => {
    const { truck_id, driver_id, client_id, start_location_id, end_location_id, cost_of_trip } = formData;
    if (!truck_id || !driver_id || !client_id || !start_location_id || !end_location_id || !cost_of_trip) {
      Alert.alert("Missing Fields", "Please complete all required fields (*)");
      return;
    }

    try {
      await addTrip({
        truck: truck_id,
        driver: driver_id,
        client: client_id,
        start_location: start_location_id,
        end_location: end_location_id,
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
    } catch (error) {
      Alert.alert("Error", "Failed to save trip. Please try again.");
    }
  };

  if (userLoading && !user) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title Section */}
          <View className="mb-6">
            <Text className="text-3xl font-black" style={{ color: colors.foreground }}>Add New Trip</Text>
            <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Record your fleet's journey</Text>
          </View>

          {/* Date Selector */}
          <InputLabel label="Trip Date" required />
          <TouchableOpacity
            style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <View className="flex-row items-center">
              <Calendar size={20} color={colors.primary} />
              <Text className="ml-3 text-base" style={{ color: colors.foreground }}>{formatDate(formData.date.toISOString().split('T')[0])}</Text>
            </View>
            <ChevronDown size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Client Selector */}
          <InputLabel label="Client" required />
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
                {getSelectedLabel('client') || "Select Client"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsClientModalVisible(true)} className="p-1">
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>

          <View className="flex-row gap-4">
            {/* Origin */}
            <View className="flex-1">
              <InputLabel label="Origin" required />
              <TouchableOpacity
                style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
                onPress={() => setActiveModal('start')}
              >
                <View className="flex-row items-center flex-1">
                  <MapPin size={20} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    className="ml-2 text-base"
                    style={{ color: getSelectedLabel('start') ? colors.foreground : colors.mutedForeground }}
                  >
                    {getSelectedLabel('start') || "From"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Destination */}
            <View className="flex-1">
              <InputLabel label="Destination" required />
              <TouchableOpacity
                style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
                onPress={() => setActiveModal('end')}
              >
                <View className="flex-row items-center flex-1">
                  <Navigation size={20} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    className="ml-2 text-base"
                    style={{ color: getSelectedLabel('end') ? colors.foreground : colors.mutedForeground }}
                  >
                    {getSelectedLabel('end') || "To"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              className="mt-11 h-12 w-12 items-center justify-center rounded-2xl border"
              style={{ backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }}
              onPress={() => setIsLocationModalVisible(true)}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-4">
            {/* Truck */}
            <View className="flex-1">
              <InputLabel label="Truck" required />
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
                    {getSelectedLabel('truck') || "Truck"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Driver */}
            <View className="flex-1">
              <InputLabel label="Driver" required />
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
                    {getSelectedLabel('driver') || "Driver"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              className="mt-11 h-12 w-12 items-center justify-center rounded-2xl border"
              style={{ backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }}
              onPress={() => setIsDriverModalVisible(true)}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Pricing Row */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <InputLabel label="Freight Cost" required />
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
          <InputLabel label="Trip Notes" />
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF', height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
            <FileText size={18} color={colors.primary} />
            <TextInput
              placeholder="Any additional details..."
              multiline
              numberOfLines={4}
              className="flex-1 ml-2 text-base"
              style={{ color: colors.foreground, textAlignVertical: 'top' }}
              value={formData.notes}
              onChangeText={(t) => setFormData({ ...formData, notes: t })}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ backgroundColor: colors.primary }}
            className="mt-8 h-16 rounded-2xl items-center justify-center shadow-lg shadow-primary/30"
            onPress={handleSave}
          >
            <View className="flex-row items-center">
              <Plus size={24} color="white" strokeWidth={3} />
              <Text className="text-white text-xl font-bold ml-2">Record Trip</Text>
            </View>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

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
        items={drivers.map(d => ({ label: d.driver_name, value: d._id }))}
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
      <SelectionModal
        visible={activeModal === 'start'}
        onClose={() => setActiveModal(null)}
        title="Select Origin"
        items={locations.map(l => ({ label: l.location_name, value: l._id }))}
        onSelect={(val) => setFormData({ ...formData, start_location_id: val })}
        selectedValue={formData.start_location_id}
        onAddItem={() => setIsLocationModalVisible(true)}
      />
      <SelectionModal
        visible={activeModal === 'end'}
        onClose={() => setActiveModal(null)}
        title="Select Destination"
        items={locations.map(l => ({ label: l.location_name, value: l._id }))}
        onSelect={(val) => setFormData({ ...formData, end_location_id: val })}
        selectedValue={formData.end_location_id}
        onAddItem={() => setIsLocationModalVisible(true)}
      />

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        date={formData.date}
        onChange={(d) => setFormData({ ...formData, date: d })}
      />

      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />

      {/* Creation Modals */}
      <ClientFormModal visible={isClientModalVisible} editing={false} formData={clientFormData} setFormData={setClientFormData} onSubmit={async () => {
        if (!clientFormData.client_name || !clientFormData.contact_number) return Alert.alert("Missing Fields", "Name and contact required.");
        const res = await addClient(clientFormData);
        setFormData(p => ({ ...p, client_id: res._id }));
        setIsClientModalVisible(false);
        fetchClients();
      }} onClose={() => setIsClientModalVisible(false)} />

      <DriverFormModal visible={isDriverModalVisible} editing={false} formData={driverFormData} setFormData={setDriverFormData} onSubmit={async () => {
        if (!driverFormData.driver_name || !driverFormData.contact_number) return Alert.alert("Missing Fields", "Name and contact required.");
        const res = await addDriver(driverFormData);
        setFormData(p => ({ ...p, driver_id: res._id }));
        setIsDriverModalVisible(false);
        fetchDrivers();
      }} onClose={() => setIsDriverModalVisible(false)} />

      <TruckFormModal visible={isTruckModalVisible} editing={false} formData={truckFormData} setFormData={setTruckFormData} onSubmit={async () => {
        if (!truckFormData.registration_number || !truckFormData.registered_owner_name) return Alert.alert("Missing Fields", "Registration and owner required.");
        const res = await addTruck({ ...truckFormData, loading_capacity: truckFormData.loading_capacity ? Number(truckFormData.loading_capacity) : undefined });
        setFormData(p => ({ ...p, truck_id: res._id }));
        setIsTruckModalVisible(false);
        fetchTrucks();
      }} onClose={() => setIsTruckModalVisible(false)} />

      <LocationFormModal visible={isLocationModalVisible} editing={false} formData={locationFormData} setFormData={setLocationFormData} onSubmit={async () => {
        if (!locationFormData.location_name || !locationFormData.complete_address) return Alert.alert("Missing Fields", "Name and address required.");
        const res = await addLocation(locationFormData);
        if (!formData.start_location_id) setFormData(p => ({ ...p, start_location_id: res._id }));
        else if (!formData.end_location_id) setFormData(p => ({ ...p, end_location_id: res._id }));
        setIsLocationModalVisible(false);
        fetchLocations();
      }} onClose={() => setIsLocationModalVisible(false)} />

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
  }
});
