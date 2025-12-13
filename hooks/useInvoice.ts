import { useState, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

export interface Invoice {
  invoice_id: number;
  invoice_number: string;
  client_id: number;
  total_amount: number;
  due_date: string;
  status: "pending" | "paid" | "partial";
  created_at: string;
}

export interface InvoiceItem {
  invoice_item_id: number;
  trip_id: number;
  trip_cost: number;
  misc_expense: number;
  total: number;
}

export function useInvoices(firebase_uid: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // 📥 Fetch all invoices
  const fetchInvoices = useCallback(async () => {
    if (!firebase_uid) return;

    try {
      setLoading(true);
      const res = await API.get(
        `/api/invoices?firebaseUid=${firebase_uid}`
      );
      setInvoices(res.data);
    } catch (error) {
      console.error("❌ fetchInvoices failed", error);
      Alert.alert("Error", "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [firebase_uid]);

  // 📄 Fetch invoice details
  const getInvoiceById = async (id: number) => {
    try {
      const res = await API.get(
        `/api/invoices/${id}`
      );
      return res.data as {
        invoice: Invoice;
        items: InvoiceItem[];
      };
    } catch (error) {
      console.error("❌ getInvoiceById failed", error);
      Alert.alert("Error", "Failed to load invoice details");
      throw error;
    }
  };

  // ➕ Create invoice
  const createInvoice = async (data: {
    client_id: number;
    tripIds: number[];
    due_date: string;
  }) => {
    try {
      const res = await API.post(
        `/api/invoices`,
        {
          ...data,
          firebase_uid,
        }
      );

      setInvoices((prev) => [res.data, ...prev]);
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

  // 🔄 Update invoice status
  const updateInvoiceStatus = async (
    id: number,
    status: "pending" | "paid" | "partial"
  ) => {
    try {
      const res = await API.put(
        `/api/invoices/${id}/status`,
        { status }
      );

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.invoice_id === id ? res.data : inv
        )
      );

      return res.data;
    } catch (error: any) {
      console.error("❌ updateInvoiceStatus failed", error);
      Alert.alert("Error", "Failed to update invoice");
      throw error;
    }
  };

  // ❌ Delete invoice
  const deleteInvoice = async (id: number) => {
    try {
      await API.delete(
        `/api/invoices/${id}`
      );
      setInvoices((prev) =>
        prev.filter((inv) => inv.invoice_id !== id)
      );
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
    updateInvoiceStatus,
    deleteInvoice,
  };
}
