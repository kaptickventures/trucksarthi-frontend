import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { THEME } from "../theme"; // adjust path

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
  const t = THEME[colorScheme === "dark" ? "dark" : "light"];

  return (
    <>
      {/* FILTER BOX */}
      <View
        style={{
          backgroundColor: t.card,
          borderColor: t.border,
          borderWidth: 1,
          marginHorizontal: 12,
          marginBottom: 24,
          padding: 20,
          borderRadius: 18,
        }}
      >
        <TouchableOpacity
          onPress={toggleFilters}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "600", color: t.foreground }}>
            Filters
          </Text>

          <Text style={{ color: t.primary, fontWeight: "600" }}>
            {showFilters ? "Hide ▲" : "Show ▼"}
          </Text>
        </TouchableOpacity>

        {showFilters && (
          <>
            {/* DROPDOWNS */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              {/* DRIVER */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    marginBottom: 6,
                    color: t.mutedForeground,
                  }}
                >
                  Driver
                </Text>

                <DropDownPicker
                  open={dropdowns.driver}
                  value={filters.driver_id}
                  items={driverItems}
                  setOpen={(val) =>
                    setDropdowns((prev: any) => ({
                      ...prev,
                      driver:
                        typeof val === "function" ? val(prev.driver) : val,
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
                    backgroundColor: t.input,
                    borderColor: t.border,
                    minHeight: 48,
                    borderRadius: 12,
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: t.card,
                    borderColor: t.border,
                  }}
                  textStyle={{
                    color: t.foreground,
                    fontSize: 15,
                  }}
                  placeholderStyle={{
                    color: t.mutedForeground,
                  }}
                />
              </View>

              {/* CLIENT */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    marginBottom: 6,
                    color: t.mutedForeground,
                  }}
                >
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
                        typeof val === "function"
                          ? val(prev.client_id)
                          : val,
                    }))
                  }
                  placeholder="Select Client"
                  style={{
                    backgroundColor: t.input,
                    borderColor: t.border,
                    minHeight: 48,
                    borderRadius: 12,
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: t.card,
                    borderColor: t.border,
                  }}
                  textStyle={{
                    color: t.foreground,
                    fontSize: 15,
                  }}
                  placeholderStyle={{
                    color: t.mutedForeground,
                  }}
                />
              </View>
            </View>

            {/* DATE RANGE */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker({ field: "startDate" })}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.input,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: t.mutedForeground, fontSize: 13 }}>
                  From
                </Text>
                <Text style={{ color: t.foreground, fontWeight: "600" }}>
                  {formatDate(filters.startDate)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDatePicker({ field: "endDate" })}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.input,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: t.mutedForeground, fontSize: 13 }}>
                  To
                </Text>
                <Text style={{ color: t.foreground, fontWeight: "600" }}>
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
              style={{
                backgroundColor: t.primary,
                marginTop: 20,
                borderRadius: 12,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: t.primaryForeground,
                  fontWeight: "600",
                }}
              >
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
