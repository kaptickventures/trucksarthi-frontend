import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

interface Props {
  filters: any;
  setFilters: (fn: any) => void;
  dropdowns: any;
  setDropdowns: (fn: any) => void;
  driverItems: any[];
  clientItems: any[];
  showFilters: boolean;
  toggleFilters: () => void;
  showDatePicker: { field: "startDate" | "endDate" | null };
  setShowDatePicker: (v: any) => void;
  formatDate: (d: Date | null) => string;
}

export default function TripFilters({
  filters,
  setFilters,
  dropdowns,
  setDropdowns,
  driverItems,
  clientItems,
  showFilters,
  toggleFilters,
  showDatePicker,
  setShowDatePicker,
  formatDate,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // FIXED COLORS (Nativewind tokens in raw RGB form)
  const inputBg = isDark ? "#1C1C1E" : "#F5F5F5";
  const inputBorder = isDark ? "#3A3A3C" : "#D4D4D8";
  const inputText = isDark ? "#FFFFFF" : "#000000";
  const placeholderText = isDark ? "#9E9E9E" : "#6B7280";

  const cardBg = isDark ? "#18181B" : "#FFFFFF";
  const border = isDark ? "#3F3F46" : "#E4E4E7";

  return (
    <>
      {/* FILTER BOX */}
      <View
        style={{ backgroundColor: cardBg, borderColor: border }}
        className="mx-3 mb-6 p-5 rounded-2xl border shadow-sm"
      >
        <TouchableOpacity
          onPress={toggleFilters}
          className="flex-row items-center justify-between"
        >
          <Text className="text-xl font-semibold text-foreground">Filters</Text>
          <Text className="text-primary font-medium">
            {showFilters ? "Hide ▲" : "Show ▼"}
          </Text>
        </TouchableOpacity>

        {showFilters && (
          <>
            {/* DROPDOWNS */}
            <View className="flex-row gap-3 mt-5">
              {/* DRIVER */}
              <View className="flex-1">
                <Text className="text-sm text-muted-foreground mb-1 ml-1">
                  Driver
                </Text>

                <DropDownPicker
                  open={dropdowns.driver}
                  value={filters.driver_id}
                  items={driverItems}
                  setOpen={(val) =>
                    setDropdowns((prev: any) => ({
                      ...prev,
                      driver: typeof val === "function" ? val(prev.driver) : val,
                    }))
                  }
                  setValue={(val) =>
                    setFilters((prev: any) => ({
                      ...prev,
                      driver_id:
                        typeof val === "function" ? val(prev.driver_id) : val,
                    }))
                  }
                  placeholder="Select Driver"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    minHeight: 48,
                    borderRadius: 12,
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: cardBg,
                    borderColor: border,
                  }}
                  textStyle={{
                    color: inputText,
                    fontSize: 15,
                  }}
                  placeholderStyle={{
                    color: placeholderText,
                  }}
                />
              </View>

              {/* CLIENT */}
              <View className="flex-1">
                <Text className="text-sm text-muted-foreground mb-1 ml-1">
                  Client
                </Text>

                <DropDownPicker
                  open={dropdowns.client}
                  value={filters.client_id}
                  items={clientItems}
                  setOpen={(val) =>
                    setDropdowns((prev: any) => ({
                      ...prev,
                      client:
                        typeof val === "function" ? val(prev.client) : val,
                    }))
                  }
                  setValue={(val) =>
                    setFilters((prev: any) => ({
                      ...prev,
                      client_id:
                        typeof val === "function" ? val(prev.client_id) : val,
                    }))
                  }
                  placeholder="Select Client"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    minHeight: 48,
                    borderRadius: 12,
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: cardBg,
                    borderColor: border,
                  }}
                  textStyle={{
                    color: inputText,
                    fontSize: 15,
                  }}
                  placeholderStyle={{
                    color: placeholderText,
                  }}
                />
              </View>
            </View>

            {/* DATE RANGE */}
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => setShowDatePicker({ field: "startDate" })}
                style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                className="flex-1 border rounded-xl px-4 py-3"
              >
                <Text className="text-sm text-muted-foreground mb-1">From</Text>
                <Text className="text-foreground font-medium">
                  {formatDate(filters.startDate)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDatePicker({ field: "endDate" })}
                style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                className="flex-1 border rounded-xl px-4 py-3"
              >
                <Text className="text-sm text-muted-foreground mb-1">To</Text>
                <Text className="text-foreground font-medium">
                  {formatDate(filters.endDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* RESET */}
            <TouchableOpacity
              onPress={() =>
                setFilters({
                  driver_id: "",
                  client_id: "",
                  startDate: null,
                  endDate: null,
                })
              }
              className="bg-primary mt-5 rounded-xl py-3"
            >
              <Text className="text-center text-primary-foreground font-semibold">
                Reset Filters
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* DATE PICKER */}
      {showDatePicker.field && (
        <DateTimePicker
          value={filters[showDatePicker.field] || new Date()}
          mode="date"
          display="default"
                    onChange={(e, selected) => {
            setShowDatePicker({ field: null });
            if (selected) {
              setFilters((prev: any) => ({
                ...prev,
                [showDatePicker.field!]: selected,
              }));
            }
          }}
        />
      )}
    </>
  );
}
