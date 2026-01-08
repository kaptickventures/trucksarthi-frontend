import { useCallback, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

export interface LedgerEntry {
  entry_id: string; // "INV-5" | "PAY-12"
  client_id: number;
  invoice_id?: number;
  entry_date: string;
  amount: number;
  entry_type: "debit" | "credit";
  remarks?: string;
}

export function useClientLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // 📒 Fetch full ledger (Invoices + Payments)
  const fetchLedger = useCallback(async (client_id: number) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/ledger/client/${client_id}`);
      setEntries(res.data);
    } catch (error) {
      console.error("❌ fetchLedger failed", error);
      Alert.alert("Error", "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  // 📊 Fetch derived summary (SOURCE OF TRUTH)
  const fetchSummary = async (client_id: number) => {
    try {
      const res = await API.get(
        `/api/ledger/client/${client_id}/summary`
      );
      return res.data as {
        total_debits: number;
        total_credits: number;
        outstanding: number;
      };
    } catch (error) {
      console.error("❌ fetchSummary failed", error);
      Alert.alert("Error", "Failed to load summary");
      throw error;
    }
  };

  // 💳 Add payment (CREDIT ONLY)
  const addPayment = async (data: {
    client_id: number;
    invoice_id?: number;
    amount: number;
    remarks?: string;
    date?: string; // ISO string
  }) => {
    try {
      await API.post(`/api/ledger/entry`, {
        ...data,
        entry_type: "credit",
      });

      // IMPORTANT: re-fetch ledger instead of appending
      await fetchLedger(data.client_id);
    } catch (error: any) {
      console.error("❌ addPayment failed", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to add payment"
      );
      throw error;
    }
  };

  // ✏️ Update ledger entry
  const updateEntry = async (
    entry_id: string,
    data: { amount?: number; remarks?: string; date?: string, client_id: number }
  ) => {
    try {
      await API.put(`/api/ledger/entry/${entry_id}`, data);
      await fetchLedger(data.client_id);
    } catch (error: any) {
      console.error("❌ updateEntry failed", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to update entry"
      );
      throw error;
    }
  };

  return {
    entries,
    loading,
    fetchLedger,
    fetchSummary,
    addPayment,
    updateEntry,
  };
}
