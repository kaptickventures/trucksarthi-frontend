import { View, Text, Image } from "react-native";
import { useThemeStore } from "../hooks/useThemeStore";
import { getFileUrl } from "../lib/utils";

interface ProfileAvatarProps {
  name?: string;
  imageUrl?: string;
  size?: "small" | "medium" | "large";
  style?: any;
}

const sizeConfig = {
  small: { container: 32, fontSize: 12, fontWeight: "600" as const },
  medium: { container: 40, fontSize: 14, fontWeight: "700" as const },
  large: { container: 56, fontSize: 16, fontWeight: "800" as const },
};

/**
 * Reusable ProfileAvatar component that displays a profile picture or initials
 * Falls back to initials-based avatar if image is not available
 */
export default function ProfileAvatar({
  name = "User",
  imageUrl,
  size = "medium",
  style,
}: ProfileAvatarProps) {
  const { colors } = useThemeStore();
  const config = sizeConfig[size];

  // Generate initials from name
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  // Generate a consistent color based on name
  const getColorFromName = (fullName: string) => {
    const colors_palette = [
      "#FF6B6B", // red
      "#4ECDC4", // teal
      "#45B7D1", // blue
      "#FFA07A", // light salmon
      "#98D8C8", // mint
      "#F7DC6F", // yellow
      "#BB8FCE", // purple
      "#85C1E2", // light blue
      "#F8B195", // coral
      "#C7CEEA", // lavender
    ];
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors_palette[Math.abs(hash) % colors_palette.length];
  };

  const initials = getInitials(name);
  const avatarBgColor = getColorFromName(name);
  const resolvedImageUrl = imageUrl ? getFileUrl(imageUrl) : null;

  return (
    <View
      style={[
        {
          width: config.container,
          height: config.container,
          borderRadius: config.container / 2,
          backgroundColor: resolvedImageUrl ? colors.muted : avatarBgColor,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          borderWidth: 0.5,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {resolvedImageUrl ? (
        <Image
          source={{ uri: resolvedImageUrl, cache: "force-cache" as const }}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
          onError={() => {
            // Fallback to initials if image fails to load
            // Component will re-render without the imageUrl
          }}
        />
      ) : (
        <Text
          style={{
            fontSize: config.fontSize,
            fontWeight: config.fontWeight,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
