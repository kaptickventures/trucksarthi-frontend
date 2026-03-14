import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Animated,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import ClientFormModal, { ClientFormData } from "../../components/ClientModal";
import { Skeleton } from "../../components/Skeleton";
import useClients from "../../hooks/useClient";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { useTranslation } from "../../context/LanguageContext";
import { formatPhoneNumber } from "../../lib/utils";

export default function ClientsManager() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const {
    clients,
    loading: clientsLoading,
    fetchClients,
    addClient,
    deleteClient,
  } = useClients();

  const loading = userLoading || clientsLoading;

  const { theme, colors } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
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

  const REQUIRED_FIELDS = ["client_name"];

  const [formData, setFormData] = useState<ClientFormData>({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
    gstin: undefined,
    gstin_details: undefined
  });

  const translateY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [fetchClients])
  );

  const openModal = () => {
    setFormData({
      client_name: "",
      contact_person_name: "",
      contact_number: "",
      alternate_contact_number: "",
      email_address: "",
      office_address: "",
      gstin: undefined,
      gstin_details: undefined
    });
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
    const missingFields = REQUIRED_FIELDS.filter(f => !String(formData[f as keyof typeof formData] || "").trim());
    if (missingFields.length > 0) {
      const labels = missingFields.map(f => f.replaceAll("_", " ").toUpperCase());
      Alert.alert(t("missingFields"), `Please fill the following required fields:\n\n• ${labels.join("\n• ")}`);
      return;
    }

    const email = formData.email_address.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailPattern.test(email)) {
      Alert.alert(t("error"), "Please enter a valid client email address.");
      return;
    }

    try {
      const normalizedClientName = formData.client_name.trim();
      await addClient({
        ...formData,
        client_name: normalizedClientName,
        contact_person_name: formData.contact_person_name.trim() || normalizedClientName,
        contact_number: formData.contact_number.trim() || "NA",
        alternate_contact_number: formData.alternate_contact_number.trim(),
        office_address: formData.office_address.trim(),
        email_address: email,
        gstin: formData.gstin?.trim().toUpperCase() || undefined,
      });
      Alert.alert(t("success"), `Client ${t("addedSuccessfully")}`);
      closeModal();
      fetchClients();
    } catch {}
  };

  const handleDelete = (id: string) => {
    Alert.alert(t("confirmDelete"), "Delete this client?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('clients')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Manage your business clients</Text>
        </View>

        {clients.length === 0 ? (
          <Text className="text-center mt-10" style={{ color: colors.mutedForeground }}>
            {t("noClientsFound")}
          </Text>
        ) : (
          clients.map((client) => (
            <TouchableOpacity
              key={client._id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(stack)/client-profile",
                  params: { clientId: client._id }
                } as any)
              }
              className="border rounded-2xl p-4 mb-3 shadow-sm"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-3">
                  <Text style={{ color: colors.foreground }} className="font-bold text-lg tracking-tight">
                    {client.client_name}
                  </Text>
                  <Text style={{ color: colors.foreground, opacity: 0.7 }} className="text-sm font-light">
                    {client.contact_person_name || "N/A"}
                  </Text>
                </View>
                <View className="flex-row gap-2">


                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      const cleaned = client.contact_number.replace(/\D/g, "");
                      const waNumber = cleaned.length === 12 && cleaned.startsWith("91") ? cleaned : `91${cleaned.slice(-10)}`;
                      Linking.openURL(`https://wa.me/${waNumber}`);
                    }}
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.successSoft }}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color={colors.success} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); handleDelete(client._id); }}
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.destructiveSoft }}
                  >
                    <Trash2 size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="gap-y-1">
                <Text style={{ color: colors.foreground }} className="text-sm font-medium">Phone: <Text style={{ color: colors.mutedForeground }}>{formatPhoneNumber(client.contact_number)}</Text></Text>
                <Text style={{ color: colors.foreground }} className="text-sm font-medium" numberOfLines={1}>Address: {client.office_address || "N/A"}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => openModal()}
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
        <Plus color={colors.primaryForeground} size={28} strokeWidth={3} />
      </TouchableOpacity>

      <ClientFormModal
        visible={modalVisible}
        editing={false}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}
