import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

interface Client {
  client_id: number;
  firebase_uid: string;
  client_name: string;
  contact_person_name: string;
  contact_number: string;
  alternate_contact_number?: string;
  email_address: string;
  office_address?: string;
}

export default function useClients(firebase_uid: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/clients/user/firebase/${firebase_uid}`);
      setClients(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [firebase_uid]);

  const addClient = async (data: Partial<Client>) => {
    try {
      const payload = { ...data, firebase_uid };
      const res = await API.post(`/api/clients`, payload);
      setClients((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.error || "Failed to add client");
      throw error;
    }
  };

  const updateClient = async (id: number, updatedData: Partial<Client>) => {
    try {
      const res = await API.put(`/api/clients/${id}`, updatedData);
      setClients((prev) =>
        prev.map((c) => (c.client_id === id ? res.data : c))
      );
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update client");
      throw error;
    }
  };

  const deleteClient = async (id: number) => {
    try {
      await API.delete(`/api/clients/${id}`);
      setClients((prev) => prev.filter((c) => c.client_id !== id));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete client");
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, loading, fetchClients, addClient, updateClient, deleteClient };
}
