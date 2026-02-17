import { useCallback, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

/* ---------------- TYPES ---------------- */

import { CounterpartyType, DriverLedger, LedgerDirection, TransactionNature } from "../types/entity";

export type { CounterpartyType, DriverLedger, LedgerDirection, TransactionNature };

/* ---------------- HOOK ---------------- */

export default function useDriverFinance() {
  const [entries, setEntries] = useState<DriverLedger[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH LEDGER ---------------- */
  const fetchDriverLedger = useCallback(async (driverId: string) => {
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
  const fetchDriverSummary = async (driverId: string) => {
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

  /* ---------------- ADD ENTRY ---------------- */
  const addLedgerEntry = async (data: {
    driver_id: string;
    transaction_nature: TransactionNature;
    counterparty_type: CounterpartyType;
    counterparty_id?: string | null;
    direction: LedgerDirection;
    amount: number;
    remarks: string;
  }) => {
    try {
      if (!data.remarks) {
        Alert.alert("Validation", "Remarks are mandatory");
        throw new Error("Remarks required");
      }

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

  /* ---------------- UPDATE STATUS ---------------- */
  const updateEntryStatus = async (id: string, status: string) => {
    try {
      const res = await API.patch(`/api/finance/transaction/${id}/status`, { status });
      // Update local state
      setEntries(prev => prev.map(e => e._id === id ? { ...e, approvalStatus: status as any } : e));
      return res.data;
    } catch (error: any) {
       console.error(error);
       Alert.alert("Error", "Failed to update status");
    }
  };

  return {
    entries,
    loading,
    fetchDriverLedger,
    fetchDriverSummary,
    addLedgerEntry,
    updateEntryStatus
  };
}
