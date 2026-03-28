import React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useThemeStore } from "../hooks/useThemeStore";
import BottomSheet from "./BottomSheet";

export type BiltyFormData = {
  consignor: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    contact_person?: string;
  };
  consignee: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    contact_person?: string;
  };
  goods_description?: string;
  total_packages?: number;
  total_weight?: number;
  goods_value?: number;
  charges?: number;
  notes?: string;
};

type Props = {
  visible: boolean;
  editing: boolean;
  formData: BiltyFormData;
  setFormData: (data: BiltyFormData | ((prev: BiltyFormData) => BiltyFormData)) => void;
  onSubmit: () => void;
  onClose: () => void;
  loading?: boolean;
};

export default function BiltyModal({
  visible,
  editing,
  formData,
  setFormData,
  onSubmit,
  onClose,
  loading = false,
}: Props) {
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

  const handleFormSubmit = () => {
    if (!String(formData.consignor?.name || "").trim()) {
      Alert.alert("Missing Fields", "Please enter Consignor name.");
      return;
    }
    if (!String(formData.consignee?.name || "").trim()) {
      Alert.alert("Missing Fields", "Please enter Consignee name.");
      return;
    }
    onSubmit();
  };

  const renderPartyField = (
    partyType: "consignor" | "consignee",
    fieldName: keyof typeof formData.consignor,
    label: string,
    placeholder: string,
    keyboardType: "default" | "phone-pad" | "email-address" | "numeric" = "default"
  ) => {
    const value = String(formData[partyType]?.[fieldName] || "");
    return (
      <View style={{ marginBottom: 14 }}>
        <Text
          style={{
            color: colors.mutedForeground,
            fontWeight: "800",
            fontSize: 11,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground + "80"}
          value={value}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              [partyType]: {
                ...prev[partyType],
                [fieldName]: text,
              },
            }))
          }
          keyboardType={keyboardType}
          style={{
            paddingHorizontal: 14,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: isDark ? colors.card : colors.secondary + "10",
            color: colors.foreground,
            fontWeight: "600",
          }}
          editable={!loading}
        />
      </View>
    );
  };

  const renderGoodsField = (
    fieldName: keyof Omit<BiltyFormData, "consignor" | "consignee">,
    label: string,
    placeholder: string,
    keyboardType: "default" | "phone-pad" | "email-address" | "numeric" = "default"
  ) => {
    const value = String(formData[fieldName] || "");
    return (
      <View style={{ marginBottom: 14 }}>
        <Text
          style={{
            color: colors.mutedForeground,
            fontWeight: "800",
            fontSize: 11,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground + "80"}
          value={value}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              [fieldName]: keyboardType === "numeric" ? (text ? parseFloat(text) : undefined) : text,
            }))
          }
          keyboardType={keyboardType}
          style={{
            paddingHorizontal: 14,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: isDark ? colors.card : colors.secondary + "10",
            color: colors.foreground,
            fontWeight: "600",
          }}
          editable={!loading}
        />
      </View>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={editing ? "Edit Bilty" : "Generate Bilty"}
      subtitle="Enter consignor and consignee details"
      maxHeight="85%"
      expandedHeight="95%"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 16, paddingHorizontal: 4 }}>
          {/* CONSIGNOR SECTION */}
          <View>
            <Text
              style={{
                color: colors.primary,
                fontWeight: "900",
                fontSize: 14,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              📤 Consignor Details
            </Text>
            {renderPartyField("consignor", "name", "Name", "Enter consignor name")}
            {renderPartyField("consignor", "contact_person", "Contact Person", "Enter contact person name")}
            {renderPartyField("consignor", "phone", "Phone", "Enter phone number", "phone-pad")}
            {renderPartyField("consignor", "email", "Email", "Enter email address", "email-address")}
            {renderPartyField("consignor", "address", "Address", "Enter complete address")}
            {renderPartyField("consignor", "gstin", "GSTIN", "Enter GSTIN (optional)")}
          </View>

          {/* CONSIGNEE SECTION */}
          <View>
            <Text
              style={{
                color: colors.primary,
                fontWeight: "900",
                fontSize: 14,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              📥 Consignee Details
            </Text>
            {renderPartyField("consignee", "name", "Name", "Enter consignee name")}
            {renderPartyField("consignee", "contact_person", "Contact Person", "Enter contact person name")}
            {renderPartyField("consignee", "phone", "Phone", "Enter phone number", "phone-pad")}
            {renderPartyField("consignee", "email", "Email", "Enter email address", "email-address")}
            {renderPartyField("consignee", "address", "Address", "Enter complete address")}
            {renderPartyField("consignee", "gstin", "GSTIN", "Enter GSTIN (optional)")}
          </View>

          {/* GOODS SECTION */}
          <View>
            <Text
              style={{
                color: colors.primary,
                fontWeight: "900",
                fontSize: 14,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              📦 Goods Details
            </Text>
            {renderGoodsField("goods_description", "Description", "What is being transported?")}
            {renderGoodsField("total_packages", "Total Packages", "Number of packages", "numeric")}
            {renderGoodsField("total_weight", "Total Weight (kg)", "Total weight", "numeric")}
            {renderGoodsField("goods_value", "Goods Value (₹)", "Estimated value", "numeric")}
            {renderGoodsField("charges", "Charges (₹)", "Transportation charges", "numeric")}
            {renderGoodsField("notes", "Additional Notes", "Add any notes (optional)")}
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            onPress={handleFormSubmit}
            disabled={loading}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: "center",
              opacity: loading ? 0.75 : 1,
              marginTop: 12,
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            {loading && (
              <ActivityIndicator
                size="small"
                color={colors.primaryForeground}
                style={{ marginRight: 8 }}
              />
            )}
            <Text
              style={{
                color: colors.primaryForeground,
                fontWeight: "900",
                fontSize: 15,
              }}
            >
              {loading ? "Generating..." : editing ? "Update Bilty" : "Generate Bilty"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
