import { useState, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

export interface DriverFinanceEntry {
  financial_id: number;
  driver_id: number;
  trip_id?: number;
  entry_type: "advance" | "expense" | "salary" | "per_trip";
  amount: number;
  remarks?: string;
  entry_date: string;
}

export function useDriverFinance() {
  const [entries, setEntries] = useState<DriverFinanceEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch full ledger for driver
  const fetchDriverLedger = useCallback(async (driver_id: number) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/driver-finance/driver/${driver_id}`);
      setEntries(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load driver ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch driver balance
  const fetchDriverSummary = async (driver_id: number) => {
    try {
      const res = await API.get(
        `/api/driver-finance/driver/${driver_id}/summary`
      );
      return res.data; // { net_balance }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load driver summary");
      throw error;
    }
  };

  // Add finance entry
  const addEntry = async (data: Partial<DriverFinanceEntry> & { firebase_uid: string }) => {
    try {
      const res = await API.post(`/api/driver-finance`, data);
      setEntries((prev) => [res.data, ...prev]);
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to add entry"
      );
      throw error;
    }
  };

  // Delete entry (optional)
  const deleteEntry = async (id: number) => {
    try {
      await API.delete(`/api/driver-finance/${id}`);
      setEntries((prev) => prev.filter((e) => e.financial_id !== id));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete entry");
    }
  };

  return {
    entries,
    loading,
    fetchDriverLedger,
    fetchDriverSummary,
    addEntry,
    deleteEntry,
  };
}
