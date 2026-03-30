import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  findNodeHandle,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Print from "expo-print";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SvgXml } from "react-native-svg";
import Signature from "react-native-signature-canvas";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import API from "../api/axiosInstance";
import BottomSheet from "../../components/BottomSheet";
import EditTripModal from "../../components/EditTripModal";
import { DatePickerModal } from "../../components/DatePickerModal";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useBilty, type CompanyProfile } from "../../hooks/useBiltyModule";
import { useUser } from "../../hooks/useUser";
import useClients from "../../hooks/useClient";
import useDrivers from "../../hooks/useDriver";
import useLocations from "../../hooks/useLocation";
import useTrucks from "../../hooks/useTruck";
import { formatPhoneNumber, normalizeGstinNumber, normalizePanNumber, normalizePhoneInput } from "../../lib/utils";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatLrNumber = (value: string) => {
  const cleaned = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/^LRN?/, "")
    .replace(/^-+/, "");
  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return "LRN-";
  return `LRN-${digits.slice(0, 8).padStart(5, "0")}`;
};

type PartyForm = {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  pan: string;
  gstin_details?: any;
  party_id?: string;
};

type NewPartyForm = {
  name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
};

type GoodsRow = {
  sr_no: number;
  description: string;
  quantity: string;
  unit: string;
  actual_weight: string;
  rate: string;
  total: string;
};

const emptyParty: PartyForm = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  pan: "",
};

const toNumber = (value: string) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};

const UNIT_OPTIONS = ["Kgs", "Quintle", "Tonnes"] as const;
const GST_PERCENTAGE_OPTIONS = ["0", "5", "18"] as const;

const splitAddressFields = (address: string) => {
  const text = String(address || "").trim();
  if (!text) {
    return {
      address_line_1: "",
      address_line_2: "",
      state: "",
      pincode: "",
    };
  }

  const compact = text.replace(/\s+/g, " ").trim();
  const pincodeMatch = compact.match(/(\d{6})(?!.*\d)/);
  const pincode = pincodeMatch?.[1] || "";
  const withoutPincode = pincode ? compact.replace(new RegExp(`${pincode}$`), "").trim().replace(/[,-]\s*$/, "") : compact;
  const parts = withoutPincode
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const state = parts.length > 0 ? parts[parts.length - 1] : "";
  const line1 = parts.length > 0 ? parts[0] : withoutPincode;
  const line2 = parts.length > 2 ? parts.slice(1, -1).join(", ") : parts.length === 2 ? "" : "";

  return {
    address_line_1: line1,
    address_line_2: line2,
    state,
    pincode,
  };
};

const buildCompanyAddress = (profile: Partial<CompanyProfile>) => {
  const parts = [
    profile.address_line_1,
    profile.address_line_2,
    profile.state,
    profile.pincode,
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  return parts.join(", ");
};

const normalizeCompanyProfile = (profile?: Partial<CompanyProfile>): CompanyProfile => {
  const existingAddress = String(profile?.address || "").trim();
  const split = splitAddressFields(existingAddress);
  const merged: CompanyProfile = {
    name: String(profile?.name || ""),
    address: existingAddress,
    address_line_1: String(profile?.address_line_1 || split.address_line_1 || ""),
    address_line_2: String(profile?.address_line_2 || split.address_line_2 || ""),
    state: String(profile?.state || split.state || ""),
    pincode: String(profile?.pincode || split.pincode || ""),
    logo_url: String(profile?.logo_url || ""),
    phone: normalizePhoneInput(String(profile?.phone || "")),
    pan: normalizePanNumber(String(profile?.pan || "")),
    gstin: normalizeGstinNumber(String(profile?.gstin || "")),
  };
  return {
    ...merged,
    address: buildCompanyAddress(merged),
  };
};

export default function BiltyWizardScreen() {
  const { tripId, biltyId } = useLocalSearchParams<{ tripId?: string; biltyId?: string }>();
  const router = useRouter();
  const { theme, colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const isDark = theme === "dark";
  const { user, uploadProfilePicture, refreshUser: refreshUserProfile } = useUser();

  const {
    parties,
    fetchParties,
    getBiltyById,
    createBilty,
    updateBilty,
    saveDraft,
    gstLookup,
    getCompanyProfile,
    updateCompanyProfile,
    createParty,
  } = useBilty();
  const { clients, fetchClients } = useClients();
  const { drivers, fetchDrivers } = useDrivers();
  const { trucks, fetchTrucks } = useTrucks();
  const { locations, fetchLocations } = useLocations();

  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [lrNumber, setLrNumber] = useState("LRN-00001");
  const [partyEditorTarget, setPartyEditorTarget] = useState<"consignor" | "consignee" | null>(null);
  const [partyClientSearch, setPartyClientSearch] = useState("");
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [isTripPreviewModalVisible, setIsTripPreviewModalVisible] = useState(false);
  const [isTripDetailsModalVisible, setIsTripDetailsModalVisible] = useState(false);
  const [isInsuranceModalVisible, setIsInsuranceModalVisible] = useState(false);
  const [isSignaturePadVisible, setIsSignaturePadVisible] = useState(false);
  const [isGoodsModalVisible, setIsGoodsModalVisible] = useState(false);
  const [isUnitDropdownVisible, setIsUnitDropdownVisible] = useState(false);
  const [editingGoodsIndex, setEditingGoodsIndex] = useState<number>(0);
  const [showLrDatePicker, setShowLrDatePicker] = useState(false);
  const [lrDatePickerValue, setLrDatePickerValue] = useState<Date>(new Date());
  const [showInsuranceDatePicker, setShowInsuranceDatePicker] = useState(false);
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<Date>(new Date());
  const signatureCanvasRef = useRef<any>(null);
  const [pendingSignatureSave, setPendingSignatureSave] = useState(false);
  const wizardScrollRef = useRef<any>(null);
  const [linkedTrip, setLinkedTrip] = useState<any>(null);
  const [partyDraft, setPartyDraft] = useState<PartyForm>({ ...emptyParty });
  const [generatedId, setGeneratedId] = useState<string>(String(biltyId || ""));
  const [showEditOverview, setShowEditOverview] = useState<boolean>(Boolean(biltyId));

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(normalizeCompanyProfile());

  const [consignor, setConsignor] = useState<PartyForm>({ ...emptyParty });
  const [consignee, setConsignee] = useState<PartyForm>({ ...emptyParty });

  const [shipment, setShipment] = useState({
    from_location: "",
    to_location: "",
    vehicle_number: "",
    driver_name: "",
    driver_phone: "",
    eway_bill_no: "",
    invoice_no: "",
    invoice_value: "",
    shipment_date: new Date().toISOString().split("T")[0],
  });

  const [goodsRows, setGoodsRows] = useState<GoodsRow[]>([
    {
      sr_no: 1,
      description: "",
      quantity: "",
      unit: "Tonnes",
      actual_weight: "",
      rate: "",
      total: "",
    },
  ]);

  const [charges, setCharges] = useState({
    freight: "",
    loading: "",
    unloading: "",
    other: "",
    total: "",
    advance: "",
    balance: "",
  });

  const [paymentType, setPaymentType] = useState<"to_pay" | "paid" | "billed">("to_pay");
  const [freightPaidBy, setFreightPaidBy] = useState<"consignor" | "consignee">("consignor");
  const [gstPaidBy, setGstPaidBy] = useState<"consignor" | "consignee">("consignor");
  const [gstPercentage, setGstPercentage] = useState<"0" | "5" | "18">("0");
  const [gstType, setGstType] = useState<"gst" | "igst">("gst");
  const [insurance, setInsurance] = useState({
    policy_number: "",
    insurer_name: "",
    coverage_amount: "",
    expiry_date: "",
  });
  const [signatureUrl, setSignatureUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [newPartyForm, setNewPartyForm] = useState<NewPartyForm>({
    name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
  });

  const stepTitle = useMemo(() => {
    return [
      "Company Profile",
      "LR & Consignor Consignee Details",
      "Load & Trip Details",
      "Insurance & Signature",
    ][step - 1];
  }, [step]);

  const mapPartyFromGST = (result: any): PartyForm => {
    const data = result?.data || result || {};
    return {
      name: data.trade_name_of_business || data.legal_name_of_business || "",
      contact_person: "",
      phone: normalizePhoneInput(data.primary_mobile || ""),
      email: data.primary_email || "",
      address: data.principal_place_address || "",
      gstin: normalizeGstinNumber(data.gstin || data.GSTIN || ""),
      pan: normalizePanNumber(data.pan_number || ""),
      gstin_details: data,
    };
  };

  const loadInitial = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchClients(), fetchDrivers(), fetchTrucks(), fetchLocations(), fetchParties()]);

      const profile = await getCompanyProfile();

      setCompanyProfile(normalizeCompanyProfile(profile));

      if (tripId) {
        const trip = (await API.get(`/api/trips/${tripId}`)).data;
        setLinkedTrip(trip);
        const getLocationName = (value: any) => {
          const id = typeof value === "object" ? value?._id : value;
          const found = locations.find((l) => String(l._id) === String(id));
          return found?.location_name || (typeof value === "object" ? value?.location_name : "") || "";
        };
        const getTruck = (value: any) => {
          const id = typeof value === "object" ? value?._id : value;
          const found = trucks.find((t) => String(t._id) === String(id));
          return found?.registration_number || (typeof value === "object" ? value?.registration_number : "") || "";
        };
        const getDriver = (value: any) => {
          const id = typeof value === "object" ? value?._id : value;
          const found = drivers.find((d) => String(d._id) === String(id));
          return {
            name: found?.driver_name || found?.name || (typeof value === "object" ? value?.driver_name || value?.name : "") || "",
            phone: found?.contact_number || found?.phone || (typeof value === "object" ? value?.contact_number || value?.phone : "") || "",
          };
        };
        const d = getDriver(trip.driver);

        setShipment((prev) => ({
          ...prev,
          from_location: getLocationName(trip.start_location),
          to_location: getLocationName(trip.end_location),
          vehicle_number: getTruck(trip.truck),
          driver_name: d.name,
          driver_phone: d.phone,
        }));

        const clientId = typeof trip.client === "object" ? trip.client?._id : trip.client;
        const client = clients.find((c) => String(c._id) === String(clientId));
        if (client) {
          const quick = {
            ...emptyParty,
            name: client.client_name || "",
            contact_person: client.contact_person_name || "",
            phone: client.contact_number || "",
            email: client.email_address || "",
            address: client.office_address || "",
            gstin: client.gstin || "",
            gstin_details: client.gstin_details,
          };
          setConsignee(quick);
        }
      }

      if (biltyId) {
        const existing = await getBiltyById(String(biltyId));
        setGeneratedId(String(existing._id));
        setLrNumber(String((existing as any)?.bilty_number || "LRN-00001"));
        setConsignor({ ...emptyParty, ...(existing.consignor as any) });
        setConsignee({ ...emptyParty, ...(existing.consignee as any) });
        setShipment((prev) => ({
          ...prev,
          ...(existing.shipment as any),
          invoice_value: String((existing.shipment as any)?.invoice_value || ""),
          shipment_date: String((existing.shipment as any)?.shipment_date || "").split("T")[0] || prev.shipment_date,
        }));
        setGoodsRows(
          (existing.goods_rows || []).length
            ? (existing.goods_rows || []).map((row) => ({
                sr_no: row.sr_no,
                description: row.description || "",
                quantity: String(row.quantity || ""),
                unit: row.unit || "Nos",
                actual_weight: String(row.actual_weight || ""),
                rate: String(row.rate || ""),
                total: String(row.total || ""),
              }))
            : goodsRows
        );
        setCharges({
          freight: String(existing.charges?.freight || ""),
          loading: String(existing.charges?.loading || ""),
          unloading: String(existing.charges?.unloading || ""),
          other: String(existing.charges?.other || ""),
          total: String(existing.charges?.total || ""),
          advance: String(existing.charges?.advance || ""),
          balance: String(existing.charges?.balance || ""),
        });
        setPaymentType(existing.payment_type || "to_pay");
        setFreightPaidBy(((existing as any)?.freight_paid_by === "consignee" ? "consignee" : "consignor"));
        setGstPaidBy(((existing as any)?.gst_paid_by === "consignee" ? "consignee" : "consignor"));
        setGstPercentage(((["0", "5", "18"] as const).includes(String((existing as any)?.gst_percentage || "0") as any)
          ? String((existing as any)?.gst_percentage || "0")
          : "0") as "0" | "5" | "18");
        setGstType(((existing as any)?.gst_type === "igst" ? "igst" : "gst"));
        setInsurance({
          policy_number: String((existing as any)?.insurance?.policy_number || ""),
          insurer_name: String((existing as any)?.insurance?.insurer_name || ""),
          coverage_amount: String((existing as any)?.insurance?.coverage_amount || ""),
          expiry_date: String((existing as any)?.insurance?.expiry_date || "").split("T")[0],
        });
        const parsedExpiry = String((existing as any)?.insurance?.expiry_date || "");
        const expiry = parsedExpiry ? new Date(parsedExpiry) : new Date();
        if (!isNaN(expiry.getTime())) setInsuranceExpiryDate(expiry);
        setSignatureUrl(String((existing as any)?.signature_url || ""));
        setNotes(existing.notes || "");
      } else {
        try {
          const all = await API.get("/api/bilties");
          const maxSeq = (all?.data || []).reduce((acc: number, item: any) => {
            const m = String(item?.bilty_number || "").match(/^LRN?-(\d+)$/i);
            if (!m) return acc;
            const seq = Number(m[1]);
            return Number.isFinite(seq) && seq > acc ? seq : acc;
          }, 0);
          setLrNumber(`LRN-${String(maxSeq + 1).padStart(5, "0")}`);
        } catch {
          setLrNumber("LRN-00001");
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error || "Failed to load bilty wizard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, biltyId]);

  useEffect(() => {
    setShowEditOverview(Boolean(biltyId));
  }, [biltyId]);

  const mapStoredPartyToForm = (party: any): PartyForm => ({
    ...emptyParty,
    party_id: String(party?._id || ""),
    name: String(party?.name || ""),
    contact_person: String(party?.contact_person || ""),
    phone: normalizePhoneInput(String(party?.phone || "")),
    email: String(party?.email || ""),
    address: String(party?.address || ""),
    gstin: normalizeGstinNumber(String(party?.gstin || "")),
    pan: normalizePanNumber(String(party?.pan || "")),
    gstin_details: party?.gstin_details,
  });

  const openCreateClient = () => {
    setNewPartyForm({
      name: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      state: "",
      pincode: "",
      gstin: "",
      pan: "",
    });
    setIsClientModalVisible(true);
  };

  const openPartyEditor = (target: "consignor" | "consignee") => {
    const current = target === "consignor" ? consignor : consignee;
    void fetchParties();
    setPartyDraft({ ...emptyParty, ...current });
    setPartyEditorTarget(target);
  };

  const closePartyEditor = () => {
    setPartyEditorTarget(null);
    setPartyClientSearch("");
    setPartyDraft({ ...emptyParty });
  };

  const ensurePartySaved = async (party: PartyForm, type: "consignor" | "consignee") => {
    if (party.party_id) return party.party_id;
    if (!party.name) return undefined;
    try {
      const saved = await createParty({
        type: "both",
        name: party.name,
        contact_person: party.contact_person,
        phone: party.phone,
        email: party.email,
        address: party.address,
        gstin: party.gstin,
        pan: party.pan,
        gstin_details: party.gstin_details,
        quick_fill_source: "manual",
      });
      return String(saved._id || "");
    } catch {
      // Party save failure should not block bilty generation.
      return undefined;
    }
  };

  const buildPayload = async (status: "draft" | "generated") => {
    const consignorId = await ensurePartySaved(consignor, "consignor");
    const consigneeId = await ensurePartySaved(consignee, "consignee");

    return {
      trip: tripId ? String(tripId) : undefined,
      bilty_number: lrNumber,
      bilty_date: shipment.shipment_date,
      status,
      consignor_party: consignorId,
      consignee_party: consigneeId,
      consignor: {
        name: consignor.name,
        contact_person: consignor.contact_person,
        phone: consignor.phone,
        email: consignor.email,
        address: consignor.address,
        gstin: consignor.gstin,
        pan: consignor.pan,
      },
      consignee: {
        name: consignee.name,
        contact_person: consignee.contact_person,
        phone: consignee.phone,
        email: consignee.email,
        address: consignee.address,
        gstin: consignee.gstin,
        pan: consignee.pan,
      },
      shipment: {
        ...shipment,
        invoice_value: toNumber(shipment.invoice_value),
        shipment_date: shipment.shipment_date,
      },
      goods_rows: goodsRows.map((row, idx) => ({
        sr_no: idx + 1,
        description: row.description,
        quantity: toNumber(row.quantity),
        unit: row.unit,
        actual_weight: toNumber(row.actual_weight),
        rate: toNumber(row.rate),
        total: toNumber(row.total),
      })),
      charges: {
        freight: toNumber(charges.freight),
        loading: toNumber(charges.loading),
        unloading: toNumber(charges.unloading),
        other: toNumber(charges.other),
        total: toNumber(charges.total),
        advance: toNumber(charges.advance),
        balance: toNumber(charges.balance),
      },
      freight_paid_by: freightPaidBy,
      payment_type: paymentType,
      gst_paid_by: gstPaidBy,
      gst_percentage: toNumber(gstPercentage),
      gst_type: gstType,
      insurance: {
        policy_number: insurance.policy_number,
        insurer_name: insurance.insurer_name,
        coverage_amount: toNumber(insurance.coverage_amount),
        expiry_date: insurance.expiry_date || undefined,
      },
      signature_url: signatureUrl || undefined,
      notes,
    };
  };

  const buildBiltyHtml = (doc: any) => {
    const partyName = companyProfile.name || "TRUCKSARTHI";
    const partyGstin = companyProfile.gstin || "-";
    const partyAddress = companyProfile.address || "-";
    const partyPhone = companyProfile.phone ? formatPhoneNumber(companyProfile.phone) : "-";
    const partyLogo = companyProfile.logo_url || "";
    const lrNo = doc?.bilty_number || String(doc?._id || "-").slice(-8).toUpperCase();
    const lrDate = String(doc?.bilty_date || new Date()).split("T")[0];

    const money = (value: number) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    const rows = doc?.goods_rows || [];

    const buildCopyPage = (copyLabel: string) => `
      <div class="page">
        <div class="copy-pill">${escapeHtml(copyLabel)}</div>
        <div class="sheet">
          <div class="header">
            ${partyLogo ? `<img class="logo-box logo-image" src="${escapeHtml(partyLogo)}" />` : `<div class="logo-box">TS</div>`}
            <div class="company-center">
              <div class="brand">${escapeHtml(partyName)}</div>
              <div class="sub">${escapeHtml(partyAddress)}</div>
            </div>
            <div class="company-right">
              <div><strong>Phone:</strong> ${escapeHtml(partyPhone)}</div>
              <div><strong>GSTIN:</strong> ${escapeHtml(partyGstin)}</div>
            </div>
          </div>

          <div class="top-grid">
            <div class="box"><div class="box-title">Freight Paid By</div><div>${escapeHtml(doc?.freight_paid_by || "consignor")}</div></div>
            <div class="box"><div class="box-title">GST Paid By</div><div>${escapeHtml(doc?.gst_paid_by || "consignor")}</div></div>
            <div class="box"><div class="box-title">GST %</div><div>${escapeHtml(String(doc?.gst_percentage ?? 0))}%</div></div>
            <div class="box"><div class="box-title">GST Type</div><div>${escapeHtml((doc?.gst_type || "gst") === "igst" ? "IGST" : "CGST + SGST")}</div></div>
            <div class="box"><div class="box-title">Insurance</div><div>${doc?.insurance?.policy_number ? `${escapeHtml(doc?.insurance?.insurer_name || "-")} â€¢ ${escapeHtml(doc?.insurance?.policy_number || "-")}` : "Not insured"}</div><div>${doc?.insurance?.coverage_amount ? `Coverage: ₹ ${money(doc?.insurance?.coverage_amount || 0)}` : ""}</div></div>
            <div class="box"><div class="box-title">LR Details</div><div><strong>LR No:</strong> ${escapeHtml(lrNo)}</div><div><strong>Date:</strong> ${escapeHtml(lrDate)}</div><div><strong>Payment:</strong> ${escapeHtml(doc?.payment_type || "to_pay")}</div></div>
          </div>

          <div class="party-row">
            <div class="party-block"><div class="line-title">Consignor</div><div>${escapeHtml(doc?.consignor?.name || "-")}</div><div class="muted">${escapeHtml(doc?.consignor?.address || "-")}</div></div>
            <div class="party-block"><div class="line-title">Consignee</div><div>${escapeHtml(doc?.consignee?.name || "-")}</div><div class="muted">${escapeHtml(doc?.consignee?.address || "-")}</div></div>
          </div>

          <div class="route-box"><div><strong>From:</strong> ${escapeHtml(doc?.shipment?.from_location || "-")}</div><div><strong>To:</strong> ${escapeHtml(doc?.shipment?.to_location || "-")}</div></div>

          <table class="items"><thead><tr><th>Sr No.</th><th>No. of Packets</th><th>Description</th><th>Actual Weight</th><th>Unit</th><th>Rate</th><th>Freight Amt</th></tr></thead><tbody>
          ${rows
            .map(
              (row: any, idx: number) =>
                `<tr><td class="center">${idx + 1}</td><td class="center">${row.quantity || "-"}</td><td>${escapeHtml(row.description || "-")}</td><td class="center">${row.actual_weight || "-"}</td><td class="center">${escapeHtml(row.unit || "Nos")}</td><td class="right">${money(row.rate || 0)}</td><td class="right">${money(row.total || 0)}</td></tr>`
            )
            .join("")}
          </tbody></table>

          <div class="amount-line"><strong>To Pay:</strong> ₹ ${money(doc?.charges?.balance || 0)}</div>
          <div class="warning">Company is not responsible for leakages & thefts</div>

          <div class="footer-grid"><div class="terms"><div class="line-title">Terms & Conditions</div><div>1. This is a digitally generated Bilty/LR copy.</div></div><div class="signature"><div>Certified that the particulars given above are true and correct.</div><div style="margin-top:20px;"><strong>For, ${escapeHtml(partyName)}</strong></div>${doc?.signature_url ? `<img src="${escapeHtml(doc.signature_url)}" style="height:40px; margin-top:8px; object-fit:contain;" />` : ""}<div class="sign-line">Signature</div></div></div>
        </div>
      </div>
    `;

    return `
<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
@page { size: A4; margin: 8mm; }
body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #111; font-size: 10px; background: #fff; }
.page { width: 100%; }
.page-break { page-break-before: always; }
.copy-pill { display: inline-block; border: 1px solid #333; border-radius: 999px; padding: 4px 10px; font-weight: 700; margin: 4px 0 8px; }
.sheet { border: 2px solid #111; padding: 10px; }
.header { display: grid; grid-template-columns: 60px 1fr 220px; gap: 10px; align-items: center; border-bottom: 1px solid #111; padding-bottom: 8px; }
.logo-box { width: 52px; height: 52px; border: 1px solid #111; display: flex; align-items: center; justify-content: center; font-weight: 800; }
.logo-image { object-fit: cover; }
.company-center { text-align: center; }
.brand { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
.sub { font-size: 9px; color: #333; margin-top: 4px; }
.company-right { font-size: 9px; line-height: 1.4; }
.top-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 8px; }
.box { border: 1px solid #111; border-radius: 6px; padding: 8px; min-height: 56px; }
.box-title { font-weight: 700; margin-bottom: 6px; }
.party-row { margin-top: 10px; border-top: 1px solid #111; border-bottom: 1px solid #111; }
.party-block { padding: 6px 2px; border-bottom: 1px solid #999; }
.party-block:last-child { border-bottom: 0; }
.line-title { font-weight: 700; margin-bottom: 4px; }
.muted { color: #333; margin-top: 2px; }
.route-box { margin-top: 8px; border: 1px solid #111; border-radius: 6px; padding: 6px 8px; display: flex; gap: 22px; }
.items { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
.items th, .items td { border: 1px solid #111; padding: 5px 4px; font-size: 9px; }
.items th { background: #f5f5f5; }
.center { text-align: center; }
.right { text-align: right; }
.amount-line { margin-top: 8px; text-align: center; }
.warning { margin-top: 8px; border: 1px solid #111; border-radius: 6px; padding: 8px; text-align: center; }
.footer-grid { margin-top: 10px; display: grid; grid-template-columns: 2fr 1fr; border: 1px solid #111; }
.terms { padding: 8px; min-height: 82px; border-right: 1px solid #111; }
.signature { padding: 8px; min-height: 82px; position: relative; }
.sign-line { position: absolute; right: 8px; bottom: 8px; }
</style></head><body>${buildCopyPage("Consignor LR")}<div class="page-break"></div>${buildCopyPage("Consignee LR")}</body></html>`;
  };

  const createPdfUri = async (doc: any) => {
    const html = buildBiltyHtml(doc);
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  };

  const persistCompanyProfile = async (showSuccess = false) => {
    try {
      setLoading(true);
      const payload = {
        ...companyProfile,
        address: buildCompanyAddress(companyProfile),
        logo_url: companyProfile.logo_url || "",
      };
      const updated = await updateCompanyProfile(payload);
      setCompanyProfile(normalizeCompanyProfile(updated));
      if (showSuccess) {
        Alert.alert("Saved", "Company profile saved.");
      }
      return true;
    } catch {
      // handled in hook
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyProfileFromGST = async () => {
    if (!companyProfile.gstin || companyProfile.gstin.length < 15) {
      Alert.alert("Invalid GSTIN", "Please enter a valid GSTIN.");
      return;
    }

    try {
      setLoading(true);
      const result = await gstLookup(companyProfile.gstin, companyProfile.name);
      const mapped = mapPartyFromGST(result);
      const split = splitAddressFields(mapped.address || "");
      setCompanyProfile((prev) => {
        const next: CompanyProfile = {
          ...prev,
          name: mapped.name || prev.name,
          phone: mapped.phone || prev.phone,
          pan: mapped.pan || prev.pan,
          gstin: mapped.gstin || prev.gstin,
          address_line_1: split.address_line_1 || prev.address_line_1 || "",
          address_line_2: split.address_line_2 || prev.address_line_2 || "",
          state:
            String(mapped.gstin_details?.state_name || split.state || prev.state || ""),
          pincode:
            String(mapped.gstin_details?.pincode || split.pincode || prev.pincode || ""),
          address: prev.address,
        };
        return {
          ...next,
          address: buildCompanyAddress(next),
        };
      });
      Alert.alert("GST fetched", "Company details fetched successfully.");
    } catch (err: any) {
      Alert.alert("GST fetch failed", err?.response?.data?.message || "Unable to fetch GST details.");
    } finally {
      setLoading(false);
    }
  };

  const useCompanyProfilePicture = () => {
    const profilePic = String(user?.profile_picture_url || "").trim();
    if (!profilePic) {
      Alert.alert("No profile picture", "Please upload your company profile picture first.");
      return;
    }
    setCompanyProfile((prev) => ({ ...prev, logo_url: profilePic }));
  };

  const handleUploadCompanyLogo = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Please allow photo access to upload logo.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (res.canceled || !res.assets?.length) return;

      setLoading(true);
      const file = res.assets[0];
      const uploaded = await uploadProfilePicture(file);
      const logoUrl = String(uploaded?.file_url || uploaded?.profile_picture_url || file.uri);

      setCompanyProfile((prev) => ({ ...prev, logo_url: logoUrl }));
      await refreshUserProfile();
    } catch {
      Alert.alert("Upload failed", "Unable to upload logo right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSignature = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Please allow photo access to upload signature.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (res.canceled || !res.assets?.length) return;

      setLoading(true);
      const file = res.assets[0];
      const uploaded = await uploadProfilePicture(file);
      const url = String(uploaded?.file_url || uploaded?.profile_picture_url || file.uri);
      setSignatureUrl(url);
    } catch {
      Alert.alert("Upload failed", "Unable to upload signature right now.");
    } finally {
      setLoading(false);
    }
  };

  const clearSignatureCanvas = () => {
    setPendingSignatureSave(false);
    signatureCanvasRef.current?.clearSignature();
  };

  const handleSignatureOK = (signature: string) => {
    if (!signature) {
      Alert.alert("No signature", "Please draw your signature first.");
      setPendingSignatureSave(false);
      return;
    }
    setSignatureUrl(signature);
    setPendingSignatureSave(false);
    setIsSignaturePadVisible(false);
  };

  const handleSignatureEmpty = () => {
    if (pendingSignatureSave) {
      Alert.alert("No signature", "Please draw your signature first.");
      setPendingSignatureSave(false);
    }
  };

  const saveDrawnSignature = () => {
    setPendingSignatureSave(true);
    signatureCanvasRef.current?.readSignature();
  };

  const isSvgSignature = signatureUrl.startsWith("data:image/svg+xml");
  const signatureSvgXml = isSvgSignature ? decodeURIComponent(signatureUrl.split(",").slice(1).join(",")) : "";

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const payload = await buildPayload("draft");
      let saved: any;
      try {
        saved = generatedId ? await saveDraft(payload as any, generatedId) : await saveDraft(payload as any);
      } catch {
        // Fallback to create if update path fails.
        saved = await createBilty(payload as any);
      }
      setGeneratedId(String((saved as any)?._id || generatedId));
      Alert.alert("Draft saved", "Your bilty draft has been saved.");
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const payload = await buildPayload("generated");
      let saved: any;
      try {
        saved = generatedId
          ? await updateBilty(generatedId, payload as any)
          : await createBilty(payload as any);
      } catch {
        // If update/create path fails transiently, force create so generation can proceed.
        saved = await createBilty(payload as any);
      }

      const nextGeneratedId = String((saved as any)?._id || generatedId || "");
      setGeneratedId(nextGeneratedId);

      let generatedPdfUri = "";
      try {
        generatedPdfUri = await createPdfUri(saved);
      } catch {
        generatedPdfUri = "";
      }

      router.replace({
        pathname: "/(stack)/bilty-generated",
        params: {
          biltyId: nextGeneratedId,
          biltyNumber: String(saved?.bilty_number || ""),
          tripId: String(tripId || ""),
          uri: generatedPdfUri,
        },
      } as any);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const saved = await persistCompanyProfile();
      if (!saved) return;
    }

    if (step === 2) {
      if (!shipment.shipment_date) {
        Alert.alert("Missing Date", "LR date is required.");
        return;
      }
      if (!lrNumber || !/^LRN-\d{5,}$/.test(String(lrNumber).toUpperCase())) {
        Alert.alert("Invalid LR Number", "Please enter a valid LR number (example: LRN-00001).");
        return;
      }
    }

    setStep((prev) => Math.min(4, prev + 1));
  };

  const updateGoodsRow = (idx: number, key: keyof GoodsRow, value: string) => {
    setGoodsRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      const qty = toNumber(next[idx].quantity);
      const rate = toNumber(next[idx].rate);
      next[idx].total = qty && rate ? String(qty * rate) : next[idx].total;
      return next;
    });
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: isDark ? colors.input : colors.primaryForeground,
    color: colors.foreground,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 10,
  } as const;

  const cardStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: isDark ? colors.card : colors.primaryForeground,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOpacity: isDark ? 0 : 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: isDark ? 0 : 2,
  } as const;

  const renderPartyCard = (label: string, party: PartyForm, target: "consignor" | "consignee") => {
    const hasData = Boolean(party.name || party.phone || party.gstin);
    return (
      <TouchableOpacity
        onPress={() => openPartyEditor(target)}
        style={{
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: colors.border,
          borderRadius: 14,
          minHeight: 106,
          paddingHorizontal: 16,
          paddingVertical: 14,
          justifyContent: "center",
          backgroundColor: isDark ? colors.card : colors.primaryForeground,
          marginBottom: 14,
        }}
      >
        {hasData ? (
          <>
            <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16, marginBottom: 4 }}>{party.name || "-"}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 2 }}>Contact: {party.contact_person || "-"}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 2 }}>Phone: {party.phone ? formatPhoneNumber(party.phone) : "-"}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 2 }}>Email: {party.email || "-"}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 2 }}>GSTIN: {party.gstin || "-"}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>PAN: {party.pan || "-"}</Text>
          </>
        ) : (
          <Text style={{ color: colors.foreground, fontWeight: "700", textAlign: "center", fontSize: 20 }}>
            + <Text style={{ fontSize: 22 }}> </Text>Add {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const getId = (obj: any) => (typeof obj === "object" ? obj?._id : obj);
  const getLocationNameById = (value: any) => {
    const id = getId(value);
    const found = locations.find((l: any) => String(l._id) === String(id));
    return found?.location_name || (typeof value === "object" ? value?.location_name : "") || "";
  };
  const getTruckNameById = (value: any) => {
    const id = getId(value);
    const found = trucks.find((t: any) => String(t._id) === String(id));
    return found?.registration_number || (typeof value === "object" ? value?.registration_number : "") || "";
  };
  const getDriverNameById = (value: any) => {
    const id = getId(value);
    const found = drivers.find((d: any) => String(d._id) === String(id));
    return found?.driver_name || found?.name || (typeof value === "object" ? value?.driver_name || value?.name : "") || "";
  };
  const getClientNameById = (value: any) => {
    const id = getId(value);
    const found = clients.find((c: any) => String(c._id) === String(id));
    return found?.client_name || (typeof value === "object" ? value?.client_name : "") || "";
  };

  const previewTripCard = {
    date: linkedTrip?.trip_date ? String(linkedTrip.trip_date).split("T")[0] : shipment.shipment_date,
    totalCost: Number(charges.freight || 0) + Number(charges.other || 0),
    start: linkedTrip ? getLocationNameById(linkedTrip.start_location) : shipment.from_location,
    end: linkedTrip ? getLocationNameById(linkedTrip.end_location) : shipment.to_location,
    client: linkedTrip ? getClientNameById(linkedTrip.client) : (consignee.name || ""),
    truck: linkedTrip ? getTruckNameById(linkedTrip.truck) : shipment.vehicle_number,
    driver: linkedTrip ? getDriverNameById(linkedTrip.driver) : shipment.driver_name,
    tripCost: Number(charges.freight || 0),
    misc: Number(charges.other || 0),
    notes: String(linkedTrip?.notes || ""),
    publicId: String(linkedTrip?.public_id || ""),
  };

  const canGoNext = step < 4;
  const canGoBack = step > 1;

  const sectionDone = {
    company: Boolean(companyProfile.name || companyProfile.address || companyProfile.gstin || companyProfile.phone),
    lrParties: Boolean(lrNumber && (consignor.name || consignee.name)),
    loadTrip: Boolean(
      shipment.from_location ||
      shipment.to_location ||
      shipment.vehicle_number ||
      goodsRows.some((row) => row.description || row.quantity || row.total)
    ),
    insuranceSignature: Boolean(insurance.policy_number || signatureUrl),
  };

  const openSectionEditor = (targetStep: 1 | 2 | 3 | 4) => {
    setStep(targetStep);
    setShowEditOverview(false);
  };

  const handlePreviewFromOverview = async () => {
    const id = String(generatedId || biltyId || "");
    if (!id) {
      Alert.alert("Bilty not found", "Please save or generate bilty first.");
      return;
    }
    try {
      setLoading(true);
      const doc = await getBiltyById(id);
      const uri = await createPdfUri(doc);
      router.push({ pathname: "/(stack)/pdf-viewer", params: { uri, title: "LR Preview" } } as any);
    } catch {
      Alert.alert("Error", "Failed to open bilty preview.");
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewSection = (
    title: string,
    subtitle: string,
    buttonText: string,
    done: boolean,
    onPress: () => void
  ) => (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <Ionicons
          name={done ? "checkmark-circle" : "ellipse-outline"}
          size={20}
          color={done ? colors.success : colors.mutedForeground}
          style={{ marginTop: 2, marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 22 / 1.5 }}>{title}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
          <TouchableOpacity
            onPress={onPress}
            style={{
              marginTop: 10,
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: colors.primary,
              borderRadius: 10,
              paddingVertical: 9,
              paddingHorizontal: 14,
              backgroundColor: isDark ? colors.card : colors.primaryForeground,
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 13 }}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const openingOverlay = Boolean(
      partyEditorTarget ||
        isClientModalVisible ||
        isTripPreviewModalVisible ||
        isTripDetailsModalVisible ||
        isInsuranceModalVisible ||
        isSignaturePadVisible ||
        isGoodsModalVisible ||
        showLrDatePicker ||
        showInsuranceDatePicker
    );

    if (openingOverlay) Keyboard.dismiss();
  }, [
    partyEditorTarget,
    isClientModalVisible,
    isTripPreviewModalVisible,
    isTripDetailsModalVisible,
    isInsuranceModalVisible,
    isSignaturePadVisible,
    isGoodsModalVisible,
    showLrDatePicker,
    showInsuranceDatePicker,
  ]);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: isDark ? colors.background : colors.muted }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <KeyboardAwareScrollView
        ref={wizardScrollRef}
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={Platform.OS === "ios" ? 28 : 86}
        contentContainerStyle={{ padding: 16, paddingBottom: keyboardVisible ? 24 : 120 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        {showEditOverview ? (
          <>
            <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 29 / 1.3, marginBottom: 16 }}>Create Online Bilty</Text>

            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                backgroundColor: isDark ? colors.card : colors.primaryForeground,
              }}
            >
              {renderOverviewSection(
                "Company Details",
                "Your company address, contact & GST Number",
                "Edit Details",
                sectionDone.company,
                () => openSectionEditor(1)
              )}

              {renderOverviewSection(
                "LR & Consignor Consignee Details",
                "Name, Address & GST details of consignor & consignee",
                "Edit Consignor / Consignee",
                sectionDone.lrParties,
                () => openSectionEditor(2)
              )}

              {renderOverviewSection(
                "Load & Trip Details",
                "Add your load & trip details",
                "Edit Load",
                sectionDone.loadTrip,
                () => openSectionEditor(3)
              )}

              {renderOverviewSection(
                "Insurance & Signature",
                "Add insurance and waybill information",
                "Edit Insurance & Signature",
                sectionDone.insuranceSignature,
                () => openSectionEditor(4)
              )}
            </View>

            <TouchableOpacity
              disabled={loading}
              onPress={() => {
                void handlePreviewFromOverview();
              }}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 18,
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: "900", fontSize: 18 / 1.2 }}>
                {loading ? "Opening..." : "Preview Bilty"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
        <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 12, marginBottom: 4 }}>Step {step} of 4</Text>
        <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 22, marginBottom: 14 }}>{stepTitle}</Text>
        <View style={{ height: 4, borderRadius: 999, backgroundColor: isDark ? colors.input : colors.muted, marginBottom: 14 }}>
          <View
            style={{
              width: `${(step / 4) * 100}%`,
              height: 4,
              borderRadius: 999,
              backgroundColor: colors.primary,
            }}
          />
        </View>

        {step === 1 && (
          <>
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <TouchableOpacity
              onPress={handleUploadCompanyLogo}
              disabled={loading}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              {companyProfile.logo_url ? (
                <Image source={{ uri: companyProfile.logo_url }} style={{ width: 96, height: 96 }} resizeMode="cover" />
              ) : (
                <Ionicons name="cloud-upload-outline" size={30} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={useCompanyProfilePicture}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: colors.muted,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>Use Company Profile Picture</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUploadCompanyLogo}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ color: colors.primaryForeground, fontSize: 12, fontWeight: "700" }}>Upload Logo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={cardStyle}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 }}>
              <TextInput
                placeholder="GSTIN"
                placeholderTextColor={colors.mutedForeground}
                value={companyProfile.gstin}
                onChangeText={(text) =>
                  setCompanyProfile((prev) => ({ ...prev, gstin: normalizeGstinNumber(text) }))
                }
                style={[inputStyle, { flex: 1, marginBottom: 0 }]}
                autoCapitalize="characters"
                maxLength={15}
              />
              <TouchableOpacity
                onPress={fetchCompanyProfileFromGST}
                disabled={loading || !companyProfile.gstin || companyProfile.gstin.length < 15}
                style={{
                  height: 44,
                  minWidth: 72,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor:
                    companyProfile.gstin && companyProfile.gstin.length >= 15 ? colors.primary : colors.muted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 12 }}>
                  {loading ? "..." : "Fetch"}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Company Name"
              placeholderTextColor={colors.mutedForeground}
              value={companyProfile.name}
              onChangeText={(text) => setCompanyProfile((prev) => ({ ...prev, name: text }))}
              style={inputStyle}
            />
            <TextInput
              placeholder="Address Line 1"
              placeholderTextColor={colors.mutedForeground}
              value={companyProfile.address_line_1 || ""}
              onChangeText={(text) =>
                setCompanyProfile((prev) => {
                  const next = { ...prev, address_line_1: text };
                  return { ...next, address: buildCompanyAddress(next) };
                })
              }
              style={inputStyle}
            />
            <TextInput
              placeholder="Address Line 2"
              placeholderTextColor={colors.mutedForeground}
              value={companyProfile.address_line_2 || ""}
              onChangeText={(text) =>
                setCompanyProfile((prev) => {
                  const next = { ...prev, address_line_2: text };
                  return { ...next, address: buildCompanyAddress(next) };
                })
              }
              style={inputStyle}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="State"
                placeholderTextColor={colors.mutedForeground}
                value={companyProfile.state || ""}
                onChangeText={(text) =>
                  setCompanyProfile((prev) => {
                    const next = { ...prev, state: text };
                    return { ...next, address: buildCompanyAddress(next) };
                  })
                }
                style={[inputStyle, { flex: 1 }]}
              />
              <TextInput
                placeholder="Pincode"
                placeholderTextColor={colors.mutedForeground}
                value={companyProfile.pincode || ""}
                onChangeText={(text) =>
                  setCompanyProfile((prev) => {
                    const next = { ...prev, pincode: text.replace(/[^\d]/g, "").slice(0, 6) };
                    return { ...next, address: buildCompanyAddress(next) };
                  })
                }
                style={[inputStyle, { flex: 1 }]}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <TextInput
              placeholder="Phone"
              placeholderTextColor={colors.mutedForeground}
              value={companyProfile.phone}
              onChangeText={(text) =>
                setCompanyProfile((prev) => ({ ...prev, phone: normalizePhoneInput(text) }))
              }
              style={inputStyle}
              keyboardType="phone-pad"
              maxLength={13}
            />
            <TextInput
              placeholder="PAN"
              placeholderTextColor={colors.mutedForeground}
              value={companyProfile.pan}
              onChangeText={(text) =>
                setCompanyProfile((prev) => ({ ...prev, pan: normalizePanNumber(text) }))
              }
              style={inputStyle}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>
          </>
        )}

        {step === 2 && (
          <>
            <View style={[cardStyle, { borderColor: colors.border, borderWidth: 1 }]}> 
              <TouchableOpacity
                onPress={() => {
                  const current = shipment.shipment_date ? new Date(shipment.shipment_date) : new Date();
                  if (!isNaN(current.getTime())) setLrDatePickerValue(current);
                  setShowLrDatePicker(true);
                }}
                activeOpacity={0.85}
                style={[inputStyle, { justifyContent: "center", marginBottom: 10, paddingRight: 34 }]}
              >
                <Text style={{ color: shipment.shipment_date ? colors.foreground : colors.mutedForeground, fontSize: 14, fontWeight: "600" }}>
                  {shipment.shipment_date || "LR Date (YYYY-MM-DD)"}
                </Text>
                <Ionicons name="calendar-outline" size={16} color={colors.mutedForeground} style={{ position: "absolute", right: 12, top: 17 }} pointerEvents="none" />
              </TouchableOpacity>
              <TextInput
                placeholder="LR Number"
                placeholderTextColor={colors.mutedForeground}
                value={lrNumber}
                onChangeText={(text) => setLrNumber(formatLrNumber(text))}
                style={inputStyle}
                autoCapitalize="characters"
                maxLength={9}
              />
            </View>

            <Text style={{ color: colors.foreground, fontWeight: "900", marginBottom: 8, letterSpacing: 0.5 }}>CONSIGNOR DETAILS</Text>
            {renderPartyCard("Consignor", consignor, "consignor")}

            <Text style={{ color: colors.foreground, fontWeight: "900", marginBottom: 8, letterSpacing: 0.5 }}>CONSIGNEE DETAILS</Text>
            {renderPartyCard("Consignee", consignee, "consignee")}
          </>
        )}

        {step === 3 && (
          <>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => setIsTripPreviewModalVisible(true)}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                backgroundColor: isDark ? colors.card : colors.primaryForeground,
                paddingHorizontal: 12,
                paddingVertical: 11,
                marginBottom: 12,
                shadowColor: colors.shadow,
                shadowOpacity: isDark ? 0 : 0.06,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: isDark ? 0 : 1,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.55 }}>
                  Party/Customer Name
                </Text>
                {tripId ? (
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.infoSoft }}>
                    <Text style={{ color: colors.info, fontSize: 8, fontWeight: "800", letterSpacing: 0.5 }}>LINKED TRIP</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "800", marginBottom: 10 }}>
                {consignee.name || consignor.name || "-"}
              </Text>

              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.55 }}>Route</Text>
              <View style={{ marginBottom: 9 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, borderWidth: 1, borderColor: colors.primary, backgroundColor: "transparent", marginRight: 8 }} />
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>{shipment.from_location || "-"}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginLeft: 5 }}>â€¢ {shipment.shipment_date || ""}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.primary, marginRight: 8 }} />
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>{shipment.to_location || "-"}</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.8, marginBottom: 9 }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.45 }}>FREIGHT AMOUNT</Text>
                  <Text style={{ color: colors.foreground, fontWeight: "800", marginTop: 2, fontSize: 14 }}>â‚¹{(Number(charges.freight || 0) || 1258).toLocaleString("en-IN")}</Text>
                </View>
                <View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "right", letterSpacing: 0.45 }}>PARTY BALANCE</Text>
                  <Text style={{ color: colors.foreground, fontWeight: "800", marginTop: 2, textAlign: "right", fontSize: 14 }}>â‚¹{(Number(charges.balance || 0) || 1258).toLocaleString("en-IN")}</Text>
                </View>
              </View>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700", marginTop: 10 }}>Tap to preview trip details</Text>
            </TouchableOpacity>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 18, marginBottom: 2 }}>Load Details</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Description on load details here</Text>
            </View>

            <View style={{ gap: 8, marginBottom: 8 }}>
              {goodsRows.map((row, idx) => (
                <TouchableOpacity
                  key={`goods-card-${idx}`}
                  onPress={() => {
                    setIsUnitDropdownVisible(false);
                    setEditingGoodsIndex(idx);
                    setIsGoodsModalVisible(true);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 12,
                    backgroundColor: isDark ? colors.card : colors.primaryForeground,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "800", marginBottom: 4 }}>
                    Product {idx + 1}: {row.description || "Unnamed material"}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Qty: {row.quantity || "-"} {row.unit || "Tonnes"} | Weight: {row.actual_weight || "-"}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                setGoodsRows((prev) => {
                  const next = [
                    ...prev,
                    {
                      sr_no: prev.length + 1,
                      description: "",
                      quantity: "",
                      unit: "Tonnes",
                      actual_weight: "",
                      rate: "",
                      total: "",
                    },
                  ];
                  setIsUnitDropdownVisible(false);
                  setEditingGoodsIndex(next.length - 1);
                  return next;
                });
                setIsGoodsModalVisible(true);
              }}
              style={{
                borderWidth: 1,
                borderColor: colors.primary,
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                marginBottom: 10,
                backgroundColor: colors.successSoft,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: "800" }}>+ Add More Product</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>Freight Paid By</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              {[
                { id: "consignor", label: "Consignor" },
                { id: "consignee", label: "Consignee" },
              ].map((item) => {
                const active = freightPaidBy === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setFreightPaidBy(item.id as "consignor" | "consignee")}
                    style={{
                      flex: 1,
                      paddingVertical: 11,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : (isDark ? colors.card : colors.primaryForeground),
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontSize: 12, fontWeight: "800" }}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>GST Paid By</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              {[
                { id: "consignor", label: "Consignor" },
                { id: "consignee", label: "Consignee" },
              ].map((item) => {
                const active = gstPaidBy === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setGstPaidBy(item.id as "consignor" | "consignee")}
                    style={{
                      flex: 1,
                      paddingVertical: 11,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : (isDark ? colors.card : colors.primaryForeground),
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontSize: 12, fontWeight: "800" }}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>GST Percentage</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              {GST_PERCENTAGE_OPTIONS.map((item) => {
                const active = gstPercentage === item;
                return (
                  <TouchableOpacity
                    key={`gst-pct-${item}`}
                    onPress={() => setGstPercentage(item)}
                    style={{
                      flex: 1,
                      paddingVertical: 11,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : (isDark ? colors.card : colors.primaryForeground),
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontSize: 12, fontWeight: "800" }}>{item}%</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>GST Type</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              {[
                { id: "igst", label: "IGST" },
                { id: "gst", label: "CGST + SGST" },
              ].map((item) => {
                const active = gstType === item.id;
                return (
                  <TouchableOpacity
                    key={`gst-type-${item.id}`}
                    onPress={() => setGstType(item.id as "gst" | "igst")}
                    style={{
                      flex: 1,
                      paddingVertical: 11,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : (isDark ? colors.card : colors.primaryForeground),
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontSize: 12, fontWeight: "800", textAlign: "center", paddingHorizontal: 4 }}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 4 && (
          <View style={cardStyle}>
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: isDark ? colors.card : colors.primaryForeground }}>
              <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 16, marginBottom: 2 }}>Insurance</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 10 }}>Optional cover details for this bilty.</Text>

              <TouchableOpacity
                onPress={() => setIsInsuranceModalVisible(true)}
                style={{ borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: insurance.policy_number ? 10 : 0 }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700" }}>{insurance.policy_number ? "Edit Insurance" : "+ Add Insurance"}</Text>
              </TouchableOpacity>

              {insurance.policy_number ? (
                <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, backgroundColor: isDark ? colors.input : colors.muted }}>
                  <Text style={{ color: colors.foreground, fontWeight: "800", marginBottom: 2 }}>{insurance.insurer_name || "-"}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 2 }}>Policy: {insurance.policy_number}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 2 }}>Coverage: â‚¹{Number(insurance.coverage_amount || 0).toLocaleString("en-IN")}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Expiry: {insurance.expiry_date || "-"}</Text>
                  <TouchableOpacity
                    onPress={() => setInsurance({ policy_number: "", insurer_name: "", coverage_amount: "", expiry_date: "" })}
                    style={{ alignSelf: "flex-start", marginTop: 8 }}
                  >
                    <Text style={{ color: colors.destructive, fontSize: 12, fontWeight: "700" }}>Remove insurance</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: isDark ? colors.card : colors.primaryForeground }}>
              <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 16, marginBottom: 2 }}>Waybill</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 10 }}>Invoice and e-waybill references.</Text>
              <TextInput placeholder="E-Waybill No" placeholderTextColor={colors.mutedForeground} value={shipment.eway_bill_no} onChangeText={(text) => setShipment((prev) => ({ ...prev, eway_bill_no: text }))} style={inputStyle} />
              <TextInput placeholder="Goods Invoice No" placeholderTextColor={colors.mutedForeground} value={shipment.invoice_no} onChangeText={(text) => setShipment((prev) => ({ ...prev, invoice_no: text }))} style={inputStyle} />
              <TextInput placeholder="Invoice Value" placeholderTextColor={colors.mutedForeground} value={shipment.invoice_value} onChangeText={(text) => setShipment((prev) => ({ ...prev, invoice_value: text }))} style={inputStyle} keyboardType="numeric" />
            </View>

            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 14, backgroundColor: isDark ? colors.card : colors.primaryForeground }}>
              <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 16, marginBottom: 2 }}>Terms & Signature</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 10 }}>Add legal notes and authorized sign.</Text>

              <TextInput
                placeholder="Terms"
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
                style={[inputStyle, { height: 56, textAlignVertical: "top", paddingTop: 10 }]}
                numberOfLines={2}
                multiline
                onFocus={(event) => {
                  const node = findNodeHandle(event.target as any);
                  if (!node) return;
                  setTimeout(() => {
                    wizardScrollRef.current?.scrollToFocusedInput?.(node);
                  }, 120);
                }}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ color: colors.foreground, fontWeight: "800" }}>Signature</Text>
                {signatureUrl ? (
                  <TouchableOpacity onPress={() => setSignatureUrl("")}> 
                    <Text style={{ color: colors.destructive, fontWeight: "700", fontSize: 12 }}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View
                style={{
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingVertical: signatureUrl ? 10 : 18,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                  backgroundColor: isDark ? colors.input : colors.primaryForeground,
                  minHeight: 88,
                }}
              >
                {signatureUrl ? (
                  isSvgSignature ? (
                    <SvgXml xml={signatureSvgXml} width="92%" height={72} />
                  ) : (
                    <Image source={{ uri: signatureUrl }} style={{ width: "92%", height: 72, borderRadius: 8 }} resizeMode="contain" />
                  )
                ) : (
                  <Text style={{ color: colors.mutedForeground, fontWeight: "700" }}>No signature added</Text>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={handleUploadSignature}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingVertical: 11,
                    alignItems: "center",
                    backgroundColor: isDark ? colors.input : colors.primaryForeground,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>Upload Image</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsSignaturePadVisible(true)}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    borderRadius: 10,
                    paddingVertical: 11,
                    alignItems: "center",
                    backgroundColor: colors.successSoft,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "800" }}>Draw Signature</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleSaveDraft} disabled={loading} style={{ backgroundColor: colors.secondary, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 10 }}>
              <Text style={{ color: colors.foreground, fontWeight: "900" }}>{loading ? "Saving..." : "Save Draft"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGenerate} disabled={loading} style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 10 }}>
              <Text style={{ color: colors.primaryForeground, fontWeight: "900" }}>{loading ? "Generating..." : "Done"}</Text>
            </TouchableOpacity>

            {Boolean(biltyId) && (
              <TouchableOpacity
                onPress={() => setShowEditOverview(true)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: isDark ? colors.card : colors.primaryForeground,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "800" }}>Back to Bilty Overview</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
          </>
        )}
      </KeyboardAwareScrollView>

      <BottomSheet
        visible={!!partyEditorTarget}
        onClose={closePartyEditor}
        title={partyEditorTarget === "consignor" ? "Add Consignor" : "Add Consignee"}
        maxHeight="84%"
        expandedHeight="94%"
      >
        <View
          style={{
            height: 56,
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: colors.border,
            backgroundColor: colors.input,
            paddingHorizontal: 16,
            marginBottom: 14,
          }}
        >
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            placeholder="Search..."
            placeholderTextColor={colors.mutedForeground}
            value={partyClientSearch}
            onChangeText={setPartyClientSearch}
            style={{ flex: 1, marginLeft: 10, color: colors.foreground, fontSize: 16 }}
          />
        </View>

        <ScrollView style={{ maxHeight: 360, marginBottom: 16 }} keyboardShouldPersistTaps="handled">
          {parties
            .filter((p) => {
              const q = partyClientSearch.trim().toLowerCase();
              if (!q) return true;
              return (
                String(p?.name || "").toLowerCase().includes(q) ||
                String(p?.contact_person || "").toLowerCase().includes(q) ||
                String(p?.phone || "").toLowerCase().includes(q)
              );
            })
            .slice(0, 50)
            .map((party) => {
              const selected = String(partyDraft.party_id || "") === String(party?._id || "");
              return (
                <TouchableOpacity
                  key={`party-${party._id}`}
                  onPress={() => {
                    const picked = mapStoredPartyToForm(party);
                    setPartyDraft(picked);
                    if (partyEditorTarget === "consignor") setConsignor(picked);
                    else if (partyEditorTarget === "consignee") setConsignee(picked);
                    closePartyEditor();
                  }}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingHorizontal: 10,
                    paddingVertical: 12,
                    backgroundColor: "transparent",
                  }}
                >
                  <Text style={{ color: selected ? colors.primary : colors.foreground, fontWeight: "500", fontSize: 34/2 }}>
                    {party.name || "Unnamed party"}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>

        <TouchableOpacity
          onPress={openCreateClient}
          style={{
            backgroundColor: colors.success,
            paddingVertical: 16,
            borderRadius: 999,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 34/2 }}>Add New</Text>
        </TouchableOpacity>
      </BottomSheet>

      <BottomSheet
        visible={isGoodsModalVisible}
        onClose={() => {
          setIsGoodsModalVisible(false);
          setIsUnitDropdownVisible(false);
        }}
        title={`Product ${editingGoodsIndex + 1}`}
        maxHeight="80%"
        expandedHeight="80%"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>MATERIAL CATEGORY</Text>
          <TextInput
            placeholder="Eg: Steel"
            placeholderTextColor={colors.mutedForeground}
            value={goodsRows[editingGoodsIndex]?.description || ""}
            onChangeText={(text) => updateGoodsRow(editingGoodsIndex, "description", text)}
            style={inputStyle}
          />

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>WEIGHT</Text>
              <TextInput
                placeholder="Weight"
                placeholderTextColor={colors.mutedForeground}
                value={goodsRows[editingGoodsIndex]?.actual_weight || ""}
                onChangeText={(text) => updateGoodsRow(editingGoodsIndex, "actual_weight", text)}
                style={inputStyle}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>WEIGHT UNIT</Text>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setIsUnitDropdownVisible((prev) => !prev);
                }}
                style={[inputStyle, { justifyContent: "center", marginBottom: 0, paddingRight: 34 }]}
              >
                <Text style={{ color: goodsRows[editingGoodsIndex]?.unit ? colors.foreground : colors.mutedForeground, fontWeight: "600" }}>
                  {goodsRows[editingGoodsIndex]?.unit || "Tonnes"}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.mutedForeground} style={{ position: "absolute", right: 12, top: 18 }} pointerEvents="none" />
              </TouchableOpacity>
              {isUnitDropdownVisible ? (
                <View
                  style={{
                    marginTop: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    backgroundColor: isDark ? colors.card : colors.primaryForeground,
                    overflow: "hidden",
                  }}
                >
                  {UNIT_OPTIONS.map((unit) => {
                    const active = (goodsRows[editingGoodsIndex]?.unit || "Tonnes") === unit;
                    return (
                      <TouchableOpacity
                        key={`inline-unit-${unit}`}
                        onPress={() => {
                          updateGoodsRow(editingGoodsIndex, "unit", unit);
                          setIsUnitDropdownVisible(false);
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderTopWidth: unit === UNIT_OPTIONS[0] ? 0 : 1,
                          borderTopColor: colors.border,
                          backgroundColor: active ? colors.primary + "22" : "transparent",
                        }}
                      >
                        <Text style={{ color: active ? colors.primary : colors.foreground, fontWeight: active ? "800" : "600" }}>
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>

          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>NO. OF BAGS / BOX / SHIPMENTS</Text>
          <TextInput
            placeholder="Quantity"
            placeholderTextColor={colors.mutedForeground}
            value={goodsRows[editingGoodsIndex]?.quantity || ""}
            onChangeText={(text) => updateGoodsRow(editingGoodsIndex, "quantity", text)}
            style={inputStyle}
            keyboardType="numeric"
          />

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>RATE</Text>
              <TextInput
                placeholder="Rate"
                placeholderTextColor={colors.mutedForeground}
                value={goodsRows[editingGoodsIndex]?.rate || ""}
                onChangeText={(text) => updateGoodsRow(editingGoodsIndex, "rate", text)}
                style={inputStyle}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>TOTAL</Text>
              <TextInput
                placeholder="Total"
                placeholderTextColor={colors.mutedForeground}
                value={goodsRows[editingGoodsIndex]?.total || ""}
                onChangeText={(text) => updateGoodsRow(editingGoodsIndex, "total", text)}
                style={inputStyle}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              setIsGoodsModalVisible(false);
              setIsUnitDropdownVisible(false);
            }}
            style={{ backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 6 }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Save Product</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={isInsuranceModalVisible}
        onClose={() => setIsInsuranceModalVisible(false)}
        title="Add Insurance"
        maxHeight="80%"
        expandedHeight="80%"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>POLICY NUMBER</Text>
          <TextInput
            placeholder="Policy number"
            placeholderTextColor={colors.mutedForeground}
            value={insurance.policy_number}
            onChangeText={(text) => setInsurance((prev) => ({ ...prev, policy_number: text }))}
            style={inputStyle}
          />

          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>INSURER NAME</Text>
          <TextInput
            placeholder="Insurance company"
            placeholderTextColor={colors.mutedForeground}
            value={insurance.insurer_name}
            onChangeText={(text) => setInsurance((prev) => ({ ...prev, insurer_name: text }))}
            style={inputStyle}
          />

          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>COVERAGE AMOUNT</Text>
          <TextInput
            placeholder="â‚¹ Amount"
            placeholderTextColor={colors.mutedForeground}
            value={insurance.coverage_amount}
            onChangeText={(text) => setInsurance((prev) => ({ ...prev, coverage_amount: text.replace(/[^\d.]/g, "") }))}
            style={inputStyle}
            keyboardType="numeric"
          />

          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>EXPIRY DATE</Text>
          <TouchableOpacity
            onPress={() => {
              const current = insurance.expiry_date ? new Date(insurance.expiry_date) : new Date();
              if (!isNaN(current.getTime())) setInsuranceExpiryDate(current);
              setShowInsuranceDatePicker(true);
            }}
            activeOpacity={0.85}
            style={[inputStyle, { justifyContent: "center", marginBottom: 10, paddingRight: 34 }]}
          >
            <Text style={{ color: insurance.expiry_date ? colors.foreground : colors.mutedForeground, fontSize: 14, fontWeight: "600" }}>
              {insurance.expiry_date || "yyyy-mm-dd"}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={colors.mutedForeground} style={{ position: "absolute", right: 12, top: 17 }} pointerEvents="none" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsInsuranceModalVisible(false)}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Save Insurance</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={isSignaturePadVisible}
        onClose={() => {
          setPendingSignatureSave(false);
          setIsSignaturePadVisible(false);
        }}
        title="Draw Signature"
        maxHeight="68%"
        expandedHeight="76%"
      >
        <View
          style={{
            height: 190,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            backgroundColor: colors.primaryForeground,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <Signature
            ref={signatureCanvasRef}
            onOK={handleSignatureOK}
            onEmpty={handleSignatureEmpty}
            descriptionText=""
            penColor={colors.foreground}
            backgroundColor={colors.primaryForeground}
            imageType="image/png"
            autoClear={false}
            webStyle={`
              .m-signature-pad--footer {display: none; margin: 0px;}
              .m-signature-pad {box-shadow: none; border: none;}
              body,html {width: 100%; height: 100%;}
            `}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={clearSignatureCanvas}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingVertical: 11,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={saveDrawnSignature}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: 10,
              paddingVertical: 11,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Use Signature</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <DatePickerModal
        visible={showLrDatePicker}
        onClose={() => setShowLrDatePicker(false)}
        date={lrDatePickerValue}
        onChange={(d) => {
          setLrDatePickerValue(d);
          const value = d.toISOString().split("T")[0];
          setShipment((prev) => ({ ...prev, shipment_date: value }));
        }}
      />

      <DatePickerModal
        visible={showInsuranceDatePicker}
        onClose={() => setShowInsuranceDatePicker(false)}
        date={insuranceExpiryDate}
        onChange={(d) => {
          setInsuranceExpiryDate(d);
          const value = d.toISOString().split("T")[0];
          setInsurance((prev) => ({ ...prev, expiry_date: value }));
        }}
      />

      <BottomSheet
        visible={isTripPreviewModalVisible}
        onClose={() => setIsTripPreviewModalVisible(false)}
        title="Trip Preview"
        maxHeight="78%"
        expandedHeight="84%"
      >
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            backgroundColor: colors.card,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
              {previewTripCard.date ? new Date(previewTripCard.date).toLocaleDateString() : "No Date"}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary }}>{`₹ ${previewTripCard.totalCost.toLocaleString()}`}</Text>
          </View>

          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            {previewTripCard.start || "-"} {" -> "} {previewTripCard.end || "-"}
          </Text>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: colors.foreground, marginBottom: 2, fontSize: 12 }}>Client: {previewTripCard.client || "-"}</Text>
            <Text style={{ color: colors.foreground, marginBottom: 2, fontSize: 12 }}>Truck: {previewTripCard.truck || "-"}</Text>
            <Text style={{ color: colors.foreground, fontSize: 12 }}>Driver: {previewTripCard.driver || "-"}</Text>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, opacity: 0.6, marginVertical: 8 }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Trip Cost: ₹ {previewTripCard.tripCost.toLocaleString()}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Misc: ₹ {previewTripCard.misc.toLocaleString()}</Text>
          </View>

          {previewTripCard.notes ? (
            <Text
              style={{ fontStyle: "italic", color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              Notes: {previewTripCard.notes}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setIsTripPreviewModalVisible(false)}
            style={{
              flex: 1,
              backgroundColor: isDark ? colors.card : colors.primaryForeground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>Close</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!linkedTrip?._id) {
                Alert.alert("No linked trip", "This bilty is not linked to an editable trip.");
                return;
              }
              setIsTripPreviewModalVisible(false);
              setIsTripDetailsModalVisible(true);
            }}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "900" }}>Edit Trip</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <EditTripModal
        visible={isTripDetailsModalVisible}
        onClose={() => setIsTripDetailsModalVisible(false)}
        trip={linkedTrip}
        trucks={trucks}
        drivers={drivers}
        clients={clients}
        locations={locations}
        onSave={async (_id, data) => {
          setLinkedTrip((prev: any) => ({
            ...(prev || {}),
            ...data,
            _id: _id,
            truck: data.truck,
            driver: data.driver,
            client: data.client,
            start_location: data.start_location,
            end_location: data.end_location,
            cost_of_trip: data.cost_of_trip,
            miscellaneous_expense: data.miscellaneous_expense,
            trip_date: data.trip_date,
            notes: data.notes,
          }));

          setShipment((prev) => ({
            ...prev,
            shipment_date: String(data.trip_date || prev.shipment_date).split("T")[0],
            from_location: getLocationNameById(data.start_location),
            to_location: getLocationNameById(data.end_location),
            vehicle_number: getTruckNameById(data.truck),
            driver_name: getDriverNameById(data.driver),
          }));

          setCharges((prev) => ({
            ...prev,
            freight: String(data.cost_of_trip ?? prev.freight),
            other: String(data.miscellaneous_expense ?? prev.other),
          }));
        }}
        onDelete={async () => {
          setIsTripDetailsModalVisible(false);
        }}
      />

      <BottomSheet
        visible={isClientModalVisible}
        onClose={() => setIsClientModalVisible(false)}
        title={partyEditorTarget === "consignor" ? "Add Consignor" : "Add Consignee"}
        maxHeight="86%"
        expandedHeight="95%"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentContainerStyle={{ paddingBottom: 18 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>NAME *</Text>
          <TextInput
            placeholder="Party name"
            placeholderTextColor={colors.mutedForeground}
            value={newPartyForm.name}
            onChangeText={(text) => setNewPartyForm((prev) => ({ ...prev, name: text }))}
            style={inputStyle}
          />

          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>PHONE *</Text>
          <TextInput
            placeholder="Phone number"
            placeholderTextColor={colors.mutedForeground}
            value={newPartyForm.phone}
            onChangeText={(text) => setNewPartyForm((prev) => ({ ...prev, phone: normalizePhoneInput(text) }))}
            style={inputStyle}
            keyboardType="phone-pad"
            maxLength={13}
          />

          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>ADDRESS LINE 1</Text>
          <TextInput
            placeholder="Address line 1"
            placeholderTextColor={colors.mutedForeground}
            value={newPartyForm.address_line_1}
            onChangeText={(text) => setNewPartyForm((prev) => ({ ...prev, address_line_1: text }))}
            style={inputStyle}
          />

          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>ADDRESS LINE 2</Text>
          <TextInput
            placeholder="Address line 2"
            placeholderTextColor={colors.mutedForeground}
            value={newPartyForm.address_line_2}
            onChangeText={(text) => setNewPartyForm((prev) => ({ ...prev, address_line_2: text }))}
            style={inputStyle}
          />

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>STATE</Text>
              <TextInput
                placeholder="State"
                placeholderTextColor={colors.mutedForeground}
                value={newPartyForm.state}
                onChangeText={(text) => setNewPartyForm((prev) => ({ ...prev, state: text }))}
                style={inputStyle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>PINCODE</Text>
              <TextInput
                placeholder="Pincode"
                placeholderTextColor={colors.mutedForeground}
                value={newPartyForm.pincode}
                onChangeText={(text) => setNewPartyForm((prev) => ({ ...prev, pincode: text.replace(/[^\d]/g, "").slice(0, 6) }))}
                style={inputStyle}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>GSTIN</Text>
          <TextInput
            placeholder="GST number"
            placeholderTextColor={colors.mutedForeground}
            value={newPartyForm.gstin}
            onChangeText={(text) => setNewPartyForm((prev) => ({ ...prev, gstin: normalizeGstinNumber(text) }))}
            style={inputStyle}
            autoCapitalize="characters"
            maxLength={15}
          />

          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>PAN NUMBER</Text>
          <TextInput
            placeholder="PAN number"
            placeholderTextColor={colors.mutedForeground}
            value={newPartyForm.pan}
            onChangeText={(text) => setNewPartyForm((prev) => ({ ...prev, pan: normalizePanNumber(text) }))}
            style={inputStyle}
            autoCapitalize="characters"
            maxLength={10}
          />

          <TouchableOpacity
            onPress={async () => {
              if (!newPartyForm.name?.trim()) {
                Alert.alert("Missing Fields", "Name is required.");
                return;
              }
              const payload = {
                type: "both",
                name: newPartyForm.name.trim(),
                phone: normalizePhoneInput(newPartyForm.phone),
                contact_person: "",
                email: "",
                address: [
                  newPartyForm.address_line_1,
                  newPartyForm.address_line_2,
                  newPartyForm.state,
                  newPartyForm.pincode,
                ]
                  .map((x) => String(x || "").trim())
                  .filter(Boolean)
                  .join(", "),
                gstin: normalizeGstinNumber(newPartyForm.gstin),
                pan: normalizePanNumber(newPartyForm.pan),
                quick_fill_source: "manual" as const,
              };

              const saved = await createParty(payload as any);

              const picked: PartyForm = {
                ...emptyParty,
                party_id: String(saved?._id || ""),
                name: String(saved?.name || payload.name),
                contact_person: String(saved?.contact_person || ""),
                phone: normalizePhoneInput(String(saved?.phone || payload.phone || "")),
                email: String(saved?.email || ""),
                address: String(saved?.address || payload.address || ""),
                gstin: normalizeGstinNumber(String(saved?.gstin || payload.gstin || "")),
                pan: normalizePanNumber(String(saved?.pan || payload.pan || "")),
                gstin_details: saved?.gstin_details,
              };
              setPartyDraft(picked);
              if (partyEditorTarget === "consignor") setConsignor(picked);
              else if (partyEditorTarget === "consignee") setConsignee(picked);
              setIsClientModalVisible(false);
              await fetchParties();
              closePartyEditor();
            }}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "900" }}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>

      {!keyboardVisible && !showEditOverview && (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: isDark ? colors.card : colors.primaryForeground, paddingTop: 12, paddingHorizontal: 12, paddingBottom: Math.max(insets.bottom, 12), flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          disabled={!canGoBack}
          onPress={() => setStep((prev) => Math.max(1, prev - 1))}
          style={{
            flex: 1,
            backgroundColor: canGoBack ? (isDark ? colors.secondary : colors.secondary) : colors.card,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            opacity: canGoBack ? 1 : 0.5,
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: "800" }}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!canGoNext}
          onPress={() => {
            void handleNext();
          }}
          style={{
            flex: 1,
            backgroundColor: canGoNext ? colors.primary : colors.card,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            opacity: canGoNext ? 1 : 0.5,
          }}
        >
          <Text style={{ color: canGoNext ? colors.primaryForeground : colors.foreground, fontWeight: "900" }}>{canGoNext ? "Continue" : "Done"}</Text>
        </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
