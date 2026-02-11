import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserRole } from "../../hooks/useAuth";
import { DriverAppProvider } from "../../context/DriverAppContext";

export default function DriverLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login" as any);
      return;
    }

    const role = getUserRole(user);
    if (role !== "driver") {
      router.replace("/(tabs)/home" as any);
    }
  }, [loading, router, user]);

  const role = getUserRole(user);
  if (loading || !user || role !== "driver") {
    return null;
  }

  return (
    <DriverAppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="trip/[id]" options={{ headerShown: false }} />
      </Stack>
    </DriverAppProvider>
  );
}
