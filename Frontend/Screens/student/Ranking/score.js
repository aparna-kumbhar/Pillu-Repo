import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';

import { fetchWithBaseUrlFallback } from '../../../Src/axios';

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
function RankProgress({ barData }) {
  const BAR_MAX_H = isTablet ? 200 : 160;
  if (!barData || barData.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Rank Progress</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No rank data yet</Text>
          <Text style={styles.emptySubText}>Rank progress will appear once exams are submitted</Text>
        </View>
      </View>
    );
  }
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
function RecentExamDetails({ examDetails }) {
  if (!examDetails || examDetails.length === 0) {
    return (
      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Recent Exam Details</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>No exam results yet</Text>
          <Text style={styles.emptySubText}>Your results will appear here once the assistant uploads marks</Text>
        </View>
      </View>
    );
  }
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
function SubjectRankings({ subjectRankings }) {
  if (!subjectRankings || subjectRankings.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Subject Rankings</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyText}>No subject rankings yet</Text>
          <Text style={styles.emptySubText}>Rankings will appear once exam marks are uploaded for your batch</Text>
        </View>
      </View>
    );
  }
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
function ClassTop5({ classTop5 }) {
  if (!classTop5 || classTop5.length === 0) {
    return (
      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Class Top 5</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No leaderboard data yet</Text>
          <Text style={styles.emptySubText}>Class rankings will appear once batch marks are uploaded</Text>
        </View>
      </View>
    );
  }
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
export default function AcademicPerformance({ student, instituteId, batchId }) {
  const resolvedStudentId = student?._id || student?.id || student?.studentId || '';
  const resolvedBatchId = batchId || student?.batchId || '';

  const [loading, setLoading] = useState(true);
  const [barData, setBarData] = useState([]);
  const [examDetails, setExamDetails] = useState([]);
  const [subjectRankings, setSubjectRankings] = useState([]);
  const [classTop5, setClassTop5] = useState([]);
  const [latestScore, setLatestScore] = useState(null);
  const [classRank, setClassRank] = useState(null);
  const [overallGrade, setOverallGrade] = useState('N/A');

  useEffect(() => {
    const fetchData = async () => {
      if (!resolvedStudentId || !instituteId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // 1. Fetch student marks
        const studentMarksRes = await fetchWithBaseUrlFallback(`/api/marks/student/${resolvedStudentId}?instituteId=${instituteId}`);
        const studentMarks = studentMarksRes.response.ok ? await studentMarksRes.response.json() : [];

        // Find batchId from student marks if not provided
        let currentBatchId = resolvedBatchId;
        if (!currentBatchId && studentMarks.length > 0) {
          currentBatchId = studentMarks[0].batchId;
        }

        // 2. Fetch batch marks
        let batchMarks = [];
        if (currentBatchId) {
          const batchMarksRes = await fetchWithBaseUrlFallback(`/api/marks/batch/${currentBatchId}?instituteId=${instituteId}`);
          if (batchMarksRes.response.ok) {
            batchMarks = await batchMarksRes.response.json();
          }
        }

        // --- PROCESS EXAM DETAILS ---
        const recentExams = [...studentMarks].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
        const mappedExams = recentExams.map(m => {
          const pct = ((m.marks / (m.totalMarks || 100)) * 100);
          let status = 'AVERAGE';
          let statusBg = C.bg;
          let statusColor = C.muted;
          if (pct >= 90) { status = 'EXCEPTIONAL'; statusBg = C.exceptional; statusColor = C.exceptionalText; }
          else if (pct >= 75) { status = 'ADVANCED'; statusBg = C.advanced; statusColor = C.advancedText; }

          return {
            subject: m.subject || m.examName,
            marks: m.marks,
            total: m.totalMarks || 100,
            pct: pct.toFixed(1) + '%',
            status,
            statusBg,
            statusColor
          };
        });
        setExamDetails(mappedExams);

        if (mappedExams.length > 0) {
          setLatestScore({ marks: mappedExams[0].marks, total: mappedExams[0].total });
        }

        // --- PROCESS CLASS RANKING & TOP 5 ---
        if (batchMarks.length > 0) {
          // Group by student
          const studentTotals = {};
          batchMarks.forEach(m => {
            if (!studentTotals[m.studentId]) {
              studentTotals[m.studentId] = { id: m.studentId, name: m.studentName, totalMarks: 0, maxMarks: 0, exams: 0 };
            }
            studentTotals[m.studentId].totalMarks += m.marks;
            studentTotals[m.studentId].maxMarks += (m.totalMarks || 100);
            studentTotals[m.studentId].exams += 1;
          });

          const rankedStudents = Object.values(studentTotals).map(s => ({
            ...s,
            pct: (s.totalMarks / s.maxMarks) * 100
          })).sort((a, b) => b.pct - a.pct);

          const myRankIndex = rankedStudents.findIndex(s => s.id === resolvedStudentId);
          setClassRank({ rank: myRankIndex >= 0 ? myRankIndex + 1 : '-', total: rankedStudents.length });

          const top5 = rankedStudents.slice(0, 5).map((s, i) => {
             const isYou = s.id === resolvedStudentId;
             let badge = (i + 1).toString();
             if (i === 0) badge = '🥇';
             if (i === 1) badge = '🥈';
             if (i === 2) badge = '🥉';
             return {
               rank: i + 1,
               name: isYou ? 'You (Student)' : s.name,
               wing: 'Regular',
               pct: s.pct.toFixed(1) + '%',
               pctColor: isYou ? C.indigo : C.text,
               badge,
               isYou
             };
          });
          setClassTop5(top5);
        }

        // --- PROCESS SUBJECT RANKINGS ---
        const subjectStats = {};
        batchMarks.forEach(m => {
          const sub = m.subject || m.examName;
          if (!subjectStats[sub]) subjectStats[sub] = {};
          if (!subjectStats[sub][m.studentId]) {
            subjectStats[sub][m.studentId] = { obtained: 0, max: 0 };
          }
          subjectStats[sub][m.studentId].obtained += m.marks;
          subjectStats[sub][m.studentId].max += (m.totalMarks || 100);
        });

        const mySubjectRankings = [];
        Object.keys(subjectStats).forEach(sub => {
          const studentPcts = Object.keys(subjectStats[sub]).map(sid => ({
            studentId: sid,
            pct: (subjectStats[sub][sid].obtained / subjectStats[sub][sid].max) * 100
          })).sort((a, b) => b.pct - a.pct);
          
          const myMarkIndex = studentPcts.findIndex(s => s.studentId === resolvedStudentId);
          if (myMarkIndex >= 0) {
            mySubjectRankings.push({
              code: sub.substring(0, 2).toUpperCase(),
              subject: sub,
              sub: 'CORE',
              rank: '#' + (myMarkIndex + 1),
              trend: myMarkIndex < 5 ? '↗' : '→',
              trendColor: myMarkIndex < 5 ? C.green : C.muted,
              bg: myMarkIndex === 0 ? C.indigo : '#F3F4F6',
              fg: myMarkIndex === 0 ? C.white : C.text
            });
          }
        });
        setSubjectRankings(mySubjectRankings);

        // --- OVERALL GRADE ---
        if (studentMarks.length > 0) {
          const totalObtained = studentMarks.reduce((acc, m) => acc + m.marks, 0);
          const totalMax = studentMarks.reduce((acc, m) => acc + (m.totalMarks || 100), 0);
          const overallPct = (totalObtained / totalMax) * 100;
          let grade = 'C';
          if (overallPct >= 90) grade = 'A+';
          else if (overallPct >= 80) grade = 'A';
          else if (overallPct >= 70) grade = 'B';
          setOverallGrade(grade);

          // Generate Bar Data (mocked for months, using actual exams logic later if needed)
          const mData = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
          const currentMonth = new Date().getMonth();
          const bData = mData.map((m, i) => ({
            month: m,
            rank: classRank?.rank || 5,
            height: i <= currentMonth ? (Math.random() * 0.4 + 0.4) : 0,
            active: i === currentMonth
          }));
          setBarData(bData);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resolvedStudentId, instituteId, resolvedBatchId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.indigo} />
      </SafeAreaView>
    );
  }

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
            main={<Text>{latestScore ? <><Text style={styles.statMainBig}>{latestScore.marks}</Text><Text style={styles.statMainSmall}> /{latestScore.total}</Text></> : <Text style={styles.statMainBig}>--</Text>}</Text>}
            sub=""
            note="Higher than 88% of your peers"
            noteIcon="↗"
          />
          <StatCard
            label="CURRENT CLASS RANK"
            icon="📊"
            main={<Text>{classRank ? <><Text style={styles.statMainBig}>#{classRank.rank}</Text><Text style={styles.statMainSmall}> out of {classRank.total}</Text></> : <Text style={styles.statMainBig}>--</Text>}</Text>}
            sub=""
            note="Top 2.5% of the cohort"
            noteIcon="✦"
          />
          <StatCard
            label="OVERALL GRADE"
            icon="⭐"
            main={<Text><Text style={styles.statMainBig}>{overallGrade}</Text><Text style={[styles.statMainSmall, { color: C.muted }]}>  Consistent</Text></Text>}
            sub=""
            note="Last updated 2 days ago"
            noteIcon="🕐"
          />
        </ScrollView>

        {/* Main grid */}
        <View style={[styles.mainGrid, !isTablet && styles.mainGridCol]}>
          {/* Left column */}
          <View style={isTablet ? styles.leftCol : styles.fullWidth}>
            <RankProgress barData={barData} />
            <RecentExamDetails examDetails={examDetails} />
          </View>

          {/* Right column */}
          <View style={isTablet ? styles.rightCol : styles.fullWidth}>
            <SubjectRankings subjectRankings={subjectRankings} />
            <ClassTop5 classTop5={classTop5} />
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

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.dark,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
  },
});