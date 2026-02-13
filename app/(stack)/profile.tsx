import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Briefcase,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Hash,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User as UserIcon
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { formatDate, getFileUrl } from "../../lib/utils";
import API from "../api/axiosInstance";

export default function Profile() {
  const router = useRouter();
  const { theme, colors } = useThemeStore();
  const { user, updateUser, refreshUser, uploadProfilePicture, loading: userLoading } = useUser();

  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    date_of_birth: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    pan_number: "",
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "company" | "financial">("personal");
  const [contactOtpType, setContactOtpType] = useState<"email" | "phone" | null>(null);
  const [contactOtp, setContactOtp] = useState("");
  const [sendingContactOtp, setSendingContactOtp] = useState(false);
  const [verifyingContactOtp, setVerifyingContactOtp] = useState(false);

  // Bank verification states
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [bankVerificationResult, setBankVerificationResult] = useState<any>(null);
  const isKycVerified = Boolean(user?.is_pan_verified && user?.is_gstin_verified);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? "",
        company_name: user.company_name ?? "",
        date_of_birth: typeof user.date_of_birth === 'string' ? user.date_of_birth.substring(0, 10) : user.date_of_birth ? new Date(user.date_of_birth).toISOString().substring(0, 10) : "",
        phone: user.phone ?? "",
        email: user.email ?? "",
        address: user.address ?? "",
        gstin: user.gstin ?? "",
        pan_number: user.pan_number ?? "",
        bank_name: user.bank_name ?? "",
        account_holder_name: user.account_holder_name ?? "",
        account_number: user.account_number ?? "",
        ifsc_code: user.ifsc_code ?? "",
      });

      setProfileImage(user.profile_picture_url ?? null);

      if (user.date_of_birth) {
        const parsed = new Date(user.date_of_birth);
        if (!isNaN(parsed.getTime())) setDobDate(parsed);
      }
    }
  }, [user]);

  const markChanged = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleUpload = async (method: 'camera' | 'library') => {
    try {
      const { granted } = method === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!granted) {
        Alert.alert("Permission required", `Allow ${method === 'camera' ? 'camera' : 'photo'} access.`);
        return;
      }

      const res = await (method === 'camera'
        ? ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 }));

      if (!res.canceled) {
        setLoading(true);
        const file = res.assets[0];
        setProfileImage(file.uri);
        await uploadProfilePicture(file);
        Alert.alert("Success", "Profile photo updated!");
        refreshUser();
      }
    } catch {
      Alert.alert("Error", "Failed to update photo");
    } finally {
      setLoading(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      "Profile Photo",
      "Select an option",
      [
        { text: "Take Photo", onPress: () => handleUpload('camera') },
        { text: "Choose from Library", onPress: () => handleUpload('library') },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const onChangeDate = (event: any, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) {
      setDobDate(selected);
      markChanged("date_of_birth", selected.toISOString().split("T")[0]);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log("DEBUG: Saving Profile FormData:", JSON.stringify(formData, null, 2));
      await updateUser({
        ...formData,
        profile_picture_url: profileImage ?? undefined,
      });
      Alert.alert("Success", "Profile updated!");
      setIsEditing(false);
      setHasChanges(false);
      refreshUser();
    } catch {
      Alert.alert("Error", "Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleBankVerification = async () => {
    if (!formData.account_number || !formData.ifsc_code) {
      Alert.alert("Missing Information", "Please enter both Account Number and IFSC Code");
      return;
    }

    try {
      setVerifyingBank(true);
      const response = await API.post("/api/kyc/bank", {
        bank_account: formData.account_number,
        ifsc: formData.ifsc_code,
        name: formData.account_holder_name || formData.name,
        phone: formData.phone,
      });

      setBankVerificationResult(response.data);

      if (response.data.verified) {
        Alert.alert(
          "✅ Bank Account Verified!",
          `Account Holder: ${response.data.data.nameAtBank}\n` +
          `Bank: ${response.data.data.bankName}\n` +
          `Branch: ${response.data.data.branch}` +
          (response.data.data.nameMatchResult ? `\n\nName Match: ${response.data.data.nameMatchResult.replace(/_/g, ' ')}` : ""),
          [{ text: "OK", onPress: () => refreshUser() }]
        );
      } else {
        Alert.alert("Verification Failed", response.data.message || "Unable to verify bank account");
      }
    } catch (error: any) {
      console.error("Bank verification error:", error);
      Alert.alert(
        "Verification Error",
        error.response?.data?.message || "Failed to verify bank account. Please check your details."
      );
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleRequestSecondaryOtp = async (type: "email" | "phone") => {
    const value = type === "email" ? formData.email?.trim().toLowerCase() : formData.phone?.trim();
    if (!value) {
      Alert.alert("Missing Information", `Please add your ${type} first.`);
      return;
    }

    try {
      setSendingContactOtp(true);
      await API.post("/api/auth/request-secondary-otp", { type, value });
      setContactOtpType(type);
      setContactOtp("");
      Alert.alert("OTP Sent", `A verification OTP has been sent to your ${type}.`);
    } catch (error: any) {
      Alert.alert("Verification Failed", error?.response?.data?.error || `Failed to send OTP to ${type}.`);
    } finally {
      setSendingContactOtp(false);
    }
  };

  const handleVerifySecondaryOtp = async () => {
    if (!contactOtpType) return;
    if (!contactOtp.trim()) {
      Alert.alert("Enter OTP", "Please enter the OTP first.");
      return;
    }

    try {
      setVerifyingContactOtp(true);
      await API.post("/api/auth/verify-secondary-otp", { type: contactOtpType, otp: contactOtp.trim() });
      setContactOtp("");
      setContactOtpType(null);
      await refreshUser();
      Alert.alert("Success", "Contact verified successfully.");
    } catch (error: any) {
      Alert.alert("Verification Failed", error?.response?.data?.error || "Invalid OTP.");
    } finally {
      setVerifyingContactOtp(false);
    }
  };

  if (!user && userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>My Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={140}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* HEADER SECTION */}
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <View style={{ position: 'relative' }}>
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 4,
                borderColor: colors.primary,
                overflow: 'hidden',
                backgroundColor: colors.muted
              }}>
                {profileImage ? (
                  <Image source={{ uri: getFileUrl(profileImage) || "" }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon size={60} color={colors.mutedForeground} />
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={showPhotoOptions}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: colors.primary,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: colors.background
                }}
              >
                <Camera size={16} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground, marginTop: 16, textAlign: 'center' }}>
              {formData.company_name || "Enterprise Account"}
            </Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 4 }}>
              {formData.name || "User"}
            </Text>
          </View>

          {/* KYC PRIORITY CARD */}
          <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => router.push("/kyc-verification" as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isKycVerified ? '#f0fdf4' : '#fff7ed',
                padding: 14,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: isKycVerified ? '#86efac' : '#fdba74'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <ShieldCheck size={20} color={isKycVerified ? '#16a34a' : '#ea580c'} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 14, color: isKycVerified ? '#16a34a' : '#ea580c' }}>
                    KYC Status: {isKycVerified ? 'Verified' : 'Pending'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {isKycVerified ? 'Your PAN and GSTIN are verified.' : 'Complete KYC now to unlock all account features.'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* TABS */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {[
              { id: 'personal', label: 'Personal', icon: <UserIcon size={16} color={activeTab === 'personal' ? colors.primary : colors.mutedForeground} /> },
              { id: 'company', label: 'Business', icon: <Briefcase size={16} color={activeTab === 'company' ? colors.primary : colors.mutedForeground} /> },
              { id: 'financial', label: 'Banking', icon: <Landmark size={16} color={activeTab === 'financial' ? colors.primary : colors.mutedForeground} /> }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === tab.id ? colors.primary : 'transparent',
                  gap: 6
                }}
              >
                {tab.icon}
                <Text style={{ fontSize: 14, fontWeight: activeTab === tab.id ? 'bold' : '600', color: activeTab === tab.id ? colors.primary : colors.mutedForeground }}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB CONTENT */}
          <View style={{ padding: 24 }}>
            {activeTab === 'personal' && (
              <View style={{ gap: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <SectionHeader title="Basic Details" icon={<UserIcon size={18} color={colors.primary} />} />
                  <TouchableOpacity
                    onPress={() => setIsEditing(!isEditing)}
                    style={{
                      backgroundColor: isEditing ? (theme === 'dark' ? '#450a0a' : '#fee2e2') : (theme === 'dark' ? '#064e3b' : '#f0fdf4'),
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16
                    }}
                  >
                    <Text style={{ color: isEditing ? colors.destructive : colors.primary, fontWeight: 'bold', fontSize: 12 }}>
                      {isEditing ? "Stop Editing" : "Edit"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <ProfileInput label="Full Name" value={formData.name} editable={isEditing} onChange={(v: string) => markChanged("name", v)} icon={<UserIcon size={18} color={colors.mutedForeground} />} />
                <ProfileInput
                  label="Email Address"
                  value={formData.email}
                  editable={false}
                  icon={<Mail size={18} color={colors.mutedForeground} />}
                  labelAction={!user?.is_email_verified ? (sendingContactOtp && contactOtpType === "email" ? "Sending..." : "Verify") : undefined}
                  onLabelActionPress={!user?.is_email_verified ? () => handleRequestSecondaryOtp("email") : undefined}
                  rightNode={user?.is_email_verified ? <CheckCircle2 size={18} color="#16a34a" /> : undefined}
                />
                {contactOtpType === "email" && (
                  <View style={{ gap: 10, marginTop: -8 }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Enter OTP sent to your email.</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.card }}>
                        <TextInput
                          value={contactOtp}
                          onChangeText={setContactOtp}
                          keyboardType="number-pad"
                          placeholder="Enter 6-digit OTP"
                          placeholderTextColor={colors.mutedForeground}
                          style={{ paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14, fontWeight: "600" }}
                          maxLength={6}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={handleVerifySecondaryOtp}
                        disabled={verifyingContactOtp}
                        style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: "center" }}
                      >
                        {verifyingContactOtp ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>Verify</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <ProfileInput
                  label="Phone Number"
                  value={formData.phone}
                  editable={false}
                  icon={<Phone size={18} color={colors.mutedForeground} />}
                  labelAction={!user?.is_mobile_verified ? (sendingContactOtp && contactOtpType === "phone" ? "Sending..." : "Verify") : undefined}
                  onLabelActionPress={!user?.is_mobile_verified ? () => handleRequestSecondaryOtp("phone") : undefined}
                  rightNode={user?.is_mobile_verified ? <CheckCircle2 size={18} color="#16a34a" /> : undefined}
                />
                {contactOtpType === "phone" && (
                  <View style={{ gap: 10, marginTop: -8 }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Enter OTP sent to your phone.</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.card }}>
                        <TextInput
                          value={contactOtp}
                          onChangeText={setContactOtp}
                          keyboardType="number-pad"
                          placeholder="Enter 6-digit OTP"
                          placeholderTextColor={colors.mutedForeground}
                          style={{ paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14, fontWeight: "600" }}
                          maxLength={6}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={handleVerifySecondaryOtp}
                        disabled={verifyingContactOtp}
                        style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: "center" }}
                      >
                        {verifyingContactOtp ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>Verify</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, marginBottom: -12, textTransform: 'uppercase' }}>Date of Birth</Text>
                <TouchableOpacity
                  disabled={!isEditing}
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14
                  }}
                >
                  <Calendar size={18} color={colors.mutedForeground} />
                  <Text style={{ marginLeft: 12, color: colors.foreground, fontSize: 16 }}>{formData.date_of_birth ? formatDate(formData.date_of_birth) : "Select Date"}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker value={dobDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChangeDate} />
                )}
              </View>
            )}

            {activeTab === 'company' && (
              <View style={{ gap: 20 }}>
                <SectionHeader title="Business Information" icon={<Briefcase size={18} color={colors.primary} />} />
                <ProfileInput label="Company Name (As per GSTIN)" value={formData.company_name} editable={false} onChange={(v: string) => markChanged("company_name", v)} icon={<Building2 size={18} color={colors.mutedForeground} />} />
                <ProfileInput
                  label="GST Number"
                  value={formData.gstin}
                  editable={false}
                  onChange={(v: string) => markChanged("gstin", v)}
                  icon={<Hash size={18} color={colors.mutedForeground} />}
                  placeholder="Optional"
                  labelAction="Verify New"
                  onLabelActionPress={() => router.push("/kyc-verification" as any)}
                />
                <ProfileInput
                  label="PAN Number"
                  value={formData.pan_number}
                  editable={false}
                  onChange={(v: string) => markChanged("pan_number", v)}
                  icon={<Hash size={18} color={colors.mutedForeground} />}
                  autoCapitalize="characters"
                  labelAction="Verify New"
                  onLabelActionPress={() => router.push("/kyc-verification" as any)}
                />
                <ProfileInput label="Office Address" value={formData.address} editable={false} onChange={(v: string) => markChanged("address", v)} icon={<MapPin size={18} color={colors.mutedForeground} />} multiline placeholder="Full street address" />
              </View>
            )}

            {activeTab === 'financial' && (
              <View style={{ gap: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <SectionHeader title="Settlement Details" icon={<Landmark size={18} color={colors.primary} />} />
                  <TouchableOpacity
                    onPress={() => router.push("/kyc-verification" as any)}
                    style={{
                      backgroundColor: '#e0f2fe',
                      borderColor: '#7dd3fc',
                      borderWidth: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16
                    }}
                  >
                    <Text style={{ color: '#0369a1', fontWeight: '700', fontSize: 12 }}>Update</Text>
                  </TouchableOpacity>
                </View>

                {/* Bank Verification Status */}
                {(user?.is_bank_verified || bankVerificationResult?.verified) && (
                  <View style={{
                    backgroundColor: '#f0fdf4',
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#bbf7d0',
                    marginBottom: 8
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ShieldCheck size={20} color="#16a34a" />
                      <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#16a34a' }}>
                        Bank Account Verified ✓
                      </Text>
                    </View>
                    {bankVerificationResult?.data && (
                      <View style={{ marginTop: 8, gap: 4 }}>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                          Account Holder: {bankVerificationResult.data.nameAtBank}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                          Bank: {bankVerificationResult.data.bankName} - {bankVerificationResult.data.branch}
                        </Text>
                        {bankVerificationResult.data.nameMatchResult && (
                          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                            Name Match: {bankVerificationResult.data.nameMatchResult.replace(/_/g, ' ')}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                <ProfileInput label="Bank Name" value={formData.bank_name} editable={false} onChange={(v: string) => markChanged("bank_name", v)} icon={<Landmark size={18} color={colors.mutedForeground} />} />
                <ProfileInput label="Account Holder" value={formData.account_holder_name} editable={false} onChange={(v: string) => markChanged("account_holder_name", v)} icon={<UserIcon size={18} color={colors.mutedForeground} />} />
                <ProfileInput label="Account Number" value={formData.account_number} editable={false} onChange={(v: string) => markChanged("account_number", v)} icon={<Hash size={18} color={colors.mutedForeground} />} placeholder="Enter account number" />
                <ProfileInput label="IFSC Code" value={formData.ifsc_code} editable={false} onChange={(v: string) => markChanged("ifsc_code", v)} icon={<ShieldCheck size={18} color={colors.mutedForeground} />} autoCapitalize="characters" />

                {/* Verify Bank Button */}
                {formData.account_number && formData.ifsc_code && (
                  <TouchableOpacity
                    onPress={handleBankVerification}
                    disabled={verifyingBank}
                    style={{
                      backgroundColor: user?.is_bank_verified ? colors.muted : colors.primary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 8,
                      opacity: verifyingBank ? 0.7 : 1
                    }}
                  >
                    {verifyingBank ? (
                      <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ShieldCheck size={18} color={user?.is_bank_verified ? colors.mutedForeground : colors.primaryForeground} />
                        <Text style={{
                          color: user?.is_bank_verified ? colors.mutedForeground : colors.primaryForeground,
                          fontWeight: 'bold',
                          fontSize: 14
                        }}>
                          {user?.is_bank_verified ? 'Re-verify Bank Account' : 'Verify Bank Account'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {isEditing && hasChanges && (
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                style={{
                  backgroundColor: colors.primary,
                  marginTop: 40,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 6
                }}
              >
                {loading ? <ActivityIndicator color={colors.primaryForeground} /> : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Save size={20} color={colors.primaryForeground} />
                    <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', fontSize: 16, marginLeft: 10 }}>Save Profile Updates</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}

const SectionHeader = ({ title, icon }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
    {icon}
    <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: '#16a34a' }}>{title}</Text>
  </View>
);

const ProfileInput = ({ label, value, editable, onChange, icon, multiline, placeholder, autoCapitalize, labelAction, onLabelActionPress, rightNode }: any) => {
  const { colors } = useThemeStore();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase' }}>{label}</Text>
        {labelAction && (
          <TouchableOpacity
            onPress={onLabelActionPress}
            style={{
              backgroundColor: '#e0f2fe',
              borderColor: '#7dd3fc',
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999
            }}
          >
            <Text style={{ color: '#0369a1', fontWeight: '700', fontSize: 11 }}>{labelAction}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: multiline ? 12 : 0,
        opacity: editable === false ? 0.7 : 1
      }}>
        <View style={{ marginTop: multiline ? 4 : 0 }}>{icon}</View>
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1,
            paddingVertical: multiline ? 0 : 14,
            paddingHorizontal: 12,
            fontSize: 16,
            color: colors.foreground,
            textAlignVertical: multiline ? 'top' : 'center'
          }}
        />
        {rightNode ? <View style={{ marginRight: 2 }}>{rightNode}</View> : null}
      </View>
    </View>
  );
};
