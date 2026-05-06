import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

export const isLaptop = Dimensions.get('window').width >= 768;
const { width } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

const FALLBACK_COLORS = ['#3A3A3A', '#7B6EA6', '#4A4A4A', '#6B7280', '#8B5E3C', '#C2856B', '#2D6A4F', '#B5451B'];

const mapBatchStudentsToAttendance = (batchStudents = []) =>
  (Array.isArray(batchStudents) ? batchStudents : []).map((student, index) => ({
    id: String(student?.id || student?._id || `student-${index}`),
    studentId: String(student?.id || student?._id || ''),
    name: String(student?.name || 'Student'),
    role: String(student?.grade || student?.academicYear || 'Student'),
    avatar: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    status: null,
  }));

const buildSubjectOptions = (routeParams = {}) => {
  const fromRouteList = Array.isArray(routeParams?.subjectOptions) ? routeParams.subjectOptions : [];
  const fromRouteSingle = routeParams?.selectedSubject;
  const normalized = Array.from(
    new Set(
      [...fromRouteList, fromRouteSingle]
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  );
  return normalized.length > 0 ? normalized : ['General'];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatDisplayDate = (date) => {
  const d = DAYS[date.getDay()];
  const day = date.getDate();
  const mon = SHORT_MONTHS[date.getMonth()];
  const yr = date.getFullYear();
  return `${d}, ${day} ${mon} ${yr}`;
};

const isSameDay = (a, b) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const isToday = (d) => isSameDay(d, new Date());

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

// ─── Date Picker Modal ────────────────────────────────────────────────────────

const DatePickerModal = ({ visible, selectedDate, onSelect, onClose }) => {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  useEffect(() => {
    if (visible) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [visible]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDay     = getFirstDayOfMonth(viewYear, viewMonth);
  const cells        = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[pickerStyles.modal, isLaptop && pickerStyles.modalLaptop]}
          onPress={() => {}}
        >
          {/* Month / Year navigation */}
          <View style={pickerStyles.navRow}>
            <TouchableOpacity activeOpacity={0.7} onPress={goToPrevMonth} style={pickerStyles.navBtn}>
              <Text style={pickerStyles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={pickerStyles.monthYear}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={goToNextMonth} style={pickerStyles.navBtn}>
              <Text style={pickerStyles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={pickerStyles.dayHeaderRow}>
            {DAYS.map((d) => (
              <Text key={d} style={pickerStyles.dayHeader}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={pickerStyles.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e-${idx}`} style={pickerStyles.cell} />;
              const cellDate = new Date(viewYear, viewMonth, day);
              const selected = isSameDay(cellDate, selectedDate);
              const todayCell = isToday(cellDate);
              return (
                <TouchableOpacity
                  key={`d-${day}`}
                  activeOpacity={0.7}
                  style={[
                    pickerStyles.cell,
                    todayCell && pickerStyles.cellToday,
                    selected && pickerStyles.cellSelected,
                  ]}
                  onPress={() => { onSelect(cellDate); onClose(); }}
                >
                  <Text style={[
                    pickerStyles.cellText,
                    todayCell && pickerStyles.cellTextToday,
                    selected && pickerStyles.cellTextSelected,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick actions */}
          <View style={pickerStyles.quickRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={pickerStyles.quickBtn}
              onPress={() => { onSelect(new Date()); onClose(); }}
            >
              <Text style={pickerStyles.quickBtnText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[pickerStyles.quickBtn, pickerStyles.quickBtnOutline]}
              onPress={onClose}
            >
              <Text style={[pickerStyles.quickBtnText, pickerStyles.quickBtnTextOutline]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Date Tab Strip ───────────────────────────────────────────────────────────

const DateTabStrip = ({ selectedDate, onDateChange, onOpenPicker }) => {
  const today = new Date();
  // Build last 7 days (oldest → newest) ending today
  const tabs = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  const scrollRef = useRef(null);

  useEffect(() => {
    // Scroll to end (today) on mount
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
  }, []);

  return (
    <View style={tabStripStyles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tabStripStyles.scrollContent}
      >
        {tabs.map((d, idx) => {
          const selected = isSameDay(d, selectedDate);
          const todayTab = isToday(d);
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => onDateChange(d)}
              style={[
                tabStripStyles.tab,
                todayTab && tabStripStyles.tabToday,
                selected && tabStripStyles.tabSelected,
              ]}
            >
              <Text style={[
                tabStripStyles.tabDay,
                selected && tabStripStyles.tabDaySelected,
              ]}>
                {DAYS[d.getDay()]}
              </Text>
              <Text style={[
                tabStripStyles.tabDate,
                selected && tabStripStyles.tabDateSelected,
              ]}>
                {d.getDate()}
              </Text>
              {todayTab && (
                <View style={[tabStripStyles.todayDot, selected && tabStripStyles.todayDotSelected]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Calendar icon to open full picker */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={tabStripStyles.calendarBtn}
        onPress={onOpenPicker}
      >
        <Text style={tabStripStyles.calendarIcon}>📅</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Avatar Component ─────────────────────────────────────────────────────────

const Avatar = ({ color, name, hasOnlineDot, size = 70 }) => {
  const initials = name.split(' ').map((n) => n[0]).join('');
  return (
    <View style={styles.avatarWrapper}>
      <View style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.avatarInitials, { fontSize: size * 0.34 }]}>{initials}</Text>
      </View>
      {hasOnlineDot && (
        <View style={[styles.onlineDot, { width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1, bottom: size * 0.04, right: size * 0.04 }]} />
      )}
    </View>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const config = {
    present: { bg: '#DCFCE7', text: '#15803D', label: 'Present' },
    absent:  { bg: '#FEE2E2', text: '#B91C1C', label: 'Absent'  },
    late:    { bg: '#DBEAFE', text: '#1D4ED8', label: 'Late'    },
  };
  const c = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
};

// ─── Student Card ─────────────────────────────────────────────────────────────

const StudentCard = ({ student, onStatusChange }) => (
  <View style={[styles.card, isLaptop && styles.cardLaptop]}>
    <View style={styles.cardTopRow}>
      <Avatar color={student.avatar} name={student.name} hasOnlineDot={student.status === 'present'} size={54} />
      <View style={styles.cardInfo}>
        <Text style={styles.studentName}>{student.name}</Text>
        <Text style={styles.studentId}>{student.studentId}</Text>
        <Text style={styles.studentRole}>{student.role}</Text>
      </View>
      <StatusBadge status={student.status} />
    </View>

    <View style={styles.cardDivider} />

    <View style={styles.statusRow}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onStatusChange(student.id, 'present')}
        style={[styles.statusBtn, student.status === 'present' && styles.statusBtnPresent]}
      >
        <Text style={[styles.statusBtnText, student.status === 'present' && { color: '#15803D' }]}>✓ Present</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onStatusChange(student.id, 'absent')}
        style={[styles.statusBtn, student.status === 'absent' && styles.statusBtnAbsent]}
      >
        <Text style={[styles.statusBtnText, student.status === 'absent' && { color: '#B91C1C' }]}>✕ Absent</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onStatusChange(student.id, 'late')}
        style={[styles.statusBtn, student.status === 'late' && styles.statusBtnLate]}
      >
        <Text style={[styles.statusBtnText, student.status === 'late' && { color: '#1D4ED8' }]}>🕐 Late</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ value, label, color, icon }) => (
  <View style={styles.statCard}>
    <Text style={styles.statCardIcon}>{icon}</Text>
    <Text style={[styles.statCardNumber, { color }]}>{value}</Text>
    <Text style={styles.statCardLabel}>{label}</Text>
  </View>
);

// ─── Bottom Tab ───────────────────────────────────────────────────────────────

const BottomTab = ({ icon, label, active, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.tabItem}>
    <Text style={styles.tabIcon}>{icon}</Text>
    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    {active && <View style={styles.tabActiveBar} />}
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const Attendancemark = ({ route }) => {
  const navigation = useNavigation();
  const batchId    = String(route?.params?.batchId || '').trim();
  const instituteId = String(route?.params?.instituteId || '').trim();
  const batchName  = String(route?.params?.batchName || 'Batch Attendance');
  const subjectOptions = buildSubjectOptions(route?.params || {});

  const [students, setStudents]           = useState(mapBatchStudentsToAttendance(route?.params?.batchStudents || []));
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [selectedSubject, setSelectedSubject] = useState(subjectOptions[0]);
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);

  // ── Date state ──
  const [selectedDate, setSelectedDate]   = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    const nextOptions = buildSubjectOptions(route?.params || {});
    setSelectedSubject((prev) => (nextOptions.includes(prev) ? prev : nextOptions[0]));
  }, [route?.params?.subjectOptions, route?.params?.selectedSubject]);

  useEffect(() => {
    let isMounted = true;
    const loadBatchStudents = async () => {
      if (!batchId || !instituteId) return;
      try {
        const query = `/api/batches/${encodeURIComponent(batchId)}?instituteId=${encodeURIComponent(instituteId)}`;
        const { response } = await fetchWithBaseUrlFallback(query);
        const payload = await response.json();
        if (!response.ok) return;
        const mappedStudents = mapBatchStudentsToAttendance(payload?.students || []);
        if (isMounted) setStudents(mappedStudents);
      } catch (error) {}
    };
    loadBatchStudents();
    return () => { isMounted = false; };
  }, [batchId, instituteId, route?.params?.batchStudents]);

  const handleBackPress = () => {
    if (navigation.canGoBack()) { navigation.goBack(); return; }
    navigation.navigate('Attendancebatch');
  };

  const handleStatusChange = useCallback((id, status) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }, []);

  const handleMarkAllPresent = () => setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' })));
  const handleReset          = () => setStudents((prev) => prev.map((s) => ({ ...s, status: null })));

  const handleSubmit = () => {
    const unmarked = students.filter((s) => s.status === null).length;
    const dateStr  = formatDisplayDate(selectedDate);
    if (unmarked > 0) {
      Alert.alert(
        'Incomplete Attendance',
        `${unmarked} student(s) have not been marked for ${selectedSubject} on ${dateStr}. Do you want to submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', style: 'destructive', onPress: () => Alert.alert('Success', `Attendance submitted for ${selectedSubject} on ${dateStr}!`) },
        ]
      );
    } else {
      Alert.alert('Success', `Attendance submitted for ${selectedSubject} on ${dateStr}!`);
    }
  };

  const enrolled     = students.length;
  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount  = students.filter((s) => s.status === 'absent').length;
  const lateCount    = students.filter((s) => s.status === 'late').length;
  const marked       = students.filter((s) => s.status !== null).length;
  const pending      = enrolled - marked;

  const filtered = students.filter((s) => {
    const matchesSearch = String(s.name || '').toLowerCase().includes(search.toLowerCase()) || String(s.studentId || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' ? true : s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { label: 'All',       value: 'all'     },
    { label: '✓ Present', value: 'present' },
    { label: '✕ Absent',  value: 'absent'  },
    { label: '🕐 Late',   value: 'late'    },
    { label: '— Pending', value: null      },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />

        <View style={[styles.container, isLaptop && styles.containerLaptop]}>

          {/* ── Header ── */}
          <View style={[styles.header, isLaptop && styles.headerLaptop]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity activeOpacity={0.7} style={styles.backBtn} onPress={handleBackPress}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Attendance</Text>
            </View>
          </View>

          {/* ── Date Tab Strip ── */}
          <DateTabStrip
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onOpenPicker={() => setIsDatePickerOpen(true)}
          />

          {/* ── Date Picker Modal ── */}
          <DatePickerModal
            visible={isDatePickerOpen}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            onClose={() => setIsDatePickerOpen(false)}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              isLaptop && styles.scrollContentLaptop,
            ]}
          >
            {/* ── Session Info ── */}
            <View style={styles.sessionIdRow}>
              <Text style={styles.sessionTitle} numberOfLines={1} ellipsizeMode="tail">
                {batchName}
              </Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateIcon}>🗓</Text>
                {/* Show selected date label */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsDatePickerOpen(true)}
                  style={styles.selectedDatePill}
                >
                  <Text style={styles.selectedDateText}>{formatDisplayDate(selectedDate)}</Text>
                </TouchableOpacity>
                {isToday(selectedDate) && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.subjectSection}>
              <Text style={styles.subjectLabel}>Subject</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.subjectToggle}
                onPress={() => setIsSubjectPickerOpen((prev) => !prev)}
              >
                <Text style={styles.subjectToggleText} numberOfLines={1}>{selectedSubject}</Text>
                <Text style={styles.subjectToggleIcon}>{isSubjectPickerOpen ? '▴' : '▾'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.dragHandleBtn}
                onPress={() => setIsSubjectPickerOpen(true)}
              >
                <View style={styles.dragHandleBar} />
              </TouchableOpacity>

              {isSubjectPickerOpen ? (
                <View style={styles.subjectDrawer}>
                  <Text style={styles.subjectHint}>Drag left or right to view all subjects</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    contentContainerStyle={styles.subjectScrollContent}
                  >
                    {subjectOptions.map((subject) => {
                      const isActive = selectedSubject === subject;
                      return (
                        <TouchableOpacity
                          key={subject}
                          activeOpacity={0.75}
                          onPress={() => { setSelectedSubject(subject); setIsSubjectPickerOpen(false); }}
                          style={[styles.subjectChip, isActive && styles.subjectChipActive]}
                        >
                          <Text style={[styles.subjectChipText, isActive && styles.subjectChipTextActive]}>{subject}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            {/* ── Stat Cards ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              style={styles.statsScroll}
              contentContainerStyle={styles.statsScrollContent}
            >
              <StatCard value={enrolled}     label="ENROLLED" color="#2563EB" icon="👥" />
              <StatCard value={presentCount} label="PRESENT"  color="#15803D" icon="✅" />
              <StatCard value={absentCount}  label="ABSENT"   color="#B91C1C" icon="❌" />
              <StatCard value={lateCount}    label="LATE"     color="#1D4ED8" icon="🕐" />
              <StatCard value={pending}      label="PENDING"  color="#D97706" icon="⏳" />
            </ScrollView>

            {/* ── Progress Bar ── */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Completion</Text>
                <Text style={styles.progressPct}>
                  {enrolled > 0 ? Math.round((marked / enrolled) * 100) : 0}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${enrolled > 0 ? (marked / enrolled) * 100 : 0}%` }]} />
              </View>
            </View>

            {/* ── Action Buttons ── */}
            <View style={styles.actionRow}>
              <TouchableOpacity activeOpacity={0.75} onPress={handleReset} style={styles.resetBtn}>
                <Text style={styles.resetIcon}>↺</Text>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.75} onPress={handleMarkAllPresent} style={styles.markAllBtn}>
                <Text style={styles.markAllIcon}>✓</Text>
                <Text style={styles.markAllText}>Mark All Present</Text>
              </TouchableOpacity>
            </View>

            {/* ── Search ── */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIconText}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or ID..."
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Filter Chips ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              {filterOptions.map((opt) => (
                <TouchableOpacity
                  key={String(opt.value)}
                  activeOpacity={0.7}
                  onPress={() => setFilterStatus(opt.value)}
                  style={[styles.filterChip, filterStatus === opt.value && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, filterStatus === opt.value && styles.filterChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Result Count ── */}
            <Text style={styles.resultCount}>
              Showing {filtered.length} of {enrolled} students
            </Text>

            {/* ── Student Cards ── */}
            <View style={[styles.cardGrid, isLaptop && styles.cardGridLaptop]}>
              {filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyText}>No students found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your search or filter</Text>
                </View>
              ) : (
                filtered.map((student) => (
                  <StudentCard key={student.id} student={student} onStatusChange={handleStatusChange} />
                ))
              )}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* ── Submit Button ── */}
          <View style={[styles.submitWrapper, isLaptop && styles.submitWrapperLaptop]}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.submitBtn, isLaptop && styles.submitBtnLaptop]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitIcon}>⬆</Text>
              <Text style={styles.submitText}>SUBMIT ATTENDANCE</Text>
              <View style={styles.submitBadge}>
                <Text style={styles.submitBadgeText}>{marked}/{enrolled}</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// ─── Date Tab Strip Styles ────────────────────────────────────────────────────

const tabStripStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 4,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 6,
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isLaptop ? 16 : 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minWidth: isLaptop ? 64 : 52,
    gap: 2,
  },
  tabToday: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  tabSelected: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  tabDay: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  tabDaySelected: {
    color: '#FFFFFF',
  },
  tabDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  tabDateSelected: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1D4ED8',
    marginTop: 1,
  },
  todayDotSelected: {
    backgroundColor: '#BFDBFE',
  },
  calendarBtn: {
    marginLeft: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: {
    fontSize: 18,
  },
});

// ─── Date Picker Modal Styles ─────────────────────────────────────────────────

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 12, overflow: 'hidden' },
      web:     { boxShadow: '0px 8px 24px rgba(0,0,0,0.15)' },
    }),
  },
  modalLaptop: {
    maxWidth: 400,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 22,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  cellToday: {},
  cellSelected: {},
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    width: 32,
    height: 32,
    lineHeight: 32,
    textAlign: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cellTextToday: {
    color: '#1D4ED8',
    fontWeight: '800',
    backgroundColor: '#EFF6FF',
  },
  cellTextSelected: {
    color: '#FFFFFF',
    backgroundColor: '#1D4ED8',
    fontWeight: '800',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
  },
  quickBtnOutline: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  quickBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  quickBtnTextOutline: {
    color: '#374151',
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const CARD_WIDTH = isLaptop ? (width - 96) / 3 : width - 48;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  containerLaptop: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLaptop: {
    paddingHorizontal: 32,
    paddingVertical: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBtn: {
    padding: 6,
  },
  menuIcon: {
    fontSize: 20,
    color: '#374151',
  },
  headerTitle: {
    fontSize: isLaptop ? 20 : 17,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },

  // ── Scroll ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  scrollContentLaptop: {
    paddingHorizontal: 32,
  },

  // ── Session ──
  sessionSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sessionIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sessionBar: {
    width: 28,
    height: 3,
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  sessionIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 1.5,
  },
  sessionTitle: {
    fontSize: isLaptop ? 28 : 20,
    fontWeight: '800',
    color: '#111827',
    lineHeight: isLaptop ? 34 : 26,
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateIcon: { fontSize: 14 },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // ── Selected Date Pill (tappable) ──
  selectedDatePill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  selectedDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 1,
  },

  // ── Subject Selector ──
  subjectSection: {
    marginBottom: 14,
  },
  subjectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subjectScrollContent: {
    gap: 8,
  },
  subjectToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  subjectToggleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 10,
  },
  subjectToggleIcon: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
  },
  subjectDrawer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  dragHandleBtn: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 6,
  },
  dragHandleBar: {
    width: 44,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  subjectHint: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  subjectChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  subjectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  subjectChipTextActive: {
    color: '#1D4ED8',
  },

  // ── Stat Cards ──
  statsScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  statsScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1, overflow: 'hidden' },
      web:     { boxShadow: '0px 1px 4px rgba(0,0,0,0.04)' },
    }),
  },
  statCardIcon:   { fontSize: 18, marginBottom: 4 },
  statCardNumber: { fontSize: 22, fontWeight: '800' },
  statCardLabel:  { fontSize: 9, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.1, marginTop: 2 },

  // ── Progress ──
  progressSection: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  progressPct:   { fontSize: 12, fontWeight: '800', color: '#1D4ED8' },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1D4ED8',
    borderRadius: 3,
  },

  // ── Action Buttons ──
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  resetIcon: { fontSize: 15, color: '#374151' },
  resetText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  markAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
  },
  markAllIcon: { fontSize: 15, color: '#FFF', fontWeight: '700' },
  markAllText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // ── Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  searchIconText: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  searchClear:  { fontSize: 13, color: '#9CA3AF', padding: 2 },

  // ── Filter Chips ──
  filterScroll: {
    marginBottom: 12,
    marginHorizontal: -20,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterChipActive:     { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  filterChipText:       { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#1D4ED8' },

  // ── Result Count ──
  resultCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 14,
  },

  // ── Card Grid ──
  cardGrid: { gap: 12 },
  cardGridLaptop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  // ── Student Card ──
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: CARD_WIDTH,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2, overflow: 'hidden' },
      web:     { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' },
    }),
  },
  cardLaptop: {
    width: (width - 96 - 32) / 3,
    minWidth: 260,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  cardInfo:    { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  studentId:   { fontSize: 11, color: '#9CA3AF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 2 },
  studentRole: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  // ── Badge ──
  badge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // ── Card Divider ──
  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },

  // ── Status Row ──
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  statusBtnPresent: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  statusBtnAbsent:  { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  statusBtnLate:    { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  statusBtnText:    { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.3 },

  // ── Avatar ──
  avatarWrapper: { position: 'relative' },
  avatar:        { alignItems: 'center', justifyContent: 'center' },
  avatarInitials:{ fontWeight: '700', color: '#FFF' },
  onlineDot: {
    position: 'absolute',
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFF',
  },

  // ── Empty State ──
  emptyState:   { alignItems: 'center', paddingVertical: 48, width: '100%' },
  emptyIcon:    { fontSize: 36, marginBottom: 12 },
  emptyText:    { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#9CA3AF' },

  // ── Submit ──
  submitWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F0F4F8',
  },
  submitWrapperLaptop: {
    paddingHorizontal: 32,
    alignItems: 'flex-end',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1D4ED8',
    borderRadius: 14,
    paddingVertical: 18,
    ...Platform.select({
      ios:     { shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14 },
      android: { elevation: 8, overflow: 'hidden' },
      web:     { boxShadow: '0px 6px 14px rgba(29,78,216,0.4)' },
    }),
  },
  submitBtnLaptop: {
    width: 360,
    paddingHorizontal: 40,
  },
  submitIcon:      { fontSize: 18, color: '#FFF', fontWeight: '700' },
  submitText:      { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: 1.8 },
  submitBadge:     { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 4 },
  submitBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  // ── Bottom Tab Bar (mobile) ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  tabItem:      { flex: 1, alignItems: 'center', gap: 3, position: 'relative' },
  tabIcon:      { fontSize: 20 },
  tabLabel:     { fontSize: 9, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },
  tabLabelActive: { color: '#1D4ED8' },
  tabActiveBar: { position: 'absolute', top: -9, width: 28, height: 3, backgroundColor: '#1D4ED8', borderRadius: 2 },

  // ── Laptop Tabs ──
  laptopTabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 10,
    gap: 4,
  },
  laptopTab:         { paddingHorizontal: 28, paddingVertical: 9, borderRadius: 8 },
  laptopTabActive:   { backgroundColor: '#EFF6FF' },
  laptopTabText:     { fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.2 },
  laptopTabTextActive: { color: '#1D4ED8' },

  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '600',
  },
});

export default Attendancemark;