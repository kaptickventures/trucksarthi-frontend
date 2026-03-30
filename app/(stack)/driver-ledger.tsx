import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../api/axiosInstance";
import DriverFormModal from "../../components/DriverModal";
import ProfileAvatar from "../../components/ProfileAvatar";
import useDrivers from "../../hooks/useDriver";
import { Skeleton } from "../../components/Skeleton";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";
import { formatPhoneNumber } from "../../lib/utils";

export default function DriverLedgerScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { drivers, fetchDrivers, loading, addDriver } = useDrivers();
  const [refreshing, setRefreshing] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const showInitialSkeleton = loading && !refreshing && (drivers || []).length === 0;
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

  const load = useCallback(async () => {
    await fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const run = async () => {
      const next: Record<string, number> = {};
      await Promise.all(
        (drivers || []).map(async (d) => {
          try {
            let data: any = [];
            try {
              const res = await API.get(`/api/driver-ledger/driver/${d._id}`);
              data = res.data;
            } catch {
              const res = await API.get(`/api/driver-ledger?driver_id=${d._id}`);
              data = res.data;
            }
            const rows = Array.isArray(data) ? data : data?.entries || data?.data || [];
            const normalized = rows.map((entry: any) => {
              const nature = String(entry.transaction_nature || "").toUpperCase();
              const direction = String(entry.direction || "").toUpperCase();
              const category = String(entry.category || entry.transactionSubtype || entry.title || "").toUpperCase();
              const isToDriver =
                nature === "RECEIVED_BY_DRIVER" ||
                direction === "TO" ||
                category.includes("OWNER_TO_DRIVER") ||
                category.includes("SALARY");
              return {
                isToDriver,
                amount: Number(entry.amount || 0),
              };
            });
            const toDriver = normalized.filter((r: any) => r.isToDriver).reduce((sum: number, r: any) => sum + r.amount, 0);
            const driverSpends = normalized.filter((r: any) => !r.isToDriver).reduce((sum: number, r: any) => sum + r.amount, 0);
            next[d._id] = toDriver - driverSpends;
          } catch {
            next[d._id] = 0;
          }
        })
      );
      setBalances(next);
    };
    if (drivers?.length) run();
  }, [drivers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openModal = () => {
    setFormData({
      driver_name: "",
      contact_number: "",
      identity_card_url: "",
      license_card_url: "",
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert(t("missingFields"), "Please fill all required fields.");
        return;
      }
    }

    try {
      await addDriver(formData);
      Alert.alert(t("success"), `Driver ${t("addedSuccessfully")}`);
      closeModal();
      fetchDrivers();
    } catch (err) {
      console.error("Submit error:", err);
      const msg =
        (err as any)?.response?.data?.error ||
        (err as any)?.response?.data?.message ||
        (err as Error)?.message ||
        "Failed to save driver details.";
      Alert.alert(t("error"), msg);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('driverKhata')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>Manage balances and transactions for all drivers</Text>
        </View>

        {showInitialSkeleton && (
          <View>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} width="100%" height={96} borderRadius={16} style={{ marginBottom: 12 }} />
            ))}
          </View>
        )}

        {!loading && (drivers || []).length === 0 && (
          <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>No drivers found.</Text>
        )}

        {(drivers || []).map((d) => {
          const bal = Number(balances[d._id] || 0);
          const isPositive = bal >= 0;

          return (
            <TouchableOpacity
              key={d._id}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(stack)/driver-ledger-detail",
                  params: { driverId: d._id },
                } as any)
              }
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", marginRight: 12, gap: 12 }}>
                  <ProfileAvatar
                    name={d.driver_name || d.name || "Driver"}
                    imageUrl={d.profile_picture_url}
                    size="medium"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, letterSpacing: -0.3 }}>
                      {d.driver_name || d.name || "Driver"}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <Ionicons name="call-outline" size={12} color={colors.mutedForeground} />
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: "500" }}>
                        {d.contact_number || d.phone ? formatPhoneNumber(d.contact_number || d.phone) : "—"}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={openModal}
        className="absolute bottom-8 right-6 w-16 h-16 rounded-full justify-center items-center"
        style={{
          backgroundColor: colors.primary,
          elevation: 8,
          shadowColor: colors.shadow,
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Plus color={colors.primaryForeground} size={28} />
      </TouchableOpacity>

      <DriverFormModal
        visible={modalVisible}
        editing={false}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </View>
  );
}
