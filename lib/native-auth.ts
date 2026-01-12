import { Platform } from 'react-native';

let nativeAuth: any = null;

try {
  // Try to requires the native module. 
  // This will succeed in bundling, but might fail at runtime if the native code isn't linked.
  const authModule = require('@react-native-firebase/auth').default;
  
  // Simple check to see if we can access the module without crashing
  if (Platform.OS !== 'web') {
     // Accessing a property to ensure it's initialized
     // If this throws, we land in the catch block.
     // console.log("Check native module:", authModule().native);
     nativeAuth = authModule;
  }
} catch (error) {
  console.log("⚠️ Native Firebase Auth not found. Using JS SDK fallback/disabled mode.", error);
  nativeAuth = null;
}

export default nativeAuth;
