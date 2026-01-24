import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Clock, Home, PlusCircle } from "lucide-react-native";
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeStore } from "../../hooks/useThemeStore";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme, colors } = useThemeStore();
  const isDark = theme === "dark";

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
      </Tabs>
    </>
  );
}
