import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FileText,
  Pencil
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";

import useDrivers from "../../hooks/useDriver";
import useDriverFinance, { CounterpartyType, TransactionNature } from "../../hooks/useDriverFinance";
import { THEME } from "../../theme";

export default function DriverProfile() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? THEME.dark : THEME.light;
  const { driver_id } = useLocalSearchParams<{ driver_id: string }>();
  const DRIVER_ID = useMemo(
    () => driver_id || null,
    [driver_id]
  );

  /* ---------------- DRIVER BASIC INFO ---------------- */
  const { drivers, loading, uploadLicense, uploadAadhaar, updateDriver, deleteDriver } = useDrivers();

  const driver = useMemo(() => {
    if (!DRIVER_ID || drivers.length === 0) return null;
    return drivers.find(
      (d) => d._id === DRIVER_ID
    );
  }, [drivers, DRIVER_ID]);


  /* ---------------- DRIVER LEDGER ---------------- */
  const {
    entries,
    fetchDriverLedger,
    fetchDriverSummary,
    addLedgerEntry,
  } = useDriverFinance();

  const [netBalance, setNetBalance] = useState<number>(0);


  /* ---------------- MODAL STATE ---------------- */
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // New Ledger Form State
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transactionNature, setTransactionNature] = useState<TransactionNature>("paid_by_driver");
  const [counterpartyType, setCounterpartyType] = useState<CounterpartyType>("owner");

  // Edit Driver Form State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [visibleEntries, setVisibleEntries] = useState(5);

  /* ---------------- INITIAL FETCH ---------------- */
  useEffect(() => {
    if (!DRIVER_ID) return;

    fetchDriverLedger(DRIVER_ID);
    fetchDriverSummary(DRIVER_ID).then((res) =>
      setNetBalance(res.net_balance)
    );
  }, [DRIVER_ID]);


  /* ---------------- ACTIONS ---------------- */
  const handleUpload = async (type: "LICENSE" | "AADHAAR") => {
    if (!DRIVER_ID) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.3,
      });

      if (result.canceled) return;
      const asset = result.assets[0];

      if (type === "LICENSE") {
        await uploadLicense(DRIVER_ID, {
          uri: asset.uri,
          name: "license.jpg",
          type: "image/jpeg",
        });
      } else {
        await uploadAadhaar(DRIVER_ID, {
          uri: asset.uri,
          name: "aadhaar.jpg",
          type: "image/jpeg",
        });
      }

      Alert.alert("Success", "Document uploaded successfully");
    } catch (e) {
      console.error(e);
    }
  };

  const handleCall = () => {
    if (!driver?.contact_number) return;
    Linking.openURL(`tel:${driver.contact_number}`);
  };

  const handleSaveEntry = async () => {
    if (!amount || !DRIVER_ID) return;
    if (!remarks.trim()) {
      Alert.alert("Required", "Please enter remarks.");
      return;
    }

    await addLedgerEntry({
      driver_id: DRIVER_ID,
      transaction_nature: transactionNature,
      counterparty_type: counterpartyType,
      amount: Number(amount),
      remarks,
      direction: transactionNature === "paid_by_driver" ? "to" : "from",
    });

    setAmount("");
    setRemarks("");
    setShowModal(false);

    fetchDriverLedger(DRIVER_ID);
    fetchDriverSummary(DRIVER_ID).then((res) =>
      setNetBalance(res.net_balance)
    );
  };

  /* ---------------- HELPERS ---------------- */
  const getTransactionTitle = (nature: TransactionNature | string, counterparty: CounterpartyType | string) => {
    if (!counterparty || typeof counterparty !== 'string') return "Transaction";
    const cpLabel = counterparty.charAt(0).toUpperCase() + counterparty.slice(1);
    if (nature === "paid_by_driver") {
      return `Paid by Driver TO ${cpLabel}`;
    } else if (nature === "received_by_driver") {
      return `Received by Driver FROM ${cpLabel}`;
    }
    return nature ? nature.replace(/_/g, " ") : "Transaction";
  };


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 8, color: theme.mutedForeground }}>Loading driver...</Text>
      </View>
    );
  }

}

/* ---------------- HELPERS ---------------- */

function DocumentCard({ label, url, onPress, onEdit }: any) {
  return (
    <View className="flex-1">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          aspectRatio: 1,
          width: "100%",
          backgroundColor: "#f3f4f6",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          borderWidth: 1,
          borderColor: "#e5e7eb",
        }}
      >
        {url ? (
          <>
            <Image
              source={{ uri: url }}
              style={{
                width: "100%",
                height: "100%",
              }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={onEdit}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: 8,
                borderRadius: 20,
                zIndex: 10,
              }}
            >
              <Pencil size={14} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
            <FileText size={36} color="#94a3b8" />
            <Text style={{ fontSize: 11, fontWeight: "bold", marginTop: 8, textTransform: "uppercase", color: "#94a3b8" }}>
              {label}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <Text className="text-center text-xs font-semibold mt-2 text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}

function SummaryCard({ label, value, green, red }: any) {
  return (
    <View className="flex-1 bg-card rounded-2xl p-3 justify-between min-h-[90px]">
      <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className={`text-lg font-bold mt-2 ${green
          ? "text-green-600"
          : red
            ? "text-red-600"
            : "text-card-foreground"
          }`}
      >
        ₹ {Number(value).toLocaleString()}
      </Text>
    </View>
  );
}
