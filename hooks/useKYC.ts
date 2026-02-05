import { useState } from 'react';
import API from '../app/api/axiosInstance';

export function useKYC() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyPAN = async (pan: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/api/kyc/pan', { pan });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'PAN Verification Failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyGSTIN = async (gstin: string, businessName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/api/kyc/gstin', { gstin, business_name: businessName });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'GSTIN Verification Failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    verifyPAN,
    verifyGSTIN,
  };
}
