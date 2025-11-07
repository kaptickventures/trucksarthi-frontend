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

// 🔹 Create row immediately after Firebase signup
export async function initUser() {
  const u = auth.currentUser;
  if (!u) throw new Error("No authenticated user");

  // Include whatever is available (use undefined, not null)
  await API.post("/api/users/init", {
    firebase_uid: u.uid,
    email_address: u.email || undefined,
    phone_number: u.phoneNumber || undefined,
    full_name: u.displayName || undefined,
    profile_picture_url: (u.photoURL as string) || undefined,
  });
}

// 🔹 Create/Update merge (used on Basic Details screen)
export async function syncFirebaseUser(payload: SyncPayload) {
  const u = auth.currentUser;
  if (!u) throw new Error("No authenticated user");

  const res = await API.post("/api/users/sync", {
    ...payload,
    firebase_uid: u.uid,
  });
  return res.data;
}

export async function checkProfileCompleted(firebaseUid: string): Promise<boolean> {
  try {
    const res = await API.get(`/api/users/check-profile/${firebaseUid}`);
    return Boolean(res.data?.profileCompleted);
  } catch (err: unknown) {
    const error = err as AxiosError;
    if (error.response?.status === 404) return false;
    return false;
  }
}

// 🔹 Call after any successful sign-in
export async function postLoginFlow(router: any) {
  const u = auth.currentUser;
  if (!u) throw new Error("No authenticated user");

  // 1) Ensure row exists and prefilled with what we have
  await initUser();

  // 2) Decide destination
  const completed = await checkProfileCompleted(u.uid);
  if (completed) {
    router.replace("/home");
  } else {
    router.replace("/basicDetails");
  }
}
