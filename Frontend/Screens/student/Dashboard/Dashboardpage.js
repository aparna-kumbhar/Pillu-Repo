// Dashboard.js
import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Modal, StyleSheet, Platform, Dimensions,
} from "react-native";
import Svg, { Rect, Path, Line, Circle, Polyline, Polygon } from "react-native-svg";

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  purple:      "#5b4fcf",
  purpleLight: "#f0eeff",
  purplePale:  "#ede9fe",
  purpleMid:   "#7c6cf0",
  green:       "#22c55e",
  greenLight:  "#dcfce7",
  amber:       "#f59e0b",
  amberLight:  "#fef3c7",
  blue:        "#3b82f6",
  blueLight:   "#dbeafe",
  red:         "#ef4444",
  redLight:    "#fee2e2",
  gray:        "#6b7280",
  grayLight:   "#9ca3af",
  grayBg:      "#f5f4fe",
  border:      "#ede9fe",
  ink:         "#1a1a2e",
  white:       "#ffffff",
};

const IS_MOBILE = () => Dimensions.get("window").width < 768;

// ─── Monthly Data (all 12 months) ────────────────────────────────────────────
const MONTHLY_DATA = [
  { label: "Jan", value: 92 }, { label: "Feb", value: 80 }, { label: "Mar", value: 74 },
  { label: "Apr", value: 68 }, { label: "May", value: 85 }, { label: "Jun", value: 77 },
  { label: "Jul", value: 60 }, { label: "Aug", value: 65 }, { label: "Sep", value: 55 },
  { label: "Oct", value: 70 }, { label: "Nov", value: 62 }, { label: "Dec", value: 78 },
];

// ─── Weekly Data (Mon–Sun per month) ─────────────────────────────────────────
const WEEKLY_DATA = {
  Jan: [{ label: "Mon", value: 88 }, { label: "Tue", value: 92 }, { label: "Wed", value: 85 }, { label: "Thu", value: 95 }, { label: "Fri", value: 90 }, { label: "Sat", value: 78 }, { label: "Sun", value: 70 }],
  Feb: [{ label: "Mon", value: 75 }, { label: "Tue", value: 80 }, { label: "Wed", value: 78 }, { label: "Thu", value: 82 }, { label: "Fri", value: 79 }, { label: "Sat", value: 65 }, { label: "Sun", value: 60 }],
  Mar: [{ label: "Mon", value: 70 }, { label: "Tue", value: 74 }, { label: "Wed", value: 72 }, { label: "Thu", value: 76 }, { label: "Fri", value: 73 }, { label: "Sat", value: 60 }, { label: "Sun", value: 55 }],
  Apr: [{ label: "Mon", value: 65 }, { label: "Tue", value: 68 }, { label: "Wed", value: 70 }, { label: "Thu", value: 66 }, { label: "Fri", value: 72 }, { label: "Sat", value: 58 }, { label: "Sun", value: 50 }],
  May: [{ label: "Mon", value: 82 }, { label: "Tue", value: 85 }, { label: "Wed", value: 88 }, { label: "Thu", value: 84 }, { label: "Fri", value: 86 }, { label: "Sat", value: 74 }, { label: "Sun", value: 68 }],
  Jun: [{ label: "Mon", value: 74 }, { label: "Tue", value: 77 }, { label: "Wed", value: 75 }, { label: "Thu", value: 79 }, { label: "Fri", value: 76 }, { label: "Sat", value: 63 }, { label: "Sun", value: 58 }],
  Jul: [{ label: "Mon", value: 58 }, { label: "Tue", value: 62 }, { label: "Wed", value: 60 }, { label: "Thu", value: 64 }, { label: "Fri", value: 61 }, { label: "Sat", value: 50 }, { label: "Sun", value: 45 }],
  Aug: [{ label: "Mon", value: 63 }, { label: "Tue", value: 66 }, { label: "Wed", value: 65 }, { label: "Thu", value: 68 }, { label: "Fri", value: 67 }, { label: "Sat", value: 55 }, { label: "Sun", value: 50 }],
  Sep: [{ label: "Mon", value: 52 }, { label: "Tue", value: 56 }, { label: "Wed", value: 54 }, { label: "Thu", value: 58 }, { label: "Fri", value: 55 }, { label: "Sat", value: 45 }, { label: "Sun", value: 40 }],
  Oct: [{ label: "Mon", value: 68 }, { label: "Tue", value: 72 }, { label: "Wed", value: 70 }, { label: "Thu", value: 74 }, { label: "Fri", value: 71 }, { label: "Sat", value: 60 }, { label: "Sun", value: 55 }],
  Nov: [{ label: "Mon", value: 60 }, { label: "Tue", value: 63 }, { label: "Wed", value: 62 }, { label: "Thu", value: 65 }, { label: "Fri", value: 63 }, { label: "Sat", value: 52 }, { label: "Sun", value: 48 }],
  Dec: [{ label: "Mon", value: 76 }, { label: "Tue", value: 79 }, { label: "Wed", value: 78 }, { label: "Thu", value: 81 }, { label: "Fri", value: 80 }, { label: "Sat", value: 68 }, { label: "Sun", value: 62 }],
};

const MONTH_KEYS = Object.keys(WEEKLY_DATA);

// ─── All Courses ──────────────────────────────────────────────────────────────
const ALL_COURSES = [
  { tags: ["PHYSICS", "CORE"],     tagColors: [T.blue, T.purple],  pct: 84, title: "Advanced Physics",        desc: "Quantum mechanics and electromagnetism principles for advanced study.",             time: "Next: Mon 10:30 AM" },
  { tags: ["ARTS", "ELECTIVE"],    tagColors: [T.amber, T.green],  pct: 62, title: "Digital Literature",      desc: "Analyzing narrative structures in the age of interactive storytelling.",           time: "Next: Wed 02:00 PM" },
  { tags: ["MATH", "CORE"],        tagColors: [T.purple, T.blue],  pct: 91, title: "Vector Calculus",         desc: "Multivariable calculus, gradients, divergence, and Stokes' theorem.",              time: "Next: Tue 09:00 AM" },
  { tags: ["CS", "ELECTIVE"],      tagColors: [T.green, T.amber],  pct: 57, title: "Algorithms & Complexity", desc: "Big-O analysis, sorting algorithms, graph theory, and NP-completeness.",           time: "Next: Thu 11:00 AM" },
  { tags: ["HISTORY", "ELECTIVE"], tagColors: [T.red, T.gray],     pct: 73, title: "Modern World History",    desc: "20th century geopolitics, decolonisation, and the Cold War.",                     time: "Next: Fri 01:00 PM" },
  { tags: ["CHEM", "CORE"],        tagColors: [T.amber, T.purple], pct: 45, title: "Organic Chemistry",       desc: "Reaction mechanisms, stereochemistry, and spectroscopic identification methods.", time: "Next: Mon 02:30 PM" },
];

// ─── All Activities ───────────────────────────────────────────────────────────
const ALL_ACTIVITIES = [
  { iconBg: T.purpleLight, icon: "💬", title: "Feedback Received",     body: "Prof. Richards left a comment on your Thermodynamics Paper.",           time: "2 HOURS AGO" },
  { iconBg: T.amberLight,  icon: "⭐", title: "Rank Updated",           body: "You've been promoted to the Gold Tier based on recent quiz scores.",    time: "YESTERDAY"   },
  { iconBg: T.purpleLight, icon: "🔒", title: "Assignment Submitted",   body: "Vector Calculus: Module 4 Problem Set was successfully uploaded.",      time: "OCT 12"      },
  { iconBg: T.blueLight,   icon: "📘", title: "New Material Available", body: "Chapter 9 notes for Advanced Physics have been published by Dr. Chen.", time: "OCT 11"      },
  { iconBg: T.greenLight,  icon: "✅", title: "Quiz Completed",         body: "You scored 94% on the Organic Chemistry Mid-Term Practice Quiz.",       time: "OCT 10"      },
  { iconBg: T.redLight,    icon: "⚠️", title: "Deadline Reminder",      body: "Architectural Ethics final draft is due in 3 days. Review now.",        time: "OCT 9"       },
  { iconBg: T.amberLight,  icon: "🏅", title: "Badge Earned",           body: "You earned the 'Consistent Learner' 30-day badge. Keep it up!",        time: "OCT 8"       },
  { iconBg: T.purpleLight, icon: "👥", title: "Group Session Joined",   body: "You joined the Physics Finals study group. Session recorded.",          time: "OCT 7"       },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Bell: ({ c = T.gray, s = 20 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  Msg: ({ c = T.gray, s = 20 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  TrendUp: ({ c = T.green, s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="17 6 23 6 23 12" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Globe: ({ c = T.purple, s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2" />
      <Line x1="2" y1="12" x2="22" y2="12" stroke={c} strokeWidth="2" />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={c} strokeWidth="2" />
    </Svg>
  ),
  Flask: ({ c = T.amber, s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M9 3h6v9l4 9H5l4-9V3z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="3" x2="15" y2="3" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  Play: ({ c = T.white, s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Polygon points="5,3 19,12 5,21" fill={c} />
    </Svg>
  ),
  Clock: ({ c = T.grayLight, s = 12 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2" />
      <Polyline points="12,6 12,12 16,14" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  ChevRight: ({ c = T.purple, s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Close: ({ c = T.gray, s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  Dots: ({ c = T.grayLight, s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Circle cx="12" cy="5"  r="1.5" fill={c} />
      <Circle cx="12" cy="12" r="1.5" fill={c} />
      <Circle cx="12" cy="19" r="1.5" fill={c} />
    </Svg>
  ),
  Edit: ({ c = T.purple, s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  Users: ({ c = T.purple, s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={c} strokeWidth="2" />
      <Circle cx="9" cy="7" r="4" stroke={c} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={c} strokeWidth="2" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={c} strokeWidth="2" />
    </Svg>
  ),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ badge, badgeColor, badgeBg, title, value, sub, accent, icon, progress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={[s.statCard, { borderTopColor: accent, borderTopWidth: 3 }]}>
      <View style={s.statCardTop}>
        <View style={[s.statIconCircle, { backgroundColor: accent + "1a" }]}>{icon}</View>
        {badge != null && (
          <View style={[s.badge, { backgroundColor: badgeBg }]}>
            <Text style={[s.badgeTxt, { color: badgeColor }]}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={s.statTitle}>{title}</Text>
      <Text style={[s.statValue, { color: accent }]}>{value}</Text>
      {sub && <Text style={s.statSub}>{sub}</Text>}
      {progress != null && (
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: accent }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function BarChart({ data, highlightLast = false }) {
  const isMobile = IS_MOBILE();
  const max      = Math.max(...data.map(d => d.value));
  const chartH   = isMobile ? 80 : 100;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[s.chartRow, { minWidth: data.length * (isMobile ? 36 : 46) }]}>
        {data.map((d, i) => {
          const highlighted = highlightLast && i === data.length - 1;
          const barH        = Math.round((d.value / max) * chartH);
          return (
            <TouchableOpacity key={`${d.label}-${i}`} activeOpacity={0.8} style={s.chartCol}>
              <View style={[s.barBg, { height: chartH }]}>
                <View style={[s.bar, { height: barH, backgroundColor: highlighted ? T.purple : T.purplePale }]} />
              </View>
              <Text style={[s.barLabel, highlighted && s.barLabelActive]}>{d.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function MonthPicker({ selectedMonth, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {MONTH_KEYS.map((m) => (
          <TouchableOpacity
            key={m} activeOpacity={0.75} onPress={() => onSelect(m)}
            style={[s.monthPill, selectedMonth === m && s.monthPillActive]}
          >
            <Text style={[s.monthPillTxt, selectedMonth === m && s.monthPillActiveTxt]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function CourseCard({ tags, tagColors, pct, title, desc, time }) {
  return (
    <TouchableOpacity activeOpacity={0.88} style={s.courseCard}>
      <View style={s.courseHeader}>
        <View style={{ flexDirection: "row", gap: 4, flex: 1, flexWrap: "wrap" }}>
          {tags.map((t, i) => (
            <View key={t} style={[s.courseTag, { backgroundColor: tagColors[i] + "22" }]}>
              <Text style={[s.courseTagTxt, { color: tagColors[i] }]}>{t}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.coursePct, { color: pct >= 80 ? T.green : T.amber }]}>{pct}%</Text>
      </View>
      <Text style={s.courseTitle}>{title}</Text>
      <Text style={s.courseDesc} numberOfLines={2}>{desc}</Text>
      <View style={s.courseProgressBg}>
        <View style={[s.courseProgressFill, { width: `${pct}%`, backgroundColor: pct >= 80 ? T.green : T.amber }]} />
      </View>
      <View style={s.courseFooter}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Icon.Clock />
          <Text style={s.courseTime}>{time}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} style={s.playBtn}>
          <Icon.Play />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ActivityItem({ iconBg, icon, title, body, time }) {
  return (
    <View style={s.activityItem}>
      <View style={[s.activityIconCircle, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.activityTitle}>{title}</Text>
        <Text style={s.activityBody}>{body}</Text>
        <Text style={s.activityTime}>{time}</Text>
      </View>
    </View>
  );
}

function FullModal({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{title}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={s.closeBtn}>
              <Icon.Close c={T.gray} s={18} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const isMobile = IS_MOBILE();

  const [chartMode,     setChartMode]     = useState("Monthly");
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  const [showAllCourses,    setShowAllCourses]    = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);

  const chartData     = chartMode === "Monthly" ? MONTHLY_DATA : WEEKLY_DATA[selectedMonth];
  const chartSubLabel = chartMode === "Monthly"
    ? "All months — Jan to Dec"
    : `Week at a glance — ${selectedMonth} 2024`;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={isMobile ? s.scrollContentMobile : s.scrollContent}
    >
      {/* ── Top Bar ── */}
      <View style={[s.topbar, isMobile && s.topbarMobile]}>
        <View style={s.topbarRight}>
          
        </View>
      </View>

      {/* ── Welcome ── */}
      <View style={s.welcomeBox}>
        <Text style={[s.welcomeTxt, isMobile && s.welcomeTxtMobile]}>
          Welcome back, Alex.{"  "}
          <Text style={s.welcomeAccent}>You're in the top 5%</Text>
          {"  "}of your class this term.
        </Text>
      </View>

      {/* ── Two-column layout ── */}
      <View style={[s.mainRow, isMobile && s.mainRowMobile]}>

        {/* ════ LEFT COLUMN ════ */}
        <View style={[s.leftCol, isMobile && s.fullWidth]}>

          {/* Stat Cards */}
          <View style={[s.statRow, isMobile && s.statRowMobile]}>
            <StatCard
              badge="+0.4 MoM" badgeColor={T.green} badgeBg={T.greenLight}
              title="GPA GROWTH" value="3.88" accent={T.green}
              icon={<Icon.TrendUp c={T.green} />}
            />
            <StatCard
              badge="Elite" badgeColor={T.white} badgeBg={T.purple}
              title="STANDINGS" value="#12" sub="Global" accent={T.purple}
              icon={<Icon.Globe c={T.purple} />}
            />
            <StatCard
              title="CURRENT FOCUS" value="Science" accent={T.amber}
              progress={78} icon={<Icon.Flask c={T.amber} />}
            />
          </View>

          {/* Academic Growth Chart */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>Academic Growth</Text>
                <Text style={s.cardSub}>{chartSubLabel}</Text>
              </View>
              <View style={s.toggleRow}>
                {["Monthly", "Weekly"].map((m) => (
                  <TouchableOpacity
                    key={m} activeOpacity={0.7} onPress={() => setChartMode(m)}
                    style={[s.toggleBtn, chartMode === m && s.toggleActive]}
                  >
                    <Text style={[s.toggleTxt, chartMode === m && s.toggleActiveTxt]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {chartMode === "Weekly" && (
              <MonthPicker selectedMonth={selectedMonth} onSelect={setSelectedMonth} />
            )}
            <BarChart data={chartData} highlightLast={chartMode === "Monthly"} />
          </View>

          {/* Ongoing Courses */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>Ongoing Courses</Text>
              <TouchableOpacity activeOpacity={0.7} style={s.viewAllBtn} onPress={() => setShowAllCourses(true)}>
                <Text style={s.viewAllTxt}>View All</Text>
                <Icon.ChevRight />
              </TouchableOpacity>
            </View>
            <View style={[s.coursesRow, isMobile && s.coursesCol]}>
              {ALL_COURSES.slice(0, 2).map((c, i) => (
                <CourseCard key={i} {...c} />
              ))}
            </View>
          </View>

        </View>{/* end left col */}

        {/* ════ RIGHT COLUMN ════ */}
        <View style={[s.rightCol, isMobile && s.fullWidth]}>

          {/* Recent Activity */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>Recent Activity</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Icon.Dots />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 16 }}>
              {ALL_ACTIVITIES.slice(0, 3).map((a, i) => (
                <ActivityItem key={i} {...a} />
              ))}
            </View>
            <TouchableOpacity activeOpacity={0.8} style={s.viewAllFullBtn} onPress={() => setShowAllActivities(true)}>
              <Text style={s.viewAllFullTxt}>View All Activity</Text>
            </TouchableOpacity>
          </View>
          
        </View>{/* end right col */}
      </View>{/* end mainRow */}

      {/* ── Modal: All Courses ── */}
      <FullModal
        visible={showAllCourses}
        onClose={() => setShowAllCourses(false)}
        title={`All Courses (${ALL_COURSES.length})`}
      >
        <View style={[s.allCoursesGrid, isMobile && s.allCoursesGridMobile]}>
          {ALL_COURSES.map((c, i) => (
            <CourseCard key={i} {...c} />
          ))}
        </View>
      </FullModal>

      {/* ── Modal: All Activities ── */}
      <FullModal
        visible={showAllActivities}
        onClose={() => setShowAllActivities(false)}
        title={`All Activity (${ALL_ACTIVITIES.length})`}
      >
        <View style={{ gap: 18, marginTop: 4 }}>
          {ALL_ACTIVITIES.map((a, i) => (
            <ActivityItem key={i} {...a} />
          ))}
        </View>
      </FullModal>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll:              { flex: 1, backgroundColor: T.grayBg },
  scrollContent:       { padding: 28, paddingBottom: 48 },
  scrollContentMobile: { padding: 16, paddingBottom: 40 },

  mainRow:       { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  mainRowMobile: { flexDirection: "column" },
  leftCol:       { flex: 1.6, gap: 20 },
  rightCol:      { flex: 1,   gap: 20 },
  fullWidth:     { width: "100%" },

  topbar:          { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" },
  topbarMobile:    { flexDirection: "column", alignItems: "stretch" },
  searchBox:       { flex: 1, backgroundColor: T.white, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: T.border },
  searchBoxMobile: { flex: 0, width: "100%" },
  searchTxt:       { fontSize: 13, color: T.grayLight },
  topbarRight:     { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: T.white, borderWidth: 1, borderColor: T.border,
    alignItems: "center", justifyContent: "center",
  },
  dot: {
    position: "absolute", top: 7, right: 7,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: T.red, borderWidth: 1.5, borderColor: T.white,
  },
  termBtn:  { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: T.white, borderWidth: 1, borderColor: T.border },
  termTxt:  { fontSize: 12.5, fontWeight: "600", color: T.ink },

  welcomeBox:       { marginBottom: 24 },
  welcomeTxt:       { fontSize: 30, fontWeight: "700", color: T.ink, lineHeight: 40 },
  welcomeTxtMobile: { fontSize: 22, lineHeight: 30 },
  welcomeAccent:    { color: T.purple },

  card: {
    backgroundColor: T.white, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: T.border,
    ...Platform.select({
      ios:     { shadowColor: T.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
      web:     { boxShadow: "0 4px 20px rgba(91,79,207,0.07)" },
    }),
  },
  cardHead:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: T.ink },
  cardSub:   { fontSize: 11.5, color: T.grayLight, marginTop: 2 },

  statRow:       { flexDirection: "row", gap: 12 },
  statRowMobile: { flexDirection: "column" },
  statCard: {
    flex: 1, backgroundColor: T.white, borderRadius: 14, padding: 16, gap: 4,
    borderWidth: 1, borderColor: T.border,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
      web:     { boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
    }),
  },
  statCardTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  statIconCircle: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  badge:          { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt:       { fontSize: 10, fontWeight: "700" },
  statTitle:      { fontSize: 9.5, fontWeight: "700", color: T.grayLight, letterSpacing: 0.6 },
  statValue:      { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  statSub:        { fontSize: 11, color: T.grayLight, fontWeight: "500" },
  progressBg:     { height: 4, borderRadius: 4, backgroundColor: T.grayBg, marginTop: 6, overflow: "hidden" },
  progressFill:   { height: 4, borderRadius: 4 },

  chartRow:       { flexDirection: "row", alignItems: "flex-end", paddingTop: 8, gap: 4 },
  chartCol:       { alignItems: "center", gap: 6, width: 40 },
  barBg:          { width: 28, justifyContent: "flex-end", borderRadius: 6, backgroundColor: T.grayBg, overflow: "hidden" },
  bar:            { width: "100%", borderRadius: 6 },
  barLabel:       { fontSize: 10, color: T.grayLight, fontWeight: "500" },
  barLabelActive: { color: T.purple, fontWeight: "700" },

  monthPill:          { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: T.purplePale, borderWidth: 1, borderColor: T.border },
  monthPillActive:    { backgroundColor: T.purple },
  monthPillTxt:       { fontSize: 11, fontWeight: "600", color: T.purple },
  monthPillActiveTxt: { color: T.white },

  toggleRow:       { flexDirection: "row", backgroundColor: T.grayBg, borderRadius: 8, padding: 3 },
  toggleBtn:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  toggleActive:    { backgroundColor: T.white, ...Platform.select({ web: { boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } }) },
  toggleTxt:       { fontSize: 12, color: T.gray, fontWeight: "500" },
  toggleActiveTxt: { color: T.ink, fontWeight: "700" },

  coursesRow:           { flexDirection: "row", gap: 12 },
  coursesCol:           { flexDirection: "column" },
  allCoursesGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  allCoursesGridMobile: { flexDirection: "column" },
  courseCard: {
    flex: 1, minWidth: 180,
    backgroundColor: T.grayBg, borderRadius: 12,
    padding: 14, gap: 6, borderWidth: 1, borderColor: T.border,
  },
  courseHeader:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  courseTag:          { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  courseTagTxt:       { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  coursePct:          { fontSize: 18, fontWeight: "800" },
  courseTitle:        { fontSize: 14, fontWeight: "700", color: T.ink },
  courseDesc:         { fontSize: 11.5, color: T.gray, lineHeight: 16 },
  courseProgressBg:   { height: 3, borderRadius: 3, backgroundColor: T.border, marginVertical: 4, overflow: "hidden" },
  courseProgressFill: { height: 3, borderRadius: 3 },
  courseFooter:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  courseTime:         { fontSize: 10.5, color: T.grayLight },
  playBtn:            { width: 28, height: 28, borderRadius: 14, backgroundColor: T.purple, alignItems: "center", justifyContent: "center" },

  viewAllBtn:     { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllTxt:     { fontSize: 12.5, fontWeight: "600", color: T.purple },
  viewAllFullBtn: { marginTop: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: T.grayBg, alignItems: "center", borderWidth: 1, borderColor: T.border },
  viewAllFullTxt: { fontSize: 13, fontWeight: "600", color: T.ink },

  activityItem:       { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  activityIconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  activityTitle:      { fontSize: 12.5, fontWeight: "700", color: T.ink, marginBottom: 2 },
  activityBody:       { fontSize: 11.5, color: T.gray, lineHeight: 16 },
  activityTime:       { fontSize: 10, color: T.grayLight, fontWeight: "600", marginTop: 4, letterSpacing: 0.4 },

  deadlineBanner:  { backgroundColor: T.purple, borderRadius: 16, padding: 20, gap: 8 },
  deadlineTag:     { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  deadlineTagTxt:  { fontSize: 9, fontWeight: "800", color: T.white, letterSpacing: 0.6 },
  deadlineTitle:   { fontSize: 18, fontWeight: "800", color: T.white },
  deadlineBody:    { fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 17 },
  reviewBtn:       { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.white, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignSelf: "flex-start", marginTop: 4 },
  reviewBtnTxt:    { fontSize: 13, fontWeight: "700", color: T.purple },

  studyGroupRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  avatarStack:     { flexDirection: "row" },
  stackAvatar:     { width: 28, height: 28, borderRadius: 14, backgroundColor: T.purpleMid, borderWidth: 2, borderColor: T.white, alignItems: "center", justifyContent: "center" },
  stackAvatarTxt:  { fontSize: 9, fontWeight: "800", color: T.white },
  onlineCount:     { fontSize: 12, fontWeight: "600", color: T.gray },
  studyGroupTitle: { fontSize: 14, fontWeight: "700", color: T.ink },
  studyGroupBody:  { fontSize: 12, color: T.gray, lineHeight: 17, marginTop: 2 },
  joinBtn:         { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: T.purplePale, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignSelf: "stretch", justifyContent: "center", marginTop: 12, backgroundColor: T.purpleLight },
  joinBtnTxt:      { fontSize: 13, fontWeight: "700", color: T.purple },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: T.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: "88%",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 12 },
      web:     { boxShadow: "0 -4px 32px rgba(0,0,0,0.12)" },
    }),
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  modalTitle:  { fontSize: 16, fontWeight: "700", color: T.ink },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: T.grayBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border },
});