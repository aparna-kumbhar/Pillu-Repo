import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// ── COLOURS ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#f0f4f2',
  surface: '#ffffff',
  primary: '#1a4a3a',
  primaryLight: '#2d6b54',
  accent: '#3d9970',
  accentSoft: '#d4ede4',
  textPrimary: '#1a2e25',
  textSecondary: '#5a7065',
  textMuted: '#8fa99e',
  border: '#e2ece8',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
};

// ── Batch List Screen ────────────────────────────────────────────────────────
function BatchListScreen({ navigation, instituteId }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchBatches();
    }, [instituteId])
  );

  const fetchBatches = async () => {
    if (!instituteId) {
      setError('Institute ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { response } = await fetchWithBaseUrlFallback(
        `/api/marks/batches/list?instituteId=${encodeURIComponent(instituteId)}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch batches');
      }

      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not fetch batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      batches.filter((b) =>
        b.batchName.toLowerCase().includes(search.toLowerCase())
      ),
    [batches, search]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* Header */}
  
        <Text style={styles.title}>View Exam Marks</Text>
        <Text style={styles.subtitle}>Select a batch to view marks</Text>
     

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search batches..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading batches...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchBatches}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>
            {search ? 'No batches match your search' : 'No batches with marks yet'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filtered.map((batch) => (
            <TouchableOpacity
              key={batch.batchId}
              style={styles.batchCard}
              onPress={() =>
                navigation.navigate('MarksDetail', {
                  batchId: batch.batchId,
                  batchName: batch.batchName,
                  instituteId,
                })
              }
            >
              <View style={styles.batchCardContent}>
                <Text style={styles.batchCardTitle}>{batch.batchName}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Marks</Text>
                    <Text style={styles.statValue}>{batch.marksCount}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Exams</Text>
                    <Text style={styles.statValue}>{batch.examsCount}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Status</Text>
                    <Text
                      style={[
                        styles.statValue,
                        batch.published && styles.publishedStatus,
                      ]}
                    >
                      {batch.published ? '✓' : '○'}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.footerSpace} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Marks Detail Screen ──────────────────────────────────────────────────────
function MarksDetailScreen({ navigation, route }) {
  const { batchId, batchName, instituteId } = route.params || {};
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [exams, setExams] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchMarks();
    }, [batchId, instituteId, selectedExam])
  );

  useEffect(() => {
    fetchMarks();
  }, [batchId, instituteId, selectedExam]);

  const fetchMarks = async () => {
    if (!batchId || !instituteId) {
      setError('Missing batch or institute ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      let query = `/api/marks/batch/${batchId}?instituteId=${encodeURIComponent(
        instituteId
      )}`;
      if (selectedExam) {
        query += `&examName=${encodeURIComponent(selectedExam)}`;
      }

      const { response } = await fetchWithBaseUrlFallback(query, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch marks');
      }

      const marksArray = Array.isArray(data) ? data : [];
      setMarks(marksArray);

      // Extract unique exams
      const uniqueExams = [...new Set(marksArray.map((m) => m.examName))];
      setExams(uniqueExams);
    } catch (err) {
      setError(err.message || 'Could not fetch marks');
      setMarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (markId) => {
    Alert.alert(
      'Delete Mark',
      'Are you sure you want to delete this mark record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { response } = await fetchWithBaseUrlFallback(
                `/api/marks/${markId}?instituteId=${encodeURIComponent(instituteId)}`,
                {
                  method: 'DELETE',
                }
              );

              if (!response.ok) {
                throw new Error('Failed to delete mark');
              }

              Alert.alert('Success', 'Mark deleted successfully');
              fetchMarks();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete mark');
            }
          },
        },
      ]
    );
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A':
        return C.success;
      case 'F':
        return C.error;
      case 'D':
      case 'E':
        return C.warning;
      default:
        return C.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{batchName}</Text>
        <Text style={styles.subtitle}>Marks Details</Text>
      </View>

      {/* Exam Filter */}
      {exams.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.examList}
          >
            <TouchableOpacity
              style={[
                styles.examChip,
                !selectedExam && styles.examChipActive,
              ]}
              onPress={() => setSelectedExam('')}
            >
              <Text
                style={[
                  styles.examChipText,
                  !selectedExam && styles.examChipTextActive,
                ]}
              >
                All Exams
              </Text>
            </TouchableOpacity>
            {exams.map((exam) => (
              <TouchableOpacity
                key={exam}
                style={[
                  styles.examChip,
                  selectedExam === exam && styles.examChipActive,
                ]}
                onPress={() => setSelectedExam(exam)}
              >
                <Text
                  style={[
                    styles.examChipText,
                    selectedExam === exam && styles.examChipTextActive,
                  ]}
                >
                  {exam}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading marks...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : marks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No marks found</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {marks.map((mark) => (
            <View key={mark._id} style={styles.markCard}>
              <View style={styles.markCardHeader}>
                <View style={styles.markCardTitle}>
                  <Text style={styles.studentName}>{mark.studentName}</Text>
                  <Text style={styles.examSubject}>
                    {mark.examName} • {mark.subject}
                  </Text>
                </View>
                <View
                  style={[
                    styles.gradeBox,
                    { backgroundColor: getGradeColor(mark.grade) },
                  ]}
                >
                  <Text style={styles.gradeText}>{mark.grade}</Text>
                </View>
              </View>

              <View style={styles.markCardBody}>
                <View style={styles.markValue}>
                  <Text style={styles.markValueNumber}>
                    {mark.marks}/{mark.totalMarks}
                  </Text>
                  <Text style={styles.markValueLabel}>Marks</Text>
                </View>
                <View style={styles.markValue}>
                  <Text style={styles.markValueNumber}>
                    {mark.percentage.toFixed(1)}%
                  </Text>
                  <Text style={styles.markValueLabel}>Percentage</Text>
                </View>
                <View style={styles.markValue}>
                  <Text
                    style={[
                      styles.markValueNumber,
                      {
                        color: mark.published ? C.success : C.warning,
                      },
                    ]}
                  >
                    {mark.published ? '✓' : '○'}
                  </Text>
                  <Text style={styles.markValueLabel}>
                    {mark.published ? 'Published' : 'Draft'}
                  </Text>
                </View>
              </View>

              {mark.remarks && (
                <Text style={styles.remarks}>Remarks: {mark.remarks}</Text>
              )}

              <View style={styles.markActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(mark._id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={styles.footerSpace} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Stack Navigator ─────────────────────────────────────────────────────────
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function MarksView({ instituteId: propsInstituteId = '' }) {
  const route = useRoute();
  const finalInstituteId = (propsInstituteId || route?.params?.instituteId || '').trim();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="BatchList"
        component={(props) => (
          <BatchListScreen {...props} instituteId={finalInstituteId} />
        )}
      />
      <Stack.Screen name="MarksDetail" component={MarksDetailScreen} />
    </Stack.Navigator>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    backgroundColor: C.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: C.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: C.textSecondary,
  },
  instituteTag: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.accentSoft,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  instituteTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    padding: 0,
  },
  filterContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  examList: {
    flexDirection: 'row',
  },
  examChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.bg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  examChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  examChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
  },
  examChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: C.error,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: C.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  batchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  batchCardContent: {
    flex: 1,
  },
  batchCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: C.primary,
  },
  publishedStatus: {
    color: C.success,
  },
  chevron: {
    fontSize: 24,
    color: C.textMuted,
    marginLeft: 12,
  },
  markCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  markCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  markCardTitle: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 4,
  },
  examSubject: {
    fontSize: 13,
    color: C.textSecondary,
  },
  gradeBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  markCardBody: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  markValue: {
    flex: 1,
    alignItems: 'center',
  },
  markValueNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: C.primary,
    marginBottom: 4,
  },
  markValueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
  },
  remarks: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: C.bg,
    borderRadius: 6,
    fontStyle: 'italic',
  },
  markActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.accent,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: C.error,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  footerSpace: {
    height: 20,
  },
});
