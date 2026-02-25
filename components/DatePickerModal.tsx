import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeStore } from '../hooks/useThemeStore';

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

    if (Platform.OS === 'android' && visible) {
        return (
            <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                    onClose();
                    if (selectedDate) {
                        onChange(selectedDate);
                    }
                }}
            />
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                        display="spinner"
                        onChange={(event, selectedDate) => {
                            if (selectedDate) {
                                onChange(selectedDate);
                            }
                        }}
                        textColor={colors.foreground}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        paddingBottom: 40,
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
