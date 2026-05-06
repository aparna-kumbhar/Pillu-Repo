// AcademicDashboard.js
// React Native — Responsive Academic Admin Dashboard
// Works on mobile (portrait/landscape) and tablet/laptop (≥768px)
// All interactive elements use TouchableOpacity

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';

// ─── Responsive Breakpoint ──────────────────────────────────────
const { width: W } = Dimensions.get('window');
const IS_TABLET = W >= 768;

// ─── Design Tokens ─────────────────────────────────────────────
const T = {
  bg:           '#F4F6F9',
  white:        '#FFFFFF',
  primary:      '#1B3A32',
  primaryLight: '#EAF0EE',
  accent:       '#2D6A5A',
  accentPale:   '#D4EBE5',
  text:         '#111827',
  textMid:      '#374151',
  textSub:      '#6B7280',
  textHint:     '#9CA3AF',
  border:       '#E5E7EB',
  borderMid:    '#D1D5DB',
  success:      '#1baa62',
  successBg:    '#DCFCE7',
  warning:      '#B45309',
  warningBg:    '#FEF3C7',
  danger:       '#B91C1C',
  dangerBg:     '#FEE2E2',
  barActive:    '#2D6A5A',
  barInactive:  '#C9D8D5',
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24,
  rSm: 6, rMd: 10, rLg: 14,
};

// ─── Static Data ────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'performance', label: 'Performance',    icon: '▣' },
  { id: 'financials',  label: 'Financials',     icon: '◈' },
  { id: 'lecturers',   label: 'Lecturers',      icon: '◎' },
  { id: 'fee_status',  label: 'Fee Status',     icon: '↻' },
  { id: 'access',      label: 'Access Control', icon: '◉' },
  { id: 'curations',   label: 'Curations',      icon: '▤' },
];

const BAR_DATA = [
  { label: 'J', h: 52 }, { label: 'A', h: 65 }, { label: 'S', h: 70 },
  { label: 'O', h: 58 }, { label: 'N', h: 88, peak: true },
  { label: 'D', h: 92 }, { label: 'J', h: 78 },
  { label: 'F', h: 74 }, { label: 'M', h: 62 },
];

const STATS = [
  { label: 'ENROLLMENT',     value: '2,480' },
  { label: 'ACTIVE COURSES', value: '142'   },
  { label: 'AVG ATTENDANCE', value: '88.4%' },
  { label: 'RETENTION',      value: '94%'   },
];

const LECTURERS = [
  { name: 'Mathematics', icon: 'Σ', pct: 92, status: 'success' },
  { name: 'Physics',     icon: 'Δ', pct: 74, status: 'warning' },
  { name: 'Biology',     icon: 'β', pct: 45, status: 'danger'  },
];

const ACTIVITIES = [
  { title: 'New Faculty Onboarded',  sub: 'Dr. Sarah Vance · Dept. of Physics' },
  { title: 'Fee Notification Sent',  sub: 'Bulk action · 12 Students'          },
  { title: 'Curriculum Audit',       sub: 'Semester 2 · Review Complete'       },
];

const NOTIFICATIONS = [
  { id: 'N-1001', title: 'Outstanding Fee Alert', detail: '42 student accounts need urgent follow-up.', time: '5m ago', level: 'high' },
  { id: 'N-1002', title: 'Faculty Onboarding Approved', detail: 'Dr. Sarah Vance profile was verified successfully.', time: '22m ago', level: 'normal' },
  { id: 'N-1003', title: 'Access Control Update', detail: '3 new permission changes were applied in Access Management.', time: '1h ago', level: 'normal' },
  { id: 'N-1004', title: 'Low Attendance Warning', detail: 'Biology batch attendance dropped below 60%.', time: '2h ago', level: 'high' },
  { id: 'N-1005', title: 'Monthly Revenue Snapshot Ready', detail: 'Finance hub report is available for review.', time: 'Today', level: 'normal' },
];

// ═══════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Badge({ label }) {
  return (
    <View style={S.badge}>
      <Text style={S.badgeText}>{label}</Text>
    </View>
  );
}

function CardTitle({ title, subtitle }) {
  return (
    <View style={S.cardTitleBlock}>
      <Text style={S.cardTitleText}>{title}</Text>
      {subtitle ? <Text style={S.cardSubText}>{subtitle}</Text> : null}
    </View>
  );
}

function ProgressBar({ pct, status = 'success' }) {
  const fillColor =
    status === 'success' ? T.success :
    status === 'warning' ? T.warning : T.danger;
  return (
    <View style={S.progressTrack}>
      <View style={[S.progressFill, { width: `${pct}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

function BarChart() {
  const maxH = 96;
  return (
    <View style={S.barChart}>
      {BAR_DATA.map((b, i) => (
        <View key={i} style={S.barCol}>
          {b.peak
            ? <Text style={S.peakLabel}>Peak</Text>
            : <View style={{ height: 14 }} />}
          <View style={[S.bar, {
            height: (b.h / 100) * maxH,
            backgroundColor: b.peak ? T.barActive : T.barInactive,
          }]} />
          <Text style={S.barLabel}>{b.label}</Text>
        </View>
      ))}
    </View>
  );
}

function StatTile({ label, value }) {
  return (
    <View style={S.statTile}>
      <Text style={S.statLabel}>{label}</Text>
      <Text style={S.statValue}>{value}</Text>
    </View>
  );
}

function LecturerRow({ item }) {
  const color = item.status === 'success' ? T.success
    : item.status === 'warning' ? T.warning : T.danger;
  const bg = item.status === 'success' ? T.successBg
    : item.status === 'warning' ? T.warningBg : T.dangerBg;
  return (
    <View style={S.lecRow}>
      <View style={[S.lecIcon, { backgroundColor: bg }]}>
        <Text style={[S.lecIconText, { color }]}>{item.icon}</Text>
      </View>
      <View style={S.lecMid}>
        <Text style={S.lecName}>{item.name}</Text>
        <ProgressBar pct={item.pct} status={item.status} />
      </View>
      <Text style={[S.lecPct, { color }]}>{item.pct}%</Text>
    </View>
  );
}

function ActivityRow({ item }) {
  return (
    <View style={S.actRow}>
      <View style={S.actLine} />
      <View style={S.actText}>
        <Text style={S.actTitle}>{item.title}</Text>
        <Text style={S.actSub}>{item.sub}</Text>
      </View>
    </View>
  );
}

// ─── Sidebar Content ────────────────────────────────────────────
function SidebarContent({ active, onSelect }) {
  return (
    <View style={S.sidebarInner}>
      <View style={S.sidebarBrand}>
        <View style={S.brandMark} />
        <View>
          <Text style={S.brandName}>Admin Central</Text>
          <Text style={S.brandSub}>Academic Archives</Text>
        </View>
      </View>

      <View style={S.navList}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              style={[S.navItem, isActive && S.navItemActive]}
              onPress={() => onSelect(item.id)}
            >
              <Text style={[S.navIcon, isActive && S.navIconActive]}>{item.icon}</Text>
              <Text style={[S.navLabel, isActive && S.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={S.sidebarFooter}>
        <View style={S.userRow}>
          <View style={S.userAvatar}>
            <Text style={S.userAvatarText}>NE</Text>
          </View>
          <View>
            <Text style={S.userName}>New Entry</Text>
            <Text style={S.userRole}>Administrator</Text>
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.75} style={S.footLink}>
          <Text style={S.footLinkText}>? Support</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} style={S.footLink}>
          <Text style={[S.footLinkText, { color: T.danger }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════
export default function Maindashboard({
  onManageAssignmentsNavigate,
  onPerformanceFeedbackNavigate,
  onOpenDatabaseFor,
}) {
  const [activeNav,  setActiveNav]  = useState('performance');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleNavSelect = (id) => {
    setActiveNav(id);
    setDrawerOpen(false);
  };

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* ── Mobile Drawer ── */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={S.drawerOverlay}>
          <TouchableOpacity
            style={S.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)}
          />
          <View style={S.drawerPanel}>
            <SidebarContent active={activeNav} onSelect={handleNavSelect} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={notificationsOpen}
        animationType="slide"
        onRequestClose={() => setNotificationsOpen(false)}
      >
        <SafeAreaView style={S.notificationsPage}>
          <StatusBar barStyle="dark-content" backgroundColor={T.white} />

          <View style={S.notificationsHeader}>
            <View>
              <Text style={S.notificationsTitle}>All Notifications</Text>
              <Text style={S.notificationsSub}>Latest alerts and system messages</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.75}
              style={S.closeNotificationsBtn}
              onPress={() => setNotificationsOpen(false)}
            >
              <Text style={S.closeNotificationsTxt}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={S.notificationsScroll}
            contentContainerStyle={S.notificationsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {NOTIFICATIONS.map((item) => (
              <View key={item.id} style={S.notificationCard}>
                <View style={S.notificationTopRow}>
                  <View style={[S.notificationDot, item.level === 'high' && S.notificationDotHigh]} />
                  <Text style={S.notificationCardTitle}>{item.title}</Text>
                  <Text style={S.notificationTime}>{item.time}</Text>
                </View>
                <Text style={S.notificationDetail}>{item.detail}</Text>
                <Text style={S.notificationId}>{item.id}</Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <View style={S.root}>
        {/* ── Persistent Sidebar (tablet/laptop) ── */}
        {IS_TABLET && (
          <View style={S.sidebar}>
            <SidebarContent active={activeNav} onSelect={setActiveNav} />
          </View>
        )}

        {/* ── Main ── */}
        <View style={S.main}>

         
          {/* ── Scrollable Body ── */}
          <ScrollView
            style={S.scroll}
            contentContainerStyle={S.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* Page Header */}
            <View style={S.pageHeader}>
              <View>
                <Text style={S.pageTitle}>The Academy Intelligence</Text>
               
              </View>
              <View style={S.pageActions}>
              
              </View>
            </View>

            {/* ── Row 1: Performance + Finance ── */}
            <View style={[S.row, IS_TABLET && S.rowH]}>

              {/* Performance Card */}
              <View style={[S.card, IS_TABLET && S.flex1]}>
                <View style={S.cRow}>
                  <CardTitle
                    title="Institutional Performance"
                    subtitle="Aggregate growth vs target across all departments"
                  />
                  <Badge label="+12.4% MONTHLY" />
                </View>
                <BarChart />
                <View style={[S.statsGrid, IS_TABLET && S.statsGridH]}>
                  {STATS.map((s, i) => <StatTile key={i} {...s} />)}
                </View>
              </View>

              {/* Finance + Alerts column */}
              <View style={[S.col, IS_TABLET && { width: 252, flexShrink: 0 }]}>

                {/* Finance Hub */}
                <View style={S.card}>
                  <View style={S.cRow}>
                    <CardTitle title="Finances Hub" />
                    <TouchableOpacity activeOpacity={0.75} style={S.iconBtnSm}>
                      <Text style={S.iconBtnSmTxt}>◈</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={S.finLabel}>Total Revenue & Collection</Text>
                  <Text style={S.finAmt}>$124,500.00</Text>
                  <View style={S.finRow}>
                    <Text style={S.finCap}>Fee Collection Progress</Text>
                    <Text style={S.finCap}>
                      <Text style={{ color: T.accent, fontWeight: '700' }}>$98,000</Text>
                      {'  /  $124.5k'}
                    </Text>
                  </View>
                  <ProgressBar pct={78} status="success" />
                  <View style={S.outstandingBox}>
                    <Text style={S.outLabel}>Outstanding Balances</Text>
                    <Text style={S.outAmt}>$26,500</Text>
                  </View>
                </View>

                {/* Urgent Alerts */}
                <View style={S.card}>
                  <View style={S.cRow}>
                    <View style={S.alertDot}>
                      <Text style={S.alertDotTxt}>!</Text>
                    </View>
                    <Text style={S.alertTitle}>Urgent Fee Alerts</Text>
                  </View>
                  <Text style={S.alertBody}>
                    Immediate attention required for high-delinquency accounts.
                  </Text>
                  <View style={S.alertFoot}>
                    <View>
                      <Text style={S.alertCount}>42</Text>
                      <Text style={S.alertPending}>Pending</Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setNotificationsOpen(true)}
                    >
                      <Text style={S.alertLink}>View All{'\n'}Notifications</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            </View>

            {/* ── Row 2: Lecturers + Right Col ── */}
            <View style={[S.row, IS_TABLET && S.rowH]}>

              {/* Lecturer Allotment */}
              <View style={[S.card, IS_TABLET && S.flex1]}>
                <View style={S.cRow}>
                  <CardTitle title="Lecturer Allotment Registry" />
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={S.btnOutlineSm}
                    onPress={onManageAssignmentsNavigate}
                  >
                    <Text style={S.btnOutlineSmTxt}>✎ Manage Assignments</Text>
                  </TouchableOpacity>
                </View>
                {LECTURERS.map((l, i) => <LecturerRow key={i} item={l} />)}
              </View>

              {/* Right col */}
              <View style={[S.col, IS_TABLET && { width: 252, flexShrink: 0 }]}>

                {/* Faculty Score */}
                <View style={[S.card, S.scoreCard]}>
                  <Text style={S.scoreTag}>FACULTY SCORE</Text>
                  <Text style={S.scoreVal}>4.8</Text>
                  <Text style={S.scoreStars}>★★★★★</Text>
                  <View style={S.scoreStatsRow}>
                    <View style={S.scoreStat}>
                      <Text style={S.scoreStatV}>1.2k</Text>
                      <Text style={S.scoreStatL}>Reviews</Text>
                    </View>
                    <View style={S.scoreStat}>
                      <Text style={S.scoreStatV}>98%</Text>
                      <Text style={S.scoreStatL}>Satisfaction</Text>
                    </View>
                  </View>
                </View>

                {/* Performance Feedback */}
                <View style={S.card}>
                  <TouchableOpacity activeOpacity={0.8} onPress={onPerformanceFeedbackNavigate}>
                    <CardTitle
                      title="Performance Feedback"
                      subtitle="Aggregated student reviews from the last evaluation cycle across all 12 departments."
                    />
                  </TouchableOpacity>
                </View>

                {/* Access Management */}
                <View style={S.card}>
                  <CardTitle title="Access Management Console" />
                  <View style={S.accessRow}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={S.accessBtn}
                      onPress={() => onOpenDatabaseFor && onOpenDatabaseFor('teacher')}
                    >
                      <Text style={S.accessIcon}>+◎</Text>
                      <Text style={S.accessLabel}>ADD TEACHER</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={S.accessBtn}
                      onPress={() => onOpenDatabaseFor && onOpenDatabaseFor('student')}
                    >
                      <Text style={S.accessIcon}>+◎</Text>
                      <Text style={S.accessLabel}>ADD STUDENT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={S.accessBtn}
                      onPress={() => onOpenDatabaseFor && onOpenDatabaseFor('parent')}
                    >
                      <Text style={S.accessIcon}>+◎</Text>
                      <Text style={S.accessLabel}>ADD PARENT</Text>
                    </TouchableOpacity>
                   
                  </View>
                </View>

              </View>
            </View>

            {/* ── Row 3: Activity + Roadmap ── */}
            <View style={[S.row, IS_TABLET && S.rowH]}>

              {/* Recent Activity */}
              <View style={[S.card, IS_TABLET && { width: 230, flexShrink: 0 }]}>
                <Text style={S.sectionTag}>RECENT ACTIVITY</Text>
                {ACTIVITIES.map((a, i) => <ActivityRow key={i} item={a} />)}
              </View>

              {/* Academic Roadmap */}
              <View style={[S.card, S.roadmapCard, IS_TABLET && S.flex1]}>
                <View style={S.roadmapInner}>
                  <View style={S.flex1}>
                    <Text style={S.roadmapTitle}>Academic Roadmap 2024</Text>
                    <Text style={S.roadmapBody}>
                      Strategic objectives for the upcoming quarter include digital
                      transformation of library archives and expansion of hybrid
                      learning models.
                    </Text>
                  </View>
                  <View style={S.roadmapTarget}>
                    <Text style={S.roadmapTargetL}>TARGET{'\n'}COMPLETION</Text>
                    <Text style={S.roadmapQ}>Q3</Text>
                    <Text style={S.roadmapYear}>2024</Text>
                  </View>
                </View>
              </View>

            </View>

            {/* Footer */}
           

          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLESHEET
// ═══════════════════════════════════════════════════════════════
const S = StyleSheet.create({

  safe: { flex: 1, backgroundColor: T.bg },
  root: { flex: 1, flexDirection: 'row' },

  // Sidebar ─────────────────────────────────────────────────────
  sidebar: {
    width: 210,
    backgroundColor: T.white,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: T.borderMid,
  },
  sidebarInner: { flex: 1, paddingVertical: T.lg, justifyContent: 'space-between' },
  sidebarBrand: {
    flexDirection: 'row', alignItems: 'center',
    gap: T.sm, paddingHorizontal: T.lg, marginBottom: T.xl,
  },
  brandMark:  { width: 28, height: 28, borderRadius: 7, backgroundColor: T.primary },
  brandName:  { fontSize: 13, fontWeight: '700', color: T.text },
  brandSub:   { fontSize: 11, color: T.textSub },
  navList:    { flex: 1, paddingHorizontal: T.sm },
  navItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: T.md, paddingVertical: 10,
    borderRadius: T.rMd, marginBottom: 2, gap: T.sm,
  },
  navItemActive: { backgroundColor: T.primary },
  navIcon:       { fontSize: 14, color: T.textSub },
  navIconActive: { color: T.white },
  navLabel:      { fontSize: 13, fontWeight: '500', color: T.textSub },
  navLabelActive:{ color: T.white, fontWeight: '600' },
  sidebarFooter: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.border,
    paddingHorizontal: T.lg, paddingTop: T.md, gap: 4,
  },
  userRow:        { flexDirection: 'row', alignItems: 'center', gap: T.sm, marginBottom: T.sm },
  userAvatar:     { width: 32, height: 32, borderRadius: 16, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 11, fontWeight: '700', color: T.primary },
  userName:       { fontSize: 12, fontWeight: '600', color: T.text },
  userRole:       { fontSize: 11, color: T.textSub },
  footLink:       { paddingVertical: 5 },
  footLinkText:   { fontSize: 12, color: T.textSub },

  // Mobile Drawer ───────────────────────────────────────────────
  drawerOverlay:  { flex: 1, flexDirection: 'row' },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.38)' },
  drawerPanel: {
    width: 220, backgroundColor: T.white, paddingBottom: 24,
    shadowColor: '#000', shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 20,
  },

  // Main ────────────────────────────────────────────────────────
  main: { flex: 1, backgroundColor: T.bg },

  // Top Bar ─────────────────────────────────────────────────────
  topBar: {
    height: 54, backgroundColor: T.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: T.lg,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.borderMid,
  },
  topLeft:    { flexDirection: 'row', alignItems: 'center', gap: T.md, flex: 1 },
  topBarTitle:{ fontSize: IS_TABLET ? 15 : 13, fontWeight: '700', color: T.text },
  topRight:   { flexDirection: 'row', alignItems: 'center', gap: T.sm },
  hamburger:  { padding: 4, gap: 5 },
  hamLine:    { width: 22, height: 2, borderRadius: 2, backgroundColor: T.text },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: T.bg,
    borderRadius: T.rMd, paddingHorizontal: T.sm, height: 34, width: 180,
    gap: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: T.border,
  },
  searchIcon:  { fontSize: 16, color: T.textHint },
  searchInput: { flex: 1, fontSize: 12, color: T.text, padding: 0 },
  iconBtn:     { padding: 6 },
  iconBtnTxt:  { fontSize: 18 },
  iconBtnSm:   { padding: 4 },
  iconBtnSmTxt:{ fontSize: 16, color: T.textSub },
  adminChip:    { flexDirection: 'row', alignItems: 'center', gap: T.sm, marginLeft: 4 },
  adminAvatar:  { width: 30, height: 30, borderRadius: 15, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' },
  adminAvatarTxt:{ fontSize: 10, fontWeight: '700', color: T.primary },
  adminName:    { fontSize: 12, fontWeight: '600', color: T.text },
  adminSub:     { fontSize: 10, color: T.textSub },

  // Scroll ──────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { padding: T.lg, paddingBottom: 48, gap: T.md },

  // Page Header ─────────────────────────────────────────────────
  pageHeader:  { gap: T.md },
  pageTitle:   { fontSize: IS_TABLET ? 24 : 18, fontWeight: '800', color: T.text, letterSpacing: -0.4, marginBottom: 4 },
  pageDesc:    { fontSize: 13, color: T.textSub, lineHeight: 19 },
  pageActions: { flexDirection: 'row', gap: T.sm, flexWrap: 'wrap' },
  btnOutline: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: T.rMd,
    borderWidth: 1.5, borderColor: T.borderMid, backgroundColor: T.white,
  },
  btnOutlineTxt:  { fontSize: 13, fontWeight: '600', color: T.text },
  btnFill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: T.rMd, backgroundColor: T.primary,
  },
  btnFillTxt: { fontSize: 13, fontWeight: '600', color: T.white },
  btnOutlineSm: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: T.rSm, borderWidth: 1, borderColor: T.accent,
  },
  btnOutlineSmTxt: { fontSize: 11, fontWeight: '600', color: T.accent },

  // Layout ──────────────────────────────────────────────────────
  row:    { gap: T.md },
  rowH:   { flexDirection: 'row', alignItems: 'flex-start' },
  col:    { gap: T.md },
  flex1:  { flex: 1 },
  cRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: T.sm },

  // Card ────────────────────────────────────────────────────────
  card: {
    backgroundColor: T.white, borderRadius: T.rLg, padding: T.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: T.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1, gap: T.md,
  },
  cardTitleBlock: { flex: 1, gap: 3 },
  cardTitleText:  { fontSize: 14, fontWeight: '700', color: T.text },
  cardSubText:    { fontSize: 12, color: T.textSub, lineHeight: 17 },

  // Badge ───────────────────────────────────────────────────────
  badge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: T.accentPale },
  badgeText: { fontSize: 10, fontWeight: '700', color: T.accent, letterSpacing: 0.4 },

  // Bar Chart ───────────────────────────────────────────────────
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 5 },
  barCol:   { flex: 1, alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  bar:      { width: '100%', borderRadius: 4, minHeight: 6 },
  barLabel: { fontSize: 9, color: T.textHint, marginTop: 4 },
  peakLabel:{ fontSize: 9, color: T.accent, fontWeight: '700', position: 'absolute', top: 0 },

  // Stats ───────────────────────────────────────────────────────
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: T.md },
  statsGridH:   { flexWrap: 'nowrap' },
  statTile:     { flex: 1, minWidth: 64, gap: 3 },
  statLabel:    { fontSize: 9, fontWeight: '700', color: T.textSub, letterSpacing: 0.5 },
  statValue:    { fontSize: 18, fontWeight: '800', color: T.text },

  // Progress ────────────────────────────────────────────────────
  progressTrack: { height: 5, backgroundColor: T.border, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },

  // Finance ─────────────────────────────────────────────────────
  finLabel: { fontSize: 11, color: T.textSub },
  finAmt:   { fontSize: 22, fontWeight: '800', color: T.text },
  finRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  finCap:   { fontSize: 11, color: T.textSub },
  outstandingBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: T.warningBg, borderRadius: T.rSm, padding: T.sm,
  },
  outLabel: { fontSize: 12, color: T.textMid },
  outAmt:   { fontSize: 13, fontWeight: '700', color: T.warning },

  // Alert ───────────────────────────────────────────────────────
  alertDot: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: T.dangerBg, alignItems: 'center', justifyContent: 'center',
  },
  alertDotTxt:  { fontSize: 13, fontWeight: '900', color: T.danger },
  alertTitle:   { fontSize: 14, fontWeight: '700', color: T.text },
  alertBody:    { fontSize: 12, color: T.textSub, lineHeight: 17 },
  alertFoot:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  alertCount:   { fontSize: 30, fontWeight: '800', color: T.danger, lineHeight: 34 },
  alertPending: { fontSize: 13, fontWeight: '700', color: T.danger },
  alertLink:    { fontSize: 11, color: T.accent, fontWeight: '600', textDecorationLine: 'underline', textAlign: 'right' },

  // Lecturer ────────────────────────────────────────────────────
  lecRow: {
    flexDirection: 'row', alignItems: 'center', gap: T.md,
    paddingVertical: T.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.border,
  },
  lecIcon:     { width: 34, height: 34, borderRadius: T.rSm, alignItems: 'center', justifyContent: 'center' },
  lecIconText: { fontSize: 15, fontWeight: '700' },
  lecMid:      { flex: 1, gap: 5 },
  lecName:     { fontSize: 13, fontWeight: '600', color: T.text },
  lecPct:      { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  // Score Card ──────────────────────────────────────────────────
  scoreCard:     { alignItems: 'center', gap: 4 },
  scoreTag:      { fontSize: 10, fontWeight: '700', color: T.textSub, letterSpacing: 1 },
  scoreVal:      { fontSize: 44, fontWeight: '900', color: T.text, lineHeight: 48 },
  scoreStars:    { fontSize: 18, color: '#FBBF24' },
  scoreStatsRow: { flexDirection: 'row', gap: T.xl },
  scoreStat:     { alignItems: 'center' },
  scoreStatV:    { fontSize: 15, fontWeight: '700', color: T.text },
  scoreStatL:    { fontSize: 11, color: T.textSub },

  // Access ──────────────────────────────────────────────────────
  accessRow:    { flexDirection: 'row', gap: T.sm, flexWrap: 'wrap' },
  accessBtn: {
    flex: 1, minWidth: 70, alignItems: 'center',
    paddingVertical: 12, borderRadius: T.rMd,
    borderWidth: 1, borderColor: T.border, gap: 4,
  },
  accessBtnRed: { borderColor: T.dangerBg, backgroundColor: T.dangerBg },
  accessIcon:   { fontSize: 15, color: T.textMid },
  accessLabel:  { fontSize: 9, fontWeight: '700', color: T.textSub, letterSpacing: 0.4, textAlign: 'center' },

  // Activity ────────────────────────────────────────────────────
  sectionTag: { fontSize: 10, fontWeight: '700', color: T.textSub, letterSpacing: 1 },
  actRow:     { flexDirection: 'row', gap: T.md, alignItems: 'stretch', paddingVertical: 6 },
  actLine:    { width: 3, borderRadius: 2, backgroundColor: T.accent },
  actText:    { flex: 1, gap: 2 },
  actTitle:   { fontSize: 13, fontWeight: '600', color: T.text },
  actSub:     { fontSize: 11, color: T.textSub },

  // Roadmap ─────────────────────────────────────────────────────
  roadmapCard:   { backgroundColor: T.primaryLight },
  roadmapInner:  { flexDirection: 'row', gap: T.lg, alignItems: 'flex-start' },
  roadmapTitle:  { fontSize: 16, fontWeight: '800', color: T.primary, marginBottom: 8 },
  roadmapBody:   { fontSize: 12, color: T.textMid, lineHeight: 18 },
  roadmapTarget: { alignItems: 'flex-end', flexShrink: 0 },
  roadmapTargetL:{ fontSize: 9, fontWeight: '700', color: T.textSub, textAlign: 'right', letterSpacing: 0.4 },
  roadmapQ:      { fontSize: 28, fontWeight: '900', color: T.primary, textAlign: 'right' },
  roadmapYear:   { fontSize: 20, fontWeight: '900', color: T.primary, textAlign: 'right' },

  // Footer ──────────────────────────────────────────────────────
  footer: {
    paddingTop: T.lg, marginTop: T.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.border,
    flexDirection: IS_TABLET ? 'row' : 'column',
    flexWrap: 'wrap', gap: 6, justifyContent: 'space-between',
  },
  footerTxt: { fontSize: 11, color: T.textHint },

  // Notifications Page
  notificationsPage: {
    flex: 1,
    backgroundColor: T.bg,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.white,
    paddingHorizontal: T.lg,
    paddingVertical: T.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.borderMid,
  },
  notificationsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: T.text,
  },
  notificationsSub: {
    fontSize: 12,
    color: T.textSub,
    marginTop: 2,
  },
  closeNotificationsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: T.rMd,
    borderWidth: 1,
    borderColor: T.borderMid,
    backgroundColor: T.white,
  },
  closeNotificationsTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: T.text,
  },
  notificationsScroll: {
    flex: 1,
  },
  notificationsScrollContent: {
    padding: T.lg,
    gap: T.md,
    paddingBottom: 36,
  },
  notificationCard: {
    backgroundColor: T.white,
    borderRadius: T.rLg,
    padding: T.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.border,
    gap: T.sm,
  },
  notificationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.sm,
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.accent,
  },
  notificationDotHigh: {
    backgroundColor: T.danger,
  },
  notificationCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: T.text,
  },
  notificationTime: {
    fontSize: 11,
    color: T.textHint,
    fontWeight: '600',
  },
  notificationDetail: {
    fontSize: 12,
    color: T.textMid,
    lineHeight: 18,
  },
  notificationId: {
    fontSize: 10,
    color: T.textHint,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});