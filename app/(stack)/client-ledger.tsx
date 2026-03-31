import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ClientFormModal, { ClientFormData } from "../../components/ClientModal";
import ProfileAvatar from "../../components/ProfileAvatar";
import useClients from "../../hooks/useClient";
import { useClientLedger } from "../../hooks/useClientLedger";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";

type ClientRow = {
  clientId: string;
  clientName: string;
  billed: number;
  settled: number;
  unbilled: number;
};

export default function ClientLedgerScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const { clients, loading: clientsLoading, fetchClients, addClient } = useClients();
  const { fetchSummary } = useClientLedger();

  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<ClientRow[]>([]);
  // true while clients are still loading or rows are being built
  const [isBuilding, setIsBuilding] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const REQUIRED_FIELDS = ["client_name"];

  const [formData, setFormData] = useState<ClientFormData>({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    alternate_contact_number: "",
    email_address: "",
    office_address: "",
    gstin: "",
    pan_number: "",
    gstin_details: undefined
  });

  const load = useCallback(async () => {
    setIsBuilding(true);
    await fetchClients();
    setHasInitialLoad(true);
  }, [fetchClients]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      setSummaryRefreshKey((k) => k + 1);
    }, [])
  );

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsBuilding(true);
      const next: ClientRow[] = [];

      await Promise.all(
        (clients || []).map(async (client: any) => {
          try {
            const summary = await fetchSummary(client._id);
            const billed = Number(summary?.total_debits || 0);
            const settled = Number(summary?.total_credits || 0);
            const unbilled = Math.max(0, billed - settled);
            next.push({
              clientId: String(client._id),
              clientName: client.client_name,
              billed,
              settled,
              unbilled,
            });
          } catch {
            next.push({
              clientId: String(client._id),
              clientName: client.client_name,
              billed: 0,
              settled: 0,
              unbilled: 0,
            });
          }
        })
      );

      if (isMounted) {
        setRows(
          next.sort((a, b) => {
            if (b.unbilled !== a.unbilled) return b.unbilled - a.unbilled;
            return a.clientName.localeCompare(b.clientName);
          })
        );
        setIsBuilding(false);
      }
    };

    if (!hasInitialLoad || clientsLoading || clients === undefined) {
      // still waiting for clients fetch
      return;
    } else if (clients.length > 0) {
      run();
    } else {
      // clients loaded but genuinely empty
      setRows([]);
      setIsBuilding(false);
    }

    return () => {
      isMounted = false;
    };
  }, [clients, clientsLoading, fetchSummary, hasInitialLoad, summaryRefreshKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setSummaryRefreshKey((k) => k + 1);
    setRefreshing(false);
  }, [load]);

  const openModal = () => {
    setFormData({
      client_name: "",
      contact_person_name: "",
      contact_number: "",
      alternate_contact_number: "",
      email_address: "",
      office_address: "",
      gstin: "",
      pan_number: "",
      gstin_details: undefined
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const missingFields = REQUIRED_FIELDS.filter(f => !String(formData[f as keyof typeof formData] || "").trim());
    if (missingFields.length > 0) {
      const labels = missingFields.map(f => f.replaceAll("_", " ").toUpperCase());
      Alert.alert(t("missingFields"), `Please fill the following required fields:\n\n- ${labels.join("\n- ")}`);
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
        pan_number: String(formData.pan_number || "").trim().toUpperCase() || undefined,
      });
      Alert.alert(t("success"), `Client ${t("addedSuccessfully")}`);
      setModalVisible(false);
      await load();
      setSummaryRefreshKey((k) => k + 1);
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('clientKhata')}</Text>
          <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>{t('manageFinanceSubtitle')}</Text>
        </View>

        {/* Loading skeleton */}
        {(clientsLoading || isBuilding) && rows.length === 0 && (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ width: 140, height: 18, backgroundColor: colors.muted, borderRadius: 6, opacity: 0.5 }} />
                  <View style={{ width: 60, height: 18, backgroundColor: colors.muted, borderRadius: 10, opacity: 0.4 }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
                  <View style={{ width: 80, height: 14, backgroundColor: colors.muted, borderRadius: 4, opacity: 0.35 }} />
                  <View style={{ width: 80, height: 14, backgroundColor: colors.muted, borderRadius: 4, opacity: 0.35 }} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state - only show after fully loaded */}
        {hasInitialLoad && !clientsLoading && !isBuilding && rows.length === 0 && (
          <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 40 }}>No clients found.</Text>
        )}

        {rows.map((row) => {

          return (
            <TouchableOpacity
              key={row.clientId}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(stack)/client-ledger-detail",
                  params: { clientId: row.clientId },
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
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <ProfileAvatar
                    name={row.clientName}
                    size="medium"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, letterSpacing: -0.3 }}>
                      {row.clientName}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </View>

	              <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
	                <View>
	                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>{(t('unbilled') || 'Unbilled').toUpperCase()}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: row.unbilled > 0 ? colors.destructive : colors.mutedForeground }}> ₹ {row.unbilled.toLocaleString()}
	                  </Text>
	                </View>
	                <View style={{ width: 1, backgroundColor: colors.border }} />
	                <View>
	                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>{t('billed').toUpperCase()}</Text>
	                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}> ₹ {row.billed.toLocaleString()}
	                  </Text>
	                </View>
	                <View style={{ width: 1, backgroundColor: colors.border }} />
	                <View>
	                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600", marginBottom: 1 }}>{t('settled').toUpperCase()}</Text>
	                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.success }}> ₹ {row.settled.toLocaleString()}
	                  </Text>
	                </View>
	              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={openModal}
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
          shadowColor: colors.shadow,
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
