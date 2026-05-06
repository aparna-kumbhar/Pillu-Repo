import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, FlatList, Alert, Platform,
  Dimensions, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;
const PAGE_SIZE = 4;

// ─── DATA ────────────────────────────────────────────────────────────────────

const INITIAL_TEACHERS = [
  { id: 'TEA-401', name: 'Dr. Robert Jenkins', role: 'Full-time Faculty', batch: 'Morning A-1', subject: 'Advanced Calculus', status: 'Present', initials: 'RJ', color: '#6366F1' },
  { id: 'TEA-412', name: 'Sarah Ahmed', role: 'Visiting Faculty', batch: 'Evening B-3', subject: 'Quantum Physics', status: 'Absent', initials: 'SA', color: '#8B5CF6' },
  { id: 'TEA-388', name: 'Michael Chen', role: 'Full-time Faculty', batch: 'Morning A-1', subject: 'Organic Chemistry', status: 'Late', initials: 'MC', color: '#F59E0B' },
  { id: 'TEA-425', name: 'Elena Watson', role: 'Associate Professor', batch: 'Evening B-3', subject: 'Computer Science', status: 'Leave', initials: 'EW', color: '#10B981' },
  { id: 'TEA-310', name: 'Prof. Arjun Nair', role: 'Full-time Faculty', batch: 'Morning A-2', subject: 'Linear Algebra', status: 'Present', initials: 'AN', color: '#3B82F6' },
  { id: 'TEA-330', name: 'Dr. Priya Kapoor', role: 'Visiting Faculty', batch: 'Evening B-1', subject: 'Biochemistry', status: 'Present', initials: 'PK', color: '#EC4899' },
  { id: 'TEA-355', name: 'James Miller', role: 'Full-time Faculty', batch: 'Morning A-3', subject: 'Thermodynamics', status: 'Absent', initials: 'JM', color: '#EF4444' },
  { id: 'TEA-372', name: 'Dr. Ananya Rao', role: 'Associate Professor', batch: 'Evening B-2', subject: 'Data Structures', status: 'Present', initials: 'AR', color: '#14B8A6' },
  { id: 'TEA-390', name: 'Kevin Patel', role: 'Visiting Faculty', batch: 'Morning A-1', subject: 'Calculus II', status: 'Late', initials: 'KP', color: '#F97316' },
  { id: 'TEA-400', name: 'Dr. Susan Lee', role: 'Full-time Faculty', batch: 'Evening B-3', subject: 'Genetics', status: 'Present', initials: 'SL', color: '#06B6D4' },
  { id: 'TEA-415', name: 'Rahul Sharma', role: 'Full-time Faculty', batch: 'Morning A-2', subject: 'Statistics', status: 'Present', initials: 'RS', color: '#84CC16' },
  { id: 'TEA-432', name: 'Dr. Emily Clark', role: 'Associate Professor', batch: 'Evening B-1', subject: 'Microbiology', status: 'Leave', initials: 'EC', color: '#A855F7' },
];

// Pad to 42 teachers
const ALL_TEACHERS = Array.from({ length: 42 }, (_, i) => {
  if (i < INITIAL_TEACHERS.length) return INITIAL_TEACHERS[i];
  return {
    id: `TEA-${500 + i}`,
    name: `Faculty Member ${i + 1}`,
    role: i % 3 === 0 ? 'Visiting Faculty' : 'Full-time Faculty',
    batch: i % 2 === 0 ? 'Morning A-1' : 'Evening B-3',
    subject: 'General Studies',
    status: 'Present',
    initials: `F${i + 1}`,
    color: '#6B7280',
  };
});

const STATUS_CONFIG = {
  Present: { bg: '#F0FDF4', border: '#16A34A', text: '#15803D', activeBg: '#16A34A', activeText: '#fff' },
  Absent: { bg: '#FEF2F2', border: '#DC2626', text: '#B91C1C', activeBg: '#DC2626', activeText: '#fff' },
  Late: { bg: '#FFFBEB', border: '#D97706', text: '#B45309', activeBg: '#F59E0B', activeText: '#fff' },
  Leave: { bg: '#F0F9FF', border: '#0284C7', text: '#0369A1', activeBg: '#0284C7', activeText: '#fff' },
};

const ATTENDANCE_STATUS_ORDER = ['Present', 'Absent', 'Late', 'Leave'];
const ROSTER_COLORS = ['#6366F1', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#EF4444', '#14B8A6'];

const requestJson = async (path, options = {}) => {
  const { response } = await fetchWithBaseUrlFallback(path, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }

  return payload;
};

const formatAttendanceDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'T';
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'T';
};

const normalizeStatus = (status = 'Present') => {
  const value = String(status || '').trim().toLowerCase();
  const found = ATTENDANCE_STATUS_ORDER.find((item) => item.toLowerCase() === value);
  return found || 'Present';
};

const mapTeacherToRoster = (teacher, index) => ({
  id: teacher?._id || teacher?.teacherId || `teacher-${index}`,
  name: teacher?.fullName || 'Teacher',
  role: teacher?.qualification || teacher?.departmentName || 'Faculty',
  batch: teacher?.departmentName || '-',
  subject: teacher?.qualification || teacher?.departmentName || '-',
  status: 'Present',
  initials: getInitials(teacher?.fullName || teacher?.teacherId || 'Teacher'),
  color: teacher?.color || ROSTER_COLORS[index % ROSTER_COLORS.length],
});

async function apiFetchTeachers(instituteId, adminInfo = {}) {
  const query = new URLSearchParams({
    instituteId: String(instituteId || '').trim(),
  });

  if (adminInfo?.email) {
    query.set('createdByEmail', String(adminInfo.email).trim());
  }

  if (adminInfo?.adminName) {
    query.set('createdByAdminName', String(adminInfo.adminName).trim());
  }

  return requestJson(`/api/teachers?${query.toString()}`);
}

async function apiFetchTeacherAttendance(instituteId, attendanceDate) {
  return requestJson(`/api/teacher-attendance?instituteId=${encodeURIComponent(instituteId)}&attendanceDate=${encodeURIComponent(attendanceDate)}`);
}

async function apiSaveTeacherAttendance(payload) {
  return requestJson('/api/teacher-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ─── DATE PICKER MODAL ───────────────────────────────────────────────────────

function DatePickerModal({ visible, date, onConfirm, onDismiss }) {
  const [year, setYear] = useState(date.getFullYear());
  const [month, setMonth] = useState(date.getMonth());
  const [day, setDay] = useState(date.getDate());

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <TouchableOpacity style={dpStyles.overlay} activeOpacity={1} onPress={onDismiss}>
        <TouchableOpacity activeOpacity={1} style={dpStyles.card}>
          {/* Month / Year Nav */}
          <View style={dpStyles.header}>
            <TouchableOpacity onPress={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }} style={dpStyles.navBtn}>
              <Text style={dpStyles.navTxt}>‹</Text>
            </TouchableOpacity>
            <Text style={dpStyles.monthYear}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }} style={dpStyles.navBtn}>
              <Text style={dpStyles.navTxt}>›</Text>
            </TouchableOpacity>
          </View>
          {/* Day labels */}
          <View style={dpStyles.dayRow}>
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
              <Text key={d} style={dpStyles.dayLabel}>{d}</Text>
            ))}
          </View>
          {/* Cells */}
          <View style={dpStyles.grid}>
            {cells.map((d, i) => {
              if (!d) return <View key={i} style={dpStyles.emptyCell} />;
              const isSelected = d === day && month === date.getMonth() && year === date.getFullYear();
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <TouchableOpacity
                  key={i}
                  style={[dpStyles.cell, isSelected && dpStyles.cellSelected, isToday && !isSelected && dpStyles.cellToday]}
                  onPress={() => setDay(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[dpStyles.cellText, isSelected && dpStyles.cellTextSelected, isToday && !isSelected && dpStyles.cellTextToday]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Actions */}
          <View style={dpStyles.actions}>
            <TouchableOpacity style={dpStyles.cancelBtn} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={dpStyles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dpStyles.confirmBtn} onPress={() => onConfirm(new Date(year, month, day))} activeOpacity={0.8}>
              <Text style={dpStyles.confirmTxt}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const dpStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: IS_TABLET ? 340 : '100%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  navTxt: { fontSize: 20, color: '#374151', lineHeight: 22 },
  monthYear: { fontSize: 16, fontWeight: '700', color: '#111827' },
  dayRow: { flexDirection: 'row', marginBottom: 6 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  emptyCell: { width: `${100/7}%`, aspectRatio: 1 },
  cellSelected: { backgroundColor: '#1D4ED8' },
  cellToday: { backgroundColor: '#EFF6FF' },
  cellText: { fontSize: 13, color: '#374151' },
  cellTextSelected: { color: '#fff', fontWeight: '700' },
  cellTextToday: { color: '#1D4ED8', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelTxt: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  confirmBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: '#1D4ED8', alignItems: 'center' },
  confirmTxt: { fontSize: 14, color: '#fff', fontWeight: '600' },
});

// ─── THREE-DOT MENU ──────────────────────────────────────────────────────────

function ThreeDotMenu({ teacher, onAction }) {
  const [open, setOpen] = useState(false);
  const options = ['View Profile', 'Edit Details', 'View History', 'Send Notification', 'Remove'];

  return (
    <View>
      <TouchableOpacity style={s.dotBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={s.dotTxt}>⋮</Text>
      </TouchableOpacity>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.dotOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={s.dotMenu}>
            <Text style={s.dotMenuTitle}>{teacher.name}</Text>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[s.dotItem, opt === 'Remove' && s.dotItemDanger]}
                onPress={() => { setOpen(false); onAction(opt, teacher); }}
                activeOpacity={0.7}
              >
                <Text style={[s.dotItemText, opt === 'Remove' && s.dotItemTextDanger]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────

function StatCard({ icon, count, label, iconColor, iconBg }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: IS_TABLET ? 22 : 18 }}>{icon}</Text>
      </View>
      <View>
        <Text style={s.statCount}>{count}</Text>
        <Text style={s.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function TeacherAttendance({ instituteId = '', instituteName = '', adminInfo = {} }) {
  const [teachers, setTeachers] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [savedState, setSavedState] = useState(null);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRoster = async () => {
      const resolvedInstituteId = (instituteId || '').trim();
      if (!resolvedInstituteId) {
        setTeachers([]);
        setLoadError('Institute context is missing.');
        return;
      }

      setLoadingTeachers(true);
      setLoadingAttendance(true);
      setLoadError('');

      try {
        const teacherPayload = await apiFetchTeachers(resolvedInstituteId, adminInfo);
        const roster = Array.isArray(teacherPayload)
          ? teacherPayload.map((teacher, index) => mapTeacherToRoster(teacher, index))
          : [];

        setTeachers(roster);

        try {
          const attendancePayload = await apiFetchTeacherAttendance(resolvedInstituteId, formatAttendanceDate(attendanceDate));
          const savedRecord = Array.isArray(attendancePayload) ? attendancePayload[0] : attendancePayload;

          if (savedRecord?.teachersAttendance?.length) {
            const statusByTeacherId = new Map(
              savedRecord.teachersAttendance.map((record) => [String(record.teacherId || '').trim(), normalizeStatus(record.status)])
            );

            setTeachers(
              roster.map((teacher) => ({
                ...teacher,
                status: statusByTeacherId.get(String(teacher.id || '').trim()) || teacher.status,
              }))
            );
          }
        } catch (attendanceError) {
          if (String(attendanceError?.message || '').toLowerCase().includes('not found')) {
            setTeachers(roster);
          }
        }
      } catch (error) {
        setTeachers([]);
        setLoadError(error?.message || 'Failed to load teacher attendance.');
      } finally {
        setLoadingTeachers(false);
        setLoadingAttendance(false);
      }
    };

    loadRoster();
  }, [instituteId, attendanceDate]);

  // Filter
  const filtered = useMemo(() =>
    teachers.filter(t =>
      searchQuery.trim() === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    ), [teachers, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setStatus = useCallback((teacherId, status) => {
    setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, status } : t));
  }, []);

  const markAllPresent = useCallback(() => {
    setTeachers(prev => prev.map(t => ({ ...t, status: 'Present' })));
    Alert.alert('Done', 'All teachers marked as Present.');
  }, []);

  const handleSave = useCallback(async () => {
    if (!teachers.length) {
      Alert.alert('No teachers', 'There are no teachers to save for this institute.');
      return;
    }

    const payload = {
      instituteId: (instituteId || '').trim(),
      instituteName: instituteName || '',
      attendanceDate: formatAttendanceDate(attendanceDate),
      teachersAttendance: teachers.map((teacher) => ({
        teacherId: teacher.id,
        teacherName: teacher.name,
        role: teacher.role,
        batch: teacher.batch,
        subject: teacher.subject,
        status: normalizeStatus(teacher.status).toLowerCase(),
        initials: teacher.initials,
        color: teacher.color,
      })),
      markedBy: {
        adminName: adminInfo?.adminName || '',
        email: adminInfo?.email || '',
      },
    };

    setSaving(true);
    try {
      const savedAttendance = await apiSaveTeacherAttendance(payload);
      setSavedState(savedAttendance);
      const counts = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
      teachers.forEach((teacher) => {
        counts[normalizeStatus(teacher.status)] += 1;
      });

      Alert.alert(
        '✅ Attendance Saved',
        `Date: ${attendanceDate.toLocaleDateString()}\n\nPresent: ${counts.Present}\nAbsent: ${counts.Absent}\nLate: ${counts.Late}\nOn Leave: ${counts.Leave}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Save failed', error?.message || 'Unable to save teacher attendance.');
    } finally {
      setSaving(false);
    }
  }, [teachers, attendanceDate, instituteId, instituteName, adminInfo]);

  const handleExport = useCallback(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    teachers.forEach(t => counts[t.status]++);
    const rows = teachers.map(t => `${t.id} | ${t.name} | ${t.batch} | ${t.subject} | ${t.status}`).join('\n');
    Alert.alert(
      '📊 Export Report',
      `Teacher Attendance Report\nDate: ${attendanceDate.toLocaleDateString()}\nTotal: ${teachers.length}\n\nPresent: ${counts.Present} | Absent: ${counts.Absent}\nLate: ${counts.Late} | On Leave: ${counts.Leave}\n\n[CSV export would download in production]\n\nSample:\n${rows.split('\n').slice(0, 3).join('\n')}…`,
      [{ text: 'Close' }]
    );
  }, [teachers, attendanceDate]);

  const handleMenuAction = useCallback((action, teacher) => {
    if (action === 'Remove') {
      Alert.alert('Remove Teacher', `Remove ${teacher.name} from today's roster?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setTeachers(prev => prev.filter(t => t.id !== teacher.id)) },
      ]);
    } else {
      Alert.alert(action, `${action} for ${teacher.name} (${teacher.id})`);
    }
  }, []);

  const stats = useMemo(() => {
    const c = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    teachers.forEach(t => c[t.status]++);
    return c;
  }, [teachers]);

  const fmtDate = (d) => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;

  // Pagination buttons
  const pageButtons = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) pages.push(i);
    return pages;
  }, [totalPages]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F2F8" />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

        {/* ── BREADCRUMB */}
        <View style={s.breadcrumb}>
          <Text style={s.breadcrumbGray}>Main Dashboard</Text>
          <Text style={s.breadcrumbSep}> › </Text>
          <Text style={s.breadcrumbBlue}>Teacher Attendance</Text>
        </View>

        {/* ── PAGE HEADER */}
        <View style={s.pageHeader}>
          <View style={s.pageHeaderLeft}>
            <Text style={s.pageTitle}>{instituteName ? `${instituteName} Teacher Attendance` : 'Teacher Attendance'}</Text>
            <Text style={s.pageSubtitle}>Manage and track daily attendance records for the faculty.</Text>
          </View>
        
        </View>

        {loadError ? (
          <View style={s.errorBanner}>
            <Text style={s.errorBannerTxt}>{loadError}</Text>
          </View>
        ) : null}

        {loadingTeachers ? (
          <View style={s.loadingBanner}>
            <ActivityIndicator size="small" color="#1D4ED8" />
            <Text style={s.loadingTxt}>Loading teachers from this institute...</Text>
          </View>
        ) : null}

        {/* ── FILTER ROW */}
        <View style={[s.filterRow, IS_TABLET && s.filterRowTablet]}>
          {/* Date picker */}
          <View style={[s.filterCard, IS_TABLET && s.filterCardTablet]}>
            <Text style={s.filterLabel}>Attendance Date</Text>
            <TouchableOpacity style={s.dateField} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
              <Text style={s.calIcon}>📅</Text>
              <Text style={s.dateText}>{fmtDate(attendanceDate)}</Text>
            </TouchableOpacity>
          </View>
          {/* Search */}
          <View style={[s.filterCard, IS_TABLET && s.filterCardTablet]}>
            <Text style={s.filterLabel}>Search Teacher</Text>
            <View style={s.searchField}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                value={searchQuery}
                onChangeText={v => { setSearchQuery(v); setCurrentPage(1); }}
                placeholder="Name or ID..."
                placeholderTextColor="#9CA3AF"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setCurrentPage(1); }} activeOpacity={0.7}>
                  <Text style={s.clearX}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* ── FACULTY ROSTER TABLE */}
        <View style={s.rosterCard}>
          {/* Roster header */}
          <View style={s.rosterHeader}>
            <View style={s.rosterHeaderLeft}>
              <Text style={s.rosterTitle}>Faculty</Text>
              <View style={s.countBadge}>
                <Text style={s.countBadgeTxt}>{teachers.length} TEACHERS</Text>
              </View>
            </View>
            <TouchableOpacity style={s.markAllBtn} onPress={markAllPresent} activeOpacity={0.7} disabled={loadingTeachers || saving}>
              <Text style={s.markAllTxt}>✓ Mark All Present</Text>
            </TouchableOpacity>
          </View>

          {/* Column headers — tablet only */}
          {IS_TABLET && (
            <View style={s.colHeader}>
              <Text style={[s.colTxt, { flex: 2.2 }]}>TEACHER NAME</Text>
              <Text style={[s.colTxt, { flex: 0.9 }]}>ID</Text>
              <Text style={[s.colTxt, { flex: 1.2 }]}>ASSIGNED BATCH</Text>
              <Text style={[s.colTxt, { flex: 1.4 }]}>SUBJECT</Text>
              <Text style={[s.colTxt, { flex: 2.4 }]}>ATTENDANCE STATUS</Text>
              <Text style={[s.colTxt, { flex: 0.5 }]}>ACTION</Text>
            </View>
          )}

          {/* Rows */}
          {pageData.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyTxt}>No teachers found matching "{searchQuery}"</Text>
            </View>
          ) : (
            pageData.map((teacher, idx) => (
              <TeacherRow
                key={teacher.id}
                teacher={teacher}
                isLast={idx === pageData.length - 1}
                onStatusChange={setStatus}
                onMenuAction={handleMenuAction}
              />
            ))
          )}

          {/* Pagination */}
          <View style={s.paginationRow}>
            <Text style={s.paginationInfo}>
              Showing <Text style={s.paginationBold}>{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)}</Text> of <Text style={s.paginationBold}>{filtered.length}</Text> teachers
            </Text>
            <View style={s.pageButtons}>
              <TouchableOpacity
                style={[s.pageBtn, currentPage === 1 && s.pageBtnDisabled]}
                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                activeOpacity={currentPage === 1 ? 1 : 0.7}
              >
                <Text style={s.pageBtnTxt}>‹</Text>
              </TouchableOpacity>
              {pageButtons.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.pageBtn, currentPage === p && s.pageBtnActive]}
                  onPress={() => setCurrentPage(p)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.pageBtnTxt, currentPage === p && s.pageBtnTxtActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[s.pageBtn, currentPage === totalPages && s.pageBtnDisabled]}
                onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                activeOpacity={currentPage === totalPages ? 1 : 0.7}
              >
                <Text style={s.pageBtnTxt}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── SAVE BUTTON */}
        <TouchableOpacity style={[s.saveBtn, (saving || loadingTeachers) && s.saveBtnDisabled]} onPress={handleSave} activeOpacity={0.85} disabled={saving || loadingTeachers}>
          <Text style={s.saveIcon}>💾</Text>
          <Text style={s.saveTxt}>{saving ? 'Saving...' : 'Save Attendance'}</Text>
        </TouchableOpacity>

        {/* ── STATS CARDS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.statsScrollContent}
          style={s.statsScroll}
        >
          <View style={s.statsRow}>
            <StatCard icon="✅" count={stats.Present} label="PRESENT TODAY" iconColor="#16A34A" iconBg="#F0FDF4" />
            <StatCard icon="❌" count={stats.Absent} label="ABSENT" iconColor="#DC2626" iconBg="#FEF2F2" />
            <StatCard icon="🕐" count={stats.Late} label="LATE ENTRY" iconColor="#D97706" iconBg="#FFFBEB" />
            <StatCard icon="📅" count={stats.Leave} label="ON LEAVE" iconColor="#0284C7" iconBg="#F0F9FF" />
          </View>
        </ScrollView>

      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        date={attendanceDate}
        onConfirm={(d) => { setAttendanceDate(d); setShowDatePicker(false); }}
        onDismiss={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

// ─── TEACHER ROW ─────────────────────────────────────────────────────────────

function TeacherRow({ teacher, isLast, onStatusChange, onMenuAction }) {
  return IS_TABLET ? (
    <View style={[s.row, !isLast && s.rowBorder]}>
      {/* Name + avatar */}
      <View style={[s.nameCell, { flex: 2.2 }]}>
        <View style={[s.avatar, { backgroundColor: teacher.color + '22' }]}>
          <Text style={[s.avatarTxt, { color: teacher.color }]}>{teacher.initials}</Text>
        </View>
        <View style={s.nameInfo}>
          <Text style={s.teacherName}>{teacher.name}</Text>
          <Text style={s.teacherRole}>{teacher.role}</Text>
        </View>
      </View>
      <Text style={[s.cellTxt, { flex: 0.9 }]}>#{teacher.id}</Text>
      <View style={{ flex: 1.2 }}>
        <View style={s.batchBadge}><Text style={s.batchTxt}>{teacher.batch}</Text></View>
      </View>
      <Text style={[s.cellTxt, { flex: 1.4 }]}>{teacher.subject}</Text>
      <View style={[s.statusButtons, { flex: 2.4 }]}>
        {['Present', 'Absent', 'Late', 'Leave'].map(st => {
          const cfg = STATUS_CONFIG[st];
          const active = teacher.status === st;
          return (
            <TouchableOpacity
              key={st}
              style={[s.statusBtn, { borderColor: cfg.border }, active && { backgroundColor: cfg.activeBg }]}
              onPress={() => onStatusChange(teacher.id, st)}
              activeOpacity={0.75}
            >
              <Text style={[s.statusBtnTxt, { color: active ? cfg.activeText : cfg.text }]}>{st}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ flex: 0.5, alignItems: 'center' }}>
        <ThreeDotMenu teacher={teacher} onAction={onMenuAction} />
      </View>
    </View>
  ) : (
    // Mobile card layout
    <View style={[s.mobileCard, !isLast && s.mobileCardBorder]}>
      <View style={s.mobileCardHeader}>
        <View style={[s.avatar, { backgroundColor: teacher.color + '22' }]}>
          <Text style={[s.avatarTxt, { color: teacher.color }]}>{teacher.initials}</Text>
        </View>
        <View style={s.nameInfo}>
          <Text style={s.teacherName}>{teacher.name}</Text>
          <Text style={s.teacherRole}>{teacher.role}</Text>
        </View>
        <ThreeDotMenu teacher={teacher} onAction={onMenuAction} />
      </View>
      <View style={s.mobileMeta}>
        <Text style={s.mobileMetaTxt}>#{teacher.id}</Text>
        <View style={s.batchBadge}><Text style={s.batchTxt}>{teacher.batch}</Text></View>
        <Text style={s.mobileMetaTxt}>{teacher.subject}</Text>
      </View>
      <View style={s.statusButtons}>
        {['Present', 'Absent', 'Late', 'Leave'].map(st => {
          const cfg = STATUS_CONFIG[st];
          const active = teacher.status === st;
          return (
            <TouchableOpacity
              key={st}
              style={[s.statusBtn, { borderColor: cfg.border }, active && { backgroundColor: cfg.activeBg }]}
              onPress={() => onStatusChange(teacher.id, st)}
              activeOpacity={0.75}
            >
              <Text style={[s.statusBtnTxt, { color: active ? cfg.activeText : cfg.text }]}>{st}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F2F8' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: IS_TABLET ? 28 : 14, paddingTop: 14, paddingBottom: 32 },

  // Breadcrumb
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  breadcrumbGray: { fontSize: 13, color: '#6B7280' },
  breadcrumbSep: { fontSize: 13, color: '#9CA3AF' },
  breadcrumbBlue: { fontSize: 13, color: '#1D4ED8', fontWeight: '500' },

  // Page header
  pageHeader: { flexDirection: IS_TABLET ? 'row' : 'column', alignItems: IS_TABLET ? 'center' : 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 10 },
  pageHeaderLeft: { flex: 1 },
  pageTitle: { fontSize: IS_TABLET ? 28 : 22, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: '#fff', alignSelf: IS_TABLET ? 'auto' : 'flex-start' },
  exportIcon: { fontSize: 14, color: '#374151' },
  exportTxt: { fontSize: 13, color: '#374151', fontWeight: '600' },
  errorBanner: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorBannerTxt: { fontSize: 13, color: '#B91C1C', fontWeight: '600' },
  loadingBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 10, padding: 12, marginBottom: 12 },
  loadingTxt: { fontSize: 13, color: '#1D4ED8', fontWeight: '600' },

  // Filter row
  filterRow: { flexDirection: 'column', gap: 12, marginBottom: 16 },
  filterRowTablet: { flexDirection: 'row' },
  filterCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  filterCardTablet: { flex: 1 },
  filterLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  // Date field
  dateField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 12, gap: 8, backgroundColor: '#FAFAFA' },
  calIcon: { fontSize: 15 },
  dateText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },

  // Search field
  searchField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, gap: 8, backgroundColor: '#FAFAFA' },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937', paddingVertical: 2 },
  clearX: { fontSize: 13, color: '#9CA3AF', paddingHorizontal: 4 },

  // Roster card
  rosterCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, marginBottom: 14 },
  rosterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: IS_TABLET ? 18 : 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rosterHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rosterTitle: { fontSize: IS_TABLET ? 18 : 16, fontWeight: '700', color: '#111827' },
  countBadge: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countBadgeTxt: { fontSize: 11, color: '#4338CA', fontWeight: '700', letterSpacing: 0.5 },
  markAllBtn: { paddingVertical: 8, paddingHorizontal: IS_TABLET ? 14 : 10 },
  markAllTxt: { fontSize: 13, color: '#1D4ED8', fontWeight: '600' },

  // Column headers
  colHeader: { flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  colTxt: { fontSize: 11, color: '#6B7280', fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  // Table row (tablet)
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  nameCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cellTxt: { fontSize: 13, color: '#374151', fontWeight: '500' },

  // Mobile card
  mobileCard: { padding: 14 },
  mobileCardBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  mobileCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  mobileMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  mobileMetaTxt: { fontSize: 12, color: '#6B7280' },

  // Avatar
  avatar: { width: IS_TABLET ? 40 : 36, height: IS_TABLET ? 40 : 36, borderRadius: IS_TABLET ? 20 : 18, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: IS_TABLET ? 13 : 12, fontWeight: '700' },
  nameInfo: { flex: 1 },
  teacherName: { fontSize: IS_TABLET ? 14 : 13, fontWeight: '700', color: '#111827' },
  teacherRole: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },

  // Batch badge
  batchBadge: { backgroundColor: '#EEF2FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  batchTxt: { fontSize: 11, color: '#4338CA', fontWeight: '600' },

  // Status buttons
  statusButtons: { flexDirection: 'row', gap: 5, flexWrap: IS_TABLET ? 'nowrap' : 'wrap' },
  statusBtn: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: IS_TABLET ? 10 : 9, paddingVertical: IS_TABLET ? 6 : 7, minWidth: IS_TABLET ? 58 : 62, alignItems: 'center' },
  statusBtnTxt: { fontSize: IS_TABLET ? 12 : 12, fontWeight: '600' },

  // Three-dot menu
  dotBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  dotTxt: { fontSize: 20, color: '#9CA3AF', lineHeight: 22 },
  dotOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', paddingHorizontal: 40 },
  dotMenu: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 10 },
  dotMenuTitle: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dotItem: { paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  dotItemDanger: { borderBottomWidth: 0 },
  dotItemText: { fontSize: 14, color: '#374151' },
  dotItemTextDanger: { color: '#DC2626', fontWeight: '600' },

  // Pagination
  paginationRow: { flexDirection: IS_TABLET ? 'row' : 'column', alignItems: IS_TABLET ? 'center' : 'flex-start', justifyContent: 'space-between', padding: IS_TABLET ? 18 : 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 10 },
  paginationInfo: { fontSize: 13, color: '#6B7280' },
  paginationBold: { color: '#111827', fontWeight: '600' },
  pageButtons: { flexDirection: 'row', gap: 4 },
  pageBtn: { width: 34, height: 34, borderRadius: 7, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' },
  pageBtnActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnTxt: { fontSize: 13, color: '#374151', fontWeight: '500' },
  pageBtnTxtActive: { color: '#fff', fontWeight: '700' },

  // Save button
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1D4ED8', borderRadius: 12, paddingVertical: 15, marginBottom: 16, shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnDisabled: { opacity: 0.7 },
  saveIcon: { fontSize: 18 },
  saveTxt: { fontSize: 16, color: '#fff', fontWeight: '700' },

  // Stats
  statsScroll: { marginTop: 2 },
  statsScrollContent: { paddingBottom: 2 },
  statsRow: { flexDirection: 'row', gap: 12, flexWrap: 'nowrap' },
  statCard: { width: IS_TABLET ? 220 : 170, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 12, padding: IS_TABLET ? 18 : 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { width: IS_TABLET ? 52 : 46, height: IS_TABLET ? 52 : 46, borderRadius: IS_TABLET ? 26 : 23, alignItems: 'center', justifyContent: 'center' },
  statCount: { fontSize: IS_TABLET ? 28 : 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.5 },

  // Empty state
  emptyState: { padding: 32, alignItems: 'center' },
  emptyTxt: { fontSize: 14, color: '#9CA3AF' },
});