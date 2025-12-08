import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FileText, Phone, Truck, User } from "lucide-react-native";
import {
    Image,
    Linking,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DriverProfile() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const isDark = useColorScheme() === "dark";

    // Use passed data or fall back to dummy data
    const driverName = params.driver_name || "Rajesh Kumar";
    const contactNumber = params.contact_number || "+91 99887 76655";
    // Images (using placeholders if needed)
    const profileImage =
        "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";

    // Dummy stats
    const stats = [
        { label: "Trips Done", value: "48" },
        { label: "Rating", value: "4.8" },
        { label: "Exp (Yrs)", value: "5" },
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
                    Driver Profile
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView className="flex-1 px-6">
                {/* Profile Header */}
                <View className="items-center mt-2 mb-8">
                    <View className="relative">
                        <Image
                            source={{ uri: profileImage }}
                            className="w-28 h-28 rounded-full border-4 border-white shadow-sm"
                        />
                        <View className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white" />
                    </View>
                    <Text
                        className={`text-2xl font-bold mt-4 mb-1 ${isDark ? "text-white" : "text-gray-900"
                            }`}
                    >
                        {driverName}
                    </Text>
                    <Text className="text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                        Available
                    </Text>
                </View>

                {/* Stats Grid */}
                <View className="flex-row justify-between mb-8 bg-card border border-border p-4 rounded-2xl shadow-sm">
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

                {/* Quick Actions */}
                <TouchableOpacity
                    onPress={handleCall}
                    className="flex-row items-center justify-center bg-primary p-4 rounded-xl mb-8 shadow-sm"
                >
                    <Phone size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Call Driver</Text>
                </TouchableOpacity>

                {/* Documents Section */}
                <View className="mb-8">
                    <Text
                        className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-800"
                            }`}
                    >
                        Documents
                    </Text>

                    <View className="gap-3">
                        <TouchableOpacity className="flex-row items-center bg-card border border-border p-4 rounded-xl">
                            <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-4">
                                <User size={20} color="#2563EB" />
                            </View>
                            <View className="flex-1">
                                <Text
                                    className={`font-semibold ${isDark ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    Identity Proof
                                </Text>
                                <Text className="text-gray-500 text-xs">Verified</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CCC" />
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-row items-center bg-card border border-border p-4 rounded-xl">
                            <View className="w-10 h-10 bg-orange-50 rounded-lg items-center justify-center mr-4">
                                <FileText size={20} color="#EA580C" />
                            </View>
                            <View className="flex-1">
                                <Text
                                    className={`font-semibold ${isDark ? "text-white" : "text-gray-900"
                                        }`}
                                >
                                    Driving License
                                </Text>
                                <Text className="text-gray-500 text-xs">Valid till 2028</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CCC" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Current Vehicle (Dummy) */}
                <View className="mb-12">
                    <Text
                        className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-800"
                            }`}
                    >
                        Assigned Vehicle
                    </Text>
                    <View className="flex-row items-center bg-card border border-border p-4 rounded-xl">
                        <View className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center mr-4">
                            <Truck size={24} color="#666" />
                        </View>
                        <View>
                            <Text
                                className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"
                                    }`}
                            >
                                Tata 407
                            </Text>
                            <Text className="text-gray-500 text-sm">HR 55 AB 1234</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
