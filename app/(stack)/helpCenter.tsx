// app/settings/help-center.tsx
import {
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  View,
} from "react-native";
import { Phone, Mail, MessageCircle } from "lucide-react-native";

const PHONE = "9319595984";
const EMAIL = "trucksarthi@gmail.com";

export default function HelpCenter() {
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

      {/* WhatsApp Card */}
      <View className="bg-card rounded-2xl p-5 mb-4 shadow-md shadow-black/10">
        <TouchableOpacity
          onPress={openWhatsApp}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View className="bg-green-600 p-3 rounded-xl">
              <MessageCircle size={20} color="#fff" />
            </View>
            <View className="ml-4">
              <Text className="text-foreground font-semibold text-base">
                WhatsApp Support
              </Text>
              <Text className="text-muted-foreground text-sm mt-1">
                Chat instantly on WhatsApp
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Call Card */}
      <View className="bg-card rounded-2xl p-5 mb-4 shadow-md shadow-black/10">
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${PHONE}`)}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View className="bg-blue-600 p-3 rounded-xl">
              <Phone size={20} color="#fff" />
            </View>
            <View className="ml-4">
              <Text className="text-foreground font-semibold text-base">
                Call Support
              </Text>
              <Text className="text-muted-foreground text-sm mt-1">
                +91 {PHONE}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Email Card */}
      <View className="bg-card rounded-2xl p-5 mb-4 shadow-md shadow-black/10">
        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <View className="bg-orange-500 p-3 rounded-xl">
              <Mail size={20} color="#fff" />
            </View>
            <View className="ml-4">
              <Text className="text-foreground font-semibold text-base">
                Email Support
              </Text>
              <Text className="text-muted-foreground text-sm mt-1">
                {EMAIL}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
