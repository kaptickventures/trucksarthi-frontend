import { X, Search, CheckCircle2 } from "lucide-react-native";
import { useRef, useState } from "react";
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
    ActivityIndicator,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../hooks/useThemeStore";
import { useKYC } from "../hooks/useKYC";

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
    setFormData: (data: TruckFormData | ((prev: TruckFormData) => TruckFormData)) => void;
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

    const { verifyRC, loading: isFetching } = useKYC();
    const [isVerified, setIsVerified] = useState(false);
    const [showAllFields, setShowAllFields] = useState(editing); // Show all fields if editing

    const handleFetchRC = async () => {
        if (!formData.registration_number) {
            Alert.alert("Error", "Please enter a registration number first.");
            return;
        }

        try {
            const result = await verifyRC(formData.registration_number);
            if (result.verified && result.data) {
                const rc = result.data;
                setFormData((prev: TruckFormData) => ({
                    ...prev,
                    registered_owner_name: rc.owner || prev.registered_owner_name,
                    chassis_number: rc.chassis || prev.chassis_number,
                    engine_number: rc.engine || prev.engine_number,
                }));
                setIsVerified(true);
                setShowAllFields(true); // Show all fields after successful verification
                Alert.alert("Success", "Vehicle details fetched successfully!");
            } else {
                Alert.alert("Not Found", "Details not found for this vehicle. Please enter manually.");
                setShowAllFields(true); // Allow manual entry if not found
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Failed to fetch vehicle details.");
            setShowAllFields(true); // Allow manual entry on error
        }
    };

    const closeModal = () => {
        Animated.timing(translateY, {
            toValue: 800,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            translateY.setValue(0);
            setIsVerified(false);
            setShowAllFields(editing); // Reset to initial state
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

    const allFields: { label: string; key: keyof TruckFormData; placeholder: string; required?: boolean; numeric?: boolean }[] = [
        { label: "Registration Number", key: "registration_number", placeholder: "e.g. MH 12 AB 1234", required: true },
        { label: "Registered Owner", key: "registered_owner_name", placeholder: "Full Owner Name", required: true },
        { label: "Container Dimension", key: "container_dimension", placeholder: "e.g. 20ft / 32ft" },
        { label: "Loading Capacity (Tons)", key: "loading_capacity", placeholder: "e.g. 10", numeric: true },
        { label: "Chassis Number", key: "chassis_number", placeholder: "Optional" },
        { label: "Engine Number", key: "engine_number", placeholder: "Optional" },
    ];

    const fieldsToShow = showAllFields ? allFields : [allFields[0]]; // Show only registration number initially

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable className="flex-1 bg-black/60" onPress={closeModal}>
                <Animated.View
                    {...panResponder.panHandlers}
                    className="absolute bottom-0 w-full rounded-t-[42px]"
                    style={{
                        backgroundColor: colors.background,
                        height: showAllFields ? "90%" : "50%",
                        paddingHorizontal: 24,
                        paddingTop: 12,
                        transform: [{ translateY }],
                    }}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "position"}
                        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 24}
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
                                    {showAllFields ? "Vehicle Configuration" : "Enter Registration Number"}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={closeModal} className="w-10 h-10 bg-muted rounded-full items-center justify-center">
                                <X size={22} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            contentContainerStyle={{ paddingBottom: 220 + insets.bottom }}
                        >
                            <View className="gap-5 pb-10">
                                {fieldsToShow.map((field) => (
                                    <View key={field.key}>
                                        <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                                            {field.label} {field.required && <Text style={{ color: colors.destructive }}>*</Text>}
                                        </Text>
                                        <View className="flex-row items-center gap-2">
                                            <View className="flex-1">
                                                <TextInput
                                                    className="rounded-2xl p-4 text-base font-bold"
                                                    style={{
                                                        backgroundColor: isDark ? colors.card : colors.secondary + '40',
                                                        color: colors.foreground,
                                                        borderWidth: 1,
                                                        borderColor: (field.key === "registration_number" && isVerified) ? '#22C55E' : (isDark ? colors.border : colors.border + '30')
                                                    }}
                                                    value={formData[field.key]}
                                                    onChangeText={(val) => {
                                                        if (field.key === "registration_number") setIsVerified(false);
                                                        setFormData({ ...formData, [field.key]: val });
                                                    }}
                                                    placeholder={field.placeholder}
                                                    placeholderTextColor={colors.mutedForeground + '80'}
                                                    keyboardType={field.numeric ? "numeric" : "default"}
                                                    autoCapitalize={field.key === "registration_number" ? "characters" : "words"}
                                                />
                                            </View>
                                            {field.key === "registration_number" && !editing && !showAllFields && (
                                                <TouchableOpacity
                                                    onPress={handleFetchRC}
                                                    disabled={isFetching}
                                                    style={{
                                                        backgroundColor: isVerified ? '#22C55E20' : colors.primary,
                                                        width: 54,
                                                        height: 54,
                                                        borderRadius: 16,
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    {isFetching ? (
                                                        <ActivityIndicator color="white" size="small" />
                                                    ) : isVerified ? (
                                                        <CheckCircle2 color="#22C55E" size={24} />
                                                    ) : (
                                                        <Search color="white" size={24} />
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}

                                {!showAllFields && (
                                    <TouchableOpacity
                                        onPress={() => setShowAllFields(true)}
                                        style={{ marginTop: 8 }}
                                    >
                                        <Text style={{ color: colors.primary, textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
                                            Enter details manually
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Actions */}
                                {showAllFields && (
                                    <>
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
                                    </>
                                )}
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}
