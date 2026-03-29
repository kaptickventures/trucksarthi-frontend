import { useRouter } from "expo-router";
import { ArrowRight, Building2, CheckCircle2, Mail, MapPin, Smartphone, User } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useKYC } from "../../hooks/useKYC";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { normalizeAddressInput, normalizeGstinNumber, normalizePhoneInput } from "../../lib/utils";

type Step = "gstin" | "preview";

const normalizeGstin = (value: string) => normalizeGstinNumber(value);

export default function GstinOnboardingScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const { user, loading: userLoading, syncUser, refreshUser } = useUser();
  const { verifyGSTIN, loading: kycLoading } = useKYC();

  const [step, setStep] = useState<Step>("gstin");
  const [gstin, setGstin] = useState("");
  const [gstinDetails, setGstinDetails] = useState<any>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company_name, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    const currentEmail = user.email ?? "";
    const isPlaceholder = currentEmail.includes("@trucksarthi.com") && user.phone && currentEmail.startsWith(user.phone);
    setEmail(isPlaceholder ? "" : currentEmail);
    setPhone(user.phone ?? "");
    setCompany(user.company_name ?? "");
    setAddress(user.address ?? "");
    setGstin(user.gstin ?? "");

    if (user?.gstin && user?.kyc_data?.gstin_details) {
      const details = user.kyc_data.gstin_details;
      const legalName = details?.legal_name_of_business;
      const tradeName = details?.trade_name_of_business;
      const principalAddress = details?.principal_place_address;
      setGstinDetails(details);
      setCompany(tradeName || legalName || user.company_name || "");
      setAddress(principalAddress || user.address || "");
      setStep("preview");
    }
  }, [user]);

  const isEmailPlaceholder = useMemo(() => {
    const currentEmail = user?.email ?? "";
    return Boolean(currentEmail.includes("@trucksarthi.com") && user?.phone && currentEmail.startsWith(user?.phone));
  }, [user?.email, user?.phone]);

  const applyGstinDetails = (details: any, normalizedGstin: string) => {
    const legalName = details?.legal_name_of_business;
    const tradeName = details?.trade_name_of_business;
    const principalAddress = details?.principal_place_address;
    const preferredCompanyName = tradeName || legalName;

    setGstin(normalizedGstin);
    setGstinDetails(details || null);
    if (preferredCompanyName) setCompany(preferredCompanyName);
    if (principalAddress) setAddress(principalAddress);
  };

  const handleVerifyGstin = async () => {
    const normalized = normalizeGstin(gstin);
    if (normalized.length !== 15) {
      Alert.alert("Input Required", "Please enter a valid GSTIN number.");
      return;
    }

    try {
      const result = await verifyGSTIN(normalized);
      if (result?.verified) {
        const details = result?.data || {};
        applyGstinDetails(details, normalized);
        setStep("preview");
        Alert.alert("GSTIN Verified", "We have fetched your business details. Please review them below.");
      } else {
        Alert.alert("Verification Failed", result?.message || "Invalid GSTIN details");
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to verify GSTIN. Please try again.");
    }
  };

  const validate = () => {
    if (!gstinDetails) return "Please verify your GSTIN to continue.";
    if (!name.trim()) return "Full Name is required";
    if (!company_name.trim()) return "Company Name is required";
    const normalizedPhone = normalizePhoneInput(phone);
    if (normalizedPhone && normalizedPhone.length !== 13) return "Please enter a valid Mobile Number";
    if (!email.trim() || !email.includes("@")) return "A valid Email Address is required";
    if (!address.trim()) return "Address is required";
    return null;
  };

  const onSave = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Incomplete Profile", error);
      return;
    }

    try {
      setSaving(true);
      await syncUser({
        name: name.trim(),
        email: email.trim(),
        phone: normalizePhoneInput(phone),
        company_name: company_name.trim(),
        address: normalizeAddressInput(address),
        gstin: normalizeGstin(gstin),
        is_gstin_verified: Boolean(gstinDetails),
        kyc_data: gstinDetails
          ? {
              ...(user?.kyc_data || {}),
              gstin_details: gstinDetails,
            }
          : user?.kyc_data,
      });

      Alert.alert("Success", "Profile completed! Welcome to Trucksarthi.", [
        { text: "Go to Dashboard", onPress: () => router.replace("/(tabs)/home") },
      ]);
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message || "Failed to save profile";
      Alert.alert("Error", errorMsg);
    } finally {
      setSaving(false);
      refreshUser();
    }
  };

  if (userLoading && !user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.mutedForeground, fontWeight: "600" }}>Setting up your profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View
            style={{
              backgroundColor: theme === "dark" ? colors.muted : colors.successSoft,
              padding: 32,
              paddingBottom: 48,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
            }}
          >
            <Text style={{ fontSize: 30, fontWeight: "900", color: colors.foreground, marginBottom: 8 }}>
              {step === "gstin" ? "Verify GSTIN" : "Review Details"}
            </Text>
            <Text style={{ fontSize: 16, color: colors.mutedForeground, lineHeight: 22 }}>
              {step === "gstin"
                ? "Enter your GSTIN to auto-fill your business profile."
                : "Confirm the details below. Fill anything missing to finish onboarding."}
            </Text>
          </View>

          <View style={{ paddingHorizontal: 24, marginTop: -32 }}>
            {step === "gstin" ? (
              <View style={{ gap: 18 }}>
                <CustomInput
                  label="GSTIN NUMBER"
                  value={gstin}
                  onChange={(val: string) => setGstin(normalizeGstin(val))}
                  colors={colors}
                  placeholder="29AAICP2912R1ZR"
                  icon={<Building2 size={18} color={colors.mutedForeground} />}
                  autoCapitalize="characters"
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={kycLoading || normalizeGstin(gstin).length !== 15}
                  onPress={handleVerifyGstin}
                  style={{
                    backgroundColor: normalizeGstin(gstin).length === 15 ? colors.foreground : colors.muted,
                    borderRadius: 18,
                    paddingVertical: 18,
                    marginTop: 4,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {kycLoading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <>
                      <Text style={{ color: colors.background, fontSize: 16, fontWeight: "800" }}>Verify GSTIN</Text>
                      <ArrowRight size={20} color={colors.primary} strokeWidth={3} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 20 }}>
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 16,
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: colors.mutedForeground, letterSpacing: 1 }}>
                    GSTIN VERIFIED
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>
                    {company_name || gstin}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                    {gstin}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                    {address || "Address not found. Please add below."}
                  </Text>
                  <TouchableOpacity onPress={() => { setStep("gstin"); setGstinDetails(null); }} style={{ marginTop: 8 }}>
                    <Text style={{ color: colors.primary, fontWeight: "700" }}>Change GSTIN</Text>
                  </TouchableOpacity>
                </View>

                <CustomInput
                  label="FULL NAME"
                  value={name}
                  onChange={setName}
                  colors={colors}
                  placeholder="Enter your full name"
                  icon={<User size={18} color={colors.mutedForeground} />}
                />

                <CustomInput
                  label="COMPANY NAME"
                  value={company_name}
                  onChange={setCompany}
                  colors={colors}
                  placeholder="Your fleet or business name"
                  icon={<Building2 size={18} color={colors.mutedForeground} />}
                />

                <CustomInput
                  label="MOBILE NUMBER"
                  value={phone}
                  onChange={(val: string) => setPhone(normalizePhoneInput(val))}
                  colors={colors}
                  placeholder="+91 XXXXX XXXXX"
                  icon={<Smartphone size={18} color={colors.mutedForeground} />}
                  keyboardType="phone-pad"
                  maxLength={13}
                />

                <CustomInput
                  label="EMAIL ADDRESS"
                  value={email}
                  onChange={setEmail}
                  colors={colors}
                  editable={isEmailPlaceholder}
                  placeholder="email@example.com"
                  icon={<Mail size={18} color={colors.mutedForeground} />}
                  containerStyle={!isEmailPlaceholder ? { opacity: 0.7, backgroundColor: colors.muted } : {}}
                />

                <CustomInput
                  label="OFFICE ADDRESS"
                  value={address}
                  onChange={setAddress}
                  colors={colors}
                  placeholder="Address Line 1, Address Line 2, State, Pincode"
                  icon={<MapPin size={18} color={colors.mutedForeground} />}
                  multiline
                  height={100}
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={saving}
                  onPress={onSave}
                  style={{
                    backgroundColor: colors.foreground,
                    borderRadius: 18,
                    paddingVertical: 20,
                    marginTop: 10,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.2,
                    shadowRadius: 15,
                    elevation: 8,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <>
                      <Text style={{ color: colors.background, fontSize: 16, fontWeight: "800" }}>Complete Setup</Text>
                      <ArrowRight size={20} color={colors.primary} strokeWidth={3} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const CustomInput = ({
  label,
  value,
  onChange,
  placeholder,
  icon,
  multiline,
  height,
  editable = true,
  containerStyle,
  autoCapitalize,
  keyboardType,
  maxLength,
  colors,
}: any) => (
  <View>
    <Text style={{ fontSize: 12, fontWeight: "800", color: colors.mutedForeground, marginBottom: 8, marginLeft: 4 }}>{label}</Text>
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: multiline ? 12 : 0,
          gap: 12,
        },
        containerStyle,
      ]}
    >
      <View style={{ marginTop: multiline ? 4 : 0 }}>{icon}</View>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={{
          flex: 1,
          fontSize: 16,
          fontWeight: "600",
          color: colors.foreground,
          paddingVertical: Platform.OS === "ios" ? 14 : 10,
          height: height || "auto",
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
      {editable === false && value ? <CheckCircle2 size={16} color={colors.success} /> : null}
    </View>
  </View>
);
