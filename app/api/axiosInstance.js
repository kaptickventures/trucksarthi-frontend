import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Alert } from "react-native";
import { getNetworkOnlineState, setNetworkOnlineState } from "../../lib/networkState";

const configuredBaseUrl = process.env.EXPO_PUBLIC_BASE_URL?.trim();

const API = axios.create({
  baseURL: configuredBaseUrl || "https://cloudapi.trucksarthi.in",
});

if (!configuredBaseUrl) {
  console.warn("EXPO_PUBLIC_BASE_URL is not set. Falling back to https://cloudapi.trucksarthi.in");
}

let lastNoInternetAlertAt = 0;

const showNoInternetAlert = () => {
  const now = Date.now();
  if (now - lastNoInternetAlertAt < 2000) return;
  lastNoInternetAlertAt = now;
  Alert.alert("No internet connection found", "Please reconnect and try again.");
};

const getCacheKey = (config) => {
  const method = String(config?.method || "get").toLowerCase();
  const url = `${config?.baseURL || ""}${config?.url || ""}`;
  const params = config?.params ? JSON.stringify(config.params) : "";
  return `api_cache:${method}:${url}:${params}`;
};

// Request Interceptor: Attach JWT Token
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const online = getNetworkOnlineState();
    const method = String(config?.method || "get").toLowerCase();
    const cacheKey = getCacheKey(config);
    config.metadata = { ...(config.metadata || {}), cacheKey };

    if (!online) {
      if (method === "get") {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          config.adapter = async () => ({
            data: JSON.parse(cached),
            status: 200,
            statusText: "OK",
            headers: { "x-cache": "HIT" },
            config,
            request: { fromCache: true },
          });
          return config;
        }
      }

      showNoInternetAlert();
      const offlineError = new Error("NO_INTERNET_CONNECTION_FOUND");
      offlineError.code = "NO_INTERNET_CONNECTION_FOUND";
      return Promise.reject(offlineError);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Unauthorized
API.interceptors.response.use(
  async (response) => {
    setNetworkOnlineState(true);
    const method = String(response?.config?.method || "get").toLowerCase();
    const cacheKey = response?.config?.metadata?.cacheKey || getCacheKey(response?.config || {});
    if (method === "get" && cacheKey && response?.data) {
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
      } catch {
        // Ignore cache write failures
      }
    }
    return response;
  },
  async (error) => {
    if (error?.code === "NO_INTERNET_CONNECTION_FOUND" || error?.message === "NO_INTERNET_CONNECTION_FOUND") {
      return Promise.reject(error);
    }

    const method = String(error?.config?.method || "get").toLowerCase();
    const isNetworkFailure = !error?.response;
    if (isNetworkFailure) {
      setNetworkOnlineState(false);

      const cacheKey = error?.config?.metadata?.cacheKey || getCacheKey(error?.config || {});
      if (method === "get" && cacheKey) {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return {
            data: JSON.parse(cached),
            status: 200,
            statusText: "OK",
            headers: { "x-cache": "HIT" },
            config: error?.config,
            request: { fromCache: true },
          };
        }
      }

      showNoInternetAlert();
    }

    const code = error?.response?.data?.code;
    if (error.response && error.response.status === 403 && code === "ACCOUNT_SUSPENDED") {
      await AsyncStorage.setItem("accountSuspended", "1");
      await AsyncStorage.removeItem("userToken");
    }
    if (error.response && error.response.status === 401) {
      // Clear token and potentially redirect to login
      await AsyncStorage.removeItem("userToken");
      // Note: We can't use router here easily without a hook, 
      // but clearing the token will trigger re-auth in the root component.
    }
    return Promise.reject(error);
  }
);

export default API;
