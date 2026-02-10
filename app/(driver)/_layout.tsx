import { Stack, useRouter } from 'expo-router';
import { DriverAppProvider } from '../../context/DriverAppContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import { getUserRole } from '../../hooks/useAuth';

export default function DriverLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const userRole = getUserRole(user);
    if (!loading && user && userRole !== "driver") {
      router.replace("/(tabs)/home");
    }
  }, [user, loading, router]);

  const userRole = getUserRole(user);
  if (loading || !user || userRole !== "driver") {
    return null;
  }

  return (
    <DriverAppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </DriverAppProvider>
  );
}
