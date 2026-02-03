import { useRouter } from "expo-router";
import { Folder } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";

export default function DocumentManager() {
  const router = useRouter();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";
  const { trucks, loading, fetchTrucks } = useTrucks();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTrucks = trucks.filter((truck) =>
    truck.registration_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: "/(stack)/document-details", params: { truckId: item._id } } as any)}
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.primary + '15', // 15% opacity
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}
      >
        <Folder size={24} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
          {item.registration_number}
        </Text>
        <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>
          {item.make} {item.vehicle_model}
        </Text>
      </View>

      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isDark ? '#333' : '#f0f0f0',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12, // Increased padding
          }}
        >
          <Ionicons name="search" size={20} color={colors.mutedForeground} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 16,
              color: colors.foreground,
            }}
            placeholder="Search by truck number..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && filteredTrucks.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTrucks}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchTrucks}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.muted + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Folder size={40} color={colors.mutedForeground} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.mutedForeground }}>No trucks found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
