import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

const C = {
  primary: '#1A56DB',
  primaryDark: '#1441A8',
  bg: '#F9FAFB',
  white: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  active: '#EEF2FF',
  activeBorder: '#1A56DB',
  red: '#C81E1E',
};

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_ORDER = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6 };

const normalizeSession = (session = {}) => ({
  id: String(session._id || `${session.day || ''}-${session.startTime || ''}`),
  day: String(session.day || '').trim().slice(0, 3).toUpperCase(),
  startTime: String(session.startTime || '').trim(),
  endTime: String(session.endTime || '').trim(),
  title: String(session.subject?.label || session.subject?.name || 'Untitled').trim(),
  sub: [session.classroom?.label || session.classroom?.name || '', session.faculty?.label || session.faculty?.name || '']
    .filter(Boolean)
    .join(' • ') || 'Batch class',
});

const processSchedules = (schedules = []) => {
  const rows = [];

  schedules.forEach((schedule) => {
    (schedule.sessions || []).forEach((session) => {
      const normalized = normalizeSession(session);
      rows.push({
        id: normalized.id,
        day: normalized.day,
        dayLabel: normalized.day,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        title: normalized.title,
        sub: normalized.sub,
      });
    });
  });

  rows.sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  return rows;
};

const groupSchedulesByDay = (rows = []) => {
  const grouped = {};

  DAYS.forEach((day) => {
    grouped[day] = [];
  });

  rows.forEach((row) => {
    if (!grouped[row.day]) grouped[row.day] = [];
    grouped[row.day].push(row);
  });

  return grouped;
};

const resolveBatchId = async ({ student, instituteId, batchId }) => {
  const batchFromRoute = String(batchId || '').trim();
  if (batchFromRoute) return batchFromRoute;

  const batchFromStudent =
    student?.batch?.id ||
    student?.batch?.batchId ||
    student?.batchId ||
    student?.batch?._id ||
    '';
  if (batchFromStudent) return String(batchFromStudent).trim();

  const studentIdCandidates = [student?.id, student?._id, student?.studentId].filter(Boolean).map(String);
  const { response: batchesRes } = await fetchWithBaseUrlFallback(
    `/api/batches?instituteId=${encodeURIComponent(instituteId)}`,
    { method: 'GET', headers: { Accept: 'application/json' } }
  );

  if (!batchesRes.ok) return '';

  const batches = await batchesRes.json();
  const studentName = String(student?.fullName || student?.name || '').trim().toLowerCase();
  const found = (Array.isArray(batches) ? batches : []).find((batch) =>
    Array.isArray(batch.students) && batch.students.some((member) => {
      const memberId = String(member?.id || member?._id || member?.studentId || '').trim();
      const memberName = String(member?.name || '').trim().toLowerCase();
      return (
        (memberId && studentIdCandidates.includes(memberId)) ||
        (studentName && memberName === studentName)
      );
    })
  );

  return found?._id || '';
};

function TopBar({ subtitle }) {
  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.brandName}>UniVerse</Text>
        <Text style={styles.topBarSub}>{subtitle}</Text>
      </View>
      <View style={styles.topChip}>
        <Text style={styles.topChipText}>Weekly Schedule</Text>
      </View>
    </View>
  );
}

function SessionCard({ item }) {
  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeaderRow}>
        <Text style={styles.sessionDay}>{item.dayLabel}</Text>
        <Text style={styles.sessionTime}>
          {item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : item.startTime}
        </Text>
      </View>
      <Text style={styles.sessionTitle}>{item.title}</Text>
      <Text style={styles.sessionSub}>{item.sub}</Text>
    </View>
  );
}

function WeeklySchedule({ student, instituteId: instituteIdProp, batchId: batchIdProp }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [scheduleRows, setScheduleRows] = useState([]);
  const [selectedDay, setSelectedDay] = useState('MON');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const studentContext = useMemo(() => ({
    student,
    instituteId: instituteIdProp || student?.instituteId || '',
  }), [student, instituteIdProp]);

  const rowsByDay = useMemo(() => groupSchedulesByDay(scheduleRows), [scheduleRows]);
  const visibleRows = rowsByDay[selectedDay] || [];

  const dayTabs = useMemo(() => {
    const daysWithData = DAYS.filter((day) => (rowsByDay[day] || []).length > 0);
    return daysWithData.length ? DAYS.filter((day) => daysWithData.includes(day)) : DAYS;
  }, [rowsByDay]);

  useEffect(() => {
    let mounted = true;

    const loadSchedule = async () => {
      try {
        setLoading(true);
        setError('');

        const instituteId = String(studentContext.instituteId || '').trim();
        if (!instituteId) throw new Error('Institute ID is missing for this student');

        const batchId = await resolveBatchId({ student: studentContext.student, instituteId, batchId: batchIdProp });
        if (!batchId) throw new Error('Student is not assigned to any batch yet');

        const { response: scheduleRes } = await fetchWithBaseUrlFallback(
          `/api/schedules/batch/${encodeURIComponent(batchId)}?instituteId=${encodeURIComponent(instituteId)}`,
          { method: 'GET', headers: { Accept: 'application/json' } }
        );

        if (!scheduleRes.ok) throw new Error('Failed to fetch schedule');

        const schedules = await scheduleRes.json();
        const processed = processSchedules(Array.isArray(schedules) ? schedules : []);

        if (!mounted) return;
        setScheduleRows(processed);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load schedule');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSchedule();
    return () => {
      mounted = false;
    };
  }, [studentContext]);

  useEffect(() => {
    if (!dayTabs.includes(selectedDay)) {
      setSelectedDay(dayTabs[0] || 'MON');
    }
  }, [dayTabs, selectedDay]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <TopBar subtitle="Loading schedule" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerText}>Loading your weekly schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <TopBar subtitle="Schedule unavailable" />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Text style={styles.centerHint}>Make sure the student belongs to a batch in the same institute.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <TopBar subtitle="Batch schedule" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.pageBody}>
        <View style={styles.heroCard}>
          <Text style={styles.heroKicker}>Student Weekly Schedule</Text>
          <Text style={styles.heroTitle}>Your batch timetable</Text>
          <Text style={styles.heroSub}>Matched to your institute and batch</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabsRow}
        >
          {DAYS.map((day) => {
            const isActive = selectedDay === day;
            const count = (rowsByDay[day] || []).length;

            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                style={({ pressed }) => [
                  styles.dayTab,
                  isActive && styles.dayTabActive,
                  pressed && styles.dayTabPressed,
                ]}
              >
                <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>{day}</Text>
                <Text style={[styles.dayTabCount, isActive && styles.dayTabCountActive]}>{count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{selectedDay} Timetable</Text>
            <Text style={styles.listSubtitle}>Time • Subject • Faculty</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {visibleRows.length ? (
              visibleRows.map((item) => (
                <View key={item.id} style={styles.listRow}>
                  <View style={styles.rowDayChip}>
                    <Text style={styles.rowDayChipText}>{item.day}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTime}>
                      {item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : item.startTime}
                    </Text>
                    <Text style={styles.rowSubject}>{item.title}</Text>
                    <Text style={styles.rowFaculty}>{item.sub}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No classes scheduled for {selectedDay}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default WeeklySchedule;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg, ...Platform.select({ web: { minHeight: '100vh' } }) },
  scroll: { flex: 1, ...Platform.select({ web: { overflowY: 'auto', minHeight: '100vh' } }) },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brandName: { fontSize: 18, fontWeight: '800', color: C.primaryDark },
  topBarSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  topChip: {
    backgroundColor: C.active,
    borderColor: C.activeBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  topChipText: { color: C.primaryDark, fontWeight: '700', fontSize: 12 },
  pageBody: { flex: 1, padding: 16, gap: 16, ...Platform.select({ web: { flexGrow: 1 } }) },
  heroRow: { flexDirection: isTablet ? 'row' : 'column', gap: 12 },
  heroCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  heroCardDesktop: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  heroKicker: { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: C.text, marginTop: 6 },
  heroSub: { fontSize: 14, color: C.textMuted, marginTop: 6 },
  dayTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  dayTab: {
    width: 72,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dayTabActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  dayTabPressed: { opacity: 0.85 },
  dayTabText: { fontSize: 12, fontWeight: '900', color: C.textMuted, letterSpacing: 0.5 },
  dayTabTextActive: { color: C.white },
  dayTabCount: { marginTop: 4, fontSize: 16, fontWeight: '900', color: C.text },
  dayTabCountActive: { color: C.white },
  summaryCard: {
    width: isTablet ? 220 : '100%',
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryLabel: { fontSize: 12, color: C.textMuted, fontWeight: '700' },
  summaryValue: { fontSize: 24, color: C.primaryDark, fontWeight: '900', marginTop: 8 },
  summarySubText: { fontSize: 12, color: C.textLight, marginTop: 4 },
  listCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  listTitle: { fontSize: 16, fontWeight: '900', color: C.text },
  listSubtitle: { fontSize: 12, color: C.textLight, marginTop: 4 },
  listContent: { padding: 14, gap: 10 },
  listRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FBFBFC',
  },
  rowDayChip: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: C.primary,
    paddingVertical: 10,
  },
  rowDayChipText: { color: C.white, fontWeight: '900', fontSize: 13 },
  rowBody: { flex: 1, gap: 4 },
  rowTime: { fontSize: 12, fontWeight: '800', color: C.primaryDark },
  rowSubject: { fontSize: 15, fontWeight: '900', color: C.text },
  rowFaculty: { fontSize: 12, color: C.textMuted },
  sessionCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    gap: 4,
  },
  sessionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionDay: { fontSize: 11, fontWeight: '800', color: C.textMuted },
  sessionTime: { fontSize: 10, fontWeight: '800', color: C.primary },
  sessionTitle: { fontSize: 13, fontWeight: '800', color: C.text, lineHeight: 18 },
  sessionSub: { fontSize: 11, color: C.textMuted, lineHeight: 15 },
  emptyDay: { fontSize: 12, color: C.textLight, fontStyle: 'italic', paddingVertical: 8 },
  emptyState: { paddingVertical: 26, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { color: C.textMuted, fontSize: 13, textAlign: 'center' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  centerText: { marginTop: 12, color: C.textMuted, fontWeight: '600' },
  centerHint: { marginTop: 8, color: C.textLight, textAlign: 'center' },
  errorText: { color: C.red, fontWeight: '700', textAlign: 'center' },
});
