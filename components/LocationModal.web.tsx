import { MapPin, Search, X } from "lucide-react-native";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../hooks/useThemeStore";
import { LocationSuggestion } from "../hooks/useLocation";
import BottomSheet from "./BottomSheet";

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
  const insets = useSafeAreaInsets();
  const titleInputRef = useRef<TextInput>(null);

  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setShowMap(false);
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 120);

    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!showMap || !searchLocations) return;
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(trimmed);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, searchLocations, showMap]);

  const getFallbackLocationName = (payload: { name?: string; address?: string }) => {
    const preferredName = String(payload.name || "").trim();
    if (preferredName) return preferredName;

    const address = String(payload.address || "").trim();
    if (!address) return "Pinned Location";

    const [firstSegment] = address.split(",");
    return String(firstSegment || address).trim() || "Pinned Location";
  };

  const handleToggleMap = () => {
    setShowMap((prev) => !prev);
  };

  const trimmedTitle = String(formData.location_name || "").trim();
  const hasPinnedLocation = Number.isFinite(formData.latitude) && Number.isFinite(formData.longitude);
  const canSubmit = trimmedTitle.length > 0 || hasPinnedLocation;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {editing ? "Edit Location" : "Add Location"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Keep the title clear and pin the spot only if needed.
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.muted + "55" }]}
          >
            <X size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={140}
          extraHeight={180}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 140 }]}
        >
          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Location Title</Text>
            <TextInput
              ref={titleInputRef}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.card : colors.secondary + "30",
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={formData.location_name}
              onChangeText={(val) => setFormData((prev) => ({ ...prev, location_name: val }))}
              placeholder="Warehouse A, Delhi Yard"
              placeholderTextColor={colors.mutedForeground + "70"}
              returnKeyType="done"
              autoFocus={visible}
            />
          </View>

          <TouchableOpacity
            onPress={handleToggleMap}
            style={[
              styles.mapToggle,
              {
                backgroundColor: showMap ? colors.foreground : colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.mapToggleCopy}>
              <View style={[styles.mapIconWrap, { backgroundColor: showMap ? colors.background : colors.foreground }]}>
                {showMap ? (
                  <X size={14} color={showMap ? colors.foreground : colors.background} />
                ) : (
                  <Search size={14} color={showMap ? colors.foreground : colors.background} />
                )}
              </View>
              <View>
                <Text style={[styles.mapToggleTitle, { color: showMap ? colors.background : colors.foreground }]}>
                  {showMap ? "Hide Map Picker" : "Add Google Location"}
                </Text>
                <Text style={[styles.mapToggleSubtitle, { color: showMap ? colors.background + "CC" : colors.mutedForeground }]}>
                  Search to set the exact point.
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {showMap && (
            <View style={styles.mapBlock}>
              {!!searchLocations && (
                <>
                  <View style={[styles.mapSearchWrap, { borderColor: colors.border, backgroundColor: isDark ? colors.card : colors.secondary + "30" }]}>
                    <Search size={16} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.mapSearchInput, { color: colors.foreground }]}
                      placeholder="Search on Google Maps"
                      placeholderTextColor={colors.mutedForeground + "70"}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      returnKeyType="search"
                    />
                    {isSearching && <Text style={[styles.searchingText, { color: colors.mutedForeground }]}>...</Text>}
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
                            setFormData((prev) => ({
                              ...prev,
                              location_name: item.location_name || prev.location_name,
                              complete_address: item.complete_address || item.location_name || prev.complete_address,
                              place_id: item.place_id,
                              latitude: item.latitude ?? prev.latitude,
                              longitude: item.longitude ?? prev.longitude,
                            }));
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
                </>
              )}

              <View style={[styles.webMapFallback, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.webMapTitle, { color: colors.foreground }]}>Map preview not available on web</Text>
                <Text style={[styles.webMapSubtitle, { color: colors.mutedForeground }]}>
                  Use the search bar above to set the exact location, then save.
                </Text>
              </View>

              {!!formData.complete_address && (
                <View style={[styles.addressCard, { backgroundColor: isDark ? colors.card : colors.secondary + "30", borderColor: colors.border }]}>
                  <MapPin size={15} color={colors.foreground} />
                  <Text style={[styles.addressText, { color: colors.foreground }]}>
                    {formData.complete_address}
                  </Text>
                </View>
              )}
            </View>
          )}

        </KeyboardAwareScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            onPress={onSubmit}
            disabled={!canSubmit}
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.primary,
                opacity: canSubmit ? 1 : 0.45,
              },
            ]}
          >
            <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
              {editing ? "Update Location" : "Save Location"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerCopy: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "600",
  },
  mapToggle: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  mapToggleCopy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mapIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  mapToggleTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  mapToggleSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  mapBlock: {
    gap: 10,
  },
  mapSearchWrap: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  searchingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  searchResults: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
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
  webMapFallback: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 20,
    justifyContent: "center",
    gap: 8,
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
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  submitButton: {
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "800",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});
