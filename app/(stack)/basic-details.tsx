import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import {
    Camera,
    User,
    Building2,
    MapPin,
    Calendar as CalendarIcon,
    ChevronRight,
    CheckCircle2,
    ArrowRight,
    Smartphone,
    Mail
} from "lucide-react-native";
import { useEffect, useState } from "react";
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
    StatusBar
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../../hooks/useUser";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate, getFileUrl } from "../../lib/utils";

export default function BasicDetailsScreen() {
    const router = useRouter();
    const { colors, theme } = useThemeStore();
    const { user, loading: userLoading, syncUser, uploadProfilePicture, refreshUser } = useUser();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [company_name, setCompany] = useState("");
    const [address, setAddress] = useState("");
    const [dob, setDob] = useState<Date | null>(null);
    const [profile_picture_url, setProfileUrl] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;
        setName(user.name ?? "");

        // Detect if email is a placeholder (phone-based generated email)
        const currentEmail = user.email ?? "";
        const isPlaceholder = currentEmail.includes("@trucksarthi.com") && user.phone && currentEmail.startsWith(user.phone);

        if (isPlaceholder) {
            setEmail(""); // Let user fill their real email
        } else {
            setEmail(currentEmail);
        }

        setPhone(user.phone ?? "");
        setCompany(user.company_name ?? "");
        setAddress(user.address ?? "");
        setProfileUrl(user.profile_picture_url ?? null);

        if (user.date_of_birth) {
            const d = new Date(user.date_of_birth);
            if (!isNaN(d.getTime())) setDob(d);
        }
    }, [user]);

    const pickImage = async () => {
        try {
            const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!granted) {
                Alert.alert("Permission required", "Please allow photo access to set a profile picture.");
                return;
            }

            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                allowsEditing: true,
                aspect: [1, 1]
            });

            if (!res.canceled && res.assets?.length) {
                const img = res.assets[0];
                setProfileUrl(img.uri);
                await uploadProfilePicture(img);
                await refreshUser();
            }
        } catch (err) {
            console.error("Upload error:", err);
            Alert.alert("Upload Failed", "Could not save your profile picture.");
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) setDob(selectedDate);
    };

    const validate = () => {
        if (!name.trim()) return "Full Name is required";
        if (!company_name.trim()) return "Company Name is required";
        if (!dob) return "Date of Birth is required";
        if (!email.trim() || !email.includes("@")) return "A valid Email Address is required";
        if (!address.trim()) return "Address is required";
        return null;
    };

    const onSave = async () => {
        const error = validate();
        if (error) {
            Alert.alert("Incomplete Profile", error);
            return;
        }

        try {
            setSaving(true);
            await syncUser({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                company_name: company_name.trim(),
                address: address.trim(),
                date_of_birth: dob?.toISOString()
            });

            Alert.alert("Success", "Profile completed! Welcome to TruckSarthi.", [
                { text: "Get Started", onPress: () => router.replace("/(tabs)/home") }
            ]);
        } catch (e: any) {
            const errorMsg = e.response?.data?.message || e.message || "Failed to save profile";
            Alert.alert("Error", errorMsg);
        } finally {
            setSaving(false);
        }
    };

    if (userLoading && !user) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 16, color: colors.mutedForeground, fontWeight: '600' }}>Setting up your profile...</Text>
            </View>
        );
    }

    const currentEmail = user?.email ?? "";
    const isEmailPlaceholder = currentEmail.includes("@trucksarthi.com") && user?.phone && currentEmail.startsWith(user?.phone);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 60 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Splash */}
                    <View style={{ backgroundColor: theme === 'dark' ? colors.muted : '#F0FDF4', padding: 32, paddingBottom: 48, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
                        <Text style={{ fontSize: 32, fontWeight: '900', color: colors.foreground, marginBottom: 8 }}>Almost There!</Text>
                        <Text style={{ fontSize: 16, color: colors.mutedForeground, lineHeight: 22 }}>Just a few more details to get your fleet management journey started.</Text>
                    </View>

                    <View style={{ paddingHorizontal: 24, marginTop: -32 }}>
                        {/* Avatar Section */}
                        <View style={{ alignItems: 'center', marginBottom: 32 }}>
                            <TouchableOpacity activeOpacity={0.9} onPress={pickImage} style={{ position: 'relative' }}>
                                <View style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    backgroundColor: colors.card,
                                    borderWidth: 4,
                                    borderColor: colors.background,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    elevation: 5
                                }}>
                                    {profile_picture_url ? (
                                        <Image source={{ uri: getFileUrl(profile_picture_url) ?? undefined }} style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <User size={50} color={colors.mutedForeground} strokeWidth={1.5} />
                                    )}
                                </View>
                                <View style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 4,
                                    backgroundColor: colors.primary,
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    borderWidth: 3,
                                    borderColor: colors.background,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <Camera size={16} color={colors.primaryForeground} strokeWidth={2.5} />
                                </View>
                            </TouchableOpacity>
                            <Text style={{ marginTop: 12, fontSize: 11, fontWeight: '800', color: colors.mutedForeground, letterSpacing: 1 }}>UPLOAD PROFILE PHOTO</Text>
                        </View>

                        {/* Form */}
                        <View style={{ gap: 20 }}>
                            <CustomInput
                                label="FULL NAME"
                                value={name}
                                onChange={setName}
                                colors={colors}
                                placeholder="Enter your full name"
                                icon={<User size={18} color={colors.mutedForeground} />}
                            />

                            <CustomInput
                                label="COMPANY NAME"
                                value={company_name}
                                onChange={setCompany}
                                colors={colors}
                                placeholder="Your fleet or business name"
                                icon={<Building2 size={18} color={colors.mutedForeground} />}
                            />

                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>DATE OF BIRTH</Text>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setShowDatePicker(true)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: colors.card,
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        gap: 12
                                    }}
                                >
                                    <CalendarIcon size={18} color={colors.mutedForeground} />
                                    <Text style={{ flex: 1, fontSize: 16, color: dob ? colors.foreground : colors.mutedForeground, fontWeight: dob ? '600' : '400' }}>
                                        {dob ? formatDate(dob.toISOString()) : "Select your birth date"}
                                    </Text>
                                    <ChevronRight size={18} color={colors.border} />
                                </TouchableOpacity>
                            </View>

                            <CustomInput
                                label="MOBILE NUMBER"
                                value={phone}
                                colors={colors}
                                editable={false}
                                placeholder="+91 XXXXX XXXXX"
                                icon={<Smartphone size={18} color={colors.mutedForeground} />}
                                containerStyle={{ opacity: 0.7, backgroundColor: colors.muted }}
                            />

                            <CustomInput
                                label="EMAIL ADDRESS"
                                value={email}
                                onChange={setEmail}
                                colors={colors}
                                editable={isEmailPlaceholder}
                                placeholder="email@example.com"
                                icon={<Mail size={18} color={colors.mutedForeground} />}
                                containerStyle={!isEmailPlaceholder ? { opacity: 0.7, backgroundColor: colors.muted } : {}}
                            />

                            <CustomInput
                                label="OFFICE ADDRESS"
                                value={address}
                                onChange={setAddress}
                                colors={colors}
                                placeholder="Full business address"
                                icon={<MapPin size={18} color={colors.mutedForeground} />}
                                multiline
                                height={100}
                            />

                            {showDatePicker && (
                                <DateTimePicker
                                    value={dob || new Date(new Date().setFullYear(new Date().getFullYear() - 20))}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                />
                            )}

                            {/* Action Button */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                disabled={saving}
                                onPress={onSave}
                                style={{
                                    backgroundColor: colors.foreground,
                                    borderRadius: 18,
                                    paddingVertical: 20,
                                    marginTop: 10,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: 12,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 15,
                                    elevation: 8
                                }}
                            >
                                {saving ? (
                                    <ActivityIndicator color={colors.background} />
                                ) : (
                                    <>
                                        <Text style={{ color: colors.background, fontSize: 16, fontWeight: '800' }}>Complete Setup</Text>
                                        <ArrowRight size={20} color={colors.primary} strokeWidth={3} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const CustomInput = ({ label, value, onChange, placeholder, icon, multiline, height, editable = true, containerStyle, colors }: any) => (
    <View>
        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>{label}</Text>
        <View style={[{
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: multiline ? 12 : 0,
            gap: 12
        }, containerStyle]}>
            <View style={{ marginTop: multiline ? 4 : 0 }}>{icon}</View>
            <TextInput
                value={value}
                onChangeText={onChange}
                editable={editable}
                placeholder={placeholder}
                placeholderTextColor={colors.mutedForeground}
                multiline={multiline}
                style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.foreground,
                    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
                    height: height || 'auto',
                    textAlignVertical: multiline ? 'top' : 'center'
                }}
            />
            {editable === false && value ? (
                <CheckCircle2 size={16} color={colors.success} />
            ) : null}
        </View>
    </View>
);
