import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import API from "../app/api/axiosInstance";

import { Location } from "../types/entity";

export type LocationSuggestion = {
  place_id: string;
  location_name: string;
  complete_address?: string;
  latitude?: number;
  longitude?: number;
};

export default function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const toRefId = (value: any) =>
    value && typeof value === "object" ? value._id : value;
  const matchesId = (value: any, id: string) =>
    String(toRefId(value) || "") === String(id);
  const fetchTripsForDeleteCheck = async () => {
    const res = await API.get("/api/trips");
    return res.data || [];
  };

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/locations");
      setLocations(res.data);
    } catch (error: any) {
      console.error("Fetch error:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  const addLocation = async (data: Partial<Location>) => {
    try {
      const res = await API.post(`/api/locations`, data);
      setLocations((prev) => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      console.error("Add error:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to add location");
      throw error;
    }
  };

  const updateLocation = async (id: string, updatedData: Partial<Location>) => {
    try {
      const res = await API.put(`/api/locations/${id}`, updatedData);
      setLocations((prev) =>
        prev.map((l) => (l._id === id ? res.data : l))
      );
      return res.data;
    } catch (error: any) {
      console.error("Update error:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.error || "Failed to update location");
      throw error;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const trips = await fetchTripsForDeleteCheck();
      const usedInTrips = trips.some((t: any) =>
        matchesId(t.start_location ?? t.start_location_id, id) ||
        matchesId(t.end_location ?? t.end_location_id, id)
      );
      if (usedInTrips) {
        Alert.alert(
          "Cannot Delete",
          "This location is used in one or more trips and cannot be deleted."
        );
        return;
      }
      await API.delete(`/api/locations/${id}`);
      setLocations((prev) => prev.filter((l) => l._id !== id));
    } catch (error: any) {
      console.error("Delete error:", error.response?.data || error);
      if (error?.response?.data?.error) {
        Alert.alert("Error", error.response.data.error);
      } else {
        Alert.alert("Error", "Unable to verify trips. Please try again.");
      }
    }
  };

  const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
    try {
      if (!query || query.trim().length < 2) return [];
      const res = await API.get(`/api/locations/autocomplete`, {
        params: { query: query.trim() },
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error: any) {
      console.error("Autocomplete error:", error.response?.data || error);
      return [];
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { locations, loading, fetchLocations, addLocation, updateLocation, deleteLocation, searchLocations };
}
