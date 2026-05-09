import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

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

// ─── Helper to fetch attendance summary ───────────────────────────────────────
async function fetchAttendanceSummary(studentId, instituteId) {
  try {
    const year = new Date().getFullYear();
    const { response } = await fetchWithBaseUrlFallback(
      `/api/attendance/student/${studentId}/summary?instituteId=${instituteId}&year=${year}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response?.ok) return null;

    const data = await response.json();
    if (!data?.counts) return null;

    const totalDays = data.counts.total || 0;
    const presentDays = data.counts.present || 0;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return { percentage, presentDays, totalDays };
  } catch (err) {
    console.error('Error fetching attendance summary:', err);
    return null;
  }
}

// ─── Color Palette ───────────────────────────────────────────────────────────
const COLORS = {
  primary: '#5B52E5',
  primaryLight: '#EEF0FF',
  accent: '#7C74F0',
  white: '#FFFFFF',
  background: '#F2F3F8',
  cardBg: '#FFFFFF',
  text: '#1A1A2E',
  subText: '#8A8FAD',
  border: '#EAEAF5',
  green: '#22C55E',
  pendingBg: '#5B52E5',
  badgeBg: '#EEF0FF',
  red: '#EF4444',
  orange: '#F59E0B',
  teal: '#14B8A6',
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const attendanceTrend = [
  { month: 'JAN', value: 0.79 },
  { month: 'FEB', value: 0.83 },
  { month: 'MAR', value: 0.86 },
  { month: 'APR', value: 0.88 },
  { month: 'MAY', value: 0.91 },
  { month: 'JUN', value: 0.84 },
  { month: 'JUL', value: 0.87 },
  { month: 'AUG', value: 0.92 },
  { month: 'SEP', value: 0.94 },
  { month: 'OCT', value: 0.90 },
  { month: 'NOV', value: 0.93 },
  { month: 'DEC', value: 0.95 },
];

const allResults = [
  {
    id: 1,
    subject: 'Advanced Physics',
    type: 'MID-TERM ASSESSMENT',
    score: 92,
    total: 100,
    teacher: 'Dr. Smith',
    date: 'Sept 24, 2023',
    icon: '⚗️',
    grade: 'A',
    gradeColor: COLORS.green,
  },
  {
    id: 2,
    subject: 'Calculus II',
    type: 'UNIT TEST',
    score: 88,
    total: 100,
    teacher: 'Mrs. Gable',
    date: 'Sept 18, 2023',
    icon: '∑',
    grade: 'A',
    gradeColor: COLORS.green,
  },
  {
    id: 3,
    subject: 'English Literature',
    type: 'QUARTERLY EXAM',
    score: 76,
    total: 100,
    teacher: 'Mr. Collins',
    date: 'Sept 10, 2023',
    icon: '📖',
    grade: 'B+',
    gradeColor: COLORS.accent,
  },
  {
    id: 4,
    subject: 'World History',
    type: 'MID-TERM ASSESSMENT',
    score: 81,
    total: 100,
    teacher: 'Ms. Rivera',
    date: 'Sept 5, 2023',
    icon: '🌍',
    grade: 'B+',
    gradeColor: COLORS.accent,
  },
  {
    id: 5,
    subject: 'Computer Science',
    type: 'PROJECT EVALUATION',
    score: 96,
    total: 100,
    teacher: 'Mr. Park',
    date: 'Aug 28, 2023',
    icon: '💻',
    grade: 'A+',
    gradeColor: COLORS.primary,
  },
  {
    id: 6,
    subject: 'Biology',
    type: 'LAB PRACTICAL',
    score: 70,
    total: 100,
    teacher: 'Dr. Nair',
    date: 'Aug 20, 2023',
    icon: '🔬',
    grade: 'B',
    gradeColor: COLORS.orange,
  },
];

const invoiceDetails = {
  invoiceNo: 'INV-2023-0921',
  issuedOn: 'Sep 1, 2023',
  dueOn: 'Oct 10, 2023',
  studentName: 'Arjun Mercer',
  class: 'Grade 11 - Section A',
  items: [
    { label: 'Tuition Fee (Oct–Dec)', amount: '₹9,000' },
    { label: 'Lab & Activity Fee', amount: '₹2,500' },
    { label: 'Library & Resource Fee', amount: '₹1,500' },
    { label: 'Sports & Events', amount: '₹1,500' },
  ],
  total: '₹14,500',
  status: 'UNPAID',
};

// ─── Screen Components (Pages) ────────────────────────────────────────────────

const PaymentScreen = ({ onBack }) => {
  const [selected, setSelected] = useState('upi');
  const [paid, setPaid] = useState(false);

  if (paid) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.paySuccessContainer}>
          <View style={styles.paySuccessIcon}>
            <Text style={{ fontSize: 48 }}>✅</Text>
          </View>
          <Text style={styles.paySuccessTitle}>Payment Successful!</Text>
          <Text style={styles.paySuccessSub}>₹14,500 paid for Arjun Mercer</Text>
          <Text style={styles.paySuccessRef}>Ref: TXN{Math.floor(Math.random() * 9000000 + 1000000)}</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.backHomeBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Fee Payment</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { gap: 14 }]}>
        {/* Summary */}
        <View style={styles.paySummaryCard}>
          <Text style={styles.paySummaryLabel}>AMOUNT DUE</Text>
          <Text style={styles.paySummaryAmount}>₹14,500</Text>
          <Text style={styles.paySummaryMeta}>Arjun Mercer · Due Oct 10, 2023</Text>
        </View>

        {/* Payment Methods */}
        <View style={styles.payMethodCard}>
          <Text style={styles.payMethodTitle}>Select Payment Method</Text>
          {[
            { id: 'upi', label: 'UPI', icon: '📲', sub: 'Pay via any UPI app' },
            { id: 'netbanking', label: 'Net Banking', icon: '🏦', sub: 'All major banks supported' },
            { id: 'card', label: 'Debit / Credit Card', icon: '💳', sub: 'Visa, Mastercard, RuPay' },
          ].map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.methodItem, selected === m.id && styles.methodItemActive]}
              onPress={() => setSelected(m.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodLabel, selected === m.id && { color: COLORS.primary }]}>{m.label}</Text>
                <Text style={styles.methodSub}>{m.sub}</Text>
              </View>
              <View style={[styles.radioOuter, selected === m.id && styles.radioOuterActive]}>
                {selected === m.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pay CTA */}
        <TouchableOpacity style={styles.payNowBigBtn} onPress={() => setPaid(true)} activeOpacity={0.85}>
          <Text style={styles.payNowBigText}>Pay ₹14,500</Text>
        </TouchableOpacity>

        <Text style={styles.paySecureNote}>🔒 Payments are 256-bit SSL secured</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const DownloadReportsScreen = ({ onBack }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
    <View style={styles.pageHeader}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Download Reports</Text>
    </View>
    <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { gap: 14 }]}>
      {[
        { label: 'Term 1 Report Card', date: 'April 2023', icon: '📄', size: '1.2 MB' },
        { label: 'Term 2 Report Card', date: 'September 2023', icon: '📄', size: '1.4 MB' },
        { label: 'Annual Progress Report', date: 'March 2023', icon: '📊', size: '2.1 MB' },
        { label: 'Attendance Certificate', date: 'October 2023', icon: '📋', size: '0.5 MB' },
      ].map((r, i) => (
        <TouchableOpacity key={i} style={styles.reportItem} activeOpacity={0.8}>
          <View style={styles.reportIconCircle}>
            <Text style={{ fontSize: 22 }}>{r.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportName}>{r.label}</Text>
            <Text style={styles.reportMeta}>{r.date} · {r.size}</Text>
          </View>
          <View style={styles.downloadBtn}>
            <Text style={styles.downloadBtnText}>↓</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </SafeAreaView>
);

const MessageTeachersScreen = ({ onBack, parentProfile, instituteId: parentInstituteId }) => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [composeVisible, setComposeVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const instituteId = parentInstituteId || parentProfile?.instituteId || 'default-institute';
  const senderId = parentProfile?.parentId || parentProfile?.studentName || 'parent-user';
  const senderName = parentProfile?.parentName || parentProfile?.studentName || 'Arjun Mercer Parent';
  const senderRole = 'parent';

  const openComposer = (teacher) => {
    setSelectedTeacher(teacher);
    setSubject(`Message for ${teacher.subject}`);
    setContent('');
    setComposeVisible(true);
  };

  const sendMessage = async () => {
    if (!selectedTeacher) return;
    if (!subject.trim() || !content.trim()) {
      Alert.alert('Missing details', 'Please enter both a subject and a message.');
      return;
    }

    setSending(true);
    try {
      const { response } = await fetchWithBaseUrlFallback('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId,
          senderId,
          senderName,
          senderRole,
          receiverId: selectedTeacher.name,
          receiverName: selectedTeacher.name,
          receiverRole: 'teacher',
          subject: subject.trim(),
          content: content.trim(),
          messageType: 'personal',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        Alert.alert('Message not sent', payload?.message || 'Failed to save message');
        return;
      }

      setComposeVisible(false);
      Alert.alert('Message sent', 'Your message has been saved in the database.');
    } catch (error) {
      Alert.alert('Network error', error?.message || 'Could not save message');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Message Teachers</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { gap: 12 }]}>
        {[
          { name: 'Dr. Smith', subject: 'Advanced Physics', emoji: '👨‍🔬', lastMsg: 'Great work on the midterm!' },
          { name: 'Mrs. Gable', subject: 'Calculus II', emoji: '👩‍🏫', lastMsg: 'Please review Chapter 5 again.' },
          { name: 'Mr. Collins', subject: 'English Literature', emoji: '👨‍🏫', lastMsg: 'Essay deadline extended to Friday.' },
          { name: 'Ms. Rivera', subject: 'World History', emoji: '👩‍🎓', lastMsg: 'No message yet' },
          { name: 'Mr. Park', subject: 'Computer Science', emoji: '👨‍💻', lastMsg: 'Project submission confirmed!' },
        ].map((t, i) => (
          <TouchableOpacity key={i} style={styles.teacherItem} activeOpacity={0.8} onPress={() => openComposer(t)}>
            <View style={styles.teacherAvatar}>
              <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.teacherName}>{t.name}</Text>
              <Text style={styles.teacherSubject}>{t.subject}</Text>
              <Text style={styles.teacherLastMsg} numberOfLines={1}>{t.lastMsg}</Text>
            </View>
            <Text style={styles.msgArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={composeVisible} transparent animationType="slide" onRequestClose={() => setComposeVisible(false)}>
        <View style={styles.composeOverlay}>
          <View style={styles.composeCard}>
            <View style={styles.composeHeader}>
              <Text style={styles.composeTitle}>New Message</Text>
              <TouchableOpacity onPress={() => setComposeVisible(false)}>
                <Text style={styles.composeClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.composeLabel}>To</Text>
            <Text style={styles.composeValue}>{selectedTeacher?.name || ''}</Text>

            <Text style={styles.composeLabel}>Subject</Text>
            <TextInput
              style={styles.composeInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Write a subject"
              placeholderTextColor={COLORS.subText}
            />

            <Text style={styles.composeLabel}>Message</Text>
            <TextInput
              style={[styles.composeInput, styles.composeInputMulti]}
              value={content}
              onChangeText={setContent}
              placeholder="Write your message here"
              placeholderTextColor={COLORS.subText}
              multiline
              numberOfLines={5}
            />

            <TouchableOpacity
              style={[styles.composeSendBtn, sending && { opacity: 0.7 }]}
              onPress={sendMessage}
              disabled={sending}
              activeOpacity={0.85}
            >
              <Text style={styles.composeSendText}>{sending ? 'Sending...' : 'Send Message'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const PreviousYearsScreen = ({ onBack }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
    <View style={styles.pageHeader}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.pageTitle}>Previous Years</Text>
    </View>
    <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { gap: 14 }]}>
      {[
        { year: 'Grade 10 — 2022–23', rank: '#02', attendance: '96.1%', gpa: '9.4', icon: '🏅' },
        { year: 'Grade 9 — 2021–22', rank: '#05', attendance: '93.7%', gpa: '8.9', icon: '🎖️' },
        { year: 'Grade 8 — 2020–21', rank: '#07', attendance: '91.2%', gpa: '8.5', icon: '📚' },
      ].map((y, i) => (
        <View key={i} style={styles.yearCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
            <Text style={{ fontSize: 26 }}>{y.icon}</Text>
            <Text style={styles.yearTitle}>{y.year}</Text>
          </View>
          <View style={styles.yearStats}>
            {[
              { label: 'RANK', value: y.rank },
              { label: 'ATTENDANCE', value: y.attendance },
              { label: 'GPA', value: y.gpa },
            ].map((s, j) => (
              <View key={j} style={styles.yearStat}>
                <Text style={styles.yearStatLabel}>{s.label}</Text>
                <Text style={styles.yearStatValue}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  </SafeAreaView>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const StatCard = ({ label, value, badge, badgeColor }) => (
  <View style={[styles.statCard, isTablet && styles.statCardTablet]}>
    <View style={styles.statIconCircle}>
      <Text style={styles.statIcon}>{label === 'ATTENDANCE' ? '📅' : '🏆'}</Text>
    </View>
    {badge ? (
      <View style={[styles.badge, { backgroundColor: badgeColor ? `${badgeColor}22` : COLORS.badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeColor || COLORS.primary }]}>{badge}</Text>
      </View>
    ) : null}
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

// ─── FIX: PendingFeesCard now manages its own invoiceExpanded state
//     This prevents the parent ScrollView from re-rendering on toggle,
//     which was causing the scroll position to reset to the top.
const PendingFeesCard = ({ onPayNow }) => {
  const [invoiceExpanded, setInvoiceExpanded] = useState(false);

  const handleToggleInvoice = useCallback(() => {
    setInvoiceExpanded((v) => !v);
  }, []);

  return (
    <View style={[styles.pendingCard, isTablet && styles.pendingCardTablet]}>
      <Text style={styles.pendingLabel}>PENDING FEES</Text>
      <Text style={styles.pendingAmount}>₹14,500</Text>
      <Text style={styles.pendingDue}>Due on Oct 10, 2023</Text>
      <TouchableOpacity style={styles.payBtn} onPress={onPayNow} activeOpacity={0.8}>
        <Text style={styles.payBtnText}>Pay Now</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleToggleInvoice} activeOpacity={0.7}>
        <Text style={styles.invoiceLink}>{invoiceExpanded ? 'Hide Invoice ▲' : 'View Invoice ▼'}</Text>
      </TouchableOpacity>

      {invoiceExpanded && (
        <View style={styles.invoiceExpand}>
          <View style={styles.invoiceDivider} />
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Invoice No.</Text>
            <Text style={styles.invoiceVal}>{invoiceDetails.invoiceNo}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Student</Text>
            <Text style={styles.invoiceVal}>{invoiceDetails.studentName}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Class</Text>
            <Text style={styles.invoiceVal}>{invoiceDetails.class}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceKey}>Issued</Text>
            <Text style={styles.invoiceVal}>{invoiceDetails.issuedOn}</Text>
          </View>
          <View style={styles.invoiceDivider} />
          {invoiceDetails.items.map((item, i) => (
            <View key={i} style={styles.invoiceRow}>
              <Text style={styles.invoiceItemLabel}>{item.label}</Text>
              <Text style={styles.invoiceItemAmt}>{item.amount}</Text>
            </View>
          ))}
          <View style={styles.invoiceDivider} />
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceTotalLabel}>TOTAL DUE</Text>
            <Text style={styles.invoiceTotalAmt}>{invoiceDetails.total}</Text>
          </View>
          <View style={[styles.invoiceStatusBadge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
            <Text style={[styles.invoiceStatusText, { color: COLORS.red }]}>● {invoiceDetails.status}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const AttendanceTrend = () => {
  const maxValue = Math.max(...attendanceTrend.map((d) => d.value));
  const chartHeight = isTablet ? 130 : 110;
  const [chartContainerW, setChartContainerW] = useState(0);

  return (
    <View style={styles.trendCard} onLayout={(e) => setChartContainerW(e.nativeEvent.layout.width)}>
      <View style={styles.trendHeader}>
        <Text style={styles.trendTitle}>Attendance Trend</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.trendPeriod}>This Year ▾</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.chartContainer, { height: chartHeight + 30, minWidth: Math.max(chartContainerW - 32, 200) }]}>
          {attendanceTrend.map((item, idx) => {
            const barH = (item.value / maxValue) * chartHeight;
            const isLast = idx === attendanceTrend.length - 1;
            return (
              <View key={item.month} style={styles.barWrapper}>
                <Text style={styles.barPercent}>{Math.round(item.value * 100)}%</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barH,
                      backgroundColor: isLast ? COLORS.primary : COLORS.accent,
                      opacity: isLast ? 1 : 0.55,
                    },
                  ]}
                />
                <Text style={[styles.barLabel, isLast && { color: COLORS.primary, fontWeight: '700' }]}>
                  {item.month}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const QuickActions = ({ onDownload, onMessage, onPrevYears }) => (
  <View style={styles.quickCard}>
    <Text style={styles.quickTitle}>Quick Actions</Text>
    {[
      { label: 'Download Reports', icon: '📄', onPress: onDownload },
      { label: 'Message Teachers', icon: '✉️', onPress: onMessage },
      { label: 'Previous Years', icon: '🕐', onPress: onPrevYears },
    ].map((action, i) => (
      <TouchableOpacity key={i} style={styles.quickItem} onPress={action.onPress} activeOpacity={0.75}>
        <View style={styles.quickIconCircle}>
          <Text style={styles.quickIcon}>{action.icon}</Text>
        </View>
        <Text style={styles.quickLabel}>{action.label}</Text>
        <Text style={styles.quickArrow}>›</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const ResultCard = ({ item }) => (
  <View style={styles.resultItem}>
    <View style={styles.resultIconCircle}>
      <Text style={styles.resultIconText}>{item.icon}</Text>
    </View>
    <View style={styles.resultInfo}>
      <Text style={styles.resultType}>{item.type}</Text>
      <Text style={styles.resultSubject}>{item.subject}</Text>
      <Text style={styles.resultMeta}>
        {item.teacher} · {item.date}
      </Text>
    </View>
    <View style={styles.resultScoreWrap}>
      <View style={[styles.gradeTag, { backgroundColor: `${item.gradeColor}18` }]}>
        <Text style={[styles.gradeText, { color: item.gradeColor }]}>{item.grade}</Text>
      </View>
      <Text style={styles.resultScore}>
        {item.score}
        <Text style={styles.resultTotal}>/{item.total}</Text>
      </Text>
    </View>
  </View>
);

// ─── FIX: AcademicResults now manages its own expanded state
//     This prevents the parent ScrollView from re-rendering on toggle,
//     which was causing the scroll position to reset to the top.
const AcademicResults = () => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  const visibleResults = expanded ? allResults : allResults.slice(0, 2);

  return (
    <View style={styles.resultsCard}>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Recent Academic Results</Text>
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
          <Text style={styles.viewAll}>{expanded ? 'Show Less ▲' : 'View All Scores ▼'}</Text>
        </TouchableOpacity>
      </View>
      {visibleResults.map((item) => (
        <ResultCard key={item.id} item={item} />
      ))}
    </View>
  );
};

const AnnouncementsCard = () => (
  <View style={styles.announcementsCard}>
    <View style={styles.annHeader}>
      <Text style={styles.annIcon}>📢</Text>
      <Text style={styles.annTitle}>Announcements</Text>
    </View>
    <View style={styles.annMain}>
      <View style={styles.annBadge}>
        <Text style={styles.annBadgeText}>Upcoming Event</Text>
      </View>
      <Text style={styles.annEventTitle}>Annual Science Fair 2024</Text>
      <Text style={styles.annEventDesc}>
        Arjun has been shortlisted for the robotics competition. Please confirm attendance by end of month.
      </Text>
      <View style={styles.annFooter}>
        <View style={styles.annAvatar}>
          <Text style={{ fontSize: 14 }}>👩</Text>
        </View>
        <View>
          <Text style={styles.annName}>Maria Hills</Text>
          <Text style={styles.annRole}>Activity Coordinator</Text>
        </View>
      </View>
    </View>
    <View style={styles.prevUpdates}>
      <Text style={styles.prevLabel}>PREVIOUS UPDATES</Text>
      {[
        { title: 'Revised Winter Vacation Schedule', when: 'Posted 2 days ago' },
        { title: 'Parent-Teacher Meeting — Oct 20', when: 'Posted 4 days ago' },
      ].map((u, i) => (
        <View key={i} style={[styles.prevItem, i > 0 && { marginTop: 10 }]}>
          <View style={styles.bullet} />
          <View>
            <Text style={styles.prevTitle}>{u.title}</Text>
            <Text style={styles.prevDate}>{u.when}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App({ parent: parentProp, instituteId: instituteIdProp, route }) {
  const [screen, setScreen] = useState('dashboard');
  // Accept parent data from direct props (sidebar usage) OR route.params (standalone)
  const parentProfile = parentProp || route?.params?.parent || {};
  const instituteId   = instituteIdProp || route?.params?.instituteId || parentProfile?.instituteId || '';

  // Attendance state
  const [attendanceData, setAttendanceData] = useState({ percentage: 94.2, presentDays: 0, totalDays: 0 });
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  // Fetch attendance on mount
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setAttendanceLoading(true);
        const studentName = parentProfile?.studentName || parentProfile?.studentId;
        
        if (!studentName || !instituteId) {
          setAttendanceLoading(false);
          return;
        }

        // Check if studentName is already a MongoDB ID
        const isMongoId = /^[a-f0-9]{24}$/.test(studentName);
        let studentId = studentName;

        // If it's a name, fetch the actual ID
        if (!isMongoId) {
          studentId = await fetchStudentIdByName(studentName, instituteId);
          if (!studentId) {
            setAttendanceLoading(false);
            return;
          }
        }

        // Fetch attendance summary
        const summary = await fetchAttendanceSummary(studentId, instituteId);
        if (summary) {
          setAttendanceData(summary);
          console.log('Dashboard attendance fetched:', summary);
        }
      } catch (err) {
        console.error('Error fetching dashboard attendance:', err);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, [parentProfile?.studentName, parentProfile?.studentId, instituteId]);

  const goToDashboard = useCallback(() => setScreen('dashboard'), []);
  const goToPayment   = useCallback(() => setScreen('payment'),   []);
  const goToReports   = useCallback(() => setScreen('reports'),   []);
  const goToMessages  = useCallback(() => setScreen('messages'),  []);
  const goToPrevYears = useCallback(() => setScreen('prevyears'), []);

  if (screen === 'payment')   return <PaymentScreen onBack={goToDashboard} />;
  if (screen === 'reports')   return <DownloadReportsScreen onBack={goToDashboard} />;
  if (screen === 'messages')  return <MessageTeachersScreen onBack={goToDashboard} parentProfile={parentProfile} instituteId={instituteId} />;
  if (screen === 'prevyears') return <PreviousYearsScreen onBack={goToDashboard} />;

  // On desktop the parent shell provides SafeAreaView + topBar, so we just
  // render a plain View + ScrollView to fill the content area without adding
  // extra insets or a duplicate header.
  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={[styles.scrollView, { ...Platform.select({ web: { overflowY: 'auto' } }) }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back, {parentProfile?.parentName || 'Parent'} 👋</Text>
          <Text style={styles.welcomeSub}>
            Here's an overview of {parentProfile?.studentName || 'your ward'}'s academic journey this week.
          </Text>
        </View>

        {/* Stat Cards + Pending Fees */}
        {isTablet ? (
          <View style={styles.rowWrap}>
            <StatCard label="ATTENDANCE" value={`${attendanceData.percentage}%`} badge={`${attendanceData.presentDays}/${attendanceData.totalDays} days`} />
            <StatCard label="LAST RANK" value="#04" badge="Class Standing" badgeColor={COLORS.subText} />
            <PendingFeesCard onPayNow={goToPayment} />
          </View>
        ) : (
          <>
            <View style={styles.statRow}>
              <StatCard label="ATTENDANCE" value={`${attendanceData.percentage}%`} badge={`${attendanceData.presentDays}/${attendanceData.totalDays} days`} />
              <StatCard label="LAST RANK" value="#04" badge="Class Standing" badgeColor={COLORS.subText} />
            </View>
            <PendingFeesCard onPayNow={goToPayment} />
          </>
        )}

        {/* Attendance Trend + Quick Actions */}
        {isTablet ? (
          <View style={styles.rowWrap}>
            <View style={{ flex: 1.8 }}>
              <AttendanceTrend />
            </View>
            <View style={{ flex: 1 }}>
              <QuickActions
                onDownload={goToReports}
                onMessage={goToMessages}
                onPrevYears={goToPrevYears}
              />
            </View>
          </View>
        ) : (
          <>
            <AttendanceTrend />
            <QuickActions
              onDownload={goToReports}
              onMessage={goToMessages}
              onPrevYears={goToPrevYears}
            />
          </>
        )}

        {/* Results + Announcements */}
        {isTablet ? (
          <View style={styles.rowWrap}>
            <View style={{ flex: 1.6 }}>
              <AcademicResults />
            </View>
            <View style={{ flex: 1 }}>
              <AnnouncementsCard />
            </View>
          </View>
        ) : (
          <>
            <AcademicResults />
            <AnnouncementsCard />
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },

  // Page Header (sub-screens)
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 32 : 18,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 22, color: COLORS.text, fontWeight: '300', marginTop: -2 },
  pageTitle: { fontSize: isTablet ? 20 : 17, fontWeight: '700', color: COLORS.text },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 32 : 18,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logo: { fontSize: isTablet ? 22 : 18, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },
  avatarBtn: {},
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  // Scroll
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    paddingHorizontal: isTablet ? 32 : 14,
    paddingTop: 22,
    paddingBottom: 32,
    gap: 14,
  },

  // Welcome
  welcomeSection: { marginBottom: 4 },
  welcomeText: { fontSize: isTablet ? 28 : 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  welcomeSub: { fontSize: isTablet ? 15 : 13, color: COLORS.subText, marginTop: 4 },

  // Stat Cards
  statRow: { flexDirection: 'row', gap: 12 },
  rowWrap: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  statCard: {
    flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statCardTablet: { padding: 24 },
  statIconCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statIcon: { fontSize: 20 },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, marginBottom: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.subText, letterSpacing: 1, marginTop: 4 },
  statValue: { fontSize: isTablet ? 28 : 24, fontWeight: '800', color: COLORS.text, marginTop: 4, letterSpacing: -0.5 },

  // Pending Fees
  pendingCard: {
    backgroundColor: COLORS.primary, borderRadius: 18, padding: 20,
    shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  pendingCardTablet: { flex: 0.8, padding: 24 },
  pendingLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  pendingAmount: { fontSize: isTablet ? 32 : 28, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  pendingDue: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3, marginBottom: 16 },
  payBtn: {
    backgroundColor: COLORS.white, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', marginBottom: 10,
  },
  payBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  invoiceLink: {
    color: 'rgba(255,255,255,0.85)', textAlign: 'center',
    fontSize: 13, fontWeight: '600',
  },

  // Invoice Expand
  invoiceExpand: { marginTop: 14 },
  invoiceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  invoiceKey: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  invoiceVal: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  invoiceItemLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', flex: 1 },
  invoiceItemAmt: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  invoiceTotalLabel: { fontSize: 12, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  invoiceTotalAmt: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  invoiceStatusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  invoiceStatusText: { fontSize: 11, fontWeight: '700', color: COLORS.white },

  // Trend
  trendCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 18, padding: isTablet ? 24 : 18,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  trendTitle: { fontSize: isTablet ? 18 : 16, fontWeight: '700', color: COLORS.text },
  trendPeriod: { fontSize: 12, color: COLORS.subText, fontWeight: '500' },
  chartContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', paddingHorizontal: 4,
  },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4, minWidth: isTablet ? 52 : 42 },
  barPercent: { fontSize: 9, color: COLORS.subText, fontWeight: '600' },
  bar: { width: isTablet ? 32 : 24, borderRadius: 8 },
  barLabel: { fontSize: 10, color: COLORS.subText, fontWeight: '600', letterSpacing: 0.5 },

  // Quick Actions
  quickCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 18, padding: isTablet ? 24 : 18,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  quickTitle: { fontSize: isTablet ? 18 : 16, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  quickItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: 12, padding: 13, marginBottom: 10,
  },
  quickIconCircle: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  quickIcon: { fontSize: 16 },
  quickLabel: { flex: 1, fontSize: isTablet ? 15 : 13, fontWeight: '600', color: COLORS.text },
  quickArrow: { fontSize: 20, color: COLORS.subText, fontWeight: '300' },

  // Results
  resultsCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 18, padding: isTablet ? 24 : 18,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  resultsTitle: { fontSize: isTablet ? 18 : 16, fontWeight: '700', color: COLORS.text },
  viewAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  resultItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 12,
  },
  resultIconCircle: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center', justifyContent: 'center',
  },
  resultIconText: { fontSize: 20 },
  resultInfo: { flex: 1 },
  resultType: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.8, marginBottom: 2 },
  resultSubject: { fontSize: isTablet ? 15 : 13, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  resultMeta: { fontSize: 11, color: COLORS.subText },
  resultScoreWrap: { alignItems: 'flex-end', gap: 4 },
  gradeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  gradeText: { fontSize: 11, fontWeight: '800' },
  resultScore: { fontSize: isTablet ? 20 : 18, fontWeight: '800', color: COLORS.text },
  resultTotal: { fontSize: 13, fontWeight: '400', color: COLORS.subText },

  // Announcements
  announcementsCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 18, padding: isTablet ? 24 : 18,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  annHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  annIcon: { fontSize: 18 },
  annTitle: { fontSize: isTablet ? 18 : 16, fontWeight: '700', color: COLORS.text },
  annMain: { backgroundColor: COLORS.background, borderRadius: 14, padding: 14, marginBottom: 16 },
  annBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.badgeBg,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  annBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  annEventTitle: { fontSize: isTablet ? 17 : 15, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  annEventDesc: { fontSize: 12, color: COLORS.subText, lineHeight: 18, marginBottom: 12 },
  annFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  annAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  annName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  annRole: { fontSize: 11, color: COLORS.subText },
  annArrowBtn: {
    marginLeft: 'auto', width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  annArrow: { fontSize: 18, color: COLORS.text },
  prevUpdates: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  prevLabel: { fontSize: 10, fontWeight: '700', color: COLORS.subText, letterSpacing: 1, marginBottom: 10 },
  prevItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 5 },
  prevTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  prevDate: { fontSize: 11, color: COLORS.subText },

  // Payment Screen
  paySummaryCard: {
    backgroundColor: COLORS.primary, borderRadius: 18, padding: 24,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  paySummaryLabel: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  paySummaryAmount: { fontSize: 36, fontWeight: '800', color: COLORS.white, letterSpacing: -1 },
  paySummaryMeta: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  payMethodCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  payMethodTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  methodItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: 14,
    padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 2, borderColor: 'transparent',
  },
  methodItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  methodIcon: { fontSize: 22 },
  methodLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  methodSub: { fontSize: 11, color: COLORS.subText, marginTop: 2 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.subText,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: COLORS.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  payNowBigBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  payNowBigText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  paySecureNote: { textAlign: 'center', fontSize: 12, color: COLORS.subText, marginTop: -4 },
  paySuccessContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  paySuccessIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#ECFDF5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  paySuccessTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  paySuccessSub: { fontSize: 15, color: COLORS.subText, marginBottom: 6 },
  paySuccessRef: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 32 },
  backHomeBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  backHomeBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },

  // Reports Screen
  reportItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 14,
  },
  reportIconCircle: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center', justifyContent: 'center',
  },
  reportName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  reportMeta: { fontSize: 12, color: COLORS.subText },
  downloadBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  downloadBtnText: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },

  // Teachers Screen
  teacherItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 14,
  },
  teacherAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center', justifyContent: 'center',
  },
  teacherName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  teacherSubject: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginBottom: 2 },
  teacherLastMsg: { fontSize: 11, color: COLORS.subText },
  msgArrow: { fontSize: 22, color: COLORS.subText, fontWeight: '300' },

  composeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  composeCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    gap: 10,
  },
  composeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  composeClose: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.subText,
  },
  composeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.subText,
    marginTop: 4,
  },
  composeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  composeInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#FAFAFD',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  composeInputMulti: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  composeSendBtn: {
    marginTop: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  composeSendText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },

  // Previous Years Screen
  yearCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  yearTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  yearStats: { flexDirection: 'row', gap: 0 },
  yearStat: {
    flex: 1, alignItems: 'center',
    borderRightWidth: 1, borderRightColor: COLORS.border,
    paddingHorizontal: 8,
  },
  yearStatLabel: { fontSize: 10, fontWeight: '700', color: COLORS.subText, letterSpacing: 0.8, marginBottom: 4 },
  yearStatValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
});