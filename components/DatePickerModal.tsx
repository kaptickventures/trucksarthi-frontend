import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeStore } from '../hooks/useThemeStore';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

interface DatePickerModalProps {
    visible: boolean;
    onClose: () => void;
    date: Date;
    onChange: (date: Date) => void;
}

export function DatePickerModal({
    visible,
    onClose,
    date,
    onChange,
}: DatePickerModalProps) {
    const { colors } = useThemeStore();
    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["50%"], []);

    useEffect(() => {
        if (visible) sheetRef.current?.present();
        else sheetRef.current?.dismiss();
    }, [visible]);

    return (
        <BottomSheetModal
            ref={sheetRef}
            index={0}
            snapPoints={snapPoints}
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
            <BottomSheetView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={[styles.cancelText, { color: colors.destructive }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
                    </TouchableOpacity>
                </View>
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                    onChange={(event, selectedDate) => {
                        if (selectedDate) {
                            onChange(selectedDate);
                        }
                    }}
                    {...(Platform.OS === 'ios' ? { textColor: colors.foreground } : {})}
                />
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    cancelText: {
        fontSize: 16,
    },
    doneText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
