import { useRouter, Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Clock, Home, List, PlusCircle } from "lucide-react-native";
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";

import { useThemeStore } from "../../hooks/useThemeStore";
import { useAuth } from "../../context/AuthContext";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme, colors } = useThemeStore();
  const { user, loading, suspended } = useAuth();
  const router = useRouter();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!loading && suspended) {
      router.replace("/account-suspended" as any);
      return;
    }
    if (!loading && !user) {
      router.replace("/auth/login" as any);
    }
  }, [user, loading, suspended, router]);

  if (loading || !user || suspended) {
    return null; // or a loading spinner
  }

  // Theme-based colors
  const backgroundColor = colors.card;
  const tabBarBorderColor = colors.border;
  const activeTintColor = colors.primary;
  const inactiveTintColor = colors.mutedForeground;

  if (Platform.OS === "ios") {
    return (
      <>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent={false} />
        <NativeTabs>
          <NativeTabs.Trigger name="home">
            <Icon sf="house.fill" selectedColor={activeTintColor} />
            <Label>Home</Label>
          </NativeTabs.Trigger>



          <NativeTabs.Trigger name="addTrip">
            <Icon sf="plus.circle.fill" selectedColor={activeTintColor} />
            <Label>Add Trip</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="tripLog">
            <Icon sf="clock.fill" selectedColor={activeTintColor} />
            <Label>Trip Log</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="allTransactions">
            <Icon sf="list.bullet.rectangle.fill" selectedColor={activeTintColor} />
            <Label>Transactions</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </>
    );
  }

  return (
    <>
      <StatusBar
        backgroundColor={backgroundColor}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: activeTintColor,
          tabBarInactiveTintColor: inactiveTintColor,

          tabBarStyle: {
            backgroundColor,
            borderTopWidth: 1,
            borderTopColor: tabBarBorderColor,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            elevation: 4,
          },

          sceneStyle: {
            backgroundColor: colors.background,
          },
          lazy: true,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="addTrip"
          options={{
            title: "Add Trip",
            tabBarIcon: ({ color }) => <PlusCircle size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="tripLog"
          options={{
            title: "Trip Log",
            tabBarIcon: ({ color }) => <Clock size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="allTransactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color }) => <List size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="reminders"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
