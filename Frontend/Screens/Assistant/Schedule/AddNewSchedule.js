import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, FlatList, Alert, Platform,
  Dimensions, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#F4F6FA',
  sidebar: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#1A2E6E',
  primaryLight: '#2B47B8',
  accent: '#4ECFA8',
  accentSoft: '#E8F8F3',
  border: '#E4E8F0',
  text: '#1A2236',
  textMid: '#4A5568',
  textSoft: '#8A96AA',
  gridLine: '#EFF2F8',
  sessionGreen: '#E6F6F1',
  sessionGreenBorder: '#4ECFA8',
  sessionBlue: '#EAF0FF',
  sessionBlueBorder: '#4B74E8',
  sessionPurple: '#F0EEFF',
  sessionPurpleBorder: '#8B6FE8',
  white: '#FFFFFF',
  errorBg: '#FFF0F0',
  errorBorder: '#FFB3B3',
  errorText: '#C0392B',
};

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const SUBJECTS = [
  { id: 's1', label: 'Physics II' },
  { id: 's2', label: 'Advanced Calculus' },
  { id: 's3', label: 'Thermodynamics' },
  { id: 's4', label: 'Ethics in Engineering' },
  { id: 's5', label: 'Fluid Dynamics' },
  { id: 's6', label: 'Linear Algebra II' },
  { id: 's7', label: 'Computer Architecture' },
];

const CLASSROOMS = [
  { id: 'c1', label: 'Room 101' },
  { id: 'c2', label: 'Lab 402' },
  { id: 'c3', label: 'Aud. 1' },
  { id: 'c4', label: 'Hall B' },
  { id: 'c5', label: 'Rm 204' },
  { id: 'c6', label: 'Lab 102' },
];

const DAYS_SHORT = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
];

const GRID_TIMES = ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM'];

const SESSION_COLORS = {
  green:  { bg: C.sessionGreen,  border: C.sessionGreenBorder,  text: '#1A6B50' },
  blue:   { bg: C.sessionBlue,   border: C.sessionBlueBorder,   text: '#1A3A8A' },
  purple: { bg: C.sessionPurple, border: C.sessionPurpleBorder, text: '#4A2A9A' },
};

const COLOR_CYCLE = ['green', 'blue', 'purple'];

// ─── API HELPERS ──────────────────────────────────────────────────────────────

const requestJson = async (path, options = {}) => {
    const { response, baseUrl } = await fetchWithBaseUrlFallback(path, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
        const msg = payload?.message || `Request failed (${response.status})`;
        throw new Error(`${msg} @ ${baseUrl}`);
  }

  return payload;
};

/**
 * Fetch all batches for an institute.
 * GET /api/batches?instituteId=xxx
 */
async function apiFetchBatches(instituteId) {
  return requestJson(`/api/batches?instituteId=${encodeURIComponent(instituteId)}`);
}

/**
 * Fetch all teachers for an institute.
 * GET /api/teachers?instituteId=xxx
 */
async function apiFetchTeachers(instituteId) {
  return requestJson(`/api/teachers?instituteId=${encodeURIComponent(instituteId)}`);
}

function normalizeTeacherOption(teacher, index = 0) {
  if (!teacher) {
    return null;
  }

  const id = String(teacher?._id || teacher?.id || teacher?.teacherId || '').trim();
  const label = String(teacher?.fullName || teacher?.name || teacher?.label || teacher?.teacherId || '').trim();

  if (!id && !label) {
    return null;
  }

  return {
    id: id || label || `teacher-${index}`,
    label: label || id || `Teacher ${index + 1}`,
    subject: String(teacher?.departmentName || teacher?.qualification || teacher?.subject || '').trim(),
    exp: String(teacher?.experience || teacher?.exp || '').trim(),
  };
}

function normalizeBatchOption(batch) {
  const allocatedTeachers = Array.isArray(batch?.allocatedTeachers)
    ? batch.allocatedTeachers.map((teacher, index) => {
        const teacherOption = normalizeTeacherOption(teacher, index);
        return teacherOption;
      }).filter(Boolean)
    : [];

  return {
    id: String(batch?._id || batch?.id || '').trim(),
    label: String(batch?.name || batch?.label || 'Batch').trim(),
    faculty: batch?.faculty || null,
    allocatedTeachers,
    rawBatch: batch || null,
  };
}

/**
 * Fetch the active schedule for a batch.
 * GET /api/schedules/batch/:batchId?instituteId=xxx
 * Returns the most recent schedule doc (first in array).
 */
async function apiFetchScheduleForBatch(instituteId, batchId) {
  const list = await requestJson(`/api/schedules/batch/${encodeURIComponent(batchId)}?instituteId=${encodeURIComponent(instituteId)}`);
  return list.length > 0 ? list[0] : null; // most recent
}

/**
 * Create a new schedule doc for a batch.
 * POST /api/schedules
 */
async function apiCreateSchedule(payload) {
  return requestJson('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Append / replace a single session in an existing schedule.
 * POST /api/schedules/:id/sessions
 */
async function apiAddSession(scheduleId, instituteId, session) {
  return requestJson(`/api/schedules/${scheduleId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instituteId, session }),
  });
}

async function apiReloadScheduleForBatch(instituteId, batchId) {
  const list = await apiFetchScheduleForBatch(instituteId, batchId);
  return list;
}

// ─── MAP DB SESSIONS → LOCAL FORMAT ──────────────────────────────────────────
function dbSessionsToLocal(sessions = []) {
  return sessions.map((s, idx) => ({
    day: s.day.slice(0, 3),           // "Monday" → "Mon"
    time: s.startTime,
    endTime: s.endTime,
    label: s.subject?.label?.toUpperCase() || '',
    room: s.classroom?.label || '',
    color: s.color || COLOR_CYCLE[idx % 3],
    _sessionId: String(s._id || ''),
  }));
}

// ─── DROPDOWN ─────────────────────────────────────────────────────────────────
function DropdownField({ label, placeholder, value, options, onChange, loading }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TouchableOpacity
        style={f.btn}
        onPress={() => !loading && setOpen(true)}
        activeOpacity={0.7}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={C.primaryLight} style={{ flex: 1 }} />
        ) : (
          <Text style={[f.btnTxt, !selected && f.placeholder]} numberOfLines={1}>
            {selected ? selected.label : placeholder}
          </Text>
        )}
        <Text style={f.arrow}>⌄</Text>
      </TouchableOpacity>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={f.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={f.menu}>
            <Text style={f.menuTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[f.item, item.id === value && f.itemActive]}
                  onPress={() => { onChange(item.id); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[f.itemTxt, item.id === value && f.itemTxtActive]}>{item.label}</Text>
                  {item.id === value && <Text style={f.check}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: C.textSoft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 12, backgroundColor: C.white, minHeight: 42,
  },
  btnTxt: { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  placeholder: { color: C.textSoft, fontWeight: '400' },
  arrow: { fontSize: 16, color: C.textSoft, marginLeft: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', paddingHorizontal: IS_TABLET ? 100 : 24 },
  menu: {
    backgroundColor: C.white, borderRadius: 12, paddingBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, elevation: 12, maxHeight: 320,
  },
  menuTitle: {
    fontSize: 11, color: C.textSoft, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  itemActive: { backgroundColor: '#F0F4FF' },
  itemTxt: { fontSize: 13, color: C.textMid },
  itemTxtActive: { color: C.primaryLight, fontWeight: '700' },
  check: { fontSize: 13, color: C.primaryLight, fontWeight: '700' },
});

// ─── GRID CELL ────────────────────────────────────────────────────────────────
function GridCell({ session, onPress }) {
  if (!session) {
    return (
      <TouchableOpacity style={g.emptyCell} onPress={onPress} activeOpacity={0.6}>
        <Text style={g.plusIcon}>+</Text>
      </TouchableOpacity>
    );
  }
  const col = SESSION_COLORS[session.color] || SESSION_COLORS.green;
  const timeLabel = session.endTime ? `${session.time}–${session.endTime}` : session.time;
  return (
    <View style={[g.sessionCell, { backgroundColor: col.bg, borderLeftColor: col.border }]}>
      <Text style={[g.sessionLabel, { color: col.text }]} numberOfLines={2}>{session.label}</Text>
      <Text style={g.sessionRoom} numberOfLines={1}>{session.room}</Text>
      <Text style={g.sessionTime} numberOfLines={1}>{timeLabel}</Text>
    </View>
  );
}

const g = StyleSheet.create({
  emptyCell: {
    flex: 1, minHeight: 60, margin: 2, borderRadius: 6,
    borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFBFD',
  },
  plusIcon: { fontSize: 18, color: C.border, fontWeight: '300' },
  sessionCell: {
    flex: 1, minHeight: 60, margin: 2, borderRadius: 6,
    borderLeftWidth: 3, padding: 6, justifyContent: 'space-between',
  },
  sessionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3, lineHeight: 13 },
  sessionRoom: { fontSize: 9, color: C.textMid, fontWeight: '500', marginTop: 3 },
  sessionTime: { fontSize: 8, color: C.textSoft, marginTop: 1 },
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
/**
 * Props:
 *   instituteId  {string}   – required, the logged-in institute's ID
 *   instituteName {string}  – optional display name
 *   adminInfo    {object}   – { adminName, email } for createdBy field
 *   onBack       {function} – navigate back
 *   onSave       {function} – called after successful save with the schedule doc
 */
export default function AddNewSchedule({
  instituteId = '',
  instituteName = '',
  adminInfo = {},
  onBack,
  onSave,
}) {
  const mainScrollRef = useRef(null);

  // ── Batch state (fetched from API)
  const [batches, setBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(true);
  const [batchError, setBatchError] = useState('');
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [facultyError, setFacultyError] = useState('');

  // ── Selected batch + its DB schedule doc
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [scheduleDoc, setScheduleDoc] = useState(null); // the DB doc (_id + sessions)
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // ── Local grid (mirrors DB sessions for display)
  const [weeklySchedule, setWeeklySchedule] = useState([]);

  // ── Add-session form fields
  const [subject, setSubject] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [day, setDay] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  // ── Modal flags
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);

  // ── Saving indicator
  const [saving, setSaving] = useState(false);

  // ── Fetch batches on mount
  useEffect(() => {
    if (!instituteId) {
      setBatchError('No instituteId provided.');
      setBatchLoading(false);
      return;
    }
    setBatchLoading(true);
    setBatchError('');
    apiFetchBatches(instituteId)
      .then(data => {
        // Keep faculty on the batch option so timetable allocation stays batch-specific.
        const normalized = Array.isArray(data)
          ? data.map((batch) => normalizeBatchOption(batch)).filter((batch) => batch.id)
          : [];
        setBatches(normalized);
        if (normalized.length > 0) setSelectedBatchId(normalized[0].id);
      })
      .catch(err => setBatchError(err.message || 'Failed to load batches.'))
      .finally(() => setBatchLoading(false));
  }, [instituteId]);

  useEffect(() => {
    const selectedBatchRecord = batches.find((batch) => batch.id === selectedBatchId);

    if (!selectedBatchRecord) {
      setFacultyOptions([]);
      setFaculty(null);
      return;
    }

    const allocatedTeachers = Array.isArray(selectedBatchRecord.allocatedTeachers)
      ? selectedBatchRecord.allocatedTeachers
      : [];
    const allocatedTeacher = allocatedTeachers.length > 0
      ? allocatedTeachers
      : selectedBatchRecord.faculty
        ? [normalizeTeacherOption(selectedBatchRecord.faculty)].filter(Boolean)
        : [];

    if (allocatedTeacher.length > 0) {
      setFacultyOptions(allocatedTeacher);
      setFaculty((currentFaculty) => currentFaculty || allocatedTeacher[0].id);
      setFacultyError('');
      setFacultyLoading(false);
      return;
    }

    if (!instituteId) {
      setFacultyError('No instituteId provided.');
      setFacultyLoading(false);
      return;
    }

    setFacultyLoading(true);
    setFacultyError('');
    setFaculty(null);

    apiFetchTeachers(instituteId)
      .then(data => {
        const normalized = Array.isArray(data)
          ? data.map((teacher, index) => normalizeTeacherOption(teacher, index)).filter(Boolean)
          : [];

        setFacultyOptions(normalized);

        if (normalized.length > 0) setFaculty((currentFaculty) => currentFaculty || normalized[0].id);
      })
      .catch(err => setFacultyError(err.message || 'Failed to load teachers.'))
      .finally(() => setFacultyLoading(false));
  }, [selectedBatchId, instituteId, batches]);

  // ── Load schedule when batch changes
  useEffect(() => {
    if (!instituteId || !selectedBatchId) {
      setWeeklySchedule([]);
      setScheduleDoc(null);
      setScheduleLoading(false);
      return;
    }

    setScheduleLoading(true);
    apiFetchScheduleForBatch(instituteId, selectedBatchId)
      .then(doc => {
        setScheduleDoc(doc);
        setWeeklySchedule(dbSessionsToLocal(doc?.sessions || []));
      })
      .catch(err => {
        console.warn('Failed to load schedule for batch', err.message || err);
      })
      .finally(() => setScheduleLoading(false));
  }, [instituteId, selectedBatchId]);

  // ── Grid helpers
  const getSessionForSlot = (dayLabel, timeSlot) =>
    weeklySchedule.find(s => s.day === dayLabel && s.time === timeSlot) || null;

  const handleCellPress = (dayLabel, timeSlot) => {
    const existing = getSessionForSlot(dayLabel, timeSlot);
    if (!existing) {
      const dayFull = DAYS_SHORT.find(d => d.startsWith(dayLabel));
      setDay(dayFull || dayLabel);
      setStartTime(timeSlot);
      requestAnimationFrame(() => {
        mainScrollRef.current?.scrollToEnd?.({ animated: true });
      });
    }
  };

  // ── Commit session
  const handleCommit = useCallback(async () => {
    if (!subject)    { Alert.alert('Missing', 'Please select a subject.');        return; }
    if (!classroom)  { Alert.alert('Missing', 'Please select a classroom.');      return; }
    if (!faculty)    { Alert.alert('Missing', 'Please assign a faculty member.'); return; }
    if (!day)        { Alert.alert('Missing', 'Please select a day.');            return; }
    if (!startTime)  { Alert.alert('Missing', 'Please set a start time.');        return; }
    if (!endTime)    { Alert.alert('Missing', 'Please set an end time.');         return; }

    const subjectObj   = SUBJECTS.find(s => s.id === subject);
    const classroomObj = CLASSROOMS.find(c => c.id === classroom);
    const facultyObj   = facultyOptions.find(f => f.id === faculty);
    const batchObj     = batches.find(b => b.id === selectedBatchId);
    if (!batchObj) {
      Alert.alert('Missing', 'Please select a valid batch.');
      return;
    }
    const dayShort     = day.slice(0, 3);

    // Determine next color
    const colorIdx = weeklySchedule.length % COLOR_CYCLE.length;
    const color = COLOR_CYCLE[colorIdx];

    const sessionPayload = {
      day,           // full day name, e.g. "Monday"
      startTime,
      endTime,
      subject:   { id: subjectObj?.id || '',   label: subjectObj?.label || '' },
      classroom: { id: classroomObj?.id || '', label: classroomObj?.label || '' },
      faculty:   { id: facultyObj?.id || '',   label: facultyObj?.label || '' },
      color,
    };

    setSaving(true);
    try {
      let updatedDoc;

      if (scheduleDoc?._id) {
        // Schedule already exists for this batch → add/replace the session
        updatedDoc = await apiAddSession(scheduleDoc._id, instituteId, sessionPayload);
      } else {
        // No schedule yet → create one
        updatedDoc = await apiCreateSchedule({
          instituteId,
          instituteName,
          batch: { id: batchObj?.id || selectedBatchId, label: batchObj?.label || '' },
          weekLabel: 'Sep 16 – Sep 20, 2024',
          sessions: [sessionPayload],
          createdBy: {
            adminName: adminInfo?.adminName || '',
            email: adminInfo?.email || '',
          },
        });
      }

      const persistedDoc = await apiReloadScheduleForBatch(instituteId, selectedBatchId);
      if (persistedDoc?._id) {
        updatedDoc = persistedDoc;
      }

      // Update local state from fresh DB doc
      setScheduleDoc(updatedDoc);
      setWeeklySchedule(dbSessionsToLocal(updatedDoc.sessions));

      // Reset form
      setSubject(null);
      setClassroom(null);
      setFaculty(null);
      setDay(null);
      setStartTime(null);
      setEndTime(null);

      if (onSave) onSave(updatedDoc);
      const savedId = updatedDoc?._id || updatedDoc?.id || 'unknown';
      Alert.alert(
        'Session Committed',
        `${subjectObj?.label} added to ${batchObj?.label} on ${dayShort} (${startTime} – ${endTime}).\nSaved schedule id: ${savedId}`
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save session.');
    } finally {
      setSaving(false);
    }
  }, [
    subject, classroom, faculty, day, startTime, endTime,
    selectedBatchId, batches, scheduleDoc, weeklySchedule,
    instituteId, instituteName, adminInfo, onSave, facultyOptions,
  ]);

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={s.body}>
        {/* ── SIDEBAR */}
        <View style={s.sidebar}>
          <View style={s.sideNav}>
            {[
              { icon: '▦', label: 'Dashboard' },
              { icon: '▤', label: 'Schedule Master', active: true },
              { icon: '◉', label: 'Batch Management' },
              { icon: '◫', label: 'Resource Allocator' },
              { icon: '◧', label: 'Archive' },
            ].map(item => (
              <TouchableOpacity key={item.label} style={[s.sideItem, item.active && s.sideItemActive]} activeOpacity={0.7}>
                <Text style={[s.sideIcon, item.active && s.sideIconActive]}>{item.icon}</Text>
                <Text style={[s.sideLabel, item.active && s.sideLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.sideSpacer} />
        </View>

        {/* ── MAIN CONTENT */}
        <ScrollView
          ref={mainScrollRef}
          style={s.main}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.mainContent}
        >

          {/* Batch Error Banner */}
          {batchError ? (
            <View style={s.errorBanner}>
              <Text style={s.errorBannerTxt}>⚠ {batchError}</Text>
            </View>
          ) : null}

          {/* Batch Selector */}
          <View style={s.batchBar}>
            <View style={s.batchSelector}>
              <Text style={s.batchIcon}>👥</Text>
              <DropdownField
                label="Batch Selection"
                placeholder="Select Batch"
                value={selectedBatchId}
                options={batches}
                onChange={(id) => setSelectedBatchId(id)}
                loading={batchLoading}
              />
            </View>
          </View>

          {/* Schedule Grid + Add Session Panel */}
          <View style={s.gridPanelRow}>

            {/* ── WEEKLY GRID */}
            <View style={s.gridCard}>
              <View style={s.gridHeader}>
                <Text style={s.gridTitle}>Weekly Schedule</Text>
                <View style={s.gridNav}>
                
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={s.scheduleScrollContent}>
                <View style={s.scheduleTable}>
                  {/* Day Headers */}
                  <View style={s.dayHeaderRow}>
                    <View style={s.timeColHeader} />
                    {DAY_LABELS.map(d => (
                      <View key={d} style={s.dayHeaderCell}>
                        <Text style={[s.dayHeaderTxt, d === 'Mon' && s.dayHeaderActive]}>{d.toUpperCase()}</Text>
                        {d === 'Mon' && <View style={s.dayUnderline} />}
                      </View>
                    ))}
                  </View>

                  {/* Loading overlay for grid */}
                  {scheduleLoading && (
                    <View style={s.gridLoadingOverlay}>
                      <ActivityIndicator size="large" color={C.primaryLight} />
                      <Text style={s.gridLoadingTxt}>Loading schedule…</Text>
                    </View>
                  )}

                  {/* Grid rows */}
                  {!scheduleLoading && GRID_TIMES.map(timeSlot => (
                    <View key={timeSlot} style={s.gridRow}>
                      <View style={s.timeCol}>
                        <Text style={s.timeTxt}>{timeSlot}</Text>
                      </View>
                      {timeSlot === '12:00 PM' ? (
                        <View style={s.recessRow}>
                          <Text style={s.recessTxt}>RECESS / MAINTENANCE WINDOW</Text>
                        </View>
                      ) : (
                        DAY_LABELS.map(dayLabel => {
                          const session = getSessionForSlot(dayLabel, timeSlot);
                          return (
                            <View key={dayLabel} style={s.cellWrap}>
                              <GridCell
                                session={session}
                                onPress={() => handleCellPress(dayLabel, timeSlot)}
                              />
                            </View>
                          );
                        })
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* ── ADD SESSION PANEL */}
          <View style={s.addPanel}>
              <Text style={s.panelTitle}>Add Session</Text>
              <Text style={s.panelSubtitle}>
                Configure a new slot for {selectedBatch?.label || '…'}.
              </Text>

              <View style={s.panelDivider} />

              <DropdownField
                label="Subject"
                placeholder="Select Subject"
                value={subject}
                options={SUBJECTS}
                onChange={setSubject}
              />
              <DropdownField
                label="Classroom"
                placeholder="Select Classroom"
                value={classroom}
                options={CLASSROOMS}
                onChange={setClassroom}
              />
              <DropdownField
                label="Faculty Member"
                placeholder="Select Faculty Member"
                value={faculty}
                options={facultyOptions}
                onChange={setFaculty}
                loading={facultyLoading}
              />

              {facultyError ? (
                <Text style={[s.panelSubtitle, { color: C.errorText, marginTop: -6, marginBottom: 8 }]}>
                  {facultyError}
                </Text>
              ) : null}

              {/* Day selector */}
              <View style={s.dayTimeRow}>
                <View style={s.dayFieldWrap}>
                  <Text style={f.label}>Day</Text>
                  <TouchableOpacity
                    style={f.btn}
                    onPress={() => {
                      const idx = DAYS_SHORT.findIndex(d => d === day);
                      setDay(DAYS_SHORT[(idx + 1) % DAYS_SHORT.length]);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[f.btnTxt, !day && f.placeholder]} numberOfLines={1}>
                      {day ? day.slice(0, 3) : 'Day'}
                    </Text>
                    <Text style={f.arrow}>⌄</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.timeFieldWrap}>
                  <Text style={f.label}>Start Time</Text>
                  <TouchableOpacity style={f.btn} onPress={() => setShowStartTimeModal(true)} activeOpacity={0.7}>
                    <Text style={[f.btnTxt, !startTime && f.placeholder]}>
                      {startTime || '--:-- –'}
                    </Text>
                    <Text style={s.clockIcon}>⏱</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.dayTimeRow}>
                <View style={s.dayFieldWrap}>
                  <Text style={f.label}>End Time</Text>
                  <TouchableOpacity style={f.btn} onPress={() => setShowEndTimeModal(true)} activeOpacity={0.7}>
                    <Text style={[f.btnTxt, !endTime && f.placeholder]}>
                      {endTime || '--:-- –'}
                    </Text>
                    <Text style={s.clockIcon}>⏱</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.timeFieldWrap} />
              </View>

              <TouchableOpacity
                style={[s.commitBtn, saving && s.commitBtnDisabled]}
                onPress={handleCommit}
                activeOpacity={0.85}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color={C.white} />
                  : <Text style={s.commitBtnTxt}>Commit to Schedule</Text>
                }
              </TouchableOpacity>

          </View>

          {/* ── STATUS BAR */}
          
        </ScrollView>
      </View>

      {/* ── START TIME MODAL */}
      <TimePickerModal
        visible={showStartTimeModal}
        title="Select Start Time"
        selected={startTime}
        onSelect={t => { setStartTime(t); setShowStartTimeModal(false); }}
        onClose={() => setShowStartTimeModal(false)}
      />

      {/* ── END TIME MODAL */}
      <TimePickerModal
        visible={showEndTimeModal}
        title="Select End Time"
        selected={endTime}
        onSelect={t => { setEndTime(t); setShowEndTimeModal(false); }}
        onClose={() => setShowEndTimeModal(false)}
      />
    </SafeAreaView>
  );
}

// ─── TIME PICKER MODAL ────────────────────────────────────────────────────────
function TimePickerModal({ visible, title, selected, onSelect, onClose }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={tm.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={tm.card}>
          <Text style={tm.title}>{title}</Text>
          <ScrollView style={tm.list} showsVerticalScrollIndicator={false}>
            {TIME_SLOTS.map(t => {
              const isSel = t === selected;
              return (
                <TouchableOpacity
                  key={t}
                  style={[tm.item, isSel && tm.itemSel]}
                  onPress={() => onSelect(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[tm.itemTxt, isSel && tm.itemTxtSel]}>{t}</Text>
                  {isSel && <Text style={tm.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const tm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: { backgroundColor: C.white, borderRadius: 14, padding: 16, width: 260, maxHeight: 380, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, elevation: 12 },
  title: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10, textAlign: 'center' },
  list: { maxHeight: 300 },
  item: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 },
  itemSel: { backgroundColor: '#EEF2FF' },
  itemTxt: { fontSize: 13, color: C.textMid },
  itemTxtSel: { color: C.primaryLight, fontWeight: '700' },
  check: { fontSize: 13, color: C.primaryLight },
});

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: IS_TABLET ? 200 : 0,
    display: IS_TABLET ? 'flex' : 'none',
    backgroundColor: C.white,
    borderRightWidth: 1, borderRightColor: C.border,
    paddingTop: 20, paddingBottom: 16, flexDirection: 'column',
  },
  sideNav: { gap: 2 },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16 },
  sideItemActive: { backgroundColor: '#EEF2FF', borderRightWidth: 3, borderRightColor: C.primaryLight },
  sideIcon: { fontSize: 14, color: C.textSoft },
  sideIconActive: { color: C.primaryLight },
  sideLabel: { fontSize: 13, color: C.textMid, fontWeight: '500' },
  sideLabelActive: { color: C.primaryLight, fontWeight: '700' },
  sideSpacer: { flex: 1 },

  // Main
  main: { flex: 1 },
  mainContent: { padding: 16, paddingBottom: 32 },

  // Error banner
  errorBanner: {
    backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder,
    borderRadius: 8, padding: 12, marginBottom: 12,
  },
  errorBannerTxt: { fontSize: 13, color: C.errorText, fontWeight: '600' },

  // Batch bar
  batchBar: { marginBottom: 14 },
  batchSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    borderRadius: 9, paddingVertical: 10, paddingHorizontal: 14,
    alignSelf: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  batchIcon: { fontSize: 15 },

  // Grid + panel row
  gridPanelRow: { flexDirection: 'column', gap: 14, alignItems: 'stretch' },

  // Grid card
  gridCard: {
    flex: IS_TABLET ? 1 : undefined,
    backgroundColor: C.white, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  scheduleScrollContent: {
    flexGrow: 1,
  },
  scheduleTable: {
    minWidth: 720,
  },
  gridHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  gridTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  gridNav: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gridNavBtn: {
    width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  gridNavTxt: { fontSize: 16, color: C.textMid },
  gridDateRange: { fontSize: 12, color: C.textMid, fontWeight: '600' },

  gridLoadingOverlay: {
    padding: 32, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  gridLoadingTxt: { fontSize: 13, color: C.textSoft },

  dayHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  timeColHeader: { width: 72 },
  dayHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  dayHeaderTxt: { fontSize: 11, fontWeight: '700', color: C.textSoft, letterSpacing: 0.5 },
  dayHeaderActive: { color: C.primaryLight },
  dayUnderline: { height: 2, width: 20, backgroundColor: C.primaryLight, borderRadius: 1, marginTop: 3 },

  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.gridLine, minHeight: 70 },
  timeCol: { width: 72, justifyContent: 'flex-start', paddingTop: 8, paddingLeft: 14 },
  timeTxt: { fontSize: 11, color: C.textSoft, fontWeight: '500' },
  cellWrap: { flex: 1, padding: 3 },
  recessRow: {
    flex: 5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F9FAFB', margin: 4, borderRadius: 6,
  },
  recessTxt: { fontSize: 11, color: C.textSoft, fontWeight: '600', letterSpacing: 1 },

  // Add panel
  addPanel: {
    width: '100%',
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 18,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  panelTitle: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  panelSubtitle: { fontSize: 12, color: C.textSoft, marginTop: 4, lineHeight: 17 },
  panelDivider: { height: 1, backgroundColor: C.border, marginVertical: 14 },

  dayTimeRow: { flexDirection: 'row', gap: 8, marginBottom: 0 },
  dayFieldWrap: { flex: 1 },
  timeFieldWrap: { flex: 1.4 },
  clockIcon: { fontSize: 14, color: C.textSoft },

  commitBtn: {
    marginTop: 16, backgroundColor: C.primary, borderRadius: 9,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    minHeight: 48, justifyContent: 'center',
  },
  commitBtnDisabled: { opacity: 0.6 },
  commitBtnTxt: { fontSize: 14, color: C.white, fontWeight: '700' },

  facilityCard: {
    marginTop: 14, borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#1A2E6E', minHeight: 90, justifyContent: 'flex-end',
  },
  facilityOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,20,60,0.55)' },
  facilityContent: { padding: 12 },
  facilityTitle: { fontSize: 13, fontWeight: '800', color: C.white, lineHeight: 17 },
  facilitySubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 15 },

  // Status bar
  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 14, backgroundColor: C.white, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  statusIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  statusCheckmark: { fontSize: 13, color: C.accent, fontWeight: '700' },
  statusTxt: { flex: 1, fontSize: 12, color: C.textMid, lineHeight: 17 },
  statusBold: { fontWeight: '700', color: C.text },
  statusRight: { alignItems: 'flex-end', gap: 4 },
  statusTime: { fontSize: 10, color: C.textSoft, fontWeight: '600', letterSpacing: 0.3 },
  viewLogs: { fontSize: 12, color: C.primaryLight, fontWeight: '700', textAlign: 'right' },
});