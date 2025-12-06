// firebaseConfig.js
import { initializeApp, getApps,  RecaptchaVerifier } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// 🔐 Firebase Project Config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 🟢 Google Auth Config (Android + Web ONLY)
export const googleAuthConfig = {
  androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
};

// 🔍 Helper: Select correct Client ID per platform
export const getGoogleClientId = () => {
  if (Platform.OS === "android") return googleAuthConfig.androidClientId;
  return googleAuthConfig.webClientId;
};

// ⚙️ Initialize Firebase (prevent multiple instances)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// 🔐 Enable persistent Auth storage for RN
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const setupRecaptcha = () => {
  if (!auth.app || typeof window === "undefined") return;

  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
      },
      auth
    );
  }
  return window.recaptchaVerifier;
};

export { auth, app };
