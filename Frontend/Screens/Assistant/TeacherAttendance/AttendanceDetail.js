import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

const STATUS_CONFIG = {
  present: { bg: '#F0FDF4', border: '#16A34A', text: '#15803D', icon: '✓' },
  absent: { bg: '#FEF2F2', border: '#DC2626', text: '#B91C1C', icon: '✕' },
  late: { bg: '#FFFBEB', border: '#D97706', text: '#B45309', icon: '⏱' },
  leave: { bg: '#F0F9FF', border: '#0284C7', text: '#0369A1', icon: '📋' },
};

export default function AttendanceDetail({ route, navigation }) {
  const { attendanceRecord, instituteId, adminInfo } = route.params || {};
  const [selectedStatus, setSelectedStatus] = useState(null);

  const teachers = attendanceRecord?.teachersAttendance || [];
  
  // Group teachers by status
  const groupedTeachers = useMemo(() => {
    const groups = {
      present: [],
      absent: [],
      late: [],
      leave: [],
    };

    teachers.forEach((teacher) => {
      const status = String(teacher.status || 'present').toLowerCase();
      if (groups[status]) {
        groups[status].push(teacher);
      }
    });

    return groups;
  }, [teachers]);

  // Filter teachers based on selected status
  const displayTeachers = selectedStatus
    ? groupedTeachers[selectedStatus] || []
    : teachers;

  const handleTeacherPress = (teacher) => {
    navigation.navigate('TeacherMonthlyReport', {
      teacher,
      instituteId,
      adminInfo,
    });
  };

  const renderTeacherItem = ({ item }) => {
    const status = String(item.status || 'present').toLowerCase();
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.present;

    return (
      <TouchableOpacity
        style={styles.teacherCard}
        onPress={() => handleTeacherPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.avatar, { backgroundColor: item.color || '#6B7280' }]}>
          <Text style={styles.avatarText}>{item.initials || 'T'}</Text>
        </View>

        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{item.teacherName || 'Teacher'}</Text>
          <Text style={styles.teacherRole}>{item.role || ''}</Text>
          {item.subject && <Text style={styles.teacherSubject}>{item.subject}</Text>}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
          <Text style={[styles.statusIcon, { color: config.text }]}>{config.icon}</Text>
          <Text style={[styles.statusText, { color: config.text }]}>
            {String(item.status || '').charAt(0).toUpperCase() + String(item.status || '').slice(1)}
          </Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  const date = new Date(attendanceRecord?.attendanceDate);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const statusTabs = [
    { id: null, label: 'All', count: teachers.length },
    { id: 'present', label: 'Present', count: groupedTeachers.present.length },
    { id: 'absent', label: 'Absent', count: groupedTeachers.absent.length },
    { id: 'late', label: 'Late', count: groupedTeachers.late.length },
    { id: 'leave', label: 'Leave', count: groupedTeachers.leave.length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Attendance Details</Text>
          <Text style={styles.headerDate}>{dateStr}</Text>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryBox, { borderLeftColor: '#16A34A' }]}>
          <Text style={styles.summaryLabel}>Present</Text>
          <Text style={styles.summaryValue}>{attendanceRecord?.presentCount || 0}</Text>
        </View>
        <View style={[styles.summaryBox, { borderLeftColor: '#DC2626' }]}>
          <Text style={styles.summaryLabel}>Absent</Text>
          <Text style={styles.summaryValue}>{attendanceRecord?.absentCount || 0}</Text>
        </View>
        <View style={[styles.summaryBox, { borderLeftColor: '#D97706' }]}>
          <Text style={styles.summaryLabel}>Late</Text>
          <Text style={styles.summaryValue}>{attendanceRecord?.lateCount || 0}</Text>
        </View>
        <View style={[styles.summaryBox, { borderLeftColor: '#0284C7' }]}>
          <Text style={styles.summaryLabel}>Leave</Text>
          <Text style={styles.summaryValue}>{attendanceRecord?.leaveCount || 0}</Text>
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          data={statusTabs}
          keyExtractor={(item) => String(item.id || 'all')}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, selectedStatus === item.id && styles.tabActive]}
              onPress={() => setSelectedStatus(item.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, selectedStatus === item.id && styles.tabTextActive]}>
                {item.label}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  selectedStatus === item.id && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    selectedStatus === item.id && styles.tabBadgeTextActive,
                  ]}
                >
                  {item.count}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          horizontal
          contentContainerStyle={styles.tabsContent}
        />
      </View>

      {/* Teachers List */}
      {displayTeachers.length > 0 ? (
        <FlatList
          data={displayTeachers}
          keyExtractor={(item, index) => `${item.teacherId}-${index}`}
          renderItem={renderTeacherItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No teachers in this status</Text>
        </View>
      )}
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
  headerDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryBox: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#1E3A5F',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    minWidth: 24,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  teacherRole: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  teacherSubject: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginRight: 8,
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
    color: '#D1D5DB',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
