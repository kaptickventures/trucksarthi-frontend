import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import API from "../app/api/axiosInstance";

import { TruckDocument } from "../types/entity";

/* ---------------- HOOK ---------------- */

export default function useTruckDocuments(truck_id?: string) {
  const [documents, setDocuments] = useState<TruckDocument[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH ALL ---------------- */
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = truck_id 
        ? `/api/truck-documents/truck/${truck_id}`
        : "/api/truck-documents";
      
      const res = await API.get(endpoint);
      setDocuments(res.data);
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to load documents"
      );
    } finally {
      setLoading(false);
    }
  }, [truck_id]);

  /* ---------------- UPLOAD / UPDATE ---------------- */
  const uploadDocument = async (data: {
    truck_id: string;
    document_type: string;
    file: {
      uri: string;
      name: string;
      type: string;
    };
    expiry_date: string;
  }) => {
    try {
      const { truck_id, document_type, file, expiry_date } = data;
      const normalizedType = document_type.toUpperCase();

      const formData = new FormData();

      const fileUri =
        Platform.OS === "android" && !file.uri.startsWith("file://")
          ? `file://${file.uri}`
          : file.uri;

      formData.append("file", {
        uri: fileUri,
        name: file.name,
        type: file.type,
      } as any);

      formData.append("expiry_date", expiry_date);

      // Hit the specific backend upload endpoint as requested
      const res = await API.post(
        `/api/truck-documents/${truck_id}/${normalizedType}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const newDoc = res.data.document || res.data;

      setDocuments((prev) => {
        const index = prev.findIndex(
          (d) =>
            d.truck === truck_id &&
            d.document_type === normalizedType
        );

        if (index !== -1) {
          const updated = [...prev];
          updated[index] = newDoc;
          return updated;
        }

        return [...prev, newDoc];
      });

      return newDoc;
    } catch (error: any) {
      console.error("UPLOAD ERROR:", error?.response || error);
      Alert.alert(
        "Upload Failed",
        error?.response?.data?.error || "Failed to upload document"
      );
      throw error;
    }
  };

  /* ---------------- DELETE ---------------- */
  const deleteDocument = async (document_id: string) => {
    try {
      await API.delete(`/api/truck-documents/${document_id}`);
      setDocuments((prev) =>
        prev.filter((d) => d._id !== document_id)
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to delete document"
      );
    }
  };

  /* ---------------- AUTO FETCH ---------------- */
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
}
