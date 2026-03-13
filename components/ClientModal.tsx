import { X, UserPlus, Search, CheckCircle2 } from "lucide-react-native";
import { useRef, useState, useEffect } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../hooks/useThemeStore";
import * as Contacts from "expo-contacts";
import API from "../app/api/axiosInstance";

export type ClientFormData = {
  client_name: string;
  contact_person_name: string;
  contact_number: string;
  alternate_contact_number: string;
  email_address: string;
  office_address: string;
  gstin?: string;
  gstin_details?: any;
};

type Props = {
  visible: boolean;
  editing: boolean;
  formData: ClientFormData;
  setFormData: (data: ClientFormData | ((prev: ClientFormData) => ClientFormData)) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function ClientFormModal({
  visible,
  editing,
  formData,
  setFormData,
  onSubmit,
  onClose,
}: Props) {
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const translateY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset = Platform.select({
    ios: Math.max(insets.bottom, 12),
    android: 0,
    default: 0,
  });
  const SCROLL_THRESHOLD = 40;

  const [verifying, setVerifying] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const verifyGSTIN = async () => {
    const normalizedGstin = (formData.gstin || "").trim().toUpperCase();
    if (!normalizedGstin || normalizedGstin.length !== 15) {
      Alert.alert("Input Required", "Please enter a valid GSTIN number.");
      return;
    }

    setVerifying(true);
    try {
      const res = await API.post("/api/kyc/gstin", { gstin: normalizedGstin });
      const verified = res.data?.verified === true || res.data?.valid === true;
      const details = res.data?.data || res.data;

      if (verified && details) {
        setFormData((prev: ClientFormData) => ({
          ...prev,
          gstin: normalizedGstin,
          client_name: details.trade_name_of_business || details.legal_name_of_business || prev.client_name,
          office_address: details.principal_place_address || prev.office_address,
          gstin_details: details,
        }));
      } else {
        Alert.alert("Search Failed", details.message || "No results found for this GSTIN");
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.response?.data?.message || "Failed to verify GSTIN. Please try manual entry.");
    } finally {
      setVerifying(false);
    }
  };

  const handleFormSubmit = () => {
    if (!String(formData.client_name || "").trim()) {
      Alert.alert("Missing Fields", "Please fill CLIENT NAME.");
      return;
    }
    onSubmit();
  };

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: 800,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, state) => state.y0 < SCROLL_THRESHOLD,
      onPanResponderMove: (_, state) => {
        if (state.dy > 0) translateY.setValue(state.dy);
      },
      onPanResponderRelease: (_, state) => {
        if (state.dy > 120) closeModal();
        else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const normalizePhone = (value?: string) => {
    if (!value) return "";
    const trimmed = value.trim();
    const hasPlus = trimmed.startsWith("+");
    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return "";
    return hasPlus ? `+${digits}` : digits;
  };

  const handlePickContact = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Contact picker is not supported on web.");
      return;
    }

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow contacts access to import client details.");
        return;
      }

      const selected = await Contacts.presentContactPickerAsync();
      if (!selected) return;

      const contact = await Contacts.getContactByIdAsync(selected.id, [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Name,
      ]);

      const number = normalizePhone(contact?.phoneNumbers?.[0]?.number);
      if (!number) {
        Alert.alert("No number found", "Selected contact has no phone number.");
        return;
      }

      setFormData((prev: ClientFormData) => ({
        ...prev,
        contact_person_name: (contact?.name || selected.name || "").trim(),
        contact_number: number,
      }));
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to load contact.");
    }
  };

  const renderSimpleAdd = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 100) }}
    >
      {!editing && formData.gstin_details && (
        <View className="bg-green-500/10 p-4 rounded-2xl mb-5 flex-row items-center border border-green-500/20">
          <CheckCircle2 size={24} color="#22c55e" className="mr-3" />
          <View className="flex-1">
            <Text className="text-green-700 font-bold text-[10px] uppercase tracking-widest leading-tight">GSTIN Verified</Text>
            <Text style={{ color: colors.foreground }} className="font-bold text-sm" numberOfLines={1}>
              {formData.gstin_details.legal_name_of_business}
            </Text>
          </View>
        </View>
      )}

      <View className="mb-6 mt-2">
        <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
          GSTIN Number
        </Text>
        <View
          className="flex-row items-center rounded-2xl border px-4 mb-3"
          style={{ borderColor: colors.border, backgroundColor: isDark ? colors.card : colors.secondary + "40" }}
        >
          <TextInput
            className="flex-1 py-4 text-base font-bold uppercase tracking-widest"
            style={{ color: colors.foreground }}
            value={formData.gstin}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, gstin: val }))}
            placeholder="ENTER GSTIN NUMBER"
            placeholderTextColor={colors.mutedForeground + "60"}
            autoCapitalize="characters"
            maxLength={15}
          />
          {verifying ? <ActivityIndicator size="small" color={colors.primary} /> : <Search size={18} color={colors.mutedForeground} />}
        </View>

        <TouchableOpacity
          onPress={verifyGSTIN}
          disabled={verifying || !formData.gstin}
          style={{ backgroundColor: formData.gstin && formData.gstin.length >= 10 ? colors.primary : colors.muted }}
          className="py-4 rounded-2xl items-center justify-center"
        >
          <Text
            style={{ color: formData.gstin && formData.gstin.length >= 10 ? "white" : colors.mutedForeground }}
            className="font-black text-base"
          >
            Search
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{ color: colors.mutedForeground }} className="text-xs font-bold mb-4">
        Not registered with GST?
      </Text>

      <View className="mb-8">
        <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
          Client Name <Text style={{ color: colors.destructive }}>*</Text>
        </Text>
        <TextInput
          className="rounded-2xl p-4 text-base font-bold mb-4"
          style={{
            backgroundColor: isDark ? colors.card : colors.secondary + "40",
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          value={formData.client_name}
          onChangeText={(val) => setFormData((prev: any) => ({ ...prev, client_name: val }))}
          placeholder="e.g. Acme Logistics Pvt Ltd"
          placeholderTextColor={colors.mutedForeground + "80"}
        />

        <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
          GSTIN Number (Optional)
        </Text>
        <TextInput
          className="rounded-2xl p-4 text-base font-bold"
          style={{
            backgroundColor: isDark ? colors.card : colors.secondary + "40",
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          value={formData.gstin}
          onChangeText={(val) => setFormData((prev: any) => ({ ...prev, gstin: val }))}
          placeholder="e.g. 29ABCDE1234F1Z5"
          placeholderTextColor={colors.mutedForeground + "80"}
          autoCapitalize="characters"
        />
      </View>

      <TouchableOpacity
        onPress={handleFormSubmit}
        style={{ backgroundColor: colors.primary }}
        className="py-5 rounded-[22px] mt-2"
      >
        <Text style={{ color: colors.primaryForeground }} className="text-center font-black text-lg">
          Create Client
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderEditForm = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 100) }}
    >
      <View className="mb-8">
        <Text style={{ color: colors.primary }} className="text-[12px] font-black uppercase tracking-widest mb-4">
          Business details
        </Text>

        <View className="mb-5">
          <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
            Business Name <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <TextInput
            className="rounded-2xl p-4 text-base font-bold"
            style={{
              backgroundColor: isDark ? colors.card : colors.secondary + "40",
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            value={formData.client_name}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, client_name: val }))}
            placeholder="e.g. Acme Logistics Pvt Ltd"
            placeholderTextColor={colors.mutedForeground + "80"}
          />
        </View>

        <View className="mb-5">
          <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
            GSTIN Number (Optional)
          </Text>
          <TextInput
            className="rounded-2xl p-4 text-base font-bold"
            style={{
              backgroundColor: isDark ? colors.card : colors.secondary + "40",
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            value={formData.gstin}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, gstin: val }))}
            placeholder="e.g. 29ABCDE1234F1Z5"
            placeholderTextColor={colors.mutedForeground + "80"}
            autoCapitalize="characters"
          />
        </View>

        <View className="mb-5">
          <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
            Contact Person Name
          </Text>
          <TextInput
            className="rounded-2xl p-4 text-base font-bold"
            style={{
              backgroundColor: isDark ? colors.card : colors.secondary + "40",
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            value={formData.contact_person_name}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, contact_person_name: val }))}
            placeholder="e.g. Rajesh Kumar"
            placeholderTextColor={colors.mutedForeground + "80"}
          />
        </View>

        <View className="mb-5">
          <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
            Primary Contact Number
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <TextInput
                className="rounded-2xl p-4 text-base font-bold"
                style={{
                  backgroundColor: isDark ? colors.card : colors.secondary + "40",
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                value={formData.contact_number}
                onChangeText={(val) => setFormData((prev: any) => ({ ...prev, contact_number: val }))}
                placeholder="e.g. 9876543210"
                placeholderTextColor={colors.mutedForeground + "80"}
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity
              onPress={handlePickContact}
              style={{ backgroundColor: colors.muted }}
              className="w-14 rounded-2xl items-center justify-center border border-border/50"
            >
              <UserPlus size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleFormSubmit}
        style={{ backgroundColor: colors.primary }}
        className="py-5 rounded-[22px] mt-2"
      >
        <Text style={{ color: colors.primaryForeground }} className="text-center font-black text-lg">
          Update Client
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/60" onPress={closeModal}>
        <Animated.View
          {...panResponder.panHandlers}
          className="absolute bottom-0 w-full rounded-t-[32px]"
          style={{
            backgroundColor: colors.background,
            height: editing ? "92%" : keyboardVisible ? "88%" : "76%",
            paddingHorizontal: 24,
            paddingTop: 12,
            transform: [{ translateY }],
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={keyboardVerticalOffset}
            className="flex-1"
          >
            <View style={{ backgroundColor: colors.muted }} className="w-12 h-1.5 rounded-full self-center mb-4 opacity-40" />

            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text style={{ color: colors.foreground }} className="text-xl font-black tracking-tight">
                  {editing ? "Edit Client" : "New Client"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.muted }}
              >
                <X size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>{editing ? renderEditForm() : renderSimpleAdd()}</View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
