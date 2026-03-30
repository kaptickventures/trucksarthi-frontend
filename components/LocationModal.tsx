import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useThemeStore } from "../hooks/useThemeStore";
import BottomSheet from "./BottomSheet";
import { reverseGeocode } from "../lib/reverseGeocode";

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
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const trimmedTitle = String(formData.location_name || "").trim();
  const hasPickedCoordinates = Number.isFinite(formData.latitude) && Number.isFinite(formData.longitude);
  const addressRaw = String(formData.complete_address || "").trim();
  const addressLooksLikeCoords = Boolean(addressRaw.match(/^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/));
  const canSubmit = trimmedTitle.length > 0;

  useEffect(() => {
    if (!visible) return;
    if (addressRaw.length > 0 && !addressLooksLikeCoords) return;
    if (!hasPickedCoordinates) return;

    let cancelled = false;
    const run = async () => {
      setResolvingAddress(true);
      const res = await reverseGeocode(Number(formData.latitude), Number(formData.longitude));
      if (cancelled) return;
      if (res?.formattedAddress) {
        setFormData((prev) => ({
          ...prev,
          complete_address: prev.complete_address || res.formattedAddress,
          place_id: prev.place_id || res.placeId,
        }));
      }
      setResolvingAddress(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [visible, addressRaw, addressLooksLikeCoords, formData.latitude, formData.longitude, hasPickedCoordinates, setFormData]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={editing ? "Edit Location" : "Add Location"}
      subtitle="Location Details"
      maxHeight="80%"
      expandedHeight="92%"
      disableContentPanningGesture
    >
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={220}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        enableAutomaticScroll
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 100) }}
      >
        <View className="gap-6 pb-12">
          <View>
            <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
              Location Title <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              className="rounded-2xl p-4 text-base font-bold"
              style={{
                backgroundColor: colors.input,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              value={formData.location_name}
              onChangeText={(val) => setFormData((prev) => ({ ...prev, location_name: val }))}
              placeholder="e.g. Warehouse A, Delhi Yard"
              placeholderTextColor={colors.mutedForeground + "80"}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              onClose();
              setTimeout(() => {
                router.push({
                  pathname: "/(stack)/location-picker",
                  params: {
                    name: formData.location_name || "",
                    address: formData.complete_address || "",
                    placeId: formData.place_id || "",
                    lat: Number.isFinite(formData.latitude) ? String(formData.latitude) : "",
                    lng: Number.isFinite(formData.longitude) ? String(formData.longitude) : "",
                  },
                } as any);
              }, 120);
            }}
          >
            <Text style={{ color: colors.success }} className="text-sm font-bold">
              Add Google Location
            </Text>
          </TouchableOpacity>

          {!!formData.complete_address && !addressLooksLikeCoords && (
            <Text style={{ color: colors.mutedForeground }} className="text-xs font-semibold">
              Address: {formData.complete_address}
            </Text>
          )}

          {hasPickedCoordinates && (!formData.complete_address || addressLooksLikeCoords) ? (
            <Text style={{ color: colors.mutedForeground }} className="text-xs font-semibold">
              {resolvingAddress ? "Resolving location..." : "Location selected"}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={onSubmit}
            disabled={!canSubmit}
            style={{ backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.45 }}
            className="py-5 rounded-[22px] mt-2"
          >
            <Text style={{ color: colors.primaryForeground }} className="text-center font-black text-lg">
              {editing ? "Update Location" : "Save Location"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
}
