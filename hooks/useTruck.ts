import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

// Updated Truck interface
export interface Truck {
  truck_id: number;
  firebase_uid: string;
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  registered_owner_name?: string;
  container_dimension: string;
  loading_capacity: string;
}

export default function useTrucks(firebase_uid: string) {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all trucks for the current user
  const fetchTrucks = useCallback(async () => {
  if (!firebase_uid) return; // ✅ CRITICAL

  try {
    setLoading(true);
    const res = await API.get(
      `/api/trucks/user/firebase/${firebase_uid}`
    );
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
}, [firebase_uid]);


  // Add a new truck
  const addTruck = async (data: Partial<Truck>) => {
    try {
      const payload = { ...data, firebase_uid };
      const res = await API.post(`/api/trucks`, payload);
      setTrucks((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error?.response?.data?.error || "Failed to add truck");
      throw error;
    }
  };

  // Update an existing truck
  const updateTruck = async (id: number, updatedData: Partial<Truck>) => {
    try {
      const res = await API.put(`/api/trucks/${id}`, updatedData);
      setTrucks((prev) =>
        prev.map((t) => (t.truck_id === id ? res.data : t))
      );
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error?.response?.data?.error || "Failed to update truck");
      throw error;
    }
  };

  // Delete a truck
  const deleteTruck = async (id: number) => {
    try {
      await API.delete(`/api/trucks/${id}`);
      setTrucks((prev) => prev.filter((t) => t.truck_id !== id));
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error?.response?.data?.error || "Failed to delete truck");
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  return { trucks, loading, fetchTrucks, addTruck, updateTruck, deleteTruck };
}
