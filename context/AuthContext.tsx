import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../hooks/useAuth";

interface AuthContextValue {
  user: any | null;
  loading: boolean;
  suspended: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspended, setSuspended] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const suspendedFlag = await AsyncStorage.getItem("accountSuspended");
      setSuspended(suspendedFlag === "1");

      if (!token) {
        setUser(null);
        return;
      }

      const userData = await getCurrentUser();
      const latestSuspended = await AsyncStorage.getItem("accountSuspended");
      setSuspended(latestSuspended === "1");

      setUser((prev: any | null) => {
        if (JSON.stringify(prev) === JSON.stringify(userData)) return prev;
        return userData;
      });
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("accountSuspended");
    setUser(null);
    setSuspended(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, suspended, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

