import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Keyboard,
    StyleSheet,
} from 'react-native';
import { Search, Plus, X, Check } from 'lucide-react-native';
import { useThemeStore } from '../hooks/useThemeStore';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';

interface SelectionModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    items: { label: string; value: string }[];
    onSelect: (value: string) => void;
    onAddItem?: () => void;
    placeholder?: string;
    selectedValue?: string;
}

export function SelectionModal({
    visible,
    onClose,
    title,
    items,
    onSelect,
    onAddItem,
    placeholder = "Search...",
    selectedValue,
}: SelectionModalProps) {
    const [search, setSearch] = useState('');
    const { colors, theme } = useThemeStore();
    const isDark = theme === "dark";
    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["60%"], []);

    useEffect(() => {
        if (visible) {
            setSearch('');
            sheetRef.current?.present();
            return;
        }

        sheetRef.current?.dismiss();
    }, [visible]);

    const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

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
            backgroundStyle={{ backgroundColor: colors.card }}
            keyboardBehavior="extend"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
        >
            <BottomSheetView style={[styles.content, { backgroundColor: colors.card }]}> 
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.input }]}> 
                    <Search size={18} color={colors.mutedForeground} />
                    <BottomSheetTextInput
                        style={[styles.searchInput, { color: colors.foreground }]}
                        placeholder={placeholder}
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor={colors.mutedForeground}
                    />
                </View>

                <BottomSheetFlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.value}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const isSelected = selectedValue === item.value;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.item,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: isSelected
                                            ? (isDark ? colors.secondary : colors.accent)
                                            : colors.input,
                                    },
                                ]}
                                onPress={() => {
                                    onSelect(item.value);
                                    onClose();
                                }}
                            >
                                <Text
                                    style={[
                                        styles.itemText,
                                        { color: colors.foreground },
                                        isSelected && { color: colors.primary, fontWeight: '700' },
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {isSelected && <Check size={18} color={colors.primary} />}
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No results found</Text>
                        </View>
                    }
                />

                {onAddItem && (
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={() => {
                            onClose();
                            Keyboard.dismiss();
                            onAddItem();
                        }}
                    >
                        <Plus size={18} color={colors.primaryForeground} />
                        <Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>Add New</Text>
                    </TouchableOpacity>
                )}
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 14,
        height: 50,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 14,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 52,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 8,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        paddingVertical: 28,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        borderRadius: 16,
        marginTop: 6,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
});
