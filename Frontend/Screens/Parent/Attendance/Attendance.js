import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

// ─── Helper to fetch student by name ──────────────────────────────────────────
async function fetchStudentIdByName(studentName, instituteId) {
  try {
    const { response } = await fetchWithBaseUrlFallback(
      `/api/students?instituteId=${encodeURIComponent(instituteId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response?.ok) return null;

    const students = await response.json();
    if (!Array.isArray(students)) return null;

    // Find student by name
    const student = students.find(s => 
      s.fullName?.toLowerCase() === studentName?.toLowerCase() ||
      s.studentName?.toLowerCase() === studentName?.toLowerCase() ||
      s.name?.toLowerCase() === studentName?.toLowerCase()
    );

    return student?._id || null;
  } catch (err) {
    console.error('Error fetching student ID by name:', err);
    return null;
  }
}

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  bg:          '#F4F4F8',
  white:       '#FFFFFF',
  indigo:      '#4F46E5',
  indigoLight: '#EEF2FF',
  indigoMuted: '#818CF8',
  dark:        '#1E1B4B',
  darkCard:    '#1A1A2E',
  text:        '#374151',
  muted:       '#9CA3AF',
  red:         '#EF4444',
  green:       '#10B981',
  greenLight:  '#D1FAE5',
  redLight:    '#FEE2E2',
  border:      '#E5E7EB',
  dot_present: '#4F46E5',
  dot_absent:  '#EF4444',
  dot_late:    '#F59E0B',
  overlay:     'rgba(0,0,0,0.5)',
};

// ─── Calendar Helpers ─────────────────────────────────────────────────────────
const generateCalendarRows = (year, month, attendanceMap = {}) => {
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const rows = [];
  let row = [];
  for (let i = 0; i < firstDay; i++) row.push({ day: null, dot: null });
  for (let day = 1; day <= lastDate; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = attendanceMap[dateStr] || null;
    row.push({ day, dot: status });
    if (row.length === 7) { rows.push(row); row = []; }
  }
  while (row.length > 0 && row.length < 7) row.push({ day: null, dot: null });
  if (row.length > 0) rows.push(row);
  return rows;
};

const DAYS_HEADER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── Attendance Calendar ──────────────────────────────────────────────────────
function AttendanceCalendar({ attendanceMap = {} }) {
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year,       setYear]       = useState(now.getFullYear());

  useEffect(() => {
    const dates = Object.keys(attendanceMap)
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => b - a);
    if (dates.length > 0) {
      setMonthIndex(dates[0].getMonth());
      setYear(dates[0].getFullYear());
    }
  }, [attendanceMap]);

  const goBack = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); }
    else setMonthIndex(m => m - 1);
  };
  const goNext = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); }
    else setMonthIndex(m => m + 1);
  };

  const calendarRows = generateCalendarRows(year, monthIndex, attendanceMap);
  const monthLabel   = new Date(year, monthIndex).toLocaleString('default', { month: 'long', year: 'numeric' });

  const getDayTone = (status) => {
    if (status === 'present') return { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', textColor: '#047857' };
    if (status === 'absent')  return { backgroundColor: '#FEF2F2', borderColor: '#FECACA', textColor: '#B91C1C' };
    if (status === 'leave' || status === 'late') return { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', textColor: '#B45309' };
    return { backgroundColor: 'transparent', borderColor: 'transparent', textColor: C.text };
  };

  return (
    <View style={styles.card}>
      <View style={styles.calHeader}>
        <Text style={styles.calTitle}>Attendance Calendar</Text>
        <View style={styles.calNav}>
          <TouchableOpacity activeOpacity={0.7} style={styles.calArrow} onPress={goBack}>
            <Text style={styles.calArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calMonth}>{monthLabel}</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.calArrow} onPress={goNext}>
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
            const tone = cell.day !== null ? getDayTone(cell.dot) : null;
            return (
              <View
                key={ci}
                style={[
                  styles.calCell,
                  cell.day !== null && tone?.backgroundColor !== 'transparent' && {
                    backgroundColor: tone.backgroundColor,
                    borderWidth: 1,
                    borderColor: tone.borderColor,
                  },
                ]}
              >
                {cell.day !== null && (
                  <Text style={[styles.calDayNum, { color: tone?.textColor || C.text }]}>
                    {cell.day}
                  </Text>
                )}
              </View>
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

// ─── Curator's Note ───────────────────────────────────────────────────────────
function CuratorsNote() {
  return (
    <View style={styles.curatorCard}>
      <Text style={styles.curatorTitle}>Parent's Note</Text>
      <Text style={styles.curatorBody}>
        Your ward's attendance data is pulled live from the database. Use the calendar
        above to review present and absent days, and the summary card for the current
        attendance rate.
      </Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ParentAttendance({ parent: parentProp, instituteId: instituteIdProp, route }) {
  const parentProfile = parentProp || route?.params?.parent || {};

  // Helper: treat "None" and empty string as missing
  const valid = (v) => v && v !== 'None' ? v : null;

  const resolvedInstituteId =
    valid(route?.params?.student?.instituteId) ||
    valid(route?.params?.instituteId) ||
    valid(instituteIdProp) ||
    valid(parentProfile?.instituteId) ||
    '';

  const rawStudentId =
    valid(route?.params?.student?._id) ||
    valid(route?.params?.student?.id) ||
    valid(route?.params?.student?.studentId) ||
    valid(route?.params?.studentId) ||
    valid(parentProfile?.studentId) ||
    '';

  const studentName = route?.params?.student?.fullName || parentProfile?.studentName || parentProfile?.studentId || 'your ward';
  const parentName  = parentProfile?.parentName  || 'Parent';

  // API state
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [stats,         setStats]         = useState({ averagePct: '0%', totalPresent: 0, totalAbsent: 0, totalLate: 0 });
  const [attendanceMap, setAttendanceMap] = useState({});
  const [hasData,       setHasData]       = useState(false);
  const [resolvedStudentId, setResolvedStudentId] = useState(rawStudentId);

  // Modal state (message teacher)
  const [messageVisible, setMessageVisible] = useState(false);
  const [msgSubject,     setMsgSubject]     = useState('');
  const [msgText,        setMsgText]        = useState('');
  const [msgSent,        setMsgSent]        = useState(false);
  const [msgSending,     setMsgSending]     = useState(false);

  // ── Resolve student ID if it's a name ─────────────────────────────────────
  useEffect(() => {
    const resolveStudentId = async () => {
      if (!rawStudentId?.trim() || !resolvedInstituteId?.trim()) {
        setResolvedStudentId('');
        return;
      }

      // Check if rawStudentId looks like a MongoDB ID (24 hex chars)
      const isMongoId = /^[a-f0-9]{24}$/.test(rawStudentId);
      if (isMongoId) {
        setResolvedStudentId(rawStudentId);
        return;
      }

      // It's a name, try to fetch the actual student ID
      console.log('Student ID is a name, fetching actual ID:', rawStudentId);
      const actualId = await fetchStudentIdByName(rawStudentId, resolvedInstituteId);
      if (actualId) {
        console.log('Resolved student name to ID:', actualId);
        setResolvedStudentId(actualId);
      } else {
        console.warn('Could not resolve student name to ID:', rawStudentId);
        setResolvedStudentId('');
      }
    };

    resolveStudentId();
  }, [rawStudentId, resolvedInstituteId]);

  // ── Fetch attendance data ─────────────────────────────────────────────────
  const fetchAttendanceData = async () => {
    try {
      if (!resolvedStudentId?.trim() || !resolvedInstituteId?.trim()) {
        const errorMsg = `Missing student or institute information. 
StudentId: ${resolvedStudentId || 'EMPTY'}, 
InstituteId: ${resolvedInstituteId || 'EMPTY'}`;
        console.error(errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setHasData(false);

      const year = new Date().getFullYear();
      const url  = `/api/attendance/student/${resolvedStudentId}/summary?instituteId=${resolvedInstituteId}&year=${year}`;
      
      // Debug log
      console.log('Parent Attendance Fetch:', { resolvedStudentId, resolvedInstituteId, year, url });
      console.log('Route params student:', route?.params?.student);
      console.log('Parent profile:', parentProfile);

      const { response: fetchResponse } = await fetchWithBaseUrlFallback(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!fetchResponse?.ok) {
        const errorText = await fetchResponse.text();
        console.error('Attendance API Error:', fetchResponse.status, errorText);
        throw new Error(`Server returned ${fetchResponse?.status}: ${errorText}`);
      }

      const summaryData = await fetchResponse.json();
      if (!summaryData) throw new Error('Empty response from server');

      const { attendanceMap: map, counts } = summaryData;

      const populatedMap = map && Object.keys(map).length > 0 ? map : {};
      setAttendanceMap(populatedMap);

      const totalDays   = counts?.total   || 0;
      const presentDays = counts?.present || 0;

      setStats({
        averagePct:   totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : '0%',
        totalPresent: presentDays,
        totalAbsent:  counts?.absent || 0,
        totalLate:    counts?.leave  || 0,
      });

      setHasData(true);
      console.log('Attendance data loaded successfully:', { totalDays, presentDays });
    } catch (err) {
      console.error('Attendance fetch error:', err);
      setError(err?.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [resolvedStudentId, resolvedInstituteId]);

  // ── Send message to teacher ───────────────────────────────────────────────
  async function sendMessage() {
    if (!msgSubject.trim()) { Alert.alert('Please enter a subject.'); return; }
    if (!msgText.trim())    { Alert.alert('Please enter a message.'); return; }

    setMsgSending(true);
    try {
      const { response } = await fetchWithBaseUrlFallback('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId:  resolvedInstituteId || 'parent-messages',
          senderId:     parentProfile?.parentId || parentProfile?.parentName || 'parent',
          senderName:   parentName,
          senderRole:   'parent',
          receiverRole: 'teacher',
          subject:      msgSubject.trim(),
          content:      msgText.trim(),
          messageType:  'personal',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        Alert.alert('Message not sent', payload?.message || 'Failed to save message');
        return;
      }
      setMsgSent(true);
    } catch (err) {
      Alert.alert('Network error', err?.message || 'Could not save your message');
    } finally {
      setMsgSending(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportLabel}>ATTENDANCE REPORT</Text>
            <Text style={styles.greeting}>{studentName}'s Attendance</Text>
          </View>
          <TouchableOpacity
            style={styles.msgBtn}
            onPress={() => { setMessageVisible(true); setMsgSent(false); setMsgSubject(''); setMsgText(''); }}
            activeOpacity={0.85}
          >
            <Text style={styles.msgBtnText}>✉ Message Teacher</Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.centreBox}>
            <ActivityIndicator size="large" color={C.indigo} />
            <Text style={styles.loadingText}>Loading attendance data…</Text>
          </View>
        )}

        {/* Error */}
        {error !== '' && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>⚠ Error</Text>
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        )}

        {/* Main content */}
        {!loading && (
          <>
            {/* Stats + Calendar */}
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
                  <View style={[styles.statsPill, styles.statsPillGreen]}>
                    <Text style={styles.statsPillTop}>PRESENT</Text>
                    <Text style={styles.statsPillVal}>
                      {stats.totalPresent} <Text style={styles.statsPillUnit}>days</Text>
                    </Text>
                  </View>
                  <View style={[styles.statsPill, styles.statsPillRed]}>
                    <Text style={styles.statsPillTop}>ABSENT</Text>
                    <Text style={[styles.statsPillVal, { color: C.red }]}>
                      {stats.totalAbsent} <Text style={styles.statsPillUnit}>days</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Calendar */}
              <View style={[!isTablet && styles.fullWidth, isTablet && styles.calendarWrapper]}>
                <AttendanceCalendar attendanceMap={attendanceMap} />
              </View>
            </View>

            {/* Curator note */}
            <View style={[styles.row, !isTablet && styles.rowColumn]}>
              <View style={[!isTablet && styles.fullWidth, isTablet && styles.curatorWrapper]}>
                <CuratorsNote />
              </View>
            </View>

            {/* No data notice */}
            {!hasData && !error && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>ℹ No attendance records yet</Text>
                <Text style={styles.emptyMsg}>
                  Attendance records will appear here once they are marked by the instructor.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Message Teacher Modal ── */}
      <Modal
        visible={messageVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMessageVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isTablet && styles.modalBoxTablet]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✉ Message Teacher</Text>
              <TouchableOpacity onPress={() => setMessageVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {msgSent ? (
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successTitle}>Message Sent!</Text>
                <Text style={styles.successDesc}>
                  Your message has been delivered. The teacher typically responds within 24 hours.
                </Text>
                <TouchableOpacity
                  style={[styles.btnPrimary, { marginTop: 20, alignSelf: 'stretch' }]}
                  onPress={() => setMessageVisible(false)}
                >
                  <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Absence on Oct 5"
                  placeholderTextColor={C.muted}
                  value={msgSubject}
                  onChangeText={setMsgSubject}
                />
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Type your message here…"
                  placeholderTextColor={C.muted}
                  multiline
                  numberOfLines={5}
                  value={msgText}
                  onChangeText={setMsgText}
                />
                <TouchableOpacity
                  style={[styles.btnPrimary, { marginTop: 16, alignSelf: 'stretch', opacity: msgSending ? 0.7 : 1 }]}
                  onPress={sendMessage}
                  disabled={msgSending}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>
                    {msgSending ? 'Sending…' : 'Send Message'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  scroll:        { flex: 1 },
  scrollContent: { padding: isTablet ? 28 : 16, gap: 20 },

  // Header
  pageHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    flexWrap:       'wrap',
    gap:            12,
    marginBottom:   4,
  },
  reportLabel: { fontSize: 11, fontWeight: '700', color: C.indigo, letterSpacing: 1.5, marginBottom: 4 },
  greeting:    { fontSize: isTablet ? 30 : 22, fontWeight: '800', color: C.dark, letterSpacing: -0.8 },
  msgBtn: {
    backgroundColor: C.indigo,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  msgBtnText: { color: C.white, fontWeight: '700', fontSize: 13 },

  // Loading / error / empty
  centreBox:   { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, color: C.muted, fontSize: 14, fontWeight: '500' },
  errorBox: {
    backgroundColor: C.redLight, borderRadius: 12, padding: 14,
    marginBottom: 16, borderLeftWidth: 4, borderLeftColor: C.red,
  },
  errorTitle: { color: C.red, fontSize: 13, fontWeight: '600' },
  errorMsg:   { color: C.red, fontSize: 12, marginTop: 4 },
  emptyBox: {
    backgroundColor: C.indigoLight, borderRadius: 12, padding: 14, marginTop: 8,
  },
  emptyTitle: { color: C.indigo, fontSize: 13, fontWeight: '600' },
  emptyMsg:   { color: C.indigo, fontSize: 12, marginTop: 4 },

  // Layout
  row:             { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  rowColumn:       { flexDirection: 'column' },
  fullWidth:       { width: '100%' },
  calendarWrapper: { flex: isTablet ? 1.5 : undefined },
  curatorWrapper:  { flex: 1 },

  // Card base
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
  statsCard:       { flex: isTablet ? 1 : undefined, minWidth: isTablet ? 250 : undefined },
  statsLabel:      { fontSize: 13, color: C.muted, fontWeight: '500', marginBottom: 6 },
  statsRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  statsValue:      { fontSize: 40, fontWeight: '800', color: C.dark, letterSpacing: -1.5 },
  statsBadge:      { backgroundColor: C.greenLight, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statsBadgeText:  { fontSize: 12, color: C.green, fontWeight: '700' },
  statsSubRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statsPill:       { flex: 1, minWidth: 100, borderRadius: 12, padding: 12 },
  statsPillGreen:  { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  statsPillRed:    { backgroundColor: C.redLight, borderWidth: 1, borderColor: '#FECACA' },
  statsPillTop:    { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, marginBottom: 4 },
  statsPillVal:    { fontSize: 20, fontWeight: '800', color: C.dark },
  statsPillUnit:   { fontSize: 13, fontWeight: '400', color: C.muted },

  // Calendar
  calHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  calTitle:     { fontSize: 16, fontWeight: '700', color: C.dark },
  calNav:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calArrow:     { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  calArrowText: { fontSize: 16, color: C.text, fontWeight: '600' },
  calMonth:     { fontSize: 13, fontWeight: '700', color: C.dark, minWidth: isTablet ? 130 : 110, textAlign: 'center' },
  calRow:       { flexDirection: 'row', marginBottom: 4 },
  calCell:      { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 10 },
  calDayHeader: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },
  calDayNum:    { fontSize: 13, fontWeight: '600', color: C.text },
  calLegend:    { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 12 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendLabel:  { fontSize: 12, color: C.muted },

  // Curator card
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
  curatorBody:  { fontSize: 13, color: '#A0AEC0', lineHeight: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '92%',
  },
  modalBoxTablet: {
    borderRadius: 20, maxWidth: 560, alignSelf: 'center',
    marginBottom: 60, width: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:  { fontSize: 18, fontWeight: '800', color: C.dark },
  modalClose:  { fontSize: 20, color: C.muted, fontWeight: '600' },

  // Message form
  inputLabel: { fontSize: 12, fontWeight: '600', color: C.muted, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: C.text, backgroundColor: '#FAFAFA',
  },
  inputMulti: { height: 120, textAlignVertical: 'top' },

  // Primary button
  btnPrimary:     { backgroundColor: C.indigo, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 },
  btnPrimaryText: { color: C.white, fontWeight: '700', fontSize: 13 },

  // Success state
  successBox:   { alignItems: 'center', paddingVertical: 20 },
  successIcon:  { fontSize: 48, color: C.green },
  successTitle: { fontSize: 22, fontWeight: '800', color: C.dark, marginTop: 12 },
  successDesc:  { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 21 },
});