import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import Dashboardpage from './Dashboardpage';
import Schedule from '../Schedule/Schedule';
import Attendancebatch from '../../Assistant/Attendance/Attendancebatch';
import Marksbatch from '../../Assistant/Marksentry/Marksbatch';
import Notes from '../Notes/Notes';
import Test from '../Test/Test';
import Teacherattendance from '../Teacherattendance/Teacherattendance';
import Profile from '../Profile/Profile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 220;
const IS_TABLET = SCREEN_WIDTH >= 768;
const ANDROID_STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

// ── Icons (SVG-style paths rendered as Unicode / emoji fallbacks) ──────────────
const icons = {
  logo: '🎓',
  dashboard: '⊞',
  schedules: '🗓️',
  attendance: '📅',
  marks: '📊',
  notes: '📝',
  tests: '🧪',
  teacherAttendance: '✅',
  settings: '⚙️',
  support: '❓',
  menu: '☰',
  close: '✕',
  plus: '+',
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
  {key: 'profile', label: 'Profile', icon: '👤' },
  { key: 'schedules', label: 'Schedule', icon: icons.schedules },
   { key: 'notes', label: 'Notes', icon: icons.notes },
  { key: 'tests', label: 'Test', icon: icons.tests },
  { key: 'teacherAttendance', label: 'Teacher Attendance', icon: icons.teacherAttendance },
];

const BOTTOM_ITEMS = [
  { key: 'logout', label: 'Logout', icon: icons.close },
];

// ── NavItem Component ─────────────────────────────────────────────────────────
function NavItem({ item, isActive, onPress, collapsed }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: false,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 20,
    }).start();
  };

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)'],
  });

  return (
    <TouchableOpacity
      onPress={() => onPress(item.key)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      accessibilityLabel={item.label}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.navItem,
          collapsed && styles.navItemCollapsed,
          { backgroundColor: bgColor, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        {!collapsed && (
          <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
            {item.label}
          </Text>
        )}
        {isActive && !collapsed && <View style={styles.activePill} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Sidebar Content ───────────────────────────────────────────────────────────
function SidebarContent({ activeKey, onNavPress, collapsed, onToggleCollapse, onNewSession, onLogout }) {
  return (
    <View style={styles.sidebarInner}>
      {/* Header */}
      <View style={[styles.header, collapsed && styles.headerCollapsed]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>{icons.logo}</Text>
        </View>
        {!collapsed && (
          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>UniVerse</Text>
            
          </View>
        )}
        {IS_TABLET && (
          <TouchableOpacity
            onPress={onToggleCollapse}
            style={styles.collapseBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.collapseBtnText}>{collapsed ? '›' : '‹'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Main Nav */}
      <View style={styles.navSection}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            isActive={activeKey === item.key}
            onPress={onNavPress}
            collapsed={collapsed}
          />
        ))}
      </View>

      {/* Spacer */}
      <View style={styles.flex1} />

      {/* New Session CTA */}
     

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Nav */}
      <View style={styles.navSection}>
        {BOTTOM_ITEMS.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            isActive={activeKey === item.key}
            onPress={(key) => {
              if (key === 'logout') {
                onLogout();
                return;
              }
              onNavPress(key);
            }}
            collapsed={collapsed}
          />
        ))}
      </View>

      {/* User Badge */}
      {!collapsed && (
        <TouchableOpacity onPress={onLogout} activeOpacity={0.7}>
          <View style={styles.userBadge}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>AT</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Dr. Aris Thorne</Text>
            </View>
            <Text style={styles.userLogoutSymbol}>⎋</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Mobile Drawer Overlay ─────────────────────────────────────────────────────
function MobileDrawer({ visible, activeKey, onNavPress, onClose, onNewSession, onLogout }) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: visible ? 0 : -SIDEBAR_WIDTH,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14,
      }),
      Animated.timing(overlayAnim, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  if (!visible && slideAnim._value === -SIDEBAR_WIDTH) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[styles.mobileDrawer, { transform: [{ translateX: slideAnim }] }]}
      >
        <SafeAreaView style={styles.flex1}>
          <SidebarContent
            activeKey={activeKey}
            onNavPress={(key) => { onNavPress(key); onClose(); }}
            collapsed={false}
            onToggleCollapse={() => {}}
            onNewSession={() => { onNewSession(); onClose(); }}
            onLogout={() => { onLogout(); onClose(); }}
          />
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ── Mobile Bottom Bar ─────────────────────────────────────────────────────────
function MobileBottomBar({ activeKey, onNavPress, onMenuPress }) {
  const visibleItems = NAV_ITEMS.slice(0, 4);

  return (
    <View style={styles.bottomBar}>
      {visibleItems.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.bottomBarItem}
            onPress={() => onNavPress(item.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.bottomBarIconWrap, isActive && styles.bottomBarIconActive]}>
              <Text style={styles.bottomBarIcon}>{item.icon}</Text>
            </View>
            <Text style={[styles.bottomBarLabel, isActive && styles.bottomBarLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity style={styles.bottomBarItem} onPress={onMenuPress} activeOpacity={0.7}>
        <View style={styles.bottomBarIconWrap}>
          <Text style={styles.bottomBarIcon}>{icons.menu}</Text>
        </View>
        <Text style={styles.bottomBarLabel}>More</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function sidebar({ onLogout, navigation, route }) {
  const [activeKey, setActiveKey] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [attendanceInitialRoute, setAttendanceInitialRoute] = useState('Attendancebatch');
  const teacherInstituteId =
    route?.params?.instituteId ||
    route?.params?.teacher?.instituteId ||
    '';
  const loggedInTeacherId =
    route?.params?.teacher?.teacherId ||
    '';
  const loggedInTeacherName =
    route?.params?.teacher?.fullName ||
    route?.params?.teacher?.teacherId ||
    'Professor';

  const handleNewSession = () => {
    console.log('New session triggered');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    // Navigate back to Login screen
    navigation?.replace('LoginScreen');
  };

  const handleNavPress = (key) => {
    if (key === 'logout') {
      handleLogout();
      return;
    }
    if (key === 'attendance') {
      setAttendanceInitialRoute('Attendancebatch');
    }
    setActiveKey(key);
  };

  const handleTakeAttendanceFromSchedule = () => {
    setAttendanceInitialRoute('Attendancemark');
    setActiveKey('attendance');
  };

  const handleOpenScheduleFromDashboard = () => {
    setActiveKey('schedules');
  };

  const renderActiveContent = () => {
    switch (activeKey) {
      case 'dashboard':
        return (
          <Dashboardpage
            onOpenFullCalendar={handleOpenScheduleFromDashboard}
            teacherName={loggedInTeacherName}
            teacherId={loggedInTeacherId}
            instituteId={teacherInstituteId}
          />
        );
      case 'profile':
        return (
          <Profile
            teacher={route?.params?.teacher || null}
            instituteId={teacherInstituteId}
          />
        );
      case 'schedules':
        return (
          <Schedule
            instituteId={teacherInstituteId}
            teacherId={loggedInTeacherId}
            onTakeAttendanceNavigate={handleTakeAttendanceFromSchedule}
          />
        );
      case 'attendance':
        return (
          <Attendancebatch
            key={attendanceInitialRoute}
            initialRouteName={attendanceInitialRoute}
            instituteId={teacherInstituteId}
          />
        );
      case 'marks':
        return <Marksbatch instituteId={teacherInstituteId} />;
      case 'notes':
        return (
          <Notes
            instituteId={teacherInstituteId}
            teacherId={route?.params?.teacher?.teacherId || ''}
            teacherName={loggedInTeacherName}
          />
        );
      case 'tests':
        return <Test />;
      case 'teacherAttendance':
        return (
          <Teacherattendance
            instituteId={teacherInstituteId}
            teacherId={loggedInTeacherId}
          />
        );
      case 'settings':
        return (
          <View style={styles.placeholderView}>
            <Text style={styles.contentHint}>Settings module</Text>
            <Text style={styles.contentSub}>Configuration tools will appear here.</Text>
          </View>
        );
      case 'support':
        return (
          <View style={styles.placeholderView}>
            <Text style={styles.contentHint}>Support center</Text>
            <Text style={styles.contentSub}>Help and support resources will appear here.</Text>
          </View>
        );
      default:
        return (
          <Dashboardpage
            teacherName={loggedInTeacherName}
            teacherId={loggedInTeacherId}
            instituteId={teacherInstituteId}
          />
        );
    }
  };

  // ── TABLET / LAPTOP LAYOUT ──────────────────────────────────────────────────
  if (IS_TABLET) {
    return (
      <SafeAreaView style={styles.tabletRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#1a2744" />

        {/* Fixed Sidebar */}
        <Animated.View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
          <SidebarContent
            activeKey={activeKey}
            onNavPress={handleNavPress}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            onNewSession={handleNewSession}
            onLogout={handleLogout}
          />
        </Animated.View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {renderActiveContent()}
        </View>
      </SafeAreaView>
    );
  }

  // ── MOBILE LAYOUT ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.mobileRoot}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6fb" />

      {/* Top Header Bar */}
      <View style={styles.mobileHeader}>
        <TouchableOpacity onPress={() => setDrawerOpen(true)} activeOpacity={0.7}>
          <Text style={styles.menuIconText}>{icons.menu}</Text>
        </TouchableOpacity>
        <View style={styles.mobileHeaderBrand}>
          <Text style={styles.logoIcon}>🎓</Text>
          <Text style={styles.mobileHeaderTitle}>UniVerse</Text>
        </View>
        <View style={styles.avatarCircleSmall}>
          <Text style={styles.avatarInitialsSmall}>AT</Text>
        </View>
      </View>

      {/* Page Content */}
      <View style={styles.mobileMainContent}>
        {renderActiveContent()}
      </View>

      {/* Bottom Navigation Bar */}
     

      {/* Slide-out Drawer */}
      <MobileDrawer
        visible={drawerOpen}
        activeKey={activeKey}
        onNavPress={handleNavPress}
        onClose={() => setDrawerOpen(false)}
        onNewSession={handleNewSession}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const SIDEBAR_BG = '#f0f2f8';
const SIDEBAR_BG_COLLAPSED = '#1a2744';
const ACCENT = '#4ecdc4';
const ACCENT_DARK = '#38b2ac';
const TEXT_PRIMARY = '#0c0b0b';
const TEXT_MUTED = 'rgba(50, 45, 45, 0.55)';
const DIVIDER = 'rgba(255,255,255,0.08)';

const styles = StyleSheet.create({
  flex1: { flex: 1 },

  // ── Tablet ────────────────────────────────────────────────────────────────
  tabletRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f4f6fb',
    paddingTop: ANDROID_STATUSBAR_HEIGHT,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: SIDEBAR_BG,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  sidebarCollapsed: {
    width: 72,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },

  // ── Sidebar Inner ─────────────────────────────────────────────────────────
  sidebarInner: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 8,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  headerCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(78,205,196,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: { fontSize: 20 },
  brandText: { flex: 1 },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  collapseBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapseBtnText: {
    color: TEXT_MUTED,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginHorizontal: 16,
    marginVertical: 6,
  },

  // ── Nav Items ─────────────────────────────────────────────────────────────
  navSection: {
    paddingHorizontal: 10,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 12,
    position: 'relative',
    marginVertical: 1,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: ACCENT,
  },
  iconText: { fontSize: 14 },
  navLabel: {
    fontSize: 13.5,
    color: TEXT_MUTED,
    fontWeight: '500',
    flex: 1,
  },
  navLabelActive: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  activePill: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: ACCENT,
    position: 'absolute',
    right: -10,
  },

  // ── New Session ───────────────────────────────────────────────────────────
  newSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: ACCENT,
    gap: 10,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  newSessionBtnCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 0,
  },
  newSessionIcon: {
    fontSize: 18,
    color: '#1a2744',
    fontWeight: '800',
  },
  newSessionLabel: {
    fontSize: 13.5,
    color: '#1a2744',
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── User Badge ────────────────────────────────────────────────────────────
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#1a2744',
    fontSize: 13,
    fontWeight: '800',
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  userRole: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  userLogoutSymbol: {
    fontSize: 18,
    color: ACCENT,
    fontWeight: '800',
  },

  // ── Mobile ────────────────────────────────────────────────────────────────
  mobileRoot: {
    flex: 1,
    backgroundColor: '#f4f6fb',
    paddingTop: ANDROID_STATUSBAR_HEIGHT,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf4',
    gap: 12,
  },
  menuIconText: {
    fontSize: 22,
    color: '#1a2744',
  },
  mobileHeaderBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  mobileHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2744',
  },
  avatarCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsSmall: {
    color: '#1a2744',
    fontSize: 11,
    fontWeight: '800',
  },
  mobileMainContent: {
    flex: 1,
  },
  placeholderView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Content Placeholder ────────────────────────────────────────────────────
  contentHint: {
    fontSize: 16,
    color: '#8892a4',
    fontWeight: '500',
  },
  contentSub: {
    fontSize: 13,
    color: '#b0b8c8',
    marginTop: 6,
  },

  // ── Bottom Bar ────────────────────────────────────────────────────────────
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e8ecf4',
    paddingBottom: Platform.OS === 'ios' ? 20 : 4,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  bottomBarIconWrap: {
    width: 40,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBarIconActive: {
    backgroundColor: 'rgba(78,205,196,0.15)',
  },
  bottomBarIcon: { fontSize: 18 },
  bottomBarLabel: {
    fontSize: 10,
    color: '#8892a4',
    marginTop: 2,
    fontWeight: '500',
  },
  bottomBarLabelActive: {
    color: ACCENT_DARK,
    fontWeight: '700',
  },

  // ── Mobile Drawer ─────────────────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,18,40,0.55)',
  },
  mobileDrawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: SIDEBAR_BG,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
});