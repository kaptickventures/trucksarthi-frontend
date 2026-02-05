import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Edit3, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PanResponder,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ClientFormModal from "../../components/ClientModal";
import { Skeleton } from "../../components/Skeleton";
import useClients from "../../hooks/useClient";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { THEME } from "../../theme";

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

  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchClients();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchClients]);

  const REQUIRED_FIELDS = [
    "client_name",
    "contact_number",
    "contact_person_name",
    "alternate_contact_number",
    "email_address",
    "office_address",
  ];
  const OPTIONAL_FIELDS: string[] = [];

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
    const missingFields = REQUIRED_FIELDS.filter(f => !formData[f as keyof typeof formData]);
    if (missingFields.length > 0) {
      const labels = missingFields.map(f => f.replaceAll("_", " ").toUpperCase());
      Alert.alert("⚠️ Missing Fields", `Please fill the following required fields:\n\n• ${labels.join("\n• ")}`);
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
      <View style={{ backgroundColor: colors.background, flex: 1, paddingHorizontal: 20, paddingTop: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ gap: 8 }}>
                <Skeleton width={140} height={20} borderRadius={4} />
                <Skeleton width={100} height={12} borderRadius={4} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={40} height={40} borderRadius={20} />
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Skeleton width={180} height={14} borderRadius={4} />
              <Skeleton width={120} height={14} borderRadius={4} />
              <Skeleton width={200} height={14} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        className="flex-1 px-5 pt-2 bg-background"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#FFF" : "#000"} />
        }
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
              className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-3">
                  <Text style={{ color: isDark ? THEME.dark.foreground : THEME.light.foreground }} className="font-bold text-lg tracking-tight">
                    {client.client_name}
                  </Text>
                  <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">
                    Verified Partner
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); openModal(true, client); }}
                    className="w-10 h-10 bg-muted rounded-full items-center justify-center border border-border/20"
                  >
                    <Edit3 size={16} color={isDark ? THEME.dark.foreground : THEME.light.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); handleDelete(client._id); }}
                    className="w-10 h-10 bg-red-500/10 rounded-full items-center justify-center"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="gap-y-1.5 pt-1">
                <Text style={{ color: isDark ? THEME.dark.foreground : THEME.light.foreground }} className="text-sm font-medium">👤 POC: {client.contact_person_name || "N/A"}</Text>
                <Text style={{ color: isDark ? THEME.dark.foreground : THEME.light.foreground }} className="text-sm font-medium">📞 {client.contact_number}</Text>
                <Text style={{ color: isDark ? THEME.dark.foreground : THEME.light.foreground }} className="text-sm font-medium" numberOfLines={1}>📍 {client.office_address || "Address N/A"}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => openModal(false)}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: 30,
          right: 25,
          backgroundColor: colors.primary,
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 5,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 3 },
          zIndex: 999
        }}
      >
        <Plus color="#FFFFFF" size={28} strokeWidth={3} />
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
