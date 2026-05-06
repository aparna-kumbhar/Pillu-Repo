import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { Animated } from 'react-native';

const { width } = Dimensions.get('window');
const isTabletOrDesktop = width >= 768;

// ─── Types ───────────────────────────────────────────────────────────────────
// DayStatus: 'present' | 'leave' | 'today' | 'weekend' | 'empty' | 'future'

// ─── Constants ───────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#1a7a6e',
  primaryDark: '#0f5a50',
  primaryLight: '#e8f5f3',
  accent: '#2da58e',
  teal: '#1d6b60',
  white: '#ffffff',
  offWhite: '#f5f7f6',
  lightGray: '#e8ece9',
  medGray: '#b0bbb8',
  darkGray: '#4a5e5b',
  text: '#1c2e2b',
  subText: '#6b8480',
  present: '#22c55e',
  leave: '#f59e0b',
  warningBg: '#fff7ed',
  warningBorder: '#fed7aa',
  infoBg: '#ecfdf5',
  infoBorder: '#6ee7b7',
  cardBg: '#ffffff',
  sidebarBg: '#f0f4f3',
};

const generateCalendar = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const data = [];

  // Empty slots before first day
  for (let i = 0; i < firstDay; i++) {
    data.push({ date: null, status: 'empty' });
  }

  // Actual days
  for (let d = 1; d <= totalDays; d++) {
    let status = 'present';

    const today = new Date();
    if (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      status = 'today';
    } else if (new Date(year, month, d) > today) {
      status = 'future';
    }

    // Weekend logic
    const dayOfWeek = new Date(year, month, d).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      status = 'weekend';
    }

    data.push({ date: d, status });
  }

  return data;
};

const LEAVE_HISTORY = [
  {
    id: '#LR-4492',
    type: 'Medical Leave',
    dateRange: 'Oct 08, 2024',
    duration: '1 Day',
    status: 'Approved',
    icon: '🏥',
    color: '#dcfce7',
  },
  {
    id: '#LR-4510',
    type: 'Annual Research Leave',
    dateRange: 'Nov 15 – Nov 22, 2024',
    duration: '7 Days',
    status: 'Pending',
    icon: '✈️',
    color: '#dbeafe',
  },
];

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const NAV_ITEMS = [
  { label: 'Dashboard', icon: '⊞' },
  { label: 'Attendance', icon: '✓', active: true },
  { label: 'Leave Requests', icon: '📅' },
  { label: 'Entitlements', icon: '📋' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const DayCell = ({ day }) => {
  const getStyle = () => {
    switch (day.status) {
      case 'present':
        return styles.dayPresent;
      case 'leave':
        return styles.dayLeave;
      case 'today':
        return styles.dayToday;
      case 'weekend':
        return styles.dayWeekend;
      case 'future':
        return styles.dayFuture;
      default:
        return styles.dayEmpty;
    }
  };

  const getTextStyle = () => {
    if (day.status === 'today') return styles.dayTextToday;
    if (day.status === 'weekend' || day.status === 'empty' || day.status === 'future')
      return styles.dayTextMuted;
    return styles.dayTextDefault;
  };

  const getDot = () => {
    if (day.status === 'present') return <Text style={styles.dotPresent}>✓</Text>;
    if (day.status === 'leave') return <Text style={styles.dotLeave}>🤒</Text>;
    return null;
  };

  if (day.status === 'empty' || day.date === null) {
    return <View style={[styles.dayCell, styles.dayEmpty]} />;
  }

  return (
    <TouchableOpacity style={[styles.dayCell, getStyle()]} activeOpacity={0.75}>
      <Text style={getTextStyle()}>{day.date}</Text>
      {day.status === 'today' && (
        <Text style={styles.todayLabel}>TODAY</Text>
      )}
      {getDot()}
    </TouchableOpacity>
  );
};

const LeaveCard = ({ item }) => (
  <TouchableOpacity style={styles.leaveCard} activeOpacity={0.8}>
    <View style={[styles.leaveIconBadge, { backgroundColor: item.color }]}>
      <Text style={styles.leaveIcon}>{item.icon}</Text>
    </View>
    <View style={styles.leaveInfo}>
      <Text style={styles.leaveType}>{item.type}</Text>
      <Text style={styles.leaveDate}>
        {item.dateRange} • {item.duration}
      </Text>
    </View>
    <View>
      <View
        style={[
          styles.statusBadge,
          item.status === 'Approved' ? styles.statusApproved : styles.statusPending,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            item.status === 'Approved' ? styles.statusTextApproved : styles.statusTextPending,
          ]}
        >
          {item.status}
        </Text>
      </View>
      <Text style={styles.leaveId}>{item.id}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Sidebar (Desktop/Tablet) ─────────────────────────────────────────────────

const Sidebar = ({ activeTab, setActiveTab }) => (
  <View style={styles.sidebar}>
    <Text style={styles.brandName}>ScholarPortal</Text>
    <View style={styles.profileCard}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarEmoji}>👨‍🏫</Text>
      </View>
      <View>
        <Text style={styles.profileName}>Academic Staff</Text>
        <Text style={styles.profileSub}>Faculty of Science</Text>
      </View>
    </View>
    <View style={styles.navList}>
      {NAV_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={[styles.navItem, activeTab === item.label && styles.navItemActive]}
          onPress={() => setActiveTab(item.label)}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>{item.icon}</Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === item.label && styles.navLabelActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    <View style={styles.quickHelp}>
      <Text style={styles.quickHelpTitle}>QUICK HELP</Text>
      <Text style={styles.quickHelpText}>
        Need assistance with your schedule? Contact Faculty Office.
      </Text>
    </View>
  </View>
);

// ─── Bottom Nav (Mobile) ──────────────────────────────────────────────────────



// ─── Main Content ─────────────────────────────────────────────────────────────

const MainContent = () => {
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const historySlideY = useRef(new Animated.Value(420)).current;
  const leaveTypes = ['Casual Leave', 'Medical Leave', 'Annual Leave', 'Sabbatical'];

  const openHistorySheet = () => {
    setShowAllHistory(true);
    Animated.timing(historySlideY, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const closeHistorySheet = () => {
    Animated.timing(historySlideY, {
      toValue: 420,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShowAllHistory(false);
    });
  };

  const formatMonth = (date) => {
  return date.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
};

const goToNextMonth = () => {
  const next = new Date(currentDate);
  next.setMonth(next.getMonth() + 1);
  setCurrentDate(next);
};

const goToPrevMonth = () => {
  const prev = new Date(currentDate);
  prev.setMonth(prev.getMonth() - 1);
  setCurrentDate(prev);
};

  return (
    <>
    <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search academic records..."
            placeholderTextColor={COLORS.medGray}
            style={styles.searchInput}
          />
        </View>
     
        <View style={styles.userInfo}>
          <View>
            <Text style={styles.userName}>Dr. Elena Rodriguez</Text>
            <Text style={styles.userRole}>SENIOR LECTURER</Text>
          </View>
          <View style={styles.userAvatar}>
            <Text>👩‍🏫</Text>
          </View>
        </View>
      </View>

      <View style={[styles.contentArea, isTabletOrDesktop && styles.contentAreaDesktop]}>
        {/* Left Column */}
        <View style={[styles.leftCol, isTabletOrDesktop && styles.leftColDesktop]}>
          {/* Page Title */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Attendance Record</Text>
            <Text style={styles.pagePeriod}>Academic Period: Semester 2, 2024</Text>
          </View>

          {/* Calendar Card */}
          <View style={styles.card}>
            <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonth}>
  {formatMonth(currentDate)}
</Text>  
              <View style={styles.calendarNav}>
               <TouchableOpacity style={styles.navArrow} onPress={goToPrevMonth}>
                  <Text style={styles.navArrowText}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navArrow} onPress={goToNextMonth}>
                  <Text style={styles.navArrowText}>›</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.present }]} />
                  <Text style={styles.legendText}>Present</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.leave }]} />
                  <Text style={styles.legendText}>Leave</Text>
                </View>
              </View>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekRow}>
              {WEEK_DAYS.map((d) => (
                <Text key={d} style={styles.weekDay}>{d}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {generateCalendar(currentDate).map((day, i) => (
                <DayCell key={i} day={day} />
              ))}
            </View>
          </View>

          {/* Recent History */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent History</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={openHistorySheet}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {LEAVE_HISTORY.map((item) => (
            <LeaveCard key={item.id} item={item} />
          ))}
        </View>

        {/* Right Column */}
        <View style={[styles.rightCol, isTabletOrDesktop && styles.rightColDesktop]}>
          {/* Entitlement Cards */}
          <View style={styles.entitlementRow}>
            <View style={[styles.entitlementCard, { backgroundColor: COLORS.accent }]}>
              <Text style={styles.entitlementLabel}>CASUAL</Text>
              <Text style={styles.entitlementDays}>12</Text>
              <Text style={styles.entitlementSub}>Days remaining</Text>
            </View>
            <View style={[styles.entitlementCard, { backgroundColor: COLORS.teal }]}>
              <Text style={styles.entitlementLabel}>MEDICAL</Text>
              <Text style={styles.entitlementDays}>08</Text>
              <Text style={styles.entitlementSub}>Days remaining</Text>
            </View>
          </View>

          {/* Apply for Leave */}
          <View style={styles.card}>
            <View style={styles.applyHeader}>
              <View style={styles.applyIconWrap}>
                <Text style={styles.applyIcon}>📋</Text>
              </View>
              <Text style={styles.applyTitle}>Apply for Leave</Text>
            </View>

            {/* Leave Category Dropdown */}
            <Text style={styles.fieldLabel}>LEAVE CATEGORY</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={leaveType ? styles.dropdownValueSelected : styles.dropdownPlaceholder}>
                {leaveType || 'Select type...'}
              </Text>
              <Text style={styles.dropdownChevron}>{dropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {dropdownOpen && (
              <View style={styles.dropdownMenu}>
                {leaveTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setLeaveType(type);
                      setDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownItemText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Date Range */}
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>START DATE</Text>
                <TouchableOpacity style={styles.dateInput} activeOpacity={0.8}>
                  <TextInput
                    placeholder="mm/dd/yy"
                    placeholderTextColor={COLORS.medGray}
                    style={styles.dateText}
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                  <Text style={styles.calIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>END DATE</Text>
                <TouchableOpacity style={styles.dateInput} activeOpacity={0.8}>
                  <TextInput
                    placeholder="mm/dd/yy"
                    placeholderTextColor={COLORS.medGray}
                    style={styles.dateText}
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                  <Text style={styles.calIcon}>📅</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Reason */}
            <Text style={styles.fieldLabel}>REASON FOR ABSENCE</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Briefly describe your request..."
              placeholderTextColor={COLORS.medGray}
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
            />

            {/* Info Banner */}
            

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={() => alert('Leave request submitted!')}
            >
              <Text style={styles.submitBtnText}>Submit Request</Text>
            </TouchableOpacity>
          </View>

          {/* Policy Card */}
          <View style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <Text style={styles.policyIcon}>🛡️</Text>
              <Text style={styles.policyTitle}>ATTENDANCE POLICY</Text>
            </View>
            <Text style={styles.policyText}>
              Faculty members are required to maintain a minimum of 85% physical presence.
              Digital check-ins are logged via portal.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: isTabletOrDesktop ? 32 : 100 }} />
    </ScrollView>
    <Modal
      visible={showAllHistory}
      transparent
      animationType="none"
      onRequestClose={closeHistorySheet}
    >
      <View style={styles.historyModalOverlay}>
        <TouchableOpacity
          style={styles.historyModalBackdrop}
          activeOpacity={1}
          onPress={closeHistorySheet}
        />

        <Animated.View
          style={[
            styles.historySheet,
            { transform: [{ translateY: historySlideY }] },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.historySheetHeader}>
            <Text style={styles.historySheetTitle}>All Leave History</Text>
            <TouchableOpacity onPress={closeHistorySheet} activeOpacity={0.7}>
              <Text style={styles.historyCloseBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.historySheetScroll}
            contentContainerStyle={styles.historySheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {LEAVE_HISTORY.map((item) => (
              <LeaveCard key={`full-${item.id}`} item={item} />
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
    </>
  );
};

// ─── Root Component ───────────────────────────────────────────────────────────

export default function Teacherattendance() {
  const [activeTab, setActiveTab] = useState('Attendance');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appContainer}>
        {/* Sidebar only on tablet/desktop */}
        {isTabletOrDesktop && (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* Main Area */}
        <View style={styles.mainArea}>
          <MainContent />
        </View>

        {/* Bottom Nav only on mobile */}
      
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  appContainer: {
    flex: 1,
    flexDirection: isTabletOrDesktop ? 'row' : 'column',
    backgroundColor: COLORS.offWhite,
  },

  // ── Sidebar ──
  sidebar: {
    width: 220,
    backgroundColor: COLORS.sidebarBg,
    paddingTop: 24,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: COLORS.lightGray,
    justifyContent: 'flex-start',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileSub: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 1,
  },
  navList: { gap: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  navIcon: { fontSize: 16 },
  navLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  quickHelp: {
    marginTop: 'auto',
    paddingTop: 24,
    paddingBottom: 16,
  },
  quickHelpTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.subText,
    letterSpacing: 1,
    marginBottom: 4,
  },
  quickHelpText: {
    fontSize: 12,
    color: COLORS.subText,
    lineHeight: 17,
  },

  // ── Bottom Nav ──
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  bottomNavIcon: { fontSize: 18, color: COLORS.subText },
  bottomNavIconActive: { color: COLORS.primary },
  bottomNavLabel: { fontSize: 10, color: COLORS.subText },
  bottomNavLabelActive: { color: COLORS.primary, fontWeight: '700' },

  // ── Main Area ──
  mainArea: { flex: 1 },
  mainScroll: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    gap: 6,
  },
  searchIcon: { fontSize: 14, color: COLORS.subText },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    padding: 0,
  },
  notifBtn: {
    position: 'relative',
    padding: 4,
  },
  notifIcon: { fontSize: 20 },
  notifDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    display: isTabletOrDesktop ? 'flex' : 'none',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
  },
  userRole: {
    fontSize: 10,
    color: COLORS.subText,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  contentArea: {
    padding: 16,
    gap: 16,
  },
  contentAreaDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    gap: 24,
  },

  // ── Left Column ──
  leftCol: { gap: 16 },
  leftColDesktop: { flex: 1.5 },

  pageHeader: { marginBottom: 4 },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  pagePeriod: {
    fontSize: 13,
    color: COLORS.subText,
    marginTop: 2,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 4,
  },
  navArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  navArrowText: { fontSize: 16, color: COLORS.darkGray, lineHeight: 20 },
  legend: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendText: { fontSize: 12, color: COLORS.subText },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.subText,
    letterSpacing: 0.5,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayEmpty: { backgroundColor: 'transparent' },
  dayPresent: {
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  dayLeave: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  dayToday: {
    backgroundColor: COLORS.primary,
  },
  dayWeekend: { backgroundColor: 'transparent' },
  dayFuture: {
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    opacity: 0.5,
  },

  dayTextDefault: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  dayTextToday: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  dayTextMuted: {
    fontSize: 13,
    color: COLORS.medGray,
  },
  todayLabel: {
    fontSize: 7,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dotPresent: { fontSize: 9, color: COLORS.present },
  dotLeave: { fontSize: 9 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewAll: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  leaveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 12,
  },
  leaveIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveIcon: { fontSize: 18 },
  leaveInfo: { flex: 1 },
  leaveType: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  leaveDate: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-end',
  },
  statusApproved: { backgroundColor: '#dcfce7' },
  statusPending: { backgroundColor: COLORS.lightGray },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextApproved: { color: '#16a34a' },
  statusTextPending: { color: COLORS.darkGray },
  leaveId: {
    fontSize: 10,
    color: COLORS.subText,
    textAlign: 'right',
    marginTop: 3,
  },

  // ── Right Column ──
  rightCol: { gap: 16 },
  rightColDesktop: { flex: 1 },

  entitlementRow: {
    flexDirection: 'row',
    gap: 12,
  },
  entitlementCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'flex-start',
  },
  entitlementLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
  },
  entitlementDays: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 44,
  },
  entitlementSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },

  applyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  applyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyIcon: { fontSize: 18 },
  applyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.subText,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12,
  },

  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: COLORS.offWhite,
  },
  dropdownPlaceholder: { fontSize: 14, color: COLORS.medGray },
  dropdownValueSelected: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  dropdownChevron: { fontSize: 11, color: COLORS.subText },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    marginTop: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dropdownItemText: { fontSize: 14, color: COLORS.text },

  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: { flex: 1 },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.offWhite,
  },
  dateText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    padding: 0,
  },
  calIcon: { fontSize: 14 },

  textArea: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.offWhite,
    fontSize: 13,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoBg,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.infoBorder,
  },
  infoIcon: { fontSize: 14 },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#065f46',
    lineHeight: 17,
  },

  submitBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  policyCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  policyIcon: { fontSize: 16 },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    letterSpacing: 0.8,
  },
  policyText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },

  // ── History Bottom Sheet ──
  historyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  historyModalBackdrop: {
    flex: 1,
  },
  historySheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.lightGray,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.lightGray,
    alignSelf: 'center',
    marginBottom: 10,
  },
  historySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    marginBottom: 8,
  },
  historySheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  historyCloseBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historySheetScroll: {
    flexGrow: 0,
  },
  historySheetScrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
  },
});