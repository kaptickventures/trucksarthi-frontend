import React, { useState, useRef } from "react";
import { View, TextInput, Button } from "react-native";
import { auth } from "../../firebaseConfig";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";

export default function PhoneAuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState(""); // e.g. "+19999999999"
  const [verificationId, setVerificationId] = useState(null);
  const [code, setCode] = useState("");
  const recaptchaVerifier = useRef(null);

  // Step 1: Send verification code
  const sendVerification = async () => {
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const id = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );
      setVerificationId(id);
      alert("Verification code sent!");
    } catch (err) {
      console.error(err);
      alert("Failed to send verification code.");
    }
  };

  // Step 2: Confirm the code
  const confirmCode = async () => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      alert("Phone authentication successful!");
    } catch (err) {
      console.error(err);
      alert("Failed to verify code.");
    }
  };

  return (
    <View className="flex-1 justify-center p-5 bg-white dark:bg-black">
      {/* reCAPTCHA */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
      />

      {!verificationId ? (
        <>
          <TextInput
            placeholder="+1 999 999 9999"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            className="border border-gray-300 dark:border-gray-700 rounded-md p-3 my-2 text-black dark:text-white"
          />
          <Button title="Send Verification Code" onPress={sendVerification} />
        </>
      ) : (
        <>
          <TextInput
            placeholder="Enter Verification Code"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            className="border border-gray-300 dark:border-gray-700 rounded-md p-3 my-2 text-black dark:text-white"
          />
          <Button title="Confirm Code" onPress={confirmCode} />
        </>
      )}
    </View>
  );
}
