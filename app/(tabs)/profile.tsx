import React, { useState } from "react";
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
    }
  };

  const handleSubmit = () => {
    Alert.alert("Profile Updated", "Your profile has been saved successfully!");
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">

      {/* Profile Picture */}
      <View className="items-center mb-6">
        <View className="relative">
          <View className="w-28 h-28 rounded-full bg-muted items-center justify-center overflow-hidden">
            {profileImage ? (
              <Image source={{ uri: profileImage }} className="w-full h-full" />
            ) : (
              <Camera size={40} color="#888" />
            )}
          </View>

          <TouchableOpacity
            onPress={handleImagePick}
            className="absolute bottom-1 right-1 bg-primary p-2 rounded-full"
          >
            <Camera size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Form */}
      <View className="space-y-4">
        {[
          { key: "fullName", label: "Full Name *" },
          { key: "companyName", label: "Company Name *" },
          { key: "dob", label: "Date of Birth *", placeholder: "YYYY-MM-DD" },
          { key: "phone", label: "Phone Number *", keyboardType: "phone-pad" as const },
          { key: "email", label: "Email Address *", keyboardType: "email-address" as const },
        ].map((field) => (
          <View key={field.key}>
            <Text className="text-foreground mb-1 font-medium">{field.label}</Text>
            <TextInput
              placeholder={field.placeholder}
              keyboardType={field.keyboardType}
              className="border border-border rounded-lg p-3 bg-card text-foreground"
              value={formData[field.key as keyof typeof formData]}
              onChangeText={(text) =>
                setFormData({ ...formData, [field.key]: text })
              }
            />
          </View>
        ))}

        {/* Address */}
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

      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-primary p-4 rounded-xl mt-8 items-center"
      >
        <Text className="text-primary-foreground font-semibold text-base">
          Save Profile
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
