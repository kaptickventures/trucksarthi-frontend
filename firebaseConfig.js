// firebaseConfig.js
import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA3VLgh_i7Bjelpm_8_vmv9v_Whbn_NLPk",
  authDomain: "trucksarthi.firebaseapp.com",
  projectId: "trucksarthi",
  storageBucket: "trucksarthi.firebasestorage.app",
  messagingSenderId: "685782590797",
  appId: "1:685782590797:web:d056df37361dc745bdc304",
  measurementId: "G-PGE6VB2VEX",
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Persistent Firebase Auth for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth, app };
