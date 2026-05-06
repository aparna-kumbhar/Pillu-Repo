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
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

// ─── Color Palette ───────────────────────────────────────────────────────────
const C = {
  bg: '#F4F4F8',
  white: '#FFFFFF',
  indigo: '#4F46E5',
  indigoLight: '#EEF2FF',
  indigoMuted: '#818CF8',
  dark: '#1E1B4B',
  darkCard: '#1A1A2E',
  text: '#374151',
  muted: '#9CA3AF',
  red: '#EF4444',
  green: '#10B981',
  greenLight: '#D1FAE5',
  redLight: '#FEE2E2',
  border: '#E5E7EB',
  dot_present: '#4F46E5',
  dot_absent: '#EF4444',
  dot_late: '#F59E0B',
  overlay: 'rgba(0,0,0,0.5)',
};

// ─── Sequential Month/Year List ──────────────────────────────────────────────
const MONTH_LIST = [
  { label: 'January 2023',   short: 'Jan 2023' },
  { label: 'February 2023',  short: 'Feb 2023' },
  { label: 'March 2023',     short: 'Mar 2023' },
  { label: 'April 2023',     short: 'Apr 2023' },
  { label: 'May 2023',       short: 'May 2023' },
  { label: 'June 2023',      short: 'Jun 2023' },
  { label: 'July 2023',      short: 'Jul 2023' },
  { label: 'August 2023',    short: 'Aug 2023' },
  { label: 'September 2023', short: 'Sep 2023' },
  { label: 'October 2023',   short: 'Oct 2023' },
  { label: 'November 2023',  short: 'Nov 2023' },
  { label: 'December 2023',  short: 'Dec 2023' },
  { label: 'January 2024',   short: 'Jan 2024' },
  { label: 'February 2024',  short: 'Feb 2024' },
  { label: 'March 2024',     short: 'Mar 2024' },
];

// ─── Calendar Data per Month Index ──────────────────────────────────────────
const generateCalendarRows = (monthIndex) => {
  const patterns = [
    ['present','present','absent','present','present','late','present'],
    ['present','absent','present','present','present','present','absent'],
    ['late','present','present','absent','present','present','present'],
  ];
  const pat = patterns[monthIndex % 3];
  return [
    [
      { day: null, dot: null },
      { day: 1,  dot: pat[0] },
      { day: 2,  dot: pat[1] },
      { day: 3,  dot: pat[2] },
      { day: 4,  dot: pat[3] },
      { day: 5,  dot: pat[4] },
      { day: 6,  dot: pat[5] },
    ],
    [
      { day: 7,  dot: pat[6] },
      { day: 8,  dot: pat[0] },
      { day: 9,  dot: pat[1] },
      { day: 10, dot: pat[2] },
      { day: 11, dot: pat[3] },
      { day: 12, dot: pat[4] },
      { day: 13, dot: pat[5] },
    ],
    [
      { day: 14, dot: pat[6] },
      { day: 15, dot: pat[0] },
      { day: 16, dot: pat[1] },
      { day: 17, dot: pat[2] },
      { day: 18, dot: pat[3] },
      { day: 19, dot: pat[4] },
      { day: 20, dot: pat[5] },
    ],
    [
      { day: 21, dot: pat[6] },
      { day: 22, dot: pat[0] },
      { day: 23, dot: pat[1] },
      { day: 24, dot: pat[2] },
      { day: 25, dot: pat[3] },
      { day: 26, dot: pat[4] },
      { day: 27, dot: pat[5] },
    ],
    [
      { day: 28, dot: pat[6] },
      { day: 29, dot: pat[0] },
      { day: 30, dot: pat[1] },
      { day: 31, dot: pat[2] },
      { day: null, dot: null },
      { day: null, dot: null },
      { day: null, dot: null },
    ],
  ];
};

const DAYS_HEADER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── Subject Data ────────────────────────────────────────────────────────────
const subjects = [
  { icon: 'Σ', name: 'Advanced Mathematics',   teacher: 'Prof. Julian Archer',  pct: 98, present: 28, absent: 1, late: 0, grade: 'A+' },
  { icon: '⚗', name: 'Quantum Physics',         teacher: 'Dr. Elena Rostova',    pct: 84, present: 24, absent: 4, late: 1, grade: 'B+' },
  { icon: '⚡', name: 'Applied Electrodynamics', teacher: 'Prof. Marcus Thorne',  pct: 91, present: 26, absent: 2, late: 1, grade: 'A'  },
  { icon: '⊞', name: 'Digital Logic Systems',   teacher: 'Eng. Sarah Jenkins',   pct: 89, present: 25, absent: 3, late: 1, grade: 'A-' },
];

// ─── Top Nav ─────────────────────────────────────────────────────────────────
function TopNav() {
  return (
    <View style={styles.topNav}>
      <View style={styles.navLeft}>
        {isTablet && (
          <View style={styles.navLinks}>
            {['Overview', 'Reports', 'Schedule'].map((t, i) => (
              <TouchableOpacity key={t} activeOpacity={0.7} style={styles.navLinkBtn}>
                <Text style={[styles.navLink, i === 1 && styles.navLinkActive]}>{t}</Text>
                {i === 1 && <View style={styles.navLinkUnderline} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Attendance Calendar ──────────────────────────────────────────────────────
function AttendanceCalendar() {
  const [monthIndex, setMonthIndex] = useState(9);

  const goBack = () => setMonthIndex(prev => Math.max(0, prev - 1));
  const goNext = () => setMonthIndex(prev => Math.min(MONTH_LIST.length - 1, prev + 1));

  const calendarRows = generateCalendarRows(monthIndex);

  const dotColor = (d) => {
    if (d === 'present') return C.dot_present;
    if (d === 'absent')  return C.dot_absent;
    if (d === 'late')    return C.dot_late;
    return 'transparent';
  };

  return (
    <View style={styles.card}>
      <View style={styles.calHeader}>
        <Text style={styles.calTitle}>Attendance Calendar</Text>
        <View style={styles.calNav}>
          <TouchableOpacity
            activeOpacity={monthIndex === 0 ? 1 : 0.7}
            style={[styles.calArrow, monthIndex === 0 && styles.calArrowDisabled]}
            onPress={goBack}
          >
            <Text style={[styles.calArrowText, monthIndex === 0 && styles.calArrowTextDisabled]}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calMonth}>{MONTH_LIST[monthIndex].label}</Text>
          <TouchableOpacity
            activeOpacity={monthIndex === MONTH_LIST.length - 1 ? 1 : 0.7}
            style={[styles.calArrow, monthIndex === MONTH_LIST.length - 1 && styles.calArrowDisabled]}
            onPress={goNext}
          >
            <Text style={[styles.calArrowText, monthIndex === MONTH_LIST.length - 1 && styles.calArrowTextDisabled]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calRow}>
        {DAYS_HEADER.map((d, i) => (
          <View key={i} style={styles.calCell}>
            <Text style={styles.calDayHeader}>{d}</Text>
          </View>
        ))}
      </View>

      {calendarRows.map((row, ri) => (
        <View key={ri} style={styles.calRow}>
          {row.map((cell, ci) => (
            <TouchableOpacity
              key={ci}
              activeOpacity={cell.day ? 0.7 : 1}
              style={[styles.calCell, cell.day === 1 && styles.calCellHighlight]}
            >
              {cell.day !== null && (
                <>
                  <Text style={[styles.calDayNum, cell.day === 1 && styles.calDayNumActive]}>
                    {cell.day}
                  </Text>
                  <View style={[styles.dot, { backgroundColor: dotColor(cell.dot) }]} />
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.calLegend}>
        {[
          { label: 'Present', color: C.dot_present },
          { label: 'Absent',  color: C.dot_absent  },
          { label: 'Late',    color: C.dot_late     },
        ].map(l => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={styles.legendLabel}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Subject Grid Modal ───────────────────────────────────────────────────────
function SubjectGridModal({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, isTablet && styles.modalContainerTablet]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detailed Subject Grid</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Column Headers */}
            <View style={styles.gridHeaderRow}>
              <Text style={[styles.gridHeaderCell, { flex: 2 }]}>Subject</Text>
              <Text style={styles.gridHeaderCell}>Present</Text>
              <Text style={styles.gridHeaderCell}>Absent</Text>
              <Text style={styles.gridHeaderCell}>Late</Text>
              <Text style={styles.gridHeaderCell}>%</Text>
              <Text style={styles.gridHeaderCell}>Grade</Text>
            </View>

            {subjects.map((s, i) => (
              <View key={s.name} style={[styles.gridRow, i % 2 === 0 && styles.gridRowAlt]}>
                <View style={[styles.gridCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <View style={styles.gridIcon}>
                    <Text style={styles.gridIconText}>{s.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gridSubjectName} numberOfLines={1}>{s.name}</Text>
                    <Text style={styles.gridTeacher} numberOfLines={1}>{s.teacher}</Text>
                  </View>
                </View>

                <View style={styles.gridCell}>
                  <Text style={[styles.gridVal, { color: C.dot_present }]}>{s.present}</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={[styles.gridVal, { color: C.dot_absent }]}>{s.absent}</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={[styles.gridVal, { color: C.dot_late }]}>{s.late}</Text>
                </View>
                <View style={styles.gridCell}>
                  <View style={styles.miniProgressBg}>
                    <View style={[styles.miniProgressFill, {
                      width: `${s.pct}%`,
                      backgroundColor: s.pct >= 90 ? C.green : s.pct >= 75 ? C.dot_late : C.red,
                    }]} />
                  </View>
                  <Text style={styles.gridPct}>{s.pct}%</Text>
                </View>
                <View style={styles.gridCell}>
                  <View style={[styles.gradeBadge, {
                    backgroundColor: s.pct >= 90 ? C.greenLight : s.pct >= 75 ? '#FEF3C7' : C.redLight,
                  }]}>
                    <Text style={[styles.gradeText, {
                      color: s.pct >= 90 ? C.green : s.pct >= 75 ? '#D97706' : C.red,
                    }]}>{s.grade}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Summary Footer */}
            <View style={styles.gridSummary}>
              <Text style={styles.gridSummaryTitle}>Overall Summary</Text>
              <View style={styles.gridSummaryRow}>
                {[
                  { label: 'Avg Attendance', value: '90.5%', color: C.indigo },
                  { label: 'Total Present',  value: '103',   color: C.green  },
                  { label: 'Total Absent',   value: '10',    color: C.red    },
                  { label: 'Total Late',     value: '3',     color: C.dot_late },
                ].map(item => (
                  <View key={item.label} style={styles.summaryStat}>
                    <Text style={[styles.summaryVal, { color: item.color }]}>{item.value}</Text>
                    <Text style={styles.summaryLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity activeOpacity={0.8} style={styles.modalCloseFooter} onPress={onClose}>
            <Text style={styles.modalCloseFooterText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Subject Row ──────────────────────────────────────────────────────────────
function SubjectRow({ icon, name, teacher, pct }) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.subjectRow}>
      <View style={styles.subjectIcon}>
        <Text style={styles.subjectIconText}>{icon}</Text>
      </View>
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{name}</Text>
        <Text style={styles.subjectTeacher}>{teacher}</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>
      <Text style={styles.subjectPct}>{pct}%</Text>
    </TouchableOpacity>
  );
}

// ─── Curator's Note ───────────────────────────────────────────────────────────
function CuratorsNote() {
  return (
    <View style={styles.curatorCard}>
      <Text style={styles.curatorTitle}>Curator's Note</Text>
      <Text style={styles.curatorBody}>
        Attendance has seen a significant boost in the last 14 days, primarily driven by the
        'Applied Electrodynamics' workshop series. Keep monitoring 'Quantum Physics' as it
        remains the lowest performing metric.
      </Text>
      <TouchableOpacity activeOpacity={0.8} style={styles.predictiveBtn}>
        <Text style={styles.predictiveIcon}>💡</Text>
        <Text style={styles.predictiveText}>PREDICTIVE INSIGHT</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttendanceReport() {
  const [gridVisible, setGridVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      
     <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.reportLabel}>ATTENDANCE REPORT</Text>
            <Text style={styles.greeting}>Morning, Administrator.</Text>
          </View>
        </View>

        {/* Top row: Stats + Calendar */}
        <View style={[styles.row, !isTablet && styles.rowColumn]}>
          <View style={[styles.card, styles.statsCard, !isTablet && styles.fullWidth]}>
            <Text style={styles.statsLabel}>Total Average Attendance</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsValue}>92.4%</Text>
              <View style={styles.statsBadge}>
                <Text style={styles.statsBadgeText}>↑ +1.2%</Text>
              </View>
            </View>
            <View style={styles.statsSubRow}>
              <TouchableOpacity activeOpacity={0.8} style={[styles.statsPill, styles.statsPillGreen]}>
                <Text style={styles.statsPillTop}>PRESENCE</Text>
                <Text style={styles.statsPillVal}>
                  178 <Text style={styles.statsPillUnit}>days</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} style={[styles.statsPill, styles.statsPillRed]}>
                <Text style={styles.statsPillTop}>ABSENCE</Text>
                <Text style={[styles.statsPillVal, { color: C.red }]}>
                  12 <Text style={styles.statsPillUnit}>days</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[!isTablet && styles.fullWidth, isTablet && styles.calendarWrapper]}>
            <AttendanceCalendar />
          </View>
        </View>

        {/* Bottom row: Subjects + Curator */}
        <View style={[styles.row, !isTablet && styles.rowColumn]}>
          <View style={[styles.card, styles.subjectsCard, !isTablet && styles.fullWidth]}>
            <View style={styles.subjectsHeader}>
              <Text style={styles.subjectsTitle}>Subject Analysis</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setGridVisible(true)}>
                <Text style={styles.viewGrid}>View Detailed Grid</Text>
              </TouchableOpacity>
            </View>
            {subjects.map(s => <SubjectRow key={s.name} {...s} />)}
          </View>

          <View style={[!isTablet && styles.fullWidth, isTablet && styles.curatorWrapper]}>
            <CuratorsNote />
          </View>
        </View>
      </ScrollView>

      {/* Modal */}
      <SubjectGridModal visible={gridVisible} onClose={() => setGridVisible(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Top Nav
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  navBrand: { fontSize: 18, fontWeight: '800', color: C.indigo, letterSpacing: -0.5 },
  navLinks: { flexDirection: 'row', gap: 20 },
  navLinkBtn: { alignItems: 'center' },
  navLink: { fontSize: 14, color: C.muted, fontWeight: '500' },
  navLinkActive: { color: C.indigo, fontWeight: '700' },
  navLinkUnderline: { height: 2, backgroundColor: C.indigo, borderRadius: 1, marginTop: 2, width: '100%' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: isTablet ? 28 : 16, gap: 20 },

  // Page Header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: isTablet ? 'flex-end' : 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 4,
  },
  reportLabel: { fontSize: 11, fontWeight: '700', color: C.indigo, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  greeting: { fontSize: isTablet ? 36 : 26, fontWeight: '800', color: C.dark, letterSpacing: -1 },

  // Layout
  row: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  rowColumn: { flexDirection: 'column' },
  fullWidth: { width: '100%' },

  // Card Base
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },

  // Stats
  statsCard: { flex: isTablet ? 1 : undefined, minWidth: isTablet ? 200 : undefined },
  statsLabel: { fontSize: 13, color: C.muted, fontWeight: '500', marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  statsValue: { fontSize: 40, fontWeight: '800', color: C.dark, letterSpacing: -1.5 },
  statsBadge: { backgroundColor: C.greenLight, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statsBadgeText: { fontSize: 12, color: C.green, fontWeight: '700' },
  statsSubRow: { flexDirection: 'row', gap: 12 },
  statsPill: { flex: 1, borderRadius: 12, padding: 12 },
  statsPillGreen: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  statsPillRed: { backgroundColor: C.redLight, borderWidth: 1, borderColor: '#FECACA' },
  statsPillTop: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, marginBottom: 4 },
  statsPillVal: { fontSize: 20, fontWeight: '800', color: C.dark },
  statsPillUnit: { fontSize: 13, fontWeight: '400', color: C.muted },

  // Calendar
  calendarWrapper: { flex: isTablet ? 2 : undefined },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  calTitle: { fontSize: 16, fontWeight: '700', color: C.dark },
  calNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  calArrowDisabled: { opacity: 0.35 },
  calArrowText: { fontSize: 16, color: C.text, fontWeight: '600' },
  calArrowTextDisabled: { color: C.muted },
  calMonth: { fontSize: 13, fontWeight: '700', color: C.dark, minWidth: isTablet ? 130 : 110, textAlign: 'center' },
  calRow: { flexDirection: 'row', marginBottom: 4 },
  calCell: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 10, gap: 3 },
  calCellHighlight: { borderWidth: 2, borderColor: C.indigo, borderRadius: 10 },
  calDayHeader: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },
  calDayNum: { fontSize: 13, fontWeight: '600', color: C.text },
  calDayNumActive: { color: C.indigo, fontWeight: '800' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  calLegend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, color: C.muted },

  // Subjects
  subjectsCard: { flex: isTablet ? 2 : undefined },
  subjectsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subjectsTitle: { fontSize: 18, fontWeight: '800', color: C.dark },
  viewGrid: { fontSize: 13, color: C.indigo, fontWeight: '600' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14, borderBottomWidth: 1, borderBottomColor: C.bg },
  subjectIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.indigoLight, alignItems: 'center', justifyContent: 'center' },
  subjectIconText: { fontSize: 18, color: C.indigo },
  subjectInfo: { flex: 1, gap: 3 },
  subjectName: { fontSize: 14, fontWeight: '700', color: C.dark },
  subjectTeacher: { fontSize: 12, color: C.muted, marginBottom: 6 },
  progressBg: { height: 6, backgroundColor: C.bg, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.indigo, borderRadius: 3 },
  subjectPct: { fontSize: 16, fontWeight: '800', color: C.dark, minWidth: 44, textAlign: 'right' },

  // Curator
  curatorWrapper: { flex: 1 },
  curatorCard: {
    backgroundColor: C.darkCard,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
    gap: 14,
  },
  curatorTitle: { fontSize: 18, fontWeight: '800', color: C.white },
  curatorBody: { fontSize: 13, color: '#A0AEC0', lineHeight: 20 },
  predictiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  predictiveIcon: { fontSize: 16 },
  predictiveText: { fontSize: 12, fontWeight: '700', color: C.white, letterSpacing: 1.5 },

  // ── Modal Shared ──
  modalOverlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalContainerTablet: {
    alignSelf: 'center',
    width: '65%',
    borderRadius: 24,
    marginBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.dark },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: C.text, fontWeight: '600' },

  // ── Subject Grid Modal ──
  gridHeaderRow: {
    flexDirection: 'row',
    backgroundColor: C.indigoLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 4,
  },
  gridHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: C.indigo,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  gridRowAlt: { backgroundColor: '#FAFAFA' },
  gridCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.indigoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconText: { fontSize: 14, color: C.indigo },
  gridSubjectName: { fontSize: 12, fontWeight: '700', color: C.dark },
  gridTeacher: { fontSize: 10, color: C.muted },
  gridVal: { fontSize: 14, fontWeight: '700' },
  miniProgressBg: { height: 4, backgroundColor: C.bg, borderRadius: 2, overflow: 'hidden', width: '80%', marginBottom: 3 },
  miniProgressFill: { height: '100%', borderRadius: 2 },
  gridPct: { fontSize: 11, color: C.text, fontWeight: '600' },
  gradeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  gradeText: { fontSize: 12, fontWeight: '700' },
  gridSummary: {
    marginTop: 20,
    backgroundColor: C.indigoLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  gridSummaryTitle: { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 12 },
  gridSummaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryStat: { alignItems: 'center', gap: 4 },
  summaryVal: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: C.muted, textAlign: 'center' },

  modalCloseFooter: {
    marginTop: 16,
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseFooterText: { fontSize: 15, fontWeight: '700', color: C.text },
});