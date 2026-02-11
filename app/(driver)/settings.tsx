import { useRouter } from 'expo-router';
import { ChevronRight, Globe, LogOut, Moon, Sun, User } from 'lucide-react-native';
import { ScrollView, Switch, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useDriverAppContext } from '../../context/DriverAppContext';
import { logout } from '../../hooks/useAuth';
import { useThemeStore } from '../../hooks/useThemeStore';
import { useUser } from '../../hooks/useUser';
import { translations } from '../../constants/driver/translations';
import DriverScreenHeader from '../../components/driver/DriverScreenHeader';

export default function DriverSettings() {
    const router = useRouter();
    const { theme, toggleTheme, colors } = useThemeStore();
    const { user } = useUser();
    const { language, setLanguage } = useDriverAppContext();
    const isDark = theme === 'dark';
    const t = translations[language];

    const handleLogout = () => {
        Alert.alert(
            t.logout || "Logout",
            t.logoutConfirmation || "Are you sure you want to logout?",
            [
                { text: t.cancel || "Cancel", style: "cancel" },
                {
                    text: t.logout || "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace("/auth/login");
                        } catch (error) {
                            console.error("Logout failed:", error);
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon: Icon, label, value, onPress, rightElement }: any) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress}
            className="flex-row items-center justify-between p-4 bg-card border-b border-border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
            <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full items-center justify-center bg-muted/20">
                    <Icon size={18} color={colors.foreground} />
                </View>
                <Text className="text-base font-medium" style={{ color: colors.foreground }}>
                    {label}
                </Text>
            </View>
            {rightElement || (
                <View className="flex-row items-center gap-2">
                    {value && (
                        <Text className="text-sm text-muted-foreground">{value}</Text>
                    )}
                    {onPress && <ChevronRight size={18} color={colors.mutedForeground} />}
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <DriverScreenHeader title={t.settings || "Settings"} />

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Profile Section */}
                <View className="mt-6 mb-2 px-4">
                    <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {t.account || "Account"}
                    </Text>
                </View>

                <View className="bg-card border-y border-border mb-6">
                    <SettingItem
                        icon={User}
                        label={t.profile || "Edit Profile"}
                        onPress={() => router.push("/(driver)/profile")}
                    />
                </View>

                {/* Preferences Section */}
                <View className="mb-2 px-4">
                    <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {t.preferences || "Preferences"}
                    </Text>
                </View>

                <View className="bg-card border-y border-border mb-6">
                    <SettingItem
                        icon={isDark ? Moon : Sun}
                        label={t.darkMode || "Dark Mode"}
                        rightElement={
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: '#767577', true: colors.primary }}
                                thumbColor={isDark ? '#fff' : '#f4f3f4'}
                            />
                        }
                    />

                    <SettingItem
                        icon={Globe}
                        label={t.language || "Language"}
                        value={language === 'en' ? "English" : "हिंदी"}
                        onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                    />
                </View>

                {/* Account Actions */}
                <View className="px-4">
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="flex-row items-center justify-center p-4 rounded-xl bg-destructive/10 border border-destructive/20"
                    >
                        <LogOut size={20} color="#ef4444" />
                        <Text className="ml-2 font-semibold text-destructive">
                            {t.logout || "Logout"}
                        </Text>
                    </TouchableOpacity>

                    <Text className="text-center text-xs text-muted-foreground mt-6">
                        Version 1.0.0 • Trucksarthi
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
