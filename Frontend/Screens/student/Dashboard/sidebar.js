// Sidebar.js
import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  Modal,
  Animated,
} from "react-native";
import Svg, { Rect, Path, Line, Circle } from "react-native-svg";
import Dashboard      from "./Dashboardpage";
import Attendance     from "../Attendance/Attendance";
import Timetable      from "../Timetable/timetable";
import Ranking        from "../Ranking/score";
import Fees           from "../Fees/fees";
import Studymaterials from "../Studymaterials/studymaterial";
import Profile        from "../Profile/profile";
import Feedback       from "../Feedback/feedback";
import Setting        from "../Setting/setting";

// ─── Constants ───────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH = 240;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_MOBILE = SCREEN_WIDTH <= 768;

// ─── Theme ───────────────────────────────────────────────────────────────────

const T = {
  purple:      "#5b4fcf",
  purpleLight: "#f0eeff",
  gray:        "#6b7280",
  grayLight:   "#9ca3af",
  border:      "#ede9fe",
  borderSoft:  "#f3f0ff",
  ink:         "#1a1a2e",
  white:       "#ffffff",
  overlay:     "rgba(0,0,0,0.45)",
  red:         "#ef4444",
  redLight:    "#fff5f5",
  redBorder:   "#ffe4e4",
  redIcon:     "#ffe4e4",
  subText:     "#6e6e8a",
  cardBg:      "#f9f9ff",
};

// ─── Icons ───────────────────────────────────────────────────────────────────

const HamburgerIcon = ({ color = T.purple }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Line x1="3" y1="6"  x2="21" y2="6"  stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

const CloseIcon = ({ color = T.gray }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6"  x2="6"  y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Line x1="6"  y1="6"  x2="18" y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

const LogoutIcon = ({ color = T.red }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M16 17l5-5-5-5"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    <Line
      x1="21" y1="12" x2="9" y2="12"
      stroke={color} strokeWidth="2" strokeLinecap="round"
    />
  </Svg>
);

const LogoGrid = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="3"  y="3"  width="8" height="8" rx="1.5" fill="white" />
    <Rect x="13" y="3"  width="8" height="8" rx="1.5" fill="white" opacity="0.6" />
    <Rect x="3"  y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.6" />
    <Rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.3" />
  </Svg>
);

const NavIcons = {
  Dashboard:  ({ c }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="3"  y="3"  width="7" height="7" rx="1" fill={c} />
      <Rect x="14" y="3"  width="7" height="7" rx="1" fill={c} opacity="0.5" />
      <Rect x="3"  y="14" width="7" height="7" rx="1" fill={c} opacity="0.5" />
      <Rect x="14" y="14" width="7" height="7" rx="1" fill={c} opacity="0.5" />
    </Svg>
  ),
  Attendance: ({ c }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth="2" />
      <Line x1="16" y1="2"  x2="16" y2="6"  stroke={c} strokeWidth="2" />
      <Line x1="8"  y1="2"  x2="8"  y2="6"  stroke={c} strokeWidth="2" />
      <Line x1="3"  y1="10" x2="21" y2="10" stroke={c} strokeWidth="2" />
    </Svg>
  ),
  Timetable:  ({ c }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth="2" />
      <Line x1="16" y1="2"  x2="16" y2="6"  stroke={c} strokeWidth="2" />
      <Line x1="8"  y1="2"  x2="8"  y2="6"  stroke={c} strokeWidth="2" />
      <Line x1="3"  y1="10" x2="21" y2="10" stroke={c} strokeWidth="2" />
      <Line x1="9"  y1="16" x2="15" y2="16" stroke={c} strokeWidth="2" />
    </Svg>
  ),
  Rankings:   ({ c }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"    stroke={c} strokeWidth="2" />
      <Path d="M22 9h-2a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"  stroke={c} strokeWidth="2" />
      <Path d="M12 3a4 4 0 0 1 4 4v14H8V7a4 4 0 0 1 4-4z" stroke={c} strokeWidth="2" />
    </Svg>
  ),
  Fees:       ({ c }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={c} strokeWidth="2" />
      <Line x1="2" y1="10" x2="22" y2="10" stroke={c} strokeWidth="2" />
    </Svg>
  ),
  Study:      ({ c }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"                                 stroke={c} strokeWidth="2" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={c} strokeWidth="2" />
    </Svg>
  ),
  Profile:    ({ c }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={c} strokeWidth="2" />
      <Circle cx="12" cy="7" r="4" stroke={c} strokeWidth="2" />
    </Svg>
  ),
  Feedback:   ({ c }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={c} strokeWidth="2" />
    </Svg>
  ),
  Settings:   ({ c }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
           a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
           A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
           l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
           A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
           l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
           a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
           l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
           a1.65 1.65 0 0 0-1.51 1z"
        stroke={c} strokeWidth="2"
      />
    </Svg>
  ),
};

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",      Icon: NavIcons.Dashboard  },
  { id: "attendance", label: "Attendance",     Icon: NavIcons.Attendance },
  { id: "timetable",  label: "Timetable",      Icon: NavIcons.Timetable  },
  { id: "rankings",   label: "Rankings",       Icon: NavIcons.Rankings   },
  { id: "fees",       label: "Fees",           Icon: NavIcons.Fees       },
  { id: "study",      label: "Study Material", Icon: NavIcons.Study      },
  { id: "profile",    label: "Profile",        Icon: NavIcons.Profile    },
  { id: "feedback",   label: "Feedback",       Icon: NavIcons.Feedback   },
  { id: "settings",   label: "Settings",       Icon: NavIcons.Settings   },
];

// ─── Logout Confirmation Modal ────────────────────────────────────────────────

const LogoutConfirmModal = ({ visible, onConfirm, onCancel }) => {
  const scaleAnim   = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue:         1,
          tension:         72,
          friction:        10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue:         1,
          duration:        210,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue:         0.88,
          duration:        180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue:         0,
          duration:        180,
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
      {/* Dim backdrop — tap outside to cancel */}
      <TouchableOpacity
        style={modalStyles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
        accessibilityLabel="Cancel logout"
      />

      {/* Centred card */}
      <View style={modalStyles.centreWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            modalStyles.card,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Icon badge */}
          <View style={modalStyles.iconBadge}>
            <LogoutIcon color={T.red} />
          </View>

          {/* Title */}
          <Text style={modalStyles.title}>Confirm Logout</Text>

          {/* Message */}
          <Text style={modalStyles.message}>
            Are you sure you want to log out of your account?
          </Text>

          {/* Thin divider */}
          <View style={modalStyles.divider} />

          {/* Action buttons */}
          <View style={modalStyles.btnRow}>

            {/* Cancel */}
            <TouchableOpacity
              style={[modalStyles.btn, modalStyles.cancelBtn]}
              activeOpacity={0.75}
              onPress={onCancel}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            {/* Confirm logout */}
            <TouchableOpacity
              style={[modalStyles.btn, modalStyles.confirmBtn]}
              activeOpacity={0.75}
              onPress={onConfirm}
              accessibilityLabel="Confirm logout"
              accessibilityRole="button"
            >
              <Text style={modalStyles.confirmBtnText}>Logout</Text>
            </TouchableOpacity>

          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 15, 35, 0.48)",
  },
  centreWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     "center",
    justifyContent: "center",
    pointerEvents:  "box-none",
  },
  card: {
    width:             Math.min(SCREEN_WIDTH - 48, 330),
    backgroundColor:   T.white,
    borderRadius:      20,
    paddingTop:        28,
    paddingBottom:     24,
    paddingHorizontal: 24,
    alignItems:        "center",
    ...Platform.select({
      ios:     { shadowColor: "#1a1a2e", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 24 },
      android: { elevation: 16 },
      web:     { boxShadow: "0 8px 40px rgba(26,26,46,0.13)" },
    }),
  },

  // Logout icon circle
  iconBadge: {
    width:           56,
    height:          56,
    borderRadius:    16,
    backgroundColor: T.redLight,
    borderWidth:     1.5,
    borderColor:     T.redBorder,
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    16,
  },

  title: {
    fontSize:      17,
    fontWeight:    "700",
    color:         T.ink,
    letterSpacing: -0.4,
    marginBottom:  8,
    ...Platform.select({ web: { fontFamily: "'DM Sans', sans-serif" } }),
  },
  message: {
    fontSize:     13.5,
    color:        T.subText,
    textAlign:    "center",
    lineHeight:   20,
    fontWeight:   "400",
    marginBottom: 20,
    ...Platform.select({ web: { fontFamily: "'DM Sans', sans-serif" } }),
  },

  divider: {
    width:           "100%",
    height:          1,
    backgroundColor: T.borderSoft,
    marginBottom:    20,
  },

  btnRow: {
    flexDirection: "row",
    gap:           10,
    width:         "100%",
  },
  btn: {
    flex:            1,
    paddingVertical: 13,
    borderRadius:    12,
    alignItems:      "center",
    justifyContent:  "center",
  },

  // Cancel — soft neutral
  cancelBtn: {
    backgroundColor: T.cardBg,
    borderWidth:     1,
    borderColor:     T.border,
  },
  cancelBtnText: {
    fontSize:   14,
    fontWeight: "600",
    color:      T.ink,
    ...Platform.select({ web: { fontFamily: "'DM Sans', sans-serif" } }),
  },

  // Confirm — solid red
  confirmBtn: {
    backgroundColor: T.red,
    borderWidth:     1,
    borderColor:     "#dc2626",
  },
  confirmBtnText: {
    fontSize:   14,
    fontWeight: "700",
    color:      T.white,
    ...Platform.select({ web: { fontFamily: "'DM Sans', sans-serif" } }),
  },
});

// ─── Sidebar panel ────────────────────────────────────────────────────────────

const SidebarPanel = ({ activeId, onItemPress, onClose, onLogout, isMobile }) => (
  <View style={styles.sidebarPanel}>

    {/* Logo row */}
    <View style={styles.logoRow}>
      <View style={styles.logoBox}><LogoGrid /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.logoTitle}>UniVerse</Text>
        <Text style={styles.logoSub}>STUDENT PORTAL</Text>
      </View>
      {isMobile && (
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          style={styles.closeBtn}
          accessibilityLabel="Close menu"
          accessibilityRole="button"
        >
          <CloseIcon color={T.gray} />
        </TouchableOpacity>
      )}
    </View>

    {/* Nav items */}
    <ScrollView
      style={styles.navScroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 12 }}
    >
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = activeId === id;
        return (
          <TouchableOpacity
            key={id}
            activeOpacity={0.7}
            onPress={() => onItemPress(id)}
            style={[styles.navItem, active && styles.navItemActive]}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
          >
            <View style={styles.iconWrap}>
              <Icon c={active ? T.purple : T.gray} />
            </View>
            <Text
              style={[styles.navLabel, active && styles.navLabelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>

    {/* Logout button */}
    <View style={styles.logoutSection}>
      <View style={styles.logoutDivider} />
      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.75}
        onPress={onLogout}           // ← fires handleLogoutPress in parent
        accessibilityLabel="Logout"
        accessibilityRole="button"
      >
        <View style={styles.logoutIconBox}>
          <LogoutIcon color={T.red} />
        </View>
        <Text style={styles.logoutLabel}>Logout</Text>
      </TouchableOpacity>
    </View>

  </View>
);

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Sidebar({ onNavigate, navigation, route }) {
  const [activeId,          setActiveId]          = useState("dashboard");
  const [modalVisible,      setModalVisible]      = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);   // ← NEW

  const slideX   = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const loggedInStudent = useMemo(() => route?.params?.student || null, [route?.params?.student]);
  const [currentStudent, setCurrentStudent] = useState(loggedInStudent);

  useEffect(() => {
    setCurrentStudent(loggedInStudent || null);
  }, [loggedInStudent]);

  // ── Drawer open ─────────────────────────────────────────────────────────
  const openDrawer = () => {
    setModalVisible(true);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 270, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 270, useNativeDriver: true }),
      ]).start();
    }, 10);
  };

  // ── Drawer close ────────────────────────────────────────────────────────
  const closeDrawer = (afterClose) => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: -SIDEBAR_WIDTH, duration: 230, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 230, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      afterClose?.();
    });
  };

  const handleNavPress = (id) => {
    setActiveId(id);
    onNavigate?.(id);
    if (IS_MOBILE) closeDrawer();
  };

  // ── Step 1 — sidebar logout button pressed → show confirmation ──────────
  const handleLogoutPress = () => {
    if (IS_MOBILE) {
      // Close drawer first so two overlapping modals don't stack
      closeDrawer(() => setLogoutModalVisible(true));
    } else {
      setLogoutModalVisible(true);
    }
  };

  // ── Step 2a — user confirmed → navigate to Login ────────────────────────
  const handleLogoutConfirm = () => {
    setLogoutModalVisible(false);
    if (navigation) {
      // Reset the stack so back-button can't return to the portal
      navigation.reset({
        index:  0,
        routes: [{ name: "Login" }],
      });
    } else {
      // Fallback — wire up your own auth/navigation logic here
      console.log("Logout confirmed — navigate to Login screen");
    }
  };

  // ── Step 2b — user cancelled → just close modal ─────────────────────────
  const handleLogoutCancel = () => setLogoutModalVisible(false);

  const handleStudentUpdated = (updatedStudent) => {
    setCurrentStudent(updatedStudent || null);
    navigation?.setParams?.({ student: updatedStudent || null });
  };

  const renderScreen = () => {
    switch (activeId) {
      case "study":      return <Studymaterials />;
      case "fees":       return <Fees />;
      case "rankings":   return <Ranking />;
      case "timetable":  return <Timetable student={currentStudent} instituteId={route?.params?.instituteId} batchId={route?.params?.batchId} />;
      case "attendance": return <Attendance />;
      case "profile":    return <Profile student={currentStudent} onStudentUpdated={handleStudentUpdated} />;
      case "feedback":   return <Feedback />;
      case "settings":   return <Setting />;
      default:           return <Dashboard />;
    }
  };

  // ══════════════════════════════════════════════
  // MOBILE
  // ══════════════════════════════════════════════
  if (IS_MOBILE) {
    return (
      <View style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.mobileHeader}>
          <TouchableOpacity
            onPress={openDrawer}
            activeOpacity={0.7}
            style={styles.hamburgerBtn}
            accessibilityLabel="Open navigation menu"
            accessibilityRole="button"
          >
            <HamburgerIcon color={T.purple} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>UniVerse</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Page content */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {renderScreen()}
        </ScrollView>

        {/* Left-slide drawer */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => closeDrawer()}
        >
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fadeAnim }]}
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
            style={[styles.drawerContainer, { transform: [{ translateX: slideX }] }]}
          >
            <SidebarPanel
              activeId={activeId}
              onItemPress={handleNavPress}
              onClose={() => closeDrawer()}
              onLogout={handleLogoutPress}   // ← updated
              isMobile
            />
          </Animated.View>
        </Modal>

        {/* Logout confirmation modal — rendered outside the drawer modal */}
        <LogoutConfirmModal
          visible={logoutModalVisible}
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />

      </View>
    );
  }

  // ══════════════════════════════════════════════
  // DESKTOP — always-visible sidebar
  // ══════════════════════════════════════════════
  return (
    <View style={{ flex: 1, flexDirection: "row" }}>

      <SidebarPanel
        activeId={activeId}
        onItemPress={handleNavPress}
        onLogout={handleLogoutPress}   // ← updated
        isMobile={false}
      />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {renderScreen()}
      </ScrollView>

      {/* Logout confirmation modal */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  mobileHeader: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    backgroundColor:   T.white,
    paddingTop:        Platform.select({ ios: 52, android: 28, default: 16 }),
    paddingBottom:     12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    zIndex: 10,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 4 },
      web:     { boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
    }),
  },

  hamburgerBtn: {
    width:           44,
    height:          44,
    borderRadius:    12,
    backgroundColor: T.purpleLight,
    alignItems:      "center",
    justifyContent:  "center",
  },

  headerTitle: {
    fontSize:      17,
    fontWeight:    "700",
    color:         T.ink,
    letterSpacing: -0.3,
  },

  backdrop: {
    backgroundColor: T.overlay,
    zIndex: 1,
  },

  drawerContainer: {
    position: "absolute",
    top:      0,
    left:     0,
    bottom:   0,
    width:    SIDEBAR_WIDTH,
    zIndex:   2,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.18, shadowRadius: 16 },
      android: { elevation: 16 },
      web:     { boxShadow: "4px 0 24px rgba(0,0,0,0.15)" },
    }),
  },

  sidebarPanel: {
    flex:             1,
    backgroundColor:  T.white,
    paddingTop:       Platform.select({ ios: 52, android: 28, default: 24 }),
    paddingBottom:    20,
    borderRightWidth: 1,
    borderRightColor: T.border,
  },

  logoRow: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: 20,
    paddingBottom:     22,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  logoBox: {
    width:           36,
    height:          36,
    borderRadius:    10,
    backgroundColor: T.purple,
    alignItems:      "center",
    justifyContent:  "center",
    marginRight:     10,
  },
  logoTitle: {
    fontWeight:    "700",
    fontSize:      13,
    color:         T.ink,
    letterSpacing: -0.2,
    ...Platform.select({
      ios:     { fontFamily: "Georgia" },
      android: { fontFamily: "serif"   },
      web:     { fontFamily: "'DM Sans', Georgia, serif" },
    }),
  },
  logoSub: {
    fontSize:      9,
    fontWeight:    "600",
    color:         T.grayLight,
    letterSpacing: 0.9,
  },
  closeBtn: {
    width:           34,
    height:          34,
    borderRadius:    8,
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: T.borderSoft,
    marginLeft:      6,
  },

  navScroll: { flex: 1 },
  navItem: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingVertical:   11,
    paddingHorizontal: 20,
  },
  navItemActive: {
    backgroundColor:  T.purpleLight,
    borderRightWidth: 3,
    borderRightColor: T.purple,
  },
  iconWrap:       { marginRight: 12 },
  navLabel: {
    flex:       1,
    fontSize:   13.5,
    fontWeight: "500",
    color:      T.gray,
    ...Platform.select({ web: { fontFamily: "'DM Sans', sans-serif", userSelect: "none" } }),
  },
  navLabelActive: { color: T.purple, fontWeight: "700" },

  logoutSection:  { paddingBottom: 8 },
  logoutDivider: {
    height:           1,
    backgroundColor:  T.borderSoft,
    marginHorizontal: 16,
    marginBottom:     12,
  },
  logoutBtn: {
    flexDirection:     "row",
    alignItems:        "center",
    marginHorizontal:  12,
    paddingVertical:   11,
    paddingHorizontal: 12,
    borderRadius:      12,
    backgroundColor:   T.redLight,
    borderWidth:       1,
    borderColor:       T.redBorder,
  },
  logoutIconBox: {
    width:           34,
    height:          34,
    borderRadius:    9,
    backgroundColor: T.redIcon,
    alignItems:      "center",
    justifyContent:  "center",
    marginRight:     12,
  },
  logoutLabel: {
    fontSize:      13.5,
    fontWeight:    "600",
    color:         T.red,
    letterSpacing: 0.1,
    ...Platform.select({ web: { fontFamily: "'DM Sans', sans-serif", userSelect: "none" } }),
  },
});