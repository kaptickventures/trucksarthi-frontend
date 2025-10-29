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
  user_id: number;
}

export default function useTrucks(userId: number) {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrucks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/trucks/user/${userId}`);
      setTrucks(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load trucks");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addTruck = async (formData: any) => {
    try {
      const res = await API.post(`/api/trucks`, { ...formData, user_id: userId });
      setTrucks((prev) => [...prev, res.data]);
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add truck");
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

  return { trucks, loading, fetchTrucks, addTruck, deleteTruck };
}
