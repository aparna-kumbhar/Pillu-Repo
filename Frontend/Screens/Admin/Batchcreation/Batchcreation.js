import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  NativeModules,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import Constants from 'expo-constants';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';
import Addstudent from './Addstudent';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;


const formatBatchDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString('en-US');
};

const normalizeBatchFromApi = (batch) => {
  const faculty = batch?.faculty && (batch.faculty.id || batch.faculty.name || batch.faculty.subject)
    ? batch.faculty
    : null;

  return {
    id: batch?._id || batch?.id || Date.now().toString(),
    name: batch?.name || '',
    description: batch?.description || '',
    capacity: String(batch?.capacity ?? ''),
    startDate: formatBatchDate(batch?.startDate),
    type: batch?.type || 'Regular',
    students: Array.isArray(batch?.students)
      ? batch.students.map((student, index) => ({
          id: student?.id || student?._id || `${batch?._id || 'batch'}-${index}`,
          name: student?.name || student?.fullName || 'Student',
          grade: student?.grade || student?.academicYear || '',
          avatar: student?.avatar || '👤',
        }))
      : [],
    faculty,
    instituteId: batch?.instituteId || '',
    instituteName: batch?.instituteName || '',
  };
};

const buildBatchPayload = ({ batchData, instituteId, instituteName, students = [], faculty = {} }) => ({
  instituteId,
  instituteName,
  name: batchData.name,
  description: batchData.description,
  capacity: batchData.capacity,
  startDate: batchData.startDate,
  type: batchData.type,
  students,
  faculty,
  createdBy: batchData.createdBy || {},
});

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STUDENTS = [
  { id: '1', name: 'Aarav Sharma', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '2', name: 'Priya Nair', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '3', name: 'Rohan Mehta', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '4', name: 'Ananya Iyer', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '5', name: 'Karan Patel', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '6', name: 'Sneha Reddy', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '7', name: 'Arjun Gupta', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '8', name: 'Nisha Verma', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '9', name: 'Dev Kapoor', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '10', name: 'Meera Singh', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '11', name: 'Vikram Bose', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '12', name: 'Kavya Joshi', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '13', name: 'Ishaan Malhotra', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '14', name: 'Ritika Das', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '15', name: 'Manav Arora', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '16', name: 'Pooja Kulkarni', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '17', name: 'Harsh Vardhan', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '18', name: 'Diya Sethi', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '19', name: 'Yash Chawla', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '20', name: 'Sana Mirza', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '21', name: 'Aditya Suri', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '22', name: 'Nandini Rao', grade: 'Class 11', avatar: '👧', enrolled: false },
  { id: '23', name: 'Krish Bansal', grade: 'Class 12', avatar: '👦', enrolled: false },
  { id: '24', name: 'Tanya Khanna', grade: 'Class 11', avatar: '👧', enrolled: false },
];

const FACULTY = [
  { id: 'f1', name: 'Dr. Robert Chen', subject: 'Physics HOD', exp: '15+ Yrs Exp', avatar: '👨‍🏫' },
  { id: 'f2', name: 'Prof. Sunita Rao', subject: 'Chemistry HOD', exp: '12+ Yrs Exp', avatar: '👩‍🏫' },
  { id: 'f3', name: 'Dr. Anil Kumar', subject: 'Mathematics', exp: '10+ Yrs Exp', avatar: '👨‍🏫' },
  { id: 'f4', name: 'Ms. Deepa Nair', subject: 'Biology HOD', exp: '8+ Yrs Exp', avatar: '👩‍🏫' },
  { id: 'f5', name: 'Dr. Pradeep Jain', subject: 'Physics', exp: '14+ Yrs Exp', avatar: '👨‍🏫' },
  { id: 'f6', name: 'Prof. Rekha Sharma', subject: 'Chemistry', exp: '11+ Yrs Exp', avatar: '👩‍🏫' },
  { id: 'f7', name: 'Dr. Alok Verma', subject: 'Mathematics HOD', exp: '16+ Yrs Exp', avatar: '👨‍🏫' },
  { id: 'f8', name: 'Ms. Neha Bhat', subject: 'English', exp: '9+ Yrs Exp', avatar: '👩‍🏫' },
  { id: 'f9', name: 'Prof. Ajay Tripathi', subject: 'Organic Chemistry', exp: '13+ Yrs Exp', avatar: '👨‍🏫' },
  { id: 'f10', name: 'Dr. Swati Pillai', subject: 'Botany', exp: '10+ Yrs Exp', avatar: '👩‍🏫' },
  { id: 'f11', name: 'Mr. Rahul Nanda', subject: 'Physical Chemistry', exp: '7+ Yrs Exp', avatar: '👨‍🏫' },
  { id: 'f12', name: 'Ms. Charu Anand', subject: 'Zoology', exp: '8+ Yrs Exp', avatar: '👩‍🏫' },
];

// ─── Student Selector Modal ───────────────────────────────────────────────────
const StudentModal = ({
  visible,
  onClose,
  onConfirm,
  initialSelectedIds = [],
  studentOptions = [],
  loading = false,
  instituteId = '',
}) => {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (visible) {
      setSelected(initialSelectedIds.map((id) => String(id)));
    }
  }, [visible, initialSelectedIds]);

  const toggle = (id) => {
    const normalizedId = String(id);
    setSelected(prev =>
      prev.includes(normalizedId) ? prev.filter(x => x !== normalizedId) : [...prev, normalizedId]
    );
  };

  const handleConfirm = () => {
    const selectedStudents = studentOptions.filter(s => selected.includes(String(s.id)));
    onConfirm(selectedStudents);
    setSelected([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.studentPageRoot}>
        <View style={[styles.studentPageContainer, isTablet && styles.studentPageContainerTablet]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Select Students</Text>
              <Text style={styles.modalSubtitle}>
                {selected.length} selected{instituteId ? ` • Institute: ${instituteId}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          <View style={styles.listContainer}>
            <Addstudent
              studentOptions={studentOptions}
              selectedIds={selected}
              onToggle={toggle}
              loading={loading}
              emptyText="No students found in database"
            />
          </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, selected.length === 0 && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={selected.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                Add {selected.length > 0 ? `(${selected.length})` : ''} Students
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Faculty Selector Modal ───────────────────────────────────────────────────
const FacultyModal = ({ visible, onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setSearch('');
    }
  }, [visible]);

  const filtered = FACULTY.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (faculty) => {
    onSelect(faculty);
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, isTablet && styles.modalContainerTablet]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Select Faculty</Text>
              <Text style={styles.modalSubtitle}>Choose a lead lecturer</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search faculty..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            style={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyListState}>
                <Text style={styles.emptyListText}>No faculty found</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.facultyRow}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.facultyAvatarWrap, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={styles.avatarEmoji}>{item.avatar}</Text>
                </View>
                <View style={styles.facultyInfo}>
                  <Text style={styles.facultyName}>{item.name}</Text>
                  <Text style={styles.facultySubject}>{item.subject} • {item.exp}</Text>
                </View>
                <View style={styles.selectChip}>
                  <Text style={styles.selectChipText}>Select</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

// ─── Create Batch Modal ───────────────────────────────────────────────────
const CreateBatchModal = ({ visible, onClose, onConfirm, editingBatch }) => {
  const [batchName, setBatchName] = useState(editingBatch?.name || '');
  const [description, setDescription] = useState(editingBatch?.description || '');
  const [capacity, setCapacity] = useState(editingBatch?.capacity || '60');
  const [startDate, setStartDate] = useState(editingBatch?.startDate || '06/15/2024');
  const [selectedSpec, setSelectedSpec] = useState(editingBatch?.type ? [editingBatch.type] : ['Regular']);
  const [slideAnim] = useState(new Animated.Value(600));

  useEffect(() => {
    if (!visible) return;

    setBatchName(editingBatch?.name || '');
    setDescription(editingBatch?.description || '');
    setCapacity(editingBatch?.capacity || '60');
    setStartDate(editingBatch?.startDate || '06/15/2024');
    setSelectedSpec(editingBatch?.type ? [editingBatch.type] : ['Regular']);
  }, [visible, editingBatch]);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]);

  const toggleSpec = (spec) => {
    setSelectedSpec([spec]);
  };

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = async () => {
    if (!batchName.trim()) {
      alert('Please enter a batch name');
      return;
    }

    const batchData = {
      id: editingBatch?.id || Date.now().toString(),
      name: batchName,
      description,
      capacity,
      startDate,
      type: selectedSpec[0],
      students: editingBatch?.students || [],
      faculty: editingBatch?.faculty || null,
    };

    const saved = await onConfirm(batchData);
    if (saved !== false) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setBatchName('');
    setDescription('');
    setCapacity('60');
    setStartDate('06/15/2024');
    setSelectedSpec(['Regular']);
  };

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.createBatchModalContainer,
            isTablet && styles.createBatchModalTablet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.createBatchModalHeader}>
            <Text style={styles.createBatchModalTitle}>
              {editingBatch ? 'Edit Batch' : 'Create New Batch'}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.createBatchScrollView} showsVerticalScrollIndicator={false}>
            {/* Batch Name */}
            <View style={styles.createBatchSection}>
              <Text style={styles.createBatchLabel}>Batch Name</Text>
              <TextInput
                style={styles.createBatchInput}
                placeholder="e.g. Excellence NEET 2024"
                placeholderTextColor="#9CA3AF"
                value={batchName}
                onChangeText={setBatchName}
              />
            </View>

            {/* Batch Type */}
            <View style={styles.createBatchSection}>
              <Text style={styles.createBatchLabel}>Batch Type</Text>
              <View style={styles.specChips}>
                {['Regular', 'Crash Course', 'Test Series', 'Workshop', 'Seminar'].map(spec => (
                  <TouchableOpacity
                    key={spec}
                    style={[styles.specChip, selectedSpec.includes(spec) && styles.specChipActive]}
                    onPress={() => toggleSpec(spec)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.specDot, selectedSpec.includes(spec) && styles.specDotActive]} />
                    <Text style={[styles.specChipText, selectedSpec.includes(spec) && styles.specChipTextActive]}>
                      {spec}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Capacity & Date */}
            <View style={styles.createBatchSection}>
              <View style={[styles.row, { gap: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.createBatchLabel}>Student Capacity</Text>
                  <TextInput
                    style={styles.createBatchInput}
                    value={capacity}
                    onChangeText={setCapacity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.createBatchLabel}>Start Date</Text>
                  <View style={styles.dateRow}>
                    <TextInput
                      style={[styles.createBatchInput, { flex: 1 }]}
                      value={startDate}
                      onChangeText={setStartDate}
                    />
                    <Text style={styles.calendarIcon}>📅</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Description */}
            <View style={styles.createBatchSection}>
              <Text style={styles.createBatchLabel}>Description</Text>
              <TextInput
                style={[styles.createBatchInput, styles.textArea]}
                placeholder="Define the primary goals and curriculum..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.createBatchModalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                {editingBatch ? 'Update Batch' : 'Create Batch'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

    </Modal>
  );
};

// ─── Batch Card Component ─────────────────────────────────────────────────
const BatchCard = ({ batch, onEdit, onDelete, onAddStudents }) => {
  return (
    <View style={styles.batchCard}>
      {/* Header */}
      <View style={styles.batchCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.batchCardTitle}>{batch.name}</Text>
          <Text style={styles.batchCardSubtitle}>{batch.type}</Text>
        </View>
        <View style={styles.batchCardActions}>
          <TouchableOpacity
            style={styles.batchActionBtn}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Text style={styles.batchActionBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.batchActionBtn, styles.batchActionBtnDelete]}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Text style={styles.batchActionBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Details Grid */}
      <View style={styles.batchCardDetails}>
        <View style={styles.batchDetailItem}>
          <Text style={styles.batchDetailLabel}>Faculty</Text>
          {batch.faculty ? (
            <View style={styles.batchDetailValue}>
              <Text style={styles.batchDetailIcon}>{batch.faculty.avatar}</Text>
              <Text style={styles.batchDetailText}>{batch.faculty.name}</Text>
            </View>
          ) : (
            <Text style={styles.batchDetailText}>Not assigned</Text>
          )}
        </View>

        <View style={styles.batchDetailItem}>
          <Text style={styles.batchDetailLabel}>Students</Text>
          <Text style={styles.batchDetailText}>{batch.students.length} enrolled</Text>
        </View>

        <View style={styles.batchDetailItem}>
          <Text style={styles.batchDetailLabel}>Capacity</Text>
          <Text style={styles.batchDetailText}>{batch.capacity}</Text>
        </View>

        <View style={styles.batchDetailItem}>
          <Text style={styles.batchDetailLabel}>Start Date</Text>
          <Text style={styles.batchDetailText}>{batch.startDate}</Text>
        </View>
      </View>

      {/* Description */}
      {batch.description ? (
        <Text style={styles.batchCardDescription}>{batch.description}</Text>
      ) : null}

      {/* Students List */}
      <View style={styles.batchStudentsList}>
        <Text style={styles.batchStudentsListTitle}>Students</Text>
        <TouchableOpacity style={styles.addStudentBtn} onPress={onAddStudents} activeOpacity={0.8}>
          <Text style={styles.addStudentBtnText}>+ Add Student</Text>
        </TouchableOpacity>
        <View style={styles.batchStudentsGrid}>
          {batch.students.slice(0, 6).map(student => (
            <View key={student.id} style={styles.batchStudentChip}>
              <Text style={styles.batchStudentChipText}>{student.name}</Text>
            </View>
          ))}
          {batch.students.length > 6 && (
            <View style={styles.batchStudentChip}>
              <Text style={styles.batchStudentChipText}>+{batch.students.length - 6}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Batchcreation({ navigation, instituteId, instituteName, adminEmail = '', adminName = '' }) {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [createBatchModalVisible, setCreateBatchModalVisible] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [activeBatchForStudents, setActiveBatchForStudents] = useState(null);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const resolvedInstituteId = (instituteId || '').trim();
  const resolvedInstituteName = (instituteName || '').trim();
  const resolvedAdminEmail = (adminEmail || '').trim().toLowerCase();
  const resolvedAdminName = (adminName || '').trim();

  const fetchBatches = async () => {
    if (!resolvedInstituteId) {
      setBatches([]);
      return;
    }

    try {
      setLoadingBatches(true);
      const { response } = await fetchWithBaseUrlFallback(
        `/api/batches?instituteId=${encodeURIComponent(resolvedInstituteId)}`
      );
      const payload = await response.json();

      if (!response.ok) {
        Alert.alert('Failed to load batches', payload?.message || 'Unable to fetch batches');
        return;
      }

      setBatches(Array.isArray(payload) ? payload.map(normalizeBatchFromApi) : []);
    } catch (error) {
      Alert.alert('Network error', 'Could not load batches from the backend.');
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [resolvedInstituteId]);

  const fetchStudents = async (overrideInstituteId) => {
    const instituteIdToUse = String(overrideInstituteId || resolvedInstituteId || '').trim();
    if (!instituteIdToUse) {
      setStudents([]);
      return;
    }

    try {
      setStudents([]);
      setLoadingStudents(true);
      const query = new URLSearchParams({
        instituteId: instituteIdToUse,
      });
      if (resolvedAdminEmail) {
        query.append('createdByEmail', resolvedAdminEmail);
      } else if (resolvedAdminName) {
        query.append('createdByAdminName', resolvedAdminName);
      }

      const { response } = await fetchWithBaseUrlFallback(
        `/api/students?${query.toString()}`
      );
      let payload = await response.json();

      if (!response.ok) {
        setStudents([]);
        Alert.alert('Unable to load students', payload?.message || 'Could not fetch students from database.');
        return;
      }

      // Fallback for legacy records that may not have createdBy metadata.
      if (Array.isArray(payload) && payload.length === 0 && (resolvedAdminEmail || resolvedAdminName)) {
        const { response: fallbackResponse } = await fetchWithBaseUrlFallback(
          `/api/students?instituteId=${encodeURIComponent(instituteIdToUse)}`
        );
        const fallbackPayload = await fallbackResponse.json();
        if (fallbackResponse.ok) {
          payload = fallbackPayload;
        }
      }

      const mapped = Array.isArray(payload)
        ? payload.map((student, index) => ({
            // Name comes from Student model field: fullName (via /api/students route)
            id: student?._id || student?.studentId || `s-${index}`,
            name: (student?.fullName || student?.name || '').trim() || 'Student',
            grade: student?.academicYear || '',
            avatar: '👤',
          }))
        : [];

      setStudents(mapped);
    } catch (error) {
      setStudents([]);
      Alert.alert('Network error', 'Could not fetch students from database.');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [resolvedInstituteId, resolvedAdminEmail, resolvedAdminName]);

  const handleCreateBatch = async (batchData) => {
    if (!resolvedInstituteId) {
      Alert.alert('Missing institute', 'Please sign in again so batches can be linked to your institute.');
      return false;
    }

    try {
      const payload = buildBatchPayload({
        batchData,
        instituteId: resolvedInstituteId,
        instituteName: resolvedInstituteName,
        students: batchData.students || editingBatch?.students || [],
        faculty: batchData.faculty || editingBatch?.faculty || null,
      });

      const { response } = await fetchWithBaseUrlFallback(
        editingBatch?.id
          ? `/api/batches/${editingBatch.id}`
          : '/api/batches',
        {
          method: editingBatch?.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const savedBatch = await response.json();
      if (!response.ok) {
        Alert.alert('Batch save failed', savedBatch?.message || 'Unable to save batch');
        return false;
      }

      await fetchBatches();
      setEditingBatch(null);
      return true;
    } catch (error) {
      Alert.alert('Network error', 'Could not save batch to the backend.');
      return false;
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setCreateBatchModalVisible(true);
  };

  const handleDeleteBatch = async (batchId) => {
    if (!resolvedInstituteId) return;

    try {
      const { response } = await fetchWithBaseUrlFallback(
        `/api/batches/${batchId}?instituteId=${encodeURIComponent(resolvedInstituteId)}`,
        { method: 'DELETE' }
      );
      const payload = await response.json();

      if (!response.ok) {
        Alert.alert('Delete failed', payload?.message || 'Unable to delete batch');
        return;
      }

      await fetchBatches();
    } catch (error) {
      Alert.alert('Network error', 'Could not delete batch from the backend.');
    }
  };

  const openCreateModal = () => {
    setEditingBatch(null);
    setCreateBatchModalVisible(true);
  };

  const handleOpenAddStudents = (batch) => {
    setActiveBatchForStudents(batch);
    setStudentModalVisible(true);
  };

  useEffect(() => {
    if (!studentModalVisible) {
      return;
    }

    const instituteIdFromBatch = String(activeBatchForStudents?.instituteId || '').trim();
    fetchStudents(instituteIdFromBatch || resolvedInstituteId);
  }, [studentModalVisible, activeBatchForStudents?.id, activeBatchForStudents?.instituteId, resolvedInstituteId]);

  const activeBatchId = String(activeBatchForStudents?.id || '');
  const activeBatchStudentIds = new Set(
    (activeBatchForStudents?.students || []).map((student) => String(student?.id || '')).filter(Boolean)
  );
  const enrolledInOtherBatchIds = new Set(
    batches
      .filter((batch) => String(batch?.id || '') !== activeBatchId)
      .flatMap((batch) => (batch?.students || []).map((student) => String(student?.id || '')))
      .filter(Boolean)
  );
  const availableStudentsForModal = students.filter((student) => {
    const id = String(student?.id || '').trim();
    if (!id) return false;
    if (activeBatchStudentIds.has(id)) return true;
    return !enrolledInOtherBatchIds.has(id);
  });

  const handleAddStudentsToBatch = async (selectedStudents) => {
    if (!activeBatchForStudents || !resolvedInstituteId) return;

    try {
      const { response } = await fetchWithBaseUrlFallback(`/api/batches/${activeBatchForStudents.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: resolvedInstituteId,
          instituteName: resolvedInstituteName,
          name: activeBatchForStudents.name,
          description: activeBatchForStudents.description,
          capacity: activeBatchForStudents.capacity,
          startDate: activeBatchForStudents.startDate,
          type: activeBatchForStudents.type,
          students: selectedStudents,
          faculty: activeBatchForStudents.faculty || {},
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        Alert.alert('Failed to update students', payload?.message || 'Unable to save batch students');
        return;
      }

      await fetchBatches();
      setStudentModalVisible(false);
      setActiveBatchForStudents(null);
    } catch (error) {
      Alert.alert('Network error', 'Could not update batch students.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />


      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
        showsVerticalScrollIndicator={false}
      >
        {/* Breadcrumb */}
        <Text style={styles.breadcrumb}>Admin › Batches › Management</Text>

       {/* Header Row (Title + Button) */}
<View style={styles.headerRow}>
  <View style={{ flex: 1 }}>
    <Text style={styles.pageTitle}>Manage Academic Batches</Text>
    
  </View>

  <TouchableOpacity
    style={styles.createNewBtnTop}
    onPress={openCreateModal}
    activeOpacity={0.8}
  >
    <Text style={styles.createNewBtnText}>+ Create New</Text>
  </TouchableOpacity>
</View>

        {/* Batches List */}
        {loadingBatches ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>⏳</Text>
            <Text style={styles.emptyStateTitle}>Loading batches...</Text>
            <Text style={styles.emptyStateText}>Fetching institute batches from MongoDB.</Text>
          </View>
        ) : batches.length > 0 ? (
          <View style={styles.batchesList}>
            {batches.map(batch => (
              <BatchCard
                key={batch.id}
                batch={batch}
                onEdit={() => handleEditBatch(batch)}
                onDelete={() => handleDeleteBatch(batch.id)}
                onAddStudents={() => handleOpenAddStudents(batch)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📚</Text>
            <Text style={styles.emptyStateTitle}>No Batches Created</Text>
            <Text style={styles.emptyStateText}>
              {resolvedInstituteId
                ? 'Create your first batch by clicking the "Create New" button above. It will be saved to MongoDB and shown here.'
                : 'No institute session found. Please log in again so batches can be loaded for the correct institute.'}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create/Edit Batch Modal */}
      <CreateBatchModal
        visible={createBatchModalVisible}
        onClose={() => {
          setCreateBatchModalVisible(false);
          setEditingBatch(null);
        }}
        onConfirm={handleCreateBatch}
        editingBatch={editingBatch}
      />

      <StudentModal
        visible={studentModalVisible}
        onClose={() => {
          setStudentModalVisible(false);
          setActiveBatchForStudents(null);
        }}
        instituteId={String(activeBatchForStudents?.instituteId || resolvedInstituteId || '').trim()}
        loading={loadingStudents}
        studentOptions={availableStudentsForModal}
        initialSelectedIds={activeBatchForStudents?.students?.map((student) => student.id) || []}
        onConfirm={handleAddStudentsToBatch}
      />
    </SafeAreaView>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // Nav
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  backArrow: { fontSize: 22, color: '#374151', paddingRight: 8 },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center' },
  createNewBtn: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createNewBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  scrollContentTablet: { padding: 24, maxWidth: 1100, alignSelf: 'center', width: '100%' },

  // Breadcrumb & Title
  breadcrumb: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  pageTitle: { fontSize: isTablet ? 28 : 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 20 },

  // Layout
  row: { flexDirection: isTablet ? 'row' : 'column', gap: 16, marginBottom: 16 },
  rowTablet: { flexDirection: 'row' },
  cardFlex1: { flex: 1 },
  cardFlex2: { flex: 2 },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: { fontSize: 64, marginBottom: 16 },
  emptyStateTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

  // Batches List
  batchesList: { gap: 16, marginBottom: 16 },

  // Batch Card
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  batchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  batchCardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  batchCardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  batchCardActions: { flexDirection: 'row', gap: 8 },
  batchActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchActionBtnDelete: { backgroundColor: '#FEE2E2' },
  batchActionBtnText: { fontSize: 16 },

  // Batch Card Details
  batchCardDetails: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  batchDetailItem: { flex: 1, minWidth: 120 },
  batchDetailLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 6, letterSpacing: 0.5 },
  batchDetailValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  batchDetailIcon: { fontSize: 14 },
  batchDetailText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  batchCardDescription: { fontSize: 13, color: '#4B5563', lineHeight: 18, marginBottom: 14 },

  // Batch Students
  batchStudentsList: { marginTop: 12 },
  batchStudentsListTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, letterSpacing: 0.5 },
  addStudentBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E3A5F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  addStudentBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  batchStudentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  batchStudentChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  batchStudentChipText: { fontSize: 12, color: '#1D4ED8', fontWeight: '500' },

  // Create Batch Modal
  createBatchModalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    flexDirection: 'column',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  createBatchModalTablet: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '90%',
    borderRadius: 20,
    marginBottom: 60,
    maxHeight: '85%',
  },
  createBatchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  createBatchModalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  createBatchScrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  createBatchSection: { marginBottom: 20 },
  createBatchLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, letterSpacing: 0.5 },
  createBatchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  createBatchModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cardGreen: { backgroundColor: '#F0FDF4' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardIconEmoji: { fontSize: 18 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  // Fields
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: { height: 90, paddingTop: 10 },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#F9FAFB',
  },
  dropdownBtnText: { fontSize: 14, color: '#374151' },
  dropdownArrow: { fontSize: 14, color: '#6B7280' },

  dateRow: { flexDirection: 'row', alignItems: 'center' },
  calendarIcon: { fontSize: 20, marginLeft: 8 },

  // Select Students
  selectStudentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1E3A5F',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  selectStudentsBtnIcon: { fontSize: 16 },
  selectStudentsBtnText: { fontSize: 14, fontWeight: '600', color: '#1E3A5F' },
  studentChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  studentChipText: { fontSize: 12, color: '#1D4ED8', fontWeight: '500' },

  // Specialization
  specSubtitle: { fontSize: 13, color: '#4B5563', marginBottom: 14 },
  specChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FFF',
    gap: 6,
  },
  specChipActive: { backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' },
  specDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' },
  specDotActive: { backgroundColor: '#10B981' },
  specChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  specChipTextActive: { color: '#FFF' },

  // Faculty
  facultySearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#F9FAFB',
    gap: 8,
    marginBottom: 12,
  },
  searchIcon2: { fontSize: 16 },
  facultySearchText: { fontSize: 14, color: '#9CA3AF' },
  selectedFacultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 10,
  },
  facultyAvatarWrapSm: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFacultyName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  selectedFacultyMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  changeBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  // Actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  cancelActionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelActionBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  createBatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createBatchBtnIcon: { fontSize: 16 },
  createBatchBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Notice
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  noticeIcon: { fontSize: 18, marginTop: 1 },
  noticeTitle: { fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginBottom: 4 },
  noticeText: { fontSize: 12, color: '#374151', lineHeight: 18 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  studentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  studentModalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  studentModalContainerTablet: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '90%',
  },
  studentPageRoot: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  studentPageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  studentPageContainerTablet: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  modalContainerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '90%',
    borderRadius: 20,
    marginBottom: 60,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 13, color: '#374151', fontWeight: '700' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },

  listContainer: { flex: 1, paddingHorizontal: 12 },
  emptyListState: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },

  studentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    margin: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  studentRowSelected: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  studentRowTablet: { flex: undefined, width: '47%' },
  studentName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  studentNameSelected: { color: '#1D4ED8' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' },
  checkmark: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  facultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginVertical: 4,
    marginHorizontal: 4,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  facultyAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facultyInfo: { flex: 1 },
  facultyName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  facultySubject: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  selectChip: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  selectChipText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#9CA3AF' },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  headerRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: 20,
  gap: 12,
},

createNewBtnTop: {
  backgroundColor: '#1E3A5F',
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 8,
  alignSelf: 'flex-start',
},
});
