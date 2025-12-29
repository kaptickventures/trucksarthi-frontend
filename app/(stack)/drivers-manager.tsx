import { useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { Edit3, MapPin, Plus, Trash2, X } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
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
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import useDrivers from "../../hooks/useDriver"; // ✅ FIXED IMPORT

export default function DriversManager() {
  const router = useRouter();
  const auth = getAuth();
  const firebase_uid = auth.currentUser?.uid;

  const {
    drivers,
    loading,
    fetchDrivers,
    addDriver,
    updateDriver,
    deleteDriver,
  } = useDrivers(firebase_uid || "");

  const isDark = useColorScheme() === "dark";
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    driver_name: "",
    contact_number: "",
    identity_card_url: "",
    license_card_url: "",
  });

  const requiredFields: Array<keyof typeof formData> = [
    "driver_name",
    "contact_number",
  ];

  const translateY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const SCROLL_THRESHOLD = 40;

  /* ---------------- FETCH ON FOCUS ---------------- */
  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchDrivers();
    }, [firebase_uid])
  );

  /* ---------------- IMAGE PICKER ---------------- */
  const pickImage = async (field: keyof typeof formData) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow gallery access to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setFormData({
        ...formData,
        [field]: result.assets[0].uri,
      });
    }
  };

  /* ---------------- MODAL GESTURE ---------------- */
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
      setEditingId(data.driver_id);
      setFormData({
        driver_name: data.driver_name || "",
        contact_number: data.contact_number || "",
        identity_card_url: data.identity_card_url || "",
        license_card_url: data.license_card_url || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        driver_name: "",
        contact_number: "",
        identity_card_url: "",
        license_card_url: "",
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

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert("⚠️ Missing Fields", "Please fill all required fields.");
        return;
      }
    }

    try {
      if (editingId) {
        await updateDriver(editingId, formData);
        Alert.alert("Success", "Driver updated successfully.");
      } else {
        await addDriver(formData);
        Alert.alert("Success", "Driver added successfully.");
      }
      closeModal();
      fetchDrivers();
    } catch {
      Alert.alert("Error", "Failed to save driver.");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm Delete", "Delete this driver?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDriver(id);
          fetchDrivers();
        },
      },
    ]);
  };

  if (!firebase_uid) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#888" />
        <Text className="mt-2 text-muted-foreground">
          Loading user info...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        className="flex-1 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : drivers.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">
            No drivers found.
          </Text>
        ) : (
          drivers.map((driver) => (
            <TouchableOpacity
              key={driver.driver_id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(stack)/driver-profile",
                  params: {
                    driver_id: driver.driver_id, // ✅ ONLY ID PASSED
                  },
                })
              }
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-start flex-1">
                  <View className="p-2 bg-secondary rounded-xl mr-3">
                    <MapPin size={18} color="#2563EB" />
                  </View>

                  <View className="flex-1">
                    <Text className="text-card-foreground font-semibold text-base">
                      {driver.driver_name}
                    </Text>
                    <Text className="text-muted-foreground text-xs mt-1">
                      {driver.contact_number}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center ml-3">
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      openModal(true, driver);
                    }}
                    className="p-2"
                  >
                    <Edit3 size={20} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(driver.driver_id);
                    }}
                    className="p-2"
                  >
                    <Trash2 size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => openModal(false)}
        className="absolute bottom-8 right-6 bg-primary w-16 h-16 rounded-full justify-center items-center"
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

      {/* Modal */}
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
                <Text className="text-2xl font-semibold">
                  {editingId ? "Edit Driver" : "Add Driver"}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <X size={28} color={isDark ? "#AAA" : "#666"} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {requiredFields.map((key) => (
                  <View key={key} className="mb-4">
                    <Text className="text-muted-foreground mb-1 font-medium capitalize">
                      {key.replaceAll("_", " ")}{" "}
                      <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className="border border-input rounded-xl p-3"
                      value={formData[key]}
                      onChangeText={(val) =>
                        setFormData({ ...formData, [key]: val })
                      }
                      keyboardType={
                        key === "contact_number"
                          ? "phone-pad"
                          : "default"
                      }
                    />
                  </View>
                ))}

                {/* Identity Card */}
                <View className="mb-4">
                  <Text className="text-muted-foreground mb-1 font-medium">
                    Identity Card Photo
                  </Text>
                  {formData.identity_card_url !== "" && (
                    <Image
                      source={{ uri: formData.identity_card_url }}
                      style={{
                        width: "100%",
                        height: 160,
                        borderRadius: 12,
                        marginBottom: 10,
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => pickImage("identity_card_url")}
                    className="bg-secondary p-3 rounded-xl"
                  >
                    <Text className="text-center">
                      {formData.identity_card_url
                        ? "Change Photo"
                        : "Upload Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* License Card */}
                <View className="mb-4">
                  <Text className="text-muted-foreground mb-1 font-medium">
                    License Card Photo
                  </Text>
                  {formData.license_card_url !== "" && (
                    <Image
                      source={{ uri: formData.license_card_url }}
                      style={{
                        width: "100%",
                        height: 160,
                        borderRadius: 12,
                        marginBottom: 10,
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => pickImage("license_card_url")}
                    className="bg-secondary p-3 rounded-xl"
                  >
                    <Text className="text-center">
                      {formData.license_card_url
                        ? "Change Photo"
                        : "Upload Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>

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
