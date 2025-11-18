import { useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { Edit3, MapPin, Plus, Trash2, X } from "lucide-react-native";
import React, { useCallback, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import useTrucks from "../../hooks/useTruck";

export default function TrucksManager() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const { trucks, loading, fetchTrucks, addTruck, updateTruck, deleteTruck } =
    useTrucks(firebase_uid || "");

  const isDark = useColorScheme() === "dark";
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const requiredFields = ["registration_number", "registered_owner_name","chassis_number",
    "engine_number",
    "container_dimension",
    "loading_capacity",];
  

  const [formData, setFormData] = useState({
    registration_number: "",
    chassis_number: "",
    engine_number: "",
    registered_owner_name: "",
    container_dimension: "",
    loading_capacity: "",
  });

  const translateY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const SCROLL_THRESHOLD = 40;

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchTrucks();
    }, [firebase_uid, fetchTrucks])
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, state) => state.y0 < SCROLL_THRESHOLD,
      onPanResponderMove: (_, state) => {
        if (state.dy > 0) translateY.setValue(state.dy);
      },
      onPanResponderRelease: (_, state) => {
        if (state.dy > 120) closeModal();
        else
          Animated.timing(translateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
      },
    })
  ).current;

  const openModal = (editing = false, data?: any) => {
    if (editing && data) {
      setEditingId(data.truck_id);
      setFormData({
        registration_number: data.registration_number || "",
        chassis_number: data.chassis_number || "",
        engine_number: data.engine_number || "",
        registered_owner_name: data.registered_owner_name || "",
        container_dimension: data.container_dimension || "",
        loading_capacity: data.loading_capacity
          ? String(data.loading_capacity)
          : "",
      });
    } else {
      setEditingId(null);
      setFormData({
        registration_number: "",
        chassis_number: "",
        engine_number: "",
        registered_owner_name: "",
        container_dimension: "",
        loading_capacity: "",
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: 800,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      setModalVisible(false);
    });
  };

  const handleSubmit = async () => {
    if (!formData.registration_number || !formData.registered_owner_name) {
      Alert.alert("⚠️ Missing Fields", "Please fill the required fields.");
      return;
    }

    try {
      if (editingId) {
        await updateTruck(editingId, formData);
        Alert.alert("Success", "Truck updated successfully.");
      } else {
        await addTruck(formData);
        Alert.alert("Success", "Truck added successfully.");
      }
      closeModal();
      fetchTrucks();
    } catch (err) {
      Alert.alert("Error", "Failed to save truck.");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm Delete", "Delete this truck?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTruck(id);
          fetchTrucks();
        },
      },
    ]);
  };

  if (!firebase_uid) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#888" />
        <Text className="mt-2 text-muted-foreground">Loading user info...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Truck List */}
      <ScrollView
        className="flex-1 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : trucks.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">
            No trucks found.
          </Text>
        ) : (
          trucks.map((truck) => (
            <View
              key={truck.truck_id}
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm flex-row justify-between items-center"
            >
              <View className="flex-row items-start flex-1">
                <View className="p-2 bg-secondary rounded-xl mr-3">
                  <MapPin size={18} color="#2563EB" />
                </View>

                <View className="flex-1">
                  <Text className="text-card-foreground font-semibold text-base">
                    {truck.registration_number}
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1">
                    {truck.registered_owner_name}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center ml-3">
                <TouchableOpacity
                  onPress={() => openModal(true, truck)}
                  className="p-2"
                >
                  <Edit3 size={20} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(truck.truck_id)}
                  className="p-2"
                >
                  <Trash2 size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => openModal(false)}
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

      {/* Fullscreen Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/40" onPress={closeModal}>
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
                  className={`text-2xl font-semibold ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  {editingId ? "Edit Truck" : "Add Truck"}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <X size={28} color={isDark ? "#AAA" : "#666"} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {[...requiredFields].map((key) => {
                  const label = key.replaceAll("_", " ");
                  const isRequired = requiredFields.includes(key);
                  const isDimension = key === "container_dimension";
                  const isCapacity = key === "loading_capacity";

                  return (
                    <View key={key} className="mb-4">
                      <Text className="text-muted-foreground mb-1 font-medium capitalize">
                        {label}
                        {isRequired && <Text className="text-red-500"> *</Text>}
                      </Text>
                      <TextInput
                        className="border border-input text-input-text rounded-xl p-3"
                        value={(formData as any)[key]}
                        onChangeText={(val) =>
                          setFormData({ ...formData, [key]: val })
                        }
                        placeholder={`Enter ${label}`}
                        placeholderTextColor="#888"
                        keyboardType={
                          isCapacity
                            ? "numeric"
                            : key.includes("number")
                            ? "default"
                            : "default"
                        }
                      />
                      {/* Unit Indicator */}
                      {isDimension && (
                        <Text className="text-xs text-muted-foreground mt-1">
                          * Dimensions are in feet
                        </Text>
                      )}
                      {isCapacity && (
                        <Text className="text-xs text-muted-foreground mt-1">
                          * Capacity is in tonnes
                        </Text>
                      )}
                    </View>
                  );
                })}

                <TouchableOpacity
                  onPress={handleSubmit}
                  className="bg-primary p-4 rounded-xl mb-3"
                >
                  <Text className="text-center text-primary-foreground font-semibold">
                    {editingId ? "Update" : "Save"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={closeModal}
                  className="border border-border p-4 rounded-xl"
                >
                  <Text className="text-center text-muted-foreground">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
