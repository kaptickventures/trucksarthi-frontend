import { Stack } from "expo-router";
import { DriverAppProvider } from "../../context/DriverAppContext";

export default function DriverLayout() {
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
