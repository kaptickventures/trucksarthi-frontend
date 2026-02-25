import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CheckCircle, ShieldCheck, XCircle, Loader2, CreditCard, Building2 } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import "../../global.css";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { useKYC } from "../../hooks/useKYC";

export default function KYCVerification() {
    const router = useRouter();
    const params = useLocalSearchParams<{ tab?: "pan" | "gstin" | "bank" }>();
    const { colors } = useThemeStore();
    const { user, refreshUser, updateUser } = useUser();
    const { verifyPAN, verifyGSTIN, verifyBank, loading: kycLoading } = useKYC();

    const [pan, setPan] = useState("");
    const [gstin, setGstin] = useState("");
    const [bankAccount, setBankAccount] = useState("");
    const [ifsc, setIfsc] = useState("");
    const [activeTab, setActiveTab] = useState<"pan" | "gstin" | "bank">(params.tab || "pan");

    const [isVerifying, setIsVerifying] = useState(false);

    const isPanVerifiedNow = user?.is_pan_verified && (!pan || pan === user?.pan_number);
    const isGstinVerifiedNow = user?.is_gstin_verified && (!gstin || gstin === user?.gstin);
    const isBankVerifiedNow = user?.is_bank_verified && (!bankAccount || bankAccount === user?.account_number) && (!ifsc || ifsc === user?.ifsc_code);

    const VerifiedValue = ({ label, value }: { label: string; value?: string }) => {
        if (!value) return null;
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <CheckCircle size={14} color="#16a34a" />
                <Text style={{ color: colors.mutedForeground, fontSize: 13, marginLeft: 6 }}>
                    {label}: {value}
                </Text>
            </View>
        );
    };

    const handleVerifyPAN = async () => {
        if (!pan || pan.length !== 10) {
            Alert.alert("Error", "Please enter a valid 10-digit PAN number");
            return;
        }
        try {
            setIsVerifying(true);
            const result = await verifyPAN(pan);
            if (result.verified) {
                const verifiedName = result.data?.registered_name;

                Alert.alert(
                    "Verification Successful",
                    `PAN verified for ${verifiedName}. Would you like to save these details to your profile?`,
                    [
                        {
                            text: "No",
                            style: "cancel",
                            onPress: () => {
                                setPan("");
                                refreshUser();
                            }
                        },
                        {
                            text: "Yes, Save Details",
                            onPress: async () => {
                                try {
                                    await updateUser({
                                        pan_number: pan,
                                        name_as_on_pan: verifiedName
                                    });
                                    Alert.alert("Success", "Profile updated successfully!");
                                    setPan("");
                                    refreshUser();
                                } catch (err) {
                                    Alert.alert("Error", "Verified but could not update profile.");
                                }
                            }
                        }
                    ]
                );
            } else {
                Alert.alert("Verification Failed", result.message || "Invalid PAN details");
            }
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Something went wrong during PAN verification");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerifyGSTIN = async () => {
        if (!gstin) {
            Alert.alert("Error", "Please enter a GSTIN");
            return;
        }
        try {
            const result = await verifyGSTIN(gstin);
            if (result.verified) {
                const gstinData = result.data || {};
                const legalName = gstinData.legal_name_of_business;
                const tradeName = gstinData.trade_name_of_business;
                const principalAddress = gstinData.principal_place_address;

                Alert.alert(
                    "Verification Successful",
                    `GSTIN verified for ${legalName || gstin}. Save this business to your profile?`,
                    [
                        { text: "No", style: "cancel", onPress: () => { setGstin(""); refreshUser(); } },
                        {
                            text: "Yes, Save",
                            onPress: async () => {
                                try {
                                    await updateUser({
                                        gstin: gstin.toUpperCase(),
                                        company_name: legalName || tradeName || undefined,
                                        address: principalAddress || user?.address,
                                        is_gstin_verified: true,
                                        kyc_data: {
                                            ...(user?.kyc_data || {}),
                                            gstin_details: gstinData
                                        }
                                    });
                                    Alert.alert("Success", "Business profile updated!");
                                    setGstin("");
                                    refreshUser();
                                } catch (err) {
                                    Alert.alert("Error", "Verified but failed to update profile.");
                                }
                            }
                        }
                    ]
                );
            } else {
                Alert.alert("Verification Failed", result.message || "Invalid GSTIN details");
            }
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Something went wrong during GSTIN verification");
        }
    };

    const handleVerifyBank = async () => {
        if (!bankAccount || !ifsc) {
            Alert.alert("Error", "Please enter bank account number and IFSC code");
            return;
        }
        try {
            setIsVerifying(true);
            const result = await verifyBank(bankAccount, ifsc);
            if (result.verified) {
                const nameAtBank = result.data?.name_at_bank;

                Alert.alert(
                    "Verification Successful",
                    `Account verified for ${nameAtBank}. Save to your profile?`,
                    [
                        { text: "No", style: "cancel", onPress: () => { setBankAccount(""); setIfsc(""); refreshUser(); } },
                        {
                            text: "Yes, Save",
                            onPress: async () => {
                                try {
                                    await updateUser({
                                        account_number: bankAccount,
                                        ifsc_code: ifsc
                                    });
                                    Alert.alert("Success", "Bank details updated!");
                                    setBankAccount("");
                                    setIfsc("");
                                    refreshUser();
                                } catch (err) {
                                    Alert.alert("Error", "Verified but failed to update profile.");
                                }
                            }

                        }
                    ]
                );
            } else {
                Alert.alert("Verification Failed", result.message || "Invalid Bank details");
            }
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Something went wrong during Bank verification");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>KYC Verification</Text>
                </View>

                <KeyboardAwareScrollView enableOnAndroid extraScrollHeight={60} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                    {!(user?.is_pan_verified && user?.is_bank_verified) && (
                        <View style={{ backgroundColor: colors.primary + '10', padding: 20, borderRadius: 16, marginBottom: 24, flexDirection: 'row', gap: 15, alignItems: 'center' }}>
                            <ShieldCheck size={32} color={colors.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.foreground, fontWeight: 'bold', fontSize: 16 }}>Complete Your KYC</Text>
                                <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>Verify your identity to unlock all features and ensure secure payouts.</Text>
                            </View>
                        </View>
                    )}

                    {/* Tabs */}
                    <View style={{ flexDirection: 'row', backgroundColor: colors.card, padding: 4, borderRadius: 12, marginBottom: 24 }}>
                        <TouchableOpacity
                            onPress={() => setActiveTab('pan')}
                            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: activeTab === 'pan' ? colors.background : 'transparent' }}
                        >
                            <Text style={{ fontWeight: 'bold', color: activeTab === 'pan' ? colors.primary : colors.mutedForeground }}>PAN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('gstin')}
                            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: activeTab === 'gstin' ? colors.background : 'transparent' }}
                        >
                            <Text style={{ fontWeight: 'bold', color: activeTab === 'gstin' ? colors.primary : colors.mutedForeground }}>GSTIN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('bank')}
                            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: activeTab === 'bank' ? colors.background : 'transparent' }}
                        >
                            <Text style={{ fontWeight: 'bold', color: activeTab === 'bank' ? colors.primary : colors.mutedForeground }}>Bank</Text>
                        </TouchableOpacity>
                    </View>

                    {/* PAN Section */}
                    {activeTab === 'pan' && (
                        <View>
                            <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <CreditCard size={24} color={colors.primary} />
                                    {isPanVerifiedNow ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                                            <CheckCircle size={14} color="#16a34a" />
                                            <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>Verified</Text>
                                        </View>
                                    ) : isVerifying ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                                            <Loader2 size={14} color="#f59e0b" />
                                            <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>Verifying...</Text>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                                            <XCircle size={14} color="#dc2626" />
                                            <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>Pending</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={{ gap: 16 }}>
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase' }}>PAN Number</Text>
                                            {isPanVerifiedNow && <CheckCircle size={14} color="#16a34a" />}
                                        </View>
                                        <TextInput
                                            value={pan}
                                            onChangeText={setPan}
                                            placeholder={user?.pan_number || "ABCDE1234F"}
                                            placeholderTextColor={colors.mutedForeground}
                                            autoCapitalize="characters"
                                            maxLength={10}
                                            style={{ backgroundColor: colors.background, padding: 14, borderRadius: 12, color: colors.foreground, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                                        />
                                        <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 6, fontStyle: 'italic' }}>Name will be auto-fetched from PAN verification</Text>
                                    </View>
                                </View>

                                {!isPanVerifiedNow && (
                                    <TouchableOpacity
                                        onPress={handleVerifyPAN}
                                        disabled={isVerifying}
                                        style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, flexDirection: 'row', justifyContent: 'center', gap: 10, opacity: isVerifying ? 0.7 : 1 }}
                                    >
                                        {isVerifying ? (
                                            <>
                                                <ActivityIndicator color={colors.primaryForeground} />
                                                <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Verifying...</Text>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck size={20} color={colors.primaryForeground} />
                                                <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', fontSize: 16 }}>Verify PAN Card</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>

                            {isPanVerifiedNow && user.kyc_data?.pan_details && (
                                <View style={{ marginTop: 20, padding: 16, borderRadius: 12, backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: '#16a34a' }}>
                                    <Text style={{ fontWeight: 'bold', color: colors.foreground, fontSize: 14 }}>Verified Details:</Text>
                                    <VerifiedValue label="Registered Name" value={user.kyc_data.pan_details.registered_name} />
                                    <VerifiedValue label="Type" value={user.kyc_data.pan_details.type} />
                                </View>
                            )}
                        </View>
                    )}

                    {/* GSTIN Section */}
                    {activeTab === 'gstin' && (
                        <View>
                            <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <Building2 size={24} color={colors.primary} />
                                    {isGstinVerifiedNow ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                                            <CheckCircle size={14} color="#16a34a" />
                                            <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>Verified</Text>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                                            <XCircle size={14} color="#dc2626" />
                                            <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>Pending</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={{ gap: 16 }}>
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase' }}>GSTIN</Text>
                                            {isGstinVerifiedNow && <CheckCircle size={14} color="#16a34a" />}
                                        </View>
                                        <TextInput
                                            value={gstin}
                                            onChangeText={setGstin}
                                            placeholder={user?.gstin || "29AAICP2912R1ZR"}
                                            placeholderTextColor={colors.mutedForeground}
                                            autoCapitalize="characters"
                                            style={{ backgroundColor: colors.background, padding: 14, borderRadius: 12, color: colors.foreground, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                                        />
                                    </View>
                                </View>

                                {!isGstinVerifiedNow && (
                                    <TouchableOpacity
                                        onPress={handleVerifyGSTIN}
                                        disabled={kycLoading}
                                        style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, flexDirection: 'row', justifyContent: 'center', gap: 10 }}
                                    >
                                        {kycLoading ? <ActivityIndicator color={colors.primaryForeground} /> : (
                                            <>
                                                <ShieldCheck size={20} color={colors.primaryForeground} />
                                                <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', fontSize: 16 }}>Verify GSTIN</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>

                            {isGstinVerifiedNow && user.kyc_data?.gstin_details && (
                                <View style={{ marginTop: 20, padding: 16, borderRadius: 12, backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: '#16a34a' }}>
                                    <Text style={{ fontWeight: 'bold', color: colors.foreground, fontSize: 14 }}>Verified Business Details:</Text>
                                    <VerifiedValue label="Legal Name" value={user.kyc_data.gstin_details.legal_name_of_business} />
                                    <VerifiedValue label="Trade Name" value={user.kyc_data.gstin_details.trade_name_of_business} />
                                    <VerifiedValue label="Taxpayer Type" value={user.kyc_data.gstin_details.taxpayer_type} />
                                    <VerifiedValue label="Status" value={user.kyc_data.gstin_details.gst_in_status} />
                                    <VerifiedValue label="Principal Address" value={user.kyc_data.gstin_details.principal_place_address} />
                                </View>
                            )}
                        </View>
                    )}

                    {/* Bank Section */}
                    {activeTab === 'bank' && (
                        <View>
                            <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <Building2 size={24} color={colors.primary} />
                                    {isBankVerifiedNow ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                                            <CheckCircle size={14} color="#16a34a" />
                                            <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>Verified</Text>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                                            <XCircle size={14} color="#dc2626" />
                                            <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>Pending</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={{ gap: 16 }}>
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase' }}>Account Number</Text>
                                            {isBankVerifiedNow && <CheckCircle size={14} color="#16a34a" />}
                                        </View>
                                        <TextInput
                                            value={bankAccount}
                                            onChangeText={setBankAccount}
                                            placeholder={user?.account_number || "Enter Account Number"}
                                            placeholderTextColor={colors.mutedForeground}
                                            keyboardType="numeric"
                                            style={{ backgroundColor: colors.background, padding: 14, borderRadius: 12, color: colors.foreground, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                                        />
                                    </View>
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase' }}>IFSC Code</Text>
                                            {isBankVerifiedNow && <CheckCircle size={14} color="#16a34a" />}
                                        </View>
                                        <TextInput
                                            value={ifsc}
                                            onChangeText={setIfsc}
                                            placeholder={user?.ifsc_code || "HDFC0001234"}
                                            placeholderTextColor={colors.mutedForeground}
                                            autoCapitalize="characters"
                                            style={{ backgroundColor: colors.background, padding: 14, borderRadius: 12, color: colors.foreground, fontSize: 16, borderWidth: 1, borderColor: colors.border }}
                                        />
                                    </View>
                                </View>

                                {!isBankVerifiedNow && (
                                    <TouchableOpacity
                                        onPress={handleVerifyBank}
                                        disabled={isVerifying}
                                        style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, flexDirection: 'row', justifyContent: 'center', gap: 10, opacity: isVerifying ? 0.7 : 1 }}
                                    >
                                        {isVerifying ? <ActivityIndicator color={colors.primaryForeground} /> : (
                                            <>
                                                <ShieldCheck size={20} color={colors.primaryForeground} />
                                                <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', fontSize: 16 }}>Verify Bank Account</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>

                            {isBankVerifiedNow && user.kyc_data?.bank_details && (
                                <View style={{ marginTop: 20, padding: 16, borderRadius: 12, backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: '#16a34a' }}>
                                    <Text style={{ fontWeight: 'bold', color: colors.foreground, fontSize: 14 }}>Verified Bank Details:</Text>
                                    <VerifiedValue label="Beneficiary" value={user.kyc_data.bank_details.name_at_bank} />
                                    <VerifiedValue label="Bank" value={user.kyc_data.bank_details.bank_name} />
                                    <VerifiedValue label="Status" value={user.kyc_data.bank_details.account_status} />
                                </View>
                            )}
                        </View>
                    )}
                </KeyboardAwareScrollView>
            </View>
        </SafeAreaView>
    );
}
