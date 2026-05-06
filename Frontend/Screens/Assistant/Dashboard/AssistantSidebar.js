import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Image,
} from 'react-native';
import AssistantDashboardScreen from './Assistantdashboard';
import MesseagebatchScreen from '../Messeage/Messeagebatch';
import TeacherAttendanceScreen from '../TeacherAttendance/TeacherAttendance';
import AttendancebatchScreen from '../Attendance/Attendancebatch';
import AddNewScheduleScreen from '../Schedule/AddNewSchedule';
import FeeManagmentScreen from '../FeeManagement/FeeManagment';
import MarksbatchScreen from '../Marksentry/Marksbatch';
import MarksViewScreen from '../Marksentry/MarksView';
import BatchselectionScreen from '../Batchselection/Batchselection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'broadcast', label: 'Broadcast Center', icon: '📢' },
  { id: 'teacherattendance', label: 'Teacher Attendance', icon: '🎓' },
  { id: 'studentattendace', label: 'Student Attendance', icon: '👤' },
  { id: 'Schedule', label: 'Schedule Management', icon: '👨‍👩‍👧' },
  { id: 'marksentry', label: 'Marks Entry', icon: '📝' },
  { id: 'marksview', label: 'View Exam Marks', icon: '📊' },
  { id: 'feemanagement', label: 'Fee Management', icon: '💰' },
  { id: 'teacherallocation', label: 'Teacher Allocation', icon: '👩‍🏫' },
];

const BOTTOM_ITEMS = [
  { id: 'help', label: 'Help Center', icon: '❓' },
  { id: 'logout', label: 'Logout', icon: '↪' },
];

const SCREEN_COMPONENTS = {
  dashboard: AssistantDashboardScreen,
  broadcast: MesseagebatchScreen,
  teacherattendance: TeacherAttendanceScreen,
  studentattendace: AttendancebatchScreen,
  Schedule: AddNewScheduleScreen,
  feemanagement: FeeManagmentScreen,
  marksentry: MarksbatchScreen,
  marksview: MarksViewScreen,
  teacherallocation: BatchselectionScreen,
};

export default function AssistantSidebar({ activeItem = 'dashboard', onNavigate, isVisible = true, onClose, route, navigation }) {
  const [hovered, setHovered] = useState(null);
  const [open, setOpen] = useState(isVisible);
  const [selectedItem, setSelectedItem] = useState(activeItem);
  const [activeScreenId, setActiveScreenId] = useState('dashboard');
  const [screenError, setScreenError] = useState('');
  const assistantParams = route?.params || {};

  const sidebarAnim = useRef(new Animated.Value(isVisible ? 0 : -SCREEN_WIDTH)).current;

  const loadScreen = (screenId) => {
    if (!SCREEN_COMPONENTS[screenId]) {
      setScreenError(`Screen "${screenId}" is not available.`);
      setActiveScreenId('dashboard');
      return;
    }

    setActiveScreenId(screenId);
    setScreenError('');
  };

  useEffect(() => {
    setOpen(isVisible);
  }, [isVisible]);

  useEffect(() => {
    setSelectedItem(activeItem);
  }, [activeItem]);

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: open ? 0 : -SCREEN_WIDTH,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [open, sidebarAnim]);

  const handleItemPress = (item) => {
    setSelectedItem(item.id);

    const navigateAfter = () => {
      onNavigate && onNavigate(item.id);
      if (IS_MOBILE && onClose) onClose();
    };

    Animated.timing(sidebarAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setOpen(false);
      loadScreen(item.id);
      navigateAfter();
    });
  };

  const handleLogout = () => {
    setSelectedItem('logout');
    setOpen(false);

    if (navigation?.replace) {
      navigation.replace('LoginScreen');
      return;
    }

    if (navigation?.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
      return;
    }

    onNavigate && onNavigate('logout');
  };

  return (
    <View style={styles.shell}>
      {/* Hamburger button - always visible on left side */}
      <TouchableOpacity
        style={styles.hamburger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.hamburgerIcon}>☰</Text>
      </TouchableOpacity>
      {/* Overlay for mobile */}
      {IS_MOBILE && open && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => {
            setOpen(false);
            onClose && onClose();
          }}
          activeOpacity={1}
        />
      )}
      <Animated.View style={[styles.sidebar, IS_MOBILE && styles.sidebarMobile, { transform: [{ translateX: sidebarAnim }] }]}>
        {/* Logo / Brand */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>🎓</Text>
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>Assistant Portal</Text>
            <Text style={styles.brandSubtitle}>UniVerse</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Navigation Items */}
        <View style={styles.navSection}>
          {NAV_ITEMS.map((item) => {
            const isActive = selectedItem === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                  {item.icon}
                </Text>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* New Broadcast Button */}
        <TouchableOpacity
          style={styles.newBroadcastBtn}
          onPress={() => onNavigate && onNavigate('new-broadcast')}
          activeOpacity={0.85}
        >
          <Text style={styles.newBroadcastIcon}>＋</Text>
          <Text style={styles.newBroadcastText}>New Broadcast</Text>
        </TouchableOpacity>

        {/* Bottom Items */}
        <View style={styles.bottomSection}>
          {BOTTOM_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.bottomItem}
              onPress={item.id === 'logout' ? handleLogout : () => { onNavigate && onNavigate(item.id); if (IS_MOBILE) setOpen(false); }}
              activeOpacity={0.7}
            >
              <Text style={styles.bottomIcon}>{item.icon}</Text>
              <Text style={styles.bottomLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
      <View style={styles.contentArea}>
        {React.createElement(
          SCREEN_COMPONENTS[activeScreenId] || AssistantDashboardScreen,
          {
            onMenuPress: () => setOpen(true),
            activeItem: activeScreenId || activeItem,
            instituteId: assistantParams.instituteId || '',
            instituteName: assistantParams.instituteName || '',
            adminInfo: assistantParams.adminInfo || {},
            navigation,
          }
        )}
        {!!screenError && <Text style={styles.errorText}>{screenError}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f7fa',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  sidebar: {
    width: 220,
    height: '100%',
    backgroundColor: '#0f2037',
    paddingVertical: 20,
    paddingHorizontal: 0,
    flexDirection: 'column',
    ...Platform.select({
      web: { height: '100vh' },
      default: {},
    }),
  },
  sidebarMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 4, height: 0 },
    shadowRadius: 16,
    height: '100%',
  },

  // Brand
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 4,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandIconText: { fontSize: 22 },
  brandText: { flex: 1 },
  brandTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    color: '#5a9ec9',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 18,
    marginVertical: 14,
  },

  // Nav
  navSection: {
    flex: 1,
    paddingHorizontal: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(32,178,170,0.15)',
  },
  navIcon: {
    fontSize: 16,
    marginRight: 12,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#20b2aa',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -10,
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#20b2aa',
  },

  // New Broadcast
  newBroadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a3a60',
    borderRadius: 10,
    marginHorizontal: 14,
    paddingVertical: 13,
    marginTop: 12,
    marginBottom: 16,
  },
  newBroadcastIcon: {
    color: '#ffffff',
    fontSize: 18,
    marginRight: 8,
    fontWeight: '300',
  },
  newBroadcastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  bottomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  bottomIcon: {
    fontSize: 15,
    marginRight: 12,
    opacity: 0.5,
  },
  bottomLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  hamburger: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  hamburgerIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#fff',
    marginLeft: 0,
    padding: 0,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#5a9ec9',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#1a2f5a',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#5a6e85',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 18,
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});