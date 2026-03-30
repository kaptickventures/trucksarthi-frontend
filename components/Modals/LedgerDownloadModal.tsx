import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import BottomSheet from "../BottomSheet";
import { useThemeStore } from "../../hooks/useThemeStore";
import { formatDate } from "../../lib/utils";

interface LedgerDownloadModalProps {
  visible: boolean;
  onClose: () => void;
  downloadRange: {
    startDate: Date;
    endDate: Date;
  };
  downloadDateField: "start" | "end" | null;
  onOpenDatePicker: (field: "start" | "end") => void;
  onCloseDatePicker: () => void;
  onApplyDate: (field: "start" | "end", date: Date) => void;
  onDownload: () => void;
  downloading: boolean;
}

export default function LedgerDownloadModal({
  visible,
  onClose,
  downloadRange,
  downloadDateField,
  onOpenDatePicker,
  onCloseDatePicker,
  onApplyDate,
  onDownload,
  downloading,
}: LedgerDownloadModalProps) {
  const { colors } = useThemeStore();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Download Ledger"
      subtitle="Choose a date range"
      maxHeight="70%"
    >
      <View style={{ gap: 14, paddingBottom: 10 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
          Select the period you want to include in the PDF.
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => onOpenDatePicker("start")}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Calendar size={14} color={colors.mutedForeground} />
            <View>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                Start
              </Text>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                {formatDate(downloadRange.startDate)}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onOpenDatePicker("end")}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Calendar size={14} color={colors.mutedForeground} />
            <View>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                End
              </Text>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                {formatDate(downloadRange.endDate)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {Platform.OS === "ios" && downloadDateField && (
          <Modal
            transparent
            animationType="slide"
            visible
            onRequestClose={onCloseDatePicker}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: colors.overlay35,
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  paddingBottom: 20,
                  borderTopWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <TouchableOpacity onPress={onCloseDatePicker}>
                    <Text
                      style={{
                        color: colors.destructive,
                        fontWeight: "600",
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onCloseDatePicker}>
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "700",
                      }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={
                    downloadDateField === "start"
                      ? downloadRange.startDate
                      : downloadRange.endDate
                  }
                  mode="date"
                  display="inline"
                  onChange={(_, selectedDate) => {
                    if (selectedDate)
                      onApplyDate(downloadDateField, selectedDate);
                  }}
                />
              </View>
            </View>
          </Modal>
        )}

        {Platform.OS === "android" && downloadDateField && (
          <DateTimePicker
            value={
              downloadDateField === "start"
                ? downloadRange.startDate
                : downloadRange.endDate
            }
            mode="date"
            display="spinner"
            onChange={(_, selectedDate) => {
              if (selectedDate) onApplyDate(downloadDateField, selectedDate);
              onCloseDatePicker();
            }}
          />
        )}

        <TouchableOpacity
          onPress={onDownload}
          disabled={downloading}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            opacity: downloading ? 0.7 : 1,
          }}
        >
          <Text
            style={{
              color: colors.primaryForeground,
              fontWeight: "800",
              fontSize: 14,
            }}
          >
            {downloading ? "Generating PDF..." : "Download PDF"}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
