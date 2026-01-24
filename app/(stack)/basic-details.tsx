import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../../hooks/useUser";

export default function BasicDetailsScreen() {
    const router = useRouter();
    const { user, loading: userLoading, syncUser, uploadProfilePicture } = useUser();

    const [name, setName] = useState("");
    const [email_address, setEmail] = useState("");
    const [phone_number, setPhone] = useState("");
    const [company_name, setCompany] = useState("");
    const [address, setAddress] = useState("");
    const [date_of_birth, setDob] = useState("");
    const [profile_picture_url, setProfileUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setPhone(user.phone ?? "");
        setCompany(user.company_name ?? "");
        setAddress(user.address ?? "");
        setProfileUrl(user.profile_picture_url ?? null);

        if (user.date_of_birth) {
            const d = new Date(user.date_of_birth);
            setDob(
                `${String(d.getDate()).padStart(2, "0")}/${String(
                    d.getMonth() + 1
                ).padStart(2, "0")}/${d.getFullYear()}`
            );
        }
    }, [user]);

    const pickImage = async () => {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            Alert.alert("Permission required", "Please allow photo access.");
            return;
        }

        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
        });

        if (!res.canceled && res.assets?.length) {
            const img = res.assets[0];
            setProfileUrl(img.uri);
            try {
                await uploadProfilePicture(img);
            } catch {
                Alert.alert("Error", "Failed to upload profile picture");
            }
        }
    };

    const handleDobChange = (text: string) => {
        let v = text.replace(/\D/g, "").slice(0, 8);
        if (v.length >= 5) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        else if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
        setDob(v);
    };

    const onSave = async () => {
        if (!name || !company_name || !date_of_birth || !address) {
            Alert.alert("Missing Fields", "Please fill all required fields.");
            return;
        }

        const [dd, mm, yyyy] = date_of_birth.split("/");
        if (!dd || !mm || yyyy?.length !== 4) {
            Alert.alert("Invalid Date", "Use DD/MM/YYYY format.");
            return;
        }

        try {
            setSaving(true);
            await syncUser({
                name,
                email: email_address,
                phone: phone_number,
                company_name,
                address,
                date_of_birth: `${yyyy}-${mm}-${dd}`,
            });
            router.replace("/home");
        } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (userLoading && !user) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={styles.muted}>Loading your account…</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>Complete Your Profile</Text>

                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
                        <View style={styles.avatar}>
                            {profile_picture_url ? (
                                <Image source={{ uri: profile_picture_url }} style={styles.avatarImg} />
                            ) : (
                                <Camera size={44} color="#777" />
                            )}
                        </View>
                        <Text style={styles.muted}>Add Profile Picture</Text>
                    </TouchableOpacity>

                    <TextInput style={styles.input} placeholder="Name *" value={name} onChangeText={setName} />
                    <TextInput style={styles.input} placeholder="Company Name *" value={company_name} onChangeText={setCompany} />
                    <TextInput
                        style={styles.input}
                        placeholder="DD/MM/YYYY *"
                        value={date_of_birth}
                        onChangeText={handleDobChange}
                        keyboardType="number-pad"
                        maxLength={10}
                    />
                    <TextInput
                        style={[styles.input, user?.phone ? styles.disabledInput : null]}
                        placeholder="Phone Number *"
                        value={phone_number}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        editable={!user?.phone}
                    />
                    <TextInput
                        style={[styles.input, user?.email ? styles.disabledInput : null]}
                        placeholder="Email Address *"
                        value={email_address}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        editable={!user?.email}
                    />
                    <TextInput style={[styles.input, styles.textArea]} placeholder="Address *" value={address} onChangeText={setAddress} multiline />

                    <TouchableOpacity style={styles.button} disabled={saving} onPress={onSave}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save & Continue</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    scroll: { padding: 24, paddingBottom: 60 },
    title: { fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 32 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    muted: { marginTop: 12, color: "#777" },

    avatarWrap: { alignItems: "center", marginBottom: 32 },
    avatar: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 1,
        borderColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    avatarImg: { width: "100%", height: "100%" },

    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
    },
    textArea: { height: 100, textAlignVertical: "top" },

    button: {
        backgroundColor: "#2563eb",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 8,
    },
    buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    disabledInput: {
        backgroundColor: "#f5f5f5",
        color: "#888",
    },
});
