import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
  Alert,
  NativeModules,
} from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URLS, fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;


const normalizeBatchForFees = (batch) => {
  const students = Array.isArray(batch?.students)
    ? batch.students.map((student, index) => {
        const paidFees = Number(student?.paidFees) || 0;
        const pendingFees = Number(student?.pendingFees) || 0;
        const totalFees = Number(student?.totalFees) || paidFees + pendingFees;

        return {
          id: student?.id || student?._id || index + 1,
          name: student?.name || student?.fullName || `Student ${index + 1}`,
          paidFees,
          pendingFees,
          totalFees,
        };
      })
    : [];

  return {
    id: batch?._id || batch?.id || Date.now().toString(),
    grade: batch?.name || 'Unnamed Batch',
    subtitle: batch?.description || `${batch?.type || 'Regular'} • Academic Session`,
    tag: (batch?.type || 'REGULAR').toUpperCase(),
    tagColor: '#E8F4FD',
    tagText: '#2980B9',
    count: students.length,
    icon: '🎓',
    premium: false,
    students,
  };
};

const NAV_ITEMS = [
  { id: 'batches', label: 'BATCHES', icon: '⊞' },
  { id: 'ledger',  label: 'LEDGER',  icon: '📋' },
  { id: 'reports', label: 'REPORTS', icon: '📊' },
  { id: 'settings',label: 'SETTINGS',icon: '⚙️' },
];

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

const StatusCard = ({ batchCount }) => (
  <View style={styles.statusCard}>
    <Text style={styles.statusLabel}>SYSTEM STATUS</Text>
    <View style={styles.statusRow}>
      <View style={styles.statusTextBlock}>
        <Text style={styles.statusTitle}>Active{'\n'}Batches</Text>
        <Text style={styles.statusSub}>94% of sessions have finalized structures</Text>
      </View>
      <Text style={styles.statusCount}>{batchCount}</Text>
    </View>
  </View>
);



const BatchCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={[styles.batchCard, item.premium && styles.batchCardPremium]}
    onPress={() => onPress(item)}
    activeOpacity={0.72}
  >
    <View style={styles.batchCardTop}>
      <View style={[styles.iconCircle, item.premium && styles.iconCirclePremium]}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={[styles.tag, { backgroundColor: item.tagColor }]}>
        <Text style={[styles.tagText, { color: item.tagText }]}>{item.tag}</Text>
      </View>
    </View>

    <Text style={[styles.batchGrade, item.premium && styles.batchGradePremium]}>
      {item.grade}
    </Text>
    <Text style={styles.batchSub}>{item.subtitle}</Text>

    <View style={styles.batchFooter}>
      <View>
        <Text style={styles.countLabel}>STUDENT COUNT</Text>
        <Text style={[styles.countValue, item.premium && styles.countValuePremium]}>
          {item.count} Enrolled
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.updateBtn, item.premium && styles.updateBtnPremium]}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.updateBtnText}>Fee Details</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const CreateBatchCard = ({ onPress }) => (
  <TouchableOpacity
    style={styles.createCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.createPlus}>+</Text>
    <Text style={styles.createTitle}>Create New Batch</Text>
    <Text style={styles.createSub}>Initialize a new academic cohort</Text>
  </TouchableOpacity>
);

// ─── STUDENT FEE LIST MODAL ───────────────────────────────────────────────────

const StudentFeeListModal = ({ visible, batch, students, onClose }) => {
  const getStatusColor = (pending) => {
    if (pending === 0) return '#16A34A';
    if (pending <= 10000) return '#F59E0B';
    return '#DC2626';
  };

  const getStatusText = (pending) => {
    if (pending === 0) return 'PAID';
    if (pending <= 10000) return 'PARTIAL';
    return 'PENDING';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <View style={styles.modalTitleContainer}>
            <Text style={styles.modalTitle}>Fee Details</Text>
            <Text style={styles.modalSubtitle}>{batch?.grade}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Students</Text>
            <Text style={styles.summaryValue}>{students?.length || 0}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Fully Paid</Text>
            <Text style={[styles.summaryValue, { color: '#16A34A' }]}>
              {students?.filter(s => s.pendingFees === 0).length || 0}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
              {students?.filter(s => s.pendingFees > 0).length || 0}
            </Text>
          </View>
        </View>

        {/* Student Fee Table */}
        <ScrollView
          style={styles.tableScroll}
          contentContainerStyle={styles.tableContent}
          showsVerticalScrollIndicator={false}
          horizontal={false}
        >
          {students && students.length > 0 ? (
            <>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.nameColumn]}>Student Name</Text>
                <Text style={[styles.tableHeaderCell, styles.feeColumn]}>Paid Fees</Text>
                <Text style={[styles.tableHeaderCell, styles.feeColumn]}>Pending Fees</Text>
              </View>

              {/* Table Rows */}
              {students.map((student, index) => (
                <View key={student.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlternate]}>
                  <Text style={[styles.tableCell, styles.nameColumn, styles.nameCellText]}>
                    {student.name}
                  </Text>
                  <Text style={[styles.tableCell, styles.feeColumn, styles.paidText]}>
                    ₹{student.paidFees.toLocaleString()}
                  </Text>
                  <Text style={[styles.tableCell, styles.feeColumn, { color: getStatusColor(student.pendingFees), fontWeight: '700' }]}>
                    ₹{student.pendingFees.toLocaleString()}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No student records found</Text>
            </View>
          )}
          <View style={styles.tableBottomPad} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function FeeManagement({ instituteId }) {
  const [activeTab, setActiveTab] = useState('batches');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [feeDetailsModalVisible, setFeeDetailsModalVisible] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBatches = async () => {
      const resolvedInstituteId = (instituteId || '').trim();
      if (!resolvedInstituteId) {
        setBatches([]);
        return;
      }

      try {
        setLoading(true);
        const { response } = await fetchWithBaseUrlFallback(
          `/api/batches?instituteId=${encodeURIComponent(resolvedInstituteId)}`
        );
        const payload = await response.json();

        if (!response.ok) {
          Alert.alert('Failed to load batches', payload?.message || 'Unable to fetch batches');
          return;
        }

        setBatches(Array.isArray(payload) ? payload.map(normalizeBatchForFees) : []);
      } catch (error) {
        Alert.alert('Network error', `Could not load batches. Tried:\n${API_BASE_URLS.join('\n')}`);
      } finally {
        setLoading(false);
      }
    };

    loadBatches();
  }, [instituteId]);

  const handleBatchPress = (item) => {
    setSelectedBatch(item);
    setFeeDetailsModalVisible(true);
  };

  const handleCreateBatch = () => {
    console.log('Create New Batch pressed');
  };

  // Grid layout for tablet
  const renderBatchGrid = () => {
    if (loading) {
      return <Text style={styles.noDataText}>Loading batches...</Text>;
    }

    if (batches.length === 0) {
      return <Text style={styles.noDataText}>No batches found for this institute.</Text>;
    }

    if (IS_TABLET) {
      const rows = [];
      for (let i = 0; i < batches.length; i += 2) {
        rows.push(
          <View key={i} style={styles.tabletRow}>
            <View style={styles.tabletCol}>
              <BatchCard item={batches[i]} onPress={handleBatchPress} />
            </View>
            {batches[i + 1] ? (
              <View style={styles.tabletCol}>
                <BatchCard item={batches[i + 1]} onPress={handleBatchPress} />
              </View>
            ) : (
              <View style={styles.tabletCol} />
            )}
          </View>
        );
      }
      return rows;
    }
    return batches.map((item) => (
      <BatchCard key={item.id} item={item} onPress={handleBatchPress} />
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── HEADER ── */}
     

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          IS_TABLET && styles.scrollContentTablet,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Select Batch</Text>
       

        {/* Status card */}
        {IS_TABLET ? (
          <View style={styles.tabletRow}>
            <View style={styles.tabletCol}><StatusCard batchCount={batches.length} /></View>
            <View style={styles.tabletCol} />
          </View>
        ) : (
          <>
            <StatusCard batchCount={batches.length} />
          </>
        )}

        <View style={styles.divider} />

        {renderBatchGrid()}

        <CreateBatchCard onPress={handleCreateBatch} />
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* ── BOTTOM NAV ── */}
      <View style={styles.bottomNav}>
        {NAV_ITEMS.map((nav) => {
          const active = activeTab === nav.id;
          return (
            <TouchableOpacity
              key={nav.id}
              style={styles.navItem}
              onPress={() => setActiveTab(nav.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.navIcon, active && styles.navIconActive]}>
                {nav.icon}
              </Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {nav.label}
              </Text>
              {active && <View style={styles.navIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── STUDENT FEE DETAILS MODAL ── */}
      <StudentFeeListModal
        visible={feeDetailsModalVisible}
        batch={selectedBatch}
        students={selectedBatch ? selectedBatch.students : []}
        onClose={() => setFeeDetailsModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const BLUE   = '#1A6EE8';
const GREEN  = '#16A34A';
const BORDER = '#E8ECF0';
const BG     = '#F7F9FC';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IS_TABLET ? 32 : 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { height: 2 } },
      android: { elevation: 3 },
    }),
  },
  menuBtn: { padding: 4 },
  menuIcon: { fontSize: 22, color: '#1A2340', fontWeight: '600' },
  headerTitle: {
    fontSize: IS_TABLET ? 18 : 15,
    fontWeight: '800',
    color: BLUE,
    letterSpacing: 1.4,
  },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1A2340',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // ── Scroll
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingHorizontal: 16, paddingTop: 24 },
  scrollContentTablet: { paddingHorizontal: 32, paddingTop: 32 },

  // ── Page header
  pageTitle: {
    fontSize: IS_TABLET ? 32 : 26,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  pageDesc: {
    fontSize: IS_TABLET ? 15 : 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },

  // ── Status card
  statusCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  statusLabel: { fontSize: 11, fontWeight: '700', color: '#60A5FA', letterSpacing: 1, marginBottom: 10 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  statusTextBlock: { flex: 1 },
  statusTitle: { fontSize: IS_TABLET ? 26 : 22, fontWeight: '800', color: '#0D1B2A', lineHeight: 30 },
  statusSub: { fontSize: 12, color: '#64748B', marginTop: 4 },
  statusCount: { fontSize: IS_TABLET ? 64 : 52, fontWeight: '800', color: '#BFDBFE', lineHeight: 60 },

  // ── Urgent card
  urgentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { height: 3 } },
      android: { elevation: 2 },
    }),
  },
  urgentLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginBottom: 6 },
  urgentTitle: { fontSize: IS_TABLET ? 20 : 17, fontWeight: '800', color: '#0D1B2A', marginBottom: 6 },
  urgentBody: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 12 },
  urgentLinkRow: { flexDirection: 'row', alignItems: 'center' },
  urgentLink: { fontSize: 14, fontWeight: '700', color: BLUE },
  urgentArrow: { fontSize: 14, fontWeight: '700', color: BLUE },

  divider: { height: 1, backgroundColor: BORDER, marginVertical: 8 },

  // ── Tablet grid
  tabletRow: { flexDirection: 'row', gap: 16, marginBottom: 0 },
  tabletCol: { flex: 1 },

  // ── Batch card
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: IS_TABLET ? 22 : 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { height: 3 } },
      android: { elevation: 2 },
    }),
  },
  batchCardPremium: {
    borderColor: '#A7F3D0',
    borderWidth: 2,
    ...Platform.select({
      ios:     { shadowColor: GREEN, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { height: 4 } },
      android: { elevation: 4 },
    }),
  },
  batchCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  iconCirclePremium: { backgroundColor: '#ECFDF5' },
  iconText: { fontSize: 20 },
  tag: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  batchGrade: {
    fontSize: IS_TABLET ? 22 : 19,
    fontWeight: '800',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  batchGradePremium: { color: '#065F46' },
  batchSub: { fontSize: 13, color: '#64748B', marginBottom: 18 },
  batchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 3 },
  countValue: { fontSize: IS_TABLET ? 16 : 15, fontWeight: '800', color: '#0D1B2A' },
  countValuePremium: { color: '#065F46' },

  // ── Update button
  updateBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: IS_TABLET ? 22 : 18,
    paddingVertical: 11,
    borderRadius: 10,
    ...Platform.select({
      ios:     { shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { height: 4 } },
      android: { elevation: 4 },
    }),
  },
  updateBtnPremium: {
    backgroundColor: GREEN,
    ...Platform.select({
      ios:     { shadowColor: GREEN, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { height: 4 } },
    }),
  },
  updateBtnText: { color: '#FFF', fontWeight: '800', fontSize: IS_TABLET ? 15 : 13 },

  // ── Create batch
  createCard: {
    borderWidth: 2,
    borderColor: BORDER,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: '#FAFBFC',
  },
  createPlus: { fontSize: 28, color: '#CBD5E1', marginBottom: 6, fontWeight: '300' },
  createTitle: { fontSize: IS_TABLET ? 17 : 15, fontWeight: '700', color: '#475569', marginBottom: 4 },
  createSub: { fontSize: 12, color: '#94A3B8' },

  bottomPad: { height: 20 },

  // ── Bottom nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { height: -3 } },
      android: { elevation: 8 },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 4,
  },
  navIcon: { fontSize: IS_TABLET ? 22 : 18, marginBottom: 3, opacity: 0.4 },
  navIconActive: { opacity: 1 },
  navLabel: {
    fontSize: IS_TABLET ? 11 : 9,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  navLabelActive: { color: BLUE, fontWeight: '800' },
  navIndicator: {
    position: 'absolute',
    top: -8, left: '50%',
    marginLeft: -16,
    width: 32, height: 3,
    borderRadius: 2,
    backgroundColor: BLUE,
  },

  // ── Modal styles ──
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { height: 2 } },
      android: { elevation: 3 },
    }),
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: '#64748B',
    fontWeight: '600',
  },
  modalTitleContainer: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BLUE,
    letterSpacing: 1.4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // ── Summary Card ──
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: BLUE,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#BFDBFE',
  },

  // ── Student List ──
  tableScroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  tableContent: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BLUE,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 2,
    paddingVertical: 0,
  },
  tableHeaderCell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  nameColumn: {
    flex: 2,
  },
  feeColumn: {
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 0,
  },
  tableRowAlternate: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0D1B2A',
    fontWeight: '500',
  },
  nameCellText: {
    fontWeight: '600',
    color: '#1A2340',
  },
  paidText: {
    fontWeight: '700',
    color: '#16A34A',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tableBottomPad: {
    height: 20,
  },
});
