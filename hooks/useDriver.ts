import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

export interface Driver {
  driver_id: number;
  firebase_uid: string;
  driver_name: string;
  contact_number: string;
  identity_card_url?: string;  
  license_card_url?: string;   
}


export default function useDrivers(firebase_uid: string) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrivers = useCallback(async () => {
  if (!firebase_uid) return; // ✅ CRITICAL

  try {
    setLoading(true);
    const res = await API.get(
      `/api/drivers/user/firebase/${firebase_uid}`
    );
    setDrivers(res.data);
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Failed to load drivers");
  } finally {
    setLoading(false);
  }
}, [firebase_uid]);


  const addDriver = async (data: Partial<Driver>) => {
    try {
      const payload = { ...data, firebase_uid };
      const res = await API.post(`/api/drivers`, payload);
      setDrivers((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.error || "Failed to add driver");
      throw error;
    }
  };

  const updateDriver = async (id: number, updatedData: Partial<Driver>) => {
    try {
      const res = await API.put(`/api/drivers/${id}`, updatedData);
      setDrivers((prev) =>
        prev.map((d) => (d.driver_id === id ? res.data : d))
      );
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update driver");
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

  return { drivers, loading, fetchDrivers, addDriver, updateDriver, deleteDriver };
}
