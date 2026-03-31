// components/FilterSection.tsx
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useThemeStore } from "../hooks/useThemeStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DatePickerModal } from "./DatePickerModal";

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
  toggleFilters,
  showDatePicker,
  setShowDatePicker,
  formatDate,
}: Props) {
  const { colors: t } = useThemeStore();
  const insets = useSafeAreaInsets();
  const closeAllDropdowns = () => {
    setDropdowns({
      driver: false,
      client: false,
      truck: false,
      location: false,
    });
  };

  const setOnlyOpen = (
    key: "driver" | "client" | "truck" | "location",
    val: boolean | ((prev: boolean) => boolean)
  ) => {
    setDropdowns((prev: any) => {
      const nextOpen = typeof val === "function" ? val(prev[key]) : val;
      return {
        driver: key === "driver" ? nextOpen : false,
        client: key === "client" ? nextOpen : false,
        truck: key === "truck" ? nextOpen : false,
        location: key === "location" ? nextOpen : false,
      };
    });
  };

  const setMultiFilterValue = (
    key: "driver" | "client" | "truck" | "location",
    val: any
  ) => {
    setFilters((prev: any) => {
      const nextValue = typeof val === "function" ? val(prev[key]) : val;
      return {
        ...prev,
        [key]: Array.isArray(nextValue) ? nextValue : [],
      };
    });
  };

  const openDatePicker = (field: "startDate" | "endDate") => {
    closeAllDropdowns();
    setShowDatePicker({ field });
  };

  if (!showFilters) return null;

  return (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => {
        closeAllDropdowns();
        setShowDatePicker({ field: null });
        toggleFilters();
      }}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <TouchableWithoutFeedback
          onPress={() => {
            closeAllDropdowns();
            setShowDatePicker({ field: null });
            toggleFilters();
          }}
        >
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.overlay45 }} />
        </TouchableWithoutFeedback>

        <View
          style={{
            backgroundColor: t.background,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 12),
            borderWidth: 1,
            borderColor: t.border,
            maxHeight: "90%",
          }}
        >
          <View style={{ paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: t.foreground, fontWeight: "800", fontSize: 16 }}>Filters</Text>
            <TouchableOpacity
              onPress={() => {
                closeAllDropdowns();
                setShowDatePicker({ field: null });
                toggleFilters();
              }}
              style={{ padding: 8, borderRadius: 999, backgroundColor: t.secondary }}
            >
              <Ionicons name="close" size={18} color={t.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                backgroundColor: t.card,
                borderColor: t.border,
                borderWidth: 1,
                padding: 16,
                borderRadius: 18,
              }}
            >
              {/* ROW 1 — Driver + Client */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* DRIVER */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, marginBottom: 6, color: t.mutedForeground }}>Driver</Text>
                  <DropDownPicker
                    open={dropdowns.driver}
                    value={filters.driver}
                    items={driverItems}
                    setOpen={(val) => setOnlyOpen("driver", val)}
                    setValue={(val) => setMultiFilterValue("driver", val)}
                    placeholder="Select Driver(s)"
                    multiple={true}
                    mode="BADGE"
                    closeAfterSelecting={false}
                    searchable={false}
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
                  <Text style={{ fontSize: 13, marginBottom: 6, color: t.mutedForeground }}>Client</Text>
                  <DropDownPicker
                    open={dropdowns.client}
                    value={filters.client}
                    items={clientItems}
                    setOpen={(val) => setOnlyOpen("client", val)}
                    setValue={(val) => setMultiFilterValue("client", val)}
                    placeholder="Select Client(s)"
                    multiple={true}
                    mode="BADGE"
                    closeAfterSelecting={false}
                    searchable={false}
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
                  <Text style={{ fontSize: 13, marginBottom: 6, color: t.mutedForeground }}>Truck</Text>
                  <DropDownPicker
                    open={dropdowns.truck}
                    value={filters.truck}
                    items={truckItems}
                    setOpen={(val) => setOnlyOpen("truck", val)}
                    setValue={(val) => setMultiFilterValue("truck", val)}
                    placeholder="Select Truck(s)"
                    multiple={true}
                    mode="BADGE"
                    closeAfterSelecting={false}
                    searchable={false}
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
                  <Text style={{ fontSize: 13, marginBottom: 6, color: t.mutedForeground }}>Location</Text>
                  <DropDownPicker
                    open={dropdowns.location}
                    value={filters.location}
                    items={locationItems}
                    setOpen={(val) => setOnlyOpen("location", val)}
                    setValue={(val) => setMultiFilterValue("location", val)}
                    placeholder="Select Location(s)"
                    multiple={true}
                    mode="BADGE"
                    closeAfterSelecting={false}
                    searchable={false}
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
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    onPress={() => openDatePicker("startDate")}
                    style={{
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.input,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <Text style={{ color: t.mutedForeground, fontSize: 13 }}>From</Text>
                    <Text style={{ color: t.foreground, fontWeight: "600" }}>
                      {formatDate(filters.startDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    onPress={() => openDatePicker("endDate")}
                    style={{
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.input,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <Text style={{ color: t.mutedForeground, fontSize: 13 }}>To</Text>
                    <Text style={{ color: t.foreground, fontWeight: "600" }}>
                      {formatDate(filters.endDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowDatePicker({ field: null });
                    setFilters({
                      driver: [],
                      client: [],
                      truck: [],
                      location: [],
                      startDate: null,
                      endDate: null,
                    });
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: t.secondary,
                    borderRadius: 12,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <Text style={{ textAlign: "center", color: t.foreground, fontWeight: "700" }}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowDatePicker({ field: null });
                    toggleFilters();
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: t.primary,
                    borderRadius: 12,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ textAlign: "center", color: t.primaryForeground, fontWeight: "800" }}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      <DatePickerModal
        visible={showDatePicker.field === "startDate"}
        onClose={() => setShowDatePicker({ field: null })}
        date={filters.startDate || new Date()}
        onChange={(selected) => {
          setFilters((prev: any) => ({
            ...prev,
            startDate: selected,
          }));
        }}
      />

      <DatePickerModal
        visible={showDatePicker.field === "endDate"}
        onClose={() => setShowDatePicker({ field: null })}
        date={filters.endDate || new Date()}
        onChange={(selected) => {
          setFilters((prev: any) => ({
            ...prev,
            endDate: selected,
          }));
        }}
      />
    </Modal>
  );
}
