import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import BottomSheet from "../BottomSheet";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";
import { formatDate } from "../../lib/utils";

const TAX_TYPES = [
  { label: "IGST", value: "igst" },
  { label: "CGST + SGST", value: "cgst_sgst" },
] as const;
const TAX_PERCENTAGES = [0, 5, 18] as const;

interface InvoiceConfigModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTripsCount: number;
  invoiceTaxPercentage: 0 | 5 | 18;
  onTaxPercentageChange: (percent: 0 | 5 | 18) => void;
  invoiceTaxType: "igst" | "cgst_sgst";
  onTaxTypeChange: (type: "igst" | "cgst_sgst") => void;
  invoiceDueDate: Date;
  onInvoiceDueDateChange: (date: Date) => void;
  showInvoiceDueDatePicker: boolean;
  onShowInvoiceDueDatePickerChange: (show: boolean) => void;
  onSubmit: () => void;
  isDark: boolean;
}

export default function InvoiceConfigModal({
  visible,
  onClose,
  selectedTripsCount,
  invoiceTaxPercentage,
  onTaxPercentageChange,
  invoiceTaxType,
  onTaxTypeChange,
  invoiceDueDate,
  onInvoiceDueDateChange,
  showInvoiceDueDatePicker,
  onShowInvoiceDueDatePickerChange,
  onSubmit,
  isDark,
}: InvoiceConfigModalProps) {
  const { colors } = useThemeStore();
  const { t } = useTranslation();

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      onInvoiceDueDateChange(date);
    }
    onShowInvoiceDueDatePickerChange(false);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Generate Invoice"
      subtitle={`${selectedTripsCount} trip(s) selected`}
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
        <View className="mb-6">
          <Text
            className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
            style={{ color: colors.mutedForeground }}
          >
            Due Date
          </Text>
          <TouchableOpacity
            onPress={() => onShowInvoiceDueDatePickerChange(true)}
            className="flex-row items-center rounded-2xl px-4 py-4"
            style={{
              backgroundColor: colors.input,
              borderWidth: 1,
              borderColor: colors.border + "30",
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <Text
              className="text-base font-bold"
              style={{ color: colors.foreground }}
            >
              {formatDate(invoiceDueDate)}
            </Text>
          </TouchableOpacity>
          {showInvoiceDueDatePicker && (
            <DateTimePicker
              value={invoiceDueDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        <View className="mb-6">
          <Text
            className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
            style={{ color: colors.mutedForeground }}
          >
            Tax Percentage
          </Text>
          <View className="flex-row gap-2">
            {TAX_PERCENTAGES.map((percent) => {
              const selected = invoiceTaxPercentage === percent;
              return (
                <TouchableOpacity
                  key={`tax-percent-${percent}`}
                  onPress={() => onTaxPercentageChange(percent)}
                  className="px-4 py-2 rounded-full"
                  style={{
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border + "40",
                    backgroundColor: selected
                      ? colors.primary
                      : isDark
                        ? colors.card
                        : colors.secondary + "40",
                  }}
                >
                  <Text
                    style={{
                      color: selected ? colors.primaryForeground : colors.foreground,
                      fontWeight: "800",
                    }}
                  >
                    {percent}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mb-6">
          <Text
            className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
            style={{ color: colors.mutedForeground }}
          >
            Tax Type
          </Text>
          <View
            className="flex-row gap-2"
            style={{ opacity: invoiceTaxPercentage === 0 ? 0.6 : 1 }}
          >
            {TAX_TYPES.map((taxType) => {
              const selected = invoiceTaxType === taxType.value;
              const disabled = invoiceTaxPercentage === 0;
              return (
                <TouchableOpacity
                  key={`tax-type-${taxType.value}`}
                  onPress={() => !disabled && onTaxTypeChange(taxType.value)}
                  disabled={disabled}
                  className="px-4 py-2 rounded-full"
                  style={{
                    borderWidth: 1,
                    borderColor:
                      selected ? colors.primary : colors.border + "40",
                    backgroundColor: disabled
                      ? colors.muted
                      : selected
                        ? colors.primary
                        : isDark
                          ? colors.card
                          : colors.secondary + "40",
                  }}
                >
                  <Text
                    style={{
                      color:
                        selected && !disabled
                          ? colors.primaryForeground
                          : colors.foreground,
                      fontWeight: "800",
                    }}
                  >
                    {taxType.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {invoiceTaxPercentage === 0 && (
            <Text
              className="text-xs mt-2 ml-1"
              style={{ color: colors.mutedForeground }}
            >
              Not required for 0%
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={onSubmit}
          style={{ backgroundColor: colors.primary }}
          className="py-4 rounded-[18px]"
        >
          <Text
            style={{
              color: colors.primaryForeground,
              fontWeight: "900",
              fontSize: 16,
            }}
            className="text-center"
          >
            CREATE INVOICE
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
}
