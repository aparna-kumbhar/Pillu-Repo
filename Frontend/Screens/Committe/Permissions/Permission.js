import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// ── Data ──────────────────────────────────────────────────────────────────────

const ROLES = [
  { key: 'student', label: 'Student', icon: '🎓' },
  { key: 'teacher', label: 'Teacher', icon: '👤' },
  { key: 'admin',   label: 'Admin',   icon: '🛡️' },
  { key: 'parent',  label: 'Parent',  icon: '👨‍👩‍👧' },
];

const MODULES_BY_ROLE = {
  teacher: [
    {
      id: 'attendance',
      title: 'Attendance Marking',
      badge: 'CORE FEATURE',
      badgeColor: '#6C63FF',
      icon: '📋',
      description: 'Enable real-time presence tracking, manual overrides, and daily reporting.',
      enabled: true,
    },
    {
      id: 'Notes',
      title: 'Notes',
      badge: 'ACADEMIC',
      badgeColor: '#8B5CF6',
      icon: '📝',
      description: 'Create and share class notes, assign homework, and track submissions.',
      enabled: true,
    },
    {
      id: 'Test',
      title: 'Test',
      badge: 'ACADEMIC',  
      badgeColor: '#8B5CF6',
      icon: '🧪',
      description: 'Design quizzes, schedule exams, and analyze student performance.',
      enabled: true
    },
    {
      id: 'Teacher Attendance',
      title: 'Teacher Attendance',
      badge: 'ADMIN',
      badgeColor: '#F59E0B',
      icon: '📅',
      description: 'Track your own attendance, view leave balance, and submit absence requests.',
    },
    {
      id: 'Marks Entry',
      title: 'Marks Entry',
      badge: 'ACADEMIC',  
      badgeColor: '#8B5CF6',
      icon: '📊',
      description: 'Input student grades, manage gradebooks, and generate report cards.',
      enabled: true,
    },
    {
      id: 'Schedule',
      title: 'Schedule',
      badge: 'SCHEDULE',
      badgeColor: '#10B981',
      icon: '🗓️',
      description: 'View and manage your class schedule, exam timetable, and school calendar.', 
      enabled: true,
    },
    { 
      id:'Profile',
      title: 'Profile',
      badge: 'ACCOUNT', 
      badgeColor: '#3B82F6',
      icon: '👤',
      description: 'View and edit your personal information, contact details, and profile picture.',  
      enabled: true,
    },
  ],
  student: [
    {
      id: 'my_attendance',
      title: 'Attendance',
      badge: 'CORE FEATURE',
      badgeColor: '#6C63FF',
      icon: '📋',
      description: 'View your daily attendance record, percentage, and receive absence alerts.',
      enabled: true,
    },
    {
      id: 'timetable',
      title: 'Timetable',
      badge: 'SCHEDULE',
      badgeColor: '#F59E0B',
      icon: '🗓️',
      description: 'View weekly class schedule, exam timetable, and holiday calendar.',
      enabled: true,
    },
    {
      id: 'results',
      title: 'Ranking',
      badge: 'ACADEMIC',
      badgeColor: '#8B5CF6',
      icon: '🏆',
      description: 'Access exam results, grade history, and download transcripts.',
      enabled: true,
    },
    {
      id: 'fees',
      title: 'Fees',
      badge: 'FINANCIAL',
      badgeColor: '#10B981',
      icon: '💰',
      description: 'Check outstanding dues, payment history, and download receipts.',
      enabled: true,
    },
    {
      id: 'Study_Materials',
      title: 'Study Material',
      badge: 'RESOURCES',
      badgeColor: '#EC4899',
      icon: '📖',
      description: 'Browse digital library, borrow books, and access e-learning materials.',
      enabled: false,
    },
    {
      id: 'Profile',
      title: 'Profile',
      badge: 'ACCOUNT', 
      badgeColor: '#3B82F6',
      icon: '👤',
      description: 'View and edit your personal information, contact details, and profile picture.',
      enabled: true,
    },
    {
      id: 'Feedback',
      title: 'Feedback',
      badge: 'COMMUNICATION',
      badgeColor: '#6C63FF',
      icon: '💬',
      description: 'Submit feedback on courses, report issues, and communicate with administration.',
      enabled: false,
    },
    {
      id: 'Settings',
      title: 'Settings',
      badge: 'CONFIGURATION',
      badgeColor: '#8B5CF6',
      icon: '⚙️',
      description: 'Manage notification preferences, privacy settings, and account security.',
      enabled: true,
    }
  ],
  admin: [
    {
      id: 'Access Management',
      title: 'Access Management',
      badge: 'SECURITY',
      badgeColor: '#EC4899',
      icon: '🔑',
      description: 'Manage user permissions, roles, and access controls.',
      enabled: true,
    },
    {
      id: 'Batch Creation',
      title: 'Batch Creation',
      badge: 'ACADEMIC',
      badgeColor: '#8B5CF6',  
      icon: '🧑‍🏫',
      description: 'Create and manage student batches, assign class teachers, and set batch-specific settings.',
      enabled: true,
    },
    {
      id: 'Batch Selection',
      title: 'Batch Selection',
      badge: 'ACADEMIC',
      badgeColor: '#8B5CF6',
      icon: '📚',
      description: 'Select and switch between different student batches for management and reporting.',
      enabled: true,
    },
    {
      id: 'Timetable Management',
      title: 'Timetable Management',
      badge: 'SCHEDULE',
      badgeColor: '#F59E0B',
      icon: '⏰',
      description: 'Configure school timings, class periods, and manage the academic calendar.',
      enabled: true,
    },
    {
      id: 'Feedback',
      title: 'Feedback',
      badge: 'COMMUNICATION',
      badgeColor: '#6C63FF',
      icon: '💬',
      description: 'Submit feedback on courses, report issues, and communicate with administration.',
      enabled: false,
    },
    {
      id: 'Database',
      title: 'Database',
      badge: 'MAINTENANCE',
      badgeColor: '#10B981',
      icon: '🗄️',
      description: 'Manage and maintain the system database, including backups and restores.',
      enabled: true,
    },
    {
      id: 'Fee Management',
      title: 'Fee Management',
      badge: 'FINANCIAL',
      badgeColor: '#10B981',
      icon: '💳',
      description: 'Configure fee structures, generate invoices, and track collections.',
      enabled: true,
    },
  ],
  parent: [
    {
      id: 'attendance_view',
      title: 'Attendance',
      badge: 'CORE FEATURE',
      badgeColor: '#8B5CF6',
      icon: '📋',
      description: "Track your child's daily attendance and receive absence notifications.",
      enabled: true,
    },
    {
      id: 'Result',
      title: "Result",
      badge: 'ACADEMIC',
      badgeColor: '#6C63FF',
      icon: '📈',
      description: "Monitor your child's academic performance, grades, and teacher remarks.",
      enabled: true,
    },
    {
      id: 'Finance',
      title: 'Finance',
      badge: 'FINANCIAL',
      badgeColor: '#10B981',
      icon: '💳',
      description: 'Pay school fees online, view payment history, and download receipts.',
      enabled: true,
    },
    {
      id: 'Profile',
      title: 'Profile',
      badge: 'ACCOUNT',
      badgeColor: '#3B82F6',
      icon: '👤',
      description: 'View and edit your personal information, contact details, and profile picture.',
      enabled: true,
    },
  ],
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ModulePermissions() {
  const [activeRole, setActiveRole]       = useState('teacher');
  const [searchQuery, setSearchQuery]     = useState('');
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [moduleStates, setModuleStates]   = useState(() => {
    const initial = {};
    Object.keys(MODULES_BY_ROLE).forEach((role) => {
      initial[role] = {};
      MODULES_BY_ROLE[role].forEach((m) => {
        initial[role][m.id] = m.enabled;
      });
    });
    return initial;
  });

  const toggleModule = (moduleId) => {
    setModuleStates((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [moduleId]: !prev[activeRole][moduleId],
      },
    }));
  };

  const toggleMaster = () => {
    const next = !masterEnabled;
    setMasterEnabled(next);
    const updated = {};
    MODULES_BY_ROLE[activeRole].forEach((m) => {
      updated[m.id] = next;
    });
    setModuleStates((prev) => ({
      ...prev,
      [activeRole]: updated,
    }));
  };

  const handleSave = () => {
    const activeCount = Object.values(moduleStates[activeRole]).filter(Boolean).length;
    Alert.alert(
      'Changes Saved',
      `${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} permissions updated. ${activeCount} module(s) active.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const modules = MODULES_BY_ROLE[activeRole];
  const filtered = searchQuery.trim()
    ? modules.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : modules;

  const activeModuleCount = Object.values(moduleStates[activeRole]).filter(Boolean).length;
  const roleLabel = ROLES.find((r) => r.key === activeRole)?.label ?? '';
  const roleIcon  = ROLES.find((r) => r.key === activeRole)?.icon ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Search Bar ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search modules or roles..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Title ── */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Module Permissions</Text>
          <Text style={styles.pageSubtitle}>
            Role-based access management. Select a role to define granular controls for specific feature modules.
          </Text>
        </View>

        {/* ── Role Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContainer}
        >
          {ROLES.map((role) => {
            const isActive = activeRole === role.key;
            return (
              <TouchableOpacity
                key={role.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveRole(role.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.tabIcon}>{role.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Permissions Card ── */}
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.roleIconWrap}>
                <Text style={styles.roleIconText}>{roleIcon}</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>{roleLabel} Permissions</Text>
                <Text style={styles.cardSubtitle}>
                  Access level for {roleLabel.toLowerCase()} within the portal.
                </Text>
              </View>
            </View>
            <View style={styles.masterToggleWrap}>
              <Text style={styles.masterToggleLabel}>MASTER{'\n'}MODULE STATUS</Text>
              <Switch
                value={masterEnabled}
                onValueChange={toggleMaster}
                trackColor={{ false: '#D1D5DB', true: '#6C63FF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Module List */}
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No modules match your search.</Text>
            </View>
          ) : (
            filtered.map((mod) => (
              <View key={mod.id} style={styles.moduleRow}>
                <View style={styles.moduleLeft}>
                  <View style={[styles.moduleIconWrap, { backgroundColor: mod.badgeColor + '18' }]}>
                    <Text style={styles.moduleIconText}>{mod.icon}</Text>
                  </View>
                  <View style={styles.moduleInfo}>
                    <View style={styles.moduleTitleRow}>
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <View style={[styles.badge, { backgroundColor: mod.badgeColor + '18' }]}>
                        <Text style={[styles.badgeText, { color: mod.badgeColor }]}>{mod.badge}</Text>
                      </View>
                    </View>
                    <Text style={styles.moduleDesc}>{mod.description}</Text>
                    <View style={styles.moduleAccessRow}>
                      <Text style={styles.moduleAccessLabel}>Module Access</Text>
                      <Switch
                        value={moduleStates[activeRole][mod.id]}
                        onValueChange={() => toggleModule(mod.id)}
                        trackColor={{ false: '#D1D5DB', true: '#6C63FF' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Quick Summary ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>QUICK SUMMARY</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Active Modules</Text>
            <Text style={styles.summaryValue}>{activeModuleCount}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(activeModuleCount / modules.length) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending Requests</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>02</Text>
          </View>
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnIcon}>💾</Text>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Search
  searchRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'System',
    padding: 0,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: isTablet ? 32 : 16,
    paddingTop: 20,
  },

  // Title
  titleSection: { marginBottom: 20 },
  pageTitle: {
    fontSize: isTablet ? 32 : 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 20,
  },

  // Tabs
  tabsScroll: { marginBottom: 16 },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  tabIcon: { fontSize: 16 },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconText: { fontSize: 22 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    maxWidth: 200,
  },
  masterToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  masterToggleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.5,
    textAlign: 'right',
  },

  // Module Rows
  moduleRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  moduleLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  moduleIconText: { fontSize: 18 },
  moduleInfo: { flex: 1 },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  moduleDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 10,
  },
  moduleAccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleAccessLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  // Empty
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Summary
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 3,
  },

  // Save
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnIcon: { fontSize: 18 },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});