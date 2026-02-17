import { useCallback, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";
import { FinanceTransaction } from "../types/entity";

export default function useFinance() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });

  /* ---------------- FETCH TRANSACTIONS ---------------- */
  const fetchTransactions = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true);
      // Construct query params
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.category) params.append("category", filters.category);
      if (filters.sourceModule) params.append("sourceModule", filters.sourceModule);
      if (filters.direction) params.append("direction", filters.direction);
      
      const res = await API.get(`/api/finance/transactions?${params.toString()}`);
      setTransactions(res.data);
      return res.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------- FETCH SUMMARY ---------------- */
  const fetchSummary = useCallback(async (period: 'month' | 'week' | 'year' = 'month') => {
    try {
      setLoading(true);
      // Can add query params for dates if backend supports
      const res = await API.get(`/api/finance/summary`);
      // Backend returns { totalIncome, totalExpense, netProfit }
      const data = res.data;
      setSummary({
          income: data.totalIncome || 0,
          expense: data.totalExpense || 0,
          net: data.netProfit || 0
      });
      return data;
    } catch (error) {
      console.error(error);
      // Silent fail or alert?
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------- ADD EXPENSES ---------------- */
  const addRunningExpense = async (data: any) => {
    try {
        setLoading(true);
        const res = await API.post("/api/finance/running-expense", data);
        return res.data;
    } catch (error: any) {
        console.error(error);
        Alert.alert("Error", error.response?.data?.error || "Failed to add expense");
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const addMaintenanceExpense = async (data: any) => {
    try {
        setLoading(true);
        const res = await API.post("/api/finance/maintenance-expense", data);
        return res.data;
    } catch (error: any) {
        console.error(error);
        Alert.alert("Error", error.response?.data?.error || "Failed to add maintenance");
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const addTransaction = async (data: any) => {
    try {
      setLoading(true);
      const res = await API.post("/api/finance/transaction", data);
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.error || "Failed to add transaction");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    transactions,
    summary,
    fetchTransactions,
    fetchSummary,
    addRunningExpense,
    addMaintenanceExpense,
    addTransaction
  };
}
