// services/authService.ts
import API from "../app/api/axiosInstance";
import { auth } from "../firebaseConfig";

type SyncPayload = {
  full_name?: string;
  email_address?: string;
  phone_number?: string;
  company_name?: string;
  profile_picture_url?: string;
  address?: string;
  date_of_birth?: string;
};

/**
 * Syncs Firebase logged-in user with backend
 * Creates the user if not exists, else updates it
 */
export async function syncFirebaseUser(payload: SyncPayload) {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const finalPayload = {
    ...payload,
    firebase_uid: user.uid, // ✅ Attach UID automatically
  };

  const res = await API.post("/users/sync", finalPayload);
  return res.data;
}

/**
 * Checks if profile is completed for the logged-in user
 */
export async function checkProfileCompleted(firebaseUid: string): Promise<boolean> {
  const res = await API.get(`/users/check-profile/${firebaseUid}`);
  return Boolean(res.data?.profileCompleted);
}

/**
 * Call this right after Firebase sign-in.
 * Decides where to send the user:
 *  - If profile incomplete -> /profile/basic-details
 *  - If profile complete   -> /home
 */
export async function postLoginFlow(router: any) {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const completed = await checkProfileCompleted(user.uid);

  if (completed) {
    router.replace("/home");
  } else {
    router.replace("/basic-details");
  }
}
