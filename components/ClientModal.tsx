import { X, UserPlus, Search, Building2, CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react-native";
import { useRef, useState, useEffect, useCallback } from "react";
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
import * as Contacts from 'expo-contacts';
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

  const [step, setStep] = useState<'gstin' | 'form'>(editing ? 'form' : 'gstin');
  const [verifying, setVerifying] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Reset step when modal becomes visible
  useEffect(() => {
    if (visible) {
      setStep(editing ? 'form' : 'gstin');
      fadeAnim.setValue(1);
    }
  }, [visible, editing]);

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
          gstin_details: details
        }));

        transitionTo('form');
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
    const requiredFields: Array<keyof ClientFormData> = [
      "client_name",
      "contact_person_name",
      "contact_number",
    ];
    const missingFields = requiredFields.filter((field) => !String(formData[field] || "").trim());
    if (missingFields.length > 0) {
      const labels = missingFields.map((f) => f.replaceAll("_", " ").toUpperCase());
      Alert.alert("Missing Fields", `Please fill the following required fields:\n\n• ${labels.join("\n• ")}`);
      return;
    }
    onSubmit();
  };

  const transitionTo = useCallback((nextStep: 'gstin' | 'form') => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

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

  const renderGSTINLookup = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 40) }}
    >
      <View className="items-center mb-8 mt-4">
        <View className="w-16 h-16 rounded-full bg-blue-500/10 items-center justify-center mb-4">
          <Search size={30} color={colors.primary} />
        </View>
        <Text style={{ color: colors.foreground }} className="text-xl font-black text-center mb-1">
          Add New Client
        </Text>
        <Text style={{ color: colors.mutedForeground }} className="text-xs text-center px-6">
          Search via GSTIN to autofill business name and office address.
        </Text>
      </View>

      <View className="mb-6">
        <View className="flex-row items-center border-b-[2px] mb-6" style={{ borderColor: colors.primary + '30' }}>
          <TextInput
            className="flex-1 py-4 text-lg font-bold uppercase tracking-widest"
            style={{ color: colors.foreground }}
            value={formData.gstin}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, gstin: val }))}
            placeholder="ENTER GSTIN NUMBER"
            placeholderTextColor={colors.mutedForeground + '60'}
            autoCapitalize="characters"
            maxLength={15}
          />
          {verifying && <ActivityIndicator size="small" color={colors.primary} className="mr-2" />}
        </View>

        <TouchableOpacity
          onPress={verifyGSTIN}
          disabled={verifying || !formData.gstin}
          style={{ backgroundColor: formData.gstin && formData.gstin.length >= 10 ? colors.primary : colors.muted }}
          className="py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/20"
        >
          <Text style={{ color: formData.gstin && formData.gstin.length >= 10 ? "white" : colors.mutedForeground }} className="font-black text-base mr-2">
            Search & Autofill
          </Text>
          <ChevronRight size={18} color={formData.gstin && formData.gstin.length >= 10 ? "white" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.border }} />
        <Text className="mx-4 text-xs font-bold uppercase tracking-[2px]" style={{ color: colors.mutedForeground }}>OR</Text>
        <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.border }} />
      </View>

      <TouchableOpacity
        onPress={() => transitionTo('form')}
        className="py-4 rounded-2xl border-2 border-dashed items-center justify-center"
        style={{ borderColor: colors.border, backgroundColor: isDark ? colors.card + '40' : colors.secondary + '20' }}
      >
        <Text style={{ color: colors.foreground }} className="font-bold text-sm">
          Continue with Manual Entry
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderForm = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 100) }}
    >
      {/* Header Info (if GSTIN was used) */}
      {!editing && formData.gstin_details && (
        <View className="bg-green-500/10 p-4 rounded-2xl mb-6 flex-row items-center border border-green-500/20">
          <CheckCircle2 size={24} color="#22c55e" className="mr-3" />
          <View className="flex-1">
            <Text className="text-green-700 font-bold text-[10px] uppercase tracking-widest leading-tight">GSTIN Verified</Text>
            <Text style={{ color: colors.foreground }} className="font-bold text-sm" numberOfLines={1}>{formData.gstin_details.legal_name_of_business}</Text>
          </View>
        </View>
      )}

      {/* Core Details Section */}
      <View className="mb-8">
        <Text style={{ color: colors.primary }} className="text-[12px] font-black uppercase tracking-widest mb-4">
          Business details
        </Text>

        {/* Company Name */}
        <View className="mb-5">
          <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
            Business Name <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <TextInput
            className="rounded-2xl p-4 text-base font-bold"
            style={{
              backgroundColor: isDark ? colors.card : colors.secondary + '40',
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border
            }}
            value={formData.client_name}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, client_name: val }))}
            placeholder="e.g. Acme Logistics Pvt Ltd"
            placeholderTextColor={colors.mutedForeground + '80'}
          />
        </View>

        {/* GSTIN (If came from manual or editing) */}
        <View className="mb-5">
          <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
            GSTIN Number (Optional)
          </Text>
          <TextInput
            className="rounded-2xl p-4 text-base font-bold"
            style={{
              backgroundColor: isDark ? colors.card : colors.secondary + '40',
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border
            }}
            value={formData.gstin}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, gstin: val }))}
            placeholder="e.g. 29ABCDE1234F1Z5"
            placeholderTextColor={colors.mutedForeground + '80'}
            autoCapitalize="characters"
          />
        </View>

        {/* Contact Number + Picker */}
        <View className="mb-5">
          <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
            Contact Person Name <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <TextInput
            className="rounded-2xl p-4 text-base font-bold"
            style={{
              backgroundColor: isDark ? colors.card : colors.secondary + '40',
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border
            }}
            value={formData.contact_person_name}
            onChangeText={(val) => setFormData((prev: any) => ({ ...prev, contact_person_name: val }))}
            placeholder="e.g. Rajesh Kumar"
            placeholderTextColor={colors.mutedForeground + '80'}
          />
        </View>

        {/* Contact Number + Picker */}
        <View className="mb-5">
          <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
            Primary Contact Number <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <TextInput
                className="rounded-2xl p-4 text-base font-bold"
                style={{
                  backgroundColor: isDark ? colors.card : colors.secondary + '40',
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border
                }}
                value={formData.contact_number}
                onChangeText={(val) => setFormData((prev: any) => ({ ...prev, contact_number: val }))}
                placeholder="e.g. 9876543210"
                placeholderTextColor={colors.mutedForeground + '80'}
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
        className="py-5 rounded-[22px] mt-2 shadow-lg shadow-blue-500/20"
      >
        <Text style={{ color: colors.primaryForeground }} className="text-center font-black text-lg">
          {editing ? "Update Client" : "Create Client"}
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
            height: step === 'gstin' ? (keyboardVisible ? '88%' : '65%') : '92%',
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
            {/* Grab Handle */}
            <View style={{ backgroundColor: colors.muted }} className="w-12 h-1.5 rounded-full self-center mb-4 opacity-40" />

            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                {step === 'form' && !editing && (
                  <TouchableOpacity onPress={() => transitionTo('gstin')} className="mr-3 p-1">
                    <ArrowLeft size={24} color={colors.foreground} />
                  </TouchableOpacity>
                )}
                <View>
                  <Text style={{ color: colors.foreground }} className="text-xl font-black tracking-tight">
                    {editing ? "Edit Client" : step === 'gstin' ? "New Client" : "Client Details"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.muted }}
              >
                <X size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
              {step === 'gstin' ? renderGSTINLookup() : renderForm()}
            </Animated.View>

          </KeyboardAvoidingView>
        </Animated.View>
      </Pressable>
    </Modal >
  );
}
