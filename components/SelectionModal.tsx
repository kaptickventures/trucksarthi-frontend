import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Plus, X, Check } from 'lucide-react-native';
import { useThemeStore } from '../hooks/useThemeStore';

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

    const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color={colors.mutedForeground} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.searchBar, { backgroundColor: colors.input }]}>
                            <Search size={20} color={colors.mutedForeground} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.foreground }]}
                                placeholder={placeholder}
                                value={search}
                                onChangeText={setSearch}
                                placeholderTextColor={colors.mutedForeground}
                            />
                        </View>

                        <FlatList
                            data={filteredItems}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        { borderBottomColor: colors.border },
                                        selectedValue === item.value && { backgroundColor: isDark ? colors.secondary : colors.accent }
                                    ]}
                                    onPress={() => {
                                        onSelect(item.value);
                                        onClose();
                                    }}
                                >
                                    <Text style={[
                                        styles.itemText,
                                        { color: colors.foreground },
                                        selectedValue === item.value && { fontWeight: 'bold', color: colors.primary }
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {selectedValue === item.value && (
                                        <Check size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No results found</Text>
                                </View>
                            }
                        />

                        {onAddItem && (
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                                onPress={() => {
                                    onClose();
                                    onAddItem();
                                }}>
                                <Plus size={20} color="white" />
                                <Text style={styles.addButtonText}>Add New</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
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
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '80%',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    itemText: {
        fontSize: 16,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
