// components/FilterSection.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useThemeStore } from "../hooks/useThemeStore";

interface Props {
  filters: any;
  setFilters: (fn: any) => void;
  dropdowns: any;
  setDropdowns: (fn: any) => void;
  driverItems: any[];
  clientItems: any[];
  truckItems: any[];
  locationItems: any[];
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
  truckItems,
  locationItems,
  showFilters,
  showDatePicker,
  setShowDatePicker,
  formatDate,
}: Props) {
  const { colors: t } = useThemeStore();

  if (!showFilters) return null;

  return (
    <>
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
        {/* ROW 1 — Driver + Client */}
        <View style={{ flexDirection: "row", gap: 12 }}>
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
              value={filters.driver}
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
                  driver:
                    typeof val === "function" ? val(prev.driver) : val,
                }))
              }
              placeholder="Select Driver"
              style={{
                backgroundColor: t.input,
                borderColor: t.border,
                minHeight: 48,
                borderRadius: 12,
                zIndex: 7000,
              }}
              containerStyle={{ zIndex: 7000 }}
              dropDownContainerStyle={{
                backgroundColor: t.card,
                borderColor: t.border,
              }}
              textStyle={{ color: t.foreground, fontSize: 15 }}
              placeholderStyle={{ color: t.mutedForeground }}
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
              value={filters.client}
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
                  client:
                    typeof val === "function" ? val(prev.client) : val,
                }))
              }
              placeholder="Select Client"
              style={{
                backgroundColor: t.input,
                borderColor: t.border,
                minHeight: 48,
                borderRadius: 12,
                zIndex: 6000,
              }}
              containerStyle={{ zIndex: 6000 }}
              dropDownContainerStyle={{
                backgroundColor: t.card,
                borderColor: t.border,
              }}
              textStyle={{ color: t.foreground, fontSize: 15 }}
              placeholderStyle={{ color: t.mutedForeground }}
            />
          </View>
        </View>

        {/* ROW 2 — Truck + Location */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          {/* TRUCK */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                marginBottom: 6,
                color: t.mutedForeground,
              }}
            >
              Truck
            </Text>

            <DropDownPicker
              open={dropdowns.truck}
              value={filters.truck}
              items={truckItems}
              setOpen={(val) =>
                setDropdowns((prev: any) => ({
                  ...prev,
                  truck:
                    typeof val === "function" ? val(prev.truck) : val,
                }))
              }
              setValue={(val) =>
                setFilters((prev: any) => ({
                  ...prev,
                  truck:
                    typeof val === "function" ? val(prev.truck) : val,
                }))
              }
              placeholder="Select Truck"
              style={{
                backgroundColor: t.input,
                borderColor: t.border,
                minHeight: 48,
                borderRadius: 12,
                zIndex: 5000,
              }}
              containerStyle={{ zIndex: 5000 }}
              dropDownContainerStyle={{
                backgroundColor: t.card,
                borderColor: t.border,
              }}
              textStyle={{ color: t.foreground, fontSize: 15 }}
              placeholderStyle={{ color: t.mutedForeground }}
            />
          </View>

          {/* LOCATION */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                marginBottom: 6,
                color: t.mutedForeground,
              }}
            >
              Location
            </Text>

            <DropDownPicker
              open={dropdowns.location}
              value={filters.location}
              items={locationItems}
              setOpen={(val) =>
                setDropdowns((prev: any) => ({
                  ...prev,
                  location:
                    typeof val === "function" ? val(prev.location) : val,
                }))
              }
              setValue={(val) =>
                setFilters((prev: any) => ({
                  ...prev,
                  location:
                    typeof val === "function"
                      ? val(prev.location)
                      : val,
                }))
              }
              placeholder="Select Location"
              style={{
                backgroundColor: t.input,
                borderColor: t.border,
                minHeight: 48,
                borderRadius: 12,
                zIndex: 4000,
              }}
              containerStyle={{ zIndex: 4000 }}
              dropDownContainerStyle={{
                backgroundColor: t.card,
                borderColor: t.border,
              }}
              textStyle={{ color: t.foreground, fontSize: 15 }}
              placeholderStyle={{ color: t.mutedForeground }}
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
              driver: "",
              client: "",
              truck: "",
              location: "",
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
