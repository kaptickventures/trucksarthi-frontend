// app/profile/basic-details.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { auth } from "../firebaseConfig";
import { syncFirebaseUser } from "../hooks/useAuth";

export default function BasicDetails() {
  const router = useRouter();
  const user = auth.currentUser;

  const [full_name, setFullName] = useState(user?.displayName ?? "");
  const [email_address] = useState(user?.email ?? "");
  const [phone_number] = useState(user?.phoneNumber ?? "");
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

  const onSave = async () => {
    if (!full_name || !company_name || !date_of_birth || !address) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      await syncFirebaseUser({
        full_name,
        email_address,
        phone_number,
        company_name,
        address,
        date_of_birth,
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
    <ScrollView className="flex-1 bg-white dark:bg-black px-6 pt-10">
      <Text className="text-3xl font-bold mb-6 text-black dark:text-white">
        Basic Details
      </Text>

      {/* Profile Photo */}
      <View className="items-center mb-6">
        <TouchableOpacity
          onPress={pickImage}
          className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 items-center justify-center"
        >
          {profile_picture_url ? (
            <Image source={{ uri: profile_picture_url }} className="w-28 h-28" />
          ) : (
            <Text className="text-gray-600">Add Photo</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Full Name */}
      <Text className="text-gray-700 dark:text-gray-300 mb-1">Full Name *</Text>
      <TextInput
        value={full_name}
        onChangeText={setFullName}
        className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-4 text-black dark:text-white"
        placeholder="Your full name"
        placeholderTextColor="#999"
      />

      {/* Company Name */}
      <Text className="text-gray-700 dark:text-gray-300 mb-1">Company Name *</Text>
      <TextInput
        value={company_name}
        onChangeText={setCompany}
        className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-4 text-black dark:text-white"
        placeholder="Company name"
        placeholderTextColor="#999"
      />

      {/* DOB */}
      <Text className="text-gray-700 dark:text-gray-300 mb-1">Date of Birth *</Text>
      <TextInput
        value={date_of_birth}
        onChangeText={setDob}
        keyboardType="default"
        className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-4 text-black dark:text-white"
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#999"
      />

      {/* Phone Number (Read Only) */}
      <Text className="text-gray-700 dark:text-gray-300 mb-1">Phone Number *</Text>
      <TextInput
        value={phone_number}
        editable={false}
        keyboardType="phone-pad"
        className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-4 opacity-60 text-black dark:text-white"
        placeholder="+91 98765 43210"
        placeholderTextColor="#999"
      />

      {/* Email (Read Only) */}
      <Text className="text-gray-700 dark:text-gray-300 mb-1">Email Address *</Text>
      <TextInput
        value={email_address}
        editable={false}
        keyboardType="email-address"
        autoCapitalize="none"
        className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-4 opacity-60 text-black dark:text-white"
        placeholder="you@example.com"
        placeholderTextColor="#999"
      />

      {/* Address */}
      <Text className="text-gray-700 dark:text-gray-300 mb-1">Address *</Text>
      <TextInput
        value={address}
        onChangeText={setAddress}
        multiline
        className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-6 text-black dark:text-white"
        placeholder="Full address"
        placeholderTextColor="#999"
      />

      {/* Save Button */}
      <TouchableOpacity
        onPress={onSave}
        disabled={loading}
        className={`rounded-xl py-4 items-center mb-10 ${
          loading ? "bg-gray-400" : "bg-green-600"
        }`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold">Save & Continue</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
