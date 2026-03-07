import { MapPin, Search, X } from "lucide-react-native";
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
    const [isSearchFocused, setIsSearchFocused] = useState(false);

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
        // Removed 'editing' check so search works during edit too
        if (!visible || !searchLocations || query.length < 3 || (formData.place_id && !isSearchFocused)) {
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
        }, 400);
        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [formData.complete_address, visible, searchLocations, isSearchFocused]);

    const onPickSuggestion = (item: LocationSuggestion) => {
        setSuggestions([]);
        setIsSearchFocused(false);
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
                        height: "85%",
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
                        <View style={{ backgroundColor: colors.muted }} className="w-12 h-1.5 rounded-full self-center mb-4 opacity-40" />

                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-6 px-2">
                            <View>
                                <Text style={{ color: colors.foreground }} className="text-2xl font-black tracking-tight">
                                    {editing ? "Edit Point" : "Add Location"}
                                </Text>
                                <Text className="text-muted-foreground text-[10px] font-black mt-1 uppercase tracking-[2px] opacity-60">
                                    Network Access Point
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={closeModal}
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={{ backgroundColor: colors.muted + '40' }}
                            >
                                <X size={22} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
                            <View className="gap-6 pb-12">
                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-3 ml-1">
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
                                        placeholder="e.g. Pune Hub, Warehouse A"
                                        placeholderTextColor={colors.mutedForeground + '60'}
                                    />
                                </View>

                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-3 ml-1">
                                        Search Address
                                    </Text>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: isDark ? colors.card : colors.secondary + '40',
                                            borderRadius: 20,
                                            borderWidth: 2,
                                            borderColor: isSearchFocused ? colors.primary : (isDark ? colors.border : colors.border + '30'),
                                            paddingHorizontal: 16,
                                        }}
                                    >
                                        <Search size={20} color={isSearchFocused ? colors.primary : colors.mutedForeground} />
                                        <TextInput
                                            className="flex-1 p-4 text-base font-bold"
                                            style={{ color: colors.foreground, minHeight: formData.complete_address.length > 30 ? 80 : 56, textAlignVertical: 'center' }}
                                            value={formData.complete_address}
                                            onFocus={() => setIsSearchFocused(true)}
                                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                            onChangeText={(val) =>
                                                setFormData({
                                                    ...formData,
                                                    complete_address: val,
                                                    place_id: undefined,
                                                    latitude: undefined,
                                                    longitude: undefined,
                                                })
                                            }
                                            placeholder="City, Street or Landmark"
                                            placeholderTextColor={colors.mutedForeground + '60'}
                                            multiline={true}
                                        />
                                        {loadingSuggestions && <ActivityIndicator size="small" color={colors.primary} />}
                                    </View>

                                    {suggestions.length > 0 && (
                                        <Animated.View
                                            style={{
                                                marginTop: 12,
                                                borderRadius: 24,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                backgroundColor: colors.card,
                                                overflow: "hidden",
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 10 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 20,
                                                elevation: 10,
                                            }}
                                        >
                                            {suggestions.map((item, index) => (
                                                <TouchableOpacity
                                                    key={item.place_id || index}
                                                    onPress={() => onPickSuggestion(item)}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 16,
                                                        borderBottomWidth: index === suggestions.length - 1 ? 0 : 1,
                                                        borderBottomColor: colors.border + "33",
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 12,
                                                            backgroundColor: colors.primary + '15',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginRight: 14
                                                        }}
                                                    >
                                                        <MapPin size={20} color={colors.primary} />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 14 }} numberOfLines={1}>
                                                            {item.location_name}
                                                        </Text>
                                                        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                                                            {item.complete_address}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </Animated.View>
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={onSubmit}
                                    style={{
                                        backgroundColor: colors.primary,
                                        paddingVertical: 18,
                                        borderRadius: 24,
                                        marginTop: 20,
                                        shadowColor: colors.primary,
                                        shadowOffset: { width: 0, height: 8 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 12,
                                        elevation: 8,
                                    }}
                                >
                                    <Text style={{ color: colors.primaryForeground }} className="text-center font-black text-lg">
                                        {editing ? "Update details" : "Register point"}
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
