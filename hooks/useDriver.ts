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
  const [extractedNumbers, setExtractedNumbers] = useState<Record<string, { license?: string; aadhaar?: string }>>({});
  
  const toRefId = (value: any) =>
    value && typeof value === "object" ? value._id : value;
  const matchesId = (value: any, id: string) =>
    String(toRefId(value) || "") === String(id);
  const fetchTripsForDeleteCheck = async () => {
    const res = await API.get("/api/trips");
    return res.data || [];
  };

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/drivers");
      const normalized = Array.isArray(res.data)
        ? res.data.map(mapDriverFromApi)
        : [];
      setDrivers(normalized);
      
      // Store extracted numbers from API response
      const extracted: Record<string, { license?: string; aadhaar?: string }> = {};
      normalized.forEach(d => {
        extracted[d._id] = {
          license: (d as any).driving_license_number,
          aadhaar: (d as any).aadhaar_number,
        };
      });
      setExtractedNumbers(extracted);
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

  const buildUploadFile = (file: any, fallbackName: string) => {
    const rawUri = file?.uri || "";
    const fileUri =
      Platform.OS === "android" && rawUri && !rawUri.startsWith("file://")
        ? `file://${rawUri}`
        : rawUri;

    return {
      uri: fileUri,
      name: file?.name || file?.fileName || fallbackName,
      type: file?.type || file?.mimeType || "image/jpeg",
    };
  };

  /* ---------------- UPLOAD DOCUMENTS ---------------- */
  const uploadLicense = async (driverId: string, file: any) => {
    try {
      const formData = new FormData();
      formData.append("file", buildUploadFile(file, "license.jpg") as any);

      const res = await API.post(`/api/drivers/${driverId}/license`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Store extracted license number
      const extractedNumber = res.data.extracted_number || res.data.driver?.driving_license_number;
      if (extractedNumber) {
        setExtractedNumbers(prev => ({
          ...prev,
          [driverId]: { ...prev[driverId], license: extractedNumber }
        }));
        Alert.alert("OCR Success", `License number extracted: ${extractedNumber}`);
      } else if (res.data.ocr_error) {
        console.warn("OCR extraction failed:", res.data.ocr_error);
        Alert.alert("OCR Info", "Document uploaded but number extraction failed. Please verify manually.");
      }

      setDrivers((prev) =>
        prev.map((d) =>
          d._id === driverId
            ? { 
                ...d, 
                license_card_url: res.data.file_url || res.data.driver?.license_card_url,
                ...(res.data.driver?.driving_license_number && { 
                  driving_license_number: res.data.driver.driving_license_number 
                })
              }
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
      formData.append("file", buildUploadFile(file, "aadhaar.jpg") as any);

      const res = await API.post(`/api/drivers/${driverId}/aadhaar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Store extracted aadhaar number
      const extractedNumber = res.data.extracted_number || res.data.driver?.aadhaar_number;
      if (extractedNumber) {
        setExtractedNumbers(prev => ({
          ...prev,
          [driverId]: { ...prev[driverId], aadhaar: extractedNumber }
        }));
        Alert.alert("OCR Success", `Aadhaar number extracted: ${extractedNumber}`);
      } else if (res.data.ocr_error) {
        console.warn("OCR extraction failed:", res.data.ocr_error);
        Alert.alert("OCR Info", "Document uploaded but number extraction failed. Please verify manually.");
      }

      setDrivers((prev) =>
        prev.map((d) =>
          d._id === driverId
            ? { 
                ...d, 
                identity_card_url: res.data.file_url || res.data.driver?.identity_card_url,
                ...(res.data.driver?.aadhaar_number && { 
                  aadhaar_number: res.data.driver.aadhaar_number 
                })
              }
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

  const uploadProfilePicture = async (driverId: string, file: any) => {
    try {
      const formData = new FormData();
      formData.append("file", buildUploadFile(file, "profile.jpg") as any);

      const res = await API.post(`/api/drivers/${driverId}/profile-picture`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDrivers((prev) =>
        prev.map((d) =>
          d._id === driverId
            ? { ...d, profile_picture_url: res.data.file_url || res.data.driver?.profile_picture_url }
            : d
        )
      );

      return res.data;
    } catch (error: any) {
      console.error("PROFILE UPLOAD ERROR:", error?.response?.data || error);
      Alert.alert("Error", error?.response?.data?.error || "Failed to upload profile photo");
      throw error;
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      const trips = await fetchTripsForDeleteCheck();
      const usedInTrips = trips.some((t: any) =>
        matchesId(t.driver ?? t.driverId, id)
      );
      if (usedInTrips) {
        Alert.alert(
          "Cannot Delete",
          "This driver is used in one or more trips and cannot be deleted."
        );
        return;
      }
      await API.delete(`/api/drivers/${id}`);
      setDrivers((prev) => prev.filter((d) => d._id !== id));
    } catch (error: any) {
      console.error(error);
      if (error?.response?.data?.error) {
        Alert.alert("Error", error.response.data.error);
      } else {
        Alert.alert("Error", "Unable to verify trips. Please try again.");
      }
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return { 
    drivers, 
    loading, 
    extractedNumbers,
    fetchDrivers, 
    addDriver, 
    updateDriver, 
    deleteDriver,
    uploadLicense,
    uploadAadhaar,
    uploadProfilePicture,
  };
}
