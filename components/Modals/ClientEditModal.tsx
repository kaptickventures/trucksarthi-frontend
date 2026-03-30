import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import BottomSheet from "../BottomSheet";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";
import { normalizeGstinNumber, normalizePanNumber } from "../../lib/utils";

export interface ClientEditFormData {
  client_name: string;
  contact_person_name: string;
  contact_number: string;
  alternate_contact_number: string;
  email_address: string;
  office_address: string;
  gstin: string;
  pan_number: string;
  gstin_details?: any;
}

interface ClientEditModalProps {
  visible: boolean;
  onClose: () => void;
  formData: ClientEditFormData;
  onFormDataChange: (data: ClientEditFormData) => void;
  onSubmit: () => void;
  isDark: boolean;
  verifyingGstin?: boolean;
  onVerifyGstin?: () => void;
}

export default function ClientEditModal({
  visible,
  onClose,
  formData,
  onFormDataChange,
  onSubmit,
  isDark,
  verifyingGstin = false,
  onVerifyGstin,
}: ClientEditModalProps) {
  const { colors } = useThemeStore();
  const { t } = useTranslation();

  const hasGstinInEdit = formData.gstin && formData.gstin.length > 0;

  const updateFormData = (updates: Partial<ClientEditFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("editClient")}
      subtitle="Update business profile"
      maxHeight="90%"
    >
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={140}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="gap-5">
          <View>
            <Text
              className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
              style={{ color: colors.mutedForeground }}
            >
              {t("clientName")} *
            </Text>
            <TextInput
              className="p-4 rounded-2xl font-bold"
              style={{
                backgroundColor: colors.input,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border + "30",
              }}
              value={formData.client_name}
              onChangeText={(value) => updateFormData({ client_name: value })}
              placeholder="e.g. Acme Corp"
              placeholderTextColor={colors.mutedForeground + "60"}
            />
          </View>

          <View>
            <Text
              className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
              style={{ color: colors.mutedForeground }}
            >
              {t("contactPerson")} *
            </Text>
            <TextInput
              className="p-4 rounded-2xl font-bold"
              style={{
                backgroundColor: colors.input,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border + "30",
              }}
              value={formData.contact_person_name}
              onChangeText={(value) =>
                updateFormData({ contact_person_name: value })
              }
              placeholder="Full Name"
              placeholderTextColor={colors.mutedForeground + "60"}
            />
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text
                className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
                style={{ color: colors.mutedForeground }}
              >
                {t("clientContact")} *
              </Text>
              <TextInput
                className="p-4 rounded-2xl font-bold"
                style={{
                  backgroundColor: colors.input,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border + "30",
                }}
                value={formData.contact_number}
                onChangeText={(value) =>
                  updateFormData({ contact_number: value })
                }
                keyboardType="phone-pad"
                placeholderTextColor={colors.mutedForeground + "60"}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
                style={{ color: colors.mutedForeground }}
              >
                {t("email")} *
              </Text>
              <TextInput
                className="p-4 rounded-2xl font-bold"
                style={{
                  backgroundColor: colors.input,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border + "30",
                }}
                value={formData.email_address}
                onChangeText={(value) =>
                  updateFormData({ email_address: value })
                }
                keyboardType="email-address"
                placeholderTextColor={colors.mutedForeground + "60"}
              />
            </View>
          </View>

          <View>
            <Text
              className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
              style={{ color: colors.mutedForeground }}
            >
              {hasGstinInEdit ? "GSTIN Number" : "PAN Number"}
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <TextInput
                  className="p-4 rounded-2xl font-bold"
                  style={{
                    backgroundColor: colors.input,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border + "30",
                  }}
                  value={hasGstinInEdit ? formData.gstin : String(formData.pan_number || "")}
                  onChangeText={(value) =>
                    hasGstinInEdit
                      ? updateFormData({
                          gstin: normalizeGstinNumber(value),
                        })
                      : updateFormData({
                          pan_number: normalizePanNumber(value),
                        })
                  }
                  placeholder={
                    hasGstinInEdit ? "e.g. 29ABCDE1234F1Z5" : "e.g. ABCDE1234F"
                  }
                  placeholderTextColor={colors.mutedForeground + "60"}
                  autoCapitalize="characters"
                  maxLength={hasGstinInEdit ? 15 : 10}
                />
              </View>
              {hasGstinInEdit ? (
                <TouchableOpacity
                  onPress={onVerifyGstin}
                  disabled={verifyingGstin || !formData.gstin}
                  style={{
                    backgroundColor: formData.gstin
                      ? colors.primary
                      : colors.muted,
                  }}
                  className="w-20 rounded-2xl items-center justify-center border border-border/50"
                >
                  <Text
                    style={{
                      color: formData.gstin
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                    }}
                    className="font-bold text-[10px] uppercase tracking-widest text-center px-1"
                  >
                    {verifyingGstin ? "Verifying..." : "Verify\n& Fill"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View>
            <Text
              className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
              style={{ color: colors.mutedForeground }}
            >
              {t("officeAddress")} *
            </Text>
            <TextInput
              className="p-4 rounded-2xl font-bold"
              style={{
                backgroundColor: colors.input,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border + "30",
              }}
              value={formData.office_address}
              onChangeText={(value) =>
                updateFormData({ office_address: value })
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={colors.mutedForeground + "60"}
              placeholder="Address..."
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={onSubmit}
              className="py-5 rounded-[22px] shadow-lg shadow-green-500/20"
              style={{ backgroundColor: colors.primary }}
            >
              <Text
                style={{
                  color: colors.primaryForeground,
                  fontWeight: "900",
                  fontSize: 18,
                }}
                className="text-center font-black"
              >
                {t("saveUpdates").toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
}
