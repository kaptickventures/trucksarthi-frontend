import React from "react";
import { Platform } from "react-native";

import LocationPickerWeb from "./location-picker.web";

export default function LocationPickerRoute(props: any) {
  if (Platform.OS === "web") {
    return <LocationPickerWeb {...props} />;
  }

  try {
    // Runtime load keeps web bundling isolated from native-only module graph.
    // eslint-disable-next-line no-eval
    const runtimeRequire = eval("require");
    const LocationPickerNative = runtimeRequire("./location-picker.native").default;
    return <LocationPickerNative {...props} />;
  } catch {
    return <LocationPickerWeb {...props} />;
  }
}
