import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

interface Truck {
  truck_id: number;
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  registered_owner_name: string;
  container_dimension: string;
  loading_capacity: number;
}

export default function useTrucks(firebase_uid: string) {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrucks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/trucks/user/firebase/${firebase_uid}`);
      setTrucks(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load trucks");
    } finally {
      setLoading(false);
    }
  }, [firebase_uid]);

  const addTruck = async (formData: any) => {
    try {
      const res = await API.post(`/api/trucks`, { ...formData, firebase_uid });
      setTrucks((prev) => [...prev, res.data]);
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add truck");
      throw error;
    }
  };

  const updateTruck = async (id: number, updatedData: any) => {
    try {
      const res = await API.put(`/api/trucks/${id}`, updatedData);
      setTrucks((prev) =>
        prev.map((t) => (t.truck_id === id ? res.data : t))
      );
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update truck");
      throw error;
    }
  };

  const deleteTruck = async (id: number) => {
    try {
      await API.delete(`/api/trucks/${id}`);
      setTrucks((prev) => prev.filter((t) => t.truck_id !== id));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete truck");
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  return { trucks, loading, fetchTrucks, addTruck, updateTruck, deleteTruck };
}
