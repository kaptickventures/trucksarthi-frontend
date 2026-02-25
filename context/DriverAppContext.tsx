import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import API from "../app/api/axiosInstance";
import useDriverFinance, { DriverLedger } from "../hooks/useDriverFinance";
import { getCurrentUser, logout as authLogout } from "../hooks/useAuth";
import useTrips, { Trip } from "../hooks/useTrip";
import { useTranslation } from "./LanguageContext";

const TRIP_STATUS_MARKER = "[TRIP_STATUS:COMPLETED]";

type DriverLanguage = "en" | "hi";

type DriverTripStatus = "Assigned" | "Active" | "Completed";

export interface DriverTripView {
  id: string;
  source: string;
  destination: string;
  truckNumber: string;
  startTime?: string;
  endTime?: string;
  status: DriverTripStatus;
  driverName: string;
  clientName: string;
  rawTrip: Trip;
}

export interface DriverNotification {
  _id: string;
  title: string;
  message: string;
  scheduled_at?: string;
}

interface DriverAppContextValue {
  language: DriverLanguage;
  setLanguage: (lang: DriverLanguage) => Promise<void>;
  user: any | null;
  loading: boolean;
  refreshing: boolean;
  activeTrip: DriverTripView | null;
  tripHistory: DriverTripView[];
  completedToday: DriverTripView[];
  ledgerEntries: DriverLedger[];
  notifications: DriverNotification[];
  netKhata: number;
  tripsThisMonth: number;
  refreshAll: () => Promise<void>;
  logoutUser: () => Promise<void>;
  addLedgerExpense: (amount: number, description: string, tripId?: string) => Promise<void>;
  completeTrip: (trip: DriverTripView) => Promise<void>;
  getTripExpenses: (tripId: string) => number;
  getTripExpenseEntries: (tripId: string) => DriverLedger[];
}

const DriverAppContext = createContext<DriverAppContextValue | undefined>(undefined);

const normalizeId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value?._id || value?.id || "");
};

const readText = (value: any, fallback: string): string => {
  if (typeof value === "string" && value.trim().length) return value;
  return fallback;
};

const hasCompletedMarker = (notes?: string): boolean => {
  if (!notes) return false;
  return notes.includes(TRIP_STATUS_MARKER);
};

const extractTripIdFromRemarks = (remarks?: string): string | null => {
  if (!remarks) return null;
  const match = remarks.match(/\[Trip:([^\]]+)\]/);
  return match?.[1] || null;
};

const mapTrip = (trip: Trip): DriverTripView => {
  const now = Date.now();
  const tripDate = trip.trip_date ? new Date(trip.trip_date).getTime() : null;

  let status: DriverTripStatus = "Assigned";
  if (hasCompletedMarker(trip.notes)) {
    status = "Completed";
  } else if (tripDate && tripDate <= now) {
    status = "Active";
  }

  return {
    id: String(trip._id),
    source: readText((trip.start_location as any)?.location_name || (trip.start_location as any)?.complete_address, "Unknown source"),
    destination: readText((trip.end_location as any)?.location_name || (trip.end_location as any)?.complete_address, "Unknown destination"),
    truckNumber: readText((trip.truck as any)?.registration_number, "N/A"),
    startTime: trip.trip_date ? new Date(trip.trip_date).toISOString() : undefined,
    endTime: hasCompletedMarker(trip.notes) ? (trip.updatedAt ? new Date(trip.updatedAt).toISOString() : undefined) : undefined,
    status,
    driverName: readText((trip.driver as any)?.name || (trip.driver as any)?.driver_name, "Driver"),
    clientName: readText((trip.client as any)?.client_name || (trip.client as any)?.name, "Client"),
    rawTrip: trip,
  };
};



export function DriverAppProvider({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useTranslation();
  const [user, setUser] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [bootLoading, setBootLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { trips, loading: tripsLoading, fetchTrips, updateTrip } = useTrips({ autoFetch: false });
  const { entries, loading: ledgerLoading, fetchDriverLedger, addLedgerEntry } = useDriverFinance();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get("/api/notifications/my", { params: { limit: 50 } });
      setNotifications(res.data?.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      setNotifications([]);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser || null);

      await Promise.all([
        fetchTrips(),
        fetchNotifications(),
        currentUser?._id ? fetchDriverLedger(currentUser._id) : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
      setBootLoading(false);
    }
  }, [fetchDriverLedger, fetchNotifications, fetchTrips]);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        if (mounted) {
          await refreshAll();
        }
      } catch (error) {
        console.error("Driver app boot failed", error);
        setBootLoading(false);
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, [refreshAll]);

  const mappedTrips = useMemo(() => {
    const converted = trips.map(mapTrip);

    if (!user?._id) return converted;

    const mine = converted.filter((trip) => normalizeId(trip.rawTrip.driver) === String(user._id));

    // Some old records may not have a compatible driver mapping. In that case show all trips.
    return mine.length > 0 ? mine : converted;
  }, [trips, user?._id]);

  const sortedTrips = useMemo(() => {
    return [...mappedTrips].sort((a, b) => {
      const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
      const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
      return bTime - aTime;
    });
  }, [mappedTrips]);

  const activeTrip = useMemo(() => {
    return sortedTrips.find((trip) => trip.status !== "Completed") || null;
  }, [sortedTrips]);

  const tripHistory = useMemo(() => {
    return sortedTrips.filter((trip) => trip.status === "Completed");
  }, [sortedTrips]);

  const completedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tripHistory.filter((trip) => {
      const dateValue = trip.endTime || trip.startTime;
      return dateValue ? dateValue.startsWith(today) : false;
    });
  }, [tripHistory]);

  const netKhata = useMemo(() => {
    return entries.reduce((acc, entry) => {
      return entry.transaction_nature === "received_by_driver" ? acc + entry.amount : acc - entry.amount;
    }, 0);
  }, [entries]);

  const tripsThisMonth = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return sortedTrips.filter((trip) => {
      if (!trip.startTime) return false;
      const d = new Date(trip.startTime);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
  }, [sortedTrips]);

  const addLedgerExpense = useCallback(async (amount: number, description: string, tripId?: string) => {
    if (!user?._id) {
      throw new Error("Driver not loaded");
    }

    await (addLedgerEntry as any)({
      driver_id: user._id,
      transaction_nature: "paid_by_driver",
      counterparty_type: "vendor",
      direction: "to",
      amount,
      remarks: description,
      tripId: tripId,
    });

    await fetchDriverLedger(user._id);
  }, [addLedgerEntry, fetchDriverLedger, user?._id]);

  const getTripExpenseEntries = useCallback((tripId: string) => {
    return entries.filter((entry) => {
      // Check both new explicit driverId and legacy remarks if necessary
      return String(entry.tripId) === tripId || extractTripIdFromRemarks(entry.remarks) === tripId;
    });
  }, [entries]);

  const getTripExpenses = useCallback((tripId: string) => {
    return getTripExpenseEntries(tripId).reduce((sum, entry) => sum + entry.amount, 0);
  }, [getTripExpenseEntries]);

  const completeTrip = useCallback(async (trip: DriverTripView) => {
    const currentNotes = trip.rawTrip.notes || "";
    if (hasCompletedMarker(currentNotes)) return;

    const updatedNotes = `${currentNotes}${currentNotes ? " " : ""}${TRIP_STATUS_MARKER}`;
    await updateTrip(trip.id, { notes: updatedNotes });
    await fetchTrips();
  }, [fetchTrips, updateTrip]);

  const logoutUser = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  const loading = bootLoading || tripsLoading || ledgerLoading;

  const value = useMemo<DriverAppContextValue>(() => ({
    language,
    setLanguage,
    user,
    loading,
    refreshing,
    activeTrip,
    tripHistory,
    completedToday,
    ledgerEntries: entries,
    notifications,
    netKhata,
    tripsThisMonth,
    refreshAll,
    logoutUser,
    addLedgerExpense,
    completeTrip,
    getTripExpenses,
    getTripExpenseEntries,
  }), [
    language,
    setLanguage,
    user,
    loading,
    refreshing,
    activeTrip,
    tripHistory,
    completedToday,
    entries,
    notifications,
    netKhata,
    tripsThisMonth,
    refreshAll,
    logoutUser,
    addLedgerExpense,
    completeTrip,
    getTripExpenses,
    getTripExpenseEntries,
  ]);

  return <DriverAppContext.Provider value={value}>{children}</DriverAppContext.Provider>;
}

export function useDriverAppContext(): DriverAppContextValue;
export function useDriverAppContext(optional: true): DriverAppContextValue | null;
export function useDriverAppContext(optional?: boolean) {
  const ctx = useContext(DriverAppContext);
  if (!ctx) {
    if (optional) return null;
    throw new Error("useDriverAppContext must be used inside DriverAppProvider");
  }
  return ctx;
}

export function useOptionalDriverAppContext() {
  return useContext(DriverAppContext) ?? null;
}
