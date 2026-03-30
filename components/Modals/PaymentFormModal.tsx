import { Banknote, Calendar } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import BottomSheet from "../BottomSheet";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useTranslation } from "../../context/LanguageContext";
import { formatDate } from "../../lib/utils";

const PAYMENT_MODES = ["CASH", "BANK"] as const;

interface PaymentFormModalProps {
  visible: boolean;
  onClose: () => void;
  clientName?: string;
  paymentAmount: string;
  onPaymentAmountChange: (value: string) => void;
  paymentRemarks: string;
  onPaymentRemarksChange: (value: string) => void;
  paymentMode: "CASH" | "BANK";
  onPaymentModeChange: (mode: "CASH" | "BANK") => void;
  paymentDate: Date;
  onPaymentDateChange: (date: Date) => void;
  showDatePicker: boolean;
  onShowDatePickerChange: (show: boolean) => void;
  onSubmit: () => void;
  isDark: boolean;
}

export default function PaymentFormModal({
  visible,
  onClose,
  clientName,
  paymentAmount,
  onPaymentAmountChange,
  paymentRemarks,
  onPaymentRemarksChange,
  paymentMode,
  onPaymentModeChange,
  paymentDate,
  onPaymentDateChange,
  showDatePicker,
  onShowDatePickerChange,
  onSubmit,
  isDark,
}: PaymentFormModalProps) {
  const { colors } = useThemeStore();
  const { t } = useTranslation();

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      onPaymentDateChange(date);
    }
    onShowDatePickerChange(false);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add Payment"
      subtitle={clientName || "Client"}
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
        {/* DATE PICKER */}
        <View className="mb-6">
          <Text
            className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
            style={{ color: colors.mutedForeground }}
          >
            Date
          </Text>
          <TouchableOpacity
            onPress={() => onShowDatePickerChange(true)}
            className="flex-row items-center rounded-2xl px-4 py-4"
            style={{
              backgroundColor: colors.input,
              borderWidth: 1,
              borderColor: colors.border + "30",
            }}
          >
            <Calendar size={20} color={colors.primary} style={{ marginRight: 12 }} />
            <Text
              className="text-base font-bold"
              style={{ color: colors.foreground }}
            >
              {formatDate(paymentDate)}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={paymentDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* AMOUNT */}
        <View className="mb-6">
          <Text
            className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
            style={{ color: colors.mutedForeground }}
          >
            Amount
          </Text>
          <View
            className="flex-row items-center rounded-2xl px-5 py-4"
            style={{
              backgroundColor: colors.input,
              borderWidth: 1,
              borderColor: colors.border + "30",
            }}
          >
            <Banknote size={24} color={colors.success} />
            <TextInput
              placeholder="0"
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={onPaymentAmountChange}
              className="flex-1 ml-3 text-2xl font-black"
              style={{
                color: colors.foreground,
                padding: 0,
              }}
              placeholderTextColor={colors.mutedForeground + "60"}
            />
          </View>
        </View>

        {/* REMARKS */}
        <View className="mb-6">
          <Text
            className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
            style={{ color: colors.mutedForeground }}
          >
            Remarks *
          </Text>
          <TextInput
            placeholder="Payment details / Settlement notes"
            value={paymentRemarks}
            onChangeText={onPaymentRemarksChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="text-base font-bold rounded-2xl p-4"
            style={{
              backgroundColor: colors.input,
              borderWidth: 1,
              borderColor: colors.border + "30",
              color: colors.foreground,
              minHeight: 100,
            }}
            placeholderTextColor={colors.mutedForeground + "60"}
          />
        </View>

        <View className="mb-8">
          <Text
            className="text-[11px] font-black uppercase tracking-widest mb-2.5 ml-1"
            style={{ color: colors.mutedForeground }}
          >
            Payment Mode
          </Text>
          <View className="flex-row gap-2">
            {PAYMENT_MODES.map((mode) => {
              const selected = paymentMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => onPaymentModeChange(mode)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 20,
                    borderWidth: 1,
                    alignItems: "center",
                    backgroundColor: selected
                      ? colors.primary
                      : isDark
                        ? colors.card
                        : colors.secondary + "40",
                    borderColor: selected
                      ? colors.primary
                      : colors.border + "30",
                  }}
                >
                  <Text
                    style={{
                      color: selected
                        ? colors.primaryForeground
                        : colors.foreground,
                      fontWeight: "800",
                      fontSize: 13,
                      textTransform: "uppercase",
                    }}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            onPress={onSubmit}
            style={{ backgroundColor: colors.primary }}
            className="py-5 rounded-[22px] shadow-lg shadow-green-500/20"
          >
            <Text
              style={{
                color: colors.primaryForeground,
                fontWeight: "900",
                fontSize: 18,
              }}
              className="text-center font-black"
            >
              SAVE PAYMENT
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
}
