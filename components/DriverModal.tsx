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
                                {editing ? "Edit Driver" : "Add Driver"}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <X size={28} color="#888" />
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="mb-4">
                                <Text className="text-muted-foreground mb-1 font-medium capitalize">
                                    Driver Name <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    className="border border-input rounded-xl p-3"
                                    value={formData.driver_name}
                                    onChangeText={(val) => setFormData({ ...formData, driver_name: val })}
                                    placeholder="Enter driver name"
                                />
                            </View>

                            <View className="mb-4">
                                <Text className="text-muted-foreground mb-1 font-medium capitalize">
                                    Contact Number <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    className="border border-input rounded-xl p-3"
                                    value={formData.contact_number}
                                    onChangeText={(val) => setFormData({ ...formData, contact_number: val })}
                                    placeholder="Enter contact number"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Identity Card */}
                            <View className="mb-4">
                                <Text className="text-muted-foreground mb-1 font-medium">
                                    Identity Card Photo
                                </Text>
                                {formData.identity_card_url !== "" && (
                                    <Image
                                        source={{ uri: getFileUrl(formData.identity_card_url) || formData.identity_card_url }}
                                        style={{
                                            width: "100%",
                                            height: 160,
                                            borderRadius: 12,
                                            marginBottom: 10,
                                        }}
                                    />
                                )}
                                <TouchableOpacity
                                    onPress={() => pickImage("identity_card_url")}
                                    className="bg-secondary p-3 rounded-xl"
                                >
                                    <Text className="text-center">
                                        {formData.identity_card_url ? "Change Photo" : "Upload Photo"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* License Card */}
                            <View className="mb-4">
                                <Text className="text-muted-foreground mb-1 font-medium">
                                    License Card Photo
                                </Text>
                                {formData.license_card_url !== "" && (
                                    <Image
                                        source={{ uri: getFileUrl(formData.license_card_url) || formData.license_card_url }}
                                        style={{
                                            width: "100%",
                                            height: 160,
                                            borderRadius: 12,
                                            marginBottom: 10,
                                        }}
                                    />
                                )}
                                <TouchableOpacity
                                    onPress={() => pickImage("license_card_url")}
                                    className="bg-secondary p-3 rounded-xl"
                                >
                                    <Text className="text-center">
                                        {formData.license_card_url ? "Change Photo" : "Upload Photo"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

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
