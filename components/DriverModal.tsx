import * as Contacts from "expo-contacts";
import { Picker } from "@react-native-picker/picker";
import { BookUser, X } from "lucide-react-native";
import { useRef } from "react";
import {
    Alert,
    Animated,
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
import { useThemeStore } from "../hooks/useThemeStore";

type DriverFormData = {
    driver_name: string;
    contact_number: string;
    identity_card_url: any;
    license_card_url: any;
    assigned_truck_id?: string;
};

type Props = {
    visible: boolean;
    editing: boolean;
    formData: DriverFormData;
    trucks: Array<{ _id: string; registration_number?: string }>;
    setFormData: (data: DriverFormData) => void;
    onSubmit: () => void;
    onClose: () => void;
};

export default function DriverFormModal({
    visible,
    editing,
    formData,
    trucks,
    setFormData,
    onSubmit,
    onClose,
}: Props) {
    const { colors, theme } = useThemeStore();
    const isDark = theme === "dark";
    const translateY = useRef(new Animated.Value(0)).current;
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

    const normalizePhone = (value?: string) => {
        if (!value) return "";
        const trimmed = value.trim();
        const hasPlus = trimmed.startsWith("+");
        const digits = trimmed.replace(/\D/g, "");
        if (!digits) return "";
        return hasPlus ? `+${digits}` : digits;
    };

    const pickDriverFromContacts = async () => {
        if (Platform.OS === "web") {
            Alert.alert("Not supported", "Contact picker is not supported on web.");
            return;
        }

        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission needed", "Allow contacts access to import driver details.");
                return;
            }

            const selected = await Contacts.presentContactPickerAsync();
            if (!selected) return;

            const contact = await Contacts.getContactByIdAsync(selected.id, [
                Contacts.Fields.PhoneNumbers,
                Contacts.Fields.Name,
            ]);

            const number =
                normalizePhone(contact?.phoneNumbers?.[0]?.number);

            if (!number) {
                Alert.alert("No number found", "Selected contact has no phone number.");
                return;
            }

            setFormData({
                ...formData,
                driver_name: (contact?.name || selected.name || "").trim(),
                contact_number: number,
            });
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Unable to load contact.");
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
                            <TouchableOpacity
                                onPress={closeModal}
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={{ backgroundColor: colors.muted }}
                            >
                                <X size={22} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
                            <View className="gap-6 pb-12">
                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                                        Full Name <Text style={{ color: colors.destructive }}>*</Text>
                                    </Text>
                                    <View style={{ flexDirection: "row", gap: 10 }}>
                                        <View style={{ flex: 1 }}>
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
                                        <TouchableOpacity
                                            onPress={pickDriverFromContacts}
                                            style={{
                                                width: 54,
                                                height: 54,
                                                borderRadius: 16,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderWidth: 1,
                                                borderColor: isDark ? colors.border : colors.border + "40",
                                                backgroundColor: isDark ? colors.card : colors.secondary + "30",
                                            }}
                                            accessibilityRole="button"
                                            accessibilityLabel="Pick from contacts"
                                        >
                                            <BookUser size={20} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>
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

                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                                        Assigned Truck
                                    </Text>
                                    <View
                                        style={{
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: isDark ? colors.border : colors.border + "30",
                                            backgroundColor: isDark ? colors.card : colors.secondary + "40",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <Picker
                                            selectedValue={formData.assigned_truck_id || ""}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    assigned_truck_id: value,
                                                })
                                            }
                                            dropdownIconColor={colors.foreground}
                                            style={{ color: colors.foreground }}
                                        >
                                            <Picker.Item label="Select Truck (Optional)" value="" />
                                            {(trucks || []).map((truck) => (
                                                <Picker.Item
                                                    key={truck._id}
                                                    label={truck.registration_number || "Unnamed Truck"}
                                                    value={truck._id}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
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
