import { X } from "lucide-react-native";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Platform,
    Text,
    TouchableOpacity,
    View,
    DimensionValue
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../hooks/useThemeStore";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet";

type BottomSheetProps = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    maxHeight?: number | string;
    expandedHeight?: number | string;
    disableContentPanningGesture?: boolean;
};

export default function BottomSheet({
    visible,
    onClose,
    title,
    subtitle,
    children,
    maxHeight = "70%",
    expandedHeight = "90%",
    disableContentPanningGesture = false,
}: BottomSheetProps) {
    const { colors } = useThemeStore();
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(
        () => [maxHeight as DimensionValue, expandedHeight as DimensionValue],
        [maxHeight, expandedHeight]
    );

    useEffect(() => {
        if (visible) {
            sheetRef.current?.present();
        } else {
            sheetRef.current?.dismiss();
        }
    }, [visible]);

    return (
        <BottomSheetModal
            ref={sheetRef}
            index={0}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enableContentPanningGesture={!disableContentPanningGesture}
            onDismiss={onClose}
            backdropComponent={(props) => (
                <BottomSheetBackdrop
                    {...props}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    pressBehavior="close"
                />
            )}
            handleIndicatorStyle={{ backgroundColor: colors.mutedForeground, opacity: 0.4 }}
            backgroundStyle={{ backgroundColor: colors.background }}
            keyboardBehavior="extend"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
        >
            <BottomSheetView style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
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
                                    fontSize: 24,
                                    fontWeight: "900",
                                    letterSpacing: -0.5
                                }}>
                                    {title}
                                </Text>
                            )}
                            {subtitle && (
                                <Text style={{
                                    color: colors.mutedForeground,
                                    fontSize: 11,
                                    marginTop: 2,
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                    letterSpacing: 1,
                                    opacity: 0.6
                                }}>
                                    {subtitle}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
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
                <View style={{ paddingHorizontal: 24 }}>
                    {children}
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
}
