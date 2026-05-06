import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Linking,
  Alert,
  Platform,
  Modal,
  Switch,
} from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// ─── Icons (inline SVG-like via Text) ───────────────────────────────────────
const Icon = ({ name, size = 16, color = '#6C5CE7' }) => {
  const icons = {
    download: '↓',
    check: '✓',
    tuition: '🎓',
    extracurricular: '⚽',
    infrastructure: '🏛️',
    question: '?',
    leaf: '🌿',
    card: '💳',
    bank: '🏦',
    autopay: '⚡',
    arrow: '→',
    close: '✕',
    info: 'ℹ',
  };
  return (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>
      {icons[name] || '•'}
    </Text>
  );
};

// ─── Fee Breakdown Bar ───────────────────────────────────────────────────────
const BreakdownBar = ({ label, percent, color = '#6C5CE7' }) => {
  const animWidth = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(animWidth, {
      toValue: percent,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.barRow}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barPercent}>{percent}%</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: color,
              width: animWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

// ─── Payment Row ─────────────────────────────────────────────────────────────
const PaymentRow = ({ icon, title, subtitle, method, amount, status }) => (
  <View style={styles.paymentRow}>
    <View style={styles.paymentIcon}>
      <Icon name={icon} size={18} color="#6C5CE7" />
    </View>
    <View style={styles.paymentInfo}>
      <Text style={styles.paymentTitle}>{title}</Text>
      <Text style={styles.paymentSub}>{subtitle}</Text>
      <Text style={styles.paymentMethod}>{method}</Text>
    </View>
    <View style={styles.paymentRight}>
      <Text style={styles.paymentAmount}>{amount}</Text>
      <View style={styles.successBadge}>
        <Text style={styles.successText}>✓ {status}</Text>
      </View>
    </View>
  </View>
);

// ─── Export Modal ─────────────────────────────────────────────────────────────
const ExportModal = ({ visible, onClose }) => {
  const formats = [
    { label: 'Export as PDF', icon: '📄', ext: 'pdf' },
    { label: 'Export as CSV', icon: '📊', ext: 'csv' },
    { label: 'Export as Excel', icon: '📋', ext: 'xlsx' },
    { label: 'Export as JSON', icon: '🔧', ext: 'json' },
  ];

  const handleExport = (ext) => {
    Alert.alert('Export Started', `Your payment history is being exported as .${ext}`, [
      { text: 'OK', onPress: onClose },
    ]);
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.exportModal}>
          <View style={styles.exportModalHeader}>
            <Text style={styles.exportModalTitle}>Export Payment History</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.exportModalSub}>Choose your preferred format</Text>
          {formats.map((f) => (
            <TouchableOpacity
              key={f.ext}
              style={styles.exportOption}
              onPress={() => handleExport(f.ext)}
              activeOpacity={0.7}
            >
              <Text style={styles.exportOptionIcon}>{f.icon}</Text>
              <Text style={styles.exportOptionLabel}>{f.label}</Text>
              <Text style={styles.exportOptionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Assistance Modal ─────────────────────────────────────────────────────────
const AssistanceModal = ({ visible, onClose }) => {
  const options = [
    { label: 'Call Finance Office', action: () => Linking.openURL('tel:+18001234567') },
    { label: 'Email Finance Team', action: () => Linking.openURL('mailto:finance@university.edu') },
    { label: 'Live Chat Support', action: () => Alert.alert('Live Chat', 'Connecting to support agent...') },
    { label: 'View FAQ', action: () => Alert.alert('FAQ', 'Opening Help Center...') },
  ];

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.exportModal, { paddingBottom: 28 }]}>
          <View style={styles.exportModalHeader}>
            <Text style={styles.exportModalTitle}>Need Assistance?</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.exportModalSub}>Contact the Finance Office</Text>
          {options.map((o, i) => (
            <TouchableOpacity
              key={i}
              style={styles.exportOption}
              onPress={() => { o.action(); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.exportOptionLabel}>{o.label}</Text>
              <Text style={styles.exportOptionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Pay Modal ────────────────────────────────────────────────────────────────
const PayModal = ({ visible, onClose }) => {
  const methods = [
    { label: 'Credit / Debit Card', icon: '💳' },
    { label: 'Bank Transfer', icon: '🏦' },
    { label: 'UPI / Net Banking', icon: '📱' },
    { label: 'Autopay Setup', icon: '⚡' },
  ];

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.exportModal]}>
          <View style={styles.exportModalHeader}>
            <Text style={styles.exportModalTitle}>Pay Outstanding Balance</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.payAmountBanner}>
            <Text style={styles.payAmountLabel}>Amount Due</Text>
            <Text style={styles.payAmountValue}>₹1,00,000</Text>
          </View>
          <Text style={styles.exportModalSub}>Select payment method</Text>
          {methods.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={styles.exportOption}
              onPress={() => {
                Alert.alert('Payment', `Proceeding with ${m.label}...`);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.exportOptionIcon}>{m.icon}</Text>
              <Text style={styles.exportOptionLabel}>{m.label}</Text>
              <Text style={styles.exportOptionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FeesReceiptsDashboard() {
  const [exportVisible, setExportVisible] = useState(false);
  const [assistanceVisible, setAssistanceVisible] = useState(false);
  const [payVisible, setPayVisible] = useState(false);
  const [paperless, setPaperless] = useState(true);
  const [autopayVisible, setAutopayVisible] = useState(false);

  const payments = [
    {
      icon: 'tuition',
      title: 'Tuition Installment - Q3',
      subtitle: 'INV-882901 • Oct 12, 2023',
      method: 'Credit Card **** 4242',
      amount: '₹1,00,000',
      status: 'Successful',
    },
    {
      icon: 'extracurricular',
      title: 'Extracurricular Fee',
      subtitle: 'INV-882855 • Sep 04, 2023',
      method: 'Bank Transfer',
      amount: '₹5,000',
      status: 'Successful',
    },
    {
      icon: 'infrastructure',
      title: 'Annual Infrastructure',
      subtitle: 'INV-882712 • Aug 15, 2023',
      method: 'Credit Card **** 4242',
      amount: '₹1,37,500',
      status: 'Successful',
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.pageLabel}>Curator Dashboard</Text>
          <Text style={styles.pageTitle}>Fees & Receipts</Text>
          <Text style={styles.pageDesc}>
            Manage academic financial records and upcoming tuition obligations with curated clarity.
          </Text>
        </View>

        {/* ── Top Stats ── */}
        <View style={[styles.row, isTablet && styles.rowTablet]}>
          {/* Total Fees Paid */}
          <View style={[styles.card, styles.statCard, isTablet && styles.cardHalf]}>
            <Text style={styles.statLabel}>TOTAL FEES PAID</Text>
            <View style={styles.statAmountRow}>
              <Text style={styles.statAmount}>₹1,00,000</Text>
              <View style={styles.upBadge}>
                <Text style={styles.upBadgeText}>↑ 8%</Text>
              </View>
            </View>
            <Text style={styles.statFooter}>Calculated for Academic Year 2023-24</Text>
          </View>

          {/* Outstanding Balance */}
          <TouchableOpacity
            style={[styles.card, styles.outstandingCard, isTablet && styles.cardHalf]}
            onPress={() => setPayVisible(true)}
            activeOpacity={0.88}
          >
            <Text style={styles.outstandingLabel}>OUTSTANDING BALANCE</Text>
            <Text style={styles.outstandingAmount}>₹37,500</Text>
            <TouchableOpacity
              style={styles.payNowBtn}
              onPress={() => setPayVisible(true)}
              activeOpacity={0.82}
            >
              <Text style={styles.payNowText}>💳  Pay Now</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* ── Main Content Grid ── */}
        <View style={[isTablet && styles.gridTablet]}>
          {/* Left Column */}
          <View style={[isTablet && styles.gridLeft]}>

            {/* Payment History */}
            <View style={[styles.card, styles.paymentCard]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Payment History</Text>
                <TouchableOpacity
                  style={styles.exportAllBtn}
                  onPress={() => setExportVisible(true)}
                  activeOpacity={0.78}
                >
                  <Text style={styles.exportAllText}>Export All  ↓</Text>
                </TouchableOpacity>
              </View>
              {payments.map((p, i) => (
                <PaymentRow key={i} {...p} />
              ))}
            </View>

            {/* Automate Your Payments */}
            <View style={[styles.card, styles.autopayCard]}>
              <View style={styles.autopayContent}>
                <Text style={styles.autopayIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.autopayTitle}>Automate Your Payments</Text>
                  <Text style={styles.autopayDesc}>
                    Set up autopay and never miss a deadline. Secure, instant, and always on time.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.autopayBtn}
                onPress={() => setAutopayVisible(true)}
                activeOpacity={0.82}
              >
                <Text style={styles.autopayBtnText}>Set Up Autopay  →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Column */}
          <View style={[isTablet && styles.gridRight]}>

            {/* Fee Breakdown */}
            <View style={[styles.card, styles.breakdownCard]}>
              <Text style={styles.sectionTitle}>Fee Breakdown</Text>
              <View style={{ marginTop: 16 }}>
                <BreakdownBar label="Tuition Fees" percent={90} color="#6C5CE7" />
                <BreakdownBar label="Extracurricular" percent={65} color="#A29BFE" />
                <BreakdownBar label="Infrastructure" percent={100} color="#2D3436" />
              </View>

              {/* Need Assistance */}
              <TouchableOpacity
                style={styles.assistanceBtn}
                onPress={() => setAssistanceVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.assistanceBadge}>
                  <Text style={styles.assistanceBadgeText}>?</Text>
                </View>
                <View>
                  <Text style={styles.assistanceTitle}>NEED ASSISTANCE?</Text>
                  <Text style={styles.assistanceSub}>Contact Finance Office</Text>
                </View>
                <Text style={styles.assistanceArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Paperless Billing */}
            <View style={[styles.card, styles.paperlessCard]}>
              <View style={styles.paperlessHeader}>
                <View style={styles.paperlessIconWrap}>
                  <Text style={{ fontSize: 22 }}>🌿</Text>
                </View>
                <Switch
                  value={paperless}
                  onValueChange={(val) => {
                    setPaperless(val);
                    Alert.alert(
                      val ? 'Paperless Billing On' : 'Paperless Billing Off',
                      val
                        ? 'You will now receive receipts via email.'
                        : 'You will now receive physical receipts.'
                    );
                  }}
                  trackColor={{ false: '#DFE6E9', true: '#6C5CE7' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#DFE6E9"
                />
              </View>
              <Text style={styles.paperlessTitle}>Paperless Billing</Text>
              <Text style={styles.paperlessDesc}>
                Receive all tax-compliant receipts and invoices via email. Reduce waste and access records anytime.
              </Text>
              <View style={[styles.paperlessBadge, { backgroundColor: paperless ? '#EDE9FF' : '#F5F5F5' }]}>
                <Text style={[styles.paperlessBadgeText, { color: paperless ? '#6C5CE7' : '#999' }]}>
                  {paperless ? '✓  Paperless Enabled' : '○  Paperless Disabled'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Modals ── */}
      <ExportModal visible={exportVisible} onClose={() => setExportVisible(false)} />
      <AssistanceModal visible={assistanceVisible} onClose={() => setAssistanceVisible(false)} />
      <PayModal visible={payVisible} onClose={() => setPayVisible(false)} />

      {/* Autopay Modal */}
      <Modal transparent animationType="slide" visible={autopayVisible} onRequestClose={() => setAutopayVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAutopayVisible(false)}>
          <View style={styles.exportModal}>
            <View style={styles.exportModalHeader}>
              <Text style={styles.exportModalTitle}>Set Up Autopay</Text>
              <TouchableOpacity onPress={() => setAutopayVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.exportModalSub}>Choose your autopay method</Text>
            {[
              { label: 'Link Credit Card', icon: '💳' },
              { label: 'Link Bank Account', icon: '🏦' },
              { label: 'UPI Mandate', icon: '📱' },
            ].map((m, i) => (
              <TouchableOpacity
                key={i}
                style={styles.exportOption}
                onPress={() => {
                  Alert.alert('Autopay', `Setting up autopay with ${m.label}...`);
                  setAutopayVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.exportOptionIcon}>{m.icon}</Text>
                <Text style={styles.exportOptionLabel}>{m.label}</Text>
                <Text style={styles.exportOptionArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scroll: { flex: 1 },
  container: {
    padding: isTablet ? 32 : 16,
    paddingBottom: 48,
  },

  // Header
  header: { marginBottom: 24 },
  pageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C5CE7',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: isTablet ? 40 : 30,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  pageDesc: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 22,
    maxWidth: 500,
  },

  // Layout helpers
  row: { flexDirection: 'column', gap: 14 },
  rowTablet: { flexDirection: 'row', gap: 16, alignItems: 'stretch' },
  cardHalf: { flex: 1 },
  gridTablet: { flexDirection: 'row', gap: 16, marginTop: 0 },
  gridLeft: { flex: 1.4 },
  gridRight: { flex: 1 },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  // Stat Card
  statCard: { justifyContent: 'center' },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B2BEC3',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  statAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statAmount: { fontSize: isTablet ? 32 : 26, fontWeight: '800', color: '#1A1A2E' },
  upBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  upBadgeText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  statFooter: { fontSize: 12, color: '#B2BEC3', marginTop: 8 },

  // Outstanding
  outstandingCard: {
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
  },
  outstandingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  outstandingAmount: {
    fontSize: isTablet ? 36 : 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  payNowBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  payNowText: { fontSize: 14, fontWeight: '700', color: '#6C5CE7' },

  // Payment History
  paymentCard: { marginTop: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  exportAllBtn: {
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  exportAllText: { fontSize: 13, fontWeight: '600', color: '#6C5CE7' },

  // Payment Row
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8F9FE',
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EDE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  paymentSub: { fontSize: 11, color: '#B2BEC3', marginTop: 2 },
  paymentMethod: { fontSize: 11, color: '#636E72', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end', gap: 6 },
  paymentAmount: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  successBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  successText: { fontSize: 11, fontWeight: '600', color: '#2E7D32' },

  // Autopay
  autopayCard: {
    backgroundColor: '#1A1A2E',
    gap: 14,
  },
  autopayContent: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  autopayIcon: { fontSize: 28 },
  autopayTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  autopayDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  autopayBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  autopayBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Fee Breakdown
  breakdownCard: {},
  barRow: { marginBottom: 16 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { fontSize: 13, fontWeight: '500', color: '#2D3436' },
  barPercent: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  barTrack: {
    height: 8,
    backgroundColor: '#F0EFFF',
    borderRadius: 100,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 100 },

  // Assistance
  assistanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    gap: 12,
  },
  assistanceBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistanceBadgeText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  assistanceTitle: { fontSize: 10, fontWeight: '700', color: '#B2BEC3', letterSpacing: 1 },
  assistanceSub: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  assistanceArrow: { fontSize: 22, color: '#6C5CE7', marginLeft: 'auto' },

  // Paperless
  paperlessCard: {},
  paperlessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paperlessIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EDE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperlessTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  paperlessDesc: { fontSize: 13, color: '#636E72', lineHeight: 20, marginBottom: 14 },
  paperlessBadge: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  paperlessBadgeText: { fontSize: 13, fontWeight: '600' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  exportModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  exportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exportModalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  exportModalSub: { fontSize: 13, color: '#B2BEC3', marginBottom: 16 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#636E72', fontWeight: '700' },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F7',
    gap: 12,
  },
  exportOptionIcon: { fontSize: 20 },
  exportOptionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  exportOptionArrow: { fontSize: 22, color: '#B2BEC3' },

  // Pay Modal extras
  payAmountBanner: {
    backgroundColor: '#6C5CE7',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  payAmountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 1 },
  payAmountValue: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginTop: 4 },
});