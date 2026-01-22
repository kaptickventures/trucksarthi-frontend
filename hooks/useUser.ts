import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import API from "../app/api/axiosInstance";

interface User {
  id: string;
  _id?: string; // MongoDB ID fallback
  firebase_uid: string;
  full_name?: string;
  email_address?: string;
  phone_number?: string;
  company_name?: string;
  address?: string;
  profile_picture_url?: string;
  date_of_birth?: string | null;
  gstin?: string;
  bank_name?: string;
  account_holder_name?: string;
  ifsc_code?: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncUser = useCallback(
    async (data: Partial<User>) => {
      try {
        if (!user) throw new Error("User not loaded");
        // Using PUT to update user details instead of non-existent sync endpoint
        const res = await API.put(`/api/users/${user.firebase_uid || user.id || (user as any)._id}`, data);
        setUser(res.data); // Update local state
        return res.data;
      } catch (err) {
        console.error("❌ Failed to sync user:", err);
        throw err;
      }
    },
    [user]
  );

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      if (!user) throw new Error("User not authenticated");

      try {
        const res = await API.put(`/api/users/${user.firebase_uid || user.id}`, data);
        setUser(res.data);
        return res.data;
      } catch (err) {
        console.error("❌ Failed to update user:", err);
        throw err;
      }
    },
    [user]
  );

  const deleteUser = useCallback(async () => {
    if (!user) throw new Error("User not authenticated");

    try {
      await API.delete(`/api/users/${user.firebase_uid || user.id}`);
      setUser(null);
    } catch (err) {
      console.error("❌ Failed to delete user:", err);
      throw err;
    }
  }, [user]);

  const checkProfileCompletion = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const res = await API.get(`/api/users/check-profile/${user.firebase_uid || user.id}`);
      return res.data.profileCompleted;
    } catch (err) {
      console.error("❌ Failed to check profile completion:", err);
      return false;
    }
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const uploadProfilePicture = useCallback(
    async (file: any) => {
      if (!user) throw new Error("User not authenticated");

      try {
        const formData = new FormData();
        const fileUri = Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");
        
        formData.append("file", {
          uri: fileUri,
          name: file.name || "profile.jpg",
          type: file.mimeType || "image/jpeg",
        } as any);

        const res = await API.post(
          `/api/users/${user.firebase_uid || user.id}/profile-picture`,
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

        return res.data;
      } catch (err: any) {
        console.error("❌ Failed to upload profile picture:", err?.response?.data || err);
        throw err;
      }
    },
    [user]
  );
  
  return {
    user,
    loading,
    refreshUser: fetchUser,
    updateUser,
    syncUser,
    deleteUser,
    checkProfileCompletion,
    uploadProfilePicture,
  };
}
