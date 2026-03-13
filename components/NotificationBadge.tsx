import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationCount } from '../context/NotificationContext';
import { useThemeStore } from '../hooks/useThemeStore';

interface NotificationBadgeProps {
    size?: number;
    color?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
    size = 24, 
    color 
}) => {
    const { totalCount } = useNotificationCount();
    const { colors } = useThemeStore();

    const iconColor = color || colors.foreground;

    return (
        <View style={styles.container}>
            <Ionicons name="notifications-outline" size={size} color={iconColor} />
            {totalCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive, borderColor: colors.background }]} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        right: 6,
        top: 6,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        zIndex: 1,
    },
});
