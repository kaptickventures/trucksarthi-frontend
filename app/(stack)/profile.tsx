import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import {
  Briefcase,
  Building2,
  Calendar,
  Camera,
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

export default function Profile() {
  const router = useRouter();
  const navigation = useNavigation();
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
    name_as_on_pan: "",
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
        name_as_on_pan: user.name_as_on_pan ?? "",
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
    } catch (e) {
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

            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground, marginTop: 16 }}>
              {formData.name || "User"}
            </Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 4 }}>
              {formData.company_name || "Enterprise Account"}
            </Text>

            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={{
                marginTop: 16,
                backgroundColor: isEditing ? (theme === 'dark' ? '#450a0a' : '#fee2e2') : (theme === 'dark' ? '#064e3b' : '#f0fdf4'),
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20
              }}
            >
              <Text style={{ color: isEditing ? colors.destructive : colors.primary, fontWeight: 'bold', fontSize: 13 }}>
                {isEditing ? "Discard Changes" : "Edit Profile"}
              </Text>
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
                <SectionHeader title="Basic Details" icon={<UserIcon size={18} color={colors.primary} />} />
                <ProfileInput label="Full Name" value={formData.name} editable={isEditing} onChange={(v: string) => markChanged("name", v)} icon={<UserIcon size={18} color={colors.mutedForeground} />} />
                <ProfileInput label="Email Address" value={formData.email} editable={false} icon={<Mail size={18} color={colors.mutedForeground} />} />
                <ProfileInput label="Phone Number" value={formData.phone} editable={isEditing} onChange={(v: string) => markChanged("phone", v)} icon={<Phone size={18} color={colors.mutedForeground} />} />

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

                {/* PAN Details */}
                <SectionHeader title="Identity Verification" icon={<ShieldCheck size={18} color={colors.primary} />} />
                <ProfileInput label="PAN Number" value={formData.pan_number} editable={isEditing} onChange={(v: string) => markChanged("pan_number", v)} icon={<Hash size={18} color={colors.mutedForeground} />} autoCapitalize="characters" />
                <ProfileInput label="Name as on PAN" value={formData.name_as_on_pan} editable={isEditing} onChange={(v: string) => markChanged("name_as_on_pan", v)} icon={<UserIcon size={18} color={colors.mutedForeground} />} />
              </View>
            )}

            {activeTab === 'company' && (
              <View style={{ gap: 20 }}>
                <SectionHeader title="Business Information" icon={<Briefcase size={18} color={colors.primary} />} />
                <ProfileInput label="Company Name (As per GSTIN)" value={formData.company_name} editable={isEditing} onChange={(v: string) => markChanged("company_name", v)} icon={<Building2 size={18} color={colors.mutedForeground} />} />
                <ProfileInput label="GST Number" value={formData.gstin} editable={isEditing} onChange={(v: string) => markChanged("gstin", v)} icon={<Hash size={18} color={colors.mutedForeground} />} placeholder="Optional" />
                <ProfileInput label="Office Address" value={formData.address} editable={isEditing} onChange={(v: string) => markChanged("address", v)} icon={<MapPin size={18} color={colors.mutedForeground} />} multiline placeholder="Full street address" />
              </View>
            )}

            {activeTab === 'financial' && (
              <View style={{ gap: 20 }}>
                <SectionHeader title="Settlement Details" icon={<Landmark size={18} color={colors.primary} />} />
                <ProfileInput label="Bank Name" value={formData.bank_name} editable={isEditing} onChange={(v: string) => markChanged("bank_name", v)} icon={<Landmark size={18} color={colors.mutedForeground} />} />
                <ProfileInput label="Account Holder" value={formData.account_holder_name} editable={isEditing} onChange={(v: string) => markChanged("account_holder_name", v)} icon={<UserIcon size={18} color={colors.mutedForeground} />} />
                <ProfileInput label="Account Number" value={formData.account_number} editable={isEditing} onChange={(v: string) => markChanged("account_number", v)} icon={<Hash size={18} color={colors.mutedForeground} />} placeholder="Enter account number" />
                <ProfileInput label="IFSC Code" value={formData.ifsc_code} editable={isEditing} onChange={(v: string) => markChanged("ifsc_code", v)} icon={<ShieldCheck size={18} color={colors.mutedForeground} />} autoCapitalize="characters" />
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

const ProfileInput = ({ label, value, editable, onChange, icon, multiline, placeholder, autoCapitalize }: any) => {
  const { colors } = useThemeStore();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase' }}>{label}</Text>
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
      </View>
    </View>
  );
};
