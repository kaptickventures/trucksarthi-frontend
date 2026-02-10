import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import API from "../app/api/axiosInstance";

import { Driver } from "../types/entity";

const normalizePhone = (value?: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
};

const mapDriverFromApi = (driver: any): Driver => ({
  ...driver,
  driver_name: driver?.driver_name || driver?.name || "",
  contact_number: driver?.contact_number || driver?.phone || "",
});

export default function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/drivers");
      const normalized = Array.isArray(res.data)
        ? res.data.map(mapDriverFromApi)
        : [];
      setDrivers(normalized);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, []);

  const addDriver = async (data: Partial<Driver>) => {
    try {
      const name = (data.name || data.driver_name || "").trim();
      const phoneNumber = normalizePhone(data.phone || data.contact_number);

      if (!name || !phoneNumber) {
        Alert.alert("Missing Fields", "Name and contact number are required.");
        throw new Error("Driver name/contact missing");
      }

      const payload = {
        name,
        phoneNumber,
        // Keep legacy keys too for cross-backend compatibility.
        driver_name: name,
        contact_number: phoneNumber,
      };
      const res = await API.post(`/api/drivers`, payload);
      const created = mapDriverFromApi(res.data);
      setDrivers((prev) => [...prev, created]);
      return created;
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add driver";
      console.error("addDriver failed:", error?.response?.data || error);
      throw error;
    }
  };

  const updateDriver = async (id: string, updatedData: Partial<Driver>) => {
    try {
      const name = (updatedData.name || updatedData.driver_name || "").trim();
      const phoneNumber = normalizePhone(updatedData.phone || updatedData.contact_number);

      const payload = {
        ...updatedData,
        ...(name ? { name, driver_name: name } : {}),
        ...(phoneNumber ? { phone: phoneNumber, phoneNumber, contact_number: phoneNumber } : {}),
      };

      const res = await API.put(`/api/drivers/${id}`, payload);
      const normalized = mapDriverFromApi(res.data);
      setDrivers((prev) =>
        prev.map((d) => (d._id === id ? normalized : d))
      );
      return normalized;
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
      const fileUri = Platform.OS === "android" && !file.uri.startsWith("file://")
        ? `file://${file.uri}`
        : file.uri.replace("file://", "");

      formData.append("file", {
        uri: fileUri,
        name: file.name || file.fileName || 'license.jpg',
        type: file.type || file.mimeType || 'image/jpeg',
      } as any);

      const res = await API.post(`/api/drivers/${driverId}/license`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setDrivers((prev) =>
        prev.map((d) =>
          d._id === driverId
            ? { ...d, license_card_url: res.data.file_url || res.data.driver?.license_card_url }
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
      const fileUri = Platform.OS === "android" && !file.uri.startsWith("file://")
        ? `file://${file.uri}`
        : file.uri.replace("file://", "");

      formData.append("file", {
        uri: fileUri,
        name: file.name || file.fileName || 'aadhaar.jpg',
        type: file.type || file.mimeType || 'image/jpeg',
      } as any);

      const res = await API.post(`/api/drivers/${driverId}/aadhaar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setDrivers((prev) =>
        prev.map((d) =>
          d._id === driverId
            ? { ...d, identity_card_url: res.data.file_url || res.data.driver?.identity_card_url }
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
