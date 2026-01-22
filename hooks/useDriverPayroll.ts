import { useCallback, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

export interface DriverPayroll {
  payroll_id: number;
  driver_id: number;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: "pending" | "paid";
  created_at: string;
}

export function useDriverPayroll() {
  const [payrolls, setPayrolls] = useState<DriverPayroll[]>([]);
  const [loading, setLoading] = useState(false);

  // Create payroll
  const createPayroll = async (data: {
    driver_id: number;
    period_start: string;
    period_end: string;
  }) => {
    try {
      const res = await API.post(`/api/driver-payroll`, data);
      setPayrolls((prev) => [res.data, ...prev]);
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to create payroll"
      );
      throw error;
    }
  };

  // Fetch payroll history for driver
  const fetchPayrollByDriver = useCallback(async (driver_id: number) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/driver-payroll/driver/${driver_id}`);
      setPayrolls(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load payroll history");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark payroll paid
  const markPaid = async (payroll_id: number) => {
    try {
      const res = await API.put(`/api/driver-payroll/${payroll_id}/pay`);
      setPayrolls((prev) =>
        prev.map((p) =>
          p.payroll_id === payroll_id ? res.data : p
        )
      );
      return res.data;
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to mark payroll paid"
      );
      throw error;
    }
  };

  return {
    payrolls,
    loading,
    createPayroll,
    fetchPayrollByDriver,
    markPaid,
  };
}
