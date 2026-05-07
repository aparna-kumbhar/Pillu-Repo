import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const COLORS = {
  primary: '#1D4ED8',
  success: '#15803D',
  danger: '#B91C1C',
  warning: '#D97706',
  bg: '#F0F4F8',
  white: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  subtext: '#6B7280',
  present: '#DCFCE7',
  presentText: '#15803D',
  absent: '#FEE2E2',
  absentText: '#B91C1C',
};

const readJsonResponse = async (requestResult) => {
  const response = requestResult?.response;
  if (!response) {
    return { ok: false, data: null, message: 'No response received' };
  }

  const data = await response.json().catch(() => null);
  return {
    ok: response.ok,
    status: response.status,
    data,
    message: data?.message || '',
  };
};

// ─── Batch Students View ──────────────────────────────────────────────────────

function BatchStudentsView({ batchId, batchName, instituteId, onBack }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateInput, setDateInput] = useState(selectedDate);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchBatchAttendance = async () => {
    const nextDate = String(dateInput || '').trim();
    if (!instituteId || !batchId || !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      setStudents([]);
      setHasLoaded(true);
      return;
    }

    try {
      setLoading(true);
      setSelectedDate(nextDate);
      const response = await fetchWithBaseUrlFallback(
        `/api/attendance?instituteId=${instituteId}&date=${nextDate}&batchId=${batchId}`,
        { method: 'GET' }
      );
      const result = await readJsonResponse(response);
      if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
        const record = result.data[0];
        setStudents(record.studentsAttendance || []);
      } else {
        setStudents([]);
      }
      setHasLoaded(true);
    } catch (err) {
      console.error('Error fetching batch attendance:', err);
      setStudents([]);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{batchName}</Text>
          <Text style={styles.headerSubtitle}>Select a date to load attendance</Text>
        </View>
      </View>

      <View style={styles.datePickerBar}>
        <View style={styles.datePickerTextWrap}>
          <Text style={styles.datePickerLabel}>Date</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
            value={dateInput}
            onChangeText={setDateInput}
          />
        </View>
        <TouchableOpacity onPress={fetchBatchAttendance} style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Show</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.studentsList}>
            {!hasLoaded ? (
              <Text style={styles.noData}>Choose a date to see attendance</Text>
            ) : students.length === 0 ? (
              <Text style={styles.noData}>No attendance records found for this date</Text>
            ) : (
              students.map((student, idx) => {
                const statusColor = student.status === 'present' ? COLORS.present : student.status === 'absent' ? COLORS.absent : COLORS.warning;
                const statusTextColor = student.status === 'present' ? COLORS.presentText : student.status === 'absent' ? COLORS.absentText : COLORS.warning;
                
                return (
                  <View
                    key={idx}
                    style={styles.studentItem}
                  >
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.studentName}</Text>
                      <Text style={styles.studentId}>{student.studentId}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusColor }]}>
                      <Text style={[styles.badgeText, { color: statusTextColor }]}>
                        {student.status?.charAt(0).toUpperCase() + student.status?.slice(1)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Batches List View ────────────────────────────────────────────────────────

function BatchesListView({ instituteId, onSelectBatch }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('BatchesListView mount. instituteId:', instituteId);
    fetchBatchesFromDb();
  }, [instituteId]);

  const fetchBatchesFromDb = async () => {
    if (!instituteId) {
      console.warn('No instituteId provided to BatchesListView');
      setError('Institute ID is missing');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching batches for instituteId:', instituteId);
      const response = await fetchWithBaseUrlFallback(
        `/api/batches?instituteId=${instituteId}`,
        { method: 'GET' }
      );
      const result = await readJsonResponse(response);
      console.log('Batch fetch response:', result);
      if (result.ok && Array.isArray(result.data)) {
        console.log('Batches received:', result.data);
        setBatches(result.data.map((batch) => ({
          batchId: String(batch?._id || '').trim(),
          batchName: batch?.name || 'Batch',
          studentCount: Array.isArray(batch?.students) ? batch.students.length : 0,
        })));
      } else {
        const errorMsg = result.message || 'Failed to fetch batches';
        console.error('API error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err.message || 'Network error while fetching batches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Attendance Batches</Text>
          <Text style={styles.headerSubtitle}>Select a batch to continue</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : error ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.batchesList}>
            <View style={[styles.batchItem, { backgroundColor: COLORS.absent }]}>
              <Text style={[styles.noData, { color: COLORS.absentText, marginTop: 0 }]}>⚠️ Error: {error}</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.batchesList}>
            {batches.length === 0 ? (
              <Text style={styles.noData}>No batches found for this institute</Text>
            ) : (
              batches.map((batch, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => onSelectBatch(batch.batchId, batch.batchName)}
                  style={styles.batchItem}
                >
                  <View>
                    <Text style={styles.batchName}>{batch.batchName}</Text>
                    <Text style={styles.batchDetail}>{batch.studentCount} students</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViewAttendance({ route, instituteId: propInstituteId }) {
  const instituteId = propInstituteId || route?.params?.instituteId || '';
  const [screen, setScreen] = useState('batches'); // 'batches' | 'students'
  const [selectedBatch, setSelectedBatch] = useState(null);

  const handleSelectBatch = (batchId, batchName) => {
    setSelectedBatch({ batchId, batchName });
    setScreen('students');
  };

  const handleBack = () => {
    if (screen === 'students') {
      setScreen('batches');
      setSelectedBatch(null);
    }
  };

  if (screen === 'batches') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <BatchesListView
            instituteId={instituteId}
            onSelectBatch={handleSelectBatch}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (screen === 'students') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <BatchStudentsView
            batchId={selectedBatch?.batchId}
            batchName={selectedBatch?.batchName}
            instituteId={instituteId}
            onBack={handleBack}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  dateInputSection: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  batchesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  batchItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  batchDetail: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 4,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.primary,
  },
  studentsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  studentItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  studentId: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noData: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 32,
  },
  datePickerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  datePickerTextWrap: {
    flex: 1,
  },
});
