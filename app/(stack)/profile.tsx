import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(null);

  const addressRef = useRef<TextInput | null>(null);

  /* HEADER */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text className="text-lg font-semibold text-foreground">Profile</Text>
      ),
      headerTitleAlign: "center",
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            style={{ paddingHorizontal: 6, paddingVertical: 4 }}
            color={isDark ? "#E5E7EB" : "#111827"}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push("/helpCenter")}>
          <Ionicons
            name="help-circle-outline"
            size={26}
            style={{ paddingHorizontal: 6, paddingVertical: 4 }}
            color={isDark ? "#E5E7EB" : "#007AFF"}
          />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: "hsl(var(--background))",
      },
    });
  }, [navigation, isDark]);

  /* LOAD USER */
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name ?? "",
        company_name: user.company_name ?? "",
        date_of_birth: user.date_of_birth?.substring(0, 10) ?? "",
        phone_number: user.phone_number ?? "+91 ",
        email_address: user.email_address ?? "",
        address: user.address ?? "",
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

  /* IMAGE PICKER */
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

  /* DATE PICKER */
  const onChangeDate = (event: any, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);

    if (selected) {
      setDobDate(selected);
      const iso = selected.toISOString().split("T")[0];
      markChanged("date_of_birth", iso);
    }
  };

  /* SAVE */
  const handleSave = async () => {
    try {
      setLoading(true);

      await updateUser({
        full_name: formData.full_name,
        company_name: formData.company_name,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        profile_picture_url: profileImage ?? undefined,
      });

      Alert.alert("Updated", "Profile updated successfully!");
      setIsEditing(false);
      setHasChanges(false);
      refreshUser();
    } catch  {
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

            {/* ================= TOP CARD ================= */}
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

            {/* ================= FORM FIELDS ================= */}
            <View className="space-y-5">

              {/* FULL NAME */}
              <View>
                <Text className="text-foreground   mb-2 mt-2  font-medium">Full Name *</Text>
                <TextInput
                  editable={isEditing}
                  className={`border border-border rounded-lg p-3 bg-card text-foreground ${
                    !isEditing && "opacity-60"
                  }`}
                  value={formData.full_name}
                  onChangeText={(t) => markChanged("full_name", t)}
                />
              </View>

              {/* COMPANY NAME */}
              <View>
                <Text className="text-foreground  mb-2 mt-2  font-medium">Company Name *</Text>
                <TextInput
                  editable={isEditing}
                  className={`border border-border rounded-lg p-3 bg-card text-foreground ${
                    !isEditing && "opacity-60"
                  }`}
                  value={formData.company_name}
                  onChangeText={(t) => markChanged("company_name", t)}
                />
              </View>

              {/* DATE OF BIRTH */}
              <View>
                <Text className="text-foreground  mb-2 mt-2 font-medium">Date of Birth *</Text>

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

                    {/* DONE BUTTON */}
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
              <View>
                <Text className="text-foreground  mb-2 mt-2 font-medium">Phone Number</Text>
                <TextInput
                  editable={false}
                  className="border border-border rounded-lg p-3 bg-card text-foreground opacity-60"
                  value={formData.phone_number}
                />
              </View>

              {/* EMAIL */}
              <View>
                <Text className="text-foreground  mb-2 mt-2 font-medium">Email Address</Text>
                <TextInput
                  editable={false}
                  className="border border-border rounded-lg p-3 bg-card text-foreground opacity-60"
                  value={formData.email_address}
                />
              </View>

              {/* ADDRESS */}
              <View>
                <Text className="text-foreground  mb-2 mt-2 font-medium">Address *</Text>
                <TextInput
                  ref={addressRef}
                  editable={isEditing}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className={`border border-border rounded-lg p-3 bg-card text-foreground ${
                    !isEditing && "opacity-60"
                  }`}
                  value={formData.address}
                  onChangeText={(t) => markChanged("address", t)}
                />
              </View>
            </View>

            {/* ================= SAVE BUTTON ================= */}
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
