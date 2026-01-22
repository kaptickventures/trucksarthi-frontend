import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BASE_URL || "https://trucksarthi.cloud",
});

// Request Interceptor: Attach JWT Token
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Unauthorized
API.interceptors.response.use(
  (response) => response,
  async (error) => {
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
