import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768;

// ─── Batch Cards Data ───────────────────────────────────────────────
const BATCHES = [
  {
    id: 1,
    name: 'Engineering Delta',
    cohort: 'Cohort 2024-B',
    attendance: 94.2,
    attendanceLabel: 'ATTENDANCE',
    syllabusCompletion: 78,
    currentModule: 'Quantum Mech...',
    nextMilestone: 'Mid-Term Revi...',
    accentColor: '#20b2aa',
  },
  {
    id: 2,
    name: 'Medical Alpha',
    cohort: 'Cohort 2024-A',
    attendance: 89.5,
    attendanceLabel: 'ATTENDANCE',
    syllabusCompletion: 62,
    currentModule: 'Human Anatomy',
    nextMilestone: 'Practical Exam',
    accentColor: '#20b2aa',
  },
  {
    id: 3,
    name: 'Arts Sigma',
    cohort: 'Cohort 2024-C',
    attendance: 91.8,
    attendanceLabel: 'ATTENDANCE',
    syllabusCompletion: 45,
    currentModule: 'Digital Aestheti...',
    nextMilestone: 'Portfolio Draft',
    accentColor: '#20b2aa',
  },
];

// ─── Sub-components ─────────────────────────────────────────────────

function TopBar({ onMenuPress } = {}) {
  return (
    <View style={styles.topBar}>
      {IS_MOBILE && (
        <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn} activeOpacity={0.7}>
          <Text style={styles.menuBtnIcon}>☰</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.topBarTitle}>The Academic Curator</Text>
      <View style={styles.topBarRight}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          {!IS_MOBILE && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search curriculum or student records"
              placeholderTextColor="#aaa"
            />
          )}
        </View>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Text style={styles.iconBtnText}>🔔</Text>
          <View style={styles.notifBadge} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Text style={styles.iconBtnText}>⚙️</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      </View>
    </View>
  );
}

function BatchCard({ batch }) {
  return (
    <View style={styles.batchCard}>
      <View style={styles.batchCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.batchName}>{batch.name}</Text>
          <Text style={styles.batchCohort}>{batch.cohort}</Text>
        </View>
        <View style={styles.attendanceBadge}>
          <Text style={styles.attendanceValue}>{batch.attendance}%</Text>
          <Text style={styles.attendanceLabel}>{batch.attendanceLabel}</Text>
        </View>
      </View>

      <View style={styles.syllabusRow}>
        <Text style={styles.syllabusLabel}>Syllabus Completion</Text>
        <Text style={styles.syllabusValue}>{batch.syllabusCompletion}%</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View
          style={[styles.progressBarFill, { width: `${batch.syllabusCompletion}%` }]}
        />
      </View>

      <View style={styles.moduleRow}>
        <View style={styles.moduleCol}>
          <Text style={styles.moduleLabel}>CURRENT MODULE</Text>
          <Text style={styles.moduleValue}>{batch.currentModule}</Text>
        </View>
        <View style={styles.moduleCol}>
          <Text style={styles.moduleLabel}>NEXT MILESTONE</Text>
          <Text style={styles.moduleValue}>{batch.nextMilestone}</Text>
        </View>
      </View>
    </View>
  );
}

function BottomStats() {
  return (
    <View style={styles.bottomStats}>
      <View style={styles.milestoneCard}>
        <Text style={styles.milestoneTitle}>Curriculum Milestone</Text>
        <Text style={styles.milestoneDesc}>
          85% of active batches are ahead of the scheduled syllabus progress for this semester.
        </Text>
        <Text style={styles.milestonePercent}>+12%</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statCardLabel}>ACTIVE BATCHES</Text>
        <Text style={styles.statCardValue}>24</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statCardLabel}>OPEN TICKETS</Text>
        <Text style={styles.statCardValue}>03</Text>
      </View>
    </View>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────

export default function Dashboard({ onMenuPress } = {}) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <TopBar onMenuPress={onMenuPress} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageOverline}>ACADEMIC OVERSIGHT</Text>
            <Text style={styles.pageTitle}>Batch Progress Monitor</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.analyticsLink}>View Detailed Analytics →</Text>
          </TouchableOpacity>
        </View>

        {/* Batch Cards */}
        <ScrollView
          horizontal={IS_MOBILE}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={IS_MOBILE ? styles.batchScrollH : styles.batchGrid}
        >
          {BATCHES.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </ScrollView>

        {/* Bottom Stats */}
        <BottomStats />
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  // TopBar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: { paddingTop: 50 },
      android: { paddingTop: 12 },
      default: {},
    }),
  },
  menuBtn: { marginRight: 12 },
  menuBtnIcon: { fontSize: 22, color: '#333' },
  topBarTitle: {
    fontSize: IS_MOBILE ? 15 : 18,
    fontWeight: '700',
    color: '#1a2c42',
    flex: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 4,
  },
  searchIcon: { fontSize: 14, marginRight: 4 },
  searchInput: {
    width: 200,
    fontSize: 13,
    color: '#333',
    outlineWidth: 0,
  },
  iconBtn: { padding: 6, position: 'relative' },
  iconBtnText: { fontSize: 18 },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e53e3e',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2c7a7b',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: IS_MOBILE ? 14 : 22, paddingBottom: 40 },

  // Page Header
  pageHeader: {
    flexDirection: IS_MOBILE ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: IS_MOBILE ? 'flex-start' : 'center',
    marginBottom: 20,
    gap: 6,
  },
  pageOverline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: IS_MOBILE ? 20 : 24,
    fontWeight: '800',
    color: '#1a2c42',
  },
  analyticsLink: {
    fontSize: 13,
    color: '#20b2aa',
    fontWeight: '600',
  },

  // Batch Grid
  batchGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 22,
  },
  batchScrollH: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 14,
    marginBottom: 22,
  },
  batchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    width: IS_MOBILE ? 240 : undefined,
    flex: IS_MOBILE ? 0 : 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  batchCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  batchName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a2c42',
    marginBottom: 3,
  },
  batchCohort: { fontSize: 12, color: '#888' },
  attendanceBadge: {
    backgroundColor: '#d4f5f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  attendanceValue: { fontSize: 16, fontWeight: '800', color: '#1a7a70' },
  attendanceLabel: { fontSize: 9, color: '#1a7a70', fontWeight: '600', letterSpacing: 0.8 },

  syllabusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  syllabusLabel: { fontSize: 12, color: '#666' },
  syllabusValue: { fontSize: 12, fontWeight: '700', color: '#1a2c42' },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e8ecf0',
    borderRadius: 3,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1a5c55',
    borderRadius: 3,
  },
  moduleRow: { flexDirection: 'row', gap: 12 },
  moduleCol: { flex: 1 },
  moduleLabel: { fontSize: 9, color: '#999', fontWeight: '600', letterSpacing: 0.8, marginBottom: 3 },
  moduleValue: { fontSize: 12, fontWeight: '700', color: '#1a2c42' },

  // Bottom Stats
  bottomStats: {
    flexDirection: IS_MOBILE ? 'column' : 'row',
    gap: 14,
  },
  milestoneCard: {
    flex: IS_MOBILE ? 0 : 1,
    backgroundColor: '#1a3a60',
    borderRadius: 14,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  milestoneTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  milestoneDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18 },
  milestonePercent: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -18,
    fontSize: 32,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.2)',
  },
  statCard: {
    width: IS_MOBILE ? '100%' : 160,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  statCardLabel: { fontSize: 10, color: '#999', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  statCardValue: { fontSize: 36, fontWeight: '800', color: '#1a2c42' },
});