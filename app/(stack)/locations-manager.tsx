import { useFocusEffect } from "@react-navigation/native";
import { Edit3, MapPin, Plus, Trash2, X } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import useLocations from "../../hooks/useLocation";
import { useUser } from "../../hooks/useUser";

export default function LocationsManager() {
  const { user, loading: userLoading } = useUser();

  const {
    locations,
    loading: locationsLoading,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
  } = useLocations();

  const loading = userLoading || locationsLoading;

  const isDark = useColorScheme() === "dark";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    location_name: "",
    complete_address: "",
  });

  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const SCROLL_THRESHOLD = 40; // Only swipe down when dragging near top

  useFocusEffect(
    useCallback(() => {
      fetchLocations();
    }, [fetchLocations])
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gestureState) => gestureState.y0 < SCROLL_THRESHOLD,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          closeModal();
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const openModal = (editing = false, data?: any) => {
    if (editing && data) {
      setEditingId(data._id);
      setFormData({
        location_name: data.location_name,
        complete_address: data.complete_address || "",
      });
    } else {
      setEditingId(null);
      setFormData({ location_name: "", complete_address: "" });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: 800,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      setModalVisible(false);
    });
  };

  const handleSubmit = async () => {
    if (!formData.location_name || !formData.complete_address) {
      Alert.alert("⚠️ Missing Fields", "All fields are required.");
      return;
    }

    try {
      if (editingId) {
        await updateLocation(editingId, formData);
        Alert.alert("Success", "Location updated successfully.");
      } else {
        await addLocation(formData);
        Alert.alert("Success", "Location added successfully.");
      }
      fetchLocations();
      closeModal();
    } catch (e) {
      Alert.alert("Error", "Failed to save location.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirm Delete", "Delete this location?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteLocation(id);
          fetchLocations();
        },
      },
    ]);
  };

  if (loading && !user) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#888" />
        <Text className="mt-2 text-muted-foreground">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* List */}
      <ScrollView
        className="flex-1 px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {locations.length === 0 ? (
          <Text className="text-center text-muted-foreground mt-10">
            No locations found.
          </Text>
        ) : (
          locations.map((loc) => (
            <View
              key={loc._id}
              className="bg-card border border-border rounded-2xl p-4 mb-3 shadow-sm flex-row justify-between items-center"
            >
              <View className="flex-row items-start flex-1">
                <View className="p-2 bg-secondary rounded-xl mr-3">
                  <MapPin size={18} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-card-foreground font-semibold text-base">
                    {loc.location_name}
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1">
                    {loc.complete_address}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center ml-3">
                <TouchableOpacity
                  onPress={() => openModal(true, loc)}
                  className="p-2"
                >
                  <Edit3 size={20} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(loc._id)}
                  className="p-2"
                >
                  <Trash2 size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add FAB */}
      <TouchableOpacity
        onPress={() => openModal(false)}
        className="absolute bottom-8 right-6 bg-primary w-16 h-16 rounded-full justify-center items-center"
        style={{
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

      {/* Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <Pressable className="flex-1 bg-black/40" onPress={closeModal}>
          <Animated.View
            {...panResponder.panHandlers}
            className="absolute bottom-0 w-full bg-background rounded-t-3xl"
            style={{
              height: "100%",
              paddingHorizontal: 20,
              paddingTop: insets.top + 20,
              transform: [{ translateY }],
            }}
          >
            <View className="w-14 h-1.5 bg-muted rounded-full self-center mb-4 opacity-60" />
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"
                  }`}
              >
                {editingId ? "Edit Location" : "Add Location"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={28} color={isDark ? "#AAA" : "#666"} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-muted-foreground mb-1 font-medium">
                Location Name
              </Text>
              <TextInput
                className="border text-input-text border-input rounded-xl p-3 mb-4"
                value={formData.location_name}
                onChangeText={(val) =>
                  setFormData((prev) => ({ ...prev, location_name: val }))
                }
              />
              <Text className="text-muted-foreground mb-1 font-medium">
                Complete Address
              </Text>
              <TextInput
                className="border text-input-text border-input rounded-xl p-3 mb-6"
                value={formData.complete_address}
                onChangeText={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    complete_address: val,
                  }))
                }
              />

              <TouchableOpacity
                onPress={handleSubmit}
                className="bg-primary p-4 rounded-xl mb-3"
              >
                <Text className="text-center text-primary-foreground font-semibold">
                  {editingId ? "Update" : "Save"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closeModal}
                className="border border-border p-4 rounded-xl"
              >
                <Text className="text-center text-muted-foreground">Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
