import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
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
import { postLoginFlow, requestEmailOtp, verifyEmailOtp } from "../../hooks/useAuth";

const COLORS = {
    title: "#128C7E",
    subtitle: "#666666",
    inputBg: "#F0F0F0",
    buttonBg: "#111B21",
    link: "#25D366",
};

export default function LoginEmailOtp() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");

    const handleSendOtp = async () => {
        if (!email) return Alert.alert("Error", "Please enter email.");
        try {
            setLoading(true);
            await requestEmailOtp(email.trim());
            setOtpSent(true);
            Alert.alert("Success", `OTP sent to ${email}`);
        } catch (e: any) {
            Alert.alert("Failed", String(e));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!email || !otp) return Alert.alert("Error", "Enter Request details");
        try {
            setLoading(true);
            await verifyEmailOtp(email.trim(), otp.trim());
            await postLoginFlow(router);
        } catch (e: any) {
            Alert.alert("Failed", String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <TouchableOpacity
                onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace("/auth/login");
                    }
                }}
                style={{ position: "absolute", top: 24, left: 24, padding: 8, zIndex: 10 }}
            >
                <ChevronLeft size={32} color="#111B21" />
            </TouchableOpacity>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 32,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Image
                        source={require("../../assets/images/TruckSarthi-Graphic.png")}
                        resizeMode="contain"
                        style={{ width: "70%", height: 100, marginBottom: 20 }}
                    />

                    <Text className="text-4xl font-extrabold" style={{ color: COLORS.title }}>
                        Login via OTP
                    </Text>

                    <Text className="mt-2 mb-8 text-center" style={{ color: COLORS.subtitle }}>
                        Enter your email to receive a login code
                    </Text>

                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!otpSent}
                        className="w-full border rounded-xl p-4 mb-4"
                        style={{ backgroundColor: COLORS.inputBg }}
                    />

                    {otpSent && (
                        <TextInput
                            value={otp}
                            onChangeText={setOtp}
                            placeholder="Enter 6-digit OTP"
                            keyboardType="number-pad"
                            className="w-full border rounded-xl p-4 mb-6"
                            style={{ backgroundColor: COLORS.inputBg }}
                        />
                    )}

                    <TouchableOpacity
                        onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                        disabled={loading}
                        className="w-full py-3 rounded-xl items-center"
                        style={{ backgroundColor: COLORS.buttonBg }}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: "white", fontWeight: "600" }}>
                                {otpSent ? "Verify & Login" : "Send OTP"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View className="mt-6 flex-row">
                        <Text style={{ color: COLORS.subtitle }}>Prefer password?</Text>
                        <TouchableOpacity onPress={() => router.replace("/auth/login-email")}>
                            <Text style={{ marginLeft: 6, color: COLORS.link }}>Login with Password</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
