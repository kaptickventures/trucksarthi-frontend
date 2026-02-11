import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Home, Clock, List } from "lucide-react-native";
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeStore } from "../../../hooks/useThemeStore";
import { useDriverAppContext } from "../../../context/DriverAppContext";
import { translations } from "../../../constants/driver/translations";

export default function DriverTabLayout() {
  const insets = useSafeAreaInsets();
  const { theme, colors } = useThemeStore();
  const { language } = useDriverAppContext();
  const isDark = theme === "dark";
  const t = translations[language];

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
            <Label>{t.home}</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="history">
            <Icon sf="clock.fill" selectedColor={activeTintColor} />
            <Label>{t.history}</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="ledger">
            <Icon sf="list.bullet.rectangle.fill" selectedColor={activeTintColor} />
            <Label>{t.khata}</Label>
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
            title: t.home,
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: t.history,
            tabBarIcon: ({ color }) => <Clock size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="ledger"
          options={{
            title: t.khata,
            tabBarIcon: ({ color }) => <List size={22} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
