import API from "../app/api/axiosInstance";
import { auth } from "../firebaseConfig";
import { AxiosError } from "axios";

type SyncPayload = {
  full_name?: string;
  email_address?: string;
  phone_number?: string;
  company_name?: string;
  profile_picture_url?: string;
  address?: string;
  date_of_birth?: string;
};

// -------------------------------------------------------------
// 🔹 Initialize user row in DB after ANY Firebase login
// -------------------------------------------------------------
export async function initUser() {
  const u = auth.currentUser;
  if (!u) throw new Error("No authenticated user");

  const payload = {
    firebase_uid: u.uid,
    email_address: u.email ?? null,
    phone_number: u.phoneNumber ?? null,
    full_name: u.displayName ?? null,
    profile_picture_url: u.photoURL ?? null,
  };

  console.log("📨 initUser → sending payload:", payload);

  try {
    const res = await API.post("/api/users/init", payload);
    console.log("✅ initUser → success", res?.data?.user ?? null);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError;
    console.log(
      "❌ initUser ERROR →",
      error.response?.data || error.message || err
    );
    // Throw the raw error so callers can inspect if they want,
    // but postLoginFlow will choose to continue on failure.
    throw err;
  }
}

// -------------------------------------------------------------
// 🔹 Update user profile fields (from Basic Details screen)
// -------------------------------------------------------------
export async function syncFirebaseUser(payload: SyncPayload) {
  const u = auth.currentUser;
  if (!u) throw new Error("No authenticated user");

  try {
    const res = await API.post("/api/users/sync", {
      ...payload,
      firebase_uid: u.uid,
    });
    return res.data;
  } catch (err: any) {
    console.log("❌ syncFirebaseUser ERROR →", err.response?.data || err);
    throw err;
  }
}

// -------------------------------------------------------------
// 🔹 Check if profile is completed
// -------------------------------------------------------------
export async function checkProfileCompleted(
  firebaseUid: string
): Promise<boolean> {
  try {
    const res = await API.get(`/api/users/check-profile/${firebaseUid}`);
    return Boolean(res.data?.profileCompleted);
  } catch (err: unknown) {
    const error = err as AxiosError;
    console.log(
      "⚠️ checkProfileCompleted ERROR →",
      error.response?.data || error.message
    );

    if (error.response?.status === 404) return false;
    return false;
  }
}

// -------------------------------------------------------------
// 🔹 Call after ANY successful Firebase login
//      (email OR phone) — routes user based on profile completion
// -------------------------------------------------------------
export async function postLoginFlow(router: any) {
  // Defensive: if no auth user, don't throw upwards in UI flow — log & continue.
  const u = auth.currentUser;
  if (!u) {
    console.log("⚠️ postLoginFlow → No authenticated user present. Continuing to /basicDetails.");
    // if you prefer, you may route to login screen instead, but we'll attempt to continue:
    router.replace("/basicDetails");
    return;
  }

  console.log("🔐 postLoginFlow → user:", {
    uid: u.uid,
    phoneNumber: u.phoneNumber,
    email: u.email,
  });

  // 1) Create/update basic row — do NOT let backend failure block login
  try {
    await initUser();
  } catch (err) {
    // Log details but continue the flow — backend may be temporarily rejecting due to unique constraints
    console.log("⚠️ postLoginFlow → initUser failed (ignored):", err);
  }

  // 2) Check if profile is complete (if this fails, default to incomplete)
  let completed = false;
  try {
    completed = await checkProfileCompleted(u.uid);
  } catch (err) {
    console.log("⚠️ postLoginFlow → checkProfileCompleted failed (treating as incomplete):", err);
    completed = false;
  }

  // 3) Route based on completion
  if (completed) {
    console.log("➡️ Navigating to /home");
    router.replace("/home");
  } else {
    console.log("➡️ Navigating to /basicDetails");
    router.replace("/basicDetails");
  }
}
