import { Link, Tabs, useRouter } from 'expo-router';
import { Bell, Globe, History, Home, List, MapPin, Menu, Phone, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriverAppContext } from '../../../context/DriverAppContext';
import { BorderRadius, Colors, Spacing } from '../../../constants/driver/theme';
import { translations } from '../../../constants/driver/translations';

export default function TabLayout() {
  const [profileVisible, setProfileVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { user, language, setLanguage, logoutUser } = useDriverAppContext();
  const t = translations[language];

  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (profileVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -Dimensions.get('window').width * 0.7,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, profileVisible, slideAnim]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          setProfileVisible(false);
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const profileImage = user?.profile_picture_url;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <View style={[styles.customHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setProfileVisible(!profileVisible)}>
            {profileVisible ? <X color={Colors.text} size={24} /> : <Menu color={Colors.text} size={24} />}
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Trucksarthi</Text>

          <Link href="/(driver)/notifications" asChild>
            <TouchableOpacity style={styles.headerBtn}>
              <Bell color={Colors.text} size={24} />
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textSecondary,
            tabBarShowLabel: true,
            tabBarStyle: {
              height: 70,
              paddingBottom: 10,
              paddingTop: 10,
              backgroundColor: Colors.white,
              borderTopColor: Colors.border,
            },
            tabBarItemStyle: {
              justifyContent: 'center',
              alignItems: 'center',
            },
          }}
        >
          <Tabs.Screen name="index" options={{ title: t.home, tabBarIcon: ({ color }) => <Home color={color} /> }} />
          <Tabs.Screen name="history" options={{ title: t.history, tabBarIcon: ({ color }) => <History color={color} /> }} />
          <Tabs.Screen name="ledger" options={{ title: t.khata, tabBarIcon: ({ color }) => <List color={color} /> }} />
        </Tabs>

        <Animated.View
          style={[styles.overlay, { opacity: fadeAnim, pointerEvents: profileVisible ? 'auto' : 'none' }]}
        >
          <TouchableWithoutFeedback onPress={() => setProfileVisible(false)}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.popupTitle}>{t.profile}</Text>
          </View>

          {user ? (
            <View style={styles.sidebarContainer}>
              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: Colors.textSecondary, fontWeight: '700' }}>DP</Text>
                    </View>
                  )}

                  <View>
                    <Text style={styles.name}>{user.name || 'Driver'}</Text>
                    <Text style={styles.id}>ID: {user._id}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Phone size={16} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>{user.phone || '-'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MapPin size={16} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>{user.address || '-'}</Text>
                </View>
              </ScrollView>

              <View style={styles.bottomButtons}>
                <TouchableOpacity
                  style={styles.languageButton}
                  onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                >
                  <Globe size={20} color={Colors.text} />
                  <Text style={styles.languageText}>
                    {language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={{ padding: 20 }}>Not logged in.</Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  customHeader: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1002,
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  headerBtn: {
    padding: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '70%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
    padding: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarContainer: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scrollContent: {
    flex: 1,
  },
  bottomButtons: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.border,
    marginRight: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  id: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  languageText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FFEBEE',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
