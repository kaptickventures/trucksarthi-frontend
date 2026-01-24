import { useCallback, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

import { Invoice } from "../types/entity";
export { Invoice };

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // 📥 Fetch invoices (DISPLAY ONLY)
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/invoices");
      setInvoices(res.data);
    } catch (error) {
      console.error("❌ fetchInvoices failed", error);
      Alert.alert("Error", "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  // 📄 Invoice details
  const getInvoiceById = async (id: string) => {
    try {
      const res = await API.get(`/api/invoices/${id}`);
      return res.data as Invoice;
    } catch (error) {
      console.error("❌ getInvoiceById failed", error);
      Alert.alert("Error", "Failed to load invoice details");
      throw error;
    }
  };

  // ➕ Create invoice
  const createInvoice = async (data: {
    client_id: string;
    tripIds: string[];
    due_date: string;
  }) => {
    try {
      const res = await API.post(`/api/invoices`, data);
      await fetchInvoices();
      return res.data;
    } catch (error: any) {
      console.error("❌ createInvoice failed", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to create invoice"
      );
      throw error;
    }
  };

  // ❌ Delete invoice
  const deleteInvoice = async (id: string) => {
    try {
      await API.delete(`/api/invoices/${id}`);
      await fetchInvoices();
    } catch (error) {
      console.error("❌ deleteInvoice failed", error);
      Alert.alert("Error", "Failed to delete invoice");
    }
  };

  return {
    invoices,
    loading,
    fetchInvoices,
    getInvoiceById,
    createInvoice,
    deleteInvoice,
  };
}
