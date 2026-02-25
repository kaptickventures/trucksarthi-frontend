import { X, UserPlus } from "lucide-react-native";
import { useRef } from "react";
import {
  Animated,
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../hooks/useThemeStore";
import * as Contacts from 'expo-contacts';

type ClientFormData = {
  client_name: string;
  contact_person_name: string;
  contact_number: string;
  alternate_contact_number: string;
  email_address: string;
  office_address: string;
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
  const SCROLL_THRESHOLD = 40;

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

      setFormData({
        ...formData,
        contact_person_name: (contact?.name || selected.name || "").trim(),
        contact_number: number,
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to load contact.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/60" onPress={closeModal}>
        <Animated.View
          {...panResponder.panHandlers}
          className="absolute bottom-0 w-full rounded-t-[32px]"
          style={{
            backgroundColor: colors.background,
            height: "90%",
            paddingHorizontal: 24,
            paddingTop: insets.top + 20,
            transform: [{ translateY }],
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            {/* Grab Handle */}
            <View style={{ backgroundColor: colors.muted }} className="w-12 h-1.5 rounded-full self-center mb-6 opacity-40" />

            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text style={{ color: colors.foreground }} className="text-2xl font-bold tracking-tight">
                  {editing ? "Edit Client" : "Add New Client"}
                </Text>
                <Text className="text-muted-foreground text-xs font-bold mt-1 uppercase tracking-widest">
                  Customer Information
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

            {/* Form */}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>

              {/* Company Name */}
              <View className="mb-5">
                <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                  Company Name <Text style={{ color: colors.destructive }}>*</Text>
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
                  onChangeText={(val) => setFormData({ ...formData, client_name: val })}
                  placeholder="e.g. Acme Logistics Pvt Ltd"
                  placeholderTextColor={colors.mutedForeground + '80'}
                />
              </View>

              {/* Contact Person Name */}
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
                  onChangeText={(val) => setFormData({ ...formData, contact_person_name: val })}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={colors.mutedForeground + '80'}
                />
              </View>

              {/* Contact Number + Picker */}
              <View className="mb-5">
                <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                  Contact Mobile <Text style={{ color: colors.destructive }}>*</Text>
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
                      onChangeText={(val) => setFormData({ ...formData, contact_number: val })}
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

              <View className="mb-5">
                <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                  Email Address
                </Text>
                <TextInput
                  className="rounded-2xl p-4 text-base font-bold"
                  style={{
                    backgroundColor: isDark ? colors.card : colors.secondary + '40',
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border
                  }}
                  value={formData.email_address}
                  onChangeText={(val) => setFormData({ ...formData, email_address: val })}
                  placeholder="e.g. accounts@acmelogistics.com"
                  placeholderTextColor={colors.mutedForeground + '80'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Editing Mode Extras */}
              {editing && (
                <>
                  <View className="w-full h-[1px] bg-border/50 my-4" />
                  <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-4">Additional Details</Text>
                  <View className="mb-5">
                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                      Alternate Mobile
                    </Text>
                    <TextInput
                      className="rounded-2xl p-4 text-base font-bold"
                      style={{
                        backgroundColor: isDark ? colors.card : colors.secondary + '40',
                        color: colors.foreground,
                        borderWidth: 1,
                        borderColor: colors.border
                      }}
                      value={formData.alternate_contact_number}
                      onChangeText={(val) => setFormData({ ...formData, alternate_contact_number: val })}
                      placeholder="Optional"
                      placeholderTextColor={colors.mutedForeground + '80'}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View className="mb-5">
                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                      Office Address
                    </Text>
                    <TextInput
                      className="rounded-2xl p-4 text-base font-bold min-h-[100px]"
                      style={{
                        backgroundColor: isDark ? colors.card : colors.secondary + '40',
                        color: colors.foreground,
                        borderWidth: 1,
                        borderColor: colors.border
                      }}
                      value={formData.office_address}
                      onChangeText={(val) => setFormData({ ...formData, office_address: val })}
                      placeholder="Full Address..."
                      placeholderTextColor={colors.mutedForeground + '80'}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </>
              )}

              {/* Save */}
              <TouchableOpacity
                onPress={onSubmit}
                style={{ backgroundColor: colors.primary }}
                className="py-5 rounded-[22px] mt-4 shadow-lg shadow-blue-500/20"
              >
                <Text style={{ color: colors.primaryForeground }} className="text-center font-black text-lg">
                  {editing ? "Update Client" : "Create Client"}
                </Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                onPress={closeModal}
                className="py-4 items-center"
              >
                <Text className="text-muted-foreground font-bold">
                  Discard
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </Pressable>
    </Modal >
  );
}
