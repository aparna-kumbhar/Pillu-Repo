import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

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



// ─── Generate Dynamic Calendar Rows from Attendance Data ──────────────────────
const generateCalendarRows = (year, month, attendanceMap = {}) => {
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const rows = [];
  let row = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    row.push({ day: null, dot: null });
  }

  // Calendar days
  for (let day = 1; day <= lastDate; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = attendanceMap[dateStr] || null;
    
    row.push({ day, dot: status });

    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }

  // Fill remaining cells
  while (row.length > 0 && row.length < 7) {
    row.push({ day: null, dot: null });
  }
  if (row.length > 0) {
    rows.push(row);
  }

  return rows;
};

const DAYS_HEADER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];



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
function AttendanceCalendar({ attendanceMap = {}, selectedMonth = new Date() }) {
  const [monthIndex, setMonthIndex] = useState(selectedMonth.getMonth());
  const [year, setYear] = useState(selectedMonth.getFullYear());

  useEffect(() => {
    const attendanceDates = Object.keys(attendanceMap)
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());

    if (attendanceDates.length > 0) {
      const latestDate = attendanceDates[0];
      setMonthIndex(latestDate.getMonth());
      setYear(latestDate.getFullYear());
      return;
    }

    setMonthIndex(selectedMonth.getMonth());
    setYear(selectedMonth.getFullYear());
  }, [attendanceMap, selectedMonth]);

  const goBack = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear(year - 1);
    } else {
      setMonthIndex(monthIndex - 1);
    }
  };

  const goNext = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear(year + 1);
    } else {
      setMonthIndex(monthIndex + 1);
    }
  };
   
  const calendarRows = generateCalendarRows(year, monthIndex, attendanceMap);
  const monthLabel = new Date(year, monthIndex).toLocaleString('default', { month: 'long', year: 'numeric' });

  const getDayTone = (status) => {
    if (status === 'present') {
      return {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        textColor: '#047857',
      };
    }

    if (status === 'absent') {
      return {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
        textColor: '#B91C1C',
      };
    }

    if (status === 'leave' || status === 'late') {
      return {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
        textColor: '#B45309',
      };
    }

    return {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: C.text,
    };
  };

  return (
    <View style={styles.card}>
      <View style={styles.calHeader}>
        <Text style={styles.calTitle}>Attendance Calendar</Text>
        <View style={styles.calNav}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.calArrow}
            onPress={goBack}
          >
            <Text style={styles.calArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calMonth}>{monthLabel}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.calArrow}
            onPress={goNext}
          >
            <Text style={styles.calArrowText}>›</Text>
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
          {row.map((cell, ci) => {
            const dayTone = cell.day !== null ? getDayTone(cell.dot) : null;

            return (
              <TouchableOpacity
                key={ci}
                activeOpacity={cell.day ? 0.7 : 1}
                style={[
                  styles.calCell,
                  cell.day === 1 && styles.calCellHighlight,
                  cell.day !== null && dayTone?.backgroundColor !== 'transparent' && {
                    backgroundColor: dayTone.backgroundColor,
                    borderWidth: 1,
                    borderColor: dayTone.borderColor,
                  },
                ]}
              >
                {cell.day !== null && (
                  <Text
                    style={[
                      styles.calDayNum,
                      { color: dayTone?.textColor || C.text },
                      cell.day === 1 && styles.calDayNumActive,
                    ]}
                  >
                    {cell.day}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <View style={styles.calLegend}>
        {[
          { label: 'Present', color: C.dot_present },
          { label: 'Absent',  color: C.dot_absent  },
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
function SubjectGridModal({ visible, onClose, subjects = [], summary = {} }) {
  const avgAttendance = summary.averagePct || '0%';
  const totalPresent = summary.totalPresent || 0;
  const totalAbsent = summary.totalAbsent || 0;
  const totalLate = summary.totalLate || 0;

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
                  { label: 'Avg Attendance', value: avgAttendance, color: C.indigo },
                  { label: 'Total Present',  value: String(totalPresent), color: C.green  },
                  { label: 'Total Absent',   value: String(totalAbsent), color: C.red    },
                  { label: 'Total Late',     value: String(totalLate), color: C.dot_late },
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
        Your attendance data is pulled live from the database. Use the calendar above to review
        present and absent days, and the summary card for the current attendance rate.
      </Text>
      <TouchableOpacity activeOpacity={0.8} style={styles.predictiveBtn}>
        <Text style={styles.predictiveIcon}>💡</Text>
        <Text style={styles.predictiveText}>PREDICTIVE INSIGHT</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttendanceReport({ route, studentId = '', instituteId = '', studentName = '' }) {
  const resolvedStudentId = studentId || route?.params?.studentId || route?.params?.student?._id || route?.params?.student?.id || route?.params?.student?.studentId || '';
  const resolvedInstituteId = instituteId || route?.params?.instituteId || route?.params?.student?.instituteId || '';
  const resolvedStudentName = studentName || route?.params?.student?.fullName || route?.params?.student?.studentName || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    averagePct: '0%',
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
  });
  const [attendanceMap, setAttendanceMap] = useState({});
  const [monthlyData, setMonthlyData] = useState({});
  const [hasData, setHasData] = useState(false);

  // Fetch student attendance summary from backend
  const fetchAttendanceData = async () => {
    try {
      // Validate required parameters
      if (!resolvedStudentId?.trim() || !resolvedInstituteId?.trim()) {
        setError('Missing student or institute ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setHasData(false);

      const year = new Date().getFullYear();
      const url = `/api/attendance/student/${resolvedStudentId}/summary?instituteId=${resolvedInstituteId}&year=${year}`;
      
      const { response: fetchResponse } = await fetchWithBaseUrlFallback(url, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!fetchResponse?.ok) {
        throw new Error(`Server returned ${fetchResponse?.status}`);
      }

      const summaryData = await fetchResponse.json();

      if (!summaryData) {
        throw new Error('Empty response from server');
      }

      // Destructure summary data
      const { attendanceMap: map, counts, monthly } = summaryData;

      // Update attendance map for calendar
      const populatedMap = map && Object.keys(map).length > 0 ? map : {};
      setAttendanceMap(populatedMap);
      setMonthlyData(monthly || {});

      // Calculate and update stats
      const totalDays = counts?.total || 0;
      const presentDays = counts?.present || 0;

      setStats({
        averagePct: totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : '0%',
        totalPresent: presentDays,
        totalAbsent: counts?.absent || 0,
        totalLate: counts?.leave || 0,
      });

      setHasData(true);
    } catch (err) {
      const message = err?.message || 'Failed to fetch attendance';
      setError(message);
      console.error('Attendance fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAttendanceData();
  }, [resolvedStudentId, resolvedInstituteId]);

  return (
    <SafeAreaView style={styles.safe}>
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.reportLabel}>ATTENDANCE REPORT</Text>
            <Text style={styles.greeting}>Welcome, {resolvedStudentName || 'Student'}.</Text>
          </View>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color={C.indigo} />
            <Text style={{ marginTop: 16, color: C.muted, fontSize: 14, fontWeight: '500' }}>
              Loading attendance data...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={{ backgroundColor: C.redLight, borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: C.red }}>
            <Text style={{ color: C.red, fontSize: 13, fontWeight: '600' }}>⚠ Error</Text>
            <Text style={{ color: C.red, fontSize: 12, marginTop: 4 }}>{error}</Text>
          </View>
        )}

        {/* Always Show UI - Stats + Calendar Row */}
        {!loading && (
          <>
            <View style={[styles.row, !isTablet && styles.rowColumn]}>
              {/* Stats Card */}
              <View style={[styles.card, styles.statsCard, !isTablet && styles.fullWidth]}>
                <Text style={styles.statsLabel}>Overall Attendance</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statsValue}>{stats.averagePct}</Text>
                  <View style={styles.statsBadge}>
                    <Text style={styles.statsBadgeText}>Year to Date</Text>
                  </View>
                </View>
                <View style={styles.statsSubRow}>
                  <TouchableOpacity activeOpacity={0.8} style={[styles.statsPill, styles.statsPillGreen]}>
                    <Text style={styles.statsPillTop}>PRESENT</Text>
                    <Text style={styles.statsPillVal}>
                      {stats.totalPresent} <Text style={styles.statsPillUnit}>days</Text>
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.8} style={[styles.statsPill, styles.statsPillRed]}>
                    <Text style={styles.statsPillTop}>ABSENT</Text>
                    <Text style={[styles.statsPillVal, { color: C.red }]}>
                      {stats.totalAbsent} <Text style={styles.statsPillUnit}>days</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Calendar */}
              <View style={[!isTablet && styles.fullWidth, isTablet && styles.calendarWrapper]}>
                <AttendanceCalendar attendanceMap={attendanceMap} />
              </View>
            </View>

            {/* Curator Card */}
            <View style={[styles.row, !isTablet && styles.rowColumn]}>
              <View style={[!isTablet && styles.fullWidth, isTablet && styles.curatorWrapper]}>
                <CuratorsNote />
              </View>
            </View>

            {/* Empty State Message - Only show if no data and no error */}
            {!hasData && !error && (
              <View style={{ backgroundColor: C.indigoLight, borderRadius: 12, padding: 14, marginTop: 8 }}>
                <Text style={{ color: C.indigo, fontSize: 13, fontWeight: '600' }}>ℹ No attendance records yet</Text>
                <Text style={{ color: C.indigo, fontSize: 12, marginTop: 4 }}>
                  Attendance records will appear here once they are marked by your instructor.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal */}
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
  statsCard: { flex: isTablet ? 1 : undefined, minWidth: isTablet ? 250 : undefined },
  statsLabel: { fontSize: 13, color: C.muted, fontWeight: '500', marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  statsValue: { fontSize: 40, fontWeight: '800', color: C.dark, letterSpacing: -1.5 },
  statsBadge: { backgroundColor: C.greenLight, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statsBadgeText: { fontSize: 12, color: C.green, fontWeight: '700' },
  statsSubRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statsPill: { flex: 1, minWidth: 100, borderRadius: 12, padding: 12 },
  statsPillGreen: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  statsPillRed: { backgroundColor: C.redLight, borderWidth: 1, borderColor: '#FECACA' },
  statsPillLate: { backgroundColor: '#FEFCE8', borderWidth: 1, borderColor: '#FEF08A' },
  statsPillTop: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, marginBottom: 4 },
  statsPillVal: { fontSize: 20, fontWeight: '800', color: C.dark },
  statsPillUnit: { fontSize: 13, fontWeight: '400', color: C.muted },

  // Calendar
  calendarWrapper: { flex: isTablet ? 1.5 : undefined },
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