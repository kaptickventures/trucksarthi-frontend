import { Stack } from 'expo-router';
import { DriverAppProvider } from '../../context/DriverAppContext';

export default function DriverLayout() {
  return (
    <DriverAppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </DriverAppProvider>
  );
}
