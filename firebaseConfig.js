// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA3VLgh_i7Bjelpm_8_vmv9v_Whbn_NLPk",
  authDomain: "trucksarthi.firebaseapp.com",
  projectId: "trucksarthi",
  storageBucket: "trucksarthi.firebasestorage.app",
  messagingSenderId: "685782590797",
  appId: "1:685782590797:web:d056df37361dc745bdc304",
  measurementId: "G-PGE6VB2VEX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

