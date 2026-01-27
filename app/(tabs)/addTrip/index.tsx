import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  useColorScheme,
  View
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ClientFormModal from "../../../components/ClientModal";
import DriverFormModal from "../../../components/DriverModal";
import LocationFormModal from "../../../components/LocationModal";
import SideMenu from "../../../components/SideMenu";
import TruckFormModal from "../../../components/TruckModal";
import "../../../global.css";

/* ---------------- Hooks ---------------- */
import useClients from "../../../hooks/useClient";
import useDrivers from "../../../hooks/useDriver";
import useLocations from "../../../hooks/useLocation";
import useTrips from "../../../hooks/useTrip";
import useTrucks from "../../../hooks/useTruck";
import { useUser } from "../../../hooks/useUser";

import { THEME } from "../../../theme";

/* ------------------ Types ------------------ */
type EntityType = "Client" | "Driver" | "Truck" | "Location";
type DropdownKeys = "truck" | "driver" | "client" | "start" | "end";

type TripFormKeys =
  | "date"
  | "truck_id"
  | "driver_id"
  | "client_id"
  | "start_location_id"
  | "end_location_id"
  | "cost_of_trip"
  | "miscellaneous_expense"
  | "notes";

type TripForm = Record<TripFormKeys, string>;
type NewItemForm = Record<string, string>;

export default function AddTrip() {
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const isDark = colorScheme === "dark";

  const backgroundColor = isDark
    ? THEME.dark.background
    : THEME.light.background;

  const foregroundColor = isDark
    ? THEME.dark.foreground
    : THEME.light.foreground;

  const inputBg = isDark ? THEME.dark.input : THEME.light.input;
  const inputBorder = isDark ? THEME.dark.border : THEME.light.border;
  const inputText = isDark
    ? THEME.dark.foreground
    : THEME.light.foreground;
  const placeholder = isDark
    ? THEME.dark.mutedForeground
    : THEME.light.mutedForeground;
  const cardBg = isDark ? THEME.dark.card : THEME.light.card;

  /* ---------------- Header ---------------- */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trucksarthi",
      headerTitleAlign: "center",
      headerStyle: { backgroundColor },
      headerTitleStyle: { color: foregroundColor, fontWeight: "600" },
      headerTintColor: foregroundColor,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible((prev) => !prev)}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <Ionicons
            name={menuVisible ? "close" : "menu"}
            size={24}
            color={foregroundColor}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={foregroundColor}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, menuVisible, isDark]);

  /* ---------------- Auth ---------------- */
  const { user, loading: userLoading } = useUser();

  /* ---------------- Data Hooks ---------------- */
  const {
    trucks,
    loading: loadingTrucks,
    addTruck,
    fetchTrucks,
  } = useTrucks();

  const {
    drivers,
    loading: loadingDrivers,
    addDriver,
    fetchDrivers,
  } = useDrivers();

  const {
    clients,
    loading: loadingClients,
    addClient,
    fetchClients,
  } = useClients();

  const {
    locations,
    loading: loadingLocations,
    addLocation,
    fetchLocations,
  } = useLocations();

  const { addTrip } = useTrips();

  /* ✅ REQUIRED FETCH CALLS */
  useEffect(() => {
    fetchClients();
    fetchDrivers();
    fetchTrucks();
    fetchLocations();
  }, []);

  const loading =
    userLoading ||
    loadingTrucks ||
    loadingDrivers ||
    loadingClients ||
    loadingLocations;

  /* ---------------- Form ---------------- */
  const [formData, setFormData] = useState<TripForm>({
    date: new Date().toISOString().split("T")[0],
    truck_id: "",
    driver_id: "",
    client_id: "",
    start_location_id: "",
    end_location_id: "",
    cost_of_trip: "",
    miscellaneous_expense: "",
    notes: "",
  });

  const costRef = useRef<TextInput>(null);
  const miscRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dropdowns, setDropdowns] = useState<Record<DropdownKeys, boolean>>({
    truck: false,
    driver: false,
    client: false,
    start: false,
    end: false,
  });

  /* ---------------- Modal Logic ---------------- */
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);
  const [isTruckModalVisible, setIsTruckModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const [clientFormData, setClientFormData] = useState({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
  });

  const [driverFormData, setDriverFormData] = useState({
    driver_name: "",
    contact_number: "",
    identity_card_url: "",
    license_card_url: "",
  });

  const [truckFormData, setTruckFormData] = useState({
    registration_number: "",
    chassis_number: "",
    engine_number: "",
    registered_owner_name: "",
    container_dimension: "",
    loading_capacity: "",
  });

  const [locationFormData, setLocationFormData] = useState({
    location_name: "",
    complete_address: "",
  });

  const insets = useSafeAreaInsets();

  const openAddModal = (type: EntityType) => {
    if (type === "Client") {
      setClientFormData({
        client_name: "",
        contact_person_name: "",
        contact_number: "",
        alternate_contact_number: "",
        email_address: "",
        office_address: "",
      });
      setIsClientModalVisible(true);
    } else if (type === "Driver") {
      setDriverFormData({
        driver_name: "",
        contact_number: "",
        identity_card_url: "",
        license_card_url: "",
      });
      setIsDriverModalVisible(true);
    } else if (type === "Truck") {
      setTruckFormData({
        registration_number: "",
        chassis_number: "",
        engine_number: "",
        registered_owner_name: "",
        container_dimension: "",
        loading_capacity: "",
      });
      setIsTruckModalVisible(true);
    } else if (type === "Location") {
      setLocationFormData({
        location_name: "",
        complete_address: "",
      });
      setIsLocationModalVisible(true);
    }
  };

  const handleAddDriver = async () => {
    if (!driverFormData.driver_name || !driverFormData.contact_number) {
      Alert.alert("⚠️ Missing Fields", "Name and contact info required.");
      return;
    }
    try {
      const created = await addDriver(driverFormData);
      setFormData((p) => ({ ...p, driver_id: created._id }));
      setIsDriverModalVisible(false);
      Alert.alert("Success", "Driver added successfully");
      fetchDrivers();
    } catch {
      Alert.alert("Error", "Failed to add driver");
    }
  };

  const handleAddTruck = async () => {
    if (!truckFormData.registration_number || !truckFormData.registered_owner_name) {
      Alert.alert("⚠️ Missing Fields", "Registration number and owner required.");
      return;
    }
    try {
      const created = await addTruck({
        ...truckFormData,
        loading_capacity: truckFormData.loading_capacity ? Number(truckFormData.loading_capacity) : undefined
      });
      setFormData((p) => ({ ...p, truck_id: created._id }));
      setIsTruckModalVisible(false);
      Alert.alert("Success", "Truck added successfully");
      fetchTrucks();
    } catch {
      Alert.alert("Error", "Failed to add truck");
    }
  };

  const handleAddLocation = async () => {
    if (!locationFormData.location_name || !locationFormData.complete_address) {
      Alert.alert("⚠️ Missing Fields", "Name and address required.");
      return;
    }
    try {
      const created = await addLocation(locationFormData);
      if (!formData.start_location_id) {
        setFormData((p) => ({ ...p, start_location_id: created._id }));
      } else if (!formData.end_location_id) {
        setFormData((p) => ({ ...p, end_location_id: created._id }));
      }
      setIsLocationModalVisible(false);
      Alert.alert("Success", "Location added successfully");
      fetchLocations();
    } catch {
      Alert.alert("Error", "Failed to add location");
    }
  };

  const handleAddClient = async () => {
    if (!clientFormData.client_name || !clientFormData.contact_number) {
      Alert.alert("⚠️ Missing Fields", "Please fill name and contact number.");
      return;
    }
    try {
      const created = await addClient(clientFormData);
      setFormData((p) => ({ ...p, client_id: created._id }));
      setIsClientModalVisible(false);
      Alert.alert("Success", "Client added successfully");
      fetchClients();
    } catch {
      Alert.alert("Error", "Failed to add client");
    }
  };

  /* ---------------- Dropdown Data ---------------- */
  const dropdownData = [
    {
      label: "Truck",
      key: "truck_id" as const,
      openKey: "truck" as DropdownKeys,
      items: trucks.map((t) => ({
        label: t.registration_number,
        value: t._id,
      })),
      addType: "Truck" as EntityType,
    },
    {
      label: "Driver",
      key: "driver_id" as const,
      openKey: "driver" as DropdownKeys,
      items: drivers.map((d) => ({
        label: d.driver_name,
        value: d._id,
      })),
      addType: "Driver" as EntityType,
    },
    {
      label: "Client",
      key: "client_id" as const,
      openKey: "client" as DropdownKeys,
      items: clients.map((c) => ({
        label: c.client_name,
        value: c._id,
      })),
      addType: "Client" as EntityType,
    },
    {
      label: "Start Location",
      key: "start_location_id" as const,
      openKey: "start" as DropdownKeys,
      items: locations.map((l) => ({
        label: l.location_name,
        value: l._id,
      })),
      addType: "Location" as EntityType,
    },
    {
      label: "End Location",
      key: "end_location_id" as const,
      openKey: "end" as DropdownKeys,
      items: locations.map((l) => ({
        label: l.location_name,
        value: l._id,
      })),
      addType: "Location" as EntityType,
    },
  ];

  if (loading && !user) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-foreground">Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        enableAutomaticScroll={true}
        contentContainerStyle={{
          paddingBottom: 100,
          backgroundColor,
        }}
        style={{ backgroundColor }}
      >
        <View className="flex-1 pb-10">
          {/* Section: Trip Logistics */}
          <View className="bg-card border-y border-border mb-3">
            <WhatsAppItem
              icon="calendar-outline"
              label="Trip Date"
              value={new Date(formData.date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
              onPress={() => setShowDatePicker(true)}
              foregroundColor={foregroundColor}
              inputText={inputText}
            />
            <Divider />

            <WhatsAppDropdown
              icon="person-outline"
              label="Client"
              value={formData.client_id}
              items={clients.map(c => ({ label: c.client_name, value: c._id }))}
              open={dropdowns.client}
              onOpen={() => setDropdowns({ truck: false, driver: false, client: true, start: false, end: false })}
              setOpen={(val: any) => setDropdowns(prev => ({ ...prev, client: typeof val === 'function' ? val(prev.client) : val }))}
              setValue={(val: any) => setFormData(p => ({ ...p, client_id: val }))}
              onAdd={() => openAddModal("Client")}
              placeholder="Select Client"
              zIndex={6000}
              inputBg={inputBg}
              inputBorder={inputBorder}
              inputText={inputText}
              cardBg={cardBg}
              placeholderColor={placeholder}
            />
          </View>

          <View className="bg-card border-y border-border mb-3">
            <WhatsAppDropdown
              icon="location-outline"
              label="Origin"
              value={formData.start_location_id}
              items={locations.map(l => ({ label: l.location_name, value: l._id }))}
              open={dropdowns.start}
              onOpen={() => setDropdowns({ truck: false, driver: false, client: false, start: true, end: false })}
              setOpen={(val: any) => setDropdowns(prev => ({ ...prev, start: typeof val === 'function' ? val(prev.start) : val }))}
              setValue={(val: any) => setFormData(p => ({ ...p, start_location_id: val }))}
              onAdd={() => openAddModal("Location")}
              placeholder="Starting Point"
              zIndex={5000}
              inputBg={inputBg}
              inputBorder={inputBorder}
              inputText={inputText}
              cardBg={cardBg}
              placeholderColor={placeholder}
            />
            <Divider />
            <WhatsAppDropdown
              icon="navigate-outline"
              label="Destination"
              value={formData.end_location_id}
              items={locations.map(l => ({ label: l.location_name, value: l._id }))}
              open={dropdowns.end}
              onOpen={() => setDropdowns({ truck: false, driver: false, client: false, start: false, end: true })}
              setOpen={(val: any) => setDropdowns(prev => ({ ...prev, end: typeof val === 'function' ? val(prev.end) : val }))}
              setValue={(val: any) => setFormData(p => ({ ...p, end_location_id: val }))}
              onAdd={() => openAddModal("Location")}
              placeholder="Going To"
              zIndex={4000}
              inputBg={inputBg}
              inputBorder={inputBorder}
              inputText={inputText}
              cardBg={cardBg}
              placeholderColor={placeholder}
            />
          </View>

          <View className="bg-card border-y border-border mb-3">
            <WhatsAppDropdown
              icon="bus-outline"
              label="Truck"
              value={formData.truck_id}
              items={trucks.map(t => ({ label: t.registration_number, value: t._id }))}
              open={dropdowns.truck}
              onOpen={() => setDropdowns({ truck: true, driver: false, client: false, start: false, end: false })}
              setOpen={(val: any) => setDropdowns(prev => ({ ...prev, truck: typeof val === 'function' ? val(prev.truck) : val }))}
              setValue={(val: any) => setFormData(p => ({ ...p, truck_id: val }))}
              onAdd={() => openAddModal("Truck")}
              placeholder="Assign Truck"
              zIndex={3000}
              inputBg={inputBg}
              inputBorder={inputBorder}
              inputText={inputText}
              cardBg={cardBg}
              placeholderColor={placeholder}
            />
            <Divider />
            <WhatsAppDropdown
              icon="person-circle-outline"
              label="Driver"
              value={formData.driver_id}
              items={drivers.map(d => ({ label: d.driver_name, value: d._id }))}
              open={dropdowns.driver}
              onOpen={() => setDropdowns({ truck: false, driver: true, client: false, start: false, end: false })}
              setOpen={(val: any) => setDropdowns(prev => ({ ...prev, driver: typeof val === 'function' ? val(prev.driver) : val }))}
              setValue={(val: any) => setFormData(p => ({ ...p, driver_id: val }))}
              onAdd={() => openAddModal("Driver")}
              placeholder="Assign Driver"
              zIndex={2000}
              inputBg={inputBg}
              inputBorder={inputBorder}
              inputText={inputText}
              cardBg={cardBg}
              placeholderColor={placeholder}
            />
          </View>

          <View className="bg-card border-y border-border mb-3 p-4">
            <View className="flex-row items-center mb-6">
              <View className="w-10 items-center">
                <Ionicons name="cash-outline" size={20} color={THEME.light.primary} />
              </View>
              <View className="flex-1 ml-3 flex-row space-x-6">
                <View className="flex-1 border-b border-border pb-1">
                  <Text className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Trip Cost (₹)</Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={THEME.light.mutedForeground}
                    value={formData.cost_of_trip}
                    onChangeText={(v) => setFormData({ ...formData, cost_of_trip: v })}
                    style={{ color: inputText, fontSize: 16, padding: 0, fontWeight: '400' }}
                    returnKeyType="next"
                    onSubmitEditing={() => miscRef.current?.focus()}
                  />
                </View>
                <View className="flex-1 border-b border-border pb-1">
                  <Text className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Misc (₹)</Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={THEME.light.mutedForeground}
                    value={formData.miscellaneous_expense}
                    onChangeText={(v) => setFormData({ ...formData, miscellaneous_expense: v })}
                    style={{ color: inputText, fontSize: 16, padding: 0, fontWeight: '400' }}
                    ref={miscRef}
                    returnKeyType="next"
                    onSubmitEditing={() => notesRef.current?.focus()}
                  />
                </View>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-10 items-center mt-1">
                <Ionicons name="create-outline" size={20} color={THEME.light.primary} />
              </View>
              <View className="flex-1 ml-3 border-b border-border pb-1">
                <Text className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Notes</Text>
                <TextInput
                  multiline
                  placeholder="Tap to add notes..."
                  placeholderTextColor={THEME.light.mutedForeground}
                  value={formData.notes}
                  onChangeText={(v) => setFormData({ ...formData, notes: v })}
                  style={{ color: inputText, fontSize: 16, padding: 0, minHeight: 60, textAlignVertical: 'top' }}
                  ref={notesRef}
                />
              </View>
            </View>
          </View>

          <View className="px-6 mt-8">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                const required = ['truck_id', 'driver_id', 'client_id', 'start_location_id', 'end_location_id', 'cost_of_trip'];
                const missing = required.filter(k => !formData[k as keyof TripForm]);
                if (missing.length > 0) {
                  Alert.alert("Required Fields", "Please complete all fields to save the trip.");
                  return;
                }
                try {
                  await addTrip({
                    truck: formData.truck_id,
                    driver: formData.driver_id,
                    client: formData.client_id,
                    start_location: formData.start_location_id,
                    end_location: formData.end_location_id,
                    cost_of_trip: Number(formData.cost_of_trip),
                    miscellaneous_expense: Number(formData.miscellaneous_expense || 0),
                    notes: formData.notes,
                  });
                  Alert.alert("Success", "Trip saved successfully!");
                  setFormData({
                    date: new Date().toISOString().split("T")[0],
                    truck_id: "",
                    driver_id: "",
                    client_id: "",
                    start_location_id: "",
                    end_location_id: "",
                    cost_of_trip: "",
                    miscellaneous_expense: "",
                    notes: "",
                  });
                } catch {
                  Alert.alert("Error", "Could not save trip. Try again.");
                }
              }}
              className="bg-primary py-4 rounded-xl items-center shadow-md shadow-primary/20"
            >
              <Text className="text-white font-bold text-lg">Save Trip</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData({ ...formData, date: selectedDate.toISOString().split("T")[0] });
              }
            }}
          />
        )}

        <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
      </KeyboardAwareScrollView>

      {/* Shared Modals */}
      <ClientFormModal
        visible={isClientModalVisible}
        editing={false}
        formData={clientFormData}
        setFormData={setClientFormData}
        onSubmit={handleAddClient}
        onClose={() => setIsClientModalVisible(false)}
      />

      <DriverFormModal
        visible={isDriverModalVisible}
        editing={false}
        formData={driverFormData}
        setFormData={setDriverFormData}
        onSubmit={handleAddDriver}
        onClose={() => setIsDriverModalVisible(false)}
      />

      <TruckFormModal
        visible={isTruckModalVisible}
        editing={false}
        formData={truckFormData}
        setFormData={setTruckFormData}
        onSubmit={handleAddTruck}
        onClose={() => setIsTruckModalVisible(false)}
      />

      <LocationFormModal
        visible={isLocationModalVisible}
        editing={false}
        formData={locationFormData}
        setFormData={setLocationFormData}
        onSubmit={handleAddLocation}
        onClose={() => setIsLocationModalVisible(false)}
      />
    </View>
  );
}

/* ---------------- Components ---------------- */

function WhatsAppDropdown({
  icon,
  label,
  value,
  items,
  open,
  onOpen,
  setOpen,
  setValue,
  onAdd,
  placeholder,
  zIndex,
  inputBg,
  inputBorder,
  inputText,
  cardBg,
  placeholderColor,
}: any) {
  return (
    <View style={{ zIndex }}>
      <View className="flex-row items-center p-4">
        <View className="w-10 items-center">
          <Ionicons name={icon as any} size={20} color={THEME.light.primary} />
        </View>
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between mb-0.5">
            <Text className="text-[10px] text-primary font-bold uppercase tracking-widest">{label}</Text>
            <TouchableOpacity
              onPress={onAdd}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ paddingRight: 2 }}
            >
              <Ionicons name="add" size={18} color={THEME.light.primary} />
            </TouchableOpacity>
          </View>
          <DropDownPicker
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            onOpen={onOpen}
            setValue={setValue}
            placeholder={placeholder}
            listMode="SCROLLVIEW"
            maxHeight={150}
            scrollViewProps={{ nestedScrollEnabled: true }}
            style={{
              borderWidth: 0,
              backgroundColor: 'transparent',
              paddingHorizontal: 0,
              minHeight: 30,
            }}
            dropDownContainerStyle={{
              backgroundColor: cardBg,
              borderColor: inputBorder,
              borderRadius: 12,
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
            textStyle={{ color: inputText, fontSize: 16, fontWeight: '400' }}
            placeholderStyle={{ color: THEME.light.mutedForeground, fontSize: 16 }}
            showArrowIcon={true}
            ArrowDownIconComponent={() => <Ionicons name="chevron-down" size={16} color={THEME.light.mutedForeground} />}
            ArrowUpIconComponent={() => <Ionicons name="chevron-up" size={16} color={THEME.light.mutedForeground} />}
          />
        </View>
      </View>
    </View>
  );
}

function WhatsAppItem({ icon, label, value, onPress, foregroundColor, inputText, isPlaceholder }: any) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center p-4"
    >
      <View className="w-10 items-center">
        <Ionicons name={icon as any} size={20} color={THEME.light.primary} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">{label}</Text>
        <Text
          style={{
            color: isPlaceholder ? THEME.light.mutedForeground : inputText,
            fontSize: 16,
            fontWeight: '400'
          }}
        >
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={THEME.light.mutedForeground} />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View className="h-[1px] bg-border ml-14 mr-4" />;
}

function Section({ children, title, icon, cardBg }: { children: React.ReactNode; title: string; icon: string; cardBg: string }) {
  return (
    <View className="mb-6 p-6 rounded-[32px] shadow-sm" style={{ backgroundColor: cardBg }}>
      <View className="flex-row items-center mb-6">
        <View className="p-2.5 rounded-2xl" style={{ backgroundColor: THEME.light.accent }}>
          <Ionicons name={icon as any} size={18} color={THEME.light.primary} />
        </View>
        <Text className="ml-3 text-lg font-extrabold text-foreground tracking-tight">{title}</Text>
      </View>
      {children}
    </View>
  );
}

interface DropdownFieldProps {
  label: string;
  value: string;
  items: { label: string; value: string }[];
  open: boolean;
  setOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  setValue: (val: any) => void;
  onAdd: () => void;
  placeholder: string;
  zIndex: number;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  cardBg: string;
  placeholderColor: string;
  marginBottom?: number;
  hideLabelPrefix?: boolean;
}

function DropdownField({
  label,
  value,
  items,
  open,
  setOpen,
  setValue,
  onAdd,
  placeholder,
  zIndex,
  inputBg,
  inputBorder,
  inputText,
  cardBg,
  placeholderColor,
  marginBottom = 20,
  hideLabelPrefix = false
}: DropdownFieldProps) {
  return (
    <View style={{ zIndex, marginBottom }}>
      <Text className="text-[11px] font-bold mb-2 opacity-40 uppercase tracking-widest" style={{ color: THEME.light.foreground }}>
        {label} {!hideLabelPrefix && <Text className="text-destructive">*</Text>}
      </Text>
      <View className="flex-row items-center">
        <View style={{ flex: 1 }}>
          <DropDownPicker
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={(cb) => setValue(cb(value))}
            placeholder={placeholder}
            listMode="SCROLLVIEW"
            maxHeight={150}
            scrollViewProps={{ nestedScrollEnabled: true }}
            style={{
              height: 50,
              backgroundColor: inputBg,
              borderColor: inputBorder,
              borderRadius: 16,
            }}
            dropDownContainerStyle={{
              backgroundColor: cardBg,
              borderColor: inputBorder,
              borderRadius: 14,
            }}
            textStyle={{ color: inputText, fontSize: 14, fontWeight: '500' }}
            placeholderStyle={{ color: placeholderColor, fontSize: 14 }}
          />
        </View>
        <TouchableOpacity
          onPress={onAdd}
          className="ml-2.5 h-[50px] w-[50px] rounded-2xl items-center justify-center border"
          style={{ backgroundColor: inputBg, borderColor: inputBorder }}
        >
          <Ionicons name="add" size={22} color={THEME.light.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
