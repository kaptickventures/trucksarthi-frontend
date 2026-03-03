import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
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
import { LocationSuggestion } from "../hooks/useLocation";

type LocationFormData = {
    location_name: string;
    complete_address: string;
    place_id?: string;
    latitude?: number;
    longitude?: number;
};

type Props = {
    visible: boolean;
    editing: boolean;
    formData: LocationFormData;
    setFormData: (data: LocationFormData) => void;
    searchLocations?: (query: string) => Promise<LocationSuggestion[]>;
    onSubmit: () => void;
    onClose: () => void;
};

export default function LocationFormModal({
    visible,
    editing,
    formData,
    setFormData,
    searchLocations,
    onSubmit,
    onClose,
}: Props) {
    const { colors, theme } = useThemeStore();
    const isDark = theme === "dark";
    const translateY = useRef(new Animated.Value(0)).current;
    const SCROLL_THRESHOLD = 40;
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

    useEffect(() => {
        let mounted = true;
        const query = String(formData.complete_address || "").trim();
        if (!visible || editing || !searchLocations || query.length < 2) {
            setSuggestions([]);
            return;
        }
        setLoadingSuggestions(true);
        const timer = setTimeout(async () => {
            try {
                const results = await searchLocations(query);
                if (mounted) setSuggestions(results.slice(0, 5));
            } finally {
                if (mounted) setLoadingSuggestions(false);
            }
        }, 300);
        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [formData.complete_address, visible, editing, searchLocations]);

    const onPickSuggestion = (item: LocationSuggestion) => {
        setSuggestions([]);
        setFormData({
            ...formData,
            place_id: item.place_id,
            location_name: formData.location_name || item.location_name || "",
            complete_address: item.complete_address || formData.complete_address,
            latitude: item.latitude,
            longitude: item.longitude,
        });
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable className="flex-1 bg-black/60" onPress={closeModal}>
                <Animated.View
                    {...panResponder.panHandlers}
                    className="absolute bottom-0 w-full rounded-t-[42px]"
                    style={{
                        backgroundColor: colors.background,
                        height: "80%",
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
                                    {editing ? "Edit Point" : "Add Location"}
                                </Text>
                                <Text className="text-muted-foreground text-xs font-bold mt-1 uppercase tracking-widest">
                                    Network Access Point
                                </Text>
                            </View>
                            <TouchableOpacity onPress={closeModal} className="w-10 h-10 bg-muted rounded-full items-center justify-center">
                                <X size={22} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
                            <View className="gap-6 pb-12">
                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                                        Location Alias <Text style={{ color: colors.destructive }}>*</Text>
                                    </Text>
                                    <TextInput
                                        className="rounded-2xl p-4 text-base font-bold"
                                        style={{
                                            backgroundColor: isDark ? colors.card : colors.secondary + '40',
                                            color: colors.foreground,
                                            borderWidth: 1,
                                            borderColor: isDark ? colors.border : colors.border + '30'
                                        }}
                                        value={formData.location_name}
                                        onChangeText={(val) => setFormData({ ...formData, location_name: val })}
                                        placeholder="e.g. Warehouse 1, Pune Main"
                                        placeholderTextColor={colors.mutedForeground + '60'}
                                    />
                                </View>

                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                                        Full Postal Address
                                    </Text>
                                    <TextInput
                                        className="rounded-2xl p-4 text-base font-bold min-h-[120px]"
                                        style={{
                                            backgroundColor: isDark ? colors.card : colors.secondary + '40',
                                            color: colors.foreground,
                                            borderWidth: 1,
                                            borderColor: isDark ? colors.border : colors.border + '30'
                                        }}
                                        value={formData.complete_address}
                                        onChangeText={(val) =>
                                            setFormData({
                                                ...formData,
                                                complete_address: val,
                                                place_id: undefined,
                                                latitude: undefined,
                                                longitude: undefined,
                                            })
                                        }
                                        placeholder="Street, Landmark, City..."
                                        placeholderTextColor={colors.mutedForeground + '60'}
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                    />
                                    {loadingSuggestions && (
                                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
                                            <ActivityIndicator size="small" color={colors.primary} />
                                            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Searching places...</Text>
                                        </View>
                                    )}
                                    {suggestions.length > 0 && (
                                        <View
                                            style={{
                                                marginTop: 10,
                                                borderRadius: 14,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                backgroundColor: colors.card,
                                                overflow: "hidden",
                                            }}
                                        >
                                            {suggestions.map((item) => (
                                                <TouchableOpacity
                                                    key={item.place_id}
                                                    onPress={() => onPickSuggestion(item)}
                                                    style={{
                                                        paddingHorizontal: 14,
                                                        paddingVertical: 12,
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: colors.border + "33",
                                                    }}
                                                >
                                                    <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13 }}>
                                                        {item.location_name}
                                                    </Text>
                                                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 3 }}>
                                                        {item.complete_address}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={onSubmit}
                                    style={{ backgroundColor: colors.primary }}
                                    className="py-5 rounded-[22px] mt-6 shadow-lg shadow-green-500/20"
                                >
                                    <Text style={{ color: colors.primaryForeground }} className="text-center font-black text-lg">
                                        {editing ? "Update Record" : "Save Location"}
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
