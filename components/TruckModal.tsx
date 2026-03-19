import { Search, CheckCircle2 } from "lucide-react-native";
import { useState } from "react";
import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../hooks/useThemeStore";
import { useKYC } from "../hooks/useKYC";
import BottomSheet from "./BottomSheet";

export type TruckFormData = {
    registration_number: string;
    chassis_number: string;
    engine_number: string;
    registered_owner_name: string;
    vehicle_class?: string;
    fuel_norms?: string;
    registration_date?: string;
    container_dimension: string;
    loading_capacity: string;
    rc_details?: Record<string, any>;
};

type TruckInputFieldKey =
    | "registration_number"
    | "registered_owner_name"
    | "container_dimension"
    | "loading_capacity"
    | "chassis_number"
    | "engine_number";

type Props = {
    visible: boolean;
    editing: boolean;
    formData: TruckFormData;
    setFormData: (data: TruckFormData | ((prev: TruckFormData) => TruckFormData)) => void;
    onSubmit: () => void;
    onClose: () => void;
};

export default function TruckFormModal({
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

    const { verifyRC, loading: isFetching } = useKYC();
    const [isVerified, setIsVerified] = useState(false);
    const [showAllFields, setShowAllFields] = useState(editing); // Show all fields if editing
    const [showFetchedSummary, setShowFetchedSummary] = useState(false);

    const toIsoDate = (input?: string) => {
        if (!input) return undefined;
        const trimmed = input.trim();

        const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dmyMatch) {
            const [, dd, mm, yyyy] = dmyMatch;
            return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
        }

        const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
            const yyyy = parsed.getFullYear();
            const mm = String(parsed.getMonth() + 1).padStart(2, "0");
            const dd = String(parsed.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
        }

        return undefined;
    };

    const handleFetchRC = async () => {
        if (!formData.registration_number) {
            Alert.alert("Error", "Please enter a registration number first.");
            return;
        }

        try {
            const result = await verifyRC(formData.registration_number);
            if (result.verified && result.data) {
                const rc = result.data;
                setFormData((prev: TruckFormData) => ({
                    ...prev,
                    registered_owner_name: rc.owner || prev.registered_owner_name,
                    chassis_number: rc.chassis || prev.chassis_number,
                    engine_number: rc.engine || prev.engine_number,
                    vehicle_class: rc.class || prev.vehicle_class,
                    fuel_norms: rc.norms_type || prev.fuel_norms,
                    registration_date: toIsoDate(rc.reg_date) || toIsoDate(rc.status_as_on) || prev.registration_date,
                    rc_details: rc,
                }));
                setIsVerified(true);
                setShowAllFields(false);
                setShowFetchedSummary(true);
                Alert.alert("Success", "Vehicle details fetched successfully!");
            } else {
                Alert.alert("Not Found", "Details not found for this vehicle. Please enter manually.");
                setShowAllFields(true); // Allow manual entry if not found
                setShowFetchedSummary(false);
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Failed to fetch vehicle details.");
            setShowAllFields(true); // Allow manual entry on error
            setShowFetchedSummary(false);
        }
    };

    const closeModal = () => {
        setIsVerified(false);
        setShowAllFields(editing); // Reset to initial state
        setShowFetchedSummary(false);
        onClose();
    };

    const allFields: { label: string; key: TruckInputFieldKey; placeholder: string; required?: boolean; numeric?: boolean }[] = [
        { label: "Registration Number", key: "registration_number", placeholder: "e.g. MH 12 AB 1234", required: true },
        { label: "Container Dimension (Optional)", key: "container_dimension", placeholder: "e.g. 20ft / 32ft" },
    ];

    const fieldsToShow = editing
        ? [allFields[1]]
        : showAllFields
        ? allFields
        : showFetchedSummary
            ? [allFields[0], allFields[1]]
            : [allFields[0]];

    return (
        <BottomSheet
            visible={visible}
            onClose={closeModal}
            title={editing ? "Update Vehicle" : "Add New Truck"}
            subtitle={showAllFields ? "Vehicle Configuration" : showFetchedSummary ? "Verified Details" : "Enter Registration Number"}
        >
            <KeyboardAwareScrollView
                        enableOnAndroid
                        extraScrollHeight={120}
                        enableAutomaticScroll={false}
                        scrollEnabled={false}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
                    >
                        <View className="gap-5 pb-10">
                            {fieldsToShow.map((field) => (
                                <View key={field.key}>
                                    <Text style={{ color: colors.mutedForeground }} className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1">
                                        {field.label} {field.required && <Text style={{ color: colors.destructive }}>*</Text>}
                                    </Text>
                                    <View className="flex-row items-center gap-2">
                                        <View className="flex-1">
                                            <TextInput
                                                className="rounded-2xl p-4 text-base font-bold"
                                                style={{
                                                    backgroundColor: isDark ? colors.card : colors.secondary + '40',
                                                    color: colors.foreground,
                                                    borderWidth: 1,
                                                    borderColor: (field.key === "registration_number" && isVerified) ? colors.success : (isDark ? colors.border : colors.border + '30')
                                                }}
                                                value={formData[field.key]}
                                                onChangeText={(val) => {
                                                    if (field.key === "registration_number") {
                                                        setIsVerified(false);
                                                        setShowFetchedSummary(false);
                                                    }
                                                    setFormData({
                                                        ...formData,
                                                        [field.key]: val,
                                                        ...(field.key === "registration_number" ? { rc_details: undefined } : {}),
                                                    });
                                                }}
                                                placeholder={field.placeholder}
                                                placeholderTextColor={colors.mutedForeground + '80'}
                                                keyboardType={field.numeric ? "numeric" : "default"}
                                                autoCapitalize={field.key === "registration_number" ? "characters" : "words"}
                                            />
                                        </View>
                                        {field.key === "registration_number" && !editing && !showAllFields && !showFetchedSummary && (
                                            <TouchableOpacity
                                                onPress={handleFetchRC}
                                                disabled={isFetching}
                                                style={{
                                                    backgroundColor: isVerified ? colors.successSoft : colors.primary,
                                                    width: 54,
                                                    height: 54,
                                                    borderRadius: 16,
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {isFetching ? (
                                                    <ActivityIndicator color="white" size="small" />
                                                ) : isVerified ? (
                                                    <CheckCircle2 color={colors.success} size={24} />
                                                ) : (
                                                    <Search color="white" size={24} />
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}

                            {!showAllFields && !showFetchedSummary && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowFetchedSummary(false);
                                        setShowAllFields(true);
                                    }}
                                    style={{ marginTop: 8 }}
                                >
                                    <Text style={{ color: colors.destructive, textAlign: 'center', fontSize: 12, fontWeight: '700' }}>
                                        Enter details manually
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {showFetchedSummary && !editing && (
                                <Text style={{ color: colors.mutedForeground, textAlign: 'center', fontSize: 12 }}>
                                    Only owner name is shown now. You can view full vehicle details later in truck profile.
                                </Text>
                            )}

                            {/* Actions */}
                            {(showAllFields || showFetchedSummary) && (
                                <TouchableOpacity
                                    onPress={onSubmit}
                                    style={{ backgroundColor: colors.primary }}
                                    className="py-5 rounded-[22px] mt-4 shadow-lg shadow-green-500/20"
                                >
                                    <Text style={{ color: colors.primaryForeground }} className="text-center font-black text-lg">
                                        {editing ? "Apply Changes" : "Save Truck"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
            </KeyboardAwareScrollView>
        </BottomSheet>
    );
}
