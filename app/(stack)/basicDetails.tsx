import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import auth from "@react-native-firebase/auth";
import { syncFirebaseUser } from "../../hooks/useAuth";

export default function BasicDetails() {
  const router = useRouter();

  // ---------------------------------------------------------
  // Firebase Auth Hydration
  // ---------------------------------------------------------
  const [firebaseUser, setFirebaseUser] = useState(auth().currentUser);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged((u) => {
      console.log("👀 Auth changed →", u?.uid);
      setFirebaseUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // ---------------------------------------------------------
  // Fields (Hooks MUST be here - no early returns above)
  // ---------------------------------------------------------
  const [full_name, setFullName] = useState("");
  const [email_address, setEmail] = useState("");
  const [phone_number, setPhone] = useState("");
  const [company_name, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [date_of_birth, setDob] = useState("");
  const [profile_picture_url, setProfileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------
  // When user is loaded, fill initial fields
  // ---------------------------------------------------------
  useEffect(() => {
    if (!firebaseUser) return;

    setFullName(firebaseUser.displayName ?? "");
    setEmail(firebaseUser.email ?? "");
    setPhone(firebaseUser.phoneNumber ?? "");
  }, [firebaseUser]);

  const hasEmail = Boolean(firebaseUser?.email);
  const hasPhone = Boolean(firebaseUser?.phoneNumber);

  // ---------------------------------------------------------
  // Image Picker
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // DOB formatter
  // ---------------------------------------------------------
  const handleDobChange = (text: string) => {
    let cleaned = text.replace(/\D/g, "").slice(0, 8);
    if (cleaned.length >= 5) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    } else if (cleaned.length >= 3) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    setDob(cleaned);
  };

  // ---------------------------------------------------------
  // SAVE FUNCTION
  // ---------------------------------------------------------
  const onSave = async () => {
    if (!firebaseUser) {
      Alert.alert("Auth error", "No authenticated user. Please log in again.");
      router.replace("/auth/login-phone");
      return;
    }

    if (!full_name || !company_name || !date_of_birth || !address) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    if (!hasEmail && !email_address) {
      Alert.alert("Missing Email", "Please provide a valid email.");
      return;
    }

    if (!hasPhone && !phone_number) {
      Alert.alert("Missing Phone", "Please provide a valid phone.");
      return;
    }

    const parts = date_of_birth.split("/");
    if (parts.length !== 3 || parts[2].length !== 4) {
      Alert.alert("Invalid Date", "Use DD/MM/YYYY format.");
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

      Alert.alert("Success", "Your details have been saved.");
      router.replace("/home");
    } catch (e: any) {
      console.log("❌ SAVE ERROR:", e?.response || e);
      Alert.alert("Failed to Save", e?.message ?? "Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // UI (NO early returns!)
  // ---------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Loading screen */}
      {!authReady ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-4">Loading your account…</Text>
        </View>
      ) : !firebaseUser ? (
        // No authenticated user
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-red-500 font-semibold">
            No authenticated user.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/auth/login-phone")}
            className="mt-5 px-6 py-3 bg-primary rounded-xl"
          >
            <Text className="text-white font-bold">Go to Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // MAIN FORM
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {/* Title */}
            <Text className="text-3xl font-bold text-center mt-4 mb-10">
              Complete Your Profile
            </Text>

            {/* Profile Image */}
            <View className="items-center mb-10">
              <TouchableOpacity onPress={pickImage}>
                <View className="w-32 h-32 rounded-full bg-muted overflow-hidden items-center justify-center border">
                  {profile_picture_url ? (
                    <Image
                      source={{ uri: profile_picture_url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Camera size={44} color="#777" />
                  )}
                </View>
              </TouchableOpacity>
              <Text className="mt-3">Add Profile Picture</Text>
            </View>

            {/* Full Name */}
            <TextInput
              placeholder="Full Name *"
              value={full_name}
              onChangeText={(t) => setFullName(t)}
              className="border p-4 rounded-xl mb-4"
            />

            {/* Company */}
            <TextInput
              placeholder="Company Name *"
              value={company_name}
              onChangeText={(t) => setCompany(t)}
              className="border p-4 rounded-xl mb-4"
            />

            {/* DOB */}
            <TextInput
              placeholder="DD/MM/YYYY *"
              value={date_of_birth}
              onChangeText={handleDobChange}
              keyboardType="number-pad"
              className="border p-4 rounded-xl mb-4"
              maxLength={10}
            />

            {/* Phone */}
            <TextInput
              placeholder="Phone Number *"
              editable={!hasPhone}
              value={phone_number}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className={`border p-4 rounded-xl mb-4 ${
                hasPhone ? "opacity-50" : ""
              }`}
            />

            {/* Email */}
            <TextInput
              placeholder="Email Address *"
              editable={!hasEmail}
              value={email_address}
              onChangeText={setEmail}
              className={`border p-4 rounded-xl mb-4 ${
                hasEmail ? "opacity-50" : ""
              }`}
              autoCapitalize="none"
            />

            {/* Address */}
            <TextInput
              placeholder="Address *"
              value={address}
              onChangeText={setAddress}
              multiline
              className="border p-4 rounded-xl mb-6"
            />

            {/* Save */}
            <TouchableOpacity
              onPress={onSave}
              disabled={loading}
              className="bg-primary rounded-xl py-4 items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Save & Continue
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
