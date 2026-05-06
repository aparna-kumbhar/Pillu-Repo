import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB_LARGE = Platform.OS === 'web' && SCREEN_WIDTH > 768;

// ─── Data ───────────────────────────────────────────────────────────────────


const normalizeInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'FB';
  }
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'FB';
};

const resolveAccent = (rating = 5) => {
  if (rating >= 4.5) return '#1D9E75';
  if (rating >= 3.5) return '#185FA5';
  return '#B45309';
};


// ─── Sub-components ──────────────────────────────────────────────────────────

const Avatar = ({ initials, color, bg, size = 44 }) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
    <Text style={[styles.avatarText, { color, fontSize: size * 0.32 }]}>{initials}</Text>
  </View>
);

const StarRating = ({ rating }) => (
  <View style={styles.starRow}>
    <Text style={styles.star}>★</Text>
    <Text style={styles.ratingText}>{rating.toFixed(2)}</Text>
  </View>
);

const FacultyCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={[styles.facultyCard, IS_WEB_LARGE && styles.facultyCardWeb]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.facultyImageBox, { backgroundColor: item.bg }]}>
      <Text style={[styles.facultyInitialsBig, { color: item.color }]}>{item.initials}</Text>
    </View>
    <Text style={styles.facultyName}>{item.name}</Text>
    <StarRating rating={item.rating} />
  </TouchableOpacity>
);

const InsightCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={[styles.insightCard, { borderLeftColor: item.accent }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={styles.insightHeader}>
      <Avatar initials={item.initials} color={item.color} bg={item.bg} size={40} />
      <View style={styles.insightMeta}>
        <Text style={styles.insightName}>{item.name}</Text>
        <Text style={styles.insightCourse}>{item.course}</Text>
      </View>
    </View>
    <Text style={styles.insightSubject}>{item.subject}</Text>
    <Text style={styles.insightQuote}>{item.quote}</Text>
  </TouchableOpacity>
);

const BottomNav = ({ active, onPress }) => (
  <View style={styles.bottomNav}>
    {NAV_ITEMS.map((item) => {
      const isActive = item.key === active;
      return (
        <TouchableOpacity
          key={item.key}
          style={styles.navItem}
          onPress={() => onPress(item.key)}
          activeOpacity={0.7}
        >
          <View style={[styles.navIcon, isActive && styles.navIconActive]} />
          <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
            {item.label.toUpperCase()}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function Feedback({ instituteId = '', instituteName = '' }) {
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadFeedback = async () => {
      const resolvedInstituteId = (instituteId || '').trim();
      if (!resolvedInstituteId) {
        setFeedbackItems([]);
        setErrorMessage('Institute context is missing.');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const { response } = await fetchWithBaseUrlFallback(
          `/api/feedback?instituteId=${encodeURIComponent(resolvedInstituteId)}`
        );
        const payload = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(payload?.message || `Request failed (${response.status})`);
        }

        const normalized = Array.isArray(payload)
          ? payload.map((item, index) => ({
              id: item?._id || `feedback-${index}`,
              name: item?.studentName || 'Student',
              subject: item?.subject || 'General',
              initials: normalizeInitials(item?.studentName || item?.studentId || 'Student'),
              color: '#0F6E56',
              bg: index % 2 === 0 ? '#E1F5EE' : '#E6F1FB',
              accent: resolveAccent(Number(item?.rating || 5)),
              rating: Number(item?.rating || 5),
              quote: item?.feedbackText || '-',
              department: item?.department || '',
              createdAt: item?.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '-',
            }))
          : [];

        setFeedbackItems(normalized);
      } catch (error) {
        setFeedbackItems([]);
        setErrorMessage(error?.message || 'Failed to fetch feedback');
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [instituteId]);

  const containerStyle = IS_WEB_LARGE ? styles.containerWeb : styles.containerMobile;

  const renderItem = ({ item }) => (
    <InsightCard
      item={item}
      onPress={() => console.log('Feedback pressed:', item.name)}
    />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.root, containerStyle]}>

        <FlatList
          data={feedbackItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={(
            <View>
              <Text style={styles.overviewLabel}>OVERVIEW</Text>
              <Text style={styles.pageTitle}>{instituteName ? `${instituteName} Feedback` : 'Student Feedback'}</Text>

              <View style={styles.insightsTitleRow}>
                <View style={styles.insightsIcon}>
                  <Text style={styles.insightsIconText}>📊</Text>
                </View>
                <Text style={styles.sectionTitle}>Student Insights</Text>
              </View>

              {errorMessage ? (
                <View style={styles.stateBox}>
                  <Text style={styles.stateText}>{errorMessage}</Text>
                </View>
              ) : null}

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={TEAL} />
                  <Text style={styles.loadingText}>Loading feedback...</Text>
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={!loading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No feedback yet</Text>
              <Text style={styles.emptyText}>Student feedback for this institute will appear here once it is submitted.</Text>
            </View>
          ) : null}
          renderItem={renderItem}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />

      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const TEAL       = '#0F6E56';
const TEAL_LIGHT = '#E1F5EE';
const TEXT_PRI   = '#0D1B1E';
const TEXT_SEC   = '#5C6B6E';
const BORDER     = '#E2EAEA';
const WHITE      = '#FFFFFF';
const BG         = '#F2F5F5';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  containerMobile: {
    width: '100%',
    alignSelf: 'center',
  },
  containerWeb: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({ web: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER } }),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: WHITE,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEAL,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_PRI,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  notifBtnPressed: {
    backgroundColor: TEAL_LIGHT,
  },
  notifIcon: {
    fontSize: 18,
  },
  notifIconActive: {
    opacity: 0.7,
  },

  // Body
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: TEAL,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_PRI,
    marginBottom: 24,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEAL,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: TEAL,
  },
  viewAllPressed: {
    opacity: 0.5,
  },
  insightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightsIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsIconText: {
    fontSize: 15,
  },

  // Faculty cards
  facultyList: {
    gap: 14,
    paddingRight: 4,
  },
  facultyCard: {
    width: 148,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 16,
    alignItems: 'center',
  },
  facultyCardWeb: {
    width: 180,
  },
  facultyImageBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  facultyInitialsBig: {
    fontSize: 26,
    fontWeight: '700',
  },
  facultyName: {
    fontSize: 14,
    fontWeight: '600',
    color: TEAL,
    textAlign: 'center',
    marginBottom: 6,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    fontSize: 14,
    color: '#F5A623',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SEC,
  },

  // Avatar
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
  },

  // Insight cards
  insightCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 14,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  insightMeta: {
    flex: 1,
  },
  insightName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRI,
    marginBottom: 2,
  },
  insightCourse: {
    fontSize: 13,
    color: TEXT_SEC,
  },
  insightSubject: {
    fontSize: 12,
    fontWeight: '700',
    color: TEAL,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  insightQuote: {
    fontSize: 15,
    color: TEXT_PRI,
    lineHeight: 22,
  },

  stateBox: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 14,
    marginTop: 14,
    marginBottom: 4,
  },
  stateText: {
    fontSize: 14,
    color: TEXT_SEC,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 14,
    color: TEXT_SEC,
  },
  emptyBox: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 18,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRI,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_SEC,
    lineHeight: 20,
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navIcon: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#D0DADA',
  },
  navIconActive: {
    backgroundColor: TEAL,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: TEXT_SEC,
  },
  navLabelActive: {
    color: TEAL,
  },
});