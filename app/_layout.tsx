// App.tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@react-navigation/native";
import { Slot } from "expo-router";
import { PortalHost } from "@rn-primitives/portal";
import { useColorScheme } from "../hooks/use-color-scheme.web";
import { NAV_THEME } from "../theme";
import '../global.css'

export default function App() {
  const colorScheme = useColorScheme(); 

  return (
    <ThemeProvider value={NAV_THEME[colorScheme === "dark" ? "dark" : "light"]}>      
   
    <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Slot />
      <PortalHost /> 
    </ThemeProvider>
  );
}
