import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import API from "../app/api/axiosInstance";

import { Driver } from "../types/entity";

export default function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/drivers");
      setDrivers(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, []);

  const addDriver = async (data: Partial<Driver>) => {
    try {
      const res = await API.post(`/api/drivers`, data);
      setDrivers((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.error || "Failed to add driver");
      throw error;
    }
  };

  const updateDriver = async (id: string, updatedData: Partial<Driver>) => {
    try {
      const res = await API.put(`/api/drivers/${id}`, updatedData);
      setDrivers((prev) =>
        prev.map((d) => (d._id === id ? res.data : d))
      );
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update driver");
      throw error;
    }
  };

  /* ---------------- UPLOAD DOCUMENTS ---------------- */
  const uploadLicense = async (driverId: string, file: any) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
        name: file.name || 'license.jpg',
        type: file.mimeType || 'image/jpeg',
      } as any);

      const res = await API.post(`/api/drivers/${driverId}/license`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setDrivers((prev) =>
        prev.map((d) =>
          d._id === driverId
            ? { ...d, license_card_url: res.data.file_url || res.data.license_card_url }
            : d
        )
      );

      return res.data;
    } catch (error: any) {
      console.error("LICENSE UPLOAD ERROR:", error?.response?.data || error);
      Alert.alert("Error", error?.response?.data?.error || "Failed to upload license");
      throw error;
    }
  };

  const uploadAadhaar = async (driverId: string, file: any) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
        name: file.name || 'aadhaar.jpg',
        type: file.mimeType || 'image/jpeg',
      } as any);

      const res = await API.post(`/api/drivers/${driverId}/aadhaar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setDrivers((prev) =>
        prev.map((d) =>
          d._id === driverId
            ? { ...d, identity_card_url: res.data.file_url || res.data.identity_card_url }
            : d
        )
      );

      return res.data;
    } catch (error: any) {
      console.error("AADHAAR UPLOAD ERROR:", error?.response?.data || error);
      Alert.alert("Error", error?.response?.data?.error || "Failed to upload Aadhaar");
      throw error;
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      await API.delete(`/api/drivers/${id}`);
      setDrivers((prev) => prev.filter((d) => d._id !== id));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete driver");
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return { 
    drivers, 
    loading, 
    fetchDrivers, 
    addDriver, 
    updateDriver, 
    deleteDriver,
    uploadLicense,
    uploadAadhaar 
  };
}
