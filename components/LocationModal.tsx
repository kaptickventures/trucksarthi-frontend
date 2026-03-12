import { MapPin, Navigation, Search, X } from "lucide-react-native";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { WebView } from "react-native-webview";
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
    setFormData: Dispatch<SetStateAction<LocationFormData>>;
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
    const webViewRef = useRef<WebView>(null);
    const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastPinnedRef = useRef<{ latitude: number; longitude: number } | null>(null);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [mode, setMode] = useState<"search" | "pin">("search");
    const [mapSearchQuery, setMapSearchQuery] = useState("");
    const [mapSuggestions, setMapSuggestions] = useState<LocationSuggestion[]>([]);
    const [mapSearchLoading, setMapSearchLoading] = useState(false);

    const closeModal = () => onClose();

    useEffect(() => {
        let mounted = true;
        const query = String(formData.complete_address || "").trim();

        if (!visible || mode !== "search" || !searchLocations || query.length < 3 || (formData.place_id && !isSearchFocused)) {
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
    }, [formData.complete_address, formData.place_id, visible, searchLocations, isSearchFocused, mode]);

    useEffect(() => {
        if (!visible) {
            setMode("search");
            setMapSearchQuery("");
            setMapSuggestions([]);
            setLoadingSuggestions(false);
            setMapSearchLoading(false);
            setIsSearchFocused(false);
            lastPinnedRef.current = null;
            if (geocodeTimerRef.current) {
                clearTimeout(geocodeTimerRef.current);
                geocodeTimerRef.current = null;
            }
        }
    }, [visible]);

    const injectPinToMap = (latitude: number, longitude: number) => {
        webViewRef.current?.injectJavaScript(`window.setPin && window.setPin(${latitude}, ${longitude}); true;`);
    };

    const reverseGeocode = async (latitude: number, longitude: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            return String(data?.display_name || "").trim();
        } catch {
            return "";
        }
    };

    const onPickSuggestion = (item: LocationSuggestion) => {
        setSuggestions([]);
        setIsSearchFocused(false);
        setFormData((prev) => ({
            ...prev,
            place_id: item.place_id,
            location_name: prev.location_name || item.location_name || "",
            complete_address: item.complete_address || prev.complete_address,
            latitude: item.latitude,
            longitude: item.longitude,
        }));

        if (typeof item.latitude === "number" && typeof item.longitude === "number") {
            injectPinToMap(item.latitude, item.longitude);
        }
    };

    const onSearchHere = async () => {
        const query = mapSearchQuery.trim();
        if (!query || !searchLocations) return;

        try {
            setMapSearchLoading(true);
            const results = await searchLocations(query);
            setMapSuggestions(results.slice(0, 6));
        } finally {
            setMapSearchLoading(false);
        }
    };

    const onPickMapSuggestion = (item: LocationSuggestion) => {
        setMapSuggestions([]);
        setMapSearchQuery(item.complete_address || item.location_name || "");

        setFormData((prev) => ({
            ...prev,
            place_id: item.place_id,
            complete_address: item.complete_address || prev.complete_address,
            latitude: item.latitude,
            longitude: item.longitude,
            location_name: prev.location_name || item.location_name || "",
        }));

        if (typeof item.latitude === "number" && typeof item.longitude === "number") {
            injectPinToMap(item.latitude, item.longitude);
        }
    };

    const onMapMessage = async (event: any) => {
        try {
            const payload = JSON.parse(event?.nativeEvent?.data || "{}");
            if (payload?.type !== "pin") return;

            const latitude = Number(payload?.latitude);
            const longitude = Number(payload?.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

            const lastPinned = lastPinnedRef.current;
            if (
                lastPinned &&
                Math.abs(lastPinned.latitude - latitude) < 0.000001 &&
                Math.abs(lastPinned.longitude - longitude) < 0.000001
            ) {
                return;
            }
            lastPinnedRef.current = { latitude, longitude };

            const fallbackAddress = `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`;
            setFormData((prev) => ({
                ...prev,
                latitude,
                longitude,
                place_id: undefined,
                complete_address: prev.complete_address || fallbackAddress,
            }));

            if (geocodeTimerRef.current) {
                clearTimeout(geocodeTimerRef.current);
            }

            geocodeTimerRef.current = setTimeout(async () => {
                const resolvedAddress = await reverseGeocode(latitude, longitude);
                if (!resolvedAddress) return;
                setFormData((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                    place_id: undefined,
                    complete_address: resolvedAddress,
                }));
            }, 350);
        } catch {
            // ignore malformed map messages
        }
    };

    const initialLatitude = typeof formData.latitude === "number" ? formData.latitude : 28.6139;
    const initialLongitude = typeof formData.longitude === "number" ? formData.longitude : 77.209;
    const trimmedTitle = String(formData.location_name || "").trim();
    const canSubmit = trimmedTitle.length > 0;

    const mapHtml = `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin:0; padding:0; width:100%; height:100%; }
      .leaflet-control-attribution { display:none; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('map', { zoomControl: true }).setView([${initialLatitude}, ${initialLongitude}], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      var marker = L.marker([${initialLatitude}, ${initialLongitude}], { draggable: true }).addTo(map);
      function sendPin(lat, lng) {
        var payload = JSON.stringify({ type: 'pin', latitude: lat, longitude: lng });
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(payload);
        }
      }

      map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        sendPin(e.latlng.lat, e.latlng.lng);
      });

      marker.on('dragend', function(e) {
        var p = e.target.getLatLng();
        sendPin(p.lat, p.lng);
      });

      window.setPin = function(lat, lng) {
        map.setView([lat, lng], 15);
        marker.setLatLng([lat, lng]);
        sendPin(lat, lng);
      };
    </script>
  </body>
</html>
`;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable className="flex-1 bg-black/60 justify-end" onPress={closeModal}>
                <Pressable onPress={() => {}} className="w-full">
                <Animated.View
                    className="w-full rounded-t-[42px]"
                    style={{
                        backgroundColor: colors.background,
                        height: "85%",
                        paddingHorizontal: 24,
                        paddingTop: 12,
                    }}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        className="flex-1"
                    >
                        <View style={{ backgroundColor: colors.muted }} className="w-12 h-1.5 rounded-full self-center mb-4 opacity-40" />

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
                                style={{ backgroundColor: colors.muted + "40" }}
                            >
                                <X size={22} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
                            <View className="gap-6 pb-12">
                                <View>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-3 ml-1">
                                        Location Title <Text style={{ color: colors.destructive }}>*</Text>
                                    </Text>
                                    <TextInput
                                        className="rounded-2xl p-4 text-base font-bold"
                                        style={{
                                            backgroundColor: isDark ? colors.card : colors.secondary + "40",
                                            color: colors.foreground,
                                            borderWidth: 1,
                                            borderColor: isDark ? colors.border : colors.border + "30",
                                        }}
                                        value={formData.location_name}
                                        onChangeText={(val) => setFormData((prev) => ({ ...prev, location_name: val }))}
                                        placeholder="e.g. Pune Hub, Warehouse A"
                                        placeholderTextColor={colors.mutedForeground + "60"}
                                    />

                                </View>

                                <View style={{ flexDirection: "row", gap: 10 }}>
                                    <TouchableOpacity
                                        onPress={() => setMode("search")}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 12,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: mode === "search" ? colors.primary : colors.border,
                                            backgroundColor: mode === "search" ? colors.primary + "1A" : "transparent",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ color: mode === "search" ? colors.primary : colors.foreground, fontWeight: "700" }}>
                                            Search
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setMode("pin")}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 12,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: mode === "pin" ? colors.primary : colors.border,
                                            backgroundColor: mode === "pin" ? colors.primary + "1A" : "transparent",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ color: mode === "pin" ? colors.primary : colors.foreground, fontWeight: "700" }}>
                                            Pin on map
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {mode === "search" ? (
                                    <View>
                                        <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-3 ml-1">
                                            Search Address
                                        </Text>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                backgroundColor: isDark ? colors.card : colors.secondary + "40",
                                                borderRadius: 20,
                                                borderWidth: 2,
                                                borderColor: isSearchFocused ? colors.primary : (isDark ? colors.border : colors.border + "30"),
                                                paddingHorizontal: 16,
                                            }}
                                        >
                                            <Search size={20} color={isSearchFocused ? colors.primary : colors.mutedForeground} />
                                            <TextInput
                                                className="flex-1 p-4 text-base font-bold"
                                                style={{ color: colors.foreground, minHeight: formData.complete_address.length > 30 ? 80 : 56, textAlignVertical: "center" }}
                                                value={formData.complete_address}
                                                onFocus={() => setIsSearchFocused(true)}
                                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                                onChangeText={(val) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        complete_address: val,
                                                        place_id: undefined,
                                                        latitude: undefined,
                                                        longitude: undefined,
                                                    }))
                                                }
                                                placeholder="City, Street or Landmark"
                                                placeholderTextColor={colors.mutedForeground + "60"}
                                                multiline
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
                                                            flexDirection: "row",
                                                            alignItems: "center",
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
                                                                backgroundColor: colors.primary + "15",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                marginRight: 14,
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
                                ) : (
                                    <View>
                                        <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-3 ml-1">
                                            Pin on map or Search here
                                        </Text>

                                        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                                            <View
                                                style={{
                                                    flex: 1,
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    borderRadius: 14,
                                                    backgroundColor: isDark ? colors.card : colors.secondary + "30",
                                                    paddingHorizontal: 12,
                                                }}
                                            >
                                                <Search size={16} color={colors.mutedForeground} />
                                                <TextInput
                                                    value={mapSearchQuery}
                                                    onChangeText={setMapSearchQuery}
                                                    placeholder="Search here"
                                                    placeholderTextColor={colors.mutedForeground + "66"}
                                                    style={{ flex: 1, color: colors.foreground, paddingVertical: 12, paddingHorizontal: 8 }}
                                                />
                                            </View>
                                            <TouchableOpacity
                                                onPress={onSearchHere}
                                                disabled={mapSearchLoading || !mapSearchQuery.trim()}
                                                style={{
                                                    paddingHorizontal: 14,
                                                    borderRadius: 14,
                                                    backgroundColor: colors.primary,
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    opacity: mapSearchLoading || !mapSearchQuery.trim() ? 0.6 : 1,
                                                }}
                                            >
                                                {mapSearchLoading ? (
                                                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                                                ) : (
                                                    <Navigation size={16} color={colors.primaryForeground} />
                                                )}
                                            </TouchableOpacity>
                                        </View>

                                        {mapSuggestions.length > 0 && (
                                            <View
                                                style={{
                                                    borderRadius: 14,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    backgroundColor: colors.card,
                                                    marginBottom: 10,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {mapSuggestions.map((item, index) => (
                                                    <TouchableOpacity
                                                        key={item.place_id || index}
                                                        onPress={() => onPickMapSuggestion(item)}
                                                        style={{
                                                            paddingHorizontal: 12,
                                                            paddingVertical: 10,
                                                            borderBottomWidth: index === mapSuggestions.length - 1 ? 0 : 1,
                                                            borderBottomColor: colors.border + "33",
                                                        }}
                                                    >
                                                        <Text style={{ color: colors.foreground, fontWeight: "700" }} numberOfLines={1}>
                                                            {item.location_name}
                                                        </Text>
                                                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }} numberOfLines={2}>
                                                            {item.complete_address}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}

                                        <View
                                            style={{
                                                height: 260,
                                                borderRadius: 16,
                                                overflow: "hidden",
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                            }}
                                        >
                                            <WebView
                                                ref={webViewRef}
                                                originWhitelist={["*"]}
                                                source={{ html: mapHtml }}
                                                onMessage={onMapMessage}
                                                javaScriptEnabled
                                                domStorageEnabled
                                                startInLoadingState
                                            />
                                        </View>

                                        <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 12 }}>
                                            Tap on map or drag marker to pin exact location.
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={onSubmit}
                                    disabled={!canSubmit}
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
                                        opacity: canSubmit ? 1 : 0.6,
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
            </Pressable>
        </Modal>
    );
}
