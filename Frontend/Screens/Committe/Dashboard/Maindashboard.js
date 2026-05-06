import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  SafeAreaView,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  navy: '#0D1B3E',
  navyDark: '#091429',
  teal: '#2DD4BF',
  tealLight: '#CCFBF4',
  white: '#FFFFFF',
  offWhite: '#F7F8FC',
  border: '#E4E8F0',
  textPrimary: '#0D1B3E',
  textSecondary: '#6B7A99',
  textMuted: '#9BA8BF',
  systemGreen: '#10B981',
  cardBg: '#FFFFFF',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, badge, label, value, subtitle, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.statCardWrapper}
    >
      <Animated.View style={[styles.statCard, { transform: [{ scale }] }]}>
        <View style={styles.statCardTop}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : subtitle ? (
            <Text style={styles.statSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Mini Bar Chart ────────────────────────────────────────────────────────────
function MiniBarChart() {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
  const values = [40, 55, 45, 70, 60, 90];
  const maxVal = Math.max(...values);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.barsRow}>
        {values.map((v, i) => (
          <View key={i} style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: (v / maxVal) * 100,
                  backgroundColor: i === months.length - 1 ? C.teal : C.navy + '33',
                },
              ]}
            />
            <Text style={styles.barLabel}>{months[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Alert Item ───────────────────────────────────────────────────────────────
function AlertItem({ icon, title, description, actionLabel, onPress }) {
  return (
    <View style={styles.alertItem}>
      <View style={styles.alertIconCircle}>
        <Text style={styles.alertIconText}>{icon}</Text>
      </View>
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertDescription}>{description}</Text>
        <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
          <Text style={styles.alertAction}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Institute Row ────────────────────────────────────────────────────────────
function InstituteRow({ name, tier, location, timeAgo, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.985, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
      }
    >
      <Animated.View style={[styles.instituteRow, { transform: [{ scale }] }]}>
        <View style={styles.instituteLeft}>
          <Text style={styles.instituteName}>{name}</Text>
          <Text style={styles.instituteTier}>{tier}</Text>
          <View style={styles.instituteMeta}>
            <Text style={styles.metaText}>🕐 {timeAgo}</Text>
            <Text style={[styles.metaText, { marginLeft: 12 }]}>📍 {location}</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Dashboard Screen ─────────────────────────────────────────────────────
export default function Maindashboard({ onViewDirectory, onInstituteClick }) {
  const [activeTab, setActiveTab] = useState('Executive Overview');
  const tabs = ['Executive Overview', 'Institutes', 'Alerts', 'Registration'];

  const handleCreateReport = () => alert('Create Report tapped');
  const handleDownloadData = () => alert('Download Data tapped');
  const handleViewDirectory = () => {
    if (onViewDirectory) {
      onViewDirectory();
    } else {
      alert('View Directory tapped');
    }
  };
  const handleActionRequired = () => alert('Action Required tapped');
  const handleScheduleAudit = () => alert('Schedule Audit tapped');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

    

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
       
          <View>
            <Text style={styles.pageTitle}>Executive Overview</Text>
            <Text style={styles.pageSubtitle}>Current institutional footprint and academic scale.</Text>
          </View>
          <View style={styles.liveChip}>
          
        </View>

        {/* ── Stat Cards ────────────────────────────────────────────── */}
        <View style={IS_TABLET ? styles.statRowTablet : styles.statRow}>
          <StatCard
            icon="🏛️"
            badge="+2 this month"
            label="TOTAL INSTITUTES"
            value="12"
            onPress={() => alert('Institutes tapped')}
          />
          <StatCard
            icon="👥"
            subtitle="Global Pool"
            label="TOTAL STUDENTS"
            value="1,240"
            onPress={() => alert('Students tapped')}
          />
          <StatCard
            icon="🎓"
            subtitle="Accredited"
            label="TOTAL FACULTY"
            value="85"
            onPress={() => alert('Faculty tapped')}
          />
        </View>

        {/* ── Chart + Alerts Row ────────────────────────────────────── */}
        <View style={IS_TABLET ? styles.midRowTablet : styles.midRow}>

          {/* Registration Growth Chart */}
          <View style={[styles.card, IS_TABLET ? styles.chartCardTablet : styles.chartCard]}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.cardTitle}>Registration Growth</Text>
                <Text style={styles.cardSubtitle}>Performance metrics Jan — Jun</Text>
              </View>
              <View style={styles.growthChip}>
                <View style={styles.greenDot} />
                <Text style={styles.growthChipText}>Growth Rate</Text>
              </View>
            </View>
            <MiniBarChart />
          </View>

          {/* Right Column: Alerts + System Status */}
          <View style={IS_TABLET ? styles.rightColTablet : styles.rightCol}>
            {/* Priority Alerts */}
            <View style={styles.alertsCard}>
              <View style={styles.alertsHeader}>
                <Text style={styles.alertsBang}>!</Text>
                <Text style={styles.alertsTitle}>Priority Alerts</Text>
              </View>
              <AlertItem
                icon="🔄"
                title="Renewal Pending"
                description="Heritage Institute needs immediate certification renewal."
                actionLabel="Action Required"
                onPress={handleActionRequired}
              />
              <View style={styles.alertDivider} />
              <AlertItem
                icon="🛡️"
                title="System Audit Required"
                description="Annual compliance audit window is now open for review."
                actionLabel="Schedule Audit"
                onPress={handleScheduleAudit}
              />
            </View>

            {/* System Status */}
          
          </View>
        </View>

        {/* ── Recently Registered ───────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recently Registered</Text>
            <Text style={styles.sectionSubtitle}>New additions to the curator network.</Text>
          </View>
          <TouchableOpacity activeOpacity={0.75} onPress={handleViewDirectory}>
            <Text style={styles.viewDirLink}>View Directory →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instituteList}>
          <InstituteRow
            name="Curator Academy South"
            tier="Tier 1 • Advanced Research Hub"
            location="Singapore"
            timeAgo="2 days ago"
            onPress={() => {
              if (onInstituteClick) {
                onInstituteClick({
                  id: '1',
                  name: 'Curator Academy South',
                  location: 'Singapore',
                  accreditation: 'Accredited Level III',
                  joined: 'Joined Jan 2022',
                  initials: 'CA',
                  color: '#1D9E75',
                  bg: '#E1F5EE',
                  access: ['Student', 'Parent', 'Teacher'],
                  price: '$49.99/month',
                });
              }
            }}
          />
          <InstituteRow
            name="Heritage Institute"
            tier="Tier 2 • Humanities & Arts"
            location="London, UK"
            timeAgo="5 days ago"
            onPress={() => {
              if (onInstituteClick) {
                onInstituteClick({
                  id: '2',
                  name: 'Heritage Institute',
                  location: 'London, UK',
                  accreditation: 'Accredited Level V',
                  joined: 'Joined Aug 2021',
                  initials: 'HI',
                  color: '#1e3a5f',
                  bg: '#E1F5EE',
                  access: ['Student', 'Teacher'],
                  price: '$59.99/month',
                });
              }
            }}
          />
          <InstituteRow
            name="Oxford North Collective"
            tier="Tier 1 • Science & Innovation"
            location="Toronto, CA"
            timeAgo="1 week ago"
            onPress={() => {
              if (onInstituteClick) {
                onInstituteClick({
                  id: '3',
                  name: 'Oxford North Collective',
                  location: 'Toronto, CA',
                  accreditation: 'Accredited Level I',
                  joined: 'Joined May 2023',
                  initials: 'ON',
                  color: '#534AB7',
                  bg: '#EEEDFE',
                  access: ['Student', 'Teacher'],
                  price: '$44.99/month',
                });
              }
            }}
          />
        </View>

        {/* ── Download Data Button ──────────────────────────────────── */}
      

        {/* Footer */}
        
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.navy,
  },

  // ── Navbar ──
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.navy,
    paddingHorizontal: IS_TABLET ? 32 : 16,
    paddingVertical: 12,
  },
  navBrand: {
    color: C.white,
    fontSize: IS_TABLET ? 14 : 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  navPortal: {
    color: C.teal,
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: 1,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navIconBtn: {
    padding: 6,
  },
  navIcon: {
    fontSize: 18,
  },
  createReportBtn: {
    backgroundColor: C.teal,
    paddingHorizontal: IS_TABLET ? 18 : 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  createReportText: {
    color: C.navy,
    fontWeight: '700',
    fontSize: IS_TABLET ? 13 : 11,
    letterSpacing: 0.3,
  },

  // ── Tab Bar ──
  tabBar: {
    backgroundColor: C.navy,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabScroll: {
    paddingHorizontal: IS_TABLET ? 32 : 12,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 4,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: C.teal,
  },
  tabText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: IS_TABLET ? 14 : 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: C.teal,
    fontWeight: '700',
  },

  // ── Scroll ──
  scrollView: {
    flex: 1,
    backgroundColor: C.offWhite,
  },
  scrollContent: {
    paddingHorizontal: IS_TABLET ? 32 : 16,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // ── Page Header ──
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: IS_TABLET ? 28 : 22,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 3,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.tealLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.systemGreen,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.navy,
    letterSpacing: 0.8,
  },

  // ── Stat Cards ──
  statRow: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  statRowTablet: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCardWrapper: {
    flex: IS_TABLET ? 1 : undefined,
  },
  statCard: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: IS_TABLET ? 20 : 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  badge: {
    backgroundColor: C.tealLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  statSubtitle: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  statValue: {
    fontSize: IS_TABLET ? 36 : 32,
    fontWeight: '800',
    color: C.navy,
    letterSpacing: -1,
  },

  // ── Mid Row ──
  midRow: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 28,
  },
  midRowTablet: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
    alignItems: 'flex-start',
  },

  // ── Chart ──
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: IS_TABLET ? 22 : 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chartCard: {},
  chartCardTablet: {
    flex: 1.6,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: IS_TABLET ? 17 : 15,
    fontWeight: '700',
    color: C.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  growthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.systemGreen,
  },
  growthChipText: {
    fontSize: 11,
    color: C.textSecondary,
    fontWeight: '500',
  },

  // ── Bar Chart ──
  chartContainer: {
    height: 130,
    justifyContent: 'flex-end',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingBottom: 24,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: IS_TABLET ? 28 : '60%',
    borderRadius: 4,
    minHeight: 8,
  },
  barLabel: {
    position: 'absolute',
    bottom: 0,
    fontSize: 9,
    color: C.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Right Column ──
  rightCol: {},
  rightColTablet: {
    flex: 1,
    gap: 14,
  },

  // ── Alerts Card ──
  alertsCard: {
    backgroundColor: C.navy,
    borderRadius: 14,
    padding: 18,
    marginBottom: IS_TABLET ? 0 : 14,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  alertsBang: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F59E0B',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: C.white,
    fontWeight: '900',
    fontSize: 13,
    overflow: 'hidden',
    lineHeight: 22,
  },
  alertsTitle: {
    color: C.white,
    fontWeight: '700',
    fontSize: 15,
  },
  alertItem: {
    flexDirection: 'row',
    gap: 12,
  },
  alertIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  alertIconText: {
    fontSize: 14,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: C.white,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 3,
  },
  alertDescription: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  alertAction: {
    color: C.teal,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  alertDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },

  // ── System Status ──
  systemStatusCard: {
    backgroundColor: C.tealLight,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  systemStatusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
    letterSpacing: 1.1,
    marginBottom: 3,
  },
  systemStatusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.navy,
  },
  systemCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.systemGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemCheckIcon: {
    color: C.white,
    fontSize: 16,
    fontWeight: '900',
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: IS_TABLET ? 20 : 17,
    fontWeight: '800',
    color: C.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  viewDirLink: {
    fontSize: 13,
    color: C.navy,
    fontWeight: '600',
  },

  // ── Institute List ──
  instituteList: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  instituteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IS_TABLET ? 22 : 18,
    paddingVertical: IS_TABLET ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  instituteLeft: {
    flex: 1,
  },
  instituteName: {
    fontSize: IS_TABLET ? 16 : 15,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 3,
  },
  instituteTier: {
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 6,
  },
  instituteMeta: {
    flexDirection: 'row',
  },
  metaText: {
    fontSize: 11,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chevron: {
    fontSize: 22,
    color: C.textMuted,
    marginLeft: 12,
  },

  // ── Download Button ──
  downloadBtn: {
    backgroundColor: C.navy,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 28,
  },
  downloadBtnText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.4,
  },

  // ── Footer ──
  footer: {
    textAlign: 'center',
    fontSize: 9,
    color: C.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
});