// Dashboard.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Modal, StyleSheet, Platform, Dimensions,
} from "react-native";
import Svg, { Rect, Path, Line, Circle, Polyline, Polygon } from "react-native-svg";
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  primary: "#6366f1", // Indigo 500
  primaryLight: "#eef2ff",
  primaryPale: "#f5f7ff",
  secondary: "#10b981", // Emerald 500
  secondaryLight: "#ecfdf5",
  accent: "#f59e0b", // Amber 500
  accentLight: "#fffbeb",
  blue: "#3b82f6",
  blueLight: "#eff6ff",
  red: "#ef4444",
  redLight: "#fef2f2",
  ink: "#0f172a", // Slate 900
  subText: "#64748b", // Slate 500
  grayLight: "#94a3b8", // Slate 400
  white: "#ffffff",
  bg: "#f8fafc", // Slate 50
  border: "#e2e8f0", // Slate 200
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
  { tags: ["PHYSICS", "CORE"], tagColors: [T.blue, T.purple], pct: 84, title: "Advanced Physics", desc: "Quantum mechanics and electromagnetism principles for advanced study.", time: "Next: Mon 10:30 AM" },
  { tags: ["ARTS", "ELECTIVE"], tagColors: [T.amber, T.green], pct: 62, title: "Digital Literature", desc: "Analyzing narrative structures in the age of interactive storytelling.", time: "Next: Wed 02:00 PM" },
  { tags: ["MATH", "CORE"], tagColors: [T.purple, T.blue], pct: 91, title: "Vector Calculus", desc: "Multivariable calculus, gradients, divergence, and Stokes' theorem.", time: "Next: Tue 09:00 AM" },
  { tags: ["CS", "ELECTIVE"], tagColors: [T.green, T.amber], pct: 57, title: "Algorithms & Complexity", desc: "Big-O analysis, sorting algorithms, graph theory, and NP-completeness.", time: "Next: Thu 11:00 AM" },
  { tags: ["HISTORY", "ELECTIVE"], tagColors: [T.red, T.gray], pct: 73, title: "Modern World History", desc: "20th century geopolitics, decolonisation, and the Cold War.", time: "Next: Fri 01:00 PM" },
  { tags: ["CHEM", "CORE"], tagColors: [T.amber, T.purple], pct: 45, title: "Organic Chemistry", desc: "Reaction mechanisms, stereochemistry, and spectroscopic identification methods.", time: "Next: Mon 02:30 PM" },
];

// ─── All Activities ───────────────────────────────────────────────────────────
const ALL_ACTIVITIES = [
  { iconBg: T.purpleLight, icon: "💬", title: "Feedback Received", body: "Prof. Richards left a comment on your Thermodynamics Paper.", time: "2 HOURS AGO" },
  { iconBg: T.amberLight, icon: "⭐", title: "Rank Updated", body: "You've been promoted to the Gold Tier based on recent quiz scores.", time: "YESTERDAY" },
  { iconBg: T.purpleLight, icon: "🔒", title: "Assignment Submitted", body: "Vector Calculus: Module 4 Problem Set was successfully uploaded.", time: "OCT 12" },
  { iconBg: T.blueLight, icon: "📘", title: "New Material Available", body: "Chapter 9 notes for Advanced Physics have been published by Dr. Chen.", time: "OCT 11" },
  { iconBg: T.greenLight, icon: "✅", title: "Quiz Completed", body: "You scored 94% on the Organic Chemistry Mid-Term Practice Quiz.", time: "OCT 10" },
  { iconBg: T.redLight, icon: "⚠️", title: "Deadline Reminder", body: "Architectural Ethics final draft is due in 3 days. Review now.", time: "OCT 9" },
  { iconBg: T.amberLight, icon: "🏅", title: "Badge Earned", body: "You earned the 'Consistent Learner' 30-day badge. Keep it up!", time: "OCT 8" },
  { iconBg: T.purpleLight, icon: "👥", title: "Group Session Joined", body: "You joined the Physics Finals study group. Session recorded.", time: "OCT 7" },
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
      <Circle cx="12" cy="5" r="1.5" fill={c} />
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
    <TouchableOpacity activeOpacity={0.85} style={s.statCard}>
      <View style={s.statCardTop}>
        <View style={[s.statIconCircle, { backgroundColor: accent + "15" }]}>{icon}</View>
        {badge != null && (
          <View style={[s.badge, { backgroundColor: badgeBg }]}>
            <Text style={[s.badgeTxt, { color: badgeColor }]}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={s.statTitle}>{title}</Text>
        <Text style={[s.statValue, { color: T.ink }]}>{value}</Text>
        {sub && <Text style={s.statSub}>{sub}</Text>}
        {progress != null && (
          <View style={s.progressContainer}>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: accent }]}>
                <View style={s.progressShimmer} />
              </View>
            </View>
            <Text style={s.progressLabel}>{progress}%</Text>
          </View>
        )}
      </View>
      <View style={[s.statDecoration, { backgroundColor: accent }]} />
    </TouchableOpacity>
  );
}

function BarChart({ data, highlightLast = false }) {
  const isMobile = IS_MOBILE();
  const max = Math.max(...data.map(d => d.value), 10);
  const chartH = isMobile ? 120 : 160;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
      <View style={[s.chartRow, { height: chartH + 45, alignItems: 'flex-end', gap: isMobile ? 8 : 12 }]}>
        {data.map((d, i) => {
          const highlighted = highlightLast && i === data.length - 1;
          const barH = Math.round((d.value / max) * chartH);
          return (
            <TouchableOpacity key={`${d.label}-${i}`} activeOpacity={0.8} style={s.chartCol}>
              {d.rank && (
                <View style={s.rankPill}>
                  <Text style={s.rankPillText}>#{d.rank}</Text>
                </View>
              )}
              <View style={[s.barBg, { height: chartH, width: isMobile ? 24 : 32 }]}>
                <View
                  style={[
                    s.bar,
                    {
                      height: barH,
                      backgroundColor: highlighted ? T.primary : T.primaryPale,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                      borderBottomLeftRadius: 4,
                      borderBottomRightRadius: 4,
                    }
                  ]}
                />
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
        <View style={{ flexDirection: "row", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {tags.map((t, i) => (
            <View key={t} style={[s.courseTag, { backgroundColor: tagColors[i] + "15" }]}>
              <Text style={[s.courseTagTxt, { color: tagColors[i] }]}>{t}</Text>
            </View>
          ))}
        </View>
        <View style={s.coursePctContainer}>
          <Text style={[s.coursePct, { color: pct >= 80 ? T.secondary : T.accent }]}>{pct}%</Text>
        </View>
      </View>
      <Text style={s.courseTitle}>{title}</Text>
      <Text style={s.courseDesc} numberOfLines={2}>{desc}</Text>

      <View style={s.courseProgressWrapper}>
        <View style={s.courseProgressBg}>
          <View style={[s.courseProgressFill, { width: `${pct}%`, backgroundColor: pct >= 80 ? T.secondary : T.accent }]} />
        </View>
      </View>

      <View style={s.courseFooter}>
        <View style={s.courseTimeBox}>
          <Icon.Clock c={T.grayLight} />
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
export default function Dashboard({ student }) {
  const isMobile = IS_MOBILE();

  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState(MONTHLY_DATA);

  const resolvedStudent = student || {};
  const studentId = resolvedStudent._id || resolvedStudent.studentId || "";
  const instituteId = resolvedStudent.instituteId || "";

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId || !instituteId) return;
      setLoading(true);
      try {
        // Fetch Attendance for Streak
        const attRes = await fetchWithBaseUrlFallback(
          `/api/attendance?studentId=${studentId}&instituteId=${instituteId}`,
          { method: "GET" }
        );
        if (attRes.response?.ok) {
          const attData = await attRes.response.json();
          const sorted = attData.sort((a, b) => new Date(b.date) - new Date(a.date));
          let currentStreak = 0;
          for (const entry of sorted) {
            const myAtt = entry.studentsAttendance?.find(s => s.studentId === studentId);
            if (myAtt?.status === "present") {
              currentStreak++;
            } else if (myAtt?.status === "absent") {
              break;
            }
          }
          setStreak(currentStreak);
          setAttendance(attData);
        }

        // Fetch Student Marks
        const marksRes = await fetchWithBaseUrlFallback(
          `/api/marks/student/${studentId}?instituteId=${instituteId}`,
          { method: "GET" }
        );

        const batchId = resolvedStudent.batchId || resolvedStudent.batch || "";
        const batchMarksRes = batchId ? await fetchWithBaseUrlFallback(
          `/api/marks?instituteId=${instituteId}&batchId=${batchId}`,
          { method: "GET" }
        ) : null;

        if (marksRes.response?.ok) {
          const marksData = await marksRes.response.json();
          setMarks(marksData);

          let batchMarksData = [];
          if (batchMarksRes?.response?.ok) {
            batchMarksData = await batchMarksRes.response.json();
          }

          // Calculate Monthly Averages & Ranks
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const stats = months.map((m, i) => {
            const monthMarks = marksData.filter(d => new Date(d.createdAt).getMonth() === i);
            if (monthMarks.length === 0) return { label: m, value: 0 };

            const totalObtained = monthMarks.reduce((acc, curr) => acc + (curr.marks || 0), 0);
            const totalMax = monthMarks.reduce((acc, curr) => acc + (curr.totalMarks || 100), 0);
            const avg = (totalObtained / totalMax) * 100;

            // Calculate monthly rank
            let monthRank = null;
            const monthBatch = batchMarksData.filter(d => new Date(d.createdAt).getMonth() === i);
            if (monthBatch.length > 0) {
              const studentTotals = {};
              monthBatch.forEach(mb => {
                if (!studentTotals[mb.studentId]) {
                  studentTotals[mb.studentId] = { obtained: 0, max: 0 };
                }
                studentTotals[mb.studentId].obtained += mb.marks;
                studentTotals[mb.studentId].max += (mb.totalMarks || 100);
              });
              const ranked = Object.keys(studentTotals).map(sid => ({
                sid,
                pct: (studentTotals[sid].obtained / studentTotals[sid].max) * 100
              })).sort((a, b) => b.pct - a.pct);
              const myIdx = ranked.findIndex(r => r.sid === studentId);
              if (myIdx >= 0) monthRank = myIdx + 1;
            }

            return { label: m, value: Math.round(avg), rank: monthRank };
          });
          setMonthlyStats(stats);
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, instituteId]);

  const latestMark = marks.length > 0 ? marks[marks.length - 1] : null;
  const latestPct = latestMark ? Math.round((latestMark.marks / latestMark.totalMarks) * 100) : 0;

  return (
    <View style={s.pageWrapper}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={isMobile ? s.scrollContentMobile : s.scrollContent}
      >
        {/* ── Welcome ── */}
        <View style={s.welcomeBox}>
          <Text style={[s.welcomeTxt, isMobile && s.welcomeTxtMobile]}>
            Welcome back, <Text style={s.welcomeUser}>{resolvedStudent.studentName || "Student"}</Text>.
          </Text>
          <View style={s.welcomeBadge}>
            <Text style={s.welcomeBadgeTxt}>You're doing great this term!</Text>
          </View>
        </View>

        {/* ── Main Content ── */}
        <View style={[s.mainRow, isMobile && s.mainRowMobile]}>

          {/* ════ LEFT COLUMN ════ */}
          <View style={[s.leftCol, isMobile && s.fullWidth]}>

            {/* Stats */}
            <View style={[s.statRow, isMobile && s.statRowMobile]}>
              <StatCard
                badge="Active" badgeColor={T.white} badgeBg={T.red}
                title="ACTIVE STREAK" value={`${streak} Days`} sub="Continuous attendance" accent={T.red}
                icon={<Text style={{ fontSize: 20 }}>🔥</Text>}
              />
              <StatCard
                title="ATTENDANCE"
                value={`${attendance.length > 0 ? Math.round((attendance.filter(a => a.studentsAttendance?.find(s => s.studentId === studentId)?.status === "present").length / attendance.length) * 100) : 0}%`}
                sub="Overall Present" accent={T.primary}
                icon={<Text style={{ fontSize: 20 }}>📅</Text>}
              />
              <StatCard
                title="LATEST SCORE"
                value={`${latestPct}%`}
                sub={latestMark ? latestMark.examName : "No exams yet"}
                accent={T.accent}
                icon={<Text style={{ fontSize: 20 }}>📊</Text>}
              />
            </View>

            {/* Academic Growth Chart */}
            <View style={s.card}>
              <View style={s.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Academic Growth</Text>
                  <Text style={s.cardSub}>Month-wise average marks percentage</Text>
                </View>
              </View>
              <BarChart data={monthlyStats} highlightLast={true} />
            </View>

          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ─── Styles ───
  pageWrapper: {
    flex: 1,
    backgroundColor: T.bg,
    ...Platform.select({
      web: { height: "100vh" },  // gives a concrete ceiling
    }),
  },

  scroll: {
    flex: 1,
    backgroundColor: T.bg,
    ...Platform.select({
      web: { minHeight: 0 },  // ← THE actual fix: stops flex item stretching past parent
    }),
  },
  scrollContent: { padding: 32, paddingBottom: 48 },
  scrollContentMobile: { padding: 20, paddingBottom: 40 },

  mainRow: { flexDirection: "row", gap: 24, alignItems: "flex-start" },
  mainRowMobile: { flexDirection: "column" },
  leftCol: { flex: 1.8, gap: 24 },
  rightCol: { flex: 1, gap: 24 },
  fullWidth: { width: "100%" },

  topbar: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" },
  topbarMobile: { flexDirection: "column", alignItems: "stretch" },
  topbarRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  welcomeBox: { marginBottom: 32 },
  welcomeTxt: { fontSize: 32, fontWeight: "800", color: T.ink, letterSpacing: -1 },
  welcomeTxtMobile: { fontSize: 26 },
  welcomeUser: { color: T.primary },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.secondary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    gap: 6,
  },
  welcomeBadgeTxt: { color: T.white, fontSize: 13, fontWeight: '700' },

  card: {
    backgroundColor: T.white, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: T.border,
    ...Platform.select({
      ios: { shadowColor: T.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16 },
      android: { elevation: 4 },
      web: { boxShadow: "0 8px 32px rgba(99,102,241,0.06)" },
    }),
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: T.ink, letterSpacing: -0.5, ...Platform.select({ web: { fontFamily: "'Outfit', sans-serif" } }) },
  cardSub: { fontSize: 13, color: T.subText, marginTop: 4 },

  statRow: { flexDirection: "row", gap: 16 },
  statRowMobile: { flexDirection: "column" },
  statCard: {
    flex: 1, backgroundColor: T.white, borderRadius: 20, padding: 20, gap: 4,
    borderWidth: 1, borderColor: T.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: "0 4px 16px rgba(0,0,0,0.04)" },
    }),
  },
  statCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statIconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: "800" },
  statTitle: { fontSize: 11, fontWeight: "700", color: T.grayLight, letterSpacing: 0.8, textTransform: 'uppercase' },
  statValue: { fontSize: 32, fontWeight: "900", letterSpacing: -1, marginTop: 4 },
  statSub: { fontSize: 13, color: T.subText, fontWeight: "500", marginTop: 2 },
  statDecoration: { position: 'absolute', top: 0, right: 0, width: 4, height: '100%', opacity: 0.8 },

  progressContainer: { marginTop: 12, gap: 8 },
  progressBg: { height: 8, borderRadius: 4, backgroundColor: T.primaryPale, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressShimmer: { width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.15)', position: 'absolute' },
  progressLabel: { fontSize: 12, fontWeight: '800', color: T.ink, textAlign: 'right' },

  chartRow: { flexDirection: "row", gap: 12 },
  chartCol: { alignItems: "center", gap: 8 },
  barBg: { justifyContent: "flex-end", borderRadius: 8, backgroundColor: T.primaryPale },
  bar: { width: "100%" },
  barLabel: { fontSize: 11, color: T.grayLight, fontWeight: "600" },
  barLabelActive: { color: T.primary, fontWeight: "800" },

  monthPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: T.white, borderWidth: 1, borderColor: T.border },
  monthPillActive: { backgroundColor: T.primary, borderColor: T.primary },
  monthPillTxt: { fontSize: 12, fontWeight: "700", color: T.subText },
  monthPillActiveTxt: { color: T.white },

  toggleRow: { flexDirection: "row", backgroundColor: T.primaryPale, borderRadius: 12, padding: 4 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  toggleActive: { backgroundColor: T.white, ...Platform.select({ web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" } }) },
  toggleTxt: { fontSize: 13, color: T.subText, fontWeight: "600" },
  toggleActiveTxt: { color: T.primary, fontWeight: "800" },

  coursesRow: { flexDirection: "row", gap: 16 },
  coursesCol: { flexDirection: "column" },
  allCoursesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 8 },
  allCoursesGridMobile: { flexDirection: "column" },
  courseCard: {
    flex: 1, minWidth: 240,
    backgroundColor: T.white, borderRadius: 20,
    padding: 20, gap: 12, borderWidth: 1, borderColor: T.border,
  },
  courseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  courseTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  courseTagTxt: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  coursePctContainer: { backgroundColor: T.primaryPale, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  coursePct: { fontSize: 20, fontWeight: "900" },
  courseTitle: { fontSize: 16, fontWeight: "800", color: T.ink, letterSpacing: -0.4 },
  courseDesc: { fontSize: 13, color: T.subText, lineHeight: 20 },
  courseProgressWrapper: { marginTop: 4 },
  courseProgressBg: { height: 6, borderRadius: 3, backgroundColor: T.primaryPale, overflow: "hidden" },
  courseProgressFill: { height: 6, borderRadius: 3 },
  courseFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  courseTimeBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  courseTime: { fontSize: 12, color: T.grayLight, fontWeight: '600' },
  playBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: T.primary, alignItems: "center", justifyContent: "center", ...Platform.select({ web: { boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)" } }) },

  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewAllTxt: { fontSize: 14, fontWeight: "700", color: T.primary },
  viewAllFullBtn: { marginTop: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: T.primaryPale, alignItems: "center", borderWidth: 1, borderColor: T.primaryLight },
  viewAllFullTxt: { fontSize: 14, fontWeight: "800", color: T.primary },

  activityItem: { flexDirection: "row", gap: 16, alignItems: "center" },
  activityIconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  activityTitle: { fontSize: 14, fontWeight: "800", color: T.ink, marginBottom: 2 },
  activityBody: { fontSize: 13, color: T.subText, lineHeight: 18 },
  activityTime: { fontSize: 11, color: T.grayLight, fontWeight: "700", marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: T.overlay, justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: T.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, maxHeight: "90%",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 16 },
      web: { boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" },
    }),
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  modalTitle: { fontSize: 20, fontWeight: "800", color: T.ink, letterSpacing: -0.5 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border },

  rankPill: {
    backgroundColor: "rgba(99,102,241,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  rankPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: T.primary,
  },
});