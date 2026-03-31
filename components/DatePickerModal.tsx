import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
    const { width, height } = useWindowDimensions();
    const [viewMonth, setViewMonth] = useState(new Date(date.getFullYear(), date.getMonth(), 1));
    const [draftDate, setDraftDate] = useState(date);    const [lastTapTime, setLastTapTime] = useState<number | null>(null);
    const [lastTappedDay, setLastTappedDay] = useState<number | null>(null);
    const cardWidth = Math.min(420, width - 24);
    const cardMaxHeight = Math.floor(height * 0.78);
    const calendarHorizontalPadding = 14;
    const dayCellSize = Math.max(36, Math.min(48, Math.floor((cardWidth - calendarHorizontalPadding * 2) / 7)));
    const dayCircleSize = Math.max(30, dayCellSize - 6);

    const monthLabel = useMemo(
        () => viewMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
        [viewMonth]
    );

    const days = useMemo(() => {
        const year = viewMonth.getFullYear();
        const month = viewMonth.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const cells: Array<{ day: number; date: Date | null }> = [];

        for (let i = 0; i < firstWeekday; i += 1) {
            cells.push({ day: 0, date: null });
        }
        for (let day = 1; day <= totalDays; day += 1) {
            cells.push({ day, date: new Date(year, month, day) });
        }
        while (cells.length % 7 !== 0) {
            cells.push({ day: 0, date: null });
        }
        return cells;
    }, [viewMonth]);

    const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const goPrevMonth = () => {
        setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goNextMonth = () => {
        setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleDone = () => {
        onChange(draftDate);
        onClose();
    };

    const handleDayPress = (day: number, cellDate: Date | null) => {
        if (!cellDate) return;

        const now = Date.now();
        const timeSinceLastTap = lastTapTime === null ? 0 : now - lastTapTime;
        
        // Double-tap detection (within 500ms and same day)
        if (timeSinceLastTap < 500 && lastTappedDay === day) {
            // Double-tap detected - select and close
            onChange(cellDate);
            onClose();
            setLastTapTime(null);
            setLastTappedDay(null);
        } else {
            // Single tap - just update the draft date
            setDraftDate(cellDate);
            setLastTapTime(now);
            setLastTappedDay(day);
        }
    };

    useEffect(() => {
        if (!visible) return;
        setDraftDate(date);
        setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        setLastTapTime(null);
        setLastTappedDay(null);
    }, [visible, date]);

    const modalCardStyle = useMemo(
        () => ({
            width: cardWidth,
            maxHeight: cardMaxHeight,
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.shadow,
        }),
        [cardWidth, cardMaxHeight, colors.card, colors.border, colors.shadow]
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={[styles.overlay, { backgroundColor: colors.overlay45 }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={[styles.modalCard, modalCardStyle]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={[styles.cancelText, { color: colors.destructive }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDone}>
                            <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.container}>
                        <View style={styles.calendarContainer}>
                            <View style={styles.monthRow}>
                                <TouchableOpacity
                                    onPress={goPrevMonth}
                                    style={[styles.arrowButton, { borderColor: colors.border, backgroundColor: colors.input }]}
                                >
                                    <Text style={{ color: colors.foreground, fontWeight: '700' }}>{'<'}</Text>
                                </TouchableOpacity>

                                <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>

                                <TouchableOpacity
                                    onPress={goNextMonth}
                                    style={[styles.arrowButton, { borderColor: colors.border, backgroundColor: colors.input }]}
                                >
                                    <Text style={{ color: colors.foreground, fontWeight: '700' }}>{'>'}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.weekdayRow}>
                                {weekdayLabels.map((label) => (
                                    <Text key={`weekday-${label}`} style={[styles.weekday, { color: colors.mutedForeground }]}>
                                        {label}
                                    </Text>
                                ))}
                            </View>

                            <View style={styles.grid}>
                                {days.map((cell, index) => {
                                    const isSelected = !!cell.date && sameDay(cell.date, draftDate);
                                    const isToday = !!cell.date && sameDay(cell.date, new Date());

                                    return (
                                        <TouchableOpacity
                                            key={`day-${index}`}
                                            disabled={!cell.date}
                                            onPress={() => handleDayPress(cell.day, cell.date)}
                                            style={[
                                                styles.dayCell,
                                                {
                                                    width: dayCellSize,
                                                    height: dayCellSize,
                                                    borderColor: isToday && !isSelected ? colors.primary : 'transparent',
                                                    borderWidth: isToday && !isSelected ? 1 : 0,
                                                },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.dayCircle,
                                                    {
                                                        width: dayCircleSize,
                                                        height: dayCircleSize,
                                                        borderRadius: dayCircleSize / 2,
                                                        backgroundColor: isSelected ? colors.primary : 'transparent',
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.dayNumber,
                                                        {
                                                            color: isSelected ? colors.primaryForeground : colors.foreground,
                                                            opacity: cell.date ? 1 : 0,
                                                            fontWeight: isSelected ? '800' : '600',
                                                            fontSize: dayCellSize >= 42 ? 14 : 13,
                                                            lineHeight: dayCellSize >= 42 ? 16 : 15,
                                                        },
                                                    ]}
                                                >
                                                    {cell.day || ''}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    modalCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        elevation: 10,
    },
    container: {
        paddingBottom: 18,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    calendarContainer: {
        paddingHorizontal: 14,
        paddingTop: 14,
    },
    monthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    monthLabel: {
        fontSize: 16,
        fontWeight: '800',
    },
    arrowButton: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekdayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 2,
    },
    weekday: {
        width: 44,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    dayCell: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        marginBottom: 4,
    },
    dayCircle: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        margin: 0,
    },
    dayNumber: {
        textAlign: 'center',
        includeFontPadding: false,
    },
    cancelText: {
        fontSize: 16,
    },
    doneText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
