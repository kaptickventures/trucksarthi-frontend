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

const isTripCompleted = (trip: Trip, tripDate: number | null): boolean => {
  if (hasCompletedMarker(trip.notes)) return true;

  const rawStatus = String((trip as any)?.status || (trip as any)?.trip_status || "").toLowerCase();
  if (["completed", "complete", "closed", "done"].includes(rawStatus)) return true;

  const invoicedStatus = String((trip as any)?.invoiced_status || "").toLowerCase();
  if (invoicedStatus === "invoiced") return true;

  // Legacy fallback: older trip dates are treated as completed if no explicit status exists.
  if (tripDate) {
    const tripDayEnd = new Date(tripDate);
    tripDayEnd.setHours(23, 59, 59, 999);
    if (tripDayEnd.getTime() < Date.now()) return true;
  }

  return false;
};

const extractTripIdFromRemarks = (remarks?: string): string | null => {
  if (!remarks) return null;
  const match = remarks.match(/\[Trip:([^\]]+)\]/);
  return match?.[1] || null;
};

const mapTrip = (trip: Trip): DriverTripView => {
  const now = Date.now();
  const tripDate = trip.trip_date ? new Date(trip.trip_date).getTime() : null;
  const completed = isTripCompleted(trip, tripDate);

  let status: DriverTripStatus = "Assigned";
  if (completed) {
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
    endTime: completed ? (trip.updatedAt ? new Date(trip.updatedAt).toISOString() : (trip.trip_date ? new Date(trip.trip_date).toISOString() : undefined)) : undefined,
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

  const buildAssignedTruckDocReminders = useCallback((docs: any[] = []): DriverNotification[] => {
    const now = new Date();
    return (docs || [])
      .filter((doc) => !!doc?.expiry_date)
      .map((doc) => {
        const expiry = new Date(doc.expiry_date);
        const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const label = String(doc.document_type || "Document");

        let message = `${label} is due soon`;
        if (diffDays < 0) {
          message = `${label} expired ${Math.abs(diffDays)} day(s) ago`;
        } else if (diffDays === 0) {
          message = `${label} expires today`;
        } else {
          message = `${label} expires in ${diffDays} day(s)`;
        }

        return {
          _id: `doc-reminder-${doc._id}`,
          title: "Truck Document Reminder",
          message,
          scheduled_at: expiry.toISOString(),
        } as DriverNotification;
      })
      .filter((item) => {
        const dt = item.scheduled_at ? new Date(item.scheduled_at) : null;
        if (!dt) return false;
        const diffDays = Math.ceil((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      });
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notificationRes, meRes] = await Promise.all([
        API.get("/api/notifications/my", { params: { limit: 50 } }),
        API.get("/api/auth/me"),
      ]);

      const serverNotifications = notificationRes.data?.notifications || [];
      const me = meRes.data || {};
      const assignedTruckId =
        typeof me.assigned_truck_id === "object"
          ? me.assigned_truck_id?._id
          : me.assigned_truck_id;

      if (!assignedTruckId) {
        setNotifications(serverNotifications);
        return;
      }

      let docReminders: DriverNotification[] = [];
      try {
        const docsRes = await API.get(`/api/truck-documents/truck/${assignedTruckId}`);
        docReminders = buildAssignedTruckDocReminders(Array.isArray(docsRes.data) ? docsRes.data : []);
      } catch (docErr) {
        console.error("Failed to fetch assigned truck docs", docErr);
      }

      const combined = [...docReminders, ...serverNotifications].sort((a, b) => {
        const at = new Date(String(a.scheduled_at || 0)).getTime();
        const bt = new Date(String(b.scheduled_at || 0)).getTime();
        return bt - at;
      });

      setNotifications(combined);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      setNotifications([]);
    }
  }, [buildAssignedTruckDocReminders]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser || null);

      await Promise.all([
        fetchTrips(),
        currentUser?._id ? fetchDriverLedger(currentUser._id) : Promise.resolve(),
      ]);
      fetchNotifications().catch((error) => {
        console.error("Failed to fetch notifications", error);
      });
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
