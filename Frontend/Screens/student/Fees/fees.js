import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#F2F2F7',
  white: '#FFFFFF',
  indigo: '#4F46E5',
  indigoLight: '#EEF2FF',
  indigoDark: '#3730A3',
  indigoGrad: '#6D28D9',
  dark: '#111827',
  text: '#374151',
  muted: '#9CA3AF',
  mutedLight: '#E5E7EB',
  border: '#E5E7EB',
  green: '#10B981',
  greenLight: '#D1FAE5',
  red: '#EF4444',
  redLight: '#FEE2E2',
  amber: '#F59E0B',
  pink: '#EC4899',
  pinkLight: '#FCE7F3',
  deadlineCard: '#5B21B6',
  deadlineCardDark: '#4C1D95',
  successGreen: '#10B981',
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const feeBreakdown = [
  { icon: '📖', label: 'Tuition Fee',    status: 'Paid',    statusColor: C.green,  statusBg: C.greenLight, amount: '₹1,25,000',  accent: C.indigo },
  { icon: '📚', label: 'Library Access', status: 'Paid',    statusColor: C.green,  statusBg: C.greenLight, amount: '₹10,000',  accent: C.indigo },
  { icon: '🔬', label: 'Lab Equipment',  status: 'Pending', statusColor: C.red,    statusBg: C.redLight,   amount: '₹5001',  accent: C.red    },
  { icon: '🏋', label: 'Sports & Gym',   status: 'Paid',    statusColor: C.green,  statusBg: C.greenLight, amount: '₹5001',  accent: C.indigo },
];

const paymentHistory = [
  { date: 'Sep 28, 2024', desc: 'Semester 2 Tuition - Part 1', amount: '₹70,000', status: 'Success' },
  { date: 'Aug 15, 2024', desc: 'Library Annual Membership',   amount: '₹5,000', status: 'Success' },
  { date: 'Jul 10, 2024', desc: 'Advanced Lab Access Fee',     amount: '₹2,500', status: 'Success' },
];

const upcomingDues = [
  { label: 'Lab Equipment Fee', sub: 'Due in 12 days', amount: '₹2500' },
  { label: 'Tuition Fee', sub: 'Due in 24 days', amount: '₹37,500'  },
];

// ─── Summary Cards ────────────────────────────────────────────────────────────
function SummaryCards() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.summaryRow}
    >
      {/* Total Paid */}
      <TouchableOpacity activeOpacity={0.8} style={styles.summaryCard}>
        <View style={[styles.summaryIconBox, { backgroundColor: C.indigoLight }]}>
          <Text style={styles.summaryIconText}>✔</Text>
        </View>
        <Text style={styles.summaryLabel}>TOTAL PAID</Text>
        <Text style={styles.summaryValue}>₹1,00,000</Text>
        <View style={styles.summaryNoteRow}>
          <Text style={styles.summaryNoteIcon}>↗</Text>
          <Text style={styles.summaryNote}>84% of Annual Goal</Text>
        </View>
      </TouchableOpacity>

      {/* Total Pending */}
      <TouchableOpacity activeOpacity={0.8} style={styles.summaryCard}>
        <View style={[styles.summaryIconBox, { backgroundColor: C.pinkLight }]}>
          <Text style={[styles.summaryIconText, { color: C.pink }]}>📄</Text>
        </View>
        <Text style={styles.summaryLabel}>TOTAL PENDING</Text>
        <Text style={styles.summaryValue}>₹37,500</Text>
        <View style={styles.summaryNoteRow}>
          <Text style={[styles.summaryNoteIcon, { color: C.red }]}>⚠</Text>
          <Text style={[styles.summaryNote, { color: C.red }]}>Awaiting Verification</Text>
        </View>
      </TouchableOpacity>

      {/* Next Deadline */}
      <TouchableOpacity activeOpacity={0.8} style={styles.deadlineCard}>
        <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={styles.summaryIconText}>📅</Text>
        </View>
        <Text style={styles.deadlineLabel}>NEXT DEADLINE</Text>
        <Text style={styles.deadlineDate}>Oct 15,{'\n'}2024</Text>
        <View style={styles.summaryNoteRow}>
          <Text style={{ fontSize: 12 }}>⏰</Text>
          <Text style={styles.deadlineDaysLeft}>12 Days Left</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Fee Breakdown ────────────────────────────────────────────────────────────
function FeeBreakdown() {
  return (
    <View style={[styles.card, { marginTop: 16 }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fee Breakdown</Text>
      </View>
      <View style={styles.feeGrid}>
        {feeBreakdown.map((item, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.75}
            style={[styles.feeItem, { borderLeftColor: item.accent }]}
          >
            <View style={styles.feeLeft}>
              <View style={styles.feeIconBox}>
                <Text style={styles.feeIcon}>{item.icon}</Text>
              </View>
              <View>
                <Text style={styles.feeLabel}>{item.label}</Text>
                <View style={[styles.feeStatusBadge, { backgroundColor: item.statusBg }]}>
                  <Text style={[styles.feeStatus, { color: item.statusColor }]}>{item.status}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.feeAmount}>{item.amount}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Payment History ──────────────────────────────────────────────────────────
function PaymentHistory() {
  return (
    <View style={[styles.card, { marginTop: 16 }]}>
      <Text style={styles.sectionTitle}>Payment History</Text>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        {['DATE', 'DESCRIPTION', 'AMOUNT', 'RECEIPT', 'STATUS'].map((h) => (
          <Text
            key={h}
            style={[
              styles.tableHeadCell,
              h === 'DESCRIPTION' && styles.colDesc,
              h === 'DATE' && styles.colDate,
            ]}
          >
            {h}
          </Text>
        ))}
      </View>
      {paymentHistory.map((row, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.75}
          style={[styles.tableRow, i < paymentHistory.length - 1 && styles.tableRowBorder]}
        >
          <Text style={[styles.tableCell, styles.colDate]}>{row.date}</Text>
          <Text style={[styles.tableCell, styles.colDesc]}>{row.desc}</Text>
          <Text style={[styles.tableCell, styles.colAmount]}>{row.amount}</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.receiptBtn}>
            <Text style={styles.receiptIcon}>🧾</Text>
          </TouchableOpacity>
          <View style={styles.successBadge}>
            <View style={styles.successDot} />
            <Text style={styles.successText}>{row.status}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Upcoming Dues ────────────────────────────────────────────────────────────
function UpcomingDues() {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Upcoming Dues</Text>
      {upcomingDues.map((item, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.75}
          style={[styles.dueRow, i < upcomingDues.length - 1 && styles.dueRowBorder]}
        >
          <View style={styles.dueLeft}>
            <Text style={styles.dueLabel}>{item.label}</Text>
            <Text style={styles.dueSub}>{item.sub}</Text>
          </View>
          <Text style={styles.dueAmount}>{item.amount}</Text>
        </TouchableOpacity>
      ))}
      <View style={styles.dueTotalRow}>
        <Text style={styles.dueTotalLabel}>Total Payable</Text>
        <Text style={styles.dueTotalAmount}>₹1,00,000</Text>
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FinancialOverview() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Heading */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Financial Overview</Text>
          <Text style={styles.pageSub}>
            Manage your tuition fees and track payment history in real-time.
          </Text>
        </View>

        {/* Summary Cards */}
        <SummaryCards />

        {/* Main grid */}
        <View style={[styles.mainGrid, !isTablet && styles.mainGridCol]}>
          {/* Left */}
          <View style={isTablet ? styles.leftCol : styles.fullWidth}>
            <FeeBreakdown />
            <PaymentHistory />
          </View>

          {/* Right */}
          <View style={isTablet ? styles.rightCol : styles.fullWidth}>
            <UpcomingDues />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    padding: isTablet ? 24 : 16,
    gap: 0,
  },

  // ── Page Header ──
  pageHeader: { marginBottom: 18 },
  pageTitle: {
    fontSize: isTablet ? 30 : 24,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -0.6,
  },
  pageSub: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 18 },

  // ── Summary Cards ──
  summaryRow: { gap: 12, paddingRight: 16, paddingBottom: 2 },
  summaryCard: {
    width: isTablet ? 220 : SCREEN_WIDTH * 0.62,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
    gap: 6,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  summaryIconText: { fontSize: 18, color: C.indigo },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -0.8,
  },
  summaryNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryNoteIcon: { fontSize: 12, color: C.green },
  summaryNote: { fontSize: 12, color: C.green, fontWeight: '600' },

  // Deadline card (purple)
  deadlineCard: {
    width: isTablet ? 220 : SCREEN_WIDTH * 0.62,
    backgroundColor: C.deadlineCard,
    borderRadius: 20,
    padding: 18,
    shadowColor: C.deadlineCard,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
    gap: 6,
  },
  deadlineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  deadlineDate: {
    fontSize: 28,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  deadlineDaysLeft: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginLeft: 4,
  },

  // ── Layout ──
  mainGrid: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    marginTop: 0,
  },
  mainGridCol: { flexDirection: 'column' },
  leftCol: { flex: 2 },
  rightCol: { flex: 1, minWidth: 260 },
  fullWidth: { width: '100%' },

  // ── Card ──
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.dark,
    marginBottom: 14,
  },
  linkText: {
    fontSize: 13,
    color: C.indigo,
    fontWeight: '600',
  },

  // ── Fee Breakdown ──
  feeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  feeItem: {
    width: isTablet ? '47%' : '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderRadius: 14,
    borderLeftWidth: 3,
    padding: 14,
  },
  feeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  feeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.indigoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeIcon: { fontSize: 16 },
  feeLabel: { fontSize: 14, fontWeight: '700', color: C.dark },
  feeStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  feeStatus: { fontSize: 10, fontWeight: '700' },
  feeAmount: { fontSize: 16, fontWeight: '800', color: C.dark },

  // ── Payment History Table ──
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 4,
  },
  tableHeadCell: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.5,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
  },
  tableCell: { fontSize: 13, color: C.text, flex: 1 },
  colDate: { flex: 1.2, fontSize: 12 },
  colDesc: { flex: 2 },
  colAmount: { flex: 1, fontWeight: '700', color: C.dark },
  receiptBtn: {
    flex: 0.8,
    alignItems: 'center',
  },
  receiptIcon: { fontSize: 18 },
  successBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  successDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.successGreen,
  },
  successText: {
    fontSize: 12,
    color: C.successGreen,
    fontWeight: '700',
  },

  // ── Upcoming Dues ──
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dueRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
  },
  dueLeft: { flex: 1 },
  dueLabel: { fontSize: 14, fontWeight: '700', color: C.dark },
  dueSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  dueAmount: { fontSize: 16, fontWeight: '800', color: C.dark },
  dueTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  dueTotalLabel: { fontSize: 14, color: C.text, fontWeight: '600' },
  dueTotalAmount: { fontSize: 22, fontWeight: '800', color: C.indigo },

  // ── Financial Aid styles kept as-is ──
  aidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  aidIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aidTitle: { fontSize: 16, fontWeight: '800', color: C.dark },
  aidBody: {
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  aidScholarshipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1,
  },
  aidAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aidAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -0.5,
  },
  aidAppliedBadge: {
    backgroundColor: C.pinkLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aidAppliedText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.pink,
  },
  aidNote: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 17,
  },
});