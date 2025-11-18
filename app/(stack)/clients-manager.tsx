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
  Platform
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import useClients from "../../hooks/useClient";

export default function ClientsManager() {
  const auth = getAuth();
  const user = auth.currentUser;
  const firebase_uid = user?.uid;

  const {
    clients,
    loading,
    fetchClients,
    addClient,
    updateClient,
    deleteClient,
  } = useClients(firebase_uid || "");

  const isDark = useColorScheme() === "dark";
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const requiredFields = ["client_name", "contact_number"];
  const optionalFields = ["contact_person_name", "alternate_contact_number", "email_address", "office_address"];

  const [formData, setFormData] = useState({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
  });

  const translateY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const SCROLL_THRESHOLD = 40;

  useFocusEffect(
    useCallback(() => {
      if (firebase_uid) fetchClients();
    }, [firebase_uid, fetchClients])
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
      setEditingId(data.client_id);
      setFormData({
        client_name: data.client_name || "",
        contact_person_name: data.contact_person_name || "",
        contact_number: data.contact_number || "",
        alternate_contact_number: data.alternate_contact_number || "",
        email_address: data.email_address || "",
        office_address: data.office_address || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        client_name: "",
        contact_person_name: "",
        contact_number: "",
        alternate_contact_number: "",
        email_address: "",
        office_address: "",
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
    if (!formData.client_name || !formData.contact_number) {
      Alert.alert("⚠️ Missing Fields", "Please fill all required fields.");
      return;
    }

    try {
      if (editingId) {
        await updateClient(editingId, formData);
        Alert.alert("Success", "Client updated successfully.");
      } else {
        await addClient(formData);
        Alert.alert("Success", "Client added successfully.");
      }
      closeModal();
      fetchClients();
    } catch (err) {
      Alert.alert("Error", "Failed to save client.");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirm Delete", "Delete this client?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteClient(id);
          fetchClients();
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

      <ScrollView
        className="flex-1 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : clients.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">
            No clients found.
          </Text>
        ) : (
          clients.map((client) => (
            <View
              key={client.client_id}
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm flex-row justify-between items-center"
            >
              <View className="flex-row items-start flex-1">
                <View className="p-2 bg-secondary rounded-xl mr-3">
                  <MapPin size={18} color="#2563EB" />
                </View>

                <View className="flex-1">
                  <Text className="text-card-foreground font-semibold text-base">
                    {client.client_name}
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1">
                    {client.contact_person_name}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center ml-3">
                <TouchableOpacity
                  onPress={() => openModal(true, client)}
                  className="p-2"
                >
                  <Edit3 size={20} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(client.client_id)}
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

      {/* Full-screen Modal */}
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
                  {editingId ? "Edit Client" : "Add Client"}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <X size={28} color={isDark ? "#AAA" : "#666"} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {[...requiredFields, ...optionalFields].map((key) => {
                  const label = key.replaceAll("_", " ");
                  const isRequired = requiredFields.includes(key);

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
                        keyboardType={
                          key.includes("number")
                            ? "phone-pad"
                            : key.includes("email")
                            ? "email-address"
                            : "default"
                        }
                        placeholder={`Enter ${label}`}
                        placeholderTextColor="#888"
                      />
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
                  <Text className="text-center text-muted-foreground">Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
