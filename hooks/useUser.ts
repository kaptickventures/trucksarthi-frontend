// hooks/useUser.ts
import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebaseConfig";
import API from "../app/api/axiosInstance";

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    try {
      const current = auth.currentUser;
      if (!current) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await API.get(`/users/${current.uid}`);
      setUser(res.data);
    } catch (err) {
      console.log("❌ Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (data: any) => {
    try {
      const current = auth.currentUser;
      if (!current) throw new Error("User not authenticated");

      // ❗ Remove non-editable fields
      const payload: any = {
        full_name: data.full_name,
        company_name: data.company_name,
        date_of_birth: data.date_of_birth,
        address: data.address,
        profile_picture_url: data.profile_picture_url,
      };

      const res = await API.put(`/users/${current.uid}`, payload);

      setUser(res.data);
      return res.data;
    } catch (err) {
      console.log("❌ Failed to update user:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    refreshUser: fetchUser,
    updateUser,
  };
}
