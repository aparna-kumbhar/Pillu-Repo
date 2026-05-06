import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, SafeAreaView,
  ScrollView, StatusBar, Platform, Modal,
} from 'react-native';
import Maindashboard from './Maindashboard';
import Permissions from '../Permissions/Permission';
import AddInstitute from '../AddInstitute/AddInstitute';

// ─── constants ───────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const SIDEBAR_W = 280;
const IS_LAPTOP = SCREEN_W >= 1024;

const NAV_ITEMS = [
  { key: 'Dashboard',      icon: '▦' },
  { key: 'Add Institutes', icon: '▣' },
  { key: 'Permissions',    icon: '⊞' },
];

// ─── placeholder screens ─────────────────────────────────────────────────────
const PlaceholderScreen = ({ route }) => (
  <View style={s.screen}>
    <Text style={s.screenTitle}>{route.name}</Text>
    <Text style={s.screenSub}>Module content goes here.</Text>
  </View>
);

// ─── Logout Confirmation Modal ────────────────────────────────────────────────
const LogoutConfirmModal = ({ visible, onConfirm, onCancel }) => {
  const scaleAnim   = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1, tension: 72, friction: 10, useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1, duration: 210, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.88, duration: 180, useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0, duration: 180, useNativeDriver: true,
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
      {/* Dim backdrop — tap outside to cancel */}
      <TouchableOpacity
        style={m.backdrop}
        activeOpacity={1}
        onPress={onCancel}
        accessibilityLabel="Cancel logout"
      />

      {/* Centred card */}
      <View style={m.centreWrapper} pointerEvents="box-none">
        <Animated.View
          style={[m.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
        >
          {/* Icon badge */}
          <View style={m.iconBadge}>
            <Text style={m.iconText}>⎋</Text>
          </View>

          {/* Title */}
          <Text style={m.title}>Confirm Logout</Text>

          {/* Message */}
          <Text style={m.message}>
            Are you sure you want to log out of your account?
          </Text>

          {/* Divider */}
          <View style={m.divider} />

          {/* Buttons */}
          <View style={m.btnRow}>
            <TouchableOpacity
              style={[m.btn, m.cancelBtn]}
              activeOpacity={0.75}
              onPress={onCancel}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[m.btn, m.confirmBtn]}
              activeOpacity={0.75}
              onPress={onConfirm}
              accessibilityLabel="Confirm logout"
              accessibilityRole="button"
            >
              <Text style={m.confirmText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── Modal styles ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 35, 0.45)',
  },
  centreWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
    pointerEvents:  'box-none',
  },
  card: {
    width:             Math.min(SCREEN_W - 48, 320),
    backgroundColor:   '#FFFFFF',
    borderRadius:      20,
    paddingTop:        28,
    paddingBottom:     24,
    paddingHorizontal: 24,
    alignItems:        'center',
    ...Platform.select({
      ios:     { shadowColor: '#1a2744', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 24 },
      android: { elevation: 16 },
      web:     { boxShadow: '0 8px 40px rgba(26,39,68,0.13)' },
    }),
  },
  iconBadge: {
    width:           56,
    height:          56,
    borderRadius:    16,
    backgroundColor: '#fff5f5',
    borderWidth:     1.5,
    borderColor:     '#ffe4e4',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    16,
  },
  iconText:  { fontSize: 24, color: '#ef4444' },
  title: {
    fontSize:      17,
    fontWeight:    '700',
    color:         '#1a2744',
    letterSpacing: -0.3,
    marginBottom:  8,
  },
  message: {
    fontSize:     13.5,
    color:        '#6B7A8F',
    textAlign:    'center',
    lineHeight:   20,
    marginBottom: 20,
  },
  divider: {
    width:           '100%',
    height:          1,
    backgroundColor: '#E8ECF0',
    marginBottom:    20,
  },
  btnRow: {
    flexDirection: 'row',
    gap:           10,
    width:         '100%',
  },
  btn: {
    flex:            1,
    paddingVertical: 13,
    borderRadius:    12,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cancelBtn: {
    backgroundColor: '#F4F6F9',
    borderWidth:     1,
    borderColor:     '#E8ECF0',
  },
  cancelText: {
    fontSize:   14,
    fontWeight: '600',
    color:      '#1a2744',
  },
  confirmBtn: {
    backgroundColor: '#ef4444',
    borderWidth:     1,
    borderColor:     '#dc2626',
  },
  confirmText: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
});

// ─── Sidebar component ────────────────────────────────────────────────────────
const Sidebar = ({ navigation, activeRoute, slideAnim, onClose, onLogoutPress }) => {
  const translate = slideAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-SIDEBAR_W, 0],
  });

  const handleNav = (key) => {
    navigation.navigate(key);
    if (!IS_LAPTOP) onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {!IS_LAPTOP && (
        <Animated.View
          style={[s.overlay, { opacity: slideAnim }]}
          pointerEvents="auto"
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>
      )}

      <Animated.View
        style={[
          s.sidebar,
          IS_LAPTOP ? s.sidebarLaptop : s.sidebarMobile,
          IS_LAPTOP ? null : { transform: [{ translateX: translate }] },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }}>

          {/* Brand */}
          <View style={s.brand}>
            <Text style={s.brandTitle}>UniVerse Admin</Text>
            <Text style={s.brandSub}>EXECUTIVE PORTAL</Text>
          </View>

          {/* Nav items */}
          <ScrollView style={{ flex: 1 }}>
            {NAV_ITEMS.map((item) => {
              const active = activeRoute === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[s.navItem, active && s.navItemActive]}
                  activeOpacity={0.7}
                  onPress={() => handleNav(item.key)}
                >
                  <Text style={[s.navIcon, active && s.navIconActive]}>
                    {item.icon}
                  </Text>
                  <Text style={[s.navLabel, active && s.navLabelActive]}>
                    {item.key.toUpperCase()}
                  </Text>
                  {active && <View style={s.activeBar} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Logout button ── */}
          <View style={s.logoutSection}>
            <View style={s.logoutDivider} />
            <TouchableOpacity
              style={s.logoutBtn}
              activeOpacity={0.75}
              onPress={onLogoutPress}
              accessibilityLabel="Logout"
              accessibilityRole="button"
            >
              <View style={s.logoutIconBox}>
                <Text style={s.logoutIconText}>⎋</Text>
              </View>
              <Text style={s.logoutLabel}>LOGOUT</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </Animated.View>
    </>
  );
};

// ─── Layout wrapper ───────────────────────────────────────────────────────────
const CommitteSidebar = ({ navigation }) => {
  const [activeRoute,        setActiveRoute]        = useState('Dashboard');
  const [sidebarOpen,        setSidebarOpen]        = useState(IS_LAPTOP);
  const [selectedInstitute,  setSelectedInstitute]  = useState(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(IS_LAPTOP ? 1 : 0)).current;

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.timing(slideAnim, {
      toValue: 1, duration: 280, useNativeDriver: true,
    }).start();
  };

  // ✅ FIX — only call afterClose if it is genuinely a function,
  //    ignoring synthetic event objects passed by TouchableOpacity / onClose
  const closeSidebar = (afterClose) => {
    Animated.timing(slideAnim, {
      toValue: 0, duration: 240, useNativeDriver: true,
    }).start(() => {
      setSidebarOpen(false);
      if (typeof afterClose === 'function') {
        afterClose();
      }
    });
  };

  // ── Step 1 — logout button pressed in sidebar ─────────────────────────────
  const handleLogoutPress = () => {
    if (!IS_LAPTOP) {
      // Close drawer first, then show modal once animation is done
      // Pass the callback directly — closeSidebar now safely ignores non-functions
      closeSidebar(() => setLogoutModalVisible(true));
    } else {
      setLogoutModalVisible(true);
    }
  };

  // ── Step 2a — user confirmed ──────────────────────────────────────────────
  const handleLogoutConfirm = () => {
    setLogoutModalVisible(false);
    if (navigation) {
      navigation.reset({
        index:  0,
        routes: [{ name: 'Login' }],
      });
    } else {
      console.log('Logout confirmed — wire up your navigation here');
    }
  };

  // ── Step 2b — user cancelled ──────────────────────────────────────────────
  const handleLogoutCancel = () => setLogoutModalVisible(false);

  return (
    <View style={s.root}>

      {/* Header */}
      <View style={s.header}>
        {!IS_LAPTOP && (
          <TouchableOpacity
            onPress={openSidebar}
            style={s.hamburgerBtn}
            activeOpacity={0.7}
          >
            <View style={s.hamburgerLine} />
            <View style={s.hamburgerLine} />
            <View style={s.hamburgerLine} />
          </TouchableOpacity>
        )}
        <Text style={s.headerTitle}>Committee Dashboard</Text>
      </View>

      {/* Content + Sidebar */}
      <View style={{ flex: 1, flexDirection: 'row' }}>

        {/* Main content */}
        <View style={{ flex: 1 }}>
          {activeRoute === 'Dashboard' ? (
            <Maindashboard
              onViewDirectory={() => setActiveRoute('Add Institutes')}
              onInstituteClick={(institute) => {
                setActiveRoute('Add Institutes');
                setSelectedInstitute(institute);
              }}
            />
          ) : activeRoute === 'Add Institutes' ? (
            <AddInstitute
              onInstituteClick={setSelectedInstitute}
              selectedInstitute={selectedInstitute}
            />
          ) : activeRoute === 'Permissions' ? (
            <Permissions />
          ) : (
            <PlaceholderScreen route={{ name: activeRoute }} />
          )}
        </View>

        {/* Sidebar */}
        {(sidebarOpen || IS_LAPTOP) && (
          <Sidebar
            navigation={{
              navigate: (key) => {
                setActiveRoute(key);
                setSelectedInstitute(null);
                if (!IS_LAPTOP) closeSidebar();  // no callback — safely ignored
              },
            }}
            activeRoute={activeRoute}
            slideAnim={slideAnim}
            onClose={closeSidebar}               // event object passed — safely ignored
            onLogoutPress={handleLogoutPress}
          />
        )}
      </View>

      {/* Logout confirmation modal — always on top, outside sidebar */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

    </View>
  );
};

export default CommitteSidebar;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1, flexDirection: 'column', backgroundColor: '#F4F6F9' },
  screen:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6F9' },
  screenTitle: { fontSize: 28, fontWeight: '600', color: '#1a2744' },
  screenSub:   { fontSize: 15, color: '#888', marginTop: 6 },

  // ── Header ──
  header: {
    backgroundColor:   '#FFFFFF',
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'flex-start',
    paddingHorizontal: 16,
    paddingTop:        Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 14,
    paddingBottom:     14,
    height:            Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 56 : 70,
    elevation:         2,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.08,
    shadowRadius:      3,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
  },
  headerTitle: {
    fontSize:      17,
    fontWeight:    '600',
    color:         '#1a2744',
    letterSpacing: 0.3,
    marginLeft:    12,
  },

  // ── Hamburger ──
  hamburgerBtn: {
    padding:         12,
    borderRadius:    8,
    backgroundColor: '#F0F2F5',
    justifyContent:  'center',
    alignItems:      'center',
  },
  hamburgerLine: {
    width:           20,
    height:          2,
    backgroundColor: '#1a2744',
    borderRadius:    2,
    marginVertical:  2,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 10,
  },

  // ── Sidebar ──
  sidebar: {
    backgroundColor:  '#FFFFFF',
    width:            SIDEBAR_W,
    zIndex:           20,
    borderRightWidth: 1,
    borderRightColor: '#E8ECF0',
    shadowColor:      '#000',
    shadowOffset:     { width: 2, height: 0 },
    shadowOpacity:    0.06,
    shadowRadius:     8,
    elevation:        4,
  },
  sidebarLaptop: { position: 'relative' },
  sidebarMobile: { position: 'absolute', top: 0, bottom: 0, left: 0 },

  // ── Brand ──
  brand: {
    paddingHorizontal: 24,
    paddingTop:        28,
    paddingBottom:     22,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
    backgroundColor:   '#F8F9FB',
  },
  brandTitle: { color: '#1a2744', fontSize: 14, fontWeight: '700', letterSpacing: 1.2 },
  brandSub:   { color: '#8A96A8', fontSize: 10, letterSpacing: 1,  marginTop: 3 },

  // ── Nav items ──
  navItem: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   15,
    paddingHorizontal: 24,
    position:          'relative',
    marginHorizontal:  10,
    marginVertical:    2,
    borderRadius:      10,
  },
  navItemActive:  { backgroundColor: '#EAF4FF' },
  navIcon:        { fontSize: 15, color: '#A0AAB8', width: 26 },
  navIconActive:  { color: '#2B6CB0' },
  navLabel:       { fontSize: 12, letterSpacing: 1, color: '#6B7A8F', fontWeight: '500' },
  navLabelActive: { color: '#1a2744', fontWeight: '700' },
  activeBar: {
    position:        'absolute',
    right:           0,
    top:             8,
    bottom:          8,
    width:           3,
    backgroundColor: '#2B6CB0',
    borderRadius:    2,
  },

  // ── Logout section ──
  logoutSection: {
    paddingBottom: Platform.select({ ios: 24, android: 16, default: 16 }),
  },
  logoutDivider: {
    height:           1,
    backgroundColor:  '#E8ECF0',
    marginHorizontal: 16,
    marginBottom:     12,
  },
  logoutBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    marginHorizontal:  12,
    paddingVertical:   12,
    paddingHorizontal: 14,
    borderRadius:      10,
    backgroundColor:   '#fff5f5',
    borderWidth:       1,
    borderColor:       '#ffe4e4',
  },
  logoutIconBox: {
    width:           34,
    height:          34,
    borderRadius:    8,
    backgroundColor: '#ffe4e4',
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     12,
  },
  logoutIconText: { fontSize: 16, color: '#ef4444' },
  logoutLabel: {
    fontSize:      12,
    fontWeight:    '600',
    color:         '#ef4444',
    letterSpacing: 0.8,
  },
});