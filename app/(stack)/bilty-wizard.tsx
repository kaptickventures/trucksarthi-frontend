import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import API from "../api/axiosInstance";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useBilty, type CompanyProfile } from "../../hooks/useBiltyModule";
import useClients from "../../hooks/useClient";
import useDrivers from "../../hooks/useDriver";
import useLocations from "../../hooks/useLocation";
import useTrucks from "../../hooks/useTruck";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

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

export default function BiltyWizardScreen() {
  const { tripId, biltyId } = useLocalSearchParams<{ tripId?: string; biltyId?: string }>();
  const router = useRouter();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";

  const {
    getBiltyById,
    createBilty,
    updateBilty,
    saveDraft,
    gstLookup,
    getCompanyProfile,
    updateCompanyProfile,
    fetchParties,
    createParty,
    getQuickFillData,
  } = useBilty();
  const { clients, fetchClients } = useClients();
  const { drivers, fetchDrivers } = useDrivers();
  const { trucks, fetchTrucks } = useTrucks();
  const { locations, fetchLocations } = useLocations();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [generatedId, setGeneratedId] = useState<string>(String(biltyId || ""));
  const [lastPdfUri, setLastPdfUri] = useState<string>("");

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: "",
    address: "",
    phone: "",
    pan: "",
    gstin: "",
  });

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
      unit: "Nos",
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
  const [notes, setNotes] = useState("");

  const [partyLibrary, setPartyLibrary] = useState<any[]>([]);

  const stepTitle = useMemo(() => {
    return [
      "Company Profile",
      "LR & Consignor Consignee Details",
      "Load & Trip Details",
      "Insurance & Signature",
    ][step - 1];
  }, [step]);

  const recalcCharges = (next: any) => {
    const freight = toNumber(next.freight);
    const loadingAmt = toNumber(next.loading);
    const unloadingAmt = toNumber(next.unloading);
    const otherAmt = toNumber(next.other);
    const total = freight + loadingAmt + unloadingAmt + otherAmt;
    const advance = toNumber(next.advance);
    const balance = total - advance;

    return {
      ...next,
      total: total ? String(total) : "",
      balance: balance ? String(balance) : "0",
    };
  };

  const mapPartyFromGST = (result: any): PartyForm => {
    const data = result?.data || result || {};
    return {
      name: data.trade_name_of_business || data.legal_name_of_business || "",
      contact_person: "",
      phone: data.primary_mobile || "",
      email: data.primary_email || "",
      address: data.principal_place_address || "",
      gstin: data.gstin || data.GSTIN || "",
      pan: data.pan_number || "",
      gstin_details: data,
    };
  };

  const loadInitial = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchClients(), fetchDrivers(), fetchTrucks(), fetchLocations()]);

      const [profile, parties, quickFill] = await Promise.all([
        getCompanyProfile(),
        fetchParties(),
        getQuickFillData(),
      ]);

      setCompanyProfile(profile);
      setPartyLibrary([...(parties || []), ...(quickFill.recent_parties || [])]);

      if (tripId) {
        const trip = (await API.get(`/api/trips/${tripId}`)).data;
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
        setNotes(existing.notes || "");
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

  const applyClientQuickFill = (target: "consignor" | "consignee", client: any) => {
    const payload: PartyForm = {
      ...emptyParty,
      name: client.client_name || "",
      contact_person: client.contact_person_name || "",
      phone: client.contact_number || "",
      email: client.email_address || "",
      address: client.office_address || "",
      gstin: client.gstin || "",
      gstin_details: client.gstin_details,
    };
    if (target === "consignor") setConsignor(payload);
    else setConsignee(payload);
  };

  const applyPartyQuickFill = (target: "consignor" | "consignee", party: any) => {
    const payload: PartyForm = {
      ...emptyParty,
      party_id: String(party._id || ""),
      name: party.name || "",
      contact_person: party.contact_person || "",
      phone: party.phone || "",
      email: party.email || "",
      address: party.address || "",
      gstin: party.gstin || "",
      pan: party.pan || "",
      gstin_details: party.gstin_details,
    };
    if (target === "consignor") setConsignor(payload);
    else setConsignee(payload);
  };

  const fetchPartyFromGST = async (target: "consignor" | "consignee") => {
    const gstin = target === "consignor" ? consignor.gstin : consignee.gstin;
    if (!gstin || gstin.length < 15) {
      Alert.alert("Invalid GSTIN", "Please enter a valid GSTIN.");
      return;
    }

    try {
      setLoading(true);
      const result = await gstLookup(gstin);
      const mapped = mapPartyFromGST(result);
      if (target === "consignor") setConsignor((prev) => ({ ...prev, ...mapped }));
      else setConsignee((prev) => ({ ...prev, ...mapped }));
      Alert.alert("GST fetched", "Details fetched successfully. You can edit before saving.");
    } catch (err: any) {
      Alert.alert("Lookup failed", err?.response?.data?.message || "Unable to fetch GST details.");
    } finally {
      setLoading(false);
    }
  };

  const ensurePartySaved = async (party: PartyForm, type: "consignor" | "consignee") => {
    if (party.party_id) return party.party_id;
    if (!party.name) return undefined;
    const saved = await createParty({
      type,
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
  };

  const buildPayload = async (status: "draft" | "generated") => {
    const consignorId = await ensurePartySaved(consignor, "consignor");
    const consigneeId = await ensurePartySaved(consignee, "consignee");

    return {
      trip: tripId ? String(tripId) : undefined,
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
      payment_type: paymentType,
      notes,
    };
  };

  const buildBiltyHtml = (doc: any) => {
    const partyName = companyProfile.name || "TRUCKSARTHI";
    const partyGstin = companyProfile.gstin || "-";
    const partyAddress = companyProfile.address || "-";
    const partyPhone = companyProfile.phone || "-";
    const lrNo = doc?.bilty_number || String(doc?._id || "-").slice(-8).toUpperCase();
    const lrDate = String(doc?.bilty_date || new Date()).split("T")[0];

    const money = (value: number) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    const rows = doc?.goods_rows || [];

    const buildCopyPage = (copyLabel: string) => `
      <div class="page">
        <div class="copy-pill">${escapeHtml(copyLabel)}</div>
        <div class="sheet">
          <div class="header">
            <div class="logo-box">TS</div>
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
            <div class="box"><div class="box-title">Freight Paid By</div><div>${escapeHtml(doc?.payment_type || "to_pay")}</div></div>
            <div class="box"><div class="box-title">Insurance</div><div>The consignor has not insured the consignment.</div></div>
            <div class="box"><div class="box-title">LR Details</div><div><strong>LR No:</strong> ${escapeHtml(lrNo)}</div><div><strong>Date:</strong> ${escapeHtml(lrDate)}</div></div>
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

          <div class="amount-line"><strong>To Pay:</strong> Rs ${money(doc?.charges?.balance || 0)}</div>
          <div class="warning">Company is not responsible for leakages & thefts</div>

          <div class="footer-grid"><div class="terms"><div class="line-title">Terms & Conditions</div><div>1. This is a digitally generated Bilty/LR copy.</div></div><div class="signature"><div>Certified that the particulars given above are true and correct.</div><div style="margin-top:20px;"><strong>For, ${escapeHtml(partyName)}</strong></div><div class="sign-line">Signature</div></div></div>
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

  const openPdfPreview = async (doc: any) => {
    const html = buildBiltyHtml(doc);
    const { uri } = await Print.printToFileAsync({ html });
    setLastPdfUri(uri);
    router.push({ pathname: "/(stack)/pdf-viewer", params: { uri, title: "LR Preview" } } as any);
  };

  const handleSaveCompanyProfile = async () => {
    try {
      setLoading(true);
      const updated = await updateCompanyProfile(companyProfile);
      setCompanyProfile(updated);
      Alert.alert("Saved", "Company profile saved.");
    } catch {
      // handled in hook
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const payload = await buildPayload("draft");
      const saved = generatedId ? await saveDraft(payload as any, generatedId) : await saveDraft(payload as any);
      setGeneratedId(String((saved as any)?._id || generatedId));
      Alert.alert("Draft saved", "Your bilty draft has been saved.");
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!consignor.name || !consignee.name) {
      Alert.alert("Missing details", "Consignor and consignee names are required.");
      return;
    }

    try {
      setLoading(true);
      const payload = await buildPayload("generated");
      const saved = generatedId
        ? await updateBilty(generatedId, payload as any)
        : await createBilty(payload as any);

      setGeneratedId(String((saved as any)?._id || generatedId));
      await openPdfPreview(saved);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleShareDownload = async () => {
    try {
      let uri = lastPdfUri;
      if (!uri && generatedId) {
        const doc = await getBiltyById(generatedId);
        const html = buildBiltyHtml(doc);
        const result = await Print.printToFileAsync({ html });
        uri = result.uri;
        setLastPdfUri(uri);
      }
      if (!uri) {
        Alert.alert("No PDF", "Generate bilty first.");
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to share/download");
    }
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
    backgroundColor: isDark ? colors.card : colors.secondary + "10",
    color: colors.foreground,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  } as const;

  const cardStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  } as const;

  const renderPartyStep = (target: "consignor" | "consignee") => {
    const party = target === "consignor" ? consignor : consignee;
    const setParty = target === "consignor" ? setConsignor : setConsignee;
    return (
      <>
        <TextInput
          placeholder="GSTIN"
          placeholderTextColor={colors.mutedForeground}
          value={party.gstin}
          onChangeText={(text) => setParty((prev) => ({ ...prev, gstin: text.toUpperCase() }))}
          style={inputStyle}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          onPress={() => fetchPartyFromGST(target)}
          style={{ backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: "center", marginBottom: 12 }}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Fetch by GSTIN</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {clients.slice(0, 20).map((client) => (
            <TouchableOpacity
              key={`client-${client._id}`}
              onPress={() => applyClientQuickFill(target, client)}
              style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.successSoft, marginRight: 8 }}
            >
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Client: {client.client_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {partyLibrary.slice(0, 30).map((p: any) => (
            <TouchableOpacity
              key={`party-${p._id}`}
              onPress={() => applyPartyQuickFill(target, p)}
              style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border, marginRight: 8 }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TextInput placeholder="Name" placeholderTextColor={colors.mutedForeground} value={party.name} onChangeText={(text) => setParty((prev) => ({ ...prev, name: text }))} style={inputStyle} />
        <TextInput placeholder="Contact Person" placeholderTextColor={colors.mutedForeground} value={party.contact_person} onChangeText={(text) => setParty((prev) => ({ ...prev, contact_person: text }))} style={inputStyle} />
        <TextInput placeholder="Phone" placeholderTextColor={colors.mutedForeground} value={party.phone} onChangeText={(text) => setParty((prev) => ({ ...prev, phone: text }))} style={inputStyle} keyboardType="phone-pad" />
        <TextInput placeholder="Email" placeholderTextColor={colors.mutedForeground} value={party.email} onChangeText={(text) => setParty((prev) => ({ ...prev, email: text }))} style={inputStyle} keyboardType="email-address" />
        <TextInput placeholder="Address" placeholderTextColor={colors.mutedForeground} value={party.address} onChangeText={(text) => setParty((prev) => ({ ...prev, address: text }))} style={[inputStyle, { height: 70, textAlignVertical: "top", paddingTop: 10 }]} multiline />
        <TextInput placeholder="PAN" placeholderTextColor={colors.mutedForeground} value={party.pan} onChangeText={(text) => setParty((prev) => ({ ...prev, pan: text.toUpperCase() }))} style={inputStyle} autoCapitalize="characters" />
      </>
    );
  };

  const canGoNext = step < 4;
  const canGoBack = step > 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 12, marginBottom: 4 }}>Step {step} of 4</Text>
        <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 22, marginBottom: 14 }}>{stepTitle}</Text>
        <View style={{ height: 4, borderRadius: 999, backgroundColor: isDark ? colors.input : "#E7EAEE", marginBottom: 14 }}>
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
          <View style={cardStyle}>
            <TextInput placeholder="GSTIN" placeholderTextColor={colors.mutedForeground} value={companyProfile.gstin} onChangeText={(text) => setCompanyProfile((prev) => ({ ...prev, gstin: text.toUpperCase() }))} style={inputStyle} autoCapitalize="characters" />
            <TouchableOpacity
              onPress={async () => {
                if (!companyProfile.gstin) return;
                try {
                  setLoading(true);
                  const result = await gstLookup(companyProfile.gstin, companyProfile.name);
                  const mapped = mapPartyFromGST(result);
                  setCompanyProfile((prev) => ({
                    ...prev,
                    name: mapped.name,
                    address: mapped.address,
                    phone: mapped.phone,
                    pan: mapped.pan,
                    gstin: mapped.gstin || prev.gstin,
                  }));
                } catch (err: any) {
                  Alert.alert("GST fetch failed", err?.response?.data?.message || "Unable to fetch GST details.");
                } finally {
                  setLoading(false);
                }
              }}
              style={{ backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: "center", marginBottom: 12 }}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Autofill from GST</Text>
            </TouchableOpacity>

            <TextInput placeholder="Company Name" placeholderTextColor={colors.mutedForeground} value={companyProfile.name} onChangeText={(text) => setCompanyProfile((prev) => ({ ...prev, name: text }))} style={inputStyle} />
            <TextInput placeholder="Address" placeholderTextColor={colors.mutedForeground} value={companyProfile.address} onChangeText={(text) => setCompanyProfile((prev) => ({ ...prev, address: text }))} style={[inputStyle, { height: 70, textAlignVertical: "top", paddingTop: 10 }]} multiline />
            <TextInput placeholder="Phone" placeholderTextColor={colors.mutedForeground} value={companyProfile.phone} onChangeText={(text) => setCompanyProfile((prev) => ({ ...prev, phone: text }))} style={inputStyle} keyboardType="phone-pad" />
            <TextInput placeholder="PAN" placeholderTextColor={colors.mutedForeground} value={companyProfile.pan} onChangeText={(text) => setCompanyProfile((prev) => ({ ...prev, pan: text.toUpperCase() }))} style={inputStyle} autoCapitalize="characters" />

            <TouchableOpacity onPress={handleSaveCompanyProfile} style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}>
              <Text style={{ color: colors.primaryForeground, fontWeight: "900" }}>Save Company Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <>
            <View style={[cardStyle, { borderColor: colors.primary, borderWidth: 2 }]}> 
              <Text style={{ color: colors.primaryForeground, fontWeight: "800", marginBottom: 8, backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }}>
                LR Header
              </Text>
              <TextInput placeholder="LR Date (YYYY-MM-DD)" placeholderTextColor={colors.mutedForeground} value={shipment.shipment_date} onChangeText={(text) => setShipment((prev) => ({ ...prev, shipment_date: text }))} style={inputStyle} />
              <TextInput placeholder="LR Number (optional)" placeholderTextColor={colors.mutedForeground} value={generatedId ? `LR-${generatedId.slice(-4).toUpperCase()}` : ""} editable={false} style={inputStyle} />
            </View>

            <View style={cardStyle}>
              <Text style={{ color: colors.primary, fontWeight: "900", marginBottom: 8 }}>CONSIGNOR DETAILS</Text>
              {renderPartyStep("consignor")}
            </View>

            <View style={cardStyle}>
              <Text style={{ color: colors.primary, fontWeight: "900", marginBottom: 8 }}>CONSIGNEE DETAILS</Text>
              {renderPartyStep("consignee")}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <View style={cardStyle}>
              <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 20, marginBottom: 8 }}>Load & Trip Details</Text>
              <TextInput placeholder="From" placeholderTextColor={colors.mutedForeground} value={shipment.from_location} onChangeText={(text) => setShipment((prev) => ({ ...prev, from_location: text }))} style={inputStyle} />
              <TextInput placeholder="To" placeholderTextColor={colors.mutedForeground} value={shipment.to_location} onChangeText={(text) => setShipment((prev) => ({ ...prev, to_location: text }))} style={inputStyle} />
              <TextInput placeholder="Vehicle Number" placeholderTextColor={colors.mutedForeground} value={shipment.vehicle_number} onChangeText={(text) => setShipment((prev) => ({ ...prev, vehicle_number: text.toUpperCase() }))} style={inputStyle} autoCapitalize="characters" />
              <TextInput placeholder="Driver Name" placeholderTextColor={colors.mutedForeground} value={shipment.driver_name} onChangeText={(text) => setShipment((prev) => ({ ...prev, driver_name: text }))} style={inputStyle} />
              <TextInput placeholder="Driver Phone" placeholderTextColor={colors.mutedForeground} value={shipment.driver_phone} onChangeText={(text) => setShipment((prev) => ({ ...prev, driver_phone: text }))} style={inputStyle} keyboardType="phone-pad" />
            </View>

            <View style={cardStyle}>
              <Text style={{ color: colors.primary, fontWeight: "900", marginBottom: 8 }}>Load Details</Text>
              {goodsRows.map((row, idx) => (
                <View key={`row-${idx}`} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, marginBottom: 10 }}>
                  <Text style={{ color: colors.foreground, fontWeight: "800", marginBottom: 8 }}>Row {idx + 1}</Text>
                  <TextInput placeholder="Description" placeholderTextColor={colors.mutedForeground} value={row.description} onChangeText={(text) => updateGoodsRow(idx, "description", text)} style={inputStyle} />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput placeholder="Weight" placeholderTextColor={colors.mutedForeground} value={row.actual_weight} onChangeText={(text) => updateGoodsRow(idx, "actual_weight", text)} style={[inputStyle, { flex: 1 }]} keyboardType="numeric" />
                    <TextInput placeholder="Unit" placeholderTextColor={colors.mutedForeground} value={row.unit} onChangeText={(text) => updateGoodsRow(idx, "unit", text)} style={[inputStyle, { flex: 1 }]} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput placeholder="Quantity" placeholderTextColor={colors.mutedForeground} value={row.quantity} onChangeText={(text) => updateGoodsRow(idx, "quantity", text)} style={[inputStyle, { flex: 1 }]} keyboardType="numeric" />
                    <TextInput placeholder="Rate" placeholderTextColor={colors.mutedForeground} value={row.rate} onChangeText={(text) => updateGoodsRow(idx, "rate", text)} style={[inputStyle, { flex: 1 }]} keyboardType="numeric" />
                  </View>
                  <TextInput placeholder="Total" placeholderTextColor={colors.mutedForeground} value={row.total} onChangeText={(text) => updateGoodsRow(idx, "total", text)} style={inputStyle} keyboardType="numeric" />
                </View>
              ))}
              <TouchableOpacity
                onPress={() =>
                  setGoodsRows((prev) => [
                    ...prev,
                    { sr_no: prev.length + 1, description: "", quantity: "", unit: "Nos", actual_weight: "", rate: "", total: "" },
                  ])
                }
                style={{ backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: "center" }}
              >
                <Text style={{ color: colors.primary, fontWeight: "800" }}>+ Add Row</Text>
              </TouchableOpacity>
            </View>

            <View style={cardStyle}>
              <Text style={{ color: colors.primary, fontWeight: "900", marginBottom: 8 }}>Charges</Text>
              <TextInput placeholder="Freight" placeholderTextColor={colors.mutedForeground} value={charges.freight} onChangeText={(text) => setCharges((prev) => recalcCharges({ ...prev, freight: text }))} style={inputStyle} keyboardType="numeric" />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput placeholder="Loading" placeholderTextColor={colors.mutedForeground} value={charges.loading} onChangeText={(text) => setCharges((prev) => recalcCharges({ ...prev, loading: text }))} style={[inputStyle, { flex: 1 }]} keyboardType="numeric" />
                <TextInput placeholder="Unloading" placeholderTextColor={colors.mutedForeground} value={charges.unloading} onChangeText={(text) => setCharges((prev) => recalcCharges({ ...prev, unloading: text }))} style={[inputStyle, { flex: 1 }]} keyboardType="numeric" />
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput placeholder="Total" placeholderTextColor={colors.mutedForeground} value={charges.total} style={[inputStyle, { flex: 1 }]} editable={false} />
                <TextInput placeholder="Balance" placeholderTextColor={colors.mutedForeground} value={charges.balance} style={[inputStyle, { flex: 1 }]} editable={false} />
              </View>
            </View>
          </>
        )}

        {step === 4 && (
          <View style={cardStyle}>
            <Text style={{ color: colors.primary, fontWeight: "900", marginBottom: 8 }}>Insurance Details</Text>
            <TouchableOpacity
              style={{ borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, borderRadius: 12, paddingVertical: 18, alignItems: "center", marginBottom: 14 }}
            >
              <Text style={{ color: colors.primary, fontWeight: "700" }}>+ Add Insurance</Text>
            </TouchableOpacity>

            <Text style={{ color: colors.primary, fontWeight: "900", marginBottom: 8 }}>Waybill Details</Text>
            <TextInput placeholder="E-Waybill No" placeholderTextColor={colors.mutedForeground} value={shipment.eway_bill_no} onChangeText={(text) => setShipment((prev) => ({ ...prev, eway_bill_no: text }))} style={inputStyle} />
            <TextInput placeholder="Goods Invoice No" placeholderTextColor={colors.mutedForeground} value={shipment.invoice_no} onChangeText={(text) => setShipment((prev) => ({ ...prev, invoice_no: text }))} style={inputStyle} />
            <TextInput placeholder="Invoice Value" placeholderTextColor={colors.mutedForeground} value={shipment.invoice_value} onChangeText={(text) => setShipment((prev) => ({ ...prev, invoice_value: text }))} style={inputStyle} keyboardType="numeric" />

            <Text style={{ color: colors.primary, fontWeight: "900", marginBottom: 8 }}>Payment Type</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {[
                { id: "to_pay", label: "To Pay" },
                { id: "paid", label: "Paid" },
                { id: "billed", label: "Billed" },
              ].map((item) => {
                const active = paymentType === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setPaymentType(item.id as any)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : colors.background,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontWeight: "800" }}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ color: colors.primary, fontWeight: "900", marginBottom: 8 }}>Terms & Conditions</Text>
            <TextInput
              placeholder="Terms"
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              style={[inputStyle, { height: 80, textAlignVertical: "top", paddingTop: 10 }]}
              multiline
            />

            <TouchableOpacity onPress={handleSaveDraft} disabled={loading} style={{ backgroundColor: colors.secondary, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 10 }}>
              <Text style={{ color: colors.foreground, fontWeight: "900" }}>{loading ? "Saving..." : "Save Draft"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGenerate} disabled={loading} style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 10 }}>
              <Text style={{ color: colors.primaryForeground, fontWeight: "900" }}>{loading ? "Generating..." : "Done"}</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={async () => {
                  if (!generatedId) {
                    Alert.alert("No bilty", "Generate bilty first.");
                    return;
                  }
                  const doc = await getBiltyById(generatedId);
                  await openPdfPreview(doc);
                }}
                style={{ flex: 1, backgroundColor: colors.infoSoft, borderWidth: 1, borderColor: colors.info, paddingVertical: 11, borderRadius: 10, alignItems: "center" }}
              >
                <Text style={{ color: colors.info, fontWeight: "800" }}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShareDownload} style={{ flex: 1, backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.success, paddingVertical: 11, borderRadius: 10, alignItems: "center" }}>
                <Text style={{ color: colors.success, fontWeight: "800" }}>Download / Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, padding: 12, flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          disabled={!canGoBack}
          onPress={() => setStep((prev) => Math.max(1, prev - 1))}
          style={{
            flex: 1,
            backgroundColor: canGoBack ? colors.secondary : colors.card,
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
          onPress={() => setStep((prev) => Math.min(4, prev + 1))}
          style={{
            flex: 1,
            backgroundColor: canGoNext ? colors.primary : colors.card,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            opacity: canGoNext ? 1 : 0.5,
          }}
        >
          <Text style={{ color: canGoNext ? colors.primaryForeground : colors.foreground, fontWeight: "900" }}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
