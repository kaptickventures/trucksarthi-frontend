import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../app/api/axiosInstance";
import { normalizePhoneInput } from "../lib/utils";

export type AppUserRole = "driver" | "fleet_owner";
const PROFILE_COMPLETION_CACHE_KEY = "profileCompletionStatusV1";
const PROFILE_COMPLETION_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export function getUserRole(user: any): AppUserRole | null {
  if (!user) return null;
  const raw = user?.user_type ?? user?.userType ?? user?.role;
  if (typeof raw === "string") {
    const normalized = raw.toLowerCase().trim().replace(/\s+/g, "_");
    if (normalized === "driver") return "driver";
    if (normalized === "fleet_owner") return "fleet_owner";
  }
  if (user?.fleetOwnerId) return "driver";
  return "fleet_owner";
}

const isSuspendedError = (err: any) =>
  err?.response?.status === 403 && err?.response?.data?.code === "ACCOUNT_SUSPENDED";

export async function loginWithEmail(email: string, pass: string) {
  try {
    const res = await API.post("/api/auth/login", { email, password: pass });
    const { token, user } = res.data;
    if (token) {
      await AsyncStorage.setItem("userToken", token);
    }
    await AsyncStorage.removeItem("accountSuspended");
    return { token, user };
  } catch (err: any) {
    console.error("Login error:", { status: err.response?.status, data: err.response?.data, message: err.message });
    if (isSuspendedError(err)) {
      await AsyncStorage.setItem("accountSuspended", "1");
    }
    if (!err.response) {
      const baseUrl = (API.defaults.baseURL || "").toString();
      const hint = baseUrl
        ? `Cannot reach server at ${baseUrl}. If this is a real device, use your PC LAN IP instead of localhost.`
        : "API URL missing. Set EXPO_PUBLIC_BASE_URL.";
      throw `Network Error. ${hint}`;
    }
    throw err.response?.data?.error || err.message || "Login failed";
  }
}

export async function requestEmailOtp(email: string) {
  try {
    await API.post("/api/auth/send-otp", { email });
    return true;
  } catch (err: any) {
    console.error("Send OTP error:", err.response?.data || err.message);
    throw err.response?.data?.error || err.response?.data?.message || err.message || "Failed to send OTP";
  }
}

export async function verifyEmailOtp(email: string, otp: string) {
  try {
    const res = await API.post("/api/auth/verify-otp", { email, otp });
    const { token, user } = res.data;
    if (token) {
      await AsyncStorage.setItem("userToken", token);
    }
    await AsyncStorage.removeItem("accountSuspended");
    return { token, user };
  } catch (err: any) {
    console.error("Email OTP login error:", err.response?.data || err.message);
    if (isSuspendedError(err)) {
      await AsyncStorage.setItem("accountSuspended", "1");
    }
    throw err.response?.data?.error || err.response?.data?.message || err.message || "OTP login failed";
  }
}

export async function sendPhoneOtp(phone: string, userType?: string) {
  try {
    await API.post("/api/auth/request-phone-otp", { phone: normalizePhoneInput(phone), userType });
    return true;
  } catch (err: any) {
    console.error("Send OTP error:", err.response?.data || err.message);
    throw err.response?.data?.error || err.response?.data?.message || err.message || "Failed to send OTP";
  }
}

export async function loginWithPhone(phone: string, otp: string, userType?: string) {
  try {
    const res = await API.post("/api/auth/verify-phone-otp", { phone: normalizePhoneInput(phone), otp, userType });
    const { token, user } = res.data;
    if (token) {
      await AsyncStorage.setItem("userToken", token);
    }
    await AsyncStorage.removeItem("accountSuspended");
    return { token, user };
  } catch (err: any) {
    console.error("Phone login error:", err.response?.data || err.message);
    if (isSuspendedError(err)) {
      await AsyncStorage.setItem("accountSuspended", "1");
    }
    throw err.response?.data?.error || err.response?.data?.message || err.message || "Phone login failed";
  }
}

export async function registerUser(name: string, email: string, pass: string) {
  try {
    const res = await API.post("/api/auth/", { name, email, password: pass, userType: "fleet_owner" });
    const { token, user } = res.data;
    if (token) {
      await AsyncStorage.setItem("userToken", token);
    }
    await AsyncStorage.removeItem("accountSuspended");
    return { token, user };
  } catch (err: any) {
    console.error("Registration error:", err.response?.data || err.message);
    throw err.response?.data?.error || err.message || "Registration failed";
  }
}

export async function logout() {
  await AsyncStorage.removeItem("userToken");
}

export async function getCurrentUser() {
  try {
    const res = await API.get("/api/auth/me");
    await AsyncStorage.removeItem("accountSuspended");
    return res.data;
  } catch (err: any) {
    if (isSuspendedError(err)) {
      await AsyncStorage.setItem("accountSuspended", "1");
    }
    return null;
  }
}

export async function postLoginFlow(router: any) {
  const resetAndReplace = (path: string) => {
    router.replace(path);
  };

  try {
    const user = await getCurrentUser();
    if (!user || (!user._id && !user.id)) {
      resetAndReplace("/auth/login");
      return;
    }

    const userId = String(user._id || user.id || "");
    let completed: boolean | null = null;

    try {
      const cachedRaw = await AsyncStorage.getItem(PROFILE_COMPLETION_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { userId?: string; completed?: boolean; checkedAt?: number };
        const isFresh = Number.isFinite(cached?.checkedAt) && Date.now() - Number(cached.checkedAt) < PROFILE_COMPLETION_CACHE_TTL_MS;
        if (cached?.userId === userId && typeof cached?.completed === "boolean" && isFresh) {
          completed = cached.completed;
        }
      }
    } catch {
      // ignore cache read errors
    }

    if (completed === null) {
      const res = await API.get(`/api/users/check-profile/${userId}`);
      completed = Boolean(res.data?.profileCompleted);
      try {
        await AsyncStorage.setItem(
          PROFILE_COMPLETION_CACHE_KEY,
          JSON.stringify({ userId, completed, checkedAt: Date.now() })
        );
      } catch {
        // ignore cache write errors
      }
    }

    if (completed) {
      resetAndReplace("/(tabs)/home");
    } else {
      resetAndReplace("/gstin-onboarding");
    }
  } catch (err) {
    console.error("postLoginFlow error:", err);
    resetAndReplace("/auth/login");
  }
}
