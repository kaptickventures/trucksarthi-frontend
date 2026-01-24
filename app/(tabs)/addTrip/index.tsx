import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SideMenu from "../../../components/SideMenu";
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

  const [dropdowns, setDropdowns] = useState<Record<DropdownKeys, boolean>>({
    truck: false,
    driver: false,
    client: false,
    start: false,
    end: false,
  });

  /* ---------------- Modal Logic ---------------- */
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentType, setCurrentType] = useState<EntityType>("Client");
  const [newItemForm, setNewItemForm] = useState<NewItemForm>({});
  const translateY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, state) => state.y0 < 80,
      onPanResponderMove: (_, state) => {
        if (state.dy > 0) translateY.setValue(state.dy);
      },
      onPanResponderRelease: (_, state) => {
        if (state.dy > 120) closeEntityModal();
        else
          Animated.timing(translateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
      },
    })
  ).current;

  const openAddModal = (type: EntityType) => {
    setCurrentType(type);
    setNewItemForm(
      type === "Client"
        ? {
          client_name: "",
          contact_person_name: "",
          contact_number: "",
          email_address: "",
          office_address: "",
        }
        : type === "Driver"
          ? {
            driver_name: "",
            contact_number: "",
            license_number: "",
            address: "",
          }
          : type === "Truck"
            ? {
              registration_number: "",
              model: "",
              capacity: "",
              owner_name: "",
            }
            : {
              location_name: "",
              address: "",
            }
    );
    setIsModalVisible(true);
  };

  const closeEntityModal = () => {
    Animated.timing(translateY, {
      toValue: 800,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      setIsModalVisible(false);
    });
  };

  const handleAddNew = async () => {
    try {
      let created: any = null;

      if (currentType === "Client") {
        created = await addClient(newItemForm);
        setFormData((p) => ({ ...p, client_id: created._id }));
      }
      if (currentType === "Driver") {
        created = await addDriver(newItemForm);
        setFormData((p) => ({ ...p, driver_id: created._id }));
      }
      if (currentType === "Truck") {
        created = await addTruck(newItemForm);
        setFormData((p) => ({ ...p, truck_id: created._id }));
      }
      if (currentType === "Location") {
        created = await addLocation(newItemForm);
        setFormData((p) => ({
          ...p,
          start_location_id:
            p.start_location_id || created._id,
          end_location_id:
            p.end_location_id || created._id,
        }));
      }

      Alert.alert("Success", `${currentType} added successfully`);
      closeEntityModal();
    } catch {
      Alert.alert("Error", `Failed to add ${currentType}`);
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
        extraScrollHeight={70}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 250,
          backgroundColor,
        }}
        style={{ backgroundColor }}
      >

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            {/* Date */}
            <Text className="text-foreground mb-2 font-medium">
              Date <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              editable={false}
              value={formData.date}
              className="border border-input rounded-lg p-3 bg-input-bg text-input-text mb-6"
            />

            {/* Dropdowns */}
            {dropdownData.map((d, index) => (
              <View key={d.key} style={{ marginBottom: 30, zIndex: 5000 - index }}>
                <Text className="text-foreground mb-2 font-medium">
                  {d.label} <Text className="text-red-500">*</Text>
                </Text>

                <View className="flex-row items-center">
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <DropDownPicker
                      open={dropdowns[d.openKey]}
                      value={formData[d.key]}
                      items={d.items}
                      setOpen={(open) =>
                        setDropdowns((prev) => ({
                          ...prev,
                          [d.openKey]: typeof open === "function" ? open(prev[d.openKey]) : open,
                        }))
                      }
                      setValue={(cb) =>
                        setFormData((prev) => ({ ...prev, [d.key]: cb(prev[d.key]) }))
                      }
                      placeholder={`Select ${d.label}`}
                      listMode="SCROLLVIEW"
                      maxHeight={150}
                      scrollViewProps={{ nestedScrollEnabled: true }}
                      style={{
                        height: 48,
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                      }}
                      dropDownContainerStyle={{
                        backgroundColor: cardBg,
                        borderColor: inputBorder,
                      }}
                      textStyle={{
                        color: inputText,
                        fontSize: 15,
                      }}
                      placeholderStyle={{
                        color: placeholder,
                      }}
                    />
                  </View>

                  {/* Add Button */}
                  <TouchableOpacity
                    onPress={() => openAddModal(d.addType)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: inputBg,
                      borderWidth: 1,
                      borderColor: inputBorder,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: inputText,
                        fontSize: 22,
                        fontWeight: "600",
                        marginTop: -2,
                      }}
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Cost */}
            <Text className="text-foreground mb-2 font-medium">
              Cost of Trip (₹) <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              keyboardType="numeric"
              value={formData.cost_of_trip}
              onChangeText={(v) => setFormData({ ...formData, cost_of_trip: v })}
              className="border border-input rounded-lg p-3 bg-input-bg text-input-text mb-6"
            />

            {/* Miscellaneous */}
            <Text className="text-foreground mb-2 font-medium">
              Miscellaneous Expense (₹)
            </Text>
            <TextInput
              keyboardType="numeric"
              value={formData.miscellaneous_expense}
              onChangeText={(v) =>
                setFormData({ ...formData, miscellaneous_expense: v })
              }
              className="border border-input rounded-lg p-3 bg-input-bg text-input-text mb-6"
            />

            {/* Notes */}
            <Text className="text-foreground mb-2 font-medium">Notes</Text>
            <TextInput
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.notes}
              onChangeText={(v) => setFormData({ ...formData, notes: v })}
              className="border border-input rounded-lg p-3 bg-input-bg text-input-text mb-10"
            />

            {/* Submit Button */}
            <TouchableOpacity
              onPress={async () => {
                try {
                  await addTrip({
                    truck: formData.truck_id,
                    driver: formData.driver_id,
                    client: formData.client_id,
                    start_location: formData.start_location_id,
                    end_location: formData.end_location_id,
                    cost_of_trip: Number(formData.cost_of_trip),
                    miscellaneous_expense: Number(
                      formData.miscellaneous_expense || 0
                    ),
                    notes: formData.notes,
                  });

                  Alert.alert("Success", "Trip created successfully!");
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
                  Alert.alert("Error", "Failed to add trip");
                }
              }}
              className="bg-primary rounded-xl p-4 items-center mt-2"
            >
              <Text className="text-primary-foreground font-semibold text-base">
                Add Trip
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>

        <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
      </KeyboardAwareScrollView>

      {/* Modal */}
      <Modal transparent visible={isModalVisible} animationType="fade">
        <Pressable className="flex-1 bg-black/40" onPress={closeEntityModal}>
          <Animated.View
            {...panResponder.panHandlers}
            className="absolute bottom-0 w-full bg-background rounded-t-3xl"
            style={{
              height: "100%",
              paddingHorizontal: 20,
              paddingTop: insets.top + 20,
              transform: [{ translateY }],
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1"
            >
              <View className="w-14 h-1.5 bg-muted rounded-full self-center mb-4 opacity-60" />

              <View className="flex-row justify-between items-center mb-5">
                <Text
                  className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"
                    }`}
                >
                  Add New {currentType}
                </Text>
                <TouchableOpacity onPress={closeEntityModal}>
                  <Ionicons name="close" size={28} color={isDark ? "#AAA" : "#666"} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {Object.keys(newItemForm).map((key) => (
                  <View key={key} className="mb-6">
                    <Text className="text-muted-foreground mb-1 font-medium capitalize">
                      {key.replace(/_/g, " ")}
                      {["client_name", "driver_name", "registration_number", "location_name"].includes(key) && (
                        <Text className="text-red-500"> *</Text>
                      )}
                    </Text>
                    <TextInput
                      value={newItemForm[key]}
                      onChangeText={(val) =>
                        setNewItemForm((prev) => ({ ...prev, [key]: val }))
                      }
                      placeholder={`Enter ${key.replace(/_/g, " ")}`}
                      placeholderTextColor={placeholder}
                      keyboardType={key.includes("number") ? "numeric" : "default"}
                      className="border border-input text-input-text rounded-xl p-3 bg-input-bg"
                    />
                  </View>
                ))}

                <TouchableOpacity
                  onPress={handleAddNew}
                  className="bg-primary p-4 rounded-xl mb-3"
                >
                  <Text className="text-center text-primary-foreground font-semibold">
                    Save {currentType}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={closeEntityModal}
                  className="border border-border p-4 rounded-xl"
                >
                  <Text className="text-center text-muted-foreground">Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
