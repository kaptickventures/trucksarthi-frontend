import { useRouter } from "expo-router";
import { ChevronLeft, Mail, ShieldCheck, Lock, Send } from "lucide-react-native";
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
import { requestEmailOtp, verifyEmailOtp, postLoginFlow } from "../../hooks/useAuth";
import { useThemeStore } from "../../hooks/useThemeStore";

export default function LoginEmailOTP() {
    const router = useRouter();
    const { colors, theme } = useThemeStore();
    const isDark = theme === "dark";

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const handleSendOTP = async () => {
        if (!email || !email.includes("@")) {
            return Alert.alert("Invalid Email", "Please enter a valid email address.");
        }
        try {
            setLoading(true);
            await requestEmailOtp(email.toLowerCase().trim());
            setOtpSent(true);
        } catch (error: any) {
            Alert.alert("Error", error || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length < 4) return Alert.alert("Error", "Please enter the OTP.");
        try {
            setLoading(true);
            await verifyEmailOtp(email.toLowerCase().trim(), otp);
            await postLoginFlow(router);
        } catch (err: any) {
            Alert.alert("Login Failed", err || "Invalid OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ padding: 8, marginLeft: -8 }}
                        >
                            <ChevronLeft size={28} color={colors.foreground} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ paddingHorizontal: 32, flex: 1, justifyContent: 'center' }}>
                        <View style={{ marginBottom: 40 }}>
                            <Image
                                source={require("../../assets/images/Trucksarthi-Graphic.png")}
                                style={{ width: 170, height: 50, marginBottom: 24, tintColor: isDark ? colors.foreground : undefined }}
                                resizeMode="contain"
                            />
                            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 }}>
                                {otpSent ? "Check Email" : "Email Login"}
                            </Text>
                            <Text style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 8 }}>
                                {otpSent
                                    ? `OTP sent to ${email}`
                                    : "Enter your email to receive a login code"}
                            </Text>
                        </View>

                        {!otpSent ? (
                            <View style={{ gap: 20 }}>
                                <View>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>
                                        WORK EMAIL
                                    </Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: isDark ? colors.card : '#F8F9FA',
                                        borderRadius: 16,
                                        borderWidth: 1.5,
                                        borderColor: isDark ? colors.border : '#E9ECEF',
                                        paddingHorizontal: 16
                                    }}>
                                        <Mail size={20} color={colors.mutedForeground} />
                                        <TextInput
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            placeholder="name@company.com"
                                            placeholderTextColor={colors.mutedForeground}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 16,
                                                paddingHorizontal: 12,
                                                fontSize: 16,
                                                fontWeight: '600',
                                                color: colors.foreground
                                            }}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    disabled={loading}
                                    onPress={handleSendOTP}
                                    style={{
                                        backgroundColor: colors.primary,
                                        borderRadius: 16,
                                        paddingVertical: 18,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        gap: 10
                                    }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Send size={18} color="white" />
                                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Send OTP</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ gap: 24 }}>
                                <View>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>
                                        6-DIGIT OTP
                                    </Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: isDark ? colors.card : '#F8F9FA',
                                        borderRadius: 16,
                                        borderWidth: 1.5,
                                        borderColor: isDark ? colors.border : '#E9ECEF',
                                        paddingHorizontal: 16
                                    }}>
                                        <Lock size={20} color={colors.mutedForeground} />
                                        <TextInput
                                            value={otp}
                                            onChangeText={setOtp}
                                            placeholder="······"
                                            placeholderTextColor={colors.mutedForeground}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 16,
                                                paddingHorizontal: 12,
                                                fontSize: 28,
                                                fontWeight: '700',
                                                letterSpacing: 8,
                                                color: colors.foreground,
                                                textAlign: 'center'
                                            }}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    disabled={loading}
                                    onPress={handleVerifyOTP}
                                    style={{
                                        backgroundColor: colors.foreground,
                                        borderRadius: 16,
                                        paddingVertical: 18,
                                        alignItems: 'center'
                                    }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={colors.background} />
                                    ) : (
                                        <Text style={{ color: colors.background, fontSize: 16, fontWeight: '700' }}>Login Now</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setOtpSent(false);
                                        setOtp("");
                                    }}
                                    style={{ alignSelf: 'center' }}
                                >
                                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                                        Try with different email
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={() => router.push("/auth/login-email")}
                            style={{ marginTop: 32, paddingVertical: 12, alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                                Login with <Text style={{ color: colors.primary, fontWeight: '700' }}>Password</Text> instead
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={14} color={colors.primary} />
                            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>ENCRYPTED SESSION</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
