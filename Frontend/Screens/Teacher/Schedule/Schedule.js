import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  StatusBar,
  Platform,
} from 'react-native';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#1A56DB',
  primaryDark: '#1441A8',
  green: '#057A55',
  greenBg: '#DEF7EC',
  red: '#C81E1E',
  redBg: '#FDE8E8',
  orange: '#FF8000',
  orangeBg: '#FFF3CD',
  bg: '#F9FAFB',
  white: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  active: '#EEF2FF',
  activeBorder: '#1A56DB',
  sidebarBg: '#FFFFFF',
  navText: '#374151',
  now: '#1A56DB',
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const DAYS = [
  {
    date: 'OCT 14', day: 'MON', isToday: false,
    sessions: [
      { time: '09:00 AM', title: 'Quantum Physics', loc: 'L-Hall B', color: C.primary, light: '#EEF2FF', tag: null },
      { time: '10:30 AM', title: 'Office Hours', loc: '', color: C.textLight, light: '#F3F4F6', tag: null },
      { time: '01:00 PM', title: 'Relativity Intro', loc: 'Lab 4C', color: C.green, light: C.greenBg, tag: null },
    ],
  },
  {
    date: 'OCT 15', day: 'TUE', isToday: false,
    sessions: [
      { time: '10:00 AM', title: 'Particle Dynamics', loc: 'Room 102', color: C.primary, light: '#EEF2FF', tag: null },
      { time: '02:30 PM', title: 'Advanced Calculus', loc: 'L-Hall A', color: C.primary, light: '#EEF2FF', tag: null },
    ],
  },
  {
    date: 'OCT 16', day: 'WED', isToday: true,
    sessions: [
      { time: 'NOW', title: 'Quantum Physics', loc: 'L-Hall B', color: C.now, light: '#EEF2FF', tag: 'NOW' },
      { time: '03:00 PM', title: 'Faculty Meeting', loc: 'Boardroom', color: C.textMuted, light: '#F3F4F6', tag: null },
    ],
  },
  {
    date: 'OCT 17', day: 'THU', isToday: false,
    sessions: [
      { time: '09:00 AM', title: 'Modern Physics', loc: 'L-Hall B', color: C.primary, light: '#EEF2FF', tag: null },
    ],
  },
  {
    date: 'OCT 18', day: 'FRI', isToday: false,
    sessions: [
      { time: '11:00 AM', title: 'Lab Synthesis', loc: 'Main Lab', color: C.green, light: C.greenBg, tag: null },
      { time: '04:00 PM', title: 'Peer Review', loc: 'Library Annex', color: C.red, light: C.redBg, tag: null },
    ],
  },
];

const CHECKLIST = [
  { id: 1, done: true, label: "Review Bell's Theorem notes" },
  { id: 2, done: false, label: 'Upload Lab 4B safety PDF' },
  { id: 3, done: false, label: 'Sync grades with Portal' },
];

const PINS = [
  { title: 'Quantum Entanglement in Macroscopic Systems', source: 'Nature Physics · Oct 2023' },
  { title: 'Superposition Paradoxes for Undergrads', source: 'Academic Press · PDF' },
];

const NAV_ITEMS = ['Dashboard', 'Weekly Schedule', 'Student Rosters', 'Lesson Plans', 'Reports'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sidebar({ active, onSelect, isDesktop }) {
  return (
    <View style={[styles.sidebar, isDesktop ? styles.sidebarDesktop : styles.sidebarMobile]}>
      <View style={styles.sidebarProfile}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>DA</Text>
        </View>
        <View>
          <Text style={styles.profileName}>Dr. Aris</Text>
          <Text style={styles.profileRole}>Department Head</Text>
        </View>
      </View>

      {NAV_ITEMS.map((item) => (
        <TouchableOpacity
          key={item}
          style={[styles.navItem, active === item && styles.navItemActive]}
          onPress={() => onSelect(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.navDot, active === item && styles.navDotActive]} />
          <Text style={[styles.navText, active === item && styles.navTextActive]}>{item}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.sidebarSpacer} />

      <TouchableOpacity style={styles.createBtn} activeOpacity={0.85}>
        <Text style={styles.createBtnText}>＋  Create Lesson</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
        <Text style={styles.navText}>⚙  Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
        <Text style={styles.navText}>↪  Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function TopBar() {
  return (
    <View style={styles.topBar}>
      
      <View style={styles.topBarActions}>    
      </View>
    </View>
  );
}

function SpotlightCard({ onTakeAttendance }) {
  return (
    <View style={styles.spotlightCard}>
      <View style={styles.spotlightLeft}>
        <View style={styles.spotlightIcon}>
          <Text style={{ fontSize: 24 }}>⚗️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.spotlightTitle}>
            Advanced Quantum Physics
          </Text>
          <TouchableOpacity
            style={styles.attendanceBtn}
            activeOpacity={0.85}
            onPress={onTakeAttendance}
          >
            <Text style={styles.attendanceBtnText}>Take Attendance</Text>
          </TouchableOpacity>
          <View style={styles.spotlightMeta}>
           <Text style={styles.metaText}>  🕘 09:00 – 10:30 AM</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function WeekGrid({ isDesktop, days, isEditing, onSessionFieldChange }) {
  const [checklist, setChecklist] = useState(CHECKLIST);

  const toggleCheck = (id) =>
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  return (
    <View style={[styles.weekGridRow, !isDesktop && { flexDirection: 'column' }]}>
      {/* Calendar */}
      <View style={styles.calendarContainer}>
        {/* Tabs */}
        <View style={styles.tabRow}>
  <View style={[styles.tab, styles.tabActive]}>
    <Text style={[styles.tabText, styles.tabTextActive]}>
      Week View
    </Text>
  </View>
</View>

        {/* Days */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.daysRow}>
            {days.map((d, dayIndex) => (
              <View key={d.date} style={[styles.dayCol, d.isToday && styles.dayColToday]}>
                <Text style={[styles.dayDate, d.isToday && styles.dayDateToday]}>{d.date}</Text>
                <Text style={[styles.dayName, d.isToday && styles.dayNameToday]}>{d.day}</Text>
                {d.sessions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.sessionCard, { borderLeftColor: s.color, backgroundColor: s.light },
                      s.tag === 'NOW' && styles.sessionCardNow]}
                    activeOpacity={0.8}
                  >
                    {isEditing ? (
                      <View>
                        <TextInput
                          value={s.time}
                          onChangeText={(value) => onSessionFieldChange(dayIndex, i, 'time', value)}
                          style={styles.sessionInputTime}
                          placeholder="Time"
                          placeholderTextColor={C.textMuted}
                        />
                        <TextInput
                          value={s.title}
                          onChangeText={(value) => onSessionFieldChange(dayIndex, i, 'title', value)}
                          style={styles.sessionInputTitle}
                          placeholder="Session title"
                          placeholderTextColor={C.textMuted}
                        />
                        <TextInput
                          value={s.loc}
                          onChangeText={(value) => onSessionFieldChange(dayIndex, i, 'loc', value)}
                          style={styles.sessionInputLoc}
                          placeholder="Location"
                          placeholderTextColor={C.textMuted}
                        />
                      </View>
                    ) : (
                      <View>
                        {s.tag === 'NOW' ? (
                          <View style={styles.nowBadge}><Text style={styles.nowBadgeText}>NOW</Text></View>
                        ) : (
                          <Text style={[styles.sessionTime, { color: s.color }]}>{s.time}</Text>
                        )}
                        <Text style={styles.sessionTitle}>{s.title}</Text>
                        {!!s.loc && <Text style={styles.sessionLoc}>{s.loc}</Text>}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Curator Notes */}
      <View
  style={[
    styles.curatorPanel,
    isDesktop && { width: 200 },      // 💻 desktop sidebar
    !isDesktop && {
      width: '100%',                  // 📱 full width on mobile
      marginTop: 16,
    },
  ]}
>
        <View style={styles.curatorHeader}>
          <Text style={styles.curatorIcon}>📋</Text>
          <Text style={styles.curatorTitle}>Curator Notes</Text>
        </View>

        <Text style={styles.sectionLabel}>PREP CHECKLIST</Text>
        {checklist.map((item) => (
          <TouchableOpacity key={item.id} style={styles.checkRow} onPress={() => toggleCheck(item.id)} activeOpacity={0.75}>
            <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
              {item.done && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={[styles.checkLabel, item.done && styles.checkLabelDone]}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>RESEARCH PINS</Text>
        {PINS.map((p, i) => (
          <TouchableOpacity key={i} style={styles.pinCard} activeOpacity={0.8}>
            <Text style={styles.pinIcon}>🔖</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pinTitle}>{p.title}</Text>
              <Text style={styles.pinSource}>{p.source}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneLabel}>NEXT MILESTONE</Text>
          <Text style={styles.milestoneTitle}>Mid-Term Assessment</Text>
          <Text style={styles.milestoneSub}>In 12 days · L-Hall A</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Schedule({ onTakeAttendanceNavigate }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const cloneDays = (sourceDays) => sourceDays.map((day) => ({
    ...day,
    sessions: day.sessions.map((session) => ({ ...session })),
  }));
  const [weekData, setWeekData] = useState(() => cloneDays(DAYS));
  const [weekDraft, setWeekDraft] = useState(() => cloneDays(DAYS));
  const [isEditingWeek, setIsEditingWeek] = useState(false);

  const goToAttendanceMark = () => {
    onTakeAttendanceNavigate?.();
  };

  const handleStartModify = () => {
    setWeekDraft(cloneDays(weekData));
    setIsEditingWeek(true);
  };

  const handleSaveModify = () => {
    setWeekData(cloneDays(weekDraft));
    setIsEditingWeek(false);
  };

  const handleCancelModify = () => {
    setWeekDraft(cloneDays(weekData));
    setIsEditingWeek(false);
  };

  const handleSessionFieldChange = (dayIndex, sessionIndex, field, value) => {
    setWeekDraft((prev) => prev.map((day, dIdx) => {
      if (dIdx !== dayIndex) return day;
      return {
        ...day,
        sessions: day.sessions.map((session, sIdx) => {
          if (sIdx !== sessionIndex) return session;
          return { ...session, [field]: value };
        }),
      };
    }));
  };


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Top Bar (always visible) */}
   

      
        {/* Sidebar – always shown on desktop, drawer on mobile */}
       <View style={{ flex: 1 }}>
  <ScrollView
    style={styles.main}
    contentContainerStyle={styles.mainContent}
    showsVerticalScrollIndicator={false}
  >
          {/* Mobile menu toggle */}
      

          {/* Header */}
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.sessionSpotlight}>CURRENT SESSION SPOTLIGHT</Text>
              <Text style={styles.pageTitle}>Active Learning</Text>
            </View>
            <View style={styles.headerBtns}>
              {isEditingWeek && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.85}
                  onPress={handleCancelModify}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modifyBtn}
                activeOpacity={0.85}
                onPress={isEditingWeek ? handleSaveModify : handleStartModify}
              >
                <Text style={styles.modifyBtnText}>
                  {isEditingWeek ? 'Save Schedule' : '✏  Modify Schedule'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Spotlight */}
          <SpotlightCard onTakeAttendance={goToAttendanceMark} />

          {/* Week Grid + Curator */}
          <WeekGrid
            isDesktop={isDesktop}
            days={isEditingWeek ? weekDraft : weekData}
            isEditing={isEditingWeek}
            onSessionFieldChange={handleSessionFieldChange}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },

  // Top Bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border,
    zIndex: 100,
  },
  brandName: { fontSize: 17, fontWeight: '800', color: C.primary, letterSpacing: -0.3 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarLink: { paddingHorizontal: 10, paddingVertical: 4 },
  topBarLinkActive: { borderBottomWidth: 2, borderBottomColor: C.primary },
  topBarLinkText: { fontSize: 13, color: C.textMuted },
  topBarLinkActiveText: { color: C.primary, fontWeight: '600' },
  iconBtn: { padding: 6 },
  userAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: C.white, fontSize: 11, fontWeight: '700' },

  // Layout
  bodyRow: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    backgroundColor: C.sidebarBg, paddingVertical: 20, paddingHorizontal: 16,
    borderRightWidth: 1, borderRightColor: C.border,
  },
  sidebarDesktop: { width: 230 },
  sidebarMobile: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: 240,
    zIndex: 200, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 }, android: { elevation: 8 } }),
  },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 199 },

  sidebarProfile: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.white, fontWeight: '700', fontSize: 13 },
  profileName: { fontWeight: '700', fontSize: 14, color: C.text },
  profileRole: { fontSize: 11, color: C.textMuted },

  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2, gap: 10 },
  navItemActive: { backgroundColor: C.active },
  navDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  navDotActive: { backgroundColor: C.primary },
  navText: { fontSize: 13, color: C.navText },
  navTextActive: { color: C.primary, fontWeight: '600' },

  sidebarSpacer: { flex: 1, minHeight: 20 },
  createBtn: {
    backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginVertical: 16,
  },
  createBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },

  menuToggle: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: C.active, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 16,
  },
  menuToggleText: { color: C.primary, fontWeight: '600', fontSize: 14 },

  // Main
  main: { flex: 1, backgroundColor: C.bg },
  mainContent: { padding: 20, paddingBottom: 40 },

  // Page Header
  pageHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 12, marginBottom: 20,
  },
  sessionSpotlight: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1.2, marginBottom: 2 },
  pageTitle: { fontSize: 30, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  headerBtns: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  exportBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: C.white,
  },
  exportBtnText: { fontSize: 13, fontWeight: '600', color: C.text },
  modifyBtn: {
    backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  modifyBtnText: { fontSize: 13, fontWeight: '700', color: C.white },
  cancelBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: C.white,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: C.text },

  // Spotlight Card
  spotlightCard: {
    backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }),
  },
  spotlightLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  spotlightIcon: {
    width: 52, height: 52, borderRadius: 12, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  inProgressBadge: { backgroundColor: '#DBEAFE', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  inProgressText: { fontSize: 10, fontWeight: '700', color: C.primary, letterSpacing: 0.8 },
  spotlightTitle: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  spotlightMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 2 },
  metaText: { fontSize: 12, color: C.textMuted },
  attendanceBtn: {
    backgroundColor: C.green, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  attendanceBtnText: { color: C.white, fontWeight: '700', fontSize: 13 },

  // Week Grid Row
  weekGridRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  calendarContainer: {
    flex: 1, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 }, android: { elevation: 2 } }),
  },

  // Tabs
 
  tabRow: {
  flexDirection: 'row',
  borderBottomWidth: 1,
  borderBottomColor: C.border,
  justifyContent: 'flex-start',
  paddingHorizontal:10, // 👈 add this
},
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: C.bg },
  tabActive: { backgroundColor: C.white, borderBottomWidth: 2, borderBottomColor: C.primary },
  tabText: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  tabTextActive: { color: C.primary, fontWeight: '700' },

  // Days
  daysRow: { flexDirection: 'row', padding: 12, gap: 10 },
  dayCol: { width: 130, minHeight: 200 },
  dayColToday: {},
  dayDate: { fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 0.8 },
  dayDateToday: { color: C.primary },
  dayName: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 10 },
  dayNameToday: { color: C.primary },

  sessionCard: {
    borderLeftWidth: 3, borderRadius: 8, padding: 8, marginBottom: 8,
  },
  sessionCardNow: { borderWidth: 2, borderColor: C.primary },
  sessionTime: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  sessionTitle: { fontSize: 12, fontWeight: '700', color: C.text },
  sessionLoc: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  sessionInputTime: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    backgroundColor: C.white,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
  },
  sessionInputTitle: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    backgroundColor: C.white,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
  },
  sessionInputLoc: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    backgroundColor: C.white,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
    color: C.text,
  },
  nowBadge: { backgroundColor: C.primary, borderRadius: 4, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  nowBadgeText: { color: C.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Curator Panel
curatorPanel: {
  // width: 200,  ❌ remove this line

  backgroundColor: C.white,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: C.border,
  padding: 14,
  ...Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
    android: { elevation: 2 },
  }),
},
  curatorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  curatorIcon: { fontSize: 16 },
  curatorTitle: { fontSize: 15, fontWeight: '800', color: C.text },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1.2, marginBottom: 8 },

  // Checklist
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxDone: { backgroundColor: C.primary, borderColor: C.primary },
  checkMark: { color: C.white, fontSize: 11, fontWeight: '800' },
  checkLabel: { flex: 1, fontSize: 12, color: C.text, lineHeight: 18 },
  checkLabelDone: { color: C.textMuted, textDecorationLine: 'line-through' },

  // Pins
  pinCard: {
    flexDirection: 'row', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 8,
    padding: 10, marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  pinIcon: { fontSize: 14 },
  pinTitle: { fontSize: 12, fontWeight: '700', color: C.text, lineHeight: 16 },
  pinSource: { fontSize: 10, color: C.textMuted, marginTop: 2 },

  // Milestone
  milestoneCard: {
    marginTop: 12, backgroundColor: C.bg, borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: C.border,
  },
  milestoneLabel: { fontSize: 9, fontWeight: '700', color: C.green, letterSpacing: 1, marginBottom: 4 },
  milestoneTitle: { fontSize: 13, fontWeight: '800', color: C.text },
  milestoneSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
});