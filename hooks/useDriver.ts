import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

interface Driver {
  driver_id: number;
  driver_name: string;
  contact_number: string;
  identity_card_url: string;
  license_card_url: string;
  user_id: number;
}

export default function useDrivers(userId: number) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/drivers/user/${userId}`);
      setDrivers(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addDriver = async (formData: any) => {
    try {
      const res = await API.post(`/api/drivers`, { ...formData, user_id: userId });
      setDrivers((prev) => [...prev, res.data]);
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add driver");
      throw error;
    }
  };

  const deleteDriver = async (id: number) => {
    try {
      await API.delete(`/api/drivers/${id}`);
      setDrivers((prev) => prev.filter((d) => d.driver_id !== id));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete driver");
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return { drivers, loading, fetchDrivers, addDriver, deleteDriver };
}
