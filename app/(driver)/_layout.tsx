import { Stack, useRouter } from 'expo-router';
import { DriverAppProvider } from '../../context/DriverAppContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

export default function DriverLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const userRole = user?.user_type || user?.userType;
    if (!loading && user && userRole !== 'driver') {
      router.replace("/(tabs)/home");
    }
  }, [user, loading]);

  const userRole = user?.user_type || user?.userType;
  if (loading || !user || userRole !== 'driver') {
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
