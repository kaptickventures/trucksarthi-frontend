import { getAuth } from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Modal,
  useColorScheme,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import "../../../global.css";

import useClients from "../../../hooks/useClient";
import useDrivers from "../../../hooks/useDriver";
import useLocations from "../../../hooks/useLocation";
import useTrips from "../../../hooks/useTrip";
import useTrucks from "../../../hooks/useTruck";

/* -------------------------------------------------
   TYPES
--------------------------------------------------*/
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

/* -------------------------------------------------
   INLINE THEME COLORS (DARK/LIGHT)
--------------------------------------------------*/
function useInlineThemeColors() {
  const dark = useColorScheme() === "dark";

  return {
    inputBg: dark ? "hsl(220 10% 18%)" : "hsl(0 0% 98%)",
    inputText: dark ? "hsl(0 0% 98%)" : "hsl(0 0% 4%)",
    inputBorder: dark ? "hsl(220 10% 35%)" : "hsl(0 0% 88%)",
    cardBg: dark ? "hsl(220 15% 12%)" : "hsl(0 0% 98%)",
    cardBorder: dark ? "hsl(220 10% 28%)" : "hsl(0 0% 88%)",
    placeholder: dark ? "hsl(0 0% 75%)" : "hsl(0 0% 40%)",
  };
}

/* -------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------*/
export default function AddTrip() {
  const colors = useInlineThemeColors();

  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { trucks, loading: loadingTrucks, addTruck } = useTrucks(firebase_uid || "");
  const { drivers, loading: loadingDrivers, addDriver } = useDrivers(firebase_uid || "");
  const { clients, loading: loadingClients, addClient } = useClients(firebase_uid || "");
  const { locations, loading: loadingLocations, addLocation } = useLocations(firebase_uid || "");
  const { addTrip } = useTrips(firebase_uid || "");

  const loading =
    !firebase_uid ||
    loadingTrucks ||
    loadingDrivers ||
    loadingClients ||
    loadingLocations;

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

  

  /* ---------------------- Modal ---------------------- */
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentType, setCurrentType] = useState<EntityType>("Client");
  const [newItemForm, setNewItemForm] = useState<NewItemForm>({});

  const openAddModal = (type: EntityType) => {
    setCurrentType(type);

    if (type === "Client") {
      setNewItemForm({
        client_name: "",
        contact_person_name: "",
        contact_number: "",
        alternate_contact_number: "",
        email_address: "",
        office_address: "",
      });
    }

    if (type === "Driver") {
      setNewItemForm({
        driver_name: "",
        phone_number: "",
        license_number: "",
        address: "",
      });
    }

    if (type === "Truck") {
      setNewItemForm({
        registration_number: "",
        model: "",
        capacity: "",
        owner_name: "",
      });
    }

    if (type === "Location") {
      setNewItemForm({
        location_name: "",
        address: "",
      });
    }

    setIsModalVisible(true);
  };

  /* --------------- ADD NEW ENTITY ---------------- */
  const handleAddNew = async () => {
    try {
      let created: any = null;

      if (currentType === "Client") {
        created = await addClient(newItemForm);
        setFormData((prev) => ({ ...prev, client_id: String(created.client_id) }));
      }

      if (currentType === "Driver") {
        created = await addDriver(newItemForm);
        setFormData((prev) => ({ ...prev, driver_id: String(created.driver_id) }));
      }

      if (currentType === "Truck") {
        created = await addTruck(newItemForm);
        setFormData((prev) => ({ ...prev, truck_id: String(created.truck_id) }));
      }

      if (currentType === "Location") {
        created = await addLocation(newItemForm);
        setFormData((prev) => ({
          ...prev,
          start_location_id: prev.start_location_id || String(created.location_id),
          end_location_id: prev.end_location_id || String(created.location_id),
        }));
      }

      Alert.alert("Success", `${currentType} added successfully!`);
      setIsModalVisible(false);

    } catch {
      Alert.alert("Error", `Failed to add ${currentType}`);
    }
  };

  /* ---------------------- Loading UI ---------------------- */
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="text-foreground mt-2">Loading...</Text>
      </View>
    );
  }

  /* ---------------------- Dropdown Data ---------------------- */
  const dropdownData = [
    {
      label: "Truck",
      key: "truck_id" as const,
      openKey: "truck" as DropdownKeys,
      items: trucks.map((t) => ({
        label: t.registration_number,
        value: String(t.truck_id),
      })),
      addType: "Truck" as EntityType,
    },
    {
      label: "Driver",
      key: "driver_id" as const,
      openKey: "driver" as DropdownKeys,
      items: drivers.map((d) => ({
        label: d.driver_name,
        value: String(d.driver_id),
      })),
      addType: "Driver" as EntityType,
    },
    {
      label: "Client",
      key: "client_id" as const,
      openKey: "client" as DropdownKeys,
      items: clients.map((c) => ({
        label: c.client_name,
        value: String(c.client_id),
      })),
      addType: "Client" as EntityType,
    },
    {
      label: "Start Location",
      key: "start_location_id" as const,
      openKey: "start" as DropdownKeys,
      items: locations.map((l) => ({
        label: l.location_name,
        value: String(l.location_id),
      })),
      addType: "Location" as EntityType,
    },
    {
      label: "End Location",
      key: "end_location_id" as const,
      openKey: "end" as DropdownKeys,
      items: locations.map((l) => ({
        label: l.location_name,
        value: String(l.location_id),
      })),
      addType: "Location" as EntityType,
    },
  ];

  /* ---------------------- UI ---------------------- */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 200 }}>
          
          {/* ---------------- Date ---------------- */}
          <Text className="text-foreground mb-2 font-medium">Date *</Text>
          <TextInput
            editable={false}
            value={formData.date}
            className="border border-input rounded-lg p-3 bg-input-bg text-input-text mb-6"
          />

          {/* ---------------- Dropdowns with Square Button ---------------- */}
          {dropdownData.map((d, index) => (
            <View
              key={d.key}
              style={{
                marginBottom: 30,
                zIndex: 5000 - index, // IMPORTANT: no overlap
              }}
            >
              <Text className="text-foreground mb-2 font-medium">{d.label} *</Text>

              <View className="flex-row items-center">
                
                {/* Dropdown */}
                <View style={{ flex: 1, marginRight: 10 }}>
                  <DropDownPicker
                    open={dropdowns[d.openKey]}
                    value={formData[d.key]}
                    items={d.items}
                    setOpen={(o) =>
                      setDropdowns((prev) => ({ ...prev, [d.openKey]: o }))
                    }
                    setValue={(cb) =>
                      setFormData((prev) => ({
                        ...prev,
                        [d.key]: cb(prev[d.key]),
                      }))
                    }
                    placeholder={`Select ${d.label}`}

                    // LIMIT HEIGHT + SCROLL
                    listMode="SCROLLVIEW"
                    maxHeight={150}
                    scrollViewProps={{ nestedScrollEnabled: true }}

                    style={{
                      height: 48,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    }}
                    dropDownContainerStyle={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    }}
                    textStyle={{ color: colors.inputText }}
                    placeholderStyle={{ color: colors.placeholder }}
                  />
                </View>

                {/* Square ADD button */}
                <TouchableOpacity
                  onPress={() => openAddModal(d.addType)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.inputText,
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

          {/* ---------------- Cost ---------------- */}
          <Text className="text-foreground mb-2 font-medium">Cost of Trip (₹) *</Text>
          <TextInput
            keyboardType="numeric"
            value={formData.cost_of_trip}
            onChangeText={(text) => setFormData({ ...formData, cost_of_trip: text })}
            className="border border-input rounded-lg p-3 bg-input-bg text-input-text mb-6"
          />

          {/* ---------------- Misc ---------------- */}
          <Text className="text-foreground mb-2 font-medium">Miscellaneous Expense (₹)</Text>
          <TextInput
            keyboardType="numeric"
            value={formData.miscellaneous_expense}
            onChangeText={(text) =>
              setFormData({ ...formData, miscellaneous_expense: text })
            }
            className="border border-input rounded-lg p-3 bg-input-bg text-input-text mb-6"
          />

          {/* ---------------- Notes ---------------- */}
          <Text className="text-foreground mb-2 font-medium">Notes</Text>
          <TextInput
            multiline
            numberOfLines={3}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            className="border border-input rounded-lg p-3 bg-input-bg text-input-text mb-10"
          />

          {/* ---------------- Submit ---------------- */}
          <TouchableOpacity
            onPress={async () => {
              try {
                await addTrip({
                  truck_id: Number(formData.truck_id),
                  driver_id: Number(formData.driver_id),
                  client_id: Number(formData.client_id),
                  start_location_id: Number(formData.start_location_id),
                  end_location_id: Number(formData.end_location_id),
                  cost_of_trip: Number(formData.cost_of_trip),
                  miscellaneous_expense: Number(formData.miscellaneous_expense || 0),
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

        </ScrollView>
      </TouchableWithoutFeedback>

      {/* ---------------- Modal ---------------- */}
      <Modal visible={isModalVisible} animationType="slide">
        <ScrollView className="flex-1 bg-background p-5">
          
          <Text className="text-2xl font-semibold text-foreground mb-8">
            Add New {currentType}
          </Text>

          {Object.keys(newItemForm).map((key) => (
            <View key={key} className="mb-6">
              <Text className="mb-2 text-muted-foreground font-medium capitalize">
                {key.replaceAll("_", " ")}
              </Text>
              <TextInput
                value={newItemForm[key]}
                onChangeText={(val) =>
                  setNewItemForm((prev) => ({ ...prev, [key]: val }))
                }
                className="border border-input rounded-xl p-3 bg-input-bg text-input-text"
              />
            </View>
          ))}

          {/* Save */}
          <TouchableOpacity
            onPress={handleAddNew}
            className="bg-primary p-4 rounded-2xl mt-4"
          >
            <Text className="text-center text-primary-foreground font-semibold text-base">
              Save {currentType}
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={() => setIsModalVisible(false)}
            className="mt-6 p-4 border border-border rounded-2xl"
          >
            <Text className="text-center text-muted-foreground font-medium text-base">
              Cancel
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </Modal>

    </KeyboardAvoidingView>
  );
}
