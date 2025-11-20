import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useUser } from "../../hooks/useUser";
import { THEME } from "../../theme";
import "../../global.css";

export default function Profile() {
  const router = useRouter();
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";
  const { user, updateUser, refreshUser } = useUser();

  // Correct theme mapping
  const theme = {
    card: isDark ? THEME.dark.card : THEME.light.card,
    border: isDark ? THEME.dark.border : THEME.light.border,
    muted: isDark ? THEME.dark.muted : THEME.light.muted,
    mutedForeground: isDark
      ? THEME.dark.mutedForeground
      : THEME.light.mutedForeground,
    primary: isDark ? THEME.dark.primary : THEME.light.primary,
    primaryForeground: isDark
      ? THEME.dark.primaryForeground
      : THEME.light.primaryForeground,
    shadow: isDark ? "#00000055" : "#00000022",
  };

  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    date_of_birth: "",
    phone_number: "",
    email_address: "",
    address: "",
    gstin: "",
    bank_name: "",
    account_holder_name: "",
    ifsc_code: "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name ?? "",
        company_name: user.company_name ?? "",
        date_of_birth: user.date_of_birth?.substring(0, 10) ?? "",
        phone_number: user.phone_number ?? "+91 ",
        email_address: user.email_address ?? "",
        address: user.address ?? "",
        gstin: user.gstin ?? "",
        bank_name: user.bank_name ?? "",
        account_holder_name: user.account_holder_name ?? "",
        ifsc_code: user.ifsc_code ?? "",
      });

      setProfileImage(user.profile_picture_url ?? null);

      if (user.date_of_birth) {
        const parsed = new Date(user.date_of_birth);
        if (!isNaN(parsed.getTime())) setDobDate(parsed);
      }
    }
  }, [user]);

  const markChanged = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Image logic
  const pickFromLibrary = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert("Permission required", "Allow photo access.");

    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!res.canceled) {
      setProfileImage(res.assets[0].uri);
      setHasChanges(true);
    }
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert("Permission required", "Allow camera access.");

    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!res.canceled) {
      setProfileImage(res.assets[0].uri);
      setHasChanges(true);
    }
  };

  const removePhoto = () => {
    setProfileImage(null);
    setHasChanges(true);
  };

  const showPhotoOptions = () => {
    const opts = [
      { text: "Take Photo", action: takePhoto },
      { text: "Choose from Library", action: pickFromLibrary },
      profileImage ? { text: "Remove Photo", action: removePhoto, style: "destructive" } : null,
      { text: "Cancel", style: "cancel" },
    ].filter(Boolean);

    Alert.alert(
      "Profile Photo",
      "Select an option",
      opts.map((o: any) => ({
        text: o.text,
        onPress: o.action,
        style: o.style,
      }))
    );
  };

  const onChangeDate = (event: any, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);

    if (selected) {
      setDobDate(selected);
      markChanged("date_of_birth", selected.toISOString().split("T")[0]);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await updateUser({
        full_name: formData.full_name,
        company_name: formData.company_name,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        gstin: formData.gstin,
        bank_name: formData.bank_name,
        account_holder_name: formData.account_holder_name,
        ifsc_code: formData.ifsc_code,
        profile_picture_url: profileImage ?? undefined,
      });

      Alert.alert("Success", "Profile updated!");
      setIsEditing(false);
      setHasChanges(false);
      refreshUser();
    } catch {
      Alert.alert("Error", "Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="text-muted-foreground mt-2">Loading profile…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={140}
        extraHeight={180}
        contentContainerStyle={{ padding: 16, paddingBottom: 260 }}
      >
        {/* Card */}
        <View
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderWidth: 1,
            padding: 24,
            borderRadius: 26,
            marginBottom: 32,
            shadowColor: theme.shadow,
            shadowOpacity: 1,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <View className="flex-row items-center">
            {/* Image */}
            <View>
              <View
                className="w-28 h-28 rounded-2xl overflow-hidden items-center justify-center bg-muted border border-border"
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={{ width: 112, height: 112, borderRadius: 20 }}
                  />
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={112}
                    color={theme.mutedForeground}
                  />
                )}
              </View>

              {/* Camera button */}
              <TouchableOpacity
                onPress={() => {
                  if (!isEditing) setIsEditing(true);
                  showPhotoOptions();
                }}
                style={{
                  position: "absolute",
                  bottom: -6,
                  right: -6,
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: theme.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: theme.shadow,
                  shadowOpacity: 0.4,
                  shadowRadius: 5,
                }}
              >
                <Ionicons name="camera" size={17} color={theme.primaryForeground} />
              </TouchableOpacity>
            </View>

            {/* Text */}
            <View style={{ flex: 1, marginLeft: 22 }}>
              <Text className="text-2xl font-semibold text-foreground">
                {formData.full_name || "Your Name"}
              </Text>

              <Text className="text-base text-muted-foreground mt-1">
                {formData.company_name || "Company Name"}
              </Text>

              <Text className="text-sm text-muted-foreground mt-3">
                {formData.email_address}
              </Text>

              <Text className="text-sm text-muted-foreground mt-1">
                {formData.phone_number}
              </Text>

              {!isEditing && (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={{
                    marginTop: 12,
                    alignSelf: "flex-start",
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    flexDirection: "row",
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                  }}
                >
                  <Ionicons name="pencil" size={14} color={theme.primary} />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontWeight: "600",
                      color: theme.primary,
                    }}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Form */}
        <View className="space-y-5">
          <InputField label="Full Name *" editable={isEditing} value={formData.full_name} onChange={(t: string) => markChanged("full_name", t)} />

          <InputField label="Company Name *" editable={isEditing} value={formData.company_name} onChange={(t: string) => markChanged("company_name", t)} />

          {/* DOB */}
          <View>
            <Text className="text-foreground mb-2 mt-2 font-medium">Date of Birth *</Text>
            <TouchableOpacity onPress={() => isEditing && setShowDatePicker(true)}>
              <View className="border border-border rounded-lg p-3 bg-card">
                <Text className="text-foreground">{formData.date_of_birth || "YYYY-MM-DD"}</Text>
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <View style={{ marginTop: 6 }}>
                <DateTimePicker
                  value={dobDate ?? new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={onChangeDate}
                />

                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={{
                      marginTop: 10,
                      alignSelf: "flex-end",
                      backgroundColor: theme.primary,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.primaryForeground,
                        fontWeight: "600",
                      }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <InputField label="Phone Number" editable={false} value={formData.phone_number} />

          <InputField label="Email Address" editable={false} value={formData.email_address} />

          <InputField label="Address *" editable={isEditing} multiline numberOfLines={4} value={formData.address} onChange={(t: string) => markChanged("address", t)} />

          <InputField label="GSTIN" editable={isEditing} value={formData.gstin} onChange={(t: string) => markChanged("gstin", t)} />

          <InputField label="Bank Name" editable={isEditing} value={formData.bank_name} onChange={(t: string) => markChanged("bank_name", t)} />

          <InputField label="Account Holder Name" editable={isEditing} value={formData.account_holder_name} onChange={(t: string) => markChanged("account_holder_name", t)} />

          <InputField label="IFSC Code" editable={isEditing} autoCapitalize="characters" value={formData.ifsc_code} onChange={(t: string) => markChanged("ifsc_code", t)} />
        </View>

        {/* Save button */}
        {isEditing && hasChanges && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className={`mt-8 rounded-xl py-4 items-center ${loading ? "bg-muted" : "bg-primary"}`}
          >
            {loading ? (
              <ActivityIndicator color={theme.primaryForeground} />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const InputField = ({
  label,
  editable,
  value,
  onChange,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = "none",
}: any) => (
  <View>
    <Text className="text-foreground mb-2 mt-2 font-medium">{label}</Text>
    <TextInput
      editable={editable}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCapitalize={autoCapitalize}
      className={`border border-border rounded-lg p-3 bg-card text-foreground ${
        !editable && "opacity-60"
      }`}
      value={value}
      onChangeText={onChange}
    />
  </View>
);
