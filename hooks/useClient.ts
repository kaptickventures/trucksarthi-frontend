import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance"

interface Client {
  client_id: number;
  client_name: string;
  contact_person_name: string;
  contact_number: string;
  alternate_contact_number?: string;
  email_address: string;
  office_address: string;
}

export default function useClients(userId: number) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/clients/user/${userId}`);
      setClients(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addClient = async (formData: any) => {
    try {
      const res = await API.post(`/api/clients`, {
        ...formData,
        user_id: userId,
      });
      setClients((prev) => [...prev, res.data]);
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add client");
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

  return {
    clients,
    loading,
    fetchClients,
    addClient,
    deleteClient,
  };
}
