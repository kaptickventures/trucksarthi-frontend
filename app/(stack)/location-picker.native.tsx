import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MapPin, Search } from "lucide-react-native";
import * as ExpoLocation from "expo-location";

import API from "../api/axiosInstance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useLocationPicker } from "../../context/LocationPickerContext";

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

let MapView: any;
let PROVIDER_GOOGLE: any;
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require("react-native-maps");
  MapView = maps.default;
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
  const regionChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRegionRef = useRef<Region | null>(null);
  const NEW_DELHI = { latitude: 28.6139, longitude: 77.2090 };

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
      if (regionChangeTimerRef.current) clearTimeout(regionChangeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (Number.isFinite(initialLocation.latitude) && Number.isFinite(initialLocation.longitude)) return;
    let cancelled = false;
    const initLocation = async () => {
      if (Platform.OS === "web") {
        if (!cancelled) {
          setLocation((prev) => ({
            ...prev,
            latitude: NEW_DELHI.latitude,
            longitude: NEW_DELHI.longitude,
          }));
        }
        return;
      }

      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const position = await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.Balanced,
          });
          if (cancelled) return;
          const { latitude, longitude } = position.coords;
          setLocation((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            },
            350
          );
          resolveAddressFromCoords(latitude, longitude);
          return;
        }
      } catch {
        // fall back to New Delhi
      }

      if (cancelled) return;
      setLocation((prev) => ({
        ...prev,
        latitude: NEW_DELHI.latitude,
        longitude: NEW_DELHI.longitude,
      }));
      mapRef.current?.animateToRegion(
        {
          latitude: NEW_DELHI.latitude,
          longitude: NEW_DELHI.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        350
      );
    };

    initLocation();
    return () => {
      cancelled = true;
    };
  }, [initialLocation.latitude, initialLocation.longitude, NEW_DELHI.latitude, NEW_DELHI.longitude]);

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
        }));
      }
    } catch {
      // ignore reverse geocode failures
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const mapRegion = useMemo(() => {
    const latitude = typeof location.latitude === "number" ? location.latitude : NEW_DELHI.latitude;
    const longitude = typeof location.longitude === "number" ? location.longitude : NEW_DELHI.longitude;
    const hasExact = typeof location.latitude === "number" && typeof location.longitude === "number";
    return {
      latitude,
      longitude,
      latitudeDelta: hasExact ? 0.03 : 0.08,
      longitudeDelta: hasExact ? 0.03 : 0.08,
    };
  }, [location.latitude, location.longitude, NEW_DELHI.latitude, NEW_DELHI.longitude]);

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

        <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.input }]}>
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
            onRegionChangeComplete={(region: Region) => {
              latestRegionRef.current = region;
              const { latitude, longitude } = region;
              setLocation((prev) => ({
                ...prev,
                latitude,
                longitude,
                place_id: undefined,
              }));

              if (regionChangeTimerRef.current) clearTimeout(regionChangeTimerRef.current);
              regionChangeTimerRef.current = setTimeout(() => {
                resolveAddressFromCoords(latitude, longitude);
              }, 350);
            }}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            rotateEnabled={false}
          />
        )}
        {!isWeb && (
          <View style={[styles.centerPinWrap, { pointerEvents: "none" }]}>
            <View style={styles.centerPin}>
              <MapPin size={30} color={colors.primary} />
            </View>
          </View>
        )}
      </View>

      {!!location.complete_address && (
        <View style={[styles.addressCard, { backgroundColor: colors.input, borderColor: colors.border }]}>
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
            const latest = latestRegionRef.current;
            const payload = {
              ...location,
              latitude: latest?.latitude ?? location.latitude,
              longitude: latest?.longitude ?? location.longitude,
            };
            setDraft(payload);
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
  centerPinWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  centerPin: {
    transform: [{ translateY: -18 }],
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
