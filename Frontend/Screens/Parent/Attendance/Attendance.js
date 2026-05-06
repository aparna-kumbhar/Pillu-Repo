import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  Alert,
  Switch,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isLaptop = SCREEN_WIDTH >= 768;

// ─── Data ────────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Attendance data per month (year 2023-2024)
const ATTENDANCE_DATA = {
  '2023-0': {},
  '2023-1': {},
  '2023-2': {},
  '2023-3': {},
  '2023-4': {},
  '2023-5': {},
  '2023-6': {},
  '2023-7': {},
  '2023-8': { 4: 'absent', 11: 'holiday' },
  '2023-9': { 5: 'absent', 10: 'holiday' }, // October (month index 9)
  '2023-10': { 3: 'absent', 23: 'holiday' },
  '2023-11': {},
  '2024-0': { 1: 'absent', 15: 'holiday' },
  '2024-1': { 14: 'holiday' },
  '2024-2': {},
  '2024-3': {},
  '2024-4': {},
  '2024-5': {},
  '2024-6': {},
  '2024-7': {},
  '2024-8': {},
  '2024-9': {},
  '2024-10': {},
  '2024-11': {},
};

const SUBJECTS = [
  { name: 'Mathematics', pct: 90, color: '#6C63FF' },
  { name: 'Physics',     pct: 100, color: '#6C63FF' },
  { name: 'History',     pct: 92,  color: '#6C63FF' },
];

const SMART_ALERTS = [
  { id: 1, title: 'Attendance Drop Alert', desc: "Sarah's attendance dropped below 95% this month.", icon: '⚠️', enabled: true },
  { id: 2, title: 'Weekly Summary',        desc: 'Receive a summary every Monday morning.',          icon: '📋', enabled: false },
  { id: 3, title: 'Absence Notification',  desc: 'Get notified immediately on any absence.',          icon: '🔔', enabled: true },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  // 0=Sun…6=Sat → remap to Mon-start: Mon=0…Sun=6
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7;
}

function buildCalendarGrid(year, month) {
  const days = getDaysInMonth(year, month);
  const startOffset = getFirstDayOfWeek(year, month);
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

function dayStatus(year, month, day) {
  const key = `${year}-${month}`;
  const data = ATTENDANCE_DATA[key] || {};
  // Weekend → no school
  const dow = new Date(year, month, day).getDay();
  if (dow === 0 || dow === 6) return 'weekend';
  if (data[day]) return data[day];
  if (day > new Date().getDate() && year >= new Date().getFullYear() && month >= new Date().getMonth()) return 'future';
  return 'present';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ pct, color }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

function CalendarDay({ day, status }) {
  if (!day) return <View style={styles.calEmpty} />;

  const isWeekend = status === 'weekend';
  const isFuture  = status === 'future';

  const containerStyle = [
    styles.calDay,
    status === 'present' && styles.calPresent,
    status === 'absent'  && styles.calAbsent,
    status === 'holiday' && styles.calHoliday,
    isWeekend && styles.calWeekend,
    isFuture  && styles.calFuture,
  ];

  const labelMap = { present: 'PRESENT', absent: 'ABSENT', holiday: 'HOLIDAY' };
  const label = labelMap[status];

  const textColor = status === 'absent' ? '#E53935' : status === 'holiday' ? '#5C6BC0' : '#2E7D32';

  return (
    <View style={containerStyle}>
      <Text style={[styles.calDayNum, (isWeekend || isFuture) && { color: '#9E9E9E' }, !isWeekend && !isFuture && { color: textColor }]}>
        {day}
      </Text>
      {label && <Text style={[styles.calLabel, { color: textColor }]}>{label}</Text>}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AttendanceTracking({ route }) {
  const parentProfile = route?.params?.parent || {};
  const instituteId = route?.params?.instituteId || parentProfile?.instituteId || parentProfile?.createdBy?.instituteId || 'parent-messages';
  const senderId = parentProfile?.parentId || parentProfile?.studentName || parentProfile?.parentName || 'parent';
  const senderName = parentProfile?.parentName || parentProfile?.studentName || 'Parent';
  const receiverId = route?.params?.teacherId || route?.params?.teacher?.teacherId || 'mrs-thompson';
  const receiverName = route?.params?.teacherName || route?.params?.teacher?.fullName || 'Mrs. Thompson';
  // Calendar state — start at October 2023
  const [calYear,  setCalYear]  = useState(2023);
  const [calMonth, setCalMonth] = useState(9);

  // Modal states
  const [reportVisible,  setReportVisible]  = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [rsvpVisible,    setRsvpVisible]    = useState(false);
  const [rsvpDone,       setRsvpDone]       = useState(false);

  // Smart alerts toggle
  const [alerts, setAlerts] = useState(SMART_ALERTS);

  // Message form
  const [msgSubject, setMsgSubject] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgSent, setMsgSent] = useState(false);

  // RSVP form
  const [rsvpName,    setRsvpName]    = useState('');
  const [rsvpConfirm, setRsvpConfirm] = useState('yes');

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  function toggleAlert(id) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }

  async function sendMessage() {
    if (!msgSubject.trim()) {
      Alert.alert('Please enter a subject.');
      return;
    }

    if (!msgText.trim()) { Alert.alert('Please enter a message.'); return; }

    try {
      const { response } = await fetchWithBaseUrlFallback('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId,
          senderId,
          senderName,
          senderRole: 'parent',
          receiverId,
          receiverName,
          receiverRole: 'teacher',
          subject: msgSubject.trim(),
          content: msgText.trim(),
          messageType: 'personal',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        Alert.alert('Message not sent', payload?.message || 'Failed to save message');
        return;
      }

      setMsgSent(true);
    } catch (error) {
      Alert.alert('Network error', error?.message || 'Could not save your message');
    }
  }

  function submitRsvp() {
    if (!rsvpName.trim()) { Alert.alert('Please enter your name.'); return; }
    setRsvpDone(true);
  }

  const grid = buildCalendarGrid(calYear, calMonth);

  // Stats for current month
  const key = `${calYear}-${calMonth}`;
  const monthData = ATTENDANCE_DATA[key] || {};
  const totalDays = getDaysInMonth(calYear, calMonth);
  const weekendDays = Array.from({ length: totalDays }, (_, i) => i + 1)
    .filter(d => { const dow = new Date(calYear, calMonth, d).getDay(); return dow === 0 || dow === 6; }).length;
  const schoolDays = totalDays - weekendDays;
  const absentDays = Object.values(monthData).filter(v => v === 'absent').length;
  const holidayDays = Object.values(monthData).filter(v => v === 'holiday').length;
  const presentDays = schoolDays - absentDays - holidayDays;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={[styles.header, isLaptop && styles.headerLaptop]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Attendance Tracking</Text>
            <Text style={styles.pageSubtitle}>Detailed insights for Sarah's academic presence.</Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.btnOutline} onPress={() => setReportVisible(true)}>
              <Text style={styles.btnOutlineText}>⬇ Download Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => { setMessageVisible(true); setMsgSent(false); setMsgText(''); }}>
              <Text style={styles.btnPrimaryText}>✉ Message Teacher</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats + Calendar row ── */}
        <View style={[styles.row, isLaptop && styles.rowLaptop]}>

          {/* Overall Presence */}
          <View style={[styles.card, isLaptop && styles.cardHalf]}>
            <Text style={styles.cardLabel}>OVERALL PRESENCE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 }}>
              <Text style={styles.bigStat}>94.2%</Text>
              <Text style={styles.statBadge}> ↑1.4%</Text>
            </View>
            <Text style={styles.statNote}>Above school average (91%)</Text>

            <View style={[styles.divider, { marginVertical: 20 }]} />

            {/* Subject Breakdown */}
            <Text style={styles.sectionTitle}>Subject Breakdown</Text>
            {SUBJECTS.map(s => (
              <View key={s.name} style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.subjectName}>{s.name}</Text>
                  <Text style={styles.subjectPct}>{s.pct}%</Text>
                </View>
                <ProgressBar pct={s.pct} color={s.color} />
              </View>
            ))}
          </View>

          {/* Attendance Calendar */}
          <View style={[styles.card, isLaptop && styles.cardFlex]}>
            <View style={styles.calHeader}>
              <View>
                <Text style={styles.sectionTitle}>Attendance Calendar</Text>
                <Text style={styles.calMonthLabel}>{MONTHS[calMonth]} {calYear}</Text>
              </View>
              <View style={styles.calNavRow}>
                <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
                  <Text style={styles.navBtnText}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
                  <Text style={styles.navBtnText}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Day headers */}
            <View style={styles.calGrid}>
              {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
                <View key={d} style={styles.calEmpty}>
                  <Text style={styles.calDayHeader}>{d}</Text>
                </View>
              ))}
              {grid.map((day, i) => (
                <CalendarDay key={i} day={day} status={day ? dayStatus(calYear, calMonth, day) : null} />
              ))}
            </View>

            {/* Legend */}
            <View style={styles.calLegend}>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#4CAF50' }]} /><Text style={styles.legendText}>Present ({presentDays} days)</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#E53935' }]} /><Text style={styles.legendText}>Absent ({absentDays} day{absentDays !== 1 ? 's' : ''})</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#5C6BC0' }]} /><Text style={styles.legendText}>Holiday ({holidayDays} day{holidayDays !== 1 ? 's' : ''})</Text></View>
            </View>
          </View>
        </View>

        {/* ── Bottom row ── */}
        <View style={[styles.row, isLaptop && styles.rowLaptop]}>

          {/* Smart Alerts */}
          <View style={[styles.card, isLaptop && styles.cardHalf]}>
            <Text style={styles.sectionTitle}>🔔 Smart Alerts</Text>
            <Text style={styles.cardSubtext}>Automated notifications to keep you informed.</Text>
            {alerts.map(alert => (
              <View key={alert.id} style={styles.alertRow}>
                <View style={styles.alertIcon}><Text style={{ fontSize: 20 }}>{alert.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDesc}>{alert.desc}</Text>
                </View>
                <Switch
                  value={alert.enabled}
                  onValueChange={() => toggleAlert(alert.id)}
                  trackColor={{ false: '#E0E0E0', true: '#C5CAE9' }}
                  thumbColor={alert.enabled ? '#6C63FF' : '#BDBDBD'}
                />
              </View>
            ))}
          </View>

          {/* Upcoming Parent Meeting */}
          <View style={[styles.card, isLaptop && styles.cardHalf, { backgroundColor: '#6C63FF' }]}>
            <View style={styles.meetingIconWrap}>
              <Text style={{ fontSize: 32 }}>💡</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: '#fff', marginTop: 12 }]}>Upcoming Parent Meeting</Text>
            <Text style={[styles.cardSubtext, { color: 'rgba(255,255,255,0.8)', marginBottom: 16 }]}>
              Schedule a meeting with Sarah's homeroom teacher to discuss academic progress.
            </Text>
            <View style={styles.meetingDetail}>
              <Text style={styles.meetingDetailText}>📅 November 15, 2023</Text>
            </View>
            <View style={styles.meetingDetail}>
              <Text style={styles.meetingDetailText}>🕑 2:00 PM – 3:00 PM</Text>
            </View>
            <View style={styles.meetingDetail}>
              <Text style={styles.meetingDetailText}>📍 Room 204, Main Building</Text>
            </View>

            {rsvpDone ? (
              <View style={[styles.btnRsvp, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.btnRsvpText}>✓ RSVP Confirmed!</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.btnRsvp} onPress={() => setRsvpVisible(true)}>
                <Text style={styles.btnRsvpText}>RSVP Now →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

      </ScrollView>

      {/* ────── MODAL: Download Report ────── */}
      <Modal visible={reportVisible} animationType="slide" transparent onRequestClose={() => setReportVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isLaptop && styles.modalBoxLaptop]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📄 Attendance Report</Text>
              <TouchableOpacity onPress={() => setReportVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reportSection}>
              <Text style={styles.reportStudentName}>Sarah Johnson</Text>
              <Text style={styles.reportPeriod}>Academic Year 2023–2024  |  October 2023</Text>
            </View>

            <View style={styles.reportStatsRow}>
              {[
                { label: 'Overall Presence', value: '94.2%', color: '#6C63FF' },
                { label: 'Days Present',     value: '18',     color: '#4CAF50' },
                { label: 'Days Absent',      value: '1',      color: '#E53935' },
                { label: 'Holidays',         value: '1',      color: '#5C6BC0' },
              ].map(s => (
                <View key={s.label} style={styles.reportStatCard}>
                  <Text style={[styles.reportStatValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.reportStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Subject-wise Attendance</Text>
            {SUBJECTS.map(s => (
              <View key={s.name} style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.subjectName}>{s.name}</Text>
                  <Text style={styles.subjectPct}>{s.pct}%</Text>
                </View>
                <ProgressBar pct={s.pct} color={s.color} />
              </View>
            ))}

            <Text style={[styles.cardSubtext, { marginTop: 16, fontStyle: 'italic' }]}>
              Note: This report is generated automatically from the system records.
            </Text>

            <TouchableOpacity
              style={[styles.btnPrimary, { marginTop: 20, alignSelf: 'stretch' }]}
              onPress={() => { Alert.alert('Download Started', 'attendance_report_sarah_oct2023.pdf is being downloaded.'); setReportVisible(false); }}>
              <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>⬇ Download PDF Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ────── MODAL: Message Teacher ────── */}
      <Modal visible={messageVisible} animationType="slide" transparent onRequestClose={() => setMessageVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isLaptop && styles.modalBoxLaptop]}>
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
                <Text style={styles.successDesc}>Your message has been delivered to Mrs. Thompson. She typically responds within 24 hours.</Text>
                <TouchableOpacity style={[styles.btnPrimary, { marginTop: 20, alignSelf: 'stretch' }]} onPress={() => setMessageVisible(false)}>
                  <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.teacherCard}>
                  <View style={styles.teacherAvatar}><Text style={{ fontSize: 22 }}>👩‍🏫</Text></View>
                  <View>
                    <Text style={styles.teacherName}>Mrs. Thompson</Text>
                    <Text style={styles.teacherRole}>Homeroom Teacher  |  Usually replies in 1 day</Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Absence on Oct 5"
                  placeholderTextColor="#BDBDBD"
                  value={msgSubject}
                  onChangeText={setMsgSubject}
                />

                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Type your message here..."
                  placeholderTextColor="#BDBDBD"
                  multiline
                  numberOfLines={5}
                  value={msgText}
                  onChangeText={setMsgText}
                />

                <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16, alignSelf: 'stretch' }]} onPress={sendMessage}>
                  <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>Send Message</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ────── MODAL: RSVP ────── */}
      <Modal visible={rsvpVisible} animationType="slide" transparent onRequestClose={() => setRsvpVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isLaptop && styles.modalBoxLaptop]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 RSVP – Parent Meeting</Text>
              <TouchableOpacity onPress={() => setRsvpVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {rsvpDone ? (
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successTitle}>RSVP Confirmed!</Text>
                <Text style={styles.successDesc}>
                  We look forward to seeing you on{'\n'}November 15 at 2:00 PM in Room 204.
                </Text>
                <TouchableOpacity style={[styles.btnPrimary, { marginTop: 20, alignSelf: 'stretch' }]} onPress={() => setRsvpVisible(false)}>
                  <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.rsvpInfo}>
                  <Text style={styles.rsvpInfoLine}>📅 November 15, 2023</Text>
                  <Text style={styles.rsvpInfoLine}>🕑 2:00 PM – 3:00 PM</Text>
                  <Text style={styles.rsvpInfoLine}>📍 Room 204, Main Building</Text>
                </View>

                <Text style={styles.inputLabel}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mr. & Mrs. Johnson"
                  placeholderTextColor="#BDBDBD"
                  value={rsvpName}
                  onChangeText={setRsvpName}
                />

                <Text style={styles.inputLabel}>Attendance</Text>
                <View style={styles.rsvpToggleRow}>
                  {['yes','no','maybe'].map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.rsvpToggle, rsvpConfirm === opt && styles.rsvpToggleActive]}
                      onPress={() => setRsvpConfirm(opt)}>
                      <Text style={[styles.rsvpToggleText, rsvpConfirm === opt && { color: '#fff' }]}>
                        {opt === 'yes' ? '✓ Yes' : opt === 'no' ? '✕ No' : '? Maybe'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Additional Notes (optional)</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Any questions or special requests..."
                  placeholderTextColor="#BDBDBD"
                  multiline
                />

                <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16, alignSelf: 'stretch' }]} onPress={submitRsvp}>
                  <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>Confirm RSVP</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const C = {
  bg:        '#F5F6FA',
  card:      '#FFFFFF',
  primary:   '#6C63FF',
  text:      '#1A1A2E',
  textLight: '#757575',
  border:    '#E8E8F0',
  present:   '#E8F5E9',
  absent:    '#FFEBEE',
  holiday:   '#E8EAF6',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: isLaptop ? 32 : 16, paddingBottom: 48 },

  // ── Header
  header: { marginBottom: 24 },
  headerLaptop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageTitle: { fontSize: isLaptop ? 36 : 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, color: C.textLight, marginTop: 4 },
  headerBtns: { flexDirection: isLaptop ? 'row' : 'row', gap: 10, marginTop: isLaptop ? 0 : 16, flexWrap: 'wrap' },

  btnOutline: { borderWidth: 1.5, borderColor: C.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  btnOutlineText: { color: C.primary, fontWeight: '600', fontSize: 13 },
  btnPrimary: { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ── Layout rows
  row: { marginBottom: 20 },
  rowLaptop: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: isLaptop ? 24 : 16,
    marginBottom: isLaptop ? 0 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHalf: { flex: 1 },
  cardFlex: { flex: 2 },

  // ── Stats
  cardLabel: { fontSize: 11, fontWeight: '700', color: C.textLight, letterSpacing: 1.2 },
  bigStat: { fontSize: 42, fontWeight: '800', color: C.text, lineHeight: 48 },
  statBadge: { fontSize: 14, fontWeight: '700', color: '#4CAF50', marginBottom: 8 },
  statNote: { fontSize: 13, color: C.textLight },
  divider: { height: 1, backgroundColor: C.border },

  // ── Subjects
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  cardSubtext: { fontSize: 12, color: C.textLight, marginTop: 4 },
  subjectName: { fontSize: 14, color: C.text, fontWeight: '500' },
  subjectPct: { fontSize: 14, color: C.primary, fontWeight: '700' },
  progressTrack: { height: 7, backgroundColor: '#EDE9FE', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  // ── Calendar
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  calMonthLabel: { fontSize: 13, color: C.textLight, marginTop: 2 },
  calNavRow: { flexDirection: 'row', gap: 8 },
  navBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F3F3F9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  navBtnText: { fontSize: 18, color: C.text, fontWeight: '600', lineHeight: 22 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayHeader: { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.5 },
  calEmpty: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  calDay: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 2,
  },
  calPresent: { borderBottomWidth: 2.5, borderBottomColor: '#4CAF50' },
  calAbsent: { backgroundColor: C.absent, borderBottomWidth: 2.5, borderBottomColor: '#E53935' },
  calHoliday: { borderBottomWidth: 2.5, borderBottomColor: '#5C6BC0' },
  calWeekend: {},
  calFuture: {},
  calDayNum: { fontSize: 13, fontWeight: '600', color: C.text },
  calLabel: { fontSize: 7, fontWeight: '700', letterSpacing: 0.3, marginTop: 1 },
  calLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 12, color: C.textLight },

  // ── Smart Alerts
  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  alertIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F3F3F9', alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  alertDesc: { fontSize: 11, color: C.textLight, marginTop: 2 },

  // ── Parent Meeting
  meetingIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  meetingDetail: { flexDirection: 'row', marginBottom: 6 },
  meetingDetailText: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  btnRsvp: {
    marginTop: 20, backgroundColor: '#fff', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  btnRsvpText: { color: C.primary, fontWeight: '800', fontSize: 14 },

  // ── Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '92%',
  },
  modalBoxLaptop: {
    borderRadius: 20, maxWidth: 580, alignSelf: 'center',
    marginBottom: 60, width: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  modalClose: { fontSize: 20, color: C.textLight, fontWeight: '600' },

  // ── Report
  reportSection: { backgroundColor: '#F3F3F9', borderRadius: 12, padding: 16, marginBottom: 16 },
  reportStudentName: { fontSize: 18, fontWeight: '800', color: C.text },
  reportPeriod: { fontSize: 12, color: C.textLight, marginTop: 2 },
  reportStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reportStatCard: {
    flex: 1, minWidth: 70,
    backgroundColor: '#F9F9FF', borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  reportStatValue: { fontSize: 22, fontWeight: '800' },
  reportStatLabel: { fontSize: 10, color: C.textLight, textAlign: 'center', marginTop: 2 },

  // ── Message
  teacherCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F3F3F9', borderRadius: 12, padding: 14, marginBottom: 16,
  },
  teacherAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center',
  },
  teacherName: { fontSize: 15, fontWeight: '700', color: C.text },
  teacherRole: { fontSize: 11, color: C.textLight, marginTop: 2 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: C.textLight, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: C.text, backgroundColor: '#FAFAFA',
  },
  inputMulti: { height: 120, textAlignVertical: 'top' },

  // ── RSVP
  rsvpInfo: { backgroundColor: '#F3F3F9', borderRadius: 12, padding: 14, marginBottom: 8 },
  rsvpInfoLine: { fontSize: 13, color: C.text, marginBottom: 4 },
  rsvpToggleRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rsvpToggle: {
    flex: 1, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  rsvpToggleActive: { backgroundColor: C.primary, borderColor: C.primary },
  rsvpToggleText: { fontSize: 13, fontWeight: '700', color: C.textLight },

  // ── Success
  successBox: { alignItems: 'center', paddingVertical: 20 },
  successIcon: { fontSize: 48, color: '#4CAF50' },
  successTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginTop: 12 },
  successDesc: { fontSize: 14, color: C.textLight, textAlign: 'center', marginTop: 8, lineHeight: 21 },
});