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
  dark: '#111827',
  text: '#374151',
  muted: '#9CA3AF',
  border: '#E5E7EB',
  green: '#10B981',
  greenLight: '#D1FAE5',
  red: '#EF4444',
  amber: '#F59E0B',
  barFull: '#4F46E5',
  barEmpty: '#E5E7EB',
  exceptional: '#D1FAE5',
  exceptionalText: '#059669',
  advanced: '#EEF2FF',
  advancedText: '#4F46E5',
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const barData = [
  { month: 'JAN', rank: 18, height: 0.28 },
  { month: 'FEB', rank: 14, height: 0.40 },
  { month: 'MAR', rank: 12, height: 0.32 },
  { month: 'APR', rank: 8,  height: 0.54 },
  { month: 'MAY', rank: 5,  height: 0.70 },
  { month: 'JUN', rank: 3,  height: 0.92 },
  { month: 'JUL', rank: 4,  height: 0.80 },
  { month: 'AUG', rank: 6,  height: 0.60 },
  { month: 'SEP', rank: 9,  height: 0.50 },
  { month: 'OCT', rank: 11, height: 0.38 },
  { month: 'NOV', rank: 7,  height: 0.65 },
  { month: 'DEC', rank: 4,  height: 0.85, active: true},
];

const subjectRankings = [
  { code: 'Ph', subject: 'Physics',       sub: 'MAJOR',       rank: '#1', trend: '→', trendColor: C.muted,  bg: C.indigo,      fg: C.white },
  { code: 'Ma', subject: 'Mathematics',   sub: 'ADVANCED',    rank: '#5', trend: '↘', trendColor: C.red,    bg: '#F3F4F6',     fg: C.text  },
  { code: 'CS', subject: 'Comp. Science', sub: 'ELECTIVE',    rank: '#2', trend: '↗', trendColor: C.green,  bg: '#F3F4F6',     fg: C.text  },
  { code: 'Li', subject: 'Literature',    sub: 'HUMANITIES',  rank: '#12',trend: '→', trendColor: C.muted,  bg: '#F3F4F6',     fg: C.text  },
];

const examDetails = [
  { subject: 'Advanced Physics',  marks: 96, total: 100, pct: '99.2%', status: 'EXCEPTIONAL', statusBg: C.exceptional, statusColor: C.exceptionalText },
  { subject: 'Calculus II',       marks: 92, total: 100, pct: '94.5%', status: 'ADVANCED',    statusBg: C.advanced,    statusColor: C.advancedText    },
  { subject: 'Data Structures',   marks: 89, total: 100, pct: '91.8%', status: 'ADVANCED',    statusBg: C.advanced,    statusColor: C.advancedText    },
];

const classTop5 = [
  { rank: 1, name: 'Elena Thorne',  wing: 'Science Wing',     pct: '98.2%', pctColor: C.indigo,  badge: '🥇', isYou: false },
  { rank: 2, name: 'Marcus Chen',   wing: 'Engineering Wing', pct: '96.8%', pctColor: C.indigo,  badge: '🥈', isYou: false },
  { rank: 3, name: 'You (Student)', wing: 'Top Tier',         pct: '95.5%', pctColor: C.indigo,  badge: '🥉', isYou: true  },
  { rank: 4, name: 'Sarah Jenkins', wing: 'Arts Wing',        pct: '93.4%', pctColor: C.text,    badge: '4',  isYou: false },
  { rank: 5, name: "Liam O'Connell",wing: 'Commerce Wing',    pct: '92.9%', pctColor: C.text,    badge: '5',  isYou: false },
];

// ─── Top Nav ──────────────────────────────────────────────────────────────────
function TopNav() {
  return (
    <View style={styles.topNav}>
      {isTablet && (
        <View style={styles.navLinks}>
          {['Curriculum', 'Analytics', 'Resources', 'Faculty'].map((t, i) => (
            <TouchableOpacity key={t} activeOpacity={0.7} style={styles.navLinkBtn}>
              <Text style={[styles.navLink, i === 1 && styles.navLinkActive]}>{t}</Text>
              {i === 1 && <View style={styles.navLinkBar} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.navRight}>
      </View>
    </View>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────
function StatCard({ label, icon, main, sub, note, noteIcon }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.statCard}>
      <View style={styles.statTopRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={styles.statMain}>{main}</Text>
      <Text style={styles.statSub}>{sub}</Text>
      <View style={styles.statNoteRow}>
        <Text style={styles.statNoteIcon}>{noteIcon}</Text>
        <Text style={styles.statNote}>{note}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function RankProgress() {
  const BAR_MAX_H = isTablet ? 200 : 160;
  return (
    <View style={styles.card}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Rank Progress</Text>
        <View style={styles.chartBadge}>
        </View>
      </View>
      <View style={styles.chartArea}>
        {barData.map((bar) => (
          <View key={bar.month} style={styles.barCol}>
            {bar.active && (
              <Text style={styles.barRankLabel}>#{bar.rank}</Text>
            )}
            <View style={styles.barWrapper}>
              {/* background track */}
              <View style={[styles.barTrack, { height: BAR_MAX_H }]}>
                {/* filled portion */}
                <View
                  style={[
                    styles.barFill,
                    {
                      height: BAR_MAX_H * bar.height,
                      backgroundColor: bar.active ? C.barFull : '#C7C9F0',
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.barMonth, bar.active && styles.barMonthActive]}>
              {bar.month}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Recent Exam Details ──────────────────────────────────────────────────────
function RecentExamDetails() {
  return (
    <View style={[styles.card, { marginTop: 16 }]}>
      <Text style={styles.sectionTitle}>Recent Exam Details</Text>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        {['SUBJECT', 'MARKS', 'TOTAL', 'PERCENTILE', 'STATUS'].map((h) => (
          <Text key={h} style={[styles.tableHeadCell, h === 'SUBJECT' && styles.tableColSubject]}>
            {h}
          </Text>
        ))}
      </View>
      {examDetails.map((row, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.75}
          style={[styles.tableRow, i < examDetails.length - 1 && styles.tableRowBorder]}
        >
          <Text style={[styles.tableCell, styles.tableColSubject]}>{row.subject}</Text>
          <Text style={[styles.tableCell, styles.tableCellBold, styles.tableColNum, { color: C.indigo }]}>
            {row.marks}
          </Text>
          <Text style={[styles.tableCell, styles.tableCellMuted, styles.tableColNum]}>{row.total}</Text>
          <Text style={[styles.tableCell, styles.tableColNum]}>{row.pct}</Text>
          <View style={[styles.statusBadge, { backgroundColor: row.statusBg }, styles.tableColStatus]}>
            <Text style={[styles.statusText, { color: row.statusColor }]}>{row.status}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Subject Rankings ─────────────────────────────────────────────────────────
function SubjectRankings() {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Subject Rankings</Text>
      <View style={styles.rankList}>
        {subjectRankings.map((item, i) => (
          <TouchableOpacity key={i} activeOpacity={0.75} style={styles.rankRow}>
            <View style={[styles.rankCodeBox, { backgroundColor: item.bg }]}>
              <Text style={[styles.rankCode, { color: item.fg }]}>{item.code}</Text>
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankSubject}>{item.subject}</Text>
              <Text style={styles.rankSubSub}>{item.sub}</Text>
            </View>
            <Text style={styles.rankNum}>{item.rank}</Text>
            <Text style={[styles.rankTrend, { color: item.trendColor }]}>{item.trend}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Class Top 5 ─────────────────────────────────────────────────────────────
function ClassTop5() {
  return (
    <View style={[styles.card, { marginTop: 16 }]}>
      <Text style={styles.sectionTitle}>Class Top 5</Text>
      {classTop5.map((item, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.75}
          style={[
            styles.top5Row,
            item.isYou && styles.top5RowHighlight,
          ]}
        >
          <View style={styles.top5BadgeWrap}>
            <Text style={styles.top5Badge}>{item.badge}</Text>
          </View>
          <View style={styles.top5Avatar}>
            <Text style={styles.top5AvatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.top5Info}>
            <Text style={[styles.top5Name, item.isYou && { color: C.indigo }]}>{item.name}</Text>
            <Text style={[styles.top5Wing, item.isYou && { color: C.indigo, fontWeight: '700' }]}>
              {item.wing}
            </Text>
          </View>
          <Text style={[styles.top5Pct, { color: item.pctColor }]}>{item.pct}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AcademicPerformance() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Academic Performance</Text>
          <Text style={styles.pageSub}>
            Detailed analysis of your ranking, scores, and competitive standing.
          </Text>
        </View>

        {/* Stat Cards Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statCardsRow}
        >
          <StatCard
            label="LATEST EXAM SCORE"
            icon="📋"
            main={<Text><Text style={styles.statMainBig}>94</Text><Text style={styles.statMainSmall}> /100</Text></Text>}
            sub=""
            note="Higher than 88% of your peers"
            noteIcon="↗"
          />
          <StatCard
            label="CURRENT CLASS RANK"
            icon="📊"
            main={<Text><Text style={styles.statMainBig}>#3</Text><Text style={styles.statMainSmall}> out of 124</Text></Text>}
            sub=""
            note="Top 2.5% of the cohort"
            noteIcon="✦"
          />
          <StatCard
            label="OVERALL GRADE"
            icon="⭐"
            main={<Text><Text style={styles.statMainBig}>A+</Text><Text style={[styles.statMainSmall, { color: C.muted }]}>  Consistent</Text></Text>}
            sub=""
            note="Last updated 2 days ago"
            noteIcon="🕐"
          />
        </ScrollView>

        {/* Main grid */}
        <View style={[styles.mainGrid, !isTablet && styles.mainGridCol]}>
          {/* Left column */}
          <View style={isTablet ? styles.leftCol : styles.fullWidth}>
            <RankProgress />
            <RecentExamDetails />
          </View>

          {/* Right column */}
          <View style={isTablet ? styles.rightCol : styles.fullWidth}>
            <SubjectRankings />
            <ClassTop5 />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Nav
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 16,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: C.indigo,
    letterSpacing: -0.5,
  },
  navLinks: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
  },
  navLinkBtn: { alignItems: 'center' },
  navLink: { fontSize: 14, color: C.muted, fontWeight: '500' },
  navLinkActive: { color: C.indigo, fontWeight: '700' },
  navLinkBar: {
    height: 2,
    backgroundColor: C.indigo,
    borderRadius: 1,
    marginTop: 2,
    width: '100%',
  },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 'auto' },
  iconBtn: { padding: 4 },
  navIcon: { fontSize: 16 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: C.white, fontWeight: '800', fontSize: 14 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: isTablet ? 24 : 16,
    gap: 16,
  },

  // Page Header
  pageHeader: { marginBottom: 4 },
  pageTitle: {
    fontSize: isTablet ? 32 : 24,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -0.8,
  },
  pageSub: {
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
    lineHeight: 18,
  },

  // Stat Cards
  statCardsRow: {
    gap: 14,
    paddingRight: 16,
  },
  statCard: {
    width: isTablet ? 260 : SCREEN_WIDTH * 0.72,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: C.indigo,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.indigo,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statIcon: { fontSize: 18 },
  statMain: { marginBottom: 2 },
  statMainBig: {
    fontSize: 36,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -1,
  },
  statMainSmall: {
    fontSize: 16,
    fontWeight: '400',
    color: C.text,
  },
  statSub: { fontSize: 13, color: C.muted },
  statNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  statNoteIcon: { fontSize: 12, color: C.green },
  statNote: { fontSize: 12, color: C.muted },

  // Layout
  mainGrid: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  mainGridCol: { flexDirection: 'column' },
  leftCol: { flex: 2 },
  rightCol: { flex: 1, minWidth: 240 },
  fullWidth: { width: '100%' },

  // Card
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },

  // Chart
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.dark,
  },
  chartBadge: {
    backgroundColor: C.indigoLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.indigo,
    letterSpacing: 0.5,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 28,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barRankLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.indigo,
    marginBottom: 2,
  },
  barWrapper: {
    width: '70%',
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    backgroundColor: C.barEmpty,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: C.muted,
    marginTop: 6,
  },
  barMonthActive: {
    color: C.indigo,
    fontWeight: '800',
  },

  // Table
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.dark,
    marginBottom: 14,
  },
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
    textAlign: 'center',
  },
  tableColSubject: {
    flex: 2,
    textAlign: 'left',
  },
  tableColNum: {
    flex: 1,
    textAlign: 'center',
  },
  tableColStatus: {
    flex: 1.4,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
  },
  tableCell: {
    fontSize: 13,
    color: C.text,
    flex: 1,
    textAlign: 'center',
  },
  tableCellBold: {
    fontWeight: '800',
    fontSize: 15,
  },
  tableCellMuted: {
    color: C.muted,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'center',
    flex: 1.4,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Subject Rankings
  rankList: { gap: 10 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  rankCodeBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankCode: {
    fontSize: 13,
    fontWeight: '800',
  },
  rankInfo: { flex: 1 },
  rankSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: C.dark,
  },
  rankSubSub: {
    fontSize: 10,
    color: C.muted,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  rankNum: {
    fontSize: 16,
    fontWeight: '800',
    color: C.dark,
    minWidth: 30,
    textAlign: 'right',
  },
  rankTrend: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },

  // Top 5
  top5Row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
  },
  top5RowHighlight: {
    backgroundColor: C.indigoLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  top5BadgeWrap: {
    width: 22,
    alignItems: 'center',
  },
  top5Badge: {
    fontSize: 14,
  },
  top5Avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top5AvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  top5Info: { flex: 1 },
  top5Name: {
    fontSize: 14,
    fontWeight: '700',
    color: C.dark,
  },
  top5Wing: {
    fontSize: 11,
    color: C.muted,
    marginTop: 1,
  },
  top5Pct: {
    fontSize: 15,
    fontWeight: '800',
  },
});