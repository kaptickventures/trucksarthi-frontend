import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import API from "../app/api/axiosInstance";

import { User } from "../types/entity";

const USER_CACHE_KEY = "cached_user_profile_v1";
const USER_CACHE_TTL_MS = 2 * 60 * 1000;

let inMemoryUserCache: { user: User | null; fetchedAt: number } | null = null;
let inFlightUserRequest: Promise<User | null> | null = null;

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const persistCache = useCallback(async (nextUser: User | null) => {
    inMemoryUserCache = { user: nextUser, fetchedAt: Date.now() };
    try {
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(inMemoryUserCache));
    } catch (error) {
      console.warn("Failed to persist user cache", error);
    }
  }, []);

  const fetchUser = useCallback(async (force = false) => {
    try {
      const now = Date.now();
      if (!force && inMemoryUserCache?.user && now - inMemoryUserCache.fetchedAt < USER_CACHE_TTL_MS) {
        setUser(inMemoryUserCache.user);
        setLoading(false);
        return inMemoryUserCache.user;
      }

      if (!force && !inMemoryUserCache) {
        try {
          const stored = await AsyncStorage.getItem(USER_CACHE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as { user: User | null; fetchedAt: number };
            if (parsed?.user) {
              inMemoryUserCache = parsed;
              setUser(parsed.user);
            }
            if (parsed?.user && now - parsed.fetchedAt < USER_CACHE_TTL_MS) {
              setLoading(false);
              return parsed.user;
            }
          }
        } catch (error) {
          console.warn("Failed to hydrate user cache", error);
        }
      }

      setLoading(true);

      if (!inFlightUserRequest) {
        inFlightUserRequest = API.get("/api/auth/me")
          .then((res) => res.data as User)
          .finally(() => {
            inFlightUserRequest = null;
          });
      }

      const nextUser = await inFlightUserRequest;
      setUser(nextUser);
      await persistCache(nextUser);
      return nextUser;
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
      setUser(null);
      await persistCache(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [persistCache]);

  const syncUser = useCallback(
    async (data: Partial<User>) => {
      try {
        if (!user) throw new Error("User not loaded");
        // Using PUT to update user details instead of non-existent sync endpoint
        const res = await API.put(`/api/users/${user._id}`, data);
        setUser(res.data); // Update local state
        await persistCache(res.data);
        return res.data;
      } catch (err) {
        console.error("❌ Failed to sync user:", err);
        throw err;
      }
    },
    [user, persistCache]
  );

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      if (!user) throw new Error("User not authenticated");

      try {
        const res = await API.put(`/api/users/${user._id}`, data);
        setUser(res.data);
        await persistCache(res.data);
        return res.data;
      } catch (err) {
        console.error("❌ Failed to update user:", err);
        throw err;
      }
    },
    [user, persistCache]
  );

  const deleteUser = useCallback(async () => {
    if (!user) throw new Error("User not authenticated");

    try {
      await API.delete(`/api/users/${user._id}`);
      setUser(null);
      await persistCache(null);
    } catch (err) {
      console.error("❌ Failed to delete user:", err);
      throw err;
    }
  }, [user, persistCache]);

  const checkProfileCompletion = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const res = await API.get(`/api/users/check-profile/${user._id}`);
      return res.data.profileCompleted;
    } catch (err) {
      console.error("❌ Failed to check profile completion:", err);
      return false;
    }
  }, [user]);

  useEffect(() => {
    fetchUser(false);
  }, [fetchUser]);

  const uploadProfilePicture = useCallback(
    async (file: ImagePicker.ImagePickerAsset) => {
      if (!user) throw new Error("User not authenticated");

      try {
        const formData = new FormData();
        const fileUri = Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");
        
        formData.append("file", {
          uri: fileUri,
          name: file.fileName || "profile.jpg",
          type: file.mimeType || "image/jpeg",
        } as any);

        const res = await API.post(
          `/api/users/${user._id}/profile-picture`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        setUser((prev) =>
          prev ? { ...prev, profile_picture_url: res.data.file_url || res.data.profile_picture_url } : null
        );
        const merged = {
          ...(user || {}),
          profile_picture_url: res.data.file_url || res.data.profile_picture_url,
        } as User;
        await persistCache(merged);

        return res.data;
      } catch (err: any) {
        console.error("❌ Failed to upload profile picture:", err?.response?.data || err);
        throw err;
      }
    },
    [user, persistCache]
  );
  
  const refreshUser = useCallback(async () => {
    await fetchUser(true);
  }, [fetchUser]);
  
  return {
    user,
    loading,
    refreshUser,
    updateUser,
    syncUser,
    deleteUser,
    checkProfileCompletion,
    uploadProfilePicture,
  };
}
