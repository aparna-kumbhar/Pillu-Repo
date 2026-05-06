import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  NativeModules,
} from 'react-native';
import Constants from 'expo-constants';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';

import Attendancemark from './Attendancemark';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_LAPTOP = SCREEN_WIDTH >= 1024;
const IS_TABLET = SCREEN_WIDTH >= 768;


// ─── Color Tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F0',
  sidebar: '#FFFFFF',
  sidebarActive: '#F0F2F0',
  primary: '#1B3A4B',
  accent: '#1B3A4B',
  accentText: '#FFFFFF',
  cardBg: '#FFFFFF',
  tagEngineering: '#1B3A4B',
  tagMedical: '#2196A6',
  tagMath: '#C44D2E',
  tagPhysics: '#3A6B4B',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  batchName: '#1B7A8A',
  registerBg: '#FAFAFA',
  registerBorder: '#D1D5DB',
  plusBg: '#E8F0EE',
  plusIcon: '#4A7B6A',
  shadow: 'rgba(0,0,0,0.08)',
  navIcon: '#6B7280',
  navIconActive: '#1B3A4B',
  newBatch: '#1B3A4B',
};

// ─── Data ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'batches', label: 'Batches', icon: '👥' },
  { id: 'attendance', label: 'Attendance', icon: '📅' },
  { id: 'assessments', label: 'Assessments', icon: '📋' },
  { id: 'resources', label: 'Resources', icon: '📄' },
];

const DEFAULT_BATCH_IMAGES = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
  'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80',
];

const getTagColor = (type = '') => {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('medical')) return C.tagMedical;
  if (normalizedType.includes('math')) return C.tagMath;
  if (normalizedType.includes('physics')) return C.tagPhysics;
  return C.tagEngineering;
};

const toInitial = (value = '') => {
  const safe = String(value || '').trim();
  return safe ? safe[0].toUpperCase() : 'S';
};

const mapBatchToCard = (batch, index) => {
  const students = Array.isArray(batch?.students) ? batch.students : [];
  const avatars = students.slice(0, 2).map((student) => toInitial(student?.name || student?.id));
  const extraStudents = students.length - avatars.length;
  const batchType = (batch?.type || 'Regular').trim() || 'Regular';
  const description = (batch?.description || '').trim();

  return {
    id: String(batch?._id || batch?.id || `batch-${index}`),
    tag: batchType.toUpperCase(),
    tagColor: getTagColor(batchType),
    name: (batch?.name || 'Untitled batch').trim(),
    students: students.length,
    desc: description || 'No description provided for this batch.',
    avatars: avatars.length ? avatars : ['S'],
    extra: extraStudents > 0 ? `+${extraStudents}` : '',
    image: DEFAULT_BATCH_IMAGES[index % DEFAULT_BATCH_IMAGES.length],
    rawBatch: batch,
  };
};

// ─── SidebarItem ─────────────────────────────────────────────────────────────
function SidebarItem({ item, activeNav, onPress }) {
  const isActive = item.id === activeNav;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.navItem, isActive && styles.navItemActive]}
      onPress={() => onPress(item.id)}
    >
      <Text style={styles.navIcon}>{item.icon}</Text>
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ activeNav, onNavPress }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brandWrap}>
        <Text style={styles.brandTitle}>UniVerse</Text>
        <Text style={styles.brandSub}>FACULTY PORTAL</Text>
      </View>

      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={styles.navScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            activeNav={activeNav}
            onPress={onNavPress}
          />
        ))}
      </ScrollView>

      <View style={styles.sidebarBottom}>
        <TouchableOpacity activeOpacity={0.8} style={styles.newBatchBtn}>
          <Text style={styles.newBatchText}>+ New Batch</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={styles.sidebarAction}>
          <Text style={styles.sidebarActionIcon}>⚙</Text>
          <Text style={styles.sidebarActionLabel}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={styles.sidebarAction}>
          <Text style={styles.sidebarActionIcon}>↩</Text>
          <Text style={styles.sidebarActionLabel}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── BatchCard ────────────────────────────────────────────────────────────────
function BatchCard({ batch, onSelect }) {
  const cardWidth = IS_LAPTOP
    ? (SCREEN_WIDTH - 64) / 3
    : IS_TABLET
    ? (SCREEN_WIDTH - 48) / 2
    : SCREEN_WIDTH - 32;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={[styles.card, { width: cardWidth }]}
      onPress={() => onSelect(batch)}
    >
      <View style={styles.cardImageWrap}>
        <Image
          source={{ uri: batch.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={[styles.tag, { backgroundColor: batch.tagColor }]}>
          <Text style={styles.tagText}>{batch.tag}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.batchName}>{batch.name}</Text>
          <View style={styles.studentCount}>
            <Text style={styles.studentIcon}>👥</Text>
            <Text style={styles.studentNum}>{batch.students}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc}>{batch.desc}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.avatarRow}>
            {batch.avatars.map((a, i) => (
              <View key={i} style={[styles.avatar, { marginLeft: i === 0 ? 0 : -8 }]}>
                <Text style={styles.avatarEmoji}>{a}</Text>
              </View>
            ))}
            <Text style={styles.extraCount}>{batch.extra}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.selectBtn}
            onPress={() => onSelect(batch)}
          >
            <Text style={styles.selectBtnText}>Select</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── RegisterCard ─────────────────────────────────────────────────────────────
function RegisterCard() {
  const cardWidth = IS_LAPTOP
    ? (SCREEN_WIDTH - 64) / 3
    : IS_TABLET
    ? (SCREEN_WIDTH - 48) / 2
    : SCREEN_WIDTH - 32;

 
}

// ─── Main Component ──────────────────────────────────────────────────────────
function AttendancebatchScreen({ navigation, route }) {

  const instituteId = (route?.params?.instituteId || '').trim();
  const [activeNav, setActiveNav] = useState('batches');
  const [activeFilter, setActiveFilter] = useState('All');
  const [allBatches, setAllBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadBatches = async () => {
      if (!instituteId) {
        if (isMounted) {
          setAllBatches([]);
          setErrorMessage('Institute ID is missing for this teacher session.');
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const query = `/api/batches?instituteId=${encodeURIComponent(instituteId)}`;
        const { response } = await fetchWithBaseUrlFallback(query, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || 'Failed to fetch batches');
        }

        if (isMounted) {
          const mapped = Array.isArray(payload)
            ? payload.map((batch, index) => mapBatchToCard(batch, index))
            : [];
          setAllBatches(mapped);
        }
      } catch (error) {
        if (isMounted) {
          setAllBatches([]);
          setErrorMessage(error?.message || 'Could not load batches');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBatches();

    return () => {
      isMounted = false;
    };
  }, [instituteId]);

  const filterOptions = useMemo(() => {
    const dynamicFilters = Array.from(
      new Set(allBatches.map((batch) => batch.tag).filter(Boolean))
    );
    return ['All', ...dynamicFilters];
  }, [allBatches]);

  const filteredBatches =
    activeFilter === 'All'
      ? allBatches
      : allBatches.filter(
          (b) => b.tag.toLowerCase() === activeFilter.toLowerCase()
        );

  const handleSelect = (batch) => {
    const subjectOptions = Array.from(
      new Set(
        [
          ...(Array.isArray(batch?.rawBatch?.subjects) ? batch.rawBatch.subjects : []),
          batch?.rawBatch?.faculty?.subject,
        ]
          .map((subject) => String(subject || '').trim())
          .filter(Boolean)
      )
    );

    navigation.navigate('Attendancemark', {
      batchId: String(batch?.rawBatch?._id || batch?.id || ''),
      batchName: batch?.name || 'Batch Attendance',
      instituteId,
      batchStudents: Array.isArray(batch?.rawBatch?.students) ? batch.rawBatch.students : [],
      subjectOptions,
      selectedSubject: subjectOptions[0] || '',
    });
  };

  // ── Main content ─────────────────────────────────────────────────────────
  const MainContent = () => (
    <View style={styles.main}>
      {/* Scrollable body */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        // FIX: removed snapToInterval and snapToAlignment from the outer
        // ScrollView — those props trigger useNativeDriver:true internally
        // and conflict with JS-driven animations elsewhere in the tree.
        scrollEventThrottle={16}
      >
        {/* Page header */}
      
          <View>
           
            <Text style={styles.pageTitle}>Registry Overview</Text>
            {!instituteId ? <Text style={styles.pageSubtitle}>Missing instituteId in navigation params.</Text> : null}
            {!!errorMessage ? <Text style={styles.errorTextSmall}>{errorMessage}</Text> : null}
           
          </View>
         


        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContent}
          style={styles.filterChipsScroll}
          bounces={false}
        >
          {filterOptions.map((f) => (
            <TouchableOpacity
              key={f}
              activeOpacity={0.75}
              style={[
                styles.filterChip,
                activeFilter === f && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === f && styles.filterChipTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Card grid */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={styles.loadingText}>Loading batches...</Text>
          </View>
        ) : null}

        {!isLoading && filteredBatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No batches found</Text>
            <Text style={styles.emptyStateSub}>
              {activeFilter === 'All'
                ? 'No batch records are available for this institute yet.'
                : `No ${activeFilter.toLowerCase()} batches are available.`}
            </Text>
          </View>
        ) : null}

        {!isLoading && filteredBatches.length > 0 ? (
          <>
        {IS_LAPTOP || IS_TABLET ? (
          <View style={styles.cardGrid}>
            {filteredBatches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} onSelect={handleSelect} />
            ))}
            <RegisterCard />
          </View>
        ) : (
          <>
            {/*
              FIX: Replaced the snapping ScrollView with a plain vertical
              ScrollView. The snap props (snapToInterval + snapToAlignment)
              internally start a native-driven animation that crashes when
              any ancestor or sibling uses the JS driver. Use a FlatList with
              snapToInterval if you need snap behaviour — it isolates the
              native animation node properly.
            */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.mobileCardScroll}
              scrollEventThrottle={16}
              style={styles.mobileCardScrollWrap}
            >
              {filteredBatches.map((batch) => (
                <BatchCard key={batch.id} batch={batch} onSelect={handleSelect} />
              ))}
            </ScrollView>
            <View style={{ marginTop: 16 }}>
              <RegisterCard />
            </View>
          </>
        )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );

  return (
    // FIX: Using SafeAreaView from 'react-native-safe-area-context' instead of
    // the deprecated one from 'react-native'. Make sure <SafeAreaProvider>
    // wraps your root App component (in App.js / root navigator).
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={styles.root}>
        <MainContent />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: C.bg,
    ...(Platform.OS === 'web' && {
      height: '100vh',
      overflow: 'hidden',
    }),
  },

  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebar: {
    width: 220,
    backgroundColor: C.sidebar,
    paddingTop: 24,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: 'space-between',
  },
  mobileSidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 240,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 99,
  },
  brandWrap: {
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.2,
  },
  brandSub: {
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 1.2,
    marginTop: 2,
    fontWeight: '500',
  },
  navScroll: {
    flex: 1,
  },
  navScrollContent: {
    gap: 4,
    paddingBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: C.sidebarActive,
  },
  navIcon: {
    fontSize: 16,
  },
  navLabel: {
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: '500',
  },
  navLabelActive: {
    color: C.textPrimary,
    fontWeight: '600',
  },
  sidebarBottom: {
    paddingBottom: 16,
    gap: 4,
  },
  newBatchBtn: {
    backgroundColor: C.newBatch,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  newBatchText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  sidebarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  sidebarActionIcon: {
    fontSize: 16,
  },
  sidebarActionLabel: {
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: '500',
  },

  // ── Main ─────────────────────────────────────────────────────────────────
  main: {
    flex: 1,
    backgroundColor: C.bg,
    ...(Platform.OS === 'web' && {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    }),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    paddingHorizontal: IS_LAPTOP ? 32 : 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  menuBtn: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 20,
    color: C.textPrimary,
  },
  portalTitle: {
    fontSize: IS_LAPTOP ? 18 : 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginRight: 8,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    padding: 0,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtnText: {
    fontSize: 18,
  },

  // ── Scroll area ───────────────────────────────────────────────────────────
  scrollArea: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
      overflowX: 'hidden',
    }),
  },
 scrollContent: {
  paddingHorizontal: IS_LAPTOP ? 32 : 16,
  paddingBottom: 40,
},
  // ── Page header ───────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: IS_LAPTOP || IS_TABLET ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: IS_LAPTOP || IS_TABLET ? 'flex-start' : 'stretch',
    marginBottom: 28,
    gap: 16,
  },
  registryLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: IS_LAPTOP ? 30 : 24,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    alignSelf: IS_LAPTOP || IS_TABLET ? 'flex-start' : 'flex-end',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterIcon: {
    fontSize: 14,
    color: C.textSecondary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: C.accent,
  },
  archiveIcon: {
    fontSize: 14,
  },
  archiveText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.accentText,
  },

  // ── Filter chips ──────────────────────────────────────────────────────────
  filterChipsScroll: {
    marginBottom: 20,
    marginHorizontal: IS_LAPTOP ? 0 : -16,
  },
  filterChipsContent: {
    paddingHorizontal: IS_LAPTOP ? 0 : 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // ── Mobile card scroll ────────────────────────────────────────────────────
  mobileCardScrollWrap: {
    marginHorizontal: -16,
  },
  mobileCardScroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingRight: 32,
  },

  // ── Card grid ─────────────────────────────────────────────────────────────
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  // ── Batch card ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }),
    borderWidth: 1,
    borderColor: C.border,
  },
  cardImageWrap: {
    height: 140,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  tag: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchName: {
    fontSize: 17,
    fontWeight: '700',
    color: C.batchName,
    letterSpacing: -0.3,
  },
  studentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  studentIcon: {
    fontSize: 13,
  },
  studentNum: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
  },
  cardDesc: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.cardBg,
  },
  avatarEmoji: {
    fontSize: 14,
  },
  extraCount: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '600',
    marginLeft: 6,
  },
  selectBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectBtnText: {
    color: C.accentText,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Register card ─────────────────────────────────────────────────────────
  registerCard: {
    backgroundColor: C.registerBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.registerBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    padding: 24,
    gap: 12,
  },
  plusCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.plusBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontSize: 24,
    color: C.plusIcon,
    fontWeight: '300',
  },
  registerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
  },
  registerSub: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: '500',
  },
  errorTextSmall: {
    marginTop: 6,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: C.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  emptyStateSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: C.textSecondary,
    textAlign: 'center',
  },
});

const Stack = createStackNavigator();

export default function Attendancebatch({ initialRouteName = 'Attendancebatch', instituteId = '' }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="Attendancebatch"
        component={AttendancebatchScreen}
        initialParams={{ instituteId }}
      />
      <Stack.Screen
        name="Attendancemark"
        component={Attendancemark}
      />
    </Stack.Navigator>
  );
}
