import { useState, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

export interface LedgerEntry {
  entry_id: number;
  client_id: number;
  invoice_id?: number;
  entry_date: string;
  entry_type: "debit" | "credit";
  amount: number;
  remarks?: string;
  invoice_number?: string;
}

export function useClientLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // 📒 Fetch full ledger for client
  const fetchLedger = useCallback(async (client_id: number) => {
    try {
      setLoading(true);
      const res = await API.get(
        `/api/ledger/client/${client_id}`
      );
      setEntries(res.data);
    } catch (error) {
      console.error("❌ fetchLedger failed", error);
      Alert.alert("Error", "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  // 📊 Fetch outstanding summary
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

  // 💳 Add payment (credit entry)
  const addPayment = async (data: {
    client_id: number;
    invoice_id: number;
    amount: number;
    remarks?: string;
  }) => {
    try {
      const res = await API.post(
        `/api/ledger/entry`,
        {
          ...data,
          entry_type: "credit",
        }
      );

      setEntries((prev) => [res.data, ...prev]);
      return res.data;
    } catch (error: any) {
      console.error("❌ addPayment failed", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to add payment"
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
  };
}
