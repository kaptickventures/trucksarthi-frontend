const baseConfig = require("./app.json");

const apiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  "";

const withGoogleMapsConfig = (expoConfig) => {
  if (!apiKey) return expoConfig;

  return {
    ...expoConfig,
    ios: {
      ...expoConfig.ios,
      config: {
        ...(expoConfig.ios?.config || {}),
        googleMapsApiKey: apiKey,
      },
    },
    android: {
      ...expoConfig.android,
      config: {
        ...(expoConfig.android?.config || {}),
        googleMaps: {
          ...(expoConfig.android?.config?.googleMaps || {}),
          apiKey,
        },
      },
    },
  };
};

module.exports = ({ config }) => ({
  ...baseConfig,
  expo: withGoogleMapsConfig({
    ...baseConfig.expo,
    ...config,
  }),
});
