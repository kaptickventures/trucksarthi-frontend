import React, { createContext, useContext, useMemo, useState } from "react";

export type LocationDraft = {
  location_name: string;
  complete_address: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
};

type LocationPickerContextValue = {
  draft: LocationDraft | null;
  setDraft: (next: LocationDraft | null) => void;
  clearDraft: () => void;
};

const LocationPickerContext = createContext<LocationPickerContextValue | null>(null);

export function LocationPickerProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<LocationDraft | null>(null);

  const value = useMemo<LocationPickerContextValue>(
    () => ({
      draft,
      setDraft,
      clearDraft: () => setDraft(null),
    }),
    [draft]
  );

  return (
    <LocationPickerContext.Provider value={value}>
      {children}
    </LocationPickerContext.Provider>
  );
}

export function useLocationPicker() {
  const ctx = useContext(LocationPickerContext);
  if (!ctx) throw new Error("useLocationPicker must be inside LocationPickerProvider");
  return ctx;
}
