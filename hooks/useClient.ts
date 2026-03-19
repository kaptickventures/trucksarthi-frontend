import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

import { Client } from "../types/entity";

export default function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const toRefId = (value: any) =>
    value && typeof value === "object" ? value._id : value;
  const matchesId = (value: any, id: string) =>
    String(toRefId(value) || "") === String(id);
  const fetchTripsForDeleteCheck = async () => {
    const res = await API.get("/api/trips");
    return res.data || [];
  };

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/clients");
      setClients(res.data);
    } catch (error) {
      console.error("❌ fetchClients failed", error);
      Alert.alert("Error", "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  const addClient = async (data: Partial<Client>) => {
    try {
      const res = await API.post(`/api/clients`, data);
      setClients((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to add client"
      );
      throw error;
    }
  };

  const updateClient = async (
    id: string,
    updatedData: Partial<Client>
  ) => {
    try {
      const res = await API.put(`/api/clients/${id}`, updatedData);
      setClients((prev) =>
        prev.map((c) => (c._id === id ? res.data : c))
      );
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to update client"
      );
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const trips = await fetchTripsForDeleteCheck();
      const usedInTrips = trips.some((t: any) =>
        matchesId(t.client ?? t.clientId, id)
      );
      if (usedInTrips) {
        Alert.alert(
          "Cannot Delete",
          "This client is used in one or more trips and cannot be deleted."
        );
        return;
      }
      await API.delete(`/api/clients/${id}`);
      setClients((prev) =>
        prev.filter((c) => c._id !== id)
      );
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
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    fetchClients,
    addClient,
    updateClient,
    deleteClient,
  };
}
