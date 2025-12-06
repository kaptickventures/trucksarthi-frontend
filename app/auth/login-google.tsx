import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import { auth } from "../../firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { postLoginFlow } from "../../hooks/useAuth";

WebBrowser.maybeCompleteAuthSession();

// 👉 Replace with your Google OAuth Client IDs from Firebase Console
const ANDROID_CLIENT_ID = "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com";
const IOS_CLIENT_ID = "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com";
const WEB_CLIENT_ID = "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com";

export default function LoginGoogle() {
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;

      if (!authentication?.idToken) {
        return alert("Login failed: No ID token");
      }

      const credential = GoogleAuthProvider.credential(authentication.idToken);
      signInWithCredential(auth, credential)
        .then(async () => {
          await postLoginFlow(router);
        })
        .catch((err) => {
          console.log("GOOGLE LOGIN ERR:", err);
          alert("Google Login failed: " + err.message);
        });
    }
  }, [response]);

  return (
    <View className="flex-1 justify-center items-center bg-white px-10">

      {/* Logo */}
      <Image
        source={require("../../assets/images/TruckSarthi-Graphic.png")}
        style={{ width: "65%", height: 90, marginBottom: 40 }}
        resizeMode="contain"
      />

      <Text className="text-3xl font-bold mb-4 text-center">
        Continue with Google
      </Text>

      {/* Google Login Button */}
      <TouchableOpacity
        disabled={!request}
        onPress={() => promptAsync()}
        className="w-full py-3 rounded-xl items-center bg-[#DB4437]"
      >
        {!request ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-lg">
            Login with Google
          </Text>
        )}
      </TouchableOpacity>

      {/* Back to email/phone login */}
      <TouchableOpacity onPress={() => router.back()} className="mt-6">
        <Text className="text-[#128C7E]">Go Back</Text>
      </TouchableOpacity>

    </View>
  );
}
