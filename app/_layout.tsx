// App.tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@react-navigation/native";
import { Slot } from "expo-router";
import { useColorScheme } from "../hooks/use-color-scheme.web";
import { NAV_THEME } from "../theme";
import '../global.css'
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  const colorScheme = useColorScheme(); 

  return (

    
    <ThemeProvider value={NAV_THEME[colorScheme === "dark" ? "dark" : "light"]}>      
   
    <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
     <GestureHandlerRootView style={{ flex: 1 }}>
      
      <Slot />
    </GestureHandlerRootView>
    </ThemeProvider>
  );
}
