import { getAuth } from "firebase/auth";
import { Edit3, MapPin, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import BottomSheet from "@gorhom/bottom-sheet";
import useLocations from "../../hooks/useLocation";

export default function LocationsManager() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const {
    locations,
    loading,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
  } = useLocations(firebase_uid || "");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    location_name: "",
    complete_address: "",
  });

  // Bottom Sheet Reference
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["35%", "65%"], []);

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchLocations();
    }, [firebase_uid, fetchLocations])
  );

  const openSheet = (editing = false, data?: any) => {
    if (editing && data) {
      setEditingId(data.location_id);
      setFormData({
        location_name: data.location_name,
        complete_address: data.complete_address,
      });
    } else {
      setEditingId(null);
      setFormData({ location_name: "", complete_address: "" });
    }

    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const handleSubmit = async () => {
    if (!formData.location_name || !formData.complete_address)
      return Alert.alert("Validation", "Please fill all fields");

    try {
      if (editingId) {
        await updateLocation(editingId, formData);
      } else {
        await addLocation(formData);
      }
      closeSheet();
      fetchLocations();
    } catch {
      Alert.alert("Error", "Failed to save location");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm", "Delete this location?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteLocation(id) },
    ]);
  };

  if (!firebase_uid)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#888" />
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView
        className="flex-1 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : locations.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">
            No locations found.
          </Text>
        ) : (
          locations.map((loc) => (
            <View
              key={loc.location_id}
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm flex-row justify-between items-center"
            >
              {/* LEFT SIDE */}
              <View className="flex-row items-start flex-1">
                <View className="p-2 bg-secondary rounded-xl mr-3">
                  <MapPin size={18} color="#2563EB" />
                </View>

                <View className="flex-1">
                  <Text className="text-card-foreground font-semibold text-base">
                    {loc.location_name}
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1">
                    {loc.complete_address}
                  </Text>
                </View>
              </View>

              {/* RIGHT SIDE ICONS */}
              <View className="flex-row items-center ml-3">
                <TouchableOpacity
                  onPress={() => openSheet(true, loc)}
                  className="p-2"
                >
                  <Edit3 size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(loc.location_id)}
                  className="p-2"
                >
                  <Trash2 size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => openSheet(false)}
        className="absolute bottom-8 right-6 bg-primary w-16 h-16 rounded-full justify-center items-center"
        style={{
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints}>
        <View className="px-5 py-3">

          <Text className="text-xl font-semibold text-foreground mb-4">
            {editingId ? "Edit Location" : "Add Location"}
          </Text>

          <Text className="text-muted-foreground mb-1 font-medium">Location Name</Text>
          <TextInput
            className="border border-input rounded-xl p-3 mb-4"
            value={formData.location_name}
            onChangeText={(val) =>
              setFormData({ ...formData, location_name: val })
            }
          />

          <Text className="text-muted-foreground mb-1 font-medium">Complete Address</Text>
          <TextInput
            className="border border-input rounded-xl p-3 mb-4"
            value={formData.complete_address}
            onChangeText={(val) =>
              setFormData({ ...formData, complete_address: val })
            }
          />

          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-primary p-4 rounded-xl"
          >
            <Text className="text-center text-primary-foreground font-semibold">
              {editingId ? "Update" : "Save"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={closeSheet}
            className="border border-border p-4 rounded-xl mt-3"
          >
            <Text className="text-center text-muted-foreground">Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
