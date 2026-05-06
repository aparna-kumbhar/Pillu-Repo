import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  SafeAreaView,
  Modal,
  Dimensions,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const toJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const parentService = {
  async getStoredProfile({ instituteId, parentId, parentPassword }) {
    try {
      const response = await fetchWithBaseUrlFallback('/api/parents/parent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instituteId, parentId, parentPassword }),
      });

      const payload = await toJsonSafe(response.response);
      if (!response.response.ok) {
        return { success: false, error: payload?.message || 'Failed to load parent profile' };
      }

      return { success: true, data: payload?.parent || payload || {} };
    } catch (error) {
      return { success: false, error: error?.message || 'Network error while loading parent profile' };
    }
  },

  async saveProfile(profilePayload) {
    try {
      const response = await fetchWithBaseUrlFallback('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload || {}),
      });

      const payload = await toJsonSafe(response.response);
      if (!response.response.ok) {
        return { success: false, error: payload?.message || 'Failed to save parent profile' };
      }

      return { success: true, data: payload?.parent || payload || {} };
    } catch (error) {
      return { success: false, error: error?.message || 'Network error while saving parent profile' };
    }
  },
};

const studentService = {
  async getByInstitute(instituteId) {
    try {
      const response = await fetchWithBaseUrlFallback(`/api/students?instituteId=${encodeURIComponent((instituteId || '').trim())}`);
      const payload = await toJsonSafe(response.response);
      if (!response.response.ok) {
        return { success: false, error: payload?.message || 'Failed to fetch students', data: [] };
      }

      return { success: true, data: Array.isArray(payload) ? payload : [] };
    } catch (error) {
      return { success: false, error: error?.message || 'Network error while fetching students', data: [] };
    }
  },
};

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// ─── Mock Data ────────────────────────────────────────────────
const initialProfile = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
};

const mapLinkedStudent = (student) => ({
  id: student?._id || student?.studentId || student?.fullName || String(Math.random()),
  name: student?.fullName || student?.studentName || 'Student',
  grade: student?.academicYear ? `Academic Year ${student.academicYear}` : 'Academic Year N/A',
  focus: 'Linked Student',
  avatar: null,
  dob: student?.dateOfBirth || 'N/A',
  rollNo: student?.studentId || 'N/A',
  attendance: 'N/A',
  gpa: 'N/A',
  teacher: 'N/A',
  subjects: Array.isArray(student?.subjects) ? student.subjects : [],
  recentGrades: Array.isArray(student?.recentGrades) ? student.recentGrades : [],
});

const studentsData = [
  {
    id: '1',
    name: 'Arjun Jenkins',
    grade: 'Grade 8',
    focus: 'Science & Technology Focus',
    avatar: null,
    dob: 'March 12, 2011',
    rollNo: 'AJ-2024-081',
    attendance: '94%',
    gpa: '3.8',
    teacher: 'Mr. Ramesh Iyer',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English'],
    recentGrades: [
      { subject: 'Mathematics', grade: 'A', score: '92/100' },
      { subject: 'Physics', grade: 'A-', score: '88/100' },
      { subject: 'Chemistry', grade: 'B+', score: '84/100' },
      { subject: 'Computer Science', grade: 'A+', score: '98/100' },
    ],
  },
  {
    id: '2',
    name: 'Maya Jenkins',
    grade: 'Grade 5',
    focus: 'Creative Arts & Literature',
    avatar: null,
    dob: 'July 5, 2014',
    rollNo: 'MJ-2024-052',
    attendance: '97%',
    gpa: '3.9',
    teacher: 'Ms. Priya Sharma',
    subjects: ['English Literature', 'Visual Arts', 'Music', 'History', 'Mathematics'],
    recentGrades: [
      { subject: 'English Literature', grade: 'A+', score: '99/100' },
      { subject: 'Visual Arts', grade: 'A+', score: '97/100' },
      { subject: 'Music', grade: 'A', score: '93/100' },
      { subject: 'History', grade: 'A-', score: '89/100' },
    ],
  },
];

// ─── Colours & Tokens ─────────────────────────────────────────
const C = {
  bg: '#F4F6FA',
  white: '#FFFFFF',
  primary: '#5B4EE8',
  primaryLight: '#EEF0FF',
  accent: '#7C6FF5',
  textDark: '#1A1A2E',
  textMid: '#555577',
  textLight: '#9999BB',
  border: '#E2E4F0',
  success: '#22C55E',
  danger: '#EF4444',
  cardShadow: {
    shadowColor: '#5B4EE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

// ─── Reusable Components ──────────────────────────────────────
const Avatar = ({ name, size = 44, style, imageUri }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: C.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: C.primary + '33',
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ color: C.primary, fontWeight: '700', fontSize: size * 0.35 }}>
          {initials}
        </Text>
      )}
    </View>
  );
};

const Card = ({ children, style }) => (
  <View style={[styles.card, C.cardShadow, style]}>{children}</View>
);

const SectionTitle = ({ icon, title }) => (
  <View style={styles.sectionTitle}>
    <View style={styles.sectionIconWrap}>
      <Text style={styles.sectionIcon}>{icon}</Text>
    </View>
    <Text style={styles.sectionTitleText}>{title}</Text>
  </View>
);

const FieldLabel = ({ label }) => <Text style={styles.fieldLabel}>{label}</Text>;
const FieldValue = ({ value }) => <Text style={styles.fieldValue}>{value}</Text>;

// ─── Student Detail Modal ─────────────────────────────────────
const StudentModal = ({ student, visible, onClose }) => {
  if (!student) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxWidth: isTablet ? 560 : '100%' }]}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalStudentName}>{student.name}</Text>
              <Text style={styles.modalStudentSub}>
                {student.grade} · {student.focus}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.statsRow}>
              {[
                { label: 'GPA', value: student.gpa },
                { label: 'Attendance', value: student.attendance },
                { label: 'Roll No', value: student.rollNo },
              ].map((s) => (
                <View key={s.label} style={styles.statBox}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            <Card style={{ marginTop: 16 }}>
              <Text style={styles.subHeading}>👤 Personal Details</Text>
              <View style={styles.infoRow}>
                <FieldLabel label="Date of Birth" />
                <FieldValue value={student.dob} />
              </View>
              <View style={styles.infoRow}>
                <FieldLabel label="Class Teacher" />
                <FieldValue value={student.teacher} />
              </View>
            </Card>
            <Card style={{ marginTop: 12 }}>
              <Text style={styles.subHeading}>📚 Enrolled Subjects</Text>
              <View style={styles.tagWrap}>
                {student.subjects.map((s) => (
                  <View key={s} style={styles.tag}>
                    <Text style={styles.tagText}>{s}</Text>
                  </View>
                ))}
              </View>
            </Card>
            <Card style={{ marginTop: 12, marginBottom: 24 }}>
              <Text style={styles.subHeading}>📊 Recent Grades</Text>
              {student.recentGrades.map((g) => (
                <View key={g.subject} style={styles.gradeRow}>
                  <Text style={styles.gradeSubject}>{g.subject}</Text>
                  <View style={styles.gradeBadgeWrap}>
                    <Text style={styles.gradeScore}>{g.score}</Text>
                    <View style={[styles.gradeBadge, { backgroundColor: gradeColor(g.grade) }]}>
                      <Text style={styles.gradeBadgeText}>{g.grade}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const gradeColor = (g) => {
  if (g.startsWith('A')) return '#D1FAE5';
  if (g.startsWith('B')) return '#FEF3C7';
  return '#FEE2E2';
};

// ─────────────────────────────────────────────────────────────
// FIX: EditForm is defined OUTSIDE Profile so its component
// identity never changes between renders. This prevents React
// from unmounting/remounting the TextInputs on every keystroke,
// which was causing the keyboard to dismiss on backspace.
// Props carry all the state it needs.
// ─────────────────────────────────────────────────────────────
const EditForm = ({ draft, onChangeField, onSave, onDiscard }) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
  >
    <View style={styles.editForm}>
      {[
        { key: 'fullName',  label: 'Full Name',            placeholder: 'Enter full name'   },
        { key: 'email',     label: 'Email Address',        placeholder: 'Enter email',       keyboard: 'email-address' },
        { key: 'phone',     label: 'Phone Number',         placeholder: 'Enter phone',       keyboard: 'phone-pad'     },
        { key: 'address',   label: 'Residential Address',  placeholder: 'Enter address',     multi: true               },
      ].map((f) => (
        <View key={f.key} style={styles.formField}>
          <FieldLabel label={f.label} />
          <TextInput
            style={[styles.input, f.multi && styles.inputMulti]}
            value={draft[f.key]}
            onChangeText={(v) => onChangeField(f.key, v)}
            placeholder={f.placeholder}
            placeholderTextColor={C.textLight}
            keyboardType={f.keyboard || 'default'}
            multiline={!!f.multi}
            numberOfLines={f.multi ? 3 : 1}
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      ))}
      <View style={styles.editActions}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={onSave}>
          <Text style={styles.saveBtnText}>💾 Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discardBtn} activeOpacity={0.8} onPress={onDiscard}>
          <Text style={styles.discardBtnText}>↩ Discard</Text>
        </TouchableOpacity>
      </View>
    </View>
  </KeyboardAvoidingView>
);

// ─────────────────────────────────────────────────────────────
// FIX: Sidebar is defined OUTSIDE Profile for the same reason —
// stable component identity means no unmount/remount on render.
// ─────────────────────────────────────────────────────────────
const Sidebar = ({ navItems, activeNav, onNavPress, onLogout }) => (
  <View style={[styles.sidebar, isTablet ? styles.sidebarDesktop : styles.sidebarMobile]}>
    <View style={styles.logoWrap}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>P</Text>
      </View>
      <View style={{ marginLeft: 8 }}>
        <Text style={styles.logoTitle}>PORTKL</Text>
        <Text style={styles.logoSub}>PARENT PORTAL</Text>
      </View>
    </View>
    <View style={styles.sidebarUser}>
      <Avatar name="Sarah Jenkins" size={40} />
      <View style={{ marginLeft: 10 }}>
        <Text style={styles.sidebarUserName}>Sarah Jenkins</Text>
        <Text style={styles.sidebarUserRole}>PREMIUM MEMBER</Text>
      </View>
    </View>
    <View style={styles.divider} />
    {navItems.map((item) => (
      <TouchableOpacity
        key={item.label}
        activeOpacity={0.7}
        style={[styles.navItem, activeNav === item.label && styles.navItemActive]}
        onPress={() => onNavPress(item.label)}
      >
        <Text style={styles.navIcon}>{item.icon}</Text>
        <Text style={[styles.navLabel, activeNav === item.label && styles.navLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    ))}
    <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={onLogout}>
      <Text style={styles.logoutIcon}>↪</Text>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────
export default function Profile({ parentUser }) {
  const [profile, setProfile]   = useState(initialProfile);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft]       = useState(initialProfile);
  const [profilePhotoUri, setProfilePhotoUri] = useState((parentUser?.parentPhoto || '').trim());
  const [activePassword, setActivePassword] = useState((parentUser?.parentPassword || '').trim());
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    whatsapp: true,
    email: true,
    fee: false,
  });

  const [selectedStudent, setSelectedStudent]     = useState(null);
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [isLoadingLinkedStudents, setIsLoadingLinkedStudents] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav]     = useState('Settings');

  useEffect(() => {
    setActivePassword((parentUser?.parentPassword || '').trim());
    setProfilePhotoUri((parentUser?.parentPhoto || '').trim());
  }, [parentUser?.parentPassword, parentUser?.parentPhoto]);

  useEffect(() => {
    const loadSavedProfile = async () => {
      const authPassword = (activePassword || parentUser?.parentPassword || '').trim();
      if (!parentUser?.parentId || !authPassword) {
        return;
      }

      const storedResult = await parentService.getStoredProfile({
        instituteId: parentUser?.instituteId || '',
        parentId: parentUser?.parentId,
        parentPassword: authPassword,
      });

      if (!storedResult.success) {
        return;
      }

      const stored = storedResult?.data?.parent || storedResult?.data || {};
      const restoredProfile = {
        fullName: stored.parentName || '',
        email: stored.parentEmail || '',
        phone: stored.parentPhoneNumber || '',
        address: stored.address || '',
      };

      setProfile(restoredProfile);
      setDraft(restoredProfile);
      setProfilePhotoUri((stored.parentPhoto || parentUser?.parentPhoto || '').trim());
    };

    loadSavedProfile();
  }, [activePassword, parentUser]);

  useEffect(() => {
    let isActive = true;

    const loadLinkedStudents = async () => {
      const instituteId = (parentUser?.instituteId || '').trim();
      const parentId = (parentUser?.parentId || '').trim();

      if (!instituteId || !parentId) {
        if (isActive) {
          setLinkedStudents([]);
        }
        return;
      }

      if (isActive) {
        setIsLoadingLinkedStudents(true);
      }

      const studentsResult = await studentService.getByInstitute(instituteId);

      if (!isActive) {
        return;
      }

      if (!studentsResult.success || !Array.isArray(studentsResult.data)) {
        setLinkedStudents([]);
        setIsLoadingLinkedStudents(false);
        return;
      }

      const normalizedParentId = parentId.toLowerCase();
      const matchedStudents = studentsResult.data
        .filter((student) => String(student?.parentId || '').trim().toLowerCase() === normalizedParentId)
        .map(mapLinkedStudent);

      setLinkedStudents(matchedStudents);
      setIsLoadingLinkedStudents(false);
    };

    loadLinkedStudents();

    return () => {
      isActive = false;
    };
  }, [parentUser?.instituteId, parentUser?.parentId]);

  // FIX (scroll-to-top): keep a stable ref so the ScrollView is
  // never recreated; pass it in as a prop instead of capturing it
  // via closure inside a nested component definition.
  const scrollViewRef = useRef(null);

  const navItems = [
    { icon: '⊞', label: 'Overview' },
    { icon: '🎓', label: 'Student Progress' },
    { icon: '📅', label: 'Attendance' },
    { icon: '🗓', label: 'Schedule' },
    { icon: '💳', label: 'Billing' },
    { icon: '⚙️', label: 'Settings' },
  ];

  const persistImageLocally = useCallback(async (sourceUri) => {
    const uri = (sourceUri || '').trim();
    if (!uri) {
      return '';
    }

    const extMatch = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const ext = extMatch?.[1] ? extMatch[1].toLowerCase() : 'jpg';
    const safeParentId = (parentUser?.parentId || 'parent').replace(/[^a-zA-Z0-9_-]/g, '_');
    const destination = `${FileSystem.documentDirectory}parent-photo-${safeParentId}.${ext}`;

    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        return uri;
      }

      await FileSystem.copyAsync({ from: uri, to: destination });
      return destination;
    } catch (error) {
      return uri;
    }
  }, [parentUser?.parentId]);

  const savePhotoOnly = useCallback(async (nextPhotoUri) => {
    const authPassword = (activePassword || parentUser?.parentPassword || '').trim();
    if (!parentUser?.instituteId || !parentUser?.parentId || !authPassword) {
      return false;
    }

    const saveResult = await parentService.saveProfile({
      parentRecordId: parentUser?._id || '',
      instituteId: parentUser?.instituteId,
      parentId: parentUser?.parentId,
      parentPassword: authPassword,
      parentName: profile.fullName,
      parentEmail: profile.email,
      parentPhoneNumber: profile.phone,
      address: profile.address,
      parentPhoto: nextPhotoUri,
      studentId: parentUser?.studentId || '',
      studentName: parentUser?.studentName || parentUser?.parentId || '',
      academicYear: parentUser?.academicYear || '',
      dateOfBirth: parentUser?.dateOfBirth || '',
    });

    return Boolean(saveResult?.success);
  }, [activePassword, parentUser, profile]);

  const handleSave = useCallback(async () => {
    const authPassword = (activePassword || parentUser?.parentPassword || '').trim();
    if (!parentUser?.instituteId || !parentUser?.parentId || !authPassword) {
      Alert.alert('Profile save unavailable', 'Please login with parent ID and parent password to save profile in database.');
      return;
    }

    const saveResult = await parentService.saveProfile({
      parentRecordId: parentUser?._id || '',
      instituteId: parentUser?.instituteId,
      parentId: parentUser?.parentId,
      parentPassword: authPassword,
      parentName: draft.fullName,
      parentEmail: draft.email,
      parentPhoneNumber: draft.phone,
      address: draft.address,
      studentId: parentUser?.studentId || '',
      studentName: parentUser?.studentName || parentUser?.parentId || '',
      academicYear: parentUser?.academicYear || '',
      dateOfBirth: parentUser?.dateOfBirth || '',
      parentPhoto: profilePhotoUri,
    });

    if (!saveResult.success) {
      Alert.alert('Save failed', saveResult.error || 'Unable to save profile to database.');
      return;
    }

    const saved = saveResult.data || {};
    const savedProfile = {
      fullName: saved.parentName || draft.fullName,
      email: saved.parentEmail || draft.email,
      phone: saved.parentPhoneNumber || draft.phone,
      address: saved.address || draft.address,
    };

    setProfile(savedProfile);
    setDraft(savedProfile);
    setProfilePhotoUri((saved.parentPhoto || profilePhotoUri || '').trim());
    setEditMode(false);
    Alert.alert('Saved', 'Your profile has been updated in the database.');
  }, [activePassword, draft, parentUser, profilePhotoUri]);

  const handlePickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to choose a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const localUri = await persistImageLocally(result.assets[0].uri || '');
      setProfilePhotoUri(localUri);
      const didSave = await savePhotoOnly(localUri);
      if (!didSave) {
        Alert.alert('Photo saved locally', 'Unable to sync photo to database now. Please tap Save Changes to sync when connected.');
      }
    }
  }, [persistImageLocally, savePhotoOnly]);

  const handlePickFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to capture a profile photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const localUri = await persistImageLocally(result.assets[0].uri || '');
      setProfilePhotoUri(localUri);
      const didSave = await savePhotoOnly(localUri);
      if (!didSave) {
        Alert.alert('Photo saved locally', 'Unable to sync photo to database now. Please tap Save Changes to sync when connected.');
      }
    }
  }, [persistImageLocally, savePhotoOnly]);

  const handleChangePhoto = useCallback(() => {
    Alert.alert('Change Profile Photo', 'Choose a photo source', [
      { text: 'Gallery / Photos', onPress: handlePickFromGallery },
      { text: 'Camera', onPress: handlePickFromCamera },
      {
        text: 'Remove Photo',
        style: 'destructive',
        onPress: async () => {
          setProfilePhotoUri('');
          await savePhotoOnly('');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handlePickFromCamera, handlePickFromGallery, savePhotoOnly]);

  const openPasswordModal = useCallback(() => {
    setPasswordDraft({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordModalVisible(true);
  }, []);

  const closePasswordModal = useCallback(() => {
    if (isUpdatingPassword) return;
    setPasswordModalVisible(false);
    setPasswordDraft({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }, [isUpdatingPassword]);

  const handlePasswordField = useCallback((key, value) => {
    setPasswordDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePasswordReset = useCallback(async () => {
    const authPassword = (activePassword || parentUser?.parentPassword || '').trim();
    const currentPassword = (passwordDraft.currentPassword || '').trim();
    const newPassword = (passwordDraft.newPassword || '').trim();
    const confirmPassword = (passwordDraft.confirmPassword || '').trim();

    if (!parentUser?.instituteId || !parentUser?.parentId || !authPassword) {
      Alert.alert('Reset unavailable', 'Please login again before resetting your password.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill current, new and confirm password fields.');
      return;
    }

    if (currentPassword !== authPassword) {
      Alert.alert('Current password incorrect', 'Please enter your current password correctly.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'New password and confirm password must match.');
      return;
    }

    setIsUpdatingPassword(true);
    const saveResult = await parentService.saveProfile({
      parentRecordId: parentUser?._id || '',
      instituteId: parentUser?.instituteId,
      parentId: parentUser?.parentId,
      parentPassword: newPassword,
      parentName: profile.fullName,
      parentEmail: profile.email,
      parentPhoneNumber: profile.phone,
      address: profile.address,
      studentId: parentUser?.studentId || '',
      studentName: parentUser?.studentName || parentUser?.parentId || '',
      academicYear: parentUser?.academicYear || '',
      dateOfBirth: parentUser?.dateOfBirth || '',
    });
    setIsUpdatingPassword(false);

    if (!saveResult.success) {
      Alert.alert('Reset failed', saveResult.error || 'Unable to update password in database.');
      return;
    }

    setActivePassword(newPassword);
    setPasswordModalVisible(false);
    setPasswordDraft({ currentPassword: '', newPassword: '', confirmPassword: '' });
    Alert.alert('Password updated', 'Your password is updated and saved to the database. Use the new password at next login.');
  }, [activePassword, parentUser, passwordDraft, profile]);

  const handleDiscard = useCallback(() => {
    setDraft({ ...profile });
    setEditMode(false);
  }, [profile]);

  const openStudent = useCallback((student) => {
    setSelectedStudent(student);
    setStudentModalVisible(true);
  }, []);

  // Stable updater — uses functional setState so the callback
  // reference never has to change, satisfying useCallback deps.
  const handleDraftChange = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleNavPress = useCallback((label) => {
    setActiveNav(label);
    if (!isTablet) setSidebarOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive' },
    ]);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={styles.layout}>

        {/* ── Sidebar ── */}
        {isTablet ? (
          <Sidebar
            navItems={navItems}
            activeNav={activeNav}
            onNavPress={handleNavPress}
            onLogout={handleLogout}
          />
        ) : (
          <Modal visible={sidebarOpen} transparent animationType="slide">
            <View style={styles.sidebarOverlay}>
              <Sidebar
                navItems={navItems}
                activeNav={activeNav}
                onNavPress={handleNavPress}
                onLogout={handleLogout}
              />
              <TouchableOpacity
                style={styles.sidebarDismiss}
                onPress={() => setSidebarOpen(false)}
                activeOpacity={1}
              />
            </View>
          </Modal>
        )}

        {/* ── Main scroll area ──
            keyboardShouldPersistTaps="handled"  → tapping a button while
              the keyboard is open does NOT dismiss the keyboard first; the
              tap is delivered straight to the button (fixes scroll-to-top).
            keyboardDismissMode="none"           → dragging the list never
              dismisses the keyboard unexpectedly.                          */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          {/* Header */}
          <View style={styles.pageHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Profile Settings</Text>
              <Text style={styles.pageSubtitle}>
                Manage your personal information, notification preferences, and student links.
              </Text>
            </View>
            <View style={styles.headerIcons} />
          </View>

          <View style={[styles.mainGrid, isTablet && styles.mainGridTablet]}>

            {/* ── LEFT COLUMN ── */}
            <View style={styles.leftCol}>

              {/* Personal Information */}
              <Card>
                <View style={styles.cardTopRow}>
                  <SectionTitle icon="👤" title="Personal Information" />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      if (editMode) {
                        handleDiscard();
                      } else {
                        setDraft({ ...profile });
                        setEditMode(true);
                      }
                    }}
                    style={styles.editToggleBtn}
                  >
                    <Text style={styles.editToggleText}>
                      {editMode ? '✕ Cancel' : '✏️ Edit Info'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.profilePhotoRow}>
                  <Avatar
                    name={editMode ? draft.fullName || profile.fullName : profile.fullName}
                    size={72}
                    style={styles.profilePhotoAvatar}
                    imageUri={profilePhotoUri}
                  />
                  <View style={styles.profilePhotoMeta}>
                    <FieldLabel label="PROFILE PHOTO" />
                    <Text style={styles.profilePhotoHint}>
                      Keep your account photo updated for easier identification.
                    </Text>
                    <TouchableOpacity
                      style={styles.photoActionBtn}
                      activeOpacity={0.8}
                      onPress={handleChangePhoto}
                    >
                      <Text style={styles.photoActionText}>Change Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {editMode ? (
                  // FIX: render the hoisted <EditForm> component; because it
                  // lives outside Profile its type is stable — React reuses
                  // the existing node instead of unmounting it, so TextInput
                  // focus (and the keyboard) is never lost between keystrokes.
                  <EditForm
                    draft={draft}
                    onChangeField={handleDraftChange}
                    onSave={handleSave}
                    onDiscard={handleDiscard}
                  />
                ) : (
                  <View style={styles.infoGrid}>
                    {[
                      { label: 'FULL NAME',            value: profile.fullName },
                      { label: 'EMAIL ADDRESS',         value: profile.email   },
                      { label: 'PHONE NUMBER',          value: profile.phone   },
                      { label: 'RESIDENTIAL ADDRESS',   value: profile.address },
                    ].map((f) => (
                      <View
                        key={f.label}
                        style={[styles.infoCell, isTablet && styles.infoCellHalf]}
                      >
                        <FieldLabel label={f.label} />
                        <FieldValue value={f.value} />
                      </View>
                    ))}
                  </View>
                )}
              </Card>

              {/* Linked Students */}
              <Card style={{ marginTop: 20 }}>
                <Text style={styles.linkedTitle}>Linked Students</Text>
                <View style={[styles.studentsGrid, isTablet && styles.studentsGridTablet]}>
                  {isLoadingLinkedStudents ? (
                    <Text style={styles.studentMeta}>Loading linked students...</Text>
                  ) : linkedStudents.length ? (
                    linkedStudents.map((student) => (
                      <View key={student.id} style={styles.studentCard}>
                        <View style={styles.studentBanner}>
                          <Avatar name={student.name} size={56} />
                        </View>
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{student.name}</Text>
                          <Text style={styles.studentMeta}>
                            {student.grade} · {student.focus}
                          </Text>
                          <TouchableOpacity
                            style={styles.viewBtn}
                            activeOpacity={0.8}
                            onPress={() => openStudent(student)}
                          >
                            <Text style={styles.viewBtnText}>View Student Information</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.studentMeta}>No linked students found for this parent.</Text>
                  )}
                </View>
              </Card>

              {/* Security */}
              <Card style={{ marginTop: 20 }}>
                <SectionTitle icon="🛡" title="Security" />
                <View style={styles.securityRow}>
                  <View>
                    <Text style={styles.secTitle}>Account Password</Text>
                    <Text style={styles.secSub}>Update your login password securely</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.resetBtn}
                    activeOpacity={0.8}
                    onPress={openPasswordModal}
                  >
                    <Text style={styles.resetBtnText}>Reset Password</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>

            {/* ── RIGHT COLUMN ── */}
            <View style={styles.rightCol}>

              {/* Notification Settings */}
              <Card>
                <Text style={styles.notifTitle}>Notification Settings</Text>
                {[
                  { key: 'whatsapp', icon: '💬', title: 'WhatsApp Voice Updates', sub: 'Daily summary audio',      color: '#25D366'   },
                  { key: 'email',    icon: '✉️', title: 'Email Progress Alerts',  sub: 'Weekly detailed reports', color: C.primary   },
                  { key: 'fee',      icon: '🧾', title: 'Fee Reminders',           sub: 'Billing & due date alerts', color: '#F59E0B' },
                ].map((n) => (
                  <View key={n.key} style={styles.notifRow}>
                    <View style={[styles.notifIconWrap, { backgroundColor: n.color + '20' }]}>
                      <Text style={styles.notifIcon}>{n.icon}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.notifItemTitle}>{n.title}</Text>
                      <Text style={styles.notifItemSub}>{n.sub}</Text>
                    </View>
                    <Switch
                      value={notifications[n.key]}
                      onValueChange={(v) =>
                        setNotifications((prev) => ({ ...prev, [n.key]: v }))
                      }
                      trackColor={{ false: C.border, true: C.primary + '88' }}
                      thumbColor={notifications[n.key] ? C.primary : '#ccc'}
                      ios_backgroundColor={C.border}
                    />
                  </View>
                ))}
              </Card>

              {/* Need Assistance */}
              <View style={styles.assistCard}>
                <View style={styles.assistIconWrap}>
                  <Text style={styles.assistIcon}>❓</Text>
                </View>
                <Text style={styles.assistTitle}>Need Assistance?</Text>
                <Text style={styles.assistBody}>
                  Our support team is available 24/7 to help you with portal navigation or student records.
                </Text>
                <TouchableOpacity
                  style={styles.assistBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    Alert.alert(
                      'Contact Support',
                      'Opening support chat...\n\nEmail: support@portkl.com\nHours: 24/7'
                    )
                  }
                >
                  <Text style={styles.assistBtnText}>Contact Support</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <StudentModal
        student={selectedStudent}
        visible={studentModalVisible}
        onClose={() => setStudentModalVisible(false)}
      />

      <Modal visible={passwordModalVisible} transparent animationType="fade" onRequestClose={closePasswordModal}>
        <View style={styles.passwordModalOverlay}>
          <View style={styles.passwordModalCard}>
            <Text style={styles.passwordModalTitle}>Reset Account Password</Text>
            <Text style={styles.passwordModalSub}>This update is saved in the database and used for your next login.</Text>

            <View style={styles.formField}>
              <FieldLabel label="CURRENT PASSWORD" />
              <TextInput
                style={styles.input}
                value={passwordDraft.currentPassword}
                onChangeText={(value) => handlePasswordField('currentPassword', value)}
                placeholder="Enter current password"
                placeholderTextColor={C.textLight}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.formField}>
              <FieldLabel label="NEW PASSWORD" />
              <TextInput
                style={styles.input}
                value={passwordDraft.newPassword}
                onChangeText={(value) => handlePasswordField('newPassword', value)}
                placeholder="Enter new password"
                placeholderTextColor={C.textLight}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.formField}>
              <FieldLabel label="CONFIRM NEW PASSWORD" />
              <TextInput
                style={styles.input}
                value={passwordDraft.confirmPassword}
                onChangeText={(value) => handlePasswordField('confirmPassword', value)}
                placeholder="Re-enter new password"
                placeholderTextColor={C.textLight}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.passwordActions}>
              <TouchableOpacity
                style={[styles.resetBtn, styles.passwordActionBtn]}
                activeOpacity={0.8}
                onPress={closePasswordModal}
                disabled={isUpdatingPassword}
              >
                <Text style={styles.resetBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, styles.passwordActionBtn]}
                activeOpacity={0.8}
                onPress={handlePasswordReset}
                disabled={isUpdatingPassword}
              >
                <Text style={styles.saveBtnText}>{isUpdatingPassword ? 'Updating...' : 'Update Password'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles (unchanged) ───────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  layout: { flex: 1, flexDirection: 'row' },

  sidebar: {
    backgroundColor: C.white,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  sidebarDesktop: { width: 230 },
  sidebarMobile:  { width: 240, flex: 1 },
  sidebarOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)' },
  sidebarDismiss: { flex: 1 },

  logoWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoBox: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  logoText:  { color: C.white, fontSize: 20, fontWeight: '900' },
  logoTitle: { color: C.textDark, fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  logoSub:   { color: C.textLight, fontSize: 9, letterSpacing: 1.5, marginTop: 1 },

  sidebarUser:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sidebarUserName: { color: C.textDark, fontWeight: '700', fontSize: 13 },
  sidebarUserRole: { color: C.primary, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  navItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 2,
  },
  navItemActive:  { backgroundColor: C.primaryLight },
  navIcon:        { fontSize: 17, width: 24 },
  navLabel:       { color: C.textMid, fontWeight: '500', fontSize: 13, marginLeft: 10 },
  navLabelActive: { color: C.primary, fontWeight: '700' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 'auto', paddingTop: 20, paddingHorizontal: 12,
  },
  logoutIcon: { fontSize: 16, color: C.danger },
  logoutText: { color: C.danger, fontWeight: '600', fontSize: 13, marginLeft: 8 },

  content: { flex: 1, backgroundColor: C.bg },

  pageHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16,
    backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  pageTitle:    { fontSize: isTablet ? 26 : 22, fontWeight: '800', color: C.textDark },
  pageSubtitle: { color: C.textMid, fontSize: 13, marginTop: 3, lineHeight: 18 },
  headerIcons:  { flexDirection: 'row', marginLeft: 8 },

  mainGrid:       { padding: 16 },
  mainGridTablet: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  leftCol:        { flex: isTablet ? 2 : 1 },
  rightCol:       { flex: isTablet ? 1 : 1, marginTop: isTablet ? 0 : 16 },

  card: {
    backgroundColor: C.white, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: C.border,
  },

  sectionTitle:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  sectionIcon:      { fontSize: 16 },
  sectionTitleText: { fontSize: 16, fontWeight: '700', color: C.textDark },

  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  editToggleBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primary + '44',
  },
  editToggleText: { color: C.primary, fontWeight: '700', fontSize: 13 },

  profilePhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  profilePhotoAvatar: {
    borderColor: C.primary + '44',
  },
  profilePhotoMeta: {
    flex: 1,
    marginLeft: 12,
  },
  profilePhotoHint: {
    color: C.textMid,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  photoActionBtn: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.primaryLight,
    borderWidth: 1,
    borderColor: C.primary + '44',
  },
  photoActionText: {
    color: C.primary,
    fontWeight: '700',
    fontSize: 12,
  },

  infoGrid:    { flexDirection: 'row', flexWrap: 'wrap' },
  infoCell:    { width: '100%', marginBottom: 14 },
  infoCellHalf:{ width: '50%', paddingRight: 12 },
  fieldLabel:  { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 1, marginBottom: 4 },
  fieldValue:  { fontSize: 14, fontWeight: '600', color: C.textDark },

  editForm:   { marginTop: 4 },
  formField:  { marginBottom: 14 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: C.textDark, backgroundColor: C.bg,
  },
  inputMulti:  { height: 80, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  saveBtn: {
    flex: 1, backgroundColor: C.primary,
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
  discardBtn: {
    flex: 1, backgroundColor: C.bg, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border,
  },
  discardBtnText: { color: C.textMid, fontWeight: '600', fontSize: 14 },

  linkedTitle:        { fontSize: 16, fontWeight: '700', color: C.textDark, marginBottom: 14 },
  studentsGrid:       { gap: 12 },
  studentsGridTablet: { flexDirection: 'row' },
  studentCard: {
    flex: 1, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
  },
  studentBanner: {
    height: 80, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  studentInfo: { padding: 14 },
  studentName: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 4 },
  studentMeta: { fontSize: 12, color: C.textMid, marginBottom: 12 },
  viewBtn: {
    borderRadius: 8, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.primary, backgroundColor: C.primaryLight,
  },
  viewBtnText: { color: C.primary, fontWeight: '700', fontSize: 12 },

  securityRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 4,
  },
  secTitle: { fontSize: 14, fontWeight: '700', color: C.textDark },
  secSub:   { fontSize: 12, color: C.textMid, marginTop: 2 },
  resetBtn: {
    borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  resetBtnText: { color: C.textDark, fontWeight: '600', fontSize: 13 },

  passwordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  passwordModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  passwordModalTitle: { fontSize: 18, fontWeight: '800', color: C.textDark },
  passwordModalSub: { fontSize: 12, color: C.textMid, marginTop: 4, marginBottom: 14, lineHeight: 17 },
  passwordActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  passwordActionBtn: { flex: 1 },

  notifTitle: { fontSize: 16, fontWeight: '700', color: C.textDark, marginBottom: 14 },
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  notifIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  notifIcon:      { fontSize: 17 },
  notifItemTitle: { fontSize: 13, fontWeight: '700', color: C.textDark },
  notifItemSub:   { fontSize: 11, color: C.textMid, marginTop: 2 },

  assistCard: {
    marginTop: 16, borderRadius: 16, padding: 20,
    backgroundColor: C.primary, alignItems: 'flex-start',
  },
  assistIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  assistIcon:  { fontSize: 20 },
  assistTitle: { fontSize: 18, fontWeight: '800', color: C.white, marginBottom: 8 },
  assistBody:  { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19, marginBottom: 16 },
  assistBtn: {
    width: '100%', backgroundColor: C.white,
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  assistBtnText: { color: C.primary, fontWeight: '700', fontSize: 14 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end', alignItems: 'center',
  },
  modalSheet: {
    width: '100%', backgroundColor: C.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', padding: 20,
  },
  modalHeader:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  modalStudentName: { fontSize: 20, fontWeight: '800', color: C.textDark },
  modalStudentSub:  { fontSize: 13, color: C.textMid, marginTop: 3 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: C.textMid, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, backgroundColor: C.primaryLight,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: C.primary },
  statLabel: { fontSize: 11, color: C.textMid, marginTop: 3, fontWeight: '600' },

  subHeading: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 12 },
  infoRow:    { marginBottom: 10 },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: C.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  tagText: { color: C.primary, fontSize: 12, fontWeight: '600' },

  gradeRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  gradeSubject:    { fontSize: 13, color: C.textDark, fontWeight: '500', flex: 1 },
  gradeBadgeWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradeScore:      { fontSize: 12, color: C.textMid },
  gradeBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  gradeBadgeText:  { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
});