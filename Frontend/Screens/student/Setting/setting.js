// ApplicationSettings.js
// ─────────────────────────────────────────────────────────────────────────────
// Application Settings page — React Native (iOS / Android / Web)
// Matches the screenshot design exactly.
// No sidebar — drop this inside your existing layout's main content area.
//
// Dependencies:
//   • react-native / react-native-web
//   • react-native-svg  →  npx expo install react-native-svg
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  Switch,
  Alert,
} from "react-native";
import Svg, {
  Path, Circle, Line, Rect, Polyline, G,
} from "react-native-svg";

// ─── Responsive ──────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");
const IS_MOBILE = SCREEN_W < 768;

// ─── Theme ───────────────────────────────────────────────────────────────────

const T = {
  purple:        "#5b4fcf",
  purpleLight:   "#f0eeff",
  purpleMid:     "#7c6cf0",
  purpleDark:    "#3d34a0",
  purpleBg:      "#ede9fe",
  gray:          "#6b7280",
  grayLight:     "#9ca3af",
  grayBorder:    "#e5e7eb",
  grayBg:        "#f3f4f6",
  grayIcon:      "#d1d5db",
  ink:           "#111827",
  subtext:       "#6b7280",
  white:         "#ffffff",
  pageBg:        "#f9fafb",
  red:           "#dc2626",
  redLight:      "#fef2f2",
  green:         "#16a34a",
  greenLight:    "#f0fdf4",
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const BellIcon = ({ color = T.purple, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const HistoryIcon = ({ color = T.gray, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 3v5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 7v5l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MonitorIcon = ({ color = T.gray, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="3" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
    <Line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const PhoneIcon = ({ color = T.gray, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="2" stroke={color} strokeWidth="2" />
    <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const TabletIcon = ({ color = T.gray, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
    <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const LockIcon = ({ color = T.white, size = 15 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ChevronRight = ({ color = T.grayLight, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldCheckIcon = ({ color = T.purple, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Custom Toggle Switch (purple when on, gray when off) ─────────────────────

const ToggleSwitch = ({ value, onValueChange }) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    trackColor={{ false: T.grayIcon, true: T.purple }}
    thumbColor={T.white}
    ios_backgroundColor={T.grayIcon}
    style={Platform.OS === "web" ? { transform: [{ scale: 1.1 }] } : {}}
  />
);

// ─── Section wrapper ──────────────────────────────────────────────────────────

const SectionCard = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ─── Section icon circle ──────────────────────────────────────────────────────

const IconCircle = ({ children, bg = T.purpleLight }) => (
  <View style={[styles.iconCircle, { backgroundColor: bg }]}>
    {children}
  </View>
);

// ─── Divider ──────────────────────────────────────────────────────────────────

const Divider = () => <View style={styles.divider} />;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApplicationSettings() {
  // Notification toggles
  const [emailNotif, setEmailNotif]   = useState(true);
  const [pushNotif,  setPushNotif]    = useState(false);
  const [smsNotif,   setSmsNotif]     = useState(true);

  const handleRevokeAll = () =>
    Alert.alert("Revoke All", "All other sessions will be logged out.");
  const handleEnable2FA = () =>
    Alert.alert("2FA", "Two-factor authentication setup flow.");
  const handleDataVisibility = () =>
    Alert.alert("Data Visibility", "Manage data visibility settings.");
  const handleThirdParty = () =>
    Alert.alert("Third-party Apps", "Manage connected apps.");

  // ── Login history data ──────────────────────────────────────────────────
  const sessions = [
    {
      DeviceIcon: MonitorIcon,
      device:     "Chrome on MacOS",
      location:   "San Francisco, CA • 192.168.1.1",
      status:     "Current Session",
      time:       "Just now",
      isCurrent:  true,
    },
    {
      DeviceIcon: PhoneIcon,
      device:     "iOS App on iPhone 15 Pro",
      location:   "San Francisco, CA • 172.16.0.45",
      status:     "Inactive",
      time:       "2 hours ago",
      isCurrent:  false,
    },
    {
      DeviceIcon: TabletIcon,
      device:     "Safari on iPadOS",
      location:   "London, UK • 10.0.0.8",
      status:     "Inactive",
      time:       "Yesterday, 4:15 PM",
      isCurrent:  false,
    },
  ];

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Page heading ── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Application Settings</Text>
        <Text style={styles.pageSubtitle}>
          Manage your workspace preferences, security protocols, and account connectivity.
        </Text>
      </View>

      {/* ── Two-column layout ── */}
      <View style={[styles.bodyRow, IS_MOBILE && { flexDirection: "column" }]}>

        {/* ════ LEFT COLUMN ════ */}
        <View style={[styles.leftCol, IS_MOBILE && { width: "100%" }]}>

          {/* ── Notification Preferences ── */}
          <SectionCard>
            {/* Header */}
            <View style={styles.sectionHeader}>
              <IconCircle>
                <BellIcon color={T.purple} size={20} />
              </IconCircle>
              <Text style={styles.sectionTitle}>Notification Preferences</Text>
            </View>

            <Divider />

            {/* Email Notifications */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Email Notifications</Text>
                <Text style={styles.toggleSub}>Receive weekly reports and system updates</Text>
              </View>
              <ToggleSwitch value={emailNotif} onValueChange={setEmailNotif} />
            </View>

            <Divider />

            {/* Push Notifications */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Push Notifications</Text>
                <Text style={styles.toggleSub}>Immediate alerts for course deadlines and grades</Text>
              </View>
              <ToggleSwitch value={pushNotif} onValueChange={setPushNotif} />
            </View>

            <Divider />

            {/* Mobile SMS Alerts */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Mobile SMS Alerts</Text>
                <Text style={styles.toggleSub}>Critical security alerts sent to your phone</Text>
              </View>
              <ToggleSwitch value={smsNotif} onValueChange={setSmsNotif} />
            </View>
          </SectionCard>

          {/* ── Login History ── */}
          <SectionCard style={{ marginTop: 20 }}>
            {/* Header */}
            <View style={styles.sectionHeader}>
              <IconCircle bg={T.grayBg}>
                <HistoryIcon color={T.gray} size={20} />
              </IconCircle>
              <Text style={styles.sectionTitle}>Login History</Text>
              <TouchableOpacity
                style={{ marginLeft: "auto" }}
                activeOpacity={0.7}
                onPress={handleRevokeAll}
                accessibilityLabel="Revoke all sessions"
                accessibilityRole="button"
              >
                <Text style={styles.revokeText}>Revoke All</Text>
              </TouchableOpacity>
            </View>

            <Divider />

            {sessions.map((s, i) => (
              <View key={s.device}>
                <View style={styles.sessionRow}>
                  {/* Device icon box */}
                  <View style={styles.deviceIconBox}>
                    <s.DeviceIcon color={T.gray} size={18} />
                  </View>

                  {/* Device info */}
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDevice}>{s.device}</Text>
                    <Text style={styles.sessionLocation}>{s.location}</Text>
                  </View>

                  {/* Status + time */}
                  <View style={styles.sessionStatus}>
                    <Text style={[
                      styles.sessionStatusText,
                      s.isCurrent ? { color: T.purple } : { color: T.grayLight },
                    ]}>
                      {s.status}
                    </Text>
                    <Text style={styles.sessionTime}>{s.time}</Text>
                  </View>
                </View>
                {i < sessions.length - 1 && <Divider />}
              </View>
            ))}
          </SectionCard>

        </View>

        {/* ════ RIGHT COLUMN ════ */}
        <View style={[styles.rightCol, IS_MOBILE && { width: "100%", marginTop: 20 }]}>

          {/* ── Two-Factor Authentication ── */}
          <View style={styles.twoFACard}>
            <Text style={styles.twoFATitle}>Two-Factor{"\n"}Authentication</Text>
            <Text style={styles.twoFASub}>
              Add an extra layer of security to your account by requiring a code from your phone.
            </Text>
            <TouchableOpacity
              style={styles.enable2FABtn}
              activeOpacity={0.85}
              onPress={handleEnable2FA}
              accessibilityLabel="Enable 2FA"
              accessibilityRole="button"
            >
              <LockIcon color={T.purple} size={14} />
              <Text style={styles.enable2FAText}>  Enable 2FA</Text>
            </TouchableOpacity>
          </View>

          {/* ── Privacy Shortcuts ── */}
          <SectionCard style={{ marginTop: 16 }}>
            <Text style={styles.privacyTitle}>Privacy Shortcuts</Text>

            <TouchableOpacity
              style={styles.privacyRow}
              activeOpacity={0.7}
              onPress={handleDataVisibility}
              accessibilityLabel="Data Visibility"
              accessibilityRole="button"
            >
              <Text style={styles.privacyRowText}>Data Visibility</Text>
              <ChevronRight />
            </TouchableOpacity>

            <View style={styles.privacyDivider} />

            <TouchableOpacity
              style={styles.privacyRow}
              activeOpacity={0.7}
              onPress={handleThirdParty}
              accessibilityLabel="Third-party Apps"
              accessibilityRole="button"
            >
              <Text style={styles.privacyRowText}>Third-party Apps</Text>
              <ChevronRight />
            </TouchableOpacity>
          </SectionCard>

          {/* ── Privacy Verified banner ── */}
          <View style={[styles.privacyBanner, { marginTop: 16 }]}>
            <View style={styles.privacyBannerIcon}>
              <ShieldCheckIcon color={T.purple} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyBannerTitle}>Privacy Verified</Text>
              <Text style={styles.privacyBannerSub}>
                Your data is encrypted with AES-256 standards.
              </Text>
            </View>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardShadow = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
  android: { elevation: 2 },
  web:     { boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
});

const styles = StyleSheet.create({

  page: {
    flex:            1,
    backgroundColor: T.pageBg,
  },
  pageContent: {
    padding:       IS_MOBILE ? 16 : 32,
    paddingBottom: 48,
  },

  // ── Page header ───────────────────────────────────────────────────────────
  pageHeader: {
    marginBottom: 28,
  },
  pageTitle: {
    fontSize:      IS_MOBILE ? 26 : 36,
    fontWeight:    "800",
    color:         T.ink,
    letterSpacing: -0.6,
    marginBottom:  8,
    ...Platform.select({
      ios:     { fontFamily: "Georgia" },
      android: { fontFamily: "serif" },
      web:     { fontFamily: "'Georgia', serif" },
    }),
  },
  pageSubtitle: {
    fontSize:  14,
    color:     T.subtext,
    lineHeight: 22,
    maxWidth:  560,
  },

  // ── Body layout ──────────────────────────────────────────────────────────
  bodyRow: {
    flexDirection: "row",
    gap:           20,
    alignItems:    "flex-start",
  },
  leftCol: {
    flex: 1,
  },
  rightCol: {
    width:     IS_MOBILE ? "100%" : 270,
    flexShrink: 0,
  },

  // ── Generic card ─────────────────────────────────────────────────────────
  card: {
    backgroundColor: T.white,
    borderRadius:    16,
    paddingVertical: 6,
    borderWidth:     1,
    borderColor:     T.grayBorder,
    ...cardShadow,
  },

  // ── Section header row ────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems:    "center",
    paddingHorizontal: 20,
    paddingVertical:   16,
    gap:           12,
  },
  iconCircle: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: T.purpleLight,
    alignItems:      "center",
    justifyContent:  "center",
  },
  sectionTitle: {
    fontSize:   16,
    fontWeight: "700",
    color:      T.ink,
  },
  revokeText: {
    fontSize:   13,
    fontWeight: "600",
    color:      T.purple,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height:          1,
    backgroundColor: T.grayBorder,
    marginHorizontal: 0,
  },

  // ── Toggle row ────────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingHorizontal: 20,
    paddingVertical:   18,
  },
  toggleInfo: {
    flex:      1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize:   14,
    fontWeight: "600",
    color:      T.ink,
    marginBottom: 3,
  },
  toggleSub: {
    fontSize:  12,
    color:     T.subtext,
    lineHeight: 18,
  },

  // ── Session row ───────────────────────────────────────────────────────────
  sessionRow: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: 20,
    paddingVertical:   16,
    gap:               14,
  },
  deviceIconBox: {
    width:           38,
    height:          38,
    borderRadius:    10,
    backgroundColor: T.grayBg,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize:   14,
    fontWeight: "600",
    color:      T.ink,
    marginBottom: 2,
  },
  sessionLocation: {
    fontSize: 12,
    color:    T.grayLight,
  },
  sessionStatus: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  sessionStatusText: {
    fontSize:   12,
    fontWeight: "600",
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 11,
    color:    T.grayLight,
  },

  // ── Two-FA card ───────────────────────────────────────────────────────────
  twoFACard: {
    backgroundColor: T.purple,
    borderRadius:    18,
    padding:         22,
    overflow:        "hidden",
    ...Platform.select({
      ios:     { shadowColor: T.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
      android: { elevation: 8 },
      web:     { boxShadow: "0 6px 24px rgba(91,79,207,0.38)" },
    }),
  },
  twoFATitle: {
    fontSize:   20,
    fontWeight: "800",
    color:      T.white,
    lineHeight: 28,
    marginBottom: 10,
  },
  twoFASub: {
    fontSize:   13,
    color:      "rgba(255,255,255,0.78)",
    lineHeight: 20,
    marginBottom: 20,
  },
  enable2FABtn: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "center",
    backgroundColor:   T.white,
    borderRadius:      30,
    paddingVertical:   13,
    paddingHorizontal: 24,
    alignSelf:         "stretch",
  },
  enable2FAText: {
    fontSize:   14,
    fontWeight: "700",
    color:      T.purple,
  },

  // ── Privacy shortcuts ─────────────────────────────────────────────────────
  privacyTitle: {
    fontSize:          15,
    fontWeight:        "700",
    color:             T.ink,
    paddingHorizontal: 20,
    paddingTop:        18,
    paddingBottom:     14,
  },
  privacyRow: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingHorizontal: 20,
    paddingVertical:   14,
  },
  privacyRowText: {
    fontSize:   14,
    fontWeight: "500",
    color:      T.ink,
  },
  privacyDivider: {
    height:           1,
    backgroundColor:  T.grayBorder,
    marginHorizontal: 20,
  },

  // Privacy verified banner
  privacyBanner: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             14,
    backgroundColor: T.purpleLight,
    borderRadius:    14,
    padding:         16,
    borderWidth:     1,
    borderColor:     T.purpleBg,
  },
  privacyBannerIcon: {
    width:           46,
    height:          46,
    borderRadius:    12,
    backgroundColor: T.white,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
    borderWidth:     1,
    borderColor:     T.purpleBg,
  },
  privacyBannerTitle: {
    fontSize:   14,
    fontWeight: "700",
    color:      T.ink,
    marginBottom: 3,
  },
  privacyBannerSub: {
    fontSize:  12,
    color:     T.subtext,
    lineHeight: 18,
  },
});