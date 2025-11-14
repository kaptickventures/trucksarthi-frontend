import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebaseConfig";

export function createRecaptchaVerifier() {
  return new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    {
      size: "invisible",
    }
  );
}
