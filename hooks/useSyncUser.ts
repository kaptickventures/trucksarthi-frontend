// hooks/useSyncUser.ts
import { useEffect, useState } from "react";
import auth from "@react-native-firebase/auth"; // or "firebase/auth" if using web SDK
import API from "../app/api/axiosInstance";

interface SyncedUser {
  user_id: number;
  firebase_uid: string;
  full_name?: string;
  email_address?: string;
  phone_number?: string;
  company_name?: string;
  profile_picture_url?: string;
  address?: string;
  date_of_birth?: string;
}

export default function useSyncUser() {
  const [user, setUser] = useState<SyncedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // ✅ Get Firebase ID token
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);

        // ✅ Send to backend for syncing
        const res = await API.post(
          "/user/sync",
          {
            full_name: firebaseUser.displayName || "",
            email_address: firebaseUser.email || "",
            phone_number: firebaseUser.phoneNumber || "",
            company_name: "",
            profile_picture_url: firebaseUser.photoURL || "",
            address: "",
            date_of_birth: null,
          },
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );

        setUser(res.data.user);
      } catch (err: any) {
        console.error("User sync failed:", err.response?.data || err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { user, token, loading };
}
