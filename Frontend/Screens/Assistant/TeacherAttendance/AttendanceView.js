import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';
import AttendanceDetailScreen from './AttendanceDetail';
import TeacherMonthlyReportScreen from './TeacherMonthlyReport';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

export default function AttendanceView({ instituteId = '', adminInfo = {}, onMenuPress }) {
  const [currentScreen, setCurrentScreen] = useState('list'); // 'list', 'detail', 'monthly'
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchDate, setSearchDate] = useState('');

  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    if (!instituteId) {
      Alert.alert('Missing Institute', 'Please log in to view attendance records.');
      return;
    }

    try {
      setLoading(true);
      const { response } = await fetchWithBaseUrlFallback(
        `/api/teacher-attendance?instituteId=${encodeURIComponent(instituteId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data?.message || 'Failed to fetch attendance records');
        return;
      }

      const sorted = Array.isArray(data)
        ? data.sort((a, b) => {
            const dateA = new Date(a.attendanceDate);
            const dateB = new Date(b.attendanceDate);
            return dateB - dateA;
          })
        : [];

      setAttendanceRecords(sorted);
    } catch (error) {
      Alert.alert('Network Error', error?.message || 'Could not fetch attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, [instituteId]);

  // Filter records by search date
  const filteredRecords = attendanceRecords.filter((record) => {
    if (!searchDate) return true;
    return record.attendanceDate.includes(searchDate);
  });

  const handleRecordPress = (record) => {
    setSelectedAttendanceRecord(record);
    setCurrentScreen('detail');
  };

  const handleTeacherPress = (teacher) => {
    setSelectedTeacher(teacher);
    setCurrentScreen('monthly');
  };

  const handleBack = () => {
    if (currentScreen === 'monthly') {
      setCurrentScreen('detail');
    } else if (currentScreen === 'detail') {
      setCurrentScreen('list');
    }
  };

  const renderAttendanceCard = ({ item }) => {
    const date = new Date(item.attendanceDate);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const totalTeachers = item.totalTeachers || 0;
    const presentPercent = totalTeachers > 0 ? Math.round((item.presentCount / totalTeachers) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.attendanceCard}
        onPress={() => handleRecordPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardDate}>{dateStr}</Text>
            <Text style={styles.cardSubtitle}>
              {totalTeachers} Teachers • {presentPercent}% Present
            </Text>
          </View>
          <View style={styles.cardArrow}>
            <Text style={styles.arrowText}>›</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#F0FDF4', borderLeftColor: '#16A34A' }]}>
            <Text style={styles.statNumber}>{item.presentCount}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FEF2F2', borderLeftColor: '#DC2626' }]}>
            <Text style={styles.statNumber}>{item.absentCount}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FFFBEB', borderLeftColor: '#D97706' }]}>
            <Text style={styles.statNumber}>{item.lateCount}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#F0F9FF', borderLeftColor: '#0284C7' }]}>
            <Text style={styles.statNumber}>{item.leaveCount}</Text>
            <Text style={styles.statLabel}>Leave</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Handle navigation between screens
  if (currentScreen === 'detail' && selectedAttendanceRecord) {
    return (
      <AttendanceDetailScreen
        route={{
          params: {
            attendanceRecord: selectedAttendanceRecord,
            instituteId,
            adminInfo,
          },
        }}
        navigation={{
          goBack: handleBack,
          navigate: (screenName, params) => {
            if (screenName === 'TeacherMonthlyReport') {
              handleTeacherPress(params.teacher);
            }
          },
        }}
      />
    );
  }

  if (currentScreen === 'monthly' && selectedTeacher) {
    return (
      <TeacherMonthlyReportScreen
        route={{
          params: {
            teacher: selectedTeacher,
            instituteId,
            adminInfo,
          },
        }}
        navigation={{
          goBack: handleBack,
        }}
      />
    );
  }

  // Default: List view
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Teacher Attendance Records</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date (YYYY-MM-DD)"
          placeholderTextColor="#9CA3AF"
          value={searchDate}
          onChangeText={setSearchDate}
        />
      </View>

      {/* Records List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1E3A5F" />
          <Text style={styles.loadingText}>Loading attendance records...</Text>
        </View>
      ) : filteredRecords.length > 0 ? (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item, index) => `${item.attendanceDate}-${index}`}
          renderItem={renderAttendanceCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Attendance Records</Text>
          <Text style={styles.emptyText}>
            {searchDate ? 'No records found for this date.' : 'No attendance records available yet.'}
          </Text>
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
  menuBtn: {
    marginRight: 12,
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
