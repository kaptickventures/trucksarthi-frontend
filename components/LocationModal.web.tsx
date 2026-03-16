import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
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
import { useLocationPicker } from "../context/LocationPickerContext";
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
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, clearDraft } = useLocationPicker();
  const titleInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible || !draft) return;
    setFormData((prev) => ({
      ...prev,
      ...draft,
      location_name: String(draft.location_name || "").trim() ? draft.location_name : prev.location_name,
    }));
    clearDraft();
  }, [draft, visible, setFormData, clearDraft]);

  const trimmedTitle = String(formData.location_name || "").trim();
  const hasPinnedLocation = Number.isFinite(formData.latitude) && Number.isFinite(formData.longitude);
  const canSubmit = trimmedTitle.length > 0 || hasPinnedLocation;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={editing ? "Edit Location" : "Add Location"}
      subtitle="Location Details"
    >
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        enableAutomaticScroll={false}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 100) }}
      >
        <View className="gap-6 pb-12">
          <View>
            <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
              Location Title <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              ref={titleInputRef}
              className="rounded-2xl p-4 text-base font-bold"
              style={{
                backgroundColor: isDark ? colors.card : colors.secondary + "40",
                color: colors.foreground,
                borderWidth: 1,
                borderColor: isDark ? colors.border : colors.border + "30",
              }}
              value={formData.location_name}
              onChangeText={(val) => setFormData((prev) => ({ ...prev, location_name: val }))}
              placeholder="e.g. Warehouse A, Delhi Yard"
              placeholderTextColor={colors.mutedForeground + "80"}
            />
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(stack)/location-picker",
                params: {
                  name: formData.location_name || "",
                  address: formData.complete_address || "",
                  placeId: formData.place_id || "",
                  lat: Number.isFinite(formData.latitude) ? String(formData.latitude) : "",
                  lng: Number.isFinite(formData.longitude) ? String(formData.longitude) : "",
                },
              } as any)
            }
          >
            <Text style={{ color: colors.success }} className="text-sm font-bold">
              Add Google Location
            </Text>
          </TouchableOpacity>

          {!!formData.complete_address && (
            <Text style={{ color: colors.mutedForeground }} className="text-xs font-semibold">
              Address: {formData.complete_address}
            </Text>
          )}

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
