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

export default function Profile() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, updateUser, refreshUser } = useUser();

  const theme = {
    card: isDark ? "hsl(220 15% 12%)" : "hsl(0 0% 98%)",
    border: isDark ? "hsl(220 10% 28%)" : "hsl(0 0% 88%)",
    muted: isDark ? "hsl(220 10% 20%)" : "hsl(0 0% 96%)",
    mutedForeground: isDark ? "hsl(0 0% 75%)" : "hsl(0 0% 40%)",
    primary: isDark ? "hsl(217 90% 60%)" : "hsl(220 85% 40%)",
    primaryForeground: "#fff",
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

  const addressRef = useRef<TextInput | null>(null);


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

  const pickFromLibrary = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted)
      return Alert.alert("Permission required", "Please allow photo access.");

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
    if (!granted)
      return Alert.alert("Permission required", "Please allow camera access.");

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
      profileImage
        ? { text: "Remove Photo", action: removePhoto, style: "destructive" }
        : null,
      { text: "Cancel", style: "cancel" },
    ].filter(Boolean);

    Alert.alert(
      "Profile Photo",
      "Choose an option",
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
      const iso = selected.toISOString().split("T")[0];
      markChanged("date_of_birth", iso);
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

      Alert.alert("Updated", "Profile updated successfully!");
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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-muted-foreground mt-2">Loading profile...</Text>
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
        <TouchableOpacity activeOpacity={1} onPress={Keyboard.dismiss}>
          <View>
            {/* TOP CARD */}
            <View
              className="rounded-3xl p-6 mb-8"
              style={{
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 24,
                borderRadius: 26,
                marginBottom: 32,
                shadowColor: isDark ? "#000" : "#1f2937",
                shadowOpacity: isDark ? 0.4 : 0.15,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
            >
              <View className="flex-row items-center">
                {/* IMAGE */}
                <View>
                  <View
                    className="w-28 h-28 rounded-2xl overflow-hidden items-center justify-center"
                    style={{
                      backgroundColor: "hsl(var(--muted))",
                      borderWidth: 1,
                      borderColor: "hsl(var(--border))",
                    }}
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
                        color="hsl(var(--muted-foreground))"
                      />
                    )}
                  </View>

                  {/* CAMERA */}
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
                      backgroundColor: "hsl(var(--primary))",
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOpacity: 0.2,
                      shadowRadius: 5,
                      elevation: 4,
                    }}
                  >
                    <Ionicons name="camera" size={17} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* RIGHT SIDE */}
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
                      className="mt-4"
                      style={{
                        alignSelf: "flex-start",
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        flexDirection: "row",
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,122,255,0.12)",
                      }}
                    >
                      <Ionicons
                        name="pencil"
                        size={14}
                        color="hsl(var(--primary))"
                      />
                      <Text
                        style={{
                          marginLeft: 6,
                          fontWeight: 600,
                          color: "hsl(var(--primary))",
                        }}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* FORM FIELDS */}
            <View className="space-y-5">
              {/* FULL NAME */}
              <InputField
                label="Full Name *"
                editable={isEditing}
                value={formData.full_name}
                onChange={(t) => markChanged("full_name", t)}
              />

              {/* COMPANY NAME */}
              <InputField
                label="Company Name *"
                editable={isEditing}
                value={formData.company_name}
                onChange={(t) => markChanged("company_name", t)}
              />

              {/* DATE OF BIRTH */}
              <View>
                <Text className="text-foreground mb-2 mt-2 font-medium">
                  Date of Birth *
                </Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => isEditing && setShowDatePicker(true)}
                >
                  <View className="border border-border rounded-lg p-3 bg-card">
                    <Text className="text-foreground">
                      {formData.date_of_birth || "YYYY-MM-DD"}
                    </Text>
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
                          backgroundColor: "hsl(var(--primary))",
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: "hsl(var(--primary-foreground))",
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

              {/* PHONE */}
              <InputField
                label="Phone Number"
                editable={false}
                value={formData.phone_number}
              />

              {/* EMAIL */}
              <InputField
                label="Email Address"
                editable={false}
                value={formData.email_address}
              />

              {/* ADDRESS */}
              <InputField
                label="Address *"
                editable={isEditing}
                value={formData.address}
                onChange={(t) => markChanged("address", t)}
                multiline
                numberOfLines={4}
              />

              {/* GSTIN */}
              <InputField
                label="GSTIN"
                editable={isEditing}
                value={formData.gstin}
                onChange={(t) => markChanged("gstin", t)}
              />

              {/* BANK NAME */}
              <InputField
                label="Bank Name"
                editable={isEditing}
                value={formData.bank_name}
                onChange={(t) => markChanged("bank_name", t)}
              />

              {/* ACCOUNT HOLDER NAME */}
              <InputField
                label="Account Holder Name"
                editable={isEditing}
                value={formData.account_holder_name}
                onChange={(t) => markChanged("account_holder_name", t)}
              />

              {/* IFSC CODE */}
              <InputField
                label="IFSC Code"
                editable={isEditing}
                value={formData.ifsc_code}
                onChange={(t) => markChanged("ifsc_code", t)}
                autoCapitalize="characters"
              />
            </View>

            {/* SAVE BUTTON */}
            {isEditing && hasChanges && (
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                className={`mt-8 rounded-xl py-4 items-center ${
                  loading ? "bg-gray-400" : "bg-primary"
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-primary-foreground font-semibold text-base">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
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
}: {
  label: string;
  editable: boolean;
  value: string;
  onChange?: (t: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: "none" | "characters" | "words" | "sentences";
}) => (
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
