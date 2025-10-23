import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";

export default function Profile() {
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    dob: "",
    phone: "",
    email: "",
    address: "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleImagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow photo access to upload your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    Alert.alert("Profile Updated", "Your profile has been saved successfully!");
    console.log(formData);
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Header */}
      <View className="bg-card border-b border-border py-4 mb-6 rounded-xl">
        <Text className="text-xl font-semibold text-center text-foreground">Profile</Text>
      </View>

      {/* Profile Picture */}
      <View className="flex items-center mb-6">
        <View className="relative">
          <View className="w-28 h-28 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <Image source={{ uri: profileImage }} className="w-full h-full" />
            ) : (
              <Camera size={40} color="#888" />
            )}
          </View>

          <TouchableOpacity
            onPress={handleImagePick}
            className="absolute bottom-0 right-0 bg-primary p-2 rounded-full"
          >
            <Camera size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Form Fields */}
      <View className="space-y-4">
        <View>
          <Text className="text-foreground mb-1 font-medium">Full Name *</Text>
          <TextInput
            className="border border-border rounded-lg p-3 bg-card text-foreground"
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
          />
        </View>

        <View>
          <Text className="text-foreground mb-1 font-medium">Company Name *</Text>
          <TextInput
            className="border border-border rounded-lg p-3 bg-card text-foreground"
            value={formData.companyName}
            onChangeText={(text) => setFormData({ ...formData, companyName: text })}
          />
        </View>

        <View>
          <Text className="text-foreground mb-1 font-medium">Date of Birth *</Text>
          <TextInput
            placeholder="YYYY-MM-DD"
            className="border border-border rounded-lg p-3 bg-card text-foreground"
            value={formData.dob}
            onChangeText={(text) => setFormData({ ...formData, dob: text })}
          />
        </View>

        <View>
          <Text className="text-foreground mb-1 font-medium">Phone Number *</Text>
          <TextInput
            keyboardType="phone-pad"
            className="border border-border rounded-lg p-3 bg-card text-foreground"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
          />
        </View>

        <View>
          <Text className="text-foreground mb-1 font-medium">Email Address *</Text>
          <TextInput
            keyboardType="email-address"
            className="border border-border rounded-lg p-3 bg-card text-foreground"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
          />
        </View>

        <View>
          <Text className="text-foreground mb-1 font-medium">Address *</Text>
          <TextInput
            multiline
            numberOfLines={3}
            className="border border-border rounded-lg p-3 bg-card text-foreground"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-primary p-4 rounded-xl mt-8 items-center"
      >
        <Text className="text-white font-semibold text-base">Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
