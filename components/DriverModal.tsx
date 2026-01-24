import * as ImagePicker from "expo-image-picker";
import { X } from "lucide-react-native";
import { useRef } from "react";
import {
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../hooks/useThemeStore";
import { getFileUrl } from "../lib/utils";

type DriverFormData = {
    driver_name: string;
    contact_number: string;
    identity_card_url: string;
    license_card_url: string;
};

type Props = {
    visible: boolean;
    editing: boolean;
    formData: DriverFormData;
    setFormData: (data: DriverFormData) => void;
    onSubmit: () => void;
    onClose: () => void;
};

export default function DriverFormModal({
    visible,
    editing,
    formData,
    setFormData,
    onSubmit,
    onClose,
}: Props) {
    const { colors, theme } = useThemeStore();
    const isDark = theme === "dark";
    const translateY = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();
    const SCROLL_THRESHOLD = 40;

    const closeModal = () => {
        Animated.timing(translateY, {
            toValue: 800,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            translateY.setValue(0);
            onClose();
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (_, state) => state.y0 < SCROLL_THRESHOLD,
            onPanResponderMove: (_, state) => {
                if (state.dy > 0) translateY.setValue(state.dy);
            },
            onPanResponderRelease: (_, state) => {
                if (state.dy > 120) closeModal();
                else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4
                    }).start();
                }
            },
        })
    ).current;

    const pickImage = async (field: keyof DriverFormData) => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission needed", "Allow gallery access to upload images.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
        });

        if (!result.canceled) {
            setFormData({
                ...formData,
                [field]: result.assets[0].uri,
            });
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable className="flex-1 bg-black/60" onPress={closeModal}>
                <Animated.View
                    {...panResponder.panHandlers}
                    className="absolute bottom-0 w-full rounded-t-[42px]"
                    style={{
                        backgroundColor: colors.background,
                        height: "90%",
                        paddingHorizontal: 24,
                        paddingTop: 12,
                        transform: [{ translateY }],
                    }}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        className="flex-1"
                    >
                        {/* Grab Handle */}
                        <View style={{ backgroundColor: colors.muted }} className="w-12 h-1.5 rounded-full self-center mb-6 opacity-40" />

                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-8 px-2">
                            <View>
                                <Text style={{ color: colors.foreground }} className="text-2xl font-black tracking-tight">
                                    {editing ? "Update Profile" : "Register Driver"}
                                </Text>
                                <Text className="text-muted-foreground text-xs font-bold mt-1 uppercase tracking-widest">
                                    Driver Information
                                </Text>
                            </View>
                            <TouchableOpacity onPress={closeModal} className="w-10 h-10 bg-muted rounded-full items-center justify-center">
                                <X size={22} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="gap-6 pb-12">
                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                                        Full Name <Text style={{ color: colors.destructive }}>*</Text>
                                    </Text>
                                    <TextInput
                                        className="rounded-2xl p-4 text-base font-bold"
                                        style={{
                                            backgroundColor: isDark ? colors.card : colors.secondary + '40',
                                            color: colors.foreground,
                                            borderWidth: 1,
                                            borderColor: isDark ? colors.border : colors.border + '30'
                                        }}
                                        value={formData.driver_name}
                                        onChangeText={(val) => setFormData({ ...formData, driver_name: val })}
                                        placeholder="Enter full name"
                                        placeholderTextColor={colors.mutedForeground + '60'}
                                    />
                                </View>

                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                                        Contact Number <Text style={{ color: colors.destructive }}>*</Text>
                                    </Text>
                                    <TextInput
                                        className="rounded-2xl p-4 text-base font-bold"
                                        style={{
                                            backgroundColor: isDark ? colors.card : colors.secondary + '40',
                                            color: colors.foreground,
                                            borderWidth: 1,
                                            borderColor: isDark ? colors.border : colors.border + '30'
                                        }}
                                        value={formData.contact_number}
                                        onChangeText={(val) => setFormData({ ...formData, contact_number: val })}
                                        placeholder="Mobile number"
                                        placeholderTextColor={colors.mutedForeground + '60'}
                                        keyboardType="phone-pad"
                                    />
                                </View>

                                {/* Identity Card */}
                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-3 ml-1">
                                        Aadhaar / ID Proof
                                    </Text>
                                    {formData.identity_card_url !== "" ? (
                                        <TouchableOpacity onPress={() => pickImage("identity_card_url")} activeOpacity={0.9}>
                                            <Image
                                                source={{ uri: getFileUrl(formData.identity_card_url) || formData.identity_card_url }}
                                                className="w-full h-44 rounded-3xl mb-2"
                                                style={{ backgroundColor: colors.muted }}
                                            />
                                            <Text className="text-center text-primary font-bold text-xs">Tap to change photo</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => pickImage("identity_card_url")}
                                            style={{ backgroundColor: isDark ? colors.card : colors.secondary + '40', borderStyle: 'dotted', borderColor: colors.border }}
                                            className="w-full h-32 rounded-3xl border-2 items-center justify-center"
                                        >
                                            <Text style={{ color: colors.mutedForeground }} className="font-bold">Upload Aadhaar Photo</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* License Card */}
                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-3 ml-1">
                                        Driving License
                                    </Text>
                                    {formData.license_card_url !== "" ? (
                                        <TouchableOpacity onPress={() => pickImage("license_card_url")} activeOpacity={0.9}>
                                            <Image
                                                source={{ uri: getFileUrl(formData.license_card_url) || formData.license_card_url }}
                                                className="w-full h-44 rounded-3xl mb-2"
                                                style={{ backgroundColor: colors.muted }}
                                            />
                                            <Text className="text-center text-primary font-bold text-xs">Tap to change photo</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => pickImage("license_card_url")}
                                            style={{ backgroundColor: isDark ? colors.card : colors.secondary + '40', borderStyle: 'dotted', borderColor: colors.border }}
                                            className="w-full h-32 rounded-3xl border-2 items-center justify-center"
                                        >
                                            <Text style={{ color: colors.mutedForeground }} className="font-bold">Upload License Photo</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Actions */}
                                <TouchableOpacity
                                    onPress={onSubmit}
                                    style={{ backgroundColor: colors.primary }}
                                    className="py-5 rounded-[22px] mt-6 shadow-lg shadow-green-500/20"
                                >
                                    <Text style={{ color: colors.primaryForeground }} className="text-center font-black text-lg">
                                        {editing ? "Apply Changes" : "Register Driver"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}
