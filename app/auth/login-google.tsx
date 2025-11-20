// app/auth/login-google.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../firebaseConfig"; // <-- your firebase config path
import { AntDesign } from "@expo/vector-icons";

export default function LoginGoogle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Google OAuth config
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "<YOUR_EXPO_CLIENT_ID>",
    iosClientId: "<YOUR_IOS_CLIENT_ID>",
    androidClientId: "<YOUR_ANDROID_CLIENT_ID>",
    webClientId: "<YOUR_WEB_CLIENT_ID>",
  });

  // Handle OAuth response
useEffect(() => {
  if (response?.type === "success") {
    const auth = response.authentication as any;

    const idToken = auth?.idToken || auth?.id_token;

    if (idToken) {
      handleFirebaseLogin(idToken);
    }
  }
}, [response]);


  // Firebase login using Google token
  const handleFirebaseLogin = async (idToken: string) => {
    try {
      setLoading(true);
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);

      router.replace("/"); // redirect to home
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-black justify-center items-center px-8">

      <Text className="text-3xl font-bold text-black dark:text-white mb-6">
        Logging in with Google
      </Text>

      <TouchableOpacity
        disabled={!request || loading}
        onPress={() => promptAsync()}
        className="flex-row items-center justify-center border border-gray-300 
                   dark:border-gray-700 py-4 rounded-xl w-full bg-white dark:bg-neutral-900"
      >
        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <>
            <AntDesign name="google" size={24} color="#DB4437" />
            <Text className="text-black dark:text-white font-medium text-lg ml-3">
              Continue with Google
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
