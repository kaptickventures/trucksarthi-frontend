const fs = require('fs');
const file = 'c:/coding/Trucksarthi/trucksarthi-frontend/app/(driver)/settings.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    "import { ChevronRight, Globe, LogOut, Moon, Sun, User } from 'lucide-react-native';",
    "import { ChevronRight, Globe, LogOut, Moon, Sun, User, Bell } from 'lucide-react-native';"
);

data = data.replace(
    "import { useThemeStore } from '../../hooks/useThemeStore';",
    "import { useThemeStore } from '../../hooks/useThemeStore';\nimport { useUser } from '../../hooks/useUser';\nimport { useEffect, useState } from 'react';"
);

data = data.replace(
    "const { language, setLanguage } = useDriverAppContext();",
    "const { language, setLanguage } = useDriverAppContext();\n    const { user, updateUser } = useUser();\n    const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);\n\n    useEffect(() => {\n        if (user) {\n            setIsNotificationsEnabled(user.has_notifications_allowed ?? true);\n        }\n    }, [user]);"
);

const notificationsBlock = `                    <SettingItem
                        icon={Bell}
                        label={t.pushNotifications || "Push Notifications"}
                        rightElement={
                            <Switch
                                value={isNotificationsEnabled}
                                onValueChange={async (val) => {
                                    setIsNotificationsEnabled(val);
                                    if (user) updateUser({ has_notifications_allowed: val }).catch(e => console.error("failed sync"));
                                    if (!val) {
                                        Alert.alert(
                                            "Notifications Disabled",
                                            "You will no longer receive alerts for new trips and updates.",
                                            [{ text: "OK" }]
                                        );
                                    }
                                }}
                                trackColor={{ false: '#767577', true: colors.primary }}
                                thumbColor={isNotificationsEnabled ? '#fff' : '#f4f3f4'}
                            />
                        }
                    />

                    <SettingItem
                        icon={Globe}`;

data = data.replace(
    "                    <SettingItem\n                        icon={Globe}",
    notificationsBlock
);

data = data.replace(
    "                    <SettingItem\r\n                        icon={Globe}",
    notificationsBlock
);

fs.writeFileSync(file, data);
console.log('Done driver settings!');
