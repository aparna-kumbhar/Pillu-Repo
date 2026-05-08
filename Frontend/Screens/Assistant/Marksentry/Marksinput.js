import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

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
};

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'English',
  'Biology',
  'History',
  'Geography',
  'Computer Science',
];

// ── Dropdown Component ──
const Dropdown = ({ label, value, options, onSelect, containerStyle }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(!visible)}
      >
        <Text style={styles.dropdownButtonText}>{value || 'Select...'}</Text>
        <Text style={styles.dropdownIcon}>{visible ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {visible && (
        <View style={styles.dropdownMenu}>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    value === item && styles.dropdownItemTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

// ── MARKS INPUT SCREEN ──────────────────────────────────────────────────────
export default function Marksinput({ instituteId: propsInstituteId = '' }) {
  const route = useRoute();
  const navigation = useNavigation();
  const {
    instituteId: routeInstituteId = '',
    batchId = '',
    batchName = '',
    batchStudents = [],
    subjectOptions = [],
  } = route.params || {};
  
  // Use prop first, fall back to route param
  const finalInstituteId = (propsInstituteId || routeInstituteId || '').trim();
  const availableSubjects = subjectOptions.length > 0 ? subjectOptions : DEFAULT_SUBJECTS;

  // Form state
  const [examName, setExamName] = useState('');
  const [subject, setSubject] = useState(availableSubjects[0] || '');
  const [totalMarks, setTotalMarks] = useState('100');
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);

  // Initialize students
  useEffect(() => {
    const studentList = Array.isArray(batchStudents)
      ? batchStudents.map((s) => ({
          id: s._id || s.id || s.studentId,
          name: s.fullName || s.name || 'Unknown Student',
          roll: s.rollNo || s.roll || '',
        }))
      : [];

    setStudents(studentList);
  }, [batchStudents]);

  const handleMarkChange = (studentId, value) => {
    const numValue = parseInt(value, 10);
    const maxMarks = parseInt(totalMarks, 10) || 100;

    if (value === '' || (/^\d+$/.test(value) && numValue >= 0 && numValue <= maxMarks)) {
      setMarksData({
        ...marksData,
        [studentId]: value,
      });
    }
  };

  const validateForm = () => {
    if (!finalInstituteId.trim()) {
      Alert.alert('Error', 'Institute ID is missing. Please log in again.');
      return false;
    }
    if (!examName.trim()) {
      Alert.alert('Validation Error', 'Please enter exam name');
      return false;
    }
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please select subject');
      return false;
    }
    if (!totalMarks || parseInt(totalMarks, 10) <= 0) {
      Alert.alert('Validation Error', 'Please enter valid total marks');
      return false;
    }
    if (Object.keys(marksData).length === 0) {
      Alert.alert('Validation Error', 'Please enter marks for at least one student');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const marksArray = students
        .filter((student) => marksData[student.id] !== undefined && marksData[student.id] !== '')
        .map((student) => ({
          examName: examName.trim(),
          subject: subject.trim(),
          studentId: student.id,
          studentName: student.name,
          studentRoll: student.roll,
          marks: parseInt(marksData[student.id], 10),
          totalMarks: parseInt(totalMarks, 10),
        }));

      const payload = {
        instituteId: finalInstituteId,
        batchId,
        batchName,
        marksArray,
        createdBy: {
          adminName: 'Assistant',
          email: 'assistant@institute.com',
        },
      };

      const { response } = await fetchWithBaseUrlFallback('/api/marks/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to save marks');
      }

      Alert.alert(
        'Success',
        `Marks saved for ${result.savedCount} students\n\nView them in "View Exam Marks" from sidebar`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setExamName('');
              setSubject(SUBJECTS[0] || '');
              setTotalMarks('100');
              setMarksData({});
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!examName.trim()) {
      Alert.alert('Validation Error', 'Please enter exam name first');
      return;
    }

    setLoading(true);
    try {
      const { response } = await fetchWithBaseUrlFallback('/api/marks/publish/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: finalInstituteId,
          batchId,
          examName: examName.trim(),
          published: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Failed to publish marks');
      }

      Alert.alert(
        'Success',
        `Marks published for ${result.modifiedCount} records\n\nView them in "View Exam Marks" from sidebar`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to publish marks');
    } finally {
      setLoading(false);
    }
  };

  const filledCount = Object.values(marksData).filter(
    (m) => m !== undefined && m !== ''
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kvContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Enter Exam Marks</Text>
          <Text style={styles.subtitle}>{batchName}</Text>
          {finalInstituteId && (
            <View style={styles.instituteTag}>
              <Text style={styles.instituteTagText}>🏢 Institute: {finalInstituteId}</Text>
            </View>
          )}
        </View>

        {/* Form */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Exam Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exam Details</Text>

            <View>
              <Text style={styles.label}>Exam Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Midterm 2024"
                placeholderTextColor={C.textMuted}
                value={examName}
                onChangeText={setExamName}
              />
            </View>

            <Dropdown
              label="Subject *"
              value={subject}
              options={availableSubjects}
              onSelect={setSubject}
              containerStyle={styles.dropdownContainer}
            />

            <View>
              <Text style={styles.label}>Total Marks *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={C.textMuted}
                value={totalMarks}
                onChangeText={setTotalMarks}
              />
            </View>
          </View>

          {/* Marks Entry */}
          <View style={styles.section}>
            <View style={styles.marksHeaderRow}>
              <Text style={styles.sectionTitle}>Student Marks</Text>
              <Text style={styles.marksCount}>
                {filledCount}/{students.length} filled
              </Text>
            </View>

            {students.length === 0 ? (
              <Text style={styles.emptyText}>No students in this batch</Text>
            ) : (
              <View style={styles.marksTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.nameCell]}>Student Name</Text>
                  <Text style={[styles.tableCell, styles.marksCell]}>Marks</Text>
                </View>

                {students.map((student) => (
                  <View key={student.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.nameCell, styles.studentNameText]}>
                      {student.name}
                    </Text>
                    <TextInput
                      style={[styles.tableCell, styles.marksCell, styles.marksInput]}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={C.textMuted}
                      value={marksData[student.id] || ''}
                      onChangeText={(value) => handleMarkChange(student.id, value)}
                      maxLength={3}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveBtt, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>💾 Save Marks</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.publishBtn, loading && styles.buttonDisabled]}
              onPress={handlePublish}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>📤 Publish Marks</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  kvContainer: {
    flex: 1,
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 16,
  },
  marksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  marksCount: {
    fontSize: 13,
    fontWeight: '600',
    color: C.accent,
    backgroundColor: C.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: C.textPrimary,
    backgroundColor: C.bg,
    marginBottom: 16,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: C.bg,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: C.textPrimary,
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 12,
    color: C.textMuted,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.surface,
    marginTop: -8,
    zIndex: 100,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: C.textPrimary,
  },
  dropdownItemTextSelected: {
    color: C.primary,
    fontWeight: '700',
  },
  marksTable: {
    backgroundColor: C.bg,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableCell: {
    fontSize: 13,
    fontWeight: '600',
  },
  nameCell: {
    flex: 2,
    color: '#fff',
  },
  marksCell: {
    flex: 1,
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: 'center',
  },
  studentNameText: {
    color: C.textPrimary,
    fontWeight: '500',
  },
  marksInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: C.surface,
    textAlign: 'center',
    color: C.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: C.textMuted,
    paddingVertical: 20,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveBtt: {
    backgroundColor: C.accent,
  },
  publishBtn: {
    backgroundColor: C.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
