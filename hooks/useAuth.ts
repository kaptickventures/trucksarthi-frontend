import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../app/api/axiosInstance";

export type AppUserRole = "driver" | "fleet_owner";

export function getUserRole(user: any): AppUserRole {
  const raw = user?.user_type ?? user?.userType ?? user?.role;
  if (typeof raw === "string") {
    const normalized = raw.toLowerCase().trim().replace(/\s+/g, "_");
    if (normalized === "driver") return "driver";
    if (normalized === "fleet_owner") return "fleet_owner";
  }
  if (user?.fleetOwnerId) return "driver";
  return "fleet_owner";
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    const res = await API.post("/api/auth/login", { email, password: pass });
    const { token, user } = res.data;
    if (token) {
      await AsyncStorage.setItem("userToken", token);
    }
    return { token, user };
  } catch (err: any) {
    console.error("❌ Login error:", { status: err.response?.status, data: err.response?.data, message: err.message });
    throw err.response?.data?.error || err.message || "Login failed";
  }
}


export async function requestEmailOtp(email: string) {
  try {
    await API.post("/api/auth/send-otp", { email });
    return true;
  } catch (err: any) {
    console.error("❌ Send OTP error:", err.response?.data || err.message);
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
    return { token, user };
  } catch (err: any) {
    console.error("❌ Email OTP login error:", err.response?.data || err.message);
    throw err.response?.data?.error || err.response?.data?.message || err.message || "OTP login failed";
  }
}

// Deprecated or unused phone OTP function (renaming/keeping for safety but not using)
export async function sendPhoneOtp(phone: string, userType?: string) {
  try {
    await API.post("/api/auth/request-phone-otp", { phone, userType });
    return true;
  } catch (err: any) {
    console.error("❌ Send OTP error:", err.response?.data || err.message);
    throw err.response?.data?.error || err.response?.data?.message || err.message || "Failed to send OTP";
  }
}

export async function loginWithPhone(phone: string, otp: string, userType?: string) {
  try {
    const res = await API.post("/api/auth/verify-phone-otp", { phone, otp, userType });
    const { token, user } = res.data;
    if (token) {
      await AsyncStorage.setItem("userToken", token);
    }
    return { token, user };
  } catch (err: any) {
    console.error("❌ Phone login error:", err.response?.data || err.message);
    throw err.response?.data?.error || err.response?.data?.message || err.message || "Phone login failed";
  }
}

export async function registerUser(name: string, email: string, pass: string) {
  try {
    const res = await API.post("/api/auth/", { name, email, password: pass, userType: 'fleet_owner' });
    const { token, user } = res.data;
    if (token) {
      await AsyncStorage.setItem("userToken", token);
    }
    return { token, user };
  } catch (err: any) {
    console.error("❌ Registration error:", err.response?.data || err.message);
    throw err.response?.data?.error || err.message || "Registration failed";
  }
}

export async function logout() {
  await AsyncStorage.removeItem("userToken");
}

export async function getCurrentUser() {
  try {
    const res = await API.get("/api/auth/me");
    return res.data;
  } catch (err) {
    return null;
  }
}

export async function postLoginFlow(router: any) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Role-based routing
    const userRole = getUserRole(user);
    if (userRole === "driver") {
      router.replace("/(driver)/(tabs)/home" as any);
      return;
    }

    const res = await API.get(`/api/users/check-profile/${user._id}`);
    const completed = res.data?.profileCompleted;

    if (completed) {
      router.replace("/(tabs)/home");
    } else {
      router.replace("/basic-details");
    }
  } catch (err) {
    console.error("❌ postLoginFlow error:", err);
    router.replace("/basic-details");
  }
}
