import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";
import { syncFirebaseUser } from "../../hooks/useAuth";

export default function BasicDetails() {
  const router = useRouter();
  const user = auth.currentUser;

  // 🔹 Detect what’s missing
  const hasEmail = Boolean(user?.email);
  const hasPhone = Boolean(user?.phoneNumber);

  const [full_name, setFullName] = useState(user?.displayName ?? "");
  const [email_address, setEmail] = useState(user?.email ?? "");
  const [phone_number, setPhone] = useState(user?.phoneNumber ?? "");
  const [company_name, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [date_of_birth, setDob] = useState("");
  const [profile_picture_url, setProfileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Please allow photo access.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!res.canceled && res.assets?.length) {
      setProfileUrl(res.assets[0].uri);
    }
  };

  const handleDobChange = (text: string) => {
    let cleaned = text.replace(/\D/g, "").slice(0, 8);
    if (cleaned.length >= 5) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    } else if (cleaned.length >= 3) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    setDob(cleaned);
  };

  const onSave = async () => {
    if (!full_name || !company_name || !date_of_birth || !address) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    // Basic validation for added field
    if (!hasEmail && !email_address) {
      Alert.alert("Missing Email", "Please enter a valid email address.");
      return;
    }
    if (!hasPhone && !phone_number) {
      Alert.alert("Missing Phone", "Please enter a valid phone number.");
      return;
    }

    const parts = date_of_birth.split("/");
    if (parts.length !== 3 || parts[2].length !== 4) {
      Alert.alert("Invalid Date", "Enter a valid date in DD/MM/YYYY format.");
      return;
    }
    const formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;

    try {
      setLoading(true);
      await syncFirebaseUser({
        full_name,
        email_address,
        phone_number,
        company_name,
        address,
        date_of_birth: formattedDob,
        profile_picture_url: profile_picture_url ?? undefined,
      });

      Alert.alert("✅ Success", "Your basic details are saved.");
      router.replace("/home");
    } catch (e: any) {
      Alert.alert("Failed to Save", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text className="text-3xl font-bold text-center mt-4 mb-10 text-foreground">
            Complete Your Profile
          </Text>

          {/* Profile Photo */}
          <View className="w-full items-center mt-4 mb-10">
            <View className="relative items-center justify-center">
              {/* Outer shadow ring */}
              <View className="w-36 h-36 rounded-full bg-card shadow-lg items-center justify-center">
                {/* Actual circular image container */}
                <View className="w-32 h-32 rounded-full overflow-hidden bg-muted items-center justify-center border-2 border-border">
                  {profile_picture_url ? (
                    <Image
                      source={{ uri: profile_picture_url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Camera size={44} color="#999" />
                  )}
                </View>
              </View>

              {/* Floating camera icon */}
              <TouchableOpacity
                onPress={pickImage}
                activeOpacity={0.8}
                className="absolute bottom-2 right-2 bg-primary w-11 h-11 rounded-full items-center justify-center shadow-md border-2 border-white"
              >
                <Camera size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text className="text-foreground mt-4 font-medium text-base">
              Add Profile Picture
            </Text>
          </View>

          {/* Fields */}
          <View>

            {/* Full Name */}
        <View className="mb-6">
  <Text className="text-foreground mb-2 font-medium">Full Name *</Text>
  <TextInput
    value={full_name}
    onChangeText={(text) => {
      // Capitalize only the first character, leave rest as typed
      if (text.length === 0) {
        setFullName("");
      } else {
        setFullName(text.charAt(0).toUpperCase() + text.slice(1));
      }
    }}
    autoCapitalize="none" // disable auto word capitalization    className="border border-border rounded-xl p-4 bg-card text-foreground"
    placeholder="Enter your full name"
    placeholderTextColor="#888"
  />
        </View>

            {/* Company Name */}
            <View className="mb-6">
              <Text className="text-foreground mb-2 font-medium">Company Name *</Text>
              <TextInput
                value={company_name}
                onChangeText={(text) => {
                  if (text.length === 0) {
                    setCompany("");
                  } else {
                    setCompany(text.charAt(0).toUpperCase() + text.slice(1));
                  }
                }}
                autoCapitalize="none" // disable auto word capitalization
                className="border border-border rounded-xl p-4 bg-card text-foreground"
                placeholder="Enter your company name"
                placeholderTextColor="#888"
              />
            </View>

            {/* DOB */}
            <View className="mb-6">
              <Text className="text-foreground mb-2 font-medium">
                Date of Birth (DD/MM/YYYY) *
              </Text>
              <TextInput
                value={date_of_birth}
                onChangeText={handleDobChange}
                keyboardType="number-pad"
                maxLength={10}
                className="border border-border rounded-xl p-4 bg-card text-foreground"
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#888"
              />
            </View>

            {/* Phone Number (editable if missing) */}
            <View className="mb-6">
              <Text className="text-foreground mb-2 font-medium">Phone Number *</Text>
              <TextInput
                value={phone_number}
                onChangeText={setPhone}
                editable={!hasPhone}
                keyboardType="phone-pad"
                className={`border border-border rounded-xl p-4 ${
                  hasPhone ? "bg-muted opacity-60" : "bg-card"
                } text-foreground`}
                placeholder="+91 98765 43210"
                placeholderTextColor="#888"
              />
              {!hasPhone && (
                <Text className="text-xs text-muted-foreground mt-1">
                  You signed up with email — please provide your phone number.
                </Text>
              )}
            </View>

            {/* Email Address (editable if missing) */}
            <View className="mb-6">
              <Text className="text-foreground mb-2 font-medium">Email Address *</Text>
              <TextInput
                value={email_address}
                onChangeText={setEmail}
                editable={!hasEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className={`border border-border rounded-xl p-4 ${
                  hasEmail ? "bg-muted opacity-60" : "bg-card"
                } text-foreground`}
                placeholder="you@example.com"
                placeholderTextColor="#888"
              />
              {!hasEmail && (
                <Text className="text-xs text-muted-foreground mt-1">
                  You signed up with phone — please provide your email address.
                </Text>
              )}
            </View>

            {/* Address */}
            <View className="mb-8">
              <Text className="text-foreground mb-2 font-medium">Address *</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                className="border border-border rounded-xl p-4 bg-card text-foreground"
                placeholder="Your full address"
                placeholderTextColor="#888"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={onSave}
            disabled={loading}
            className={`rounded-xl py-4 items-center mt-2 mb-14 shadow-md ${
              loading ? "bg-gray-400" : "bg-primary"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">
                Save & Continue
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
