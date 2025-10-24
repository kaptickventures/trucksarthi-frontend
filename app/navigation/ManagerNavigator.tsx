import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ManagerHome from "../screens/Manager/ManagerHome";
import TrucksManager from "../screens/Manager/TrucksManager";
import DriversManager from "../screens/Manager/DriversManager";
import ClientsManager from "../screens/Manager/ClientsManager";
import LocationsManager from "../screens/Manager/LocationsManager";
import DocumentsManager from "../screens/Manager/DocumentsManager"; 

const Stack = createNativeStackNavigator();

export default function ManagerNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ManagerHome"
        component={ManagerHome}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TrucksManager"
        component={TrucksManager}
        options={{ title: "Trucks" }}
      />
      <Stack.Screen
        name="DriversManager"
        component={DriversManager}
        options={{ title: "Drivers" }}
      />
      <Stack.Screen
        name="ClientsManager"
        component={ClientsManager}
        options={{ title: "Clients" }}
      />
      <Stack.Screen
        name="LocationsManager"
        component={LocationsManager}
        options={{ title: "Locations" }}
      />
      <Stack.Screen
        name="DocumentsManager"
        component={DocumentsManager}
        options={{ title: "Documents" }}
      />
    </Stack.Navigator>
  );
}
