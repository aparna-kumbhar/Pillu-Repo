// AcademicPulse.js
// ─────────────────────────────────────────────────────────────────────────────
// Academic Pulse — Feedback page
// React Native (iOS / Android / Web via react-native-web)
// Matches the screenshot design pixel-closely.
//
// Dependencies:
//   • react-native / react-native-web
//   • react-native-svg  →  npx expo install react-native-svg
//
// Usage:
//   import AcademicPulse from './AcademicPulse';
//   <AcademicPulse />
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from "react-native-svg";

// ─── Responsive ──────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");
const IS_MOBILE = SCREEN_W < 768;

// ─── Theme ───────────────────────────────────────────────────────────────────

const T = {
  purple:       "#5b4fcf",
  purpleLight:  "#f0eeff",
  purpleMid:    "#7c6cf0",
  purpleDark:   "#3d34a0",
  purpleBadge:  "#ede9fe",
  gray:         "#6b7280",
  grayLight:    "#9ca3af",
  grayBorder:   "#e5e7eb",
  grayBg:       "#f3f4f6",
  ink:          "#111827",
  subtext:      "#6b7280",
  white:        "#ffffff",
  pageBg:       "#f9fafb",
  star:         "#5b4fcf",
  green:        "#16a34a",
  tagBg:        "#f3f4f6",
  tagText:      "#374151",
};

// ─── Icons ───────────────────────────────────────────────────────────────────

const StarIcon = ({ size = 12, color = T.star }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Polygon
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
      fill={color}
      stroke={color}
      strokeWidth="1"
    />
  </Svg>
);

const TrendIcon = ({ color = T.purple }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16,7 22,7 22,13" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BoltIcon = ({ color = T.purple }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronUpDown = ({ color = T.gray }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M7 15l5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 9l5-5 5 5"  stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Avatar placeholder ───────────────────────────────────────────────────────

const Avatar = ({ initials, size = 48, bg = T.purpleLight, fg = T.purple }) => (
  <View style={{
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: bg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: T.grayBorder,
  }}>
    <Text style={{ fontSize: size * 0.3, fontWeight: "700", color: fg }}>{initials}</Text>
  </View>
);

// ─── Rating badge ─────────────────────────────────────────────────────────────

const RatingBadge = ({ value }) => (
  <View style={styles.ratingBadge}>
    <StarIcon size={11} color={T.purple} />
    <Text style={styles.ratingText}>{value}</Text>
  </View>
);

// ─── Tag chip ─────────────────────────────────────────────────────────────────

const Tag = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

// ─── Feedback card ───────────────────────────────────────────────────────────

const FeedbackCard = ({ initials, name, department, rating, quote, tags, avatarBg }) => (
  <View style={styles.feedbackCard}>
    <View style={styles.feedbackTop}>
      {/* Left: avatar + name */}
      <View style={styles.feedbackLeft}>
        <Avatar initials={initials} size={50} bg={avatarBg || T.purpleLight} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.feedbackName}>{name}</Text>
          <Text style={styles.feedbackDept}>{department}</Text>
        </View>
      </View>
      {/* Right: rating */}
      <RatingBadge value={rating} />
    </View>

    {/* Quote */}
    <Text style={styles.feedbackQuote}>"{quote}"</Text>

    {/* Tags */}
    <View style={styles.tagRow}>
      {tags.map((t) => <Tag key={t} label={t} />)}
    </View>
  </View>
);

// ─── Feedback data ────────────────────────────────────────────────────────────

const FEEDBACK_DATA = [
  {
    initials:   "JV",
    name:       "Dr. Julian Vance",
    department: "THEORETICAL PHYSICS",
    rating:     "4.9",
    quote:      "The clarity of course objectives has improved significantly this semester. Students are engaging more deeply with the advanced mechanics modules.",
    tags:       ["CURRICULUM", "ENGAGEMENT"],
    avatarBg:   "#fde8d8",
  },
  {
    initials:   "SJ",
    name:       "Prof. Sarah Jenkins",
    department: "DIGITAL HUMANITIES",
    rating:     "4.7",
    quote:      "Feedback loops are becoming more efficient. I'm seeing a 15% increase in submission quality after the new rubric implementation.",
    tags:       ["EFFICIENCY", "EVALUATION"],
    avatarBg:   "#dbeafe",
  },
  {
    initials:   "EK",
    name:       "Ms. Elena Kostic",
    department: "MODERN LANGUAGES",
    rating:     "4.8",
    quote:      "The interactive labs have been a game changer for conversational practice. Highly recommend expanding this to the freshman year.",
    tags:       ["INTERACTIVE", "LABS"],
    avatarBg:   "#fce7f3",
  },
];

const SUBJECTS = [
  "Academic Curriculum",
  "Course Design",
  "Student Engagement",
  "Assessment Methods",
  "Faculty Development",
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AcademicPulse() {
  const [feedbackText,    setFeedbackText]    = useState("");
  const [subject,         setSubject]         = useState("Academic Curriculum");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleSubmit = () => {
    if (!feedbackText.trim()) {
      Alert.alert("Empty", "Please enter your feedback before submitting.");
      return;
    }
    Alert.alert("Submitted!", "Thank you for your feedback.");
    setFeedbackText("");
  };

  const handleGenerateSummary = () => {
    Alert.alert("Generating…", "Building Q3 qualitative summary report.");
  };

  // ── Two-column layout on desktop, stacked on mobile ──────────────────────
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Page heading ── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Academic Pulse</Text>
        <Text style={styles.pageSubtitle}>
          Gathering institutional sentiment and qualitative feedback to drive curriculum excellence.
        </Text>
      </View>

      {/* ── Body: left feed + right panel ── */}
      <View style={[styles.body, IS_MOBILE && { flexDirection: "column" }]}>

        {/* ════ LEFT: Recent Feedback feed ════ */}
        <View style={[styles.leftFeed, IS_MOBILE && { width: "100%" }]}>

          {/* Section header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Feedback</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Alert.alert("View All", "Showing all feedback entries.")}
              accessibilityLabel="View all feedback"
              accessibilityRole="button"
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Cards */}
          {FEEDBACK_DATA.map((item) => (
            <FeedbackCard key={item.name} {...item} />
          ))}

        </View>

        {/* ════ RIGHT: Sidebar panel ════ */}
        <View style={[styles.rightPanel, IS_MOBILE && { width: "100%", marginTop: 24 }]}>

          {/* ── Share Your Thoughts card ── */}
          <View style={styles.panelCard}>
            <Text style={styles.panelTitle}>Share Your Thoughts</Text>

            {/* Subject selector */}
            <Text style={styles.inputLabel}>SELECT SUBJECT</Text>
            <View style={{ position: "relative", zIndex: 10 }}>
              <TouchableOpacity
                style={styles.dropdown}
                activeOpacity={0.8}
                onPress={() => setDropdownVisible(!dropdownVisible)}
                accessibilityLabel="Select subject"
                accessibilityRole="button"
              >
                <Text style={styles.dropdownText}>{subject}</Text>
                <ChevronUpDown color={T.gray} />
              </TouchableOpacity>

              {/* Dropdown options */}
              {dropdownVisible && (
                <View style={styles.dropdownMenu}>
                  {SUBJECTS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.dropdownItem,
                        s === subject && styles.dropdownItemActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => { setSubject(s); setDropdownVisible(false); }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        s === subject && { color: T.purple, fontWeight: "700" },
                      ]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Feedback textarea */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>YOUR FEEDBACK</Text>
            <TextInput
              style={styles.textarea}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="How can we improve the editorial flow?"
              placeholderTextColor={T.grayLight}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {/* Submit button */}
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={handleSubmit}
              accessibilityLabel="Submit feedback"
              accessibilityRole="button"
            >
              <Text style={styles.submitBtnText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>

          {/* ── Metrics row ── */}
          <View style={styles.metricsRow}>

            {/* Clarity Score */}
            <View style={[styles.metricCard, { flex: 1 }]}>
              <View style={styles.metricIconBox}>
                <TrendIcon color={T.purple} />
              </View>
              <Text style={styles.metricLabel}>CLARITY{"\n"}SCORE</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>88%</Text>
                <Text style={styles.metricDelta}> +4.2%</Text>
              </View>
            </View>

            {/* Progress Points */}
            <View style={[styles.metricCard, { flex: 1 }]}>
              <View style={styles.metricIconBox}>
                <BoltIcon color={T.purple} />
              </View>
              <Text style={styles.metricLabel}>PROGRESS{"\n"}POINTS</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>+12</Text>
                <Text style={[styles.metricDelta, { color: T.green }]}> Active</Text>
              </View>
            </View>

          </View>

          {/* ── Curator Note card ── */}
          <View style={styles.curatorCard}>
            <Text style={styles.curatorLabel}>CURATOR NOTE</Text>
            <Text style={styles.curatorNote}>
              Focus on Qualitative analysis for the Q3 Report.
            </Text>
            <TouchableOpacity
              style={styles.generateBtn}
              activeOpacity={0.8}
              onPress={handleGenerateSummary}
              accessibilityLabel="Generate summary"
              accessibilityRole="button"
            >
              <Text style={styles.generateBtnText}>Generate Summary</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: T.pageBg,
  },
  pageContent: {
    padding:       IS_MOBILE ? 16 : 32,
    paddingBottom: 48,
  },

  // ── Page heading
  pageHeader: {
    marginBottom: 28,
  },
  pageTitle: {
    fontSize:     IS_MOBILE ? 28 : 38,
    fontWeight:   "800",
    color:        T.ink,
    letterSpacing: -0.8,
    marginBottom: 8,
    ...Platform.select({
      ios:     { fontFamily: "Georgia" },
      android: { fontFamily: "serif"   },
      web:     { fontFamily: "'Georgia', serif" },
    }),
  },
  pageSubtitle: {
    fontSize:   14,
    color:      T.subtext,
    lineHeight: 22,
    maxWidth:   560,
  },

  // ── Body layout
  body: {
    flexDirection: "row",
    gap:           20,
    alignItems:    "flex-start",
  },

  // ── Left feed
  leftFeed: {
    flex: 1,
  },

  // ── Section header
  sectionHeader: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   16,
  },
  sectionTitle: {
    fontSize:   18,
    fontWeight: "700",
    color:      T.ink,
  },
  viewAll: {
    fontSize:   14,
    fontWeight: "600",
    color:      T.purple,
  },

  // ── Feedback card
  feedbackCard: {
    backgroundColor: T.white,
    borderRadius:    16,
    padding:         20,
    marginBottom:    14,
    borderWidth:     1,
    borderColor:     T.grayBorder,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
      web:     { boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
    }),
  },
  feedbackTop: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   14,
  },
  feedbackLeft: {
    flexDirection: "row",
    alignItems:    "center",
    flex:          1,
    marginRight:   10,
  },
  feedbackName: {
    fontSize:   15,
    fontWeight: "700",
    color:      T.ink,
    marginBottom: 2,
  },
  feedbackDept: {
    fontSize:      10,
    fontWeight:    "700",
    color:         T.grayLight,
    letterSpacing: 0.8,
  },
  ratingBadge: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             4,
    backgroundColor: T.purpleBadge,
    borderRadius:    20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingText: {
    fontSize:   12,
    fontWeight: "700",
    color:      T.purple,
  },
  feedbackQuote: {
    fontSize:   13.5,
    color:      T.subtext,
    lineHeight: 21,
    fontStyle:  "italic",
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           8,
  },
  tag: {
    backgroundColor:   T.tagBg,
    borderRadius:      6,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderWidth:       1,
    borderColor:       T.grayBorder,
  },
  tagText: {
    fontSize:      10,
    fontWeight:    "700",
    color:         T.tagText,
    letterSpacing: 0.6,
  },

  // ── Right panel
  rightPanel: {
    width:     IS_MOBILE ? "100%" : 240,
    flexShrink: 0,
    gap:       14,
  },

  // ── Panel card (Share Your Thoughts)
  panelCard: {
    backgroundColor: T.white,
    borderRadius:    16,
    padding:         20,
    borderWidth:     1,
    borderColor:     T.grayBorder,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
      web:     { boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
    }),
  },
  panelTitle: {
    fontSize:   16,
    fontWeight: "700",
    color:      T.ink,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize:      10,
    fontWeight:    "700",
    color:         T.grayLight,
    letterSpacing: 0.8,
    marginBottom:  7,
  },

  // Dropdown
  dropdown: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    backgroundColor:   T.grayBg,
    borderRadius:      10,
    borderWidth:       1,
    borderColor:       T.grayBorder,
    paddingHorizontal: 12,
    paddingVertical:   11,
  },
  dropdownText: {
    fontSize:   14,
    color:      T.ink,
    flex:       1,
  },
  dropdownMenu: {
    position:        "absolute",
    top:             50,
    left:            0,
    right:           0,
    backgroundColor: T.white,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     T.grayBorder,
    zIndex:          100,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 8 },
      web:     { boxShadow: "0 4px 16px rgba(0,0,0,0.10)" },
    }),
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical:   11,
    borderBottomWidth: 1,
    borderBottomColor: T.grayBorder,
  },
  dropdownItemActive: {
    backgroundColor: T.purpleLight,
  },
  dropdownItemText: {
    fontSize: 13,
    color:    T.ink,
  },

  // Textarea
  textarea: {
    backgroundColor:   T.grayBg,
    borderRadius:      10,
    borderWidth:       1,
    borderColor:       T.grayBorder,
    paddingHorizontal: 12,
    paddingTop:        10,
    paddingBottom:     10,
    fontSize:          14,
    color:             T.ink,
    height:            110,
    ...Platform.select({
      web: { outlineStyle: "none" },
    }),
  },

  // Submit button
  submitBtn: {
    backgroundColor: T.purple,
    borderRadius:    12,
    paddingVertical: 14,
    alignItems:      "center",
    marginTop:       16,
    ...Platform.select({
      ios:     { shadowColor: T.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
      android: { elevation: 6 },
      web:     { boxShadow: "0 4px 16px rgba(91,79,207,0.40)" },
    }),
  },
  submitBtnText: {
    fontSize:   15,
    fontWeight: "700",
    color:      T.white,
  },

  // ── Metrics row
  metricsRow: {
    flexDirection: "row",
    gap:           12,
    marginTop:     2,
  },
  metricCard: {
    backgroundColor: T.white,
    borderRadius:    14,
    padding:         16,
    borderWidth:     1,
    borderColor:     T.grayBorder,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
      web:     { boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
    }),
  },
  metricIconBox: {
    width:           36,
    height:          36,
    borderRadius:    10,
    backgroundColor: T.purpleLight,
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    10,
  },
  metricLabel: {
    fontSize:      9,
    fontWeight:    "700",
    color:         T.grayLight,
    letterSpacing: 0.7,
    marginBottom:  4,
    lineHeight:    14,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems:    "baseline",
  },
  metricValue: {
    fontSize:   22,
    fontWeight: "800",
    color:      T.ink,
  },
  metricDelta: {
    fontSize:   11,
    fontWeight: "700",
    color:      T.purple,
  },

  // ── Curator note card
  curatorCard: {
    backgroundColor: T.purple,
    borderRadius:    16,
    padding:         20,
    marginTop:       2,
  },
  curatorLabel: {
    fontSize:      9,
    fontWeight:    "700",
    color:         "rgba(255,255,255,0.65)",
    letterSpacing: 1.2,
    marginBottom:  10,
  },
  curatorNote: {
    fontSize:   16,
    fontWeight: "700",
    color:      T.white,
    lineHeight: 24,
    marginBottom: 18,
  },
  generateBtn: {
    backgroundColor:   "rgba(255,255,255,0.18)",
    borderRadius:      10,
    paddingVertical:   10,
    paddingHorizontal: 16,
    alignSelf:         "flex-start",
    borderWidth:       1,
    borderColor:       "rgba(255,255,255,0.25)",
  },
  generateBtnText: {
    fontSize:   13,
    fontWeight: "600",
    color:      T.white,
  },
});