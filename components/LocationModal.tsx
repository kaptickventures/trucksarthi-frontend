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

type LocationFormData = {
    location_name: string;
    complete_address: string;
};

type Props = {
    visible: boolean;
    editing: boolean;
    formData: LocationFormData;
    setFormData: (data: LocationFormData) => void;
    onSubmit: () => void;
    onClose: () => void;
};

export default function LocationFormModal({
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
                        <View className="w-14 h-1.5 bg-muted rounded-full self-center mb-4 opacity-60" />

                        <View className="flex-row justify-between items-center mb-5">
                            <Text className="text-2xl font-semibold">
                                {editing ? "Edit Location" : "Add Location"}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <X size={28} color="#888" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="mb-4">
                                <Text className="text-muted-foreground mb-1 font-medium capitalize">
                                    Location Name <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    className="border border-input rounded-xl p-3"
                                    value={formData.location_name}
                                    onChangeText={(val) => setFormData({ ...formData, location_name: val })}
                                    placeholder="e.g. Pune, Mumbai Warehouse"
                                />
                            </View>

                            <View className="mb-6">
                                <Text className="text-muted-foreground mb-1 font-medium capitalize">
                                    Complete Address <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    className="border border-input rounded-xl p-3"
                                    value={formData.complete_address}
                                    onChangeText={(val) => setFormData({ ...formData, complete_address: val })}
                                    placeholder="Enter full address"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={onSubmit}
                                className="bg-primary p-4 rounded-xl mb-3"
                            >
                                <Text className="text-center text-primary-foreground font-semibold">
                                    {editing ? "Update" : "Save"}
                                </Text>
                            </TouchableOpacity>

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
