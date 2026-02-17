import { useCallback, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

import { ClientLedger } from "../types/entity";
export type { ClientLedger };

export function useClientLedger() {
  const [entries, setEntries] = useState<ClientLedger[]>([]);
  const [paymentRows, setPaymentRows] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState({
    totalToday: 0,
    totalThisMonth: 0,
    paymentCount: 0,
  });
  const [loading, setLoading] = useState(false);

  // 📒 Fetch full ledger (Invoices + Payments)
  const fetchLedger = useCallback(async (client_id: string) => {
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
  const fetchSummary = async (client_id: string) => {
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
    client_id: string;
    invoice_id?: string;
    amount: number;
    remarks?: string;
    date?: string; // ISO string
    paymentMode?: string;
  }) => {
    try {
      await API.post(`/api/ledger/entry`, {
        client: data.client_id,
        invoice: data.invoice_id,
        amount: data.amount,
        remarks: data.remarks,
        date: data.date,
        paymentMode: data.paymentMode || "CASH",
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

  const fetchPaymentLedger = useCallback(async (filters: {
    clientId?: string;
    startDate?: string;
    endDate?: string;
    paymentType?: "FULL" | "PARTIAL" | "";
    paymentMode?: string;
  } = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.clientId) params.append("clientId", filters.clientId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.paymentType) params.append("paymentType", filters.paymentType);
      if (filters.paymentMode) params.append("paymentMode", filters.paymentMode);

      const res = await API.get(`/api/ledger/payments?${params.toString()}`);
      setPaymentRows(res.data?.rows || []);
      setPaymentSummary(res.data?.summary || {
        totalToday: 0,
        totalThisMonth: 0,
        paymentCount: 0,
      });
      return res.data;
    } catch (error) {
      console.error("fetchPaymentLedger failed", error);
      Alert.alert("Error", "Failed to load payment ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✏️ Update ledger entry
  const updateEntry = async (
    entry_id: string,
    data: { amount?: number; remarks?: string; date?: string, client_id: string }
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
    paymentRows,
    paymentSummary,
    loading,
    fetchLedger,
    fetchSummary,
    fetchPaymentLedger,
    addPayment,
    updateEntry,
  };
}
