// app/profile/profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Pencil, Settings, HelpCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../hooks/useUser";

export default function Profile() {
  const router = useRouter();
  const { user, updateUser, refreshUser } = useUser();

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

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name ?? "",
        company_name: user.company_name ?? "",
        date_of_birth: user.date_of_birth?.substring(0, 10) ?? "",
        phone_number: user.phone_number ?? "",
        email_address: user.email_address ?? "",
        address: user.address ?? "",
      });
      setProfileImage(user.profile_picture_url ?? null);
    }
  }, [user]);

  const markChanged = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleImagePick = async () => {
    if (!isEditing) return;

    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Please allow photo access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateUser({
        full_name: formData.full_name,
        company_name: formData.company_name,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        profile_picture_url: profileImage ?? undefined,
      });

      Alert.alert("✅ Success", "Profile updated successfully!");
      setIsEditing(false);
      setHasChanges(false);
      refreshUser();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update profile");
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Profile Picture */}
      <View className="items-center mb-6">
        <View className="relative">
          <View
            className={`w-28 h-28 rounded-full bg-muted items-center justify-center overflow-hidden ${
              !isEditing && "opacity-90"
            }`}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} className="w-full h-full" />
            ) : (
              <Camera size={40} color="#888" />
            )}
          </View>

          {isEditing && (
            <TouchableOpacity
              onPress={handleImagePick}
              className="absolute bottom-1 right-1 bg-primary p-2 rounded-full"
            >
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Edit / Cancel */}
      {!isEditing ? (
        <TouchableOpacity className="self-end mb-3 flex-row items-center" onPress={() => setIsEditing(true)}>
          <Pencil size={16} color="#007AFF" />
          <Text className="text-blue-600 ml-1 font-medium">Edit Profile</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className="self-end mb-3 flex-row items-center"
          onPress={() => {
            setIsEditing(false);
            setHasChanges(false);
          }}
        >
          <Text className="text-red-600 ml-1 font-medium">Cancel</Text>
        </TouchableOpacity>
      )}

      {/* Fields */}
      <View className="space-y-4">
        {[
          { key: "full_name", label: "Full Name *", editable: true },
          { key: "company_name", label: "Company Name *", editable: true },
          { key: "date_of_birth", label: "Date of Birth *", placeholder: "YYYY-MM-DD", editable: true },
          { key: "phone_number", label: "Phone Number", keyboardType: "phone-pad" as const, editable: false },
          { key: "email_address", label: "Email Address", keyboardType: "email-address" as const, editable: false },
        ].map((field) => (
          <View key={field.key}>
            <Text className="text-foreground mb-1 font-medium">{field.label}</Text>
            <TextInput
              placeholder={field.placeholder}
              editable={isEditing && field.editable}
              keyboardType={field.keyboardType}
              className={`border border-border rounded-lg p-3 bg-card text-foreground ${
                !field.editable && "opacity-60"
              }`}
              value={formData[field.key as keyof typeof formData]}
              onChangeText={(text) => markChanged(field.key, text)}
            />
          </View>
        ))}

        {/* Address */}
        <View>
          <Text className="text-foreground mb-1 font-medium">Address *</Text>
          <TextInput
            multiline
            editable={isEditing}
            numberOfLines={3}
            className={`border border-border rounded-lg p-3 bg-card text-foreground ${!isEditing && "opacity-60"}`}
            value={formData.address}
            onChangeText={(text) => markChanged("address", text)}
          />
        </View>
      </View>

      {/* Save Button */}
      {isEditing && hasChanges && (
        <TouchableOpacity onPress={handleSave} className="bg-primary p-4 rounded-xl mt-6 items-center">
          <Text className="text-primary-foreground font-semibold text-base">Save Changes</Text>
        </TouchableOpacity>
      )}

      {/* Navigation Buttons */}
      <TouchableOpacity
        onPress={() => router.push("/settings")}
        className="flex-row items-center justify-center bg-blue-600 p-4 rounded-xl mt-8"
      >
        <Settings size={20} color="#fff" />
        <Text className="text-white font-semibold text-base ml-2">Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/helpCenter")}
        className="flex-row items-center justify-center bg-green-600 p-4 rounded-xl mt-4 mb-6"
      >
        <HelpCircle size={20} color="#fff" />
        <Text className="text-white font-semibold text-base ml-2">Help Center</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
