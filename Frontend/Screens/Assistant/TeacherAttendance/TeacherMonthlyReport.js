import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

const STATUS_CONFIG = {
  present: { bg: '#F0FDF4', color: '#16A34A', value: 1, label: 'Present' },
  absent: { bg: '#FEF2F2', color: '#DC2626', value: 0, label: 'Absent' },
  late: { bg: '#FFFBEB', color: '#D97706', value: 0.5, label: 'Late' },
  leave: { bg: '#F0F9FF', color: '#0284C7', value: 1, label: 'Leave' },
};

export default function TeacherMonthlyReport({ route, navigation }) {
  const { teacher, instituteId, adminInfo } = route.params || {};
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Fetch teacher attendance for the month
  const fetchMonthlyAttendance = async () => {
    if (!instituteId || !teacher?.teacherId) {
      return;
    }

    try {
      setLoading(true);
      const { response } = await fetchWithBaseUrlFallback(
        `/api/teacher-attendance?instituteId=${encodeURIComponent(instituteId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      // Filter records for the selected month and this teacher
      const monthYear = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
      
      const filtered = (Array.isArray(data) ? data : [])
        .filter((record) => record.attendanceDate.startsWith(monthYear))
        .flatMap((record) =>
          (record.teachersAttendance || [])
            .filter((t) => t.teacherId === teacher.teacherId)
            .map((t) => ({
              date: record.attendanceDate,
              ...t,
            }))
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setMonthlyData(filtered);
    } catch (error) {
      console.warn('Failed to fetch monthly data:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [selectedMonth, instituteId, teacher?.teacherId]);

  // Calculate statistics
  const stats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;

    monthlyData.forEach((record) => {
      const status = String(record.status || 'present').toLowerCase();
      if (status === 'present') presentCount += 1;
      else if (status === 'absent') absentCount += 1;
      else if (status === 'late') lateCount += 1;
      else if (status === 'leave') leaveCount += 1;
    });

    const total = monthlyData.length;
    const attendancePercent = total > 0 ? Math.round(((presentCount + leaveCount) / total) * 100) : 0;

    return {
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      leave: leaveCount,
      total,
      attendancePercent,
    };
  }, [monthlyData]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const attendanceRecord = monthlyData.find((r) => r.date === dateStr);
      
      days.push({
        date: dateStr,
        day: i,
        status: attendanceRecord?.status || null,
      });
    }

    return days;
  }, [selectedMonth, monthlyData]);

  const handlePrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const renderDayCell = ({ item, index }) => {
    if (!item) {
      return <View style={styles.dayEmpty} />;
    }

    const config = STATUS_CONFIG[item.status || 'absent'];

    return (
      <View style={styles.dayCell}>
        <View
          style={[
            styles.dayContent,
            item.status && { backgroundColor: config.bg, borderColor: config.color },
          ]}
        >
          <Text style={[styles.dayNumber, item.status && { color: config.color, fontWeight: '700' }]}>
            {item.day}
          </Text>
          {item.status && (
            <Text style={[styles.dayStatus, { color: config.color }]}>
              {item.status.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderAttendanceRecord = ({ item }) => {
    const config = STATUS_CONFIG[String(item.status || 'absent').toLowerCase()];
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
      <View style={styles.recordItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recordDate}>{dateStr}</Text>
        </View>
        <View style={[styles.recordStatus, { backgroundColor: config.bg, borderColor: config.color }]}>
          <Text style={[styles.recordStatusText, { color: config.color }]}>
            {String(item.status || '').charAt(0).toUpperCase() + String(item.status || '').slice(1)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{teacher?.teacherName || 'Teacher'}</Text>
          <Text style={styles.headerSubtitle}>{teacher?.subject || 'Faculty'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Attendance Percentage Card */}
        <View style={styles.percentageCard}>
          <View style={styles.percentageCircle}>
            <Text style={styles.percentageValue}>{stats.attendancePercent}%</Text>
            <Text style={styles.percentageLabel}>Attendance</Text>
          </View>
          <View style={styles.percentageStats}>
            <View style={styles.statItem}>
              <View style={[styles.statBox, { backgroundColor: '#F0FDF4' }]}>
                <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.present}</Text>
              </View>
              <Text style={styles.statName}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statBox, { backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.absent}</Text>
              </View>
              <Text style={styles.statName}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.late}</Text>
              </View>
              <Text style={styles.statName}>Late</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statBox, { backgroundColor: '#F0F9FF' }]}>
                <Text style={[styles.statValue, { color: '#0284C7' }]}>{stats.leave}</Text>
              </View>
              <Text style={styles.statName}>Leave</Text>
            </View>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.monthBtn} onPress={handlePrevMonth} activeOpacity={0.7}>
            <Text style={styles.monthBtnText}>‹ Prev</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <TouchableOpacity style={styles.monthBtn} onPress={handleNextMonth} activeOpacity={0.7}>
            <Text style={styles.monthBtnText}>Next ›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1E3A5F" />
            </View>
          ) : (
            <FlatList
              data={calendarDays}
              keyExtractor={(item, index) => `${index}`}
              renderItem={renderDayCell}
              numColumns={7}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: config.bg, borderColor: config.color }]} />
              <Text style={styles.legendText}>{config.label}</Text>
            </View>
          ))}
        </View>

        {/* Attendance Records */}
        {monthlyData.length > 0 ? (
          <>
            <Text style={styles.recordsTitle}>Attendance History</Text>
            <View style={styles.recordsList}>
              {monthlyData.map((record, index) => (
                <View key={index}>
                  {renderAttendanceRecord({ item: record })}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No attendance records for this month</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  percentageCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  percentageCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  percentageLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  percentageStats: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statName: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
  monthBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  monthBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  calendarContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
  },
  dayEmpty: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayContent: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayStatus: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  recordsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  recordsList: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recordDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  recordStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  recordStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
