import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import EduPortalDashboard from './dashboardpage';
import Profile from '../Profile/profile';
import Attendance from '../Attendance/Attendance';
import Result from '../Result/score';
import Finance from '../Finance/finance';
import { clearSession } from '../../../Src/AuthSession';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const IS_TABLET = SCREEN_WIDTH >= 768;
const IS_MOBILE = SCREEN_WIDTH < 768;
const SIDEBAR_WIDTH = IS_TABLET ? 280 : 240;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'attendance', label: 'Attendance', icon: '📅' },
  { id: 'result', label: 'Result', icon: '📊' },
  { id: 'finance', label: 'Finance', icon: '💳' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

// ─── Hamburger Icon Component ─────────────────────────────────────────────────
const HamburgerIcon = ({ isOpen, color = '#1a1a2e' }) => {
  const topBar = useRef(new Animated.Value(0)).current;
  const middleBar = useRef(new Animated.Value(1)).current;
  const bottomBar = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(topBar, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(middleBar, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(bottomBar, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(topBar, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(middleBar, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(bottomBar, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const topRotate = topBar.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const topTranslateY = topBar.interpolate({ inputRange: [0, 1], outputRange: [0, 7] });
  const bottomRotate = bottomBar.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-45deg'] });
  const bottomTranslateY = bottomBar.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  return (
    <View style={hamburgerStyles.container}>
      <Animated.View
        style={[
          hamburgerStyles.bar,
          { backgroundColor: color },
          { transform: [{ translateY: topTranslateY }, { rotate: topRotate }] },
        ]}
      />
      <Animated.View
        style={[hamburgerStyles.bar, { backgroundColor: color }, { opacity: middleBar }]}
      />
      <Animated.View
        style={[
          hamburgerStyles.bar,
          { backgroundColor: color },
          { transform: [{ translateY: bottomTranslateY }, { rotate: bottomRotate }] },
        ]}
      />
    </View>
  );
};

const hamburgerStyles = StyleSheet.create({
  container: { width: 24, height: 18, justifyContent: 'space-between' },
  bar: { width: 24, height: 2.5, borderRadius: 2 },
});

// ─── Logout Confirmation Modal ────────────────────────────────────────────────
const LogoutConfirmModal = ({ visible, onConfirm, onCancel }) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={logoutModalStyles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
        accessibilityLabel="Cancel logout"
      />

      {/* Card */}
      <View style={logoutModalStyles.centeredWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            logoutModalStyles.card,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Icon */}
          <View style={logoutModalStyles.iconWrap}>
            <Text style={logoutModalStyles.iconText}>⎋</Text>
          </View>

          {/* Title */}
          <Text style={logoutModalStyles.title}>Confirm Logout</Text>

          {/* Message */}
          <Text style={logoutModalStyles.message}>
            Are you sure you want to log out of your account?
          </Text>

          {/* Divider */}
          <View style={logoutModalStyles.divider} />

          {/* Buttons */}
          <View style={logoutModalStyles.buttonRow}>
            {/* Cancel */}
            <TouchableOpacity
              style={[logoutModalStyles.btn, logoutModalStyles.cancelBtn]}
              activeOpacity={0.75}
              onPress={onCancel}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={logoutModalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            {/* Confirm Logout */}
            <TouchableOpacity
              style={[logoutModalStyles.btn, logoutModalStyles.confirmBtn]}
              activeOpacity={0.75}
              onPress={onConfirm}
              accessibilityLabel="Confirm Logout"
              accessibilityRole="button"
            >
              <Text style={logoutModalStyles.confirmBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const logoutModalStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 35, 0.50)',
  },
  centeredWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#1a1a2e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 24 },
      android: { elevation: 16 },
      web: { boxShadow: '0 8px 40px rgba(26,26,46,0.14)' },
    }),
  },

  // Icon circle
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#fff5f5',
    borderWidth: 1.5,
    borderColor: '#ffe4e4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 26 },

  // Text
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f0f23',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6e6e8a',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    marginBottom: 20,
  },

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f0f0f7',
    marginBottom: 20,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cancel — light neutral
  cancelBtn: {
    backgroundColor: '#f5f5fa',
    borderWidth: 1,
    borderColor: '#e8e8f0',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3d3d5c',
  },

  // Confirm — red
  confirmBtn: {
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});

// ─── Sidebar Panel ────────────────────────────────────────────────────────────
const SidebarPanel = ({ activeItem, onItemPress, onClose, onLogout, isMobile, parent }) => {
  const parentName = parent?.parentName || parent?.parentId || 'Parent';
  const studentName = parent?.studentName || parent?.studentId || '';
  const initials = parentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'P';

  return (
    <View style={sidebarStyles.sidebar}>

      <SafeAreaView style={{ flex: 0 }}>
        <View style={sidebarStyles.profileSection}>
          <View style={sidebarStyles.avatarContainer}>
            <View style={sidebarStyles.avatarPlaceholder}>
              <Text style={sidebarStyles.avatarInitials}>{initials}</Text>
            </View>
            <View style={sidebarStyles.onlineDot} />
          </View>
          <View style={sidebarStyles.profileInfo}>
            <Text style={sidebarStyles.profileName}>{parentName}</Text>
            <Text style={sidebarStyles.profileGrade}>{studentName ? `Ward: ${studentName}` : 'Parent Portal'}</Text>
          </View>

          {isMobile && (
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={sidebarStyles.closeBtn}
              accessibilityLabel="Close menu"
              accessibilityRole="button"
            >
              <Text style={sidebarStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* ── Divider between profile header and nav items ── */}
      <View style={sidebarStyles.divider} />

      <ScrollView
        style={sidebarStyles.navSection}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 4 }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[sidebarStyles.navItem, isActive && sidebarStyles.navItemActive]}
              activeOpacity={0.7}
              onPress={() => onItemPress(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive }}
            >
              {isActive && <View style={sidebarStyles.activeIndicator} />}
              <View style={[sidebarStyles.iconContainer, isActive && sidebarStyles.iconContainerActive]}>
                <Text style={sidebarStyles.navIcon}>{item.icon}</Text>
              </View>
              <Text style={[sidebarStyles.navLabel, isActive && sidebarStyles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={sidebarStyles.footer}>
        <TouchableOpacity
          style={sidebarStyles.logoutButton}
          activeOpacity={0.75}
          onPress={onLogout}
          accessibilityLabel="Logout"
          accessibilityRole="button"
        >
          <View style={sidebarStyles.logoutIconContainer}>
            <Text style={sidebarStyles.logoutIcon}>⎋</Text>
          </View>
          <Text style={sidebarStyles.logoutLabel}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const sidebarStyles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,            // ✓ never grow/shrink — stay at fixed SIDEBAR_WIDTH
    backgroundColor: '#ffffff',
    paddingTop: Platform.select({ ios: 52, android: (StatusBar.currentHeight || 0) + 32, default: 32 }),
    paddingBottom: 30,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f7',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatarPlaceholder: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: '#5b5bd6' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: IS_TABLET ? 16 : 14, fontWeight: '700', color: '#0f0f23', letterSpacing: -0.3 },
  profileGrade: { fontSize: 12, color: '#9999b3', marginTop: 2, fontWeight: '500' },
  closeBtn: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f3f0ff', marginLeft: 6,
  },
  closeBtnText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  divider: {
    height: 1, backgroundColor: '#f0f0f7',
    marginTop: 8, marginBottom: 28, marginHorizontal: 16,
  },
  navSection: { flex: 1, paddingHorizontal: 12 },
  navItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 4,
    position: 'relative', overflow: 'hidden',
  },
  navItemActive: { backgroundColor: '#f0f0fd' },
  activeIndicator: {
    position: 'absolute', left: 0, top: '20%', bottom: '20%',
    width: 3.5, backgroundColor: '#5b5bd6', borderRadius: 2,
  },
  iconContainer: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: '#f5f5fa', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  iconContainerActive: { backgroundColor: '#ddddf8' },
  navIcon: { fontSize: 16 },
  navLabel: { fontSize: IS_TABLET ? 15 : 14, fontWeight: '500', color: '#6e6e8a', letterSpacing: 0.1 },
  navLabelActive: { color: '#3d3dbd', fontWeight: '700' },
  footer: { paddingBottom: 24 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginBottom: 10,
    marginTop: 60,                              // ← increased from 20 → 60 to push button lower
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 12, backgroundColor: '#fff5f5',
    borderWidth: 1, borderColor: '#ffe4e4',
  },
  logoutIconContainer: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: '#ffe4e4', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  logoutIcon: { fontSize: 16, color: '#ef4444' },
  logoutLabel: { fontSize: IS_TABLET ? 15 : 14, fontWeight: '600', color: '#ef4444', letterSpacing: 0.1 },
  footerText: { textAlign: 'center', fontSize: 11, color: '#c0c0d8', fontWeight: '500' },
});

// ─── Main Shell ───────────────────────────────────────────────────────────────
function ParentDashboardShell({ navigation, route }) {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [modalVisible, setModalVisible] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const slideX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Extract parent data from session ─────────────────────────────────────
  const currentParent = route?.params?.parent || null;
  // Always prefer the value from the DB record — navigation params can carry
  // stale or wrong strings (e.g. the literal "None") from session restoration.
  const _validId = (v) => v && v !== 'None' ? v : null;
  const currentInstituteId =
    _validId(currentParent?.instituteId) ||
    _validId(route?.params?.instituteId) ||
    '';


  const openDrawer = () => {
    setModalVisible(true);
    setHamburgerOpen(true);
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 270, useNativeDriver: true }),
      ]).start();
    }, 10);
  };

  const closeDrawer = (afterClose) => {
    setHamburgerOpen(false);
    Animated.parallel([
      Animated.timing(slideX, { toValue: -SIDEBAR_WIDTH, duration: 230, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 230, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      afterClose?.();
    });
  };

  const handleNavItem = (id) => {
    setActiveItem(id);
    if (IS_MOBILE) closeDrawer();
  };

  // ── Logout flow ──────────────────────────────────────────────────────────
  const handleLogoutPress = () => {
    if (IS_MOBILE) {
      closeDrawer(() => setLogoutModalVisible(true));
    } else {
      setLogoutModalVisible(true);
    }
  };

  const handleLogoutConfirm = async () => {
    setLogoutModalVisible(false);
    await clearSession();
    if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else {
      console.log('Navigating to Login — wire up navigation prop.');
    }
  };

  const handleLogoutCancel = () => setLogoutModalVisible(false);

  const renderActiveContent = () => {
    if (activeItem === 'profile') return <Profile parentUser={currentParent} />;
    if (activeItem === 'attendance') return <Attendance parent={currentParent} instituteId={currentInstituteId} route={{ params: { student: { _id: currentParent?.studentId, instituteId: currentInstituteId, fullName: currentParent?.studentName } } }} />;
    if (activeItem === 'result') return <Result parent={currentParent} instituteId={currentInstituteId} />;
    if (activeItem === 'finance') return <Finance parent={currentParent} instituteId={currentInstituteId} />;
    return <EduPortalDashboard parent={currentParent} instituteId={currentInstituteId} />;
  };

  // ══════════════════════════════════════════════
  // MOBILE
  // ══════════════════════════════════════════════
  if (IS_MOBILE) {
    return (
      <View style={shellStyles.container}>

        <SafeAreaView style={shellStyles.topBarSafeArea}>
          <View style={shellStyles.topBar}>
            <TouchableOpacity
              style={shellStyles.hamburgerButton}
              onPress={openDrawer}
              activeOpacity={0.75}
              accessibilityLabel="Open navigation menu"
              accessibilityRole="button"
            >
              <HamburgerIcon isOpen={hamburgerOpen} color="#1a1a2e" />
            </TouchableOpacity>
            <Text style={shellStyles.topBarTitle}>Parent Portal</Text>
          </View>
        </SafeAreaView>

        <View style={shellStyles.stackContainer}>
          {renderActiveContent()}
        </View>

        {/* Drawer Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => closeDrawer()}
        >
          <Animated.View
            style={[StyleSheet.absoluteFill, shellStyles.overlay, { opacity: fadeAnim }]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => closeDrawer()}
              accessibilityLabel="Close menu"
            />
          </Animated.View>

          <Animated.View
            style={[shellStyles.drawerContainer, { transform: [{ translateX: slideX }] }]}
          >
            <SidebarPanel
              activeItem={activeItem}
              onItemPress={handleNavItem}
              onClose={() => closeDrawer()}
              onLogout={handleLogoutPress}
              isMobile
              parent={currentParent}
            />
          </Animated.View>
        </Modal>

        {/* Logout Confirmation Modal */}
        <LogoutConfirmModal
          visible={logoutModalVisible}
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />

      </View>
    );
  }

  // ══════════════════════════════════════════════
  // DESKTOP / TABLET
  // ══════════════════════════════════════════════
  return (
    <View style={[shellStyles.container, { flexDirection: 'row' }]}>

      <SidebarPanel
        activeItem={activeItem}
        onItemPress={handleNavItem}
        onLogout={handleLogoutPress}
        isMobile={false}
        parent={currentParent}
      />

      <View style={{ flex: 1 }}>
        <SafeAreaView style={shellStyles.topBarSafeArea}>
          <View style={shellStyles.topBar}>
            <Text style={shellStyles.topBarTitle}>Parent Portal</Text>
          </View>
        </SafeAreaView>

        <View style={shellStyles.stackContainer}>
          {renderActiveContent()}
        </View>
      </View>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

    </View>
  );
}

export default function ParentDashboardStack({ navigation, route }) {
  return <ParentDashboardShell navigation={navigation} route={route} />;
}

// ─── Shell Styles ─────────────────────────────────────────────────────────────
const shellStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6fb' },
  topBarSafeArea: { backgroundColor: '#ffffff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F7',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
    }),
  },
  hamburgerButton: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#f0f0fd', alignItems: 'center',
    justifyContent: 'center', marginRight: 12, marginBottom: 2,
  },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  stackContainer: { flex: 1 },
  overlay: {
    backgroundColor: 'rgba(15, 15, 35, 0.55)',
    zIndex: 1,
  },
  drawerContainer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: SIDEBAR_WIDTH, zIndex: 2,
    ...Platform.select({
      ios: { shadowColor: '#5b5bd6', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.18, shadowRadius: 20 },
      android: { elevation: 20 },
      web: { boxShadow: '4px 0 24px rgba(91,91,214,0.15)' },
    }),
  },
});