import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MapPin, Search } from "lucide-react-native";
import type { MapPressEvent, MarkerDragEvent } from "react-native-maps";

import API from "../api/axiosInstance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useLocationPicker } from "../../context/LocationPickerContext";

let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

type LocationSuggestion = {
  place_id: string;
  location_name: string;
  complete_address?: string;
  latitude?: number;
  longitude?: number;
};

type LocationDraft = {
  location_name: string;
  complete_address: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
};

export default function LocationPicker() {
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string;
    address?: string;
    placeId?: string;
    lat?: string;
    lng?: string;
  }>();
  const { setDraft } = useLocationPicker();
  const mapRef = useRef<any>(null);
  const isWeb = Platform.OS === "web";

  const initialLocation = useMemo<LocationDraft>(() => {
    const latitude = params.lat ? Number(params.lat) : undefined;
    const longitude = params.lng ? Number(params.lng) : undefined;
    return {
      location_name: params.name ? String(params.name) : "",
      complete_address: params.address ? String(params.address) : "",
      place_id: params.placeId ? String(params.placeId) : undefined,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
    };
  }, [params.address, params.lat, params.lng, params.name, params.placeId]);

  const [location, setLocation] = useState<LocationDraft>(initialLocation);
  const [searchQuery, setSearchQuery] = useState(initialLocation.complete_address || "");
  const [searchResults, setSearchResults] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await API.get(`/api/locations/autocomplete`, {
          params: { query: trimmed },
        });
        const results = Array.isArray(res.data) ? res.data : [];
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  }, [searchQuery]);

  const getFallbackLocationName = (payload: { name?: string; address?: string }) => {
    const preferredName = String(payload.name || "").trim();
    if (preferredName) return preferredName;

    const address = String(payload.address || "").trim();
    if (!address) return "Pinned Location";

    const [firstSegment] = address.split(",");
    return String(firstSegment || address).trim() || "Pinned Location";
  };

  const resolveAddressFromCoords = async (latitude: number, longitude: number) => {
    if (!mapsApiKey) return;
    setIsResolvingAddress(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${mapsApiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      const first = Array.isArray(data?.results) ? data.results[0] : null;
      if (first?.formatted_address) {
        setSearchQuery(first.formatted_address);
        setLocation((prev) => ({
          ...prev,
          complete_address: first.formatted_address,
          place_id: first.place_id || prev.place_id,
          location_name: prev.location_name?.trim()
            ? prev.location_name
            : getFallbackLocationName({ address: first.formatted_address }),
        }));
      }
    } catch {
      // ignore reverse geocode failures
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const mapRegion = useMemo(() => {
    const latitude = typeof location.latitude === "number" ? location.latitude : 20.5937;
    const longitude = typeof location.longitude === "number" ? location.longitude : 78.9629;
    const hasExact = typeof location.latitude === "number" && typeof location.longitude === "number";
    return {
      latitude,
      longitude,
      latitudeDelta: hasExact ? 0.03 : 8,
      longitudeDelta: hasExact ? 0.03 : 8,
    };
  }, [location.latitude, location.longitude]);

  const canConfirm =
    String(location.location_name || "").trim().length > 0 ||
    (Number.isFinite(location.latitude) && Number.isFinite(location.longitude));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) + 6 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.background + "CC" }]}
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: isDark ? colors.card : colors.secondary + "30" }]}>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search on Google Maps"
            placeholderTextColor={colors.mutedForeground + "70"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {isSearching && <Text style={[styles.searchingText, { color: colors.mutedForeground }]}>...</Text>}
        </View>
      </View>

      {!!searchResults.length && (
        <View style={[styles.searchResults, { borderColor: colors.border, backgroundColor: colors.background }]}>
          {searchResults.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              style={[styles.searchResultItem, { borderBottomColor: colors.border + "55" }]}
              onPress={() => {
                setSearchQuery(item.complete_address || item.location_name);
                setSearchResults([]);
                setLocation((prev) => ({
                  ...prev,
                  location_name: item.location_name || prev.location_name,
                  complete_address: item.complete_address || item.location_name || prev.complete_address,
                  place_id: item.place_id,
                  latitude: item.latitude ?? prev.latitude,
                  longitude: item.longitude ?? prev.longitude,
                }));
                if (!isWeb && Number.isFinite(item.latitude) && Number.isFinite(item.longitude)) {
                  mapRef.current?.animateToRegion(
                    {
                      latitude: Number(item.latitude),
                      longitude: Number(item.longitude),
                      latitudeDelta: 0.03,
                      longitudeDelta: 0.03,
                    },
                    350
                  );
                }
              }}
            >
              <Text style={[styles.searchResultTitle, { color: colors.foreground }]} numberOfLines={1}>
                {item.location_name}
              </Text>
              {!!item.complete_address && (
                <Text style={[styles.searchResultSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.complete_address}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.mapShell}>
        {isWeb || !MapView ? (
          <View style={[styles.webMapFallback, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.webMapTitle, { color: colors.foreground }]}>Map preview not available on web</Text>
            <Text style={[styles.webMapSubtitle, { color: colors.mutedForeground }]}>
              Use the search bar above to set the exact location, then confirm.
            </Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={mapRegion}
            onPress={(e: MapPressEvent) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setLocation((prev) => ({
                ...prev,
                latitude,
                longitude,
                location_name: prev.location_name?.trim()
                  ? prev.location_name
                  : getFallbackLocationName({ name: prev.location_name, address: prev.complete_address }),
                place_id: undefined,
              }));
              resolveAddressFromCoords(latitude, longitude);
            }}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            rotateEnabled={false}
          >
            {Number.isFinite(location.latitude) && Number.isFinite(location.longitude) && (
              <Marker
                coordinate={{ latitude: Number(location.latitude), longitude: Number(location.longitude) }}
                draggable
                onDragEnd={(e: MarkerDragEvent) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setLocation((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                    place_id: undefined,
                  }));
                  resolveAddressFromCoords(latitude, longitude);
                }}
              />
            )}
          </MapView>
        )}
      </View>

      {!!location.complete_address && (
        <View style={[styles.addressCard, { backgroundColor: isDark ? colors.card : colors.secondary + "30", borderColor: colors.border }]}>
          <MapPin size={15} color={colors.foreground} />
          <Text style={[styles.addressText, { color: colors.foreground }]}>
            {location.complete_address}
          </Text>
        </View>
      )}
      {isResolvingAddress && (
        <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "600", marginTop: 8 }}>
          Resolving address...
        </Text>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          onPress={() => {
            setDraft(location);
            router.back();
          }}
          disabled={!canConfirm}
          style={[
            styles.confirmButton,
            { backgroundColor: colors.primary, opacity: canConfirm ? 1 : 0.45 },
          ]}
        >
          <Text style={[styles.confirmText, { color: colors.primaryForeground }]}>
            Use This Location
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  searchingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  searchResults: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
  },
  searchResultItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchResultTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  searchResultSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
  },
  mapShell: {
    flex: 1,
  },
  map: {
    flex: 1,
    backgroundColor: "transparent",
  },
  webMapFallback: {
    flex: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 20,
    justifyContent: "center",
    gap: 8,
    margin: 16,
  },
  webMapTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  webMapSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  confirmButton: {
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "800",
  },
});
