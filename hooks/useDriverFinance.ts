import { useState, useCallback } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

/* ---------------- TYPES ---------------- */

export interface DriverLedgerEntry {
  entry_id: number;
  driver_id: number;
  entry_date: string;
  entry_type: "credit" | "debit";
  amount: number;
  category: string;
  payment_mode?: string;
  trip_id?: number;
  payroll_month?: string;
  remarks?: string;
}

export default function useDriverFinance() {
  const [entries, setEntries] = useState<DriverLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH LEDGER ---------------- */
  const fetchDriverLedger = useCallback(async (driverId: number) => {
    try {
      setLoading(true);
      const res = await API.get(
        `/api/driver-ledger/driver/${driverId}`
      );
      setEntries(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load driver ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------- FETCH BALANCE ---------------- */
  const fetchDriverSummary = async (driverId: number) => {
    try {
      const res = await API.get(
        `/api/driver-ledger/driver/${driverId}/balance`
      );

      return {
        net_balance: Number(res.data.balance),
      };
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load driver balance");
      return { net_balance: 0 };
    }
  };

  /* ---------------- ADD LEDGER ENTRY ---------------- */
  const addLedgerEntry = async (data: {
    driver_id: number;
    entry_type: "credit" | "debit";
    amount: number;
    category: string;
    payment_mode?: string;
    trip_id?: number;
    payroll_month?: string;
    remarks?: string;
    firebase_uid: string;
  }) => {
    try {
      const res = await API.post(`/api/driver-ledger`, data);

      // optimistic update
      setEntries((prev) => [res.data, ...prev]);

      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to add ledger entry"
      );
      throw error;
    }
  };

  return {
    entries,
    loading,
    fetchDriverLedger,
    fetchDriverSummary,
    addLedgerEntry,
  };
}
