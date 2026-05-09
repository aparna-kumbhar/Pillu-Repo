import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';
import { useWindowDimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isLaptop = SCREEN_WIDTH >= 1024;

// ─── Color Palette ───────────────────────────────────────────────
const C = {
  bg: '#F4F6FB',
  white: '#FFFFFF',
  navy: '#1E2A4A',
  navyLight: '#2E3E6A',
  teal: '#3ECFCF',
  tealDark: '#2BB5B5',
  green: '#4CAF82',
  amber: '#F5A623',
  red: '#E05C5C',
  textPrimary: '#1A1F36',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E9F2',
  cardShadow: 'rgba(30,42,74,0.08)',
  insightBg: '#1E2A4A',
  tipBg: '#F0FDF8',
  tipBorder: '#A7F3D0',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
};

// ─── Sub-components ───────────────────────────────────────────────────────────



// ─── Welcome Banner ───────────────────────────────────────────────
const WelcomeBanner = ({ teacherName }) => (
  <View style={styles.welcomeCard}>
    <View style={styles.welcomeLeft}>
      <Text style={styles.welcomeTitle}>Welcome, {teacherName}</Text>
      <Text style={styles.welcomeSubtitle}>
        Curating excellence across 12 active modules today. Your students have
        shown a 15% increase in engagement this week.
      </Text>
    </View>
    <TouchableOpacity style={styles.activeStudentsBtn} activeOpacity={0.8}>
      <View style={styles.avatarRow}>
        {['#FF6B6B', '#4ECDC4', '#45B7D1'].map((color, i) => (
          <View
            key={i}
            style={[styles.miniAvatar, { backgroundColor: color, marginLeft: i === 0 ? 0 : -8 }]}
          />
        ))}
        <View style={[styles.miniAvatar, styles.countAvatar, { marginLeft: -8 }]}>
          <Text style={styles.countText}>+28</Text>
        </View>
      </View>
      <Text style={styles.activeStudentsText}>Active Students Online</Text>
    </TouchableOpacity>
  </View>
);

// ─── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderTopColor: accent }]}
    activeOpacity={0.85}
  >
    <View style={[styles.statIcon, { backgroundColor: accent + '20' }]}>
      <Text style={styles.statIconText}>{icon}</Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
  </TouchableOpacity>
);

// ─── Lecture Row ──────────────────────────────────────────────────
const LectureRow = ({ time, ampm, title, location, batch, tag, tagColor }) => (
  <TouchableOpacity style={styles.lectureRow} activeOpacity={0.8}>
    <View style={styles.lectureTime}>
      <Text style={styles.lectureTimeHour}>{time}</Text>
      <Text style={styles.lectureTimeAmpm}>{ampm}</Text>
    </View>
    <View style={styles.lectureDivider} />
    <View style={styles.lectureInfo}>
      <Text style={styles.lectureTitle}>{title}</Text>
      <View style={styles.lectureMetaRow}>
        {location && <Text style={styles.lectureMeta}>📍 {location}</Text>}
        {batch && <Text style={styles.lectureMeta}>  • {batch}</Text>}
      </View>
    </View>
    {tag && (
      <View style={[styles.lectureTag, { backgroundColor: tagColor + '20', borderColor: tagColor }]}>
        <Text style={[styles.lectureTagText, { color: tagColor }]}>{tag}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// ─── Progress Bar ─────────────────────────────────────────────────
const ProgressBar = ({ label, value, color }) => (
  <View style={styles.progressRow}>
    <Text style={styles.progressLabel}>{label}</Text>
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
    <Text style={[styles.progressValue, { color }]}>{value}%</Text>
  </View>
);

// ─── Curator's Insight Card ───────────────────────────────────────
const CuratorsInsight = () => (
  <View style={styles.insightCard}>
    <View style={styles.insightHeader}>
      <Text style={styles.insightStar}>✦</Text>
      <Text style={styles.insightTitle}>Curator's Insight</Text>
    </View>
    <Text style={styles.insightText}>
      "Based on last night's assignment submissions, Batch Alpha 24 is struggling
      with 'Wave-Particle Duality'. Consider using the Asymmetric Drawer for a
      focused deep-dive in today's 9:00 AM session."
    </Text>
    <TouchableOpacity style={styles.insightBtn} activeOpacity={0.8}>
      <Text style={styles.insightBtnText}>Apply Strategy →</Text>
    </TouchableOpacity>
  </View>
);

// ─── Weekly Tip ───────────────────────────────────────────────────
const WeeklyTip = () => (
  <TouchableOpacity style={styles.tipCard} activeOpacity={0.85}>
    <View style={styles.tipHeader}>
      <Text style={styles.tipIcon}>💡</Text>
      <Text style={styles.tipLabel}>WEEKLY TIP</Text>
    </View>
    <Text style={styles.tipText}>
      "The Digital Atelier thrives on pause. Introduce a 2-minute 'silent
      reflection' block midway through virtual sessions to increase content
      retention by 22%."
    </Text>
  </TouchableOpacity>
);

const formatTimeParts = (value = '') => {
  const text = String(value || '').trim();
  if (!text) {
    return { time: '--:--', ampm: '' };
  }

  const match = text.match(/^(\d{1,2}:\d{2})\s*(AM|PM)?$/i);
  if (match) {
    return {
      time: match[1],
      ampm: (match[2] || '').toUpperCase(),
    };
  }

  return { time: text, ampm: '' };
};

// ─── Main Dashboard ───────────────────────────────────────────────
export default function Dashboardpage({ onOpenFullCalendar, teacherName, teacherId, instituteId }) {
  const { height: windowHeight } = useWindowDimensions();
  const safeTeacherName = String(teacherName || '').trim() || 'Professor';
  const safeTeacherId = String(teacherId || '').trim();
  const safeInstituteId = String(instituteId || '').trim();
  const [loading, setLoading] = useState(Boolean(safeTeacherId && safeInstituteId));
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    summary: {
      activeBatchesCount: 0,
      totalStudents: 0,
      averageAttendance: 0,
      currentDate: '',
      currentDay: '',
    },
    activeBatches: [],
    todaysLectures: [],
    batchPerformance: [],
  });

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!safeInstituteId || !safeTeacherId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const path = `/api/teachers/dashboard-summary?instituteId=${encodeURIComponent(safeInstituteId)}&teacherId=${encodeURIComponent(safeTeacherId)}&teacherName=${encodeURIComponent(safeTeacherName)}`;
        const { response } = await fetchWithBaseUrlFallback(path);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.message || 'Failed to load teacher dashboard');
        }

        if (!isMounted) {
          return;
        }

        setDashboardData({
          summary: payload?.summary || dashboardData.summary,
          activeBatches: Array.isArray(payload?.activeBatches) ? payload.activeBatches : [],
          todaysLectures: Array.isArray(payload?.todaysLectures) ? payload.todaysLectures : [],
          batchPerformance: Array.isArray(payload?.batchPerformance) ? payload.batchPerformance : [],
        });
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setError(fetchError.message || 'Failed to load teacher dashboard');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [safeInstituteId, safeTeacherId, safeTeacherName]);

  const activeBatches = dashboardData.activeBatches || [];
  const todaysLectures = dashboardData.todaysLectures || [];
  const batchPerformance = dashboardData.batchPerformance || [];
  const summary = dashboardData.summary || {};

  const lectureRows = todaysLectures.length > 0
    ? todaysLectures.map((lecture) => {
      const { time, ampm } = formatTimeParts(lecture.startTime);
      return (
        <LectureRow
          key={lecture.id}
          time={time}
          ampm={ampm}
          title={lecture.subject}
          location={lecture.classroom}
          batch={lecture.batchName}
          tag={lecture.color === 'green' ? 'Today' : ''}
          tagColor={lecture.color || C.green}
        />
      );
    })
    : [
      <View key="empty-lectures" style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No lectures scheduled for today</Text>
        <Text style={styles.emptyText}>Once a schedule is assigned to your batches, the day’s lectures will appear here.</Text>
      </View>,
    ];

  const batchPerformanceRows = batchPerformance.length > 0
    ? batchPerformance.map((batch) => (
      <ProgressBar
        key={batch.id}
        label={`${batch.label} · Avg Marks: ${batch.marksAverage ?? batch.value}%`}
        value={batch.value}
        color={batch.color}
      />
    ))
    : [
      <View key="empty-performance" style={styles.emptyStateCompact}>
        <Text style={styles.emptyTitle}>No batch performance data yet</Text>
      </View>,
    ];

  const batchCount = summary.activeBatchesCount || activeBatches.length || 0;
  const studentCount = summary.totalStudents || 0;
  const attendanceValue = typeof summary.averageAttendance === 'number' ? summary.averageAttendance : 0;
  const todayLabel = summary.currentDay && summary.currentDate ? `${summary.currentDay}, ${summary.currentDate}` : '';

  const renderContent = () => {
    if (isLaptop) {
      return (
        <View style={styles.twoCol}>
          <View style={styles.colLeft}>
            <WelcomeBanner teacherName={safeTeacherName} />
            <View style={styles.statsRow}>
              <StatCard icon="📚" label="ACTIVE BATCHES" value={String(batchCount)} accent={C.purple} />
              <StatCard icon="👥" label="TOTAL STUDENTS" value={String(studentCount)} accent={C.teal} />
              <StatCard icon="📊" label="AVG. ATTENDANCE" value={`${attendanceValue}%`} accent={C.amber} />
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Today's Lectures</Text>
                  {todayLabel ? <Text style={styles.sectionSub}>{todayLabel}</Text> : null}
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onOpenFullCalendar}
                >
                  <Text style={styles.sectionLink}>Full Calendar →</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <View style={styles.loadingBlock}>
                  <ActivityIndicator color={C.teal} />
                </View>
              ) : (
                lectureRows
              )}
            </View>
          </View>

          <View style={styles.colRight}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Batch Performance (Avg Marks)</Text>
              <View style={{ marginTop: 16 }}>
                {loading ? (
                  <View style={styles.loadingBlock}>
                    <ActivityIndicator color={C.teal} />
                  </View>
                ) : (
                  batchPerformanceRows
                )}
              </View>
            </View>
            <CuratorsInsight />
            <WeeklyTip />
          </View>
        </View>
      );
    }

    return (
      <View>
        <WelcomeBanner teacherName={safeTeacherName} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <StatCard icon="📚" label="ACTIVE BATCHES" value={String(batchCount)} accent={C.purple} />
          <StatCard icon="👥" label="TOTAL STUDENTS" value={String(studentCount)} accent={C.teal} />
          <StatCard icon="📊" label="AVG. ATTENDANCE" value={`${attendanceValue}%`} accent={C.amber} />
        </ScrollView>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Today's Lectures</Text>
              {todayLabel ? <Text style={styles.sectionSub}>{todayLabel}</Text> : null}
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onOpenFullCalendar}
            >
              <Text style={styles.sectionLink}>Full Calendar →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={C.teal} />
            </View>
          ) : (
            lectureRows
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Batch Performance (Avg Marks)</Text>
          <View style={{ marginTop: 16 }}>
            {loading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={C.teal} />
              </View>
            ) : (
              batchPerformanceRows
            )}
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Dashboard data unavailable</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <CuratorsInsight />
        <WeeklyTip />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        Platform.OS === 'web' && { height: windowHeight }  // ← add this
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isLaptop ? 32 : 16,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    color: C.navy,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 16 },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: C.white, fontSize: 12, fontWeight: '700' },
  profileName: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  profileRole: { fontSize: 11, color: C.textSecondary },

  // ── Scroll
  scrollContent: {
    paddingHorizontal: isLaptop ? 32 : 16,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // Two column layout
  twoCol: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  colLeft: { flex: 1.4 },
  colRight: { flex: 1 },

  // Welcome Card
  welcomeCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: isLaptop ? 'row' : 'column',
    alignItems: isLaptop ? 'center' : 'flex-start',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: C.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  welcomeLeft: { flex: 1, marginRight: isLaptop ? 16 : 0 },
  welcomeTitle: {
    fontSize: isLaptop ? 22 : 18,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 20,
  },
  activeStudentsBtn: {
    marginTop: isLaptop ? 0 : 16,
    alignItems: 'center',
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.white,
  },
  countAvatar: {
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: C.white, fontSize: 9, fontWeight: '700' },
  activeStudentsText: { fontSize: 11, color: C.textSecondary, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statsScroll: { marginBottom: 16 },
  statCard: {
    flex: isLaptop ? 1 : undefined,
    width: isLaptop ? undefined : 140,
    marginRight: isLaptop ? 0 : 12,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    borderTopWidth: 3,
    ...Platform.select({
      ios: { shadowColor: C.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statIconText: { fontSize: 18 },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: C.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: isLaptop ? 26 : 22,
    fontWeight: '800',
  },

  // Section Card
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: C.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textPrimary,
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 11,
    color: C.textSecondary,
    fontWeight: '600',
  },
  sectionLink: {
    fontSize: 13,
    color: C.teal,
    fontWeight: '600',
  },

  loadingBlock: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  emptyStateCompact: {
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: '#FFF3F3',
    borderWidth: 1,
    borderColor: '#F3B4B4',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.red,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 18,
  },

  // Lecture Row
  lectureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  lectureTime: { width: 44, alignItems: 'center' },
  lectureTimeHour: {
    fontSize: 13,
    fontWeight: '800',
    color: C.textPrimary,
  },
  lectureTimeAmpm: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
  },
  lectureDivider: {
    width: 2,
    height: 36,
    backgroundColor: C.teal,
    borderRadius: 2,
  },
  lectureInfo: { flex: 1 },
  lectureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 4,
  },
  lectureMetaRow: { flexDirection: 'row', flexWrap: 'wrap' },
  lectureMeta: { fontSize: 11, color: C.textSecondary },
  lectureTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  lectureTagText: { fontSize: 10, fontWeight: '700' },

  // Progress Bar
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  progressLabel: {
    flex: 1,
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: '500',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressValue: {
    width: 36,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },

  // Curator's Insight
  insightCard: {
    backgroundColor: C.insightBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightStar: { fontSize: 18, color: C.teal },
  insightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.white,
  },
  insightText: {
    fontSize: 13,
    color: '#A8B8D8',
    lineHeight: 20,
    marginBottom: 16,
  },
  insightBtn: {
    alignSelf: 'flex-start',
  },
  insightBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.teal,
  },

  // Weekly Tip
  tipCard: {
    backgroundColor: C.tipBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.tipBorder,
    padding: 20,
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  tipIcon: { fontSize: 16 },
  tipLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: C.green,
  },
  tipText: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 20,
  },

  // Bottom Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  tabIcon: { fontSize: 20 },
  tabLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: { color: C.navy },
  tabDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.teal,
  },
});