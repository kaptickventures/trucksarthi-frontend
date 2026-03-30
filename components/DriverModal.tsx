import * as Contacts from "expo-contacts";
import { BookUser } from "lucide-react-native";
import {
    Alert,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useThemeStore } from "../hooks/useThemeStore";
import BottomSheet from "./BottomSheet";

type DriverFormData = {
    driver_name: string;
    contact_number: string;
    identity_card_url: any;
    license_card_url: any;
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

    const closeModal = () => {
        onClose();
    };

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
        <BottomSheet
            visible={visible}
            onClose={closeModal}
            title={editing ? "Update Profile" : "Register Driver"}
            subtitle="Driver Information"
        >
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={120}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                enableAutomaticScroll={false}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
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
                                        backgroundColor: colors.input,
                                        color: colors.foreground,
                                        borderWidth: 1,
                                        borderColor: colors.border
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
                                    backgroundColor: colors.input,
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
                                backgroundColor: colors.input,
                                color: colors.foreground,
                                borderWidth: 1,
                                borderColor: colors.border
                            }}
                            value={formData.contact_number}
                            onChangeText={(val) => setFormData({ ...formData, contact_number: val })}
                            placeholder="Mobile number"
                            placeholderTextColor={colors.mutedForeground + '60'}
                            keyboardType="phone-pad"
                        />
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
            </KeyboardAwareScrollView>
        </BottomSheet>
    );
}
