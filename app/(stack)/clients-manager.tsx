import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { MapPin, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientFormModal from "../../components/ClientModal";
import useClients from "../../hooks/useClient";
import { useUser } from "../../hooks/useUser";

export default function ClientsManager() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const {
    clients,
    loading: clientsLoading,
    fetchClients,
    addClient,
    updateClient,
    deleteClient,
  } = useClients();

  const loading = userLoading || clientsLoading;

  const isDark = useColorScheme() === "dark";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const requiredFields = ["client_name", "contact_number"];
  const optionalFields = [
    "contact_person_name",
    "alternate_contact_number",
    "email_address",
    "office_address",
  ];

  const [formData, setFormData] = useState({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
  });

  const translateY = useRef(new Animated.Value(0)).current;
  const SCROLL_THRESHOLD = 40;

  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [fetchClients])
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
      setEditingId(data._id);
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
    } catch {
      Alert.alert("Error", "Failed to save client.");
    }
  };

  const handleDelete = (id: string) => {
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

  if (loading && !user) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#888" />
        <Text className="mt-2 text-muted-foreground">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        className="flex-1 px-5 pt-2 bg-background"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {clients.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">
            No clients found.
          </Text>
        ) : (
          clients.map((client) => (
            <TouchableOpacity
              key={client._id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/client-profile",
                  params: { clientId: client._id }
                })
              }
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
                  onPressIn={(e) => e.stopPropagation()}
                  onPress={() => handleDelete(client._id)}
                  className="p-2"
                >
                  <Trash2 size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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

      {/* Full Screen Modal */}
      <ClientFormModal
        visible={modalVisible}
        editing={!!editingId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={() => setModalVisible(false)}
      />

    </SafeAreaView>
  );
}
