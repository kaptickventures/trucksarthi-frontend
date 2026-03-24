import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useThemeStore } from '@/hooks/useThemeStore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Mail, Phone, MapPin, Save, LogOut } from 'lucide-react-native';

export default function WebProfile() {
  const { colors } = useThemeStore();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company_name || '',
    address: user?.address || '',
  });

  const handleLogout = async () => {
    await logout();
    // Redirect to QR screen for web
    router.replace('/(stack)/desktop-qr');
  };

  if (Platform.OS !== 'web') return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Header */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700' }}>
          Profile & Settings
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
          Manage your account information
        </Text>
      </View>

      {/* Profile Card */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '700' }}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
              {user?.name}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
              {user?.user_type || 'Fleet Owner'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
              Joined 3 months ago
            </Text>
          </View>
        </View>
      </View>

      {/* Personal Information */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
          Personal Information
        </Text>

        <View style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <View>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
              Full Name
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                fontSize: 14,
              }}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Full Name"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Email */}
          <View>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Mail size={14} color={colors.muted} />
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
                Email
              </Text>
            </View>
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                fontSize: 14,
              }}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              editable={false}
            />
          </View>

          {/* Phone */}
          <View>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Phone size={14} color={colors.muted} />
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
                Phone
              </Text>
            </View>
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                fontSize: 14,
              }}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Phone"
              placeholderTextColor={colors.muted}
              editable={false}
            />
          </View>

          {/* Company */}
          <View>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
              Company Name
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                fontSize: 14,
              }}
              value={formData.company}
              onChangeText={(text) => setFormData({ ...formData, company: text })}
              placeholder="Company Name"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Address */}
          <View>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <MapPin size={14} color={colors.muted} />
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
                Address
              </Text>
            </View>
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                fontSize: 14,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Address"
              placeholderTextColor={colors.muted}
              multiline
            />
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 20,
          }}
        >
          <Save size={18} color="white" />
          <Text style={{ color: 'white', fontWeight: '600' }}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
          Settings
        </Text>

        <View style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Email Notifications', checked: true },
            { label: 'Push Notifications', checked: true },
            { label: 'SMS Alerts', checked: false },
            { label: 'Marketing Emails', checked: false },
          ].map((setting, idx) => (
            <View
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: idx < 3 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 14 }}>
                {setting.label}
              </Text>
              <TouchableOpacity
                style={{
                  width: 50,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: setting.checked ? colors.primary : colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Logout Section */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: '#ff4444',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <LogOut size={18} color="white" />
        <Text style={{ color: 'white', fontWeight: '600' }}>Logout from Web</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}
