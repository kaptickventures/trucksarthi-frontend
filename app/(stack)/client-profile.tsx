import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Building2, Mail, MapPin, Phone } from "lucide-react-native";
import {
    Linking,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClientProfile() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const isDark = useColorScheme() === "dark";

    // Use passed data or fall back to dummy data
    const clientName = params.client_name || "Acme Logistics Pvt Ltd";
    const contactPerson = params.contact_person_name || "Rahul Sharma";
    const contactNumber = params.contact_number || "+91 98765 43210";
    const email = params.email_address || "rahul@acmelogistics.com";
    const address =
        params.office_address || "123, Transport Nagar, New Delhi, 110001";

    // Dummy stats
    const stats = [
        { label: "Total Trips", value: "124" },
        { label: "Active", value: "3" },
        { label: "Pending", value: "₹ 45,000" },
    ];

    const handleCall = () => {
        Linking.openURL(`tel:${contactNumber}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2 -ml-2 rounded-full"
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={isDark ? "#FFF" : "#000"}
                    />
                </TouchableOpacity>
                <Text
                    className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"
                        }`}
                >
                    Client Profile
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView className="flex-1 px-6">
                {/* Profile Card */}
                <View className="items-center mt-4 mb-8">
                    <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                        <Building2 size={40} color="#2563EB" />
                    </View>
                    <Text
                        className={`text-2xl font-bold text-center mb-1 ${isDark ? "text-white" : "text-gray-900"
                            }`}
                    >
                        {clientName}
                    </Text>
                    <Text className="text-gray-500 font-medium">{contactPerson}</Text>
                </View>

                {/* Action Buttons */}
                <View className="flex-row justify-center gap-4 mb-8">
                    <TouchableOpacity
                        onPress={handleCall}
                        className="bg-green-500  flex-row items-center px-6 py-3 rounded-full shadow-sm"
                    >
                        <Phone size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-blue-500 flex-row items-center px-6 py-3 rounded-full shadow-sm">
                        <Mail size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Email</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View className="flex-row justify-between mb-8 bg-card border border-border p-4 rounded-2xl">
                    {stats.map((stat, index) => (
                        <View key={index} className="items-center flex-1">
                            <Text
                                className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"
                                    }`}
                            >
                                {stat.value}
                            </Text>
                            <Text className="text-gray-500 text-xs mt-1">{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Contact Details */}
                <View className="mb-6">
                    <Text
                        className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-800"
                            }`}
                    >
                        Contact Information
                    </Text>

                    <View className="bg-card border border-border rounded-2xl p-4 gap-4">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                                <Phone size={20} color="#666" />
                            </View>
                            <View>
                                <Text className="text-gray-500 text-xs">Phone Number</Text>
                                <Text
                                    className={`font-medium ${isDark ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    {contactNumber}
                                </Text>
                            </View>
                        </View>

                        <View className="h-[1px] bg-border" />

                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                                <Mail size={20} color="#666" />
                            </View>
                            <View>
                                <Text className="text-gray-500 text-xs">Email Address</Text>
                                <Text
                                    className={`font-medium ${isDark ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    {email}
                                </Text>
                            </View>
                        </View>

                        <View className="h-[1px] bg-border" />

                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                                <MapPin size={20} color="#666" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-500 text-xs">Office Address</Text>
                                <Text
                                    className={`font-medium ${isDark ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    {address}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
