import { useCallback, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";
import type { Bilty, BiltyParty } from "../types/entity";
import { normalizeAddressInput } from "../lib/utils";

export type CompanyProfile = {
  name: string;
  address: string;
  address_line_1?: string;
  address_line_2?: string;
  state?: string;
  pincode?: string;
  logo_url?: string;
  phone: string;
  pan: string;
  gstin: string;
};

export type BiltyPayload = {
  trip?: string;
  bilty_number?: string;
  bilty_date?: string;
  status?: "draft" | "generated" | "finalized" | "cancelled";
  consignor_party?: string;
  consignee_party?: string;
  consignor: {
    name?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
    pan?: string;
  };
  consignee: {
    name?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
    pan?: string;
  };
  shipment?: {
    from_location?: string;
    to_location?: string;
    vehicle_number?: string;
    driver_name?: string;
    driver_phone?: string;
    eway_bill_no?: string;
    invoice_no?: string;
    invoice_value?: number;
    shipment_date?: string;
  };
  goods_rows?: {
    sr_no: number;
    description?: string;
    quantity?: number;
    unit?: string;
    actual_weight?: number;
    rate?: number;
    total?: number;
  }[];
  charges?: {
    freight?: number;
    loading?: number;
    unloading?: number;
    other?: number;
    total?: number;
    advance?: number;
    balance?: number;
  };
  freight_paid_by?: "consignor" | "consignee";
  payment_type?: "to_pay" | "paid" | "billed";
  gst_paid_by?: "consignor" | "consignee";
  gst_percentage?: 0 | 5 | 18;
  gst_type?: "gst" | "igst";
  insurance?: {
    policy_number?: string;
    insurer_name?: string;
    coverage_amount?: number;
    expiry_date?: string;
  };
  signature_url?: string;
  notes?: string;
};

export function useBilty() {
  const [bilties, setBilties] = useState<Bilty[]>([]);
  const [parties, setParties] = useState<BiltyParty[]>([]);
  const [loading, setLoading] = useState(false);

  const normalizeBiltyPayload = (data: BiltyPayload): BiltyPayload => {
    return {
      ...data,
      consignor: {
        ...data.consignor,
        address: normalizeAddressInput(data.consignor?.address || ""),
      },
      consignee: {
        ...data.consignee,
        address: normalizeAddressInput(data.consignee?.address || ""),
      },
    };
  };

  const fetchBilties = useCallback(async (params?: { status?: string; tripId?: string }) => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (params?.status) query.append("status", params.status);
      if (params?.tripId) query.append("tripId", params.tripId);
      const url = `/api/bilties${query.toString() ? `?${query.toString()}` : ""}`;
      const res = await API.get(url);
      setBilties(res.data);
      return res.data as Bilty[];
    } catch (error) {
      console.error("fetchBilties failed", error);
      Alert.alert("Error", "Failed to load bilties");
      return [] as Bilty[];
    } finally {
      setLoading(false);
    }
  }, []);

  const getBiltyById = async (id: string) => {
    try {
      const res = await API.get(`/api/bilties/${id}`);
      return res.data as Bilty;
    } catch (error) {
      console.error("getBiltyById failed", error);
      Alert.alert("Error", "Failed to load bilty details");
      throw error;
    }
  };

  const getBiltyByTrip = async (tripId: string) => {
    try {
      const res = await API.get(`/api/bilties/trip/${tripId}`);
      return res.data as Bilty;
    } catch {
      return null;
    }
  };

  const createBilty = async (data: BiltyPayload) => {
    try {
      const res = await API.post(`/api/bilties`, normalizeBiltyPayload(data));
      return res.data as Bilty;
    } catch (error: any) {
      console.error("createBilty failed", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to create bilty");
      throw error;
    }
  };

  const updateBilty = async (id: string, data: Partial<BiltyPayload>) => {
    try {
      const normalized: Partial<BiltyPayload> = {
        ...data,
        consignor: data.consignor
          ? { ...data.consignor, address: normalizeAddressInput(data.consignor.address || "") }
          : data.consignor,
        consignee: data.consignee
          ? { ...data.consignee, address: normalizeAddressInput(data.consignee.address || "") }
          : data.consignee,
      };
      const res = await API.put(`/api/bilties/${id}`, normalized);
      return res.data as Bilty;
    } catch (error: any) {
      console.error("updateBilty failed", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update bilty");
      throw error;
    }
  };

  const deleteBilty = async (id: string) => {
    try {
      await API.delete(`/api/bilties/${id}`);
      setBilties((prev) => prev.filter((x) => x._id !== id));
    } catch (error: any) {
      console.error("deleteBilty failed", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to delete bilty");
      throw error;
    }
  };

  const saveDraft = async (data: BiltyPayload, id?: string) => {
    const payload = { ...data, status: "draft" as const };
    if (id) return updateBilty(id, payload);
    return createBilty(payload);
  };

  const getCompanyProfile = async () => {
    try {
      const res = await API.get("/api/bilties/company-profile");
      return res.data as CompanyProfile;
    } catch (error) {
      console.error("getCompanyProfile failed", error);
      return {
        name: "",
        address: "",
        address_line_1: "",
        address_line_2: "",
        state: "",
        pincode: "",
        logo_url: "",
        phone: "",
        pan: "",
        gstin: "",
      };
    }
  };

  const updateCompanyProfile = async (payload: CompanyProfile) => {
    try {
      const res = await API.put("/api/bilties/company-profile", {
        ...payload,
        address: normalizeAddressInput(payload.address),
      });
      return res.data as CompanyProfile;
    } catch (error: any) {
      console.error("updateCompanyProfile failed", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update company profile");
      throw error;
    }
  };

  const gstLookup = async (gstin: string, business_name?: string) => {
    try {
      const res = await API.post("/api/bilties/gst-lookup", { gstin, business_name });
      return res.data;
    } catch (error: any) {
      console.error("gstLookup failed", error);
      throw error;
    }
  };

  const fetchParties = useCallback(async (type?: "consignor" | "consignee" | "both") => {
    try {
      const url = type ? `/api/bilties/parties?type=${type}` : "/api/bilties/parties";
      const res = await API.get(url);
      setParties(res.data);
      return res.data as BiltyParty[];
    } catch (error) {
      console.error("fetchParties failed", error);
      Alert.alert("Error", "Failed to load parties");
      return [] as BiltyParty[];
    }
  }, []);

  const createParty = async (payload: Partial<BiltyParty>) => {
    try {
      const res = await API.post("/api/bilties/parties", {
        ...payload,
        address: normalizeAddressInput(payload.address || ""),
      });
      setParties((prev) => [res.data, ...prev]);
      return res.data as BiltyParty;
    } catch (error: any) {
      console.error("createParty failed", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to create party");
      throw error;
    }
  };

  const updateParty = async (id: string, payload: Partial<BiltyParty>) => {
    try {
      const res = await API.put(`/api/bilties/parties/${id}`, {
        ...payload,
        address: normalizeAddressInput(payload.address || ""),
      });
      setParties((prev) => prev.map((p) => (p._id === id ? res.data : p)));
      return res.data as BiltyParty;
    } catch (error: any) {
      console.error("updateParty failed", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update party");
      throw error;
    }
  };

  const deleteParty = async (id: string) => {
    try {
      await API.delete(`/api/bilties/parties/${id}`);
      setParties((prev) => prev.filter((p) => p._id !== id));
    } catch (error: any) {
      console.error("deleteParty failed", error);
      Alert.alert("Error", error.response?.data?.error || "Failed to delete party");
      throw error;
    }
  };

  const getQuickFillData = async () => {
    try {
      const res = await API.get("/api/bilties/quick-fill");
      return res.data as { clients: any[]; recent_parties: BiltyParty[] };
    } catch (error) {
      console.error("getQuickFillData failed", error);
      return { clients: [], recent_parties: [] };
    }
  };

  return {
    bilties,
    parties,
    loading,
    fetchBilties,
    getBiltyById,
    getBiltyByTrip,
    createBilty,
    updateBilty,
    deleteBilty,
    saveDraft,
    getCompanyProfile,
    updateCompanyProfile,
    gstLookup,
    fetchParties,
    createParty,
    updateParty,
    deleteParty,
    getQuickFillData,
  };
}
