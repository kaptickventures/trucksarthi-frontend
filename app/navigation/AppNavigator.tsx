import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../screens/Home";
import AddTripScreen from "../screens/AddTrip";
import HistoryScreen from "../screens/History";
import ProfileScreen from "../screens/Profile";
import ManagerNavigator from "./ManagerNavigator";
import { Home, PlusCircle, Clock, Briefcase, User } from "lucide-react-native";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="AddTrip"
          component={AddTripScreen}
          options={{
            tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Manager"
          component={ManagerNavigator}
          options={{
            tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
