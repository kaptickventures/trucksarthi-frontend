import { X } from "lucide-react-native";
import { useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ClientFormData = {
  client_name: string;
  contact_person_name: string;
  contact_number: string;
  alternate_contact_number: string;
  email_address: string;
  office_address: string;
};

type Props = {
  visible: boolean;
  editing: boolean;
  formData: ClientFormData;
  setFormData: (data: ClientFormData) => void;
  onSubmit: () => void;
  onClose: () => void;
};

const REQUIRED_FIELDS = ["client_name", "contact_number"];
const OPTIONAL_FIELDS = [
  "contact_person_name",
  "alternate_contact_number",
  "email_address",
  "office_address",
];

export default function ClientFormModal({
  visible,
  editing,
  formData,
  setFormData,
  onSubmit,
  onClose,
}: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const SCROLL_THRESHOLD = 40;

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: 800,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, state) => state.y0 < SCROLL_THRESHOLD,
      onPanResponderMove: (_, state) => {
        if (state.dy > 0) translateY.setValue(state.dy);
      },
      onPanResponderRelease: (_, state) => {
        if (state.dy > 120) closeModal();
        else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-background" onPress={closeModal}>
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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            {/* Grab Handle */}
            <View className="w-14 h-1.5 bg-muted rounded-full self-center mb-4 opacity-60" />

            {/* Header */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-2xl font-semibold">
                {editing ? "Edit Client" : "Add Client"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={28} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
              {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((key) => (
                <View key={key} className="mb-4">
                  <Text className="text-muted-foreground mb-1 font-medium capitalize">
                    {key.replaceAll("_", " ")}
                    {REQUIRED_FIELDS.includes(key) && (
                      <Text className="text-red-500"> *</Text>
                    )}
                  </Text>

                  <TextInput
                    className="border border-input rounded-xl p-3"
                    value={(formData as any)[key]}
                    onChangeText={(val) =>
                      setFormData({ ...formData, [key]: val })
                    }
                    placeholder={`Enter ${key.replaceAll("_", " ")}`}
                    placeholderTextColor="#888"
                    keyboardType={
                      key.includes("number")
                        ? "phone-pad"
                        : key.includes("email")
                          ? "email-address"
                          : "default"
                    }
                    multiline={key === "office_address"}
                  />
                </View>
              ))}

              {/* Save */}
              <TouchableOpacity
                onPress={onSubmit}
                className="bg-primary p-4 rounded-xl mb-3"
              >
                <Text className="text-center text-primary-foreground font-semibold">
                  {editing ? "Update" : "Save"}
                </Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                onPress={closeModal}
                className="border border-border p-4 rounded-xl"
              >
                <Text className="text-center text-muted-foreground">
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
