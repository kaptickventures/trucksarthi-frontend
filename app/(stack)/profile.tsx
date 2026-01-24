import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import { Briefcase, Building2, Calendar, Hash, Landmark, Mail, MapPin, Phone, Save, ShieldCheck, User as UserIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useUser } from "../../hooks/useUser";
import { getFileUrl } from "../../lib/utils";
import { THEME } from "../../theme";

export default function Profile() {
  const router = useRouter();
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";
  const { user, updateUser, refreshUser, uploadProfilePicture } = useUser();

  // Correct theme mapping
  const theme = {
    card: isDark ? THEME.dark.card : THEME.light.card,
    border: isDark ? THEME.dark.border : THEME.light.border,
    muted: isDark ? THEME.dark.muted : THEME.light.muted,
    mutedForeground: isDark
      ? THEME.dark.mutedForeground
      : THEME.light.mutedForeground,
    primary: isDark ? THEME.dark.primary : THEME.light.primary,
    primaryForeground: isDark
      ? THEME.dark.primaryForeground
      : THEME.light.primaryForeground,
    background: isDark ? THEME.dark.background : THEME.light.background,
    foreground: isDark ? THEME.dark.foreground : THEME.light.foreground,
    shadow: isDark ? "#00000055" : "#00000022",
  };

  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    date_of_birth: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    bank_name: "",
    account_holder_name: "",
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
        phone: user.phone ?? "+91 ",
        email: user.email ?? "",
        address: user.address ?? "",
        gstin: user.gstin ?? "",
        bank_name: user.bank_name ?? "",
        account_holder_name: user.account_holder_name ?? "",
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

  // Image logic
  const pickFromLibrary = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert("Permission required", "Allow photo access.");

    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!res.canceled) {
      try {
        setLoading(true);
        const file = res.assets[0];

        // Optimistic update
        setProfileImage(file.uri);

        // Actual upload
        await uploadProfilePicture(file);

        Alert.alert("Success", "Profile photo updated!");
        refreshUser();
      } catch (e) {
        Alert.alert("Error", "Failed to upload photo");
        setProfileImage(user?.profile_picture_url ?? null); // Revert
      } finally {
        setLoading(false);
      }
    }
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert("Permission required", "Allow camera access.");

    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!res.canceled) {
      try {
        setLoading(true);
        const file = res.assets[0];

        // Optimistic update
        setProfileImage(file.uri);

        // Actual upload
        await uploadProfilePicture(file);

        Alert.alert("Success", "Profile photo updated!");
        refreshUser();
      } catch (e) {
        Alert.alert("Error", "Failed to upload photo");
        setProfileImage(user?.profile_picture_url ?? null); // Revert
      } finally {
        setLoading(false);
      }
    }
  };

  const removePhoto = () => {
    setProfileImage(null);
    setHasChanges(true);
  };

  const showPhotoOptions = () => {
    const opts = [
      { text: "Take Photo", action: takePhoto },
      { text: "Choose from Library", action: pickFromLibrary },
      profileImage ? { text: "Remove Photo", action: removePhoto, style: "destructive" } : null,
      { text: "Cancel", style: "cancel" },
    ].filter(Boolean);

    Alert.alert(
      "Profile Photo",
      "Select an option",
      opts.map((o: any) => ({
        text: o.text,
        onPress: o.action,
        style: o.style,
      }))
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

      await updateUser({
        name: formData.name,
        company_name: formData.company_name,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        gstin: formData.gstin,
        bank_name: formData.bank_name,
        account_holder_name: formData.account_holder_name,
        ifsc_code: formData.ifsc_code,
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

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="text-muted-foreground mt-2">Loading profile…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1 }}>


        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={140}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* PREMIUM HEADER SECTION */}
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <View style={{ position: 'relative' }}>
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 4,
                borderColor: '#16a34a',
                overflow: 'hidden',
                backgroundColor: theme.muted
              }}>
                {profileImage ? (
                  <Image source={{ uri: getFileUrl(profileImage) || "" }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon size={60} color={theme.mutedForeground} />
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => { if (!isEditing) setIsEditing(true); showPhotoOptions(); }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#16a34a',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: theme.background
                }}
              >
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.foreground, marginTop: 16 }}>
              {formData.name || "User Name"}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Building2 size={14} color={theme.mutedForeground} />
              <Text style={{ fontSize: 14, color: theme.mutedForeground, marginLeft: 6 }}>
                {formData.company_name || "Enterprise"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={{
                marginTop: 16,
                backgroundColor: isEditing ? '#fee2e2' : '#f0fdf4',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20
              }}
            >
              <Text style={{ color: isEditing ? '#ef4444' : '#16a34a', fontWeight: 'bold', fontSize: 13 }}>
                {isEditing ? "Discard Changes" : "Edit Profile"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB NAVIGATION */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            {[
              { id: 'personal', label: 'Personal', icon: <UserIcon size={16} color={activeTab === 'personal' ? '#16a34a' : theme.mutedForeground} /> },
              { id: 'company', label: 'Business', icon: <Briefcase size={16} color={activeTab === 'company' ? '#16a34a' : theme.mutedForeground} /> },
              { id: 'financial', label: 'Banking', icon: <Landmark size={16} color={activeTab === 'financial' ? '#16a34a' : theme.mutedForeground} /> }
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
                  borderBottomColor: activeTab === tab.id ? '#16a34a' : 'transparent',
                  gap: 6
                }}
              >
                {tab.icon}
                <Text style={{
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 'bold' : '600',
                  color: activeTab === tab.id ? '#16a34a' : theme.mutedForeground
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB CONTENT */}
          <View style={{ padding: 24 }}>
            {activeTab === 'personal' && (
              <View style={{ gap: 20 }}>
                <SectionHeader title="Basic Details" icon={<UserIcon size={18} color="#16a34a" />} />
                <ProfileInput label="Full Name" value={formData.name} editable={isEditing} onChange={(v: string) => markChanged("name", v)} icon={<UserIcon size={18} color={theme.mutedForeground} />} />
                <ProfileInput label="Email Address" value={formData.email} editable={false} icon={<Mail size={18} color={theme.mutedForeground} />} />
                <ProfileInput label="Phone Number" value={formData.phone} editable={false} icon={<Phone size={18} color={theme.mutedForeground} />} />

                <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.mutedForeground, marginBottom: -12, textTransform: 'uppercase' }}>Date of Birth</Text>
                <TouchableOpacity
                  disabled={!isEditing}
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.card,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14
                  }}
                >
                  <Calendar size={18} color={theme.mutedForeground} />
                  <Text style={{ marginLeft: 12, color: theme.foreground, fontSize: 16 }}>
                    {formData.date_of_birth || "Select Date"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dobDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChangeDate}
                  />
                )}
              </View>
            )}

            {activeTab === 'company' && (
              <View style={{ gap: 20 }}>
                <SectionHeader title="Business Information" icon={<Briefcase size={18} color="#16a34a" />} />
                <ProfileInput label="Company Name" value={formData.company_name} editable={isEditing} onChange={(v: string) => markChanged("company_name", v)} icon={<Building2 size={18} color={theme.mutedForeground} />} />
                <ProfileInput label="GST Number" value={formData.gstin} editable={isEditing} onChange={(v: string) => markChanged("gstin", v)} icon={<Hash size={18} color={theme.mutedForeground} />} placeholder="Optional" />
                <ProfileInput label="Office Address" value={formData.address} editable={isEditing} onChange={(v: string) => markChanged("address", v)} icon={<MapPin size={18} color={theme.mutedForeground} />} multiline placeholder="Full street address" />
              </View>
            )}

            {activeTab === 'financial' && (
              <View style={{ gap: 20 }}>
                <SectionHeader title="Settlement Details" icon={<Landmark size={18} color="#16a34a" />} />
                <ProfileInput label="Bank Name" value={formData.bank_name} editable={isEditing} onChange={(v: string) => markChanged("bank_name", v)} icon={<Landmark size={18} color={theme.mutedForeground} />} />
                <ProfileInput label="Account Holder" value={formData.account_holder_name} editable={isEditing} onChange={(v: string) => markChanged("account_holder_name", v)} icon={<UserIcon size={18} color={theme.mutedForeground} />} />
                <ProfileInput label="IFSC Code" value={formData.ifsc_code} editable={isEditing} onChange={(v: string) => markChanged("ifsc_code", v)} icon={<ShieldCheck size={18} color={theme.mutedForeground} />} autoCapitalize="characters" />
              </View>
            )}

            {isEditing && hasChanges && (
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                style={{
                  backgroundColor: '#16a34a',
                  marginTop: 40,
                  borderRadius: 16,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#16a34a',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6
                }}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Save size={20} color="white" />
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }}>Save Profile Updates</Text>
                  </>
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
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? THEME.dark : THEME.light;

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.mutedForeground, textTransform: 'uppercase' }}>{label}</Text>
      <View style={{
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
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
          placeholderTextColor={theme.mutedForeground}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1,
            paddingVertical: multiline ? 0 : 14,
            paddingHorizontal: 12,
            fontSize: 16,
            color: theme.foreground,
            textAlignVertical: multiline ? 'top' : 'center'
          }}
        />
      </View>
    </View>
  );
};
