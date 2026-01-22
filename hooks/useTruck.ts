import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

/* ---------------- TYPES ---------------- */

export interface Truck {
  truck_id: number;
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  registered_owner_name: string;
  make?: string;
  model?: string;
  vehicle_class?: string;
  fuel_type?: string;
  fuel_norms?: string;
  unladen_weight?: number;
  registered_rto?: string;
  container_dimension: string;
  loading_capacity: number;
  // Important dates
  registration_date?: string;
  fitness_upto?: string;
  pollution_upto?: string;
  road_tax_upto?: string;
  insurance_upto?: string;
  permit_upto?: string;
  national_permit_upto?: string;
}

/* ---------------- HOOK ---------------- */

export default function useTrucks() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH ---------------- */
  const fetchTrucks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/trucks");
      setTrucks(res.data);
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to load trucks"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------- CREATE ---------------- */
  const addTruck = async (data: Partial<Truck>) => {
    try {
      const res = await API.post(`/api/trucks`, data);
      setTrucks((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to add truck"
      );
      throw error;
    }
  };

  /* ---------------- UPDATE (BASIC INFO) ---------------- */
  const updateTruck = async (
    id: number,
    updatedData: Partial<Truck>
  ) => {
    try {
      const res = await API.put(`/api/trucks/${id}`, updatedData);
      setTrucks((prev) =>
        prev.map((t) => (t.truck_id === id ? res.data : t))
      );
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to update truck"
      );
      throw error;
    }
  };

  /* ---------------- UPDATE IMPORTANT DATES ---------------- */
  const updateImportantDates = async (
    id: number,
    dates: any
  ) => {
    try {
      const res = await API.patch(
        `/api/trucks/${id}/important-dates`,
        dates
      );

      setTrucks((prev) =>
        prev.map((t) => (t.truck_id === id ? res.data : t))
      );

      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          "Failed to update important dates"
      );
      throw error;
    }
  };

  /* ---------------- DELETE ---------------- */
  const deleteTruck = async (id: number) => {
    try {
      await API.delete(`/api/trucks/${id}`);
      setTrucks((prev) => prev.filter((t) => t.truck_id !== id));
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to delete truck"
      );
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  return {
    trucks,
    loading,
    fetchTrucks,
    addTruck,
    updateTruck,
    updateImportantDates,
    deleteTruck,
  };
}
