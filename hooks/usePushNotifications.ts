import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import API from "../app/api/axiosInstance";

// Set how notifications should be handled when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Expo Push Token:", token);
      } catch (e) {
        console.error("Error getting push token:", e);
      }
    } else {
      console.warn("Must use physical device for Push Notifications");
    }

    return token;
  }

  const registerTokenWithBackend = async (token: string) => {
    try {
      await API.post("/api/notifications/register-token", {
        expo_push_token: token,
        platform: Platform.OS,
      });
      console.log("Token registered with backend successfully");
    } catch (error) {
      console.error("Error registering token with backend:", error);
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        registerTokenWithBackend(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Handle notification received while app is in foreground
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // Handle tapping on a notification
        const { deep_link } = response.notification.request.content.data;
        console.log("Notification Tapped:", deep_link);
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return { expoPushToken };
}
