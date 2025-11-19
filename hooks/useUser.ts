import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebaseConfig";
import API from "../app/api/axiosInstance";

interface User {
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
  const currentUser = auth.currentUser;

  const fetchUser = useCallback(async () => {
    if (!currentUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await API.get(`/api/users/${currentUser.uid}`);
      setUser(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const syncUser = useCallback(
    async (data: Partial<User>) => {
      if (!currentUser) throw new Error("User not authenticated");

      try {
        const payload = { ...data, firebase_uid: currentUser.uid };
        const res = await API.post(`/api/users/sync`, payload);
        setUser(res.data.user);
        return res.data.user;
      } catch (err) {
        console.error("❌ Failed to sync user:", err);
        throw err;
      }
    },
    [currentUser]
  );

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      if (!currentUser) throw new Error("User not authenticated");

      try {
        const res = await API.put(`/api/users/${currentUser.uid}`, data);
        setUser(res.data);
        return res.data;
      } catch (err) {
        console.error("❌ Failed to update user:", err);
        throw err;
      }
    },
    [currentUser]
  );

  const deleteUser = useCallback(async () => {
    if (!currentUser) throw new Error("User not authenticated");

    try {
      await API.delete(`/api/users/${currentUser.uid}`);
      setUser(null);
    } catch (err) {
      console.error("❌ Failed to delete user:", err);
      throw err;
    }
  }, [currentUser]);

  const checkProfileCompletion = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const res = await API.get(`/api/users/check-profile/${currentUser.uid}`);
      return res.data.profileCompleted;
    } catch (err) {
      console.error("❌ Failed to check profile completion:", err);
      return false;
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    refreshUser: fetchUser,
    updateUser,
    syncUser,
    deleteUser,
    checkProfileCompletion,
  };
}
