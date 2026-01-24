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
    const translateY = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();
    const SCROLL_THRESHOLD = 40;

    const closeModal = () => {
        Animated.timing(translateY, {
            toValue: 800,
            duration: 200,
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
                    Animated.timing(translateY, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const fields: { label: string; key: keyof TruckFormData; placeholder: string; required?: boolean; numeric?: boolean }[] = [
        { label: "Registration Number", key: "registration_number", placeholder: "e.g. MH 12 AB 1234", required: true },
        { label: "Registered Owner", key: "registered_owner_name", placeholder: "Full Owner Name", required: true },
        { label: "Chassis Number", key: "chassis_number", placeholder: "Chassis No." },
        { label: "Engine Number", key: "engine_number", placeholder: "Engine No." },
        { label: "Container Dimension", key: "container_dimension", placeholder: "e.g. 20ft" },
        { label: "Loading Capacity (Tons)", key: "loading_capacity", placeholder: "e.g. 10", numeric: true },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable className="flex-1 bg-black/40" onPress={closeModal}>
                <Animated.View
                    {...panResponder.panHandlers}
                    className="absolute bottom-0 w-full bg-background rounded-t-3xl"
                    style={{
                        height: "100%",
                        paddingHorizontal: 20,
                        paddingTop: insets.top + 20,
                        transform: [{ translateY }],
                    }}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        className="flex-1"
                    >
                        {/* Grab Handle */}
                        <View className="w-14 h-1.5 bg-muted rounded-full self-center mb-4 opacity-60" />

                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-5">
                            <Text className="text-2xl font-semibold">
                                {editing ? "Edit Truck" : "Add Truck"}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <X size={28} color="#888" />
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {fields.map((field) => (
                                <View key={field.key} className="mb-4">
                                    <Text className="text-muted-foreground mb-1 font-medium capitalize">
                                        {field.label} {field.required && <Text className="text-red-500">*</Text>}
                                    </Text>
                                    <TextInput
                                        className="border border-input rounded-xl p-3"
                                        value={formData[field.key]}
                                        onChangeText={(val) => setFormData({ ...formData, [field.key]: val })}
                                        placeholder={field.placeholder}
                                        keyboardType={field.numeric ? "numeric" : "default"}
                                        autoCapitalize={field.key === "registration_number" ? "characters" : "words"}
                                    />
                                </View>
                            ))}

                            {/* Save */}
                            <TouchableOpacity
                                onPress={onSubmit}
                                className="bg-primary p-4 rounded-xl mb-3"
                            >
                                <Text className="text-center text-primary-foreground font-semibold">
                                    {editing ? "Update" : "Save"}
                                </Text>
                            </TouchableOpacity>

                            {/* Cancel */}
                            <TouchableOpacity
                                onPress={closeModal}
                                className="border border-border p-4 rounded-xl"
                            >
                                <Text className="text-center text-muted-foreground">Cancel</Text>
                            </TouchableOpacity>
                            <View className="h-10" />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}
