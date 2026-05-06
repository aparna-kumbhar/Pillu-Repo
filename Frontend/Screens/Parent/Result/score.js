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
  Alert,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isLaptop = SCREEN_WIDTH >= 768;

// ─── Color tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#F7F8FC',
  card:      '#FFFFFF',
  primary:   '#5B4FE9',
  primaryLight: '#EDE9FE',
  accent:    '#7C6FF7',
  text:      '#0F0F1A',
  textMid:   '#4A4A6A',
  textLight: '#8888AA',
  border:    '#E4E4EF',
  up:        '#22C55E',
  flat:      '#F59E0B',
  down:      '#EF4444',
  upBg:      '#F0FDF4',
  flatBg:    '#FFFBEB',
  downBg:    '#FEF2F2',
};

// ─── Growth curve data (12 months × multiple years) ──────────────────────────
const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

const GROWTH_DATA = {
  2022: [58, 61, 63, 66, 68, 70, 71, 73, 75, 77, 79, 80],
  2023: [81, 83, 84, 85, 86, 87, 87, 88, 89, 90, 91, 94],
  2024: [94, 95, 95, 96, 96, 97, 97, 97, 98, 98, 99, 99],
};

// ─── Assessment data ─────────────────────────────────────────────────────────
const ALL_ASSESSMENTS = [
  { subject: 'Advanced Calculus',   dept: 'MATHEMATICS DEPARTMENT', score: '92/100', grade: 'A+', trend: 'up',   date: 'Dec 12, 2023' },
  { subject: 'Quantum Physics',     dept: 'SCIENCE FACULTY',        score: '88/100', grade: 'A',  trend: 'flat', date: 'Dec 10, 2023' },
  { subject: 'Modern History',      dept: 'HUMANITIES STREAM',      score: '76/100', grade: 'B',  trend: 'down', date: 'Dec 8, 2023'  },
  { subject: 'English Literature',  dept: 'HUMANITIES STREAM',      score: '84/100', grade: 'A-', trend: 'up',   date: 'Dec 5, 2023'  },
  { subject: 'Chemistry',           dept: 'SCIENCE FACULTY',        score: '90/100', grade: 'A+', trend: 'up',   date: 'Nov 28, 2023' },
  { subject: 'Biology',             dept: 'SCIENCE FACULTY',        score: '87/100', grade: 'A',  trend: 'up',   date: 'Nov 22, 2023' },
  { subject: 'Computer Science',    dept: 'TECHNOLOGY DEPT',        score: '95/100', grade: 'A+', trend: 'up',   date: 'Nov 18, 2023' },
  { subject: 'Statistics',          dept: 'MATHEMATICS DEPARTMENT', score: '82/100', grade: 'A-', trend: 'flat', date: 'Nov 15, 2023' },
  { subject: 'Physical Education',  dept: 'SPORTS FACULTY',         score: '91/100', grade: 'A+', trend: 'up',   date: 'Nov 10, 2023' },
];

const TEACHERS = [
  {
    id: 1,
    name: 'Dr. Helena Vance',
    role: 'HEAD OF MATHEMATICS',
    initials: 'HV',
    avatarColor: '#7C6FF7',
    quote: '"Benjamin\'s grasp of abstract mathematical concepts in Advanced Calculus is truly exceptional. He has demonstrated a level of analytical maturity that surpasses his peers."',
    subject: 'Advanced Calculus',
    slots: ['Mon 10:00 AM', 'Tue 2:00 PM', 'Wed 11:00 AM', 'Thu 3:00 PM', 'Fri 9:00 AM'],
  },
  {
    id: 2,
    name: 'Prof. Alan Shore',
    role: 'SCIENCE FACULTY',
    initials: 'AS',
    avatarColor: '#06B6D4',
    quote: '"Benjamin shows strong analytical skills in Quantum Physics. With a bit more focus on derivation techniques, he can easily reach A+ territory."',
    subject: 'Quantum Physics',
    slots: ['Mon 1:00 PM', 'Wed 3:00 PM', 'Fri 11:00 AM'],
  },
];

const GROWTH_INSIGHTS = [
  { icon: '💡', title: 'Growth Area Identified', desc: 'Focus on historical source analysis to improve History grades in the upcoming finals.' },
  { icon: '🏆', title: 'Top Performer Badge', desc: 'Benjamin ranked in the top 10% bracket this term — a consistent streak for 3 terms.' },
  { icon: '📈', title: 'Upward Momentum', desc: 'Average score improved by 4.2 points compared to last term across all subjects.' },
];

// ─── Helper: Trend icon ───────────────────────────────────────────────────────
function TrendIcon({ trend }) {
  if (trend === 'up')   return <Text style={[styles.trendIcon, { color: C.up }]}>↗</Text>;
  if (trend === 'down') return <Text style={[styles.trendIcon, { color: C.down }]}>↘</Text>;
  return <Text style={[styles.trendIcon, { color: C.flat }]}>→</Text>;
}

// ─── Growth Chart (pure RN, no external lib) ─────────────────────────────────
function GrowthChart({ year }) {
  const data = GROWTH_DATA[year] || GROWTH_DATA[2023];
  const maxVal = 100;
  const chartH = 100;
  const [chartW, setChartW] = useState(0);
  const count = data.length;
  const gap = isLaptop ? 10 : 6;
  const safeW = Math.max(chartW, 1);
  const barW = Math.max(10, (safeW - gap * (count - 1)) / count);

  return (
    <View
      style={{ width: '100%' }}
      onLayout={(e) => setChartW(e.nativeEvent.layout.width)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartH + 4, width: '100%' }}>
        {data.map((val, i) => {
          const isLast = i === data.length - 1;
          const barH = Math.max(8, (val / maxVal) * chartH);
          const isLastBar = i === data.length - 1;
          return (
            <View
              key={i}
              style={{ alignItems: 'center', marginRight: isLastBar ? 0 : gap }}
            >
              <View style={[
                styles.chartBar,
                { height: barH, width: barW },
                isLast
                  ? { backgroundColor: C.primary }
                  : { backgroundColor: '#D4D0F7' },
              ]} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8, width: '100%' }}>
        {MONTHS_SHORT.map((m, i) => (
          <View
            key={i}
            style={{
              width: barW,
              marginRight: i === MONTHS_SHORT.length - 1 ? 0 : gap,
              alignItems: 'center',
            }}
          >
            <Text style={styles.chartMonthLabel}>{m}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 44 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ParentPortalGrades() {
  const [chartYear, setChartYear] = useState(2023);
  const [showAllReports, setShowAllReports] = useState(false);
  const [consultModal, setConsultModal] = useState(null); // teacher object
  const [selectedSlot, setSelectedSlot] = useState('');
  const [consultNote, setConsultNote] = useState('');
  const [consultBooked, setConsultBooked] = useState(false);

  function openConsult(teacher) {
    setConsultModal(teacher);
    setSelectedSlot('');
    setConsultNote('');
    setConsultBooked(false);
  }

  function bookConsult() {
    if (!selectedSlot) { Alert.alert('Please select a time slot.'); return; }
    setConsultBooked(true);
  }

  const displayedAssessments = showAllReports ? ALL_ASSESSMENTS : ALL_ASSESSMENTS.slice(0, 3);
  const availableYears = Object.keys(GROWTH_DATA).map(Number).sort();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Top Header ── */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.profileLabel}>STUDENT ACADEMIC PROFILE</Text>
            <Text style={styles.studentName}>Benjamin Harrison</Text>
            <Text style={styles.studentMeta}>Grade 11 — Science Stream</Text>
          </View>
        </View>

        {/* ── Stat Cards ── */}
        <View style={[styles.row, isLaptop && styles.rowLaptop]}>

          {/* Class Rank */}
          <View style={[styles.card, isLaptop ? styles.cardThird : styles.cardFull, { marginBottom: isLaptop ? 0 : 14 }]}>
            <Text style={styles.statCardLabel}>CLASS RANK</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 12 }}>
              <Text style={styles.bigNum}>04</Text>
              <Text style={styles.bigNumSub}>/42</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>↗ TOP 10% BRACKET</Text>
            </View>
          </View>

          {/* Global Percentile */}
          <View style={[styles.card, isLaptop ? styles.cardThird : styles.cardFull, { marginBottom: isLaptop ? 0 : 14 }]}>
            <Text style={styles.statCardLabel}>GLOBAL PERCENTILE</Text>
            <Text style={[styles.bigNum, { color: C.primary, fontSize: 48, marginTop: 12 }]}>92nd</Text>
            <View style={styles.percentileBar}>
              <View style={[styles.percentileFill, { width: '92%' }]} />
            </View>
          </View>

          {/* Growth Curve */}
          <View style={[styles.card, isLaptop ? styles.cardFlex : styles.cardFull]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={styles.statCardLabel}>TERM PERFORMANCE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Text style={styles.growthTitle}>Growth Curve</Text>
                  <View style={[styles.badge, { marginLeft: 6 }]}>
                    <Text style={styles.badgeText}>+12%</Text>
                  </View>
                </View>
              </View>
              {/* Year selector dots */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {availableYears.map(y => (
                  <TouchableOpacity key={y} onPress={() => setChartYear(y)}>
                    <View style={[styles.yearDot, chartYear === y && styles.yearDotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* Year label */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {availableYears.map(y => (
                <TouchableOpacity key={y} onPress={() => setChartYear(y)}
                  style={[styles.yearTab, chartYear === y && styles.yearTabActive]}>
                  <Text style={[styles.yearTabText, chartYear === y && { color: '#fff' }]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <GrowthChart year={chartYear} />
          </View>
        </View>

        {/* ── Assessments + Feedback ── */}
        <View style={[styles.row, isLaptop && styles.rowLaptop, { marginTop: 20 }]}>

          {/* Recent Assessments */}
          <View style={[styles.card, isLaptop ? styles.cardFlex : styles.cardFull, { marginBottom: isLaptop ? 0 : 14 }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Assessments</Text>
              <TouchableOpacity onPress={() => setShowAllReports(v => !v)}>
                <Text style={styles.viewAllBtn}>{showAllReports ? 'SHOW LESS ↑' : 'VIEW ALL REPORTS →'}</Text>
              </TouchableOpacity>
            </View>

            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>SUBJECT</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>SCORE</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>GRADE</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>TREND</Text>
            </View>

            {displayedAssessments.map((a, i) => (
              <View key={i} style={[styles.tableRow, i === displayedAssessments.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flex: 2.5 }}>
                  <Text style={styles.tableSubject}>{a.subject}</Text>
                  <Text style={styles.tableDept}>{a.dept}</Text>
                </View>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{a.score}</Text>
                <View style={{ flex: 1 }}>
                  <View style={[
                    styles.gradePill,
                    a.trend === 'up'   && { backgroundColor: C.upBg },
                    a.trend === 'flat' && { backgroundColor: C.flatBg },
                    a.trend === 'down' && { backgroundColor: C.downBg },
                  ]}>
                    <Text style={[
                      styles.gradePillText,
                      a.trend === 'up'   && { color: C.up },
                      a.trend === 'flat' && { color: C.flat },
                      a.trend === 'down' && { color: C.down },
                    ]}>{a.grade}</Text>
                  </View>
                </View>
                <View style={{ flex: 0.8, alignItems: 'center' }}>
                  <TrendIcon trend={a.trend} />
                </View>
              </View>
            ))}

            {showAllReports && (
              <View style={styles.reportFooter}>
                <Text style={styles.reportFooterText}>Showing all {ALL_ASSESSMENTS.length} assessments for Term 2, 2023–24</Text>
              </View>
            )}
          </View>

          {/* Teacher Feedback + Insights */}
          <View style={[{ flex: isLaptop ? 1.1 : undefined }]}>

            {/* Teacher cards */}
            {TEACHERS.map(teacher => (
              <View key={teacher.id} style={[styles.card, { marginBottom: 14 }]}>
                {teacher.id === 1 && <Text style={styles.sectionTitle}>Teacher Feedback</Text>}
                <View style={[styles.teacherCardInner, teacher.id > 1 && { marginTop: 0 }]}>
                  <Avatar initials={teacher.initials} color={teacher.avatarColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teacherName}>{teacher.name}</Text>
                    <Text style={styles.teacherRole}>{teacher.role}</Text>
                  </View>
                </View>
                <Text style={styles.teacherQuote}>{teacher.quote}</Text>
                <TouchableOpacity style={styles.scheduleBtn} onPress={() => openConsult(teacher)}>
                  <Text style={styles.scheduleBtnText}>SCHEDULE CONSULTATION →</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Growth Insights */}
            {GROWTH_INSIGHTS.map((insight, i) => (
              <View key={i} style={[styles.card, styles.insightCard, { marginBottom: 12 }]}>
                <Text style={{ fontSize: 22, marginBottom: 8 }}>{insight.icon}</Text>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDesc}>{insight.desc}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ────── MODAL: Schedule Consultation ────── */}
      <Modal
        visible={!!consultModal}
        animationType="slide"
        transparent
        onRequestClose={() => setConsultModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isLaptop && styles.modalBoxLaptop]}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Consultation</Text>
              <TouchableOpacity onPress={() => setConsultModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {consultBooked ? (
              <View style={styles.successBox}>
                <Text style={{ fontSize: 52 }}>✅</Text>
                <Text style={styles.successTitle}>Consultation Booked!</Text>
                <Text style={styles.successDesc}>
                  Your meeting with {consultModal?.name} is confirmed for{'\n'}
                  <Text style={{ fontWeight: '800', color: C.primary }}>{selectedSlot}</Text>.{'\n\n'}
                  You'll receive a confirmation email shortly.
                </Text>
                <TouchableOpacity
                  style={[styles.btnPrimary, { marginTop: 24, alignSelf: 'stretch' }]}
                  onPress={() => setConsultModal(null)}>
                  <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Teacher header */}
                {consultModal && (
                  <View style={styles.consultTeacherRow}>
                    <Avatar initials={consultModal.initials} color={consultModal.avatarColor} size={52} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teacherName}>{consultModal.name}</Text>
                      <Text style={styles.teacherRole}>{consultModal.role}</Text>
                      <Text style={[styles.teacherRole, { marginTop: 2, color: C.textMid }]}>Re: {consultModal.subject}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.divider} />

                <Text style={styles.inputLabel}>Select a Time Slot</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
                  {consultModal?.slots.map(slot => (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnActive]}
                      onPress={() => setSelectedSlot(slot)}>
                      <Text style={[styles.slotBtnText, selectedSlot === slot && { color: '#fff' }]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { marginTop: 18 }]}>Meeting Format</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  {['In-Person', 'Video Call', 'Phone Call'].map(format => (
                    <TouchableOpacity key={format} style={styles.formatBtn}>
                      <Text style={styles.formatBtnText}>
                        {format === 'In-Person' ? '🏫' : format === 'Video Call' ? '💻' : '📞'} {format}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { marginTop: 18 }]}>Additional Notes (optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Topics you'd like to discuss..."
                  placeholderTextColor={C.textLight}
                  multiline
                  numberOfLines={4}
                  value={consultNote}
                  onChangeText={setConsultNote}
                />

                <View style={styles.consultInfoBox}>
                  <Text style={styles.consultInfoText}>
                    📋 Sessions are 30 minutes. You'll receive an email confirmation with a calendar invite.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.btnPrimary, { marginTop: 20, alignSelf: 'stretch' }]}
                  onPress={bookConsult}>
                  <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>Confirm Booking</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: isLaptop ? 32 : 16, paddingBottom: 60 },

  // Top bar
  topBar: { marginBottom: 24 },
  profileLabel: { fontSize: 11, fontWeight: '700', color: C.primary, letterSpacing: 2 },
  studentName: { fontSize: isLaptop ? 40 : 28, fontWeight: '900', color: C.text, marginTop: 6, letterSpacing: -0.5 },
  studentMeta: { fontSize: 15, color: C.textMid, marginTop: 4 },

  // Layout
  row: {},
  rowLaptop: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: isLaptop ? 22 : 16,
    shadowColor: '#3B3490',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  cardFull: { marginBottom: 14 },
  cardThird: { flex: 1 },
  cardFlex:  { flex: 2 },

  // Stat cards
  statCardLabel: { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 1.5 },
  bigNum: { fontSize: 40, fontWeight: '900', color: C.text, letterSpacing: -1 },
  bigNumSub: { fontSize: 22, fontWeight: '600', color: C.textLight, marginBottom: 6 },
  badge: {
    marginTop: 14, alignSelf: 'flex-start',
    backgroundColor: C.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 0.8 },
  percentileBar: { height: 6, backgroundColor: '#E8E4FD', borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  percentileFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },

  // Growth chart
  growthTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  chartBar: { borderRadius: 5, minHeight: 8 },
  chartMonthLabel: { fontSize: 9, color: C.textLight, fontWeight: '600' },
  yearDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4D0F7' },
  yearDotActive: { backgroundColor: C.primary },
  yearTab: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: '#EDEDF8',
  },
  yearTabActive: { backgroundColor: C.primary },
  yearTabText: { fontSize: 12, fontWeight: '700', color: C.textMid },

  // Section header
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  viewAllBtn: { fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 0.5 },

  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F4F4FB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  tableHeaderCell: { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 1 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableSubject: { fontSize: 14, fontWeight: '700', color: C.text },
  tableDept: { fontSize: 10, color: C.textLight, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
  tableCell: { fontSize: 14, color: C.textMid, fontWeight: '500' },
  gradePill: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  gradePillText: { fontSize: 13, fontWeight: '800' },
  trendIcon: { fontSize: 18, fontWeight: '900' },
  reportFooter: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  reportFooterText: { fontSize: 12, color: C.textLight, textAlign: 'center' },

  // Teacher feedback
  teacherCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, marginBottom: 12 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  teacherName: { fontSize: 15, fontWeight: '800', color: C.text },
  teacherRole: { fontSize: 10, fontWeight: '700', color: C.primary, letterSpacing: 1, marginTop: 2 },
  teacherQuote: { fontSize: 13, color: C.textMid, lineHeight: 20, fontStyle: 'italic', marginBottom: 14 },
  scheduleBtn: { flexDirection: 'row', alignItems: 'center' },
  scheduleBtnText: { fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 0.6 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },

  // Insights
  insightCard: { flexDirection: 'column' },
  insightTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 4 },
  insightDesc: { fontSize: 12, color: C.textMid, lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,10,40,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '92%',
  },
  modalBoxLaptop: {
    borderRadius: 22, maxWidth: 560, alignSelf: 'center',
    marginBottom: 60, width: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 19, fontWeight: '900', color: C.text },
  modalClose: { fontSize: 20, color: C.textLight, fontWeight: '600', padding: 4 },

  // Consult modal internals
  consultTeacherRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: C.textLight, letterSpacing: 0.8, marginBottom: 2 },
  slotBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: '#FAFAFA',
  },
  slotBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  slotBtnText: { fontSize: 13, fontWeight: '600', color: C.textMid },
  formatBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  formatBtnText: { fontSize: 12, fontWeight: '600', color: C.textMid },
  textArea: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: C.text, backgroundColor: '#FAFAFA',
    height: 100, textAlignVertical: 'top',
    marginTop: 6,
  },
  consultInfoBox: {
    backgroundColor: C.primaryLight, borderRadius: 12, padding: 14, marginTop: 16,
  },
  consultInfoText: { fontSize: 12, color: C.primary, fontWeight: '500', lineHeight: 18 },
  btnPrimary: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.3 },

  // Success
  successBox: { alignItems: 'center', paddingVertical: 28 },
  successTitle: { fontSize: 24, fontWeight: '900', color: C.text, marginTop: 16 },
  successDesc: { fontSize: 14, color: C.textMid, textAlign: 'center', marginTop: 10, lineHeight: 22 },
});