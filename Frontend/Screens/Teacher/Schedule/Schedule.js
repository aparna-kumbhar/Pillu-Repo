import React, { useState, useEffect } from 'react';
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

// ─── Data ────────────────────────────────────────────────────────────────────
// All data is now fetched from backend API; no dummy data

const NAV_ITEMS = ['Dashboard', 'Weekly Schedule', 'Student Rosters', 'Lesson Plans', 'Reports'];

const getEmptyWeek = () => ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(k => ({ date: k, day: k, isToday: false, sessions: [] }));

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

function SpotlightCard({ onTakeAttendance, currentSession }) {
  if (!currentSession) return null;
  return (
    <View style={styles.spotlightCard}>
      <View style={styles.spotlightLeft}>
        <View style={styles.spotlightIcon}>
          <Text style={{ fontSize: 24 }}>🎓</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.spotlightTitle}>
            {currentSession.title}
          </Text>
          <TouchableOpacity
            style={styles.attendanceBtn}
            activeOpacity={0.85}
            onPress={onTakeAttendance}
          >
            <Text style={styles.attendanceBtnText}>Take Attendance</Text>
          </TouchableOpacity>
          <View style={styles.spotlightMeta}>
           <Text style={styles.metaText}>🕘 {currentSession.time}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function WeekGrid({ isDesktop, days, isEditing, onSessionFieldChange }) {

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


    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Schedule({ onTakeAttendanceNavigate, instituteId = '', teacherId = '' }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const cloneDays = (sourceDays) => sourceDays.map((day) => ({
    ...day,
    sessions: day.sessions.map((session) => ({ ...session })),
  }));
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [schedulesError, setSchedulesError] = useState('');



  const WEEKDAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const buildWeekFromSchedules = (schedules = [], teacherId = '') => {
    const days = WEEKDAY_KEYS.map((k) => ({ date: k, day: k, isToday: false, sessions: [] }));
    const allSessions = (Array.isArray(schedules) ? schedules : []).flatMap((sch) => sch.sessions || []);

    for (const s of allSessions) {
      const facultyId = String(s.faculty?.id || '').trim();
      if (teacherId && facultyId !== String(teacherId).trim()) continue;

      const dayKeyRaw = String(s.day || '').trim().toUpperCase();
      const dayKey = dayKeyRaw.slice(0, 3);
      const idx = WEEKDAY_KEYS.indexOf(dayKey);
      if (idx === -1) continue;

      const session = {
        time: s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.startTime || ''),
        title: s.subject?.label || s.subject || 'Session',
        loc: s.classroom?.label || s.classroom || '',
        color: s.color || C.primary,
        light: '#EEF2FF',
        tag: null,
      };

      days[idx].sessions.push(session);
    }

    return days;
  };

  // batches and selection for batch-wise filtering
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  useEffect(() => {
    const fetchBatches = async () => {
      if (!instituteId) return;
      try {
        const res = await fetch(`/api/batches?instituteId=${encodeURIComponent(instituteId)}`);
        if (!res.ok) return;
        const data = await res.json();
        setBatches(Array.isArray(data) ? data : []);
      } catch (e) {
        // ignore
      }
    };

    fetchBatches();
  }, [instituteId]);

  useEffect(() => {
    // Fetch schedules and populate week; if selectedBatchId provided, fetch batch-specific schedules
    const fetchSchedules = async () => {
      if (!instituteId || !teacherId) return;
      try {
        setLoadingSchedules(true);
        setSchedulesError('');
        const url = selectedBatchId
          ? `/api/schedules/batch/${encodeURIComponent(selectedBatchId)}?instituteId=${encodeURIComponent(instituteId)}`
          : `/api/schedules?instituteId=${encodeURIComponent(instituteId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch schedules');
        const data = await res.json();
        const week = buildWeekFromSchedules(data, teacherId);
        setWeekData(cloneDays(week));
        setWeekDraft(cloneDays(week));
      } catch (err) {
        setSchedulesError(err?.message || 'Unable to load schedules');
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [instituteId, teacherId, selectedBatchId]);
  const [weekData, setWeekData] = useState(() => WEEKDAY_KEYS.map(k => ({ date: k, day: k, isToday: false, sessions: [] })));
  const [weekDraft, setWeekDraft] = useState(() => WEEKDAY_KEYS.map(k => ({ date: k, day: k, isToday: false, sessions: [] })));
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

          {/* Spotlight - show first upcoming session */}
          {weekData.flatMap(d => d.sessions).length > 0 && (
            <SpotlightCard onTakeAttendance={goToAttendanceMark} currentSession={weekData.flatMap(d => d.sessions)[0]} />
          )}

          {/* Batch selector + Week Grid + Curator */}
          {batches.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: 8, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setSelectedBatchId('')}
                style={[styles.batchBtn, selectedBatchId === '' && styles.batchBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.batchBtnText, selectedBatchId === '' && styles.batchBtnTextActive]}>All</Text>
              </TouchableOpacity>
              {batches.map((b) => (
                <TouchableOpacity
                  key={String(b._id || b.id)}
                  onPress={() => setSelectedBatchId(String(b._id || b.id))}
                  style={[styles.batchBtn, selectedBatchId === String(b._id || b.id) && styles.batchBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.batchBtnText, selectedBatchId === String(b._id || b.id) && styles.batchBtnTextActive]}> {String(b.name || b.label || b.batch || b._id).slice(0,20)} </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

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