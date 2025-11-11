// app/settings/help-center.tsx
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Phone, Mail, MessageCircle, ChevronLeft } from "lucide-react-native";

const PHONE = "9319595984";
const EMAIL = "trucksarthi@gmail.com";

export default function HelpCenter() {
  const router = useRouter();

  const openWhatsApp = async () => {
    const url = `https://wa.me/91${PHONE}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert("WhatsApp not installed");
    }
  };

  return (
    <ScrollView className="flex-1 bg-background px-5 pt-10">
      

      <Text className="text-foreground text-base mb-6">
        We are available 24×7 to help you with any issues or questions.
      </Text>

      {/* WhatsApp Support */}
      <TouchableOpacity
        onPress={openWhatsApp}
        className="flex-row items-center bg-green-600 p-4 rounded-xl mb-4 justify-center"
      >
        <MessageCircle size={22} color="#fff" />
        <Text className="text-white font-semibold text-base ml-2">
          Chat on WhatsApp
        </Text>
      </TouchableOpacity>

      {/* Call Support */}
      <TouchableOpacity
        onPress={() => Linking.openURL(`tel:${PHONE}`)}
        className="flex-row items-center bg-card p-4 rounded-xl mb-4"
      >
        <Phone size={20} color="#007AFF" />
        <Text className="text-foreground text-base ml-3">
          Call Support: +91 {PHONE}
        </Text>
      </TouchableOpacity>

      {/* Email Support */}
      <TouchableOpacity
        onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
        className="flex-row items-center bg-card p-4 rounded-xl mb-4"
      >
        <Mail size={20} color="#007AFF" />
        <Text className="text-foreground text-base ml-3">{EMAIL}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}
