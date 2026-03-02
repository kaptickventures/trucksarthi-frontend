import { X } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    useWindowDimensions,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    Text,
    TouchableOpacity,
    View,
    DimensionValue
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../hooks/useThemeStore";

type BottomSheetProps = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    maxHeight?: number | string;
};

export default function BottomSheet({
    visible,
    onClose,
    title,
    subtitle,
    children,
    maxHeight = "90%",
}: BottomSheetProps) {
    const { colors } = useThemeStore();
    const insets = useSafeAreaInsets();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const SCROLL_THRESHOLD = 40;

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            translateY.setValue(SCREEN_HEIGHT);
        }
    }, [visible, SCREEN_HEIGHT]);

    const handleClose = () => {
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (_, state) => state.y0 < SCROLL_THRESHOLD,
            onMoveShouldSetPanResponder: (_, state) => Math.abs(state.dy) > 10,
            onPanResponderMove: (_, state) => {
                if (state.dy > 0) translateY.setValue(state.dy);
            },
            onPanResponderRelease: (_, state) => {
                if (state.dy > 120) handleClose();
                else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}>
                <Pressable style={{ flex: 1 }} onPress={handleClose} />
                <Animated.View
                    {...panResponder.panHandlers}
                    style={{
                        backgroundColor: colors.background,
                        width: "100%",
                        maxHeight: maxHeight as DimensionValue,
                        borderTopLeftRadius: 36,
                        borderTopRightRadius: 36,
                        paddingBottom: Math.max(insets.bottom, 20),
                        transform: [{ translateY }],
                        // Ensure it stays at the bottom
                        position: "absolute",
                        bottom: 0,
                    }}
                >
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        {/* Grab Handle */}
                        <View
                            style={{
                                backgroundColor: colors.muted,
                                width: 42,
                                height: 5,
                                borderRadius: 3,
                                alignSelf: "center",
                                marginTop: 12,
                                marginBottom: 16,
                                opacity: 0.4
                            }}
                        />

                        {/* Header */}
                        {(title || subtitle) && (
                            <View style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingHorizontal: 24,
                                marginBottom: 20
                            }}>
                                <View style={{ flex: 1 }}>
                                    {title && (
                                        <Text style={{
                                            color: colors.foreground,
                                            fontSize: 22,
                                            fontWeight: "800",
                                            letterSpacing: -0.5
                                        }}>
                                            {title}
                                        </Text>
                                    )}
                                    {subtitle && (
                                        <Text style={{
                                            color: colors.mutedForeground,
                                            fontSize: 13,
                                            marginTop: 2,
                                            fontWeight: "500"
                                        }}>
                                            {subtitle}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: colors.muted,
                                    }}
                                >
                                    <X size={20} color={colors.foreground} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Content */}
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : undefined}
                            style={{ paddingHorizontal: 24 }}
                        >
                            {children}
                        </KeyboardAvoidingView>
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );
}
