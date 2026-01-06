import { useState, useEffect, useCallback } from "react";
import { Alert, Platform } from "react-native";
import API from "../app/api/axiosInstance";

/* ---------------- TYPES ---------------- */

export interface TruckDocument {
  document_id: number;
  truck_id: number;
  document_type: string;
  file_url: string;
  expiry_date: string;
  is_expiring_soon?: boolean;
  firebase_uid: string;
}

/* ---------------- HOOK ---------------- */

export default function useTruckDocuments(firebase_uid: string) {
  const [documents, setDocuments] = useState<TruckDocument[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH ALL ---------------- */
  const fetchDocuments = useCallback(async () => {
    if (!firebase_uid) return;

    try {
      setLoading(true);
      const res = await API.get("/api/truck-documents", {
        params: { firebase_uid },
      });
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
  }, [firebase_uid]);

  /* ---------------- FETCH BY TRUCK ---------------- */
  const fetchDocumentsByTruck = useCallback(
    async (truck_id: number) => {
      if (!firebase_uid || !truck_id) return;

      try {
        setLoading(true);
        const res = await API.get(
          `/api/truck-documents/truck/${truck_id}`,
          { params: { firebase_uid } }
        );
        setDocuments(res.data);
      } catch (error: any) {
        console.error(error);
        Alert.alert(
          "Error",
          error?.response?.data?.error || "Failed to load truck documents"
        );
      } finally {
        setLoading(false);
      }
    },
    [firebase_uid]
  );

  /* ---------------- UPLOAD / UPDATE ---------------- */
  const uploadDocument = async (data: {
    truck_id: number;
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
      formData.append("firebase_uid", firebase_uid);

      const res = await API.post(
        `/api/truck-documents/${truck_id}/${normalizedType}/upload`,
        formData
        // ❌ DO NOT set Content-Type
      );

      setDocuments((prev) => {
        const index = prev.findIndex(
          (d) =>
            d.truck_id === truck_id &&
            d.document_type === normalizedType
        );

        if (index !== -1) {
          const updated = [...prev];
          updated[index] = res.data.document;
          return updated;
        }

        return [...prev, res.data.document];
      });

      return res.data.document;
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
  const deleteDocument = async (document_id: number) => {
    try {
      await API.delete(`/api/truck-documents/${document_id}`, {
        params: { firebase_uid },
      });

      setDocuments((prev) =>
        prev.filter((d) => d.document_id !== document_id)
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
    fetchDocumentsByTruck,
    uploadDocument,
    deleteDocument,
  };
}
