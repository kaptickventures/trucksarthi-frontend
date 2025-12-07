// firebaseConfig.js
import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  RecaptchaVerifier,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// 🔐 Firebase Project Config (Hardcoded)
const firebaseConfig = {
  apiKey: "AIzaSyA3VLgh_i7Bjelpm_8_vmv9v_Whbn_NLPk",
  authDomain: "trucksarthi.firebaseapp.com",
  projectId: "trucksarthi",
  storageBucket: "trucksarthi.appspot.com",
  messagingSenderId: "685782590797",
  appId: "1:685782590797:web:d056df37361dc745bdc304",
};

// 🔐 Google Auth Config
export const googleAuthConfig = {
  androidClientId:
    "685782590797-fkfs02vnj1cvep6mjkbaulb0dd3o4c67.apps.googleusercontent.com",
  webClientId:
    "685782590797-k4us38g7vsm0shekavkkpoe6gd2gqj6p.apps.googleusercontent.com",
};

// 🔍 Platform Client ID Helper
export const getGoogleClientId = () => {
  return Platform.OS === "android"
    ? googleAuthConfig.androidClientId
    : googleAuthConfig.webClientId;
};

// 🏁 Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// 🧠 Auth with Persistent Storage
const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

// 🔐 Invisible Recaptcha for Web (for Phone Login)
export const setupRecaptcha = () => {
  if (Platform.OS !== "web") return;

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

export { app, auth };
