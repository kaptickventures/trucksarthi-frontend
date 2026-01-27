import { X } from "lucide-react-native";
import { useRef } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../hooks/useThemeStore";

type TruckFormData = {
    registration_number: string;
    chassis_number: string;
    engine_number: string;
    registered_owner_name: string;
    container_dimension: string;
    loading_capacity: string;
};

type Props = {
    visible: boolean;
    editing: boolean;
    formData: TruckFormData;
    setFormData: (data: TruckFormData) => void;
    onSubmit: () => void;
    onClose: () => void;
};

export default function TruckFormModal({
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

    const fields: { label: string; key: keyof TruckFormData; placeholder: string; required?: boolean; numeric?: boolean }[] = [
        { label: "Registration Number", key: "registration_number", placeholder: "e.g. MH 12 AB 1234", required: true },
        { label: "Registered Owner", key: "registered_owner_name", placeholder: "Full Owner Name", required: true },
        { label: "Container Dimension", key: "container_dimension", placeholder: "e.g. 20ft / 32ft" },
        { label: "Loading Capacity (Tons)", key: "loading_capacity", placeholder: "e.g. 10", numeric: true },
        { label: "Chassis Number", key: "chassis_number", placeholder: "Optional" },
        { label: "Engine Number", key: "engine_number", placeholder: "Optional" },
    ];

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
                                    {editing ? "Update Vehicle" : "Add New Truck"}
                                </Text>
                                <Text className="text-muted-foreground text-xs font-bold mt-1 uppercase tracking-widest">
                                    Vehicle Configuration
                                </Text>
                            </View>
                            <TouchableOpacity onPress={closeModal} className="w-10 h-10 bg-muted rounded-full items-center justify-center">
                                <X size={22} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
                            <View className="gap-5 pb-10">
                                {fields.map((field) => (
                                    <View key={field.key}>
                                        <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                                            {field.label} {field.required && <Text style={{ color: colors.destructive }}>*</Text>}
                                        </Text>
                                        <TextInput
                                            className="rounded-2xl p-4 text-base font-bold"
                                            style={{
                                                backgroundColor: isDark ? colors.card : colors.secondary + '40',
                                                color: colors.foreground,
                                                borderWidth: 1,
                                                borderColor: isDark ? colors.border : colors.border + '30'
                                            }}
                                            value={formData[field.key]}
                                            onChangeText={(val) => setFormData({ ...formData, [field.key]: val })}
                                            placeholder={field.placeholder}
                                            placeholderTextColor={colors.mutedForeground + '80'}
                                            keyboardType={field.numeric ? "numeric" : "default"}
                                            autoCapitalize={field.key === "registration_number" ? "characters" : "words"}
                                        />
                                    </View>
                                ))}

                                {/* Actions */}
                                <TouchableOpacity
                                    onPress={onSubmit}
                                    style={{ backgroundColor: colors.primary }}
                                    className="py-5 rounded-[22px] mt-4 shadow-lg shadow-green-500/20"
                                >
                                    <Text style={{ color: colors.primaryForeground }} className="text-center font-black text-lg">
                                        {editing ? "Apply Changes" : "Save Truck"}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={closeModal}
                                    className="py-4 items-center"
                                >
                                    <Text className="text-muted-foreground font-bold">Discard</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}
