const fs = require('fs');
const file = 'c:/coding/Trucksarthi/trucksarthi-frontend/app/(stack)/settings.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    'import { useThemeStore } from "../../hooks/useThemeStore";',
    'import { useThemeStore } from "../../hooks/useThemeStore";\nimport { useUser } from "../../hooks/useUser";'
);

data = data.replace(
    'const { t, language, setLanguage } = useTranslation();',
    'const { t, language, setLanguage } = useTranslation();\n  const { user, updateUser } = useUser();'
);

data = data.replace(
    'const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);',
    'const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);\n\n  useEffect(() => {\n    if (user) {\n      setIsNotificationsEnabled(user.has_notifications_allowed ?? true);\n    }\n  }, [user]);'
);

data = data.replace(
    'setIsNotificationsEnabled(val);\r\n            if (!val) {',
    'setIsNotificationsEnabled(val);\r\n            if (user) updateUser({ has_notifications_allowed: val }).catch(e => console.error("failed sync"));\r\n            if (!val) {'
);

data = data.replace(
    'setIsNotificationsEnabled(val);\n            if (!val) {',
    'setIsNotificationsEnabled(val);\n            if (user) updateUser({ has_notifications_allowed: val }).catch(e => console.error("failed sync"));\n            if (!val) {'
);

fs.writeFileSync(file, data);
console.log('Done!');
