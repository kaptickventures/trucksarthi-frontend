import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, Modal, RefreshControl, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../../components/Skeleton";
import useClients from "../../hooks/useClient";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function ClientProfile() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { clientId } = useLocalSearchParams<{ clientId?: string | string[] }>();
  const id = useMemo(() => (Array.isArray(clientId) ? clientId[0] : clientId), [clientId]);
  const { clients, loading, fetchClients, updateClient } = useClients();
  const [refreshing, setRefreshing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const client = useMemo(() => (clients || []).find((c: any) => String(c._id) === String(id)), [clients, id]);
  const [form, setForm] = useState({
    client_name: "",
    contact_person_name: "",
    contact_number: "",
    email_address: "",
    gstin: "",
    office_address: "",
    payment_terms: "",
  });

  useEffect(() => {
    if (!id) return;
    fetchClients();
  }, [id, fetchClients]);

  useEffect(() => {
    if (!client) return;
    setForm({
      client_name: (client as any).client_name || "",
      contact_person_name: (client as any).contact_person_name || "",
      contact_number: (client as any).contact_number || "",
      email_address: (client as any).email_address || "",
      gstin: (client as any).gstin || (client as any).gst || "",
      office_address: (client as any).office_address || (client as any).address || "",
      payment_terms: (client as any).payment_terms || "",
    });
  }, [client]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  }, [fetchClients]);

  const onSave = async () => {
    if (!id) return;
    await updateClient(id, {
      client_name: form.client_name,
      contact_person_name: form.contact_person_name,
      contact_number: form.contact_number,
      email_address: form.email_address,
      office_address: form.office_address,
      ...(form.gstin ? { gstin: form.gstin } : {}),
      ...(form.payment_terms ? { payment_terms: form.payment_terms } : {}),
    } as any);
    setShowEdit(false);
    Alert.alert("Updated", "Client profile updated.");
  };

  if (loading && !client) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
        <Skeleton width={160} height={24} style={{ marginBottom: 14 }} />
        <Skeleton width="100%" height={280} borderRadius={16} />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Client not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginLeft: 14 }}>Client Profile</Text>
        </View>
        <TouchableOpacity onPress={() => setShowEdit(true)}>
          <Ionicons name="create-outline" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>IDENTITY</Text>
          <InfoRow label="Client Name" value={(client as any).client_name || "-"} />
          <InfoRow label="Contact Person" value={(client as any).contact_person_name || "-"} />
          <InfoRow label="Phone" value={(client as any).contact_number || "-"} />
          <InfoRow label="Email" value={(client as any).email_address || "-"} />
          <InfoRow label="GST" value={(client as any).gstin || (client as any).gst || "-"} />
          <InfoRow label="Address" value={(client as any).office_address || (client as any).address || "-"} />
          <InfoRow label="Payment Terms" value={(client as any).payment_terms || "-"} />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            {!!(client as any).contact_number && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${(client as any).contact_number}`)}
                style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 10, alignItems: "center", padding: 10 }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>Call</Text>
              </TouchableOpacity>
            )}
            {!!(client as any).email_address && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${(client as any).email_address}`)}
                style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 10, alignItems: "center", padding: 10 }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>Email</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>Edit Client</Text>
            <FormInput label="Client Name" value={form.client_name} onChangeText={(v) => setForm((p) => ({ ...p, client_name: v }))} />
            <FormInput label="Contact Person" value={form.contact_person_name} onChangeText={(v) => setForm((p) => ({ ...p, contact_person_name: v }))} />
            <FormInput label="Phone" value={form.contact_number} onChangeText={(v) => setForm((p) => ({ ...p, contact_number: v }))} />
            <FormInput label="Email" value={form.email_address} onChangeText={(v) => setForm((p) => ({ ...p, email_address: v }))} />
            <FormInput label="GST" value={form.gstin} onChangeText={(v) => setForm((p) => ({ ...p, gstin: v }))} />
            <FormInput label="Address" value={form.office_address} onChangeText={(v) => setForm((p) => ({ ...p, office_address: v }))} />
            <FormInput label="Payment Terms" value={form.payment_terms} onChangeText={(v) => setForm((p) => ({ ...p, payment_terms: v }))} />

            <TouchableOpacity onPress={onSave} style={{ backgroundColor: colors.primary, borderRadius: 10, alignItems: "center", padding: 12, marginTop: 8 }}>
              <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEdit(false)} style={{ alignItems: "center", padding: 12 }}>
              <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700", maxWidth: "60%", textAlign: "right" }}>{value}</Text>
    </View>
  );
}

function FormInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.mutedForeground}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.foreground }}
      />
    </View>
  );
}

