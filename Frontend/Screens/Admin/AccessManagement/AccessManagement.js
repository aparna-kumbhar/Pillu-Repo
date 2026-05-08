import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  Alert,
  NativeModules,
} from 'react-native';
import Constants from 'expo-constants';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTabletOrDesktop = SCREEN_WIDTH >= 768;

// ─── Color Palette ───────────────────────────────────────────────────────────
const COLORS = {
  primary: '#1A5C50',
  primaryLight: '#2D7A6A',
  accent: '#00B894',
  accentSoft: '#E6F4F1',
  background: '#F5F7F6',
  white: '#FFFFFF',
  textDark: '#1A2E2A',
  textMid: '#4A6560',
  textLight: '#8FA8A3',
  border: '#D8E8E5',
  danger: '#E05C5C',
  dangerBg: '#FFF0F0',
  restricted: '#E07A2F',
  fullAccessGreen: '#1A5C50',
  badgeBg: '#1A5C50',
  seatBar: '#00B894',
  seatBarBg: '#D8E8E5',
  navActive: '#1A5C50',
  navText: '#4A6560',
  sidebarBg: '#FFFFFF',
  headerBg: '#FFFFFF',
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const FACULTY = [
  {
    id: 1,
    name: 'Dr. Julian Pierce',
    role: 'SENIOR RESEARCH LEAD',
    department: 'Quantum Humanities',
    joined: '12 Sep 2018',
    lastActive: '2h ago',
    accessLevel: 'Full Access',
    credentialId: 'ARC-001-JP',
    featured: true,
    avatarBg: '#2D4A3E',
  },
  {
    id: 2,
    name: 'Prof. Elena Moretti',
    role: 'COMPARATIVE LITERATURE',
    accessLevel: 'Departmental',
    credentialId: 'ARC-992-XM',
    featured: false,
    avatarBg: '#4A3A2E',
  },
  {
    id: 3,
    name: 'Dr. Arthur Wang',
    role: 'APPLIED LINGUISTICS',
    accessLevel: 'Restricted',
    credentialId: 'ARC-441-LW',
    featured: false,
    avatarBg: '#2E3A4A',
  },
  {
    id: 4,
    name: 'Sarah Blackwood',
    role: 'ARCHIVE MANAGEMENT',
    accessLevel: 'Full Access',
    credentialId: 'ARC-012-SB',
    featured: false,
    avatarBg: '#3A2E4A',
  },
];

const STUDENTS = [
  {
    id: 101,
    name: 'Aarav Menon',
    role: 'GRADE 12 · SCIENCE',
    department: 'Batch 12A',
    joined: '08 Jun 2022',
    lastActive: '10m ago',
    accessLevel: 'Departmental',
    credentialId: 'STD-1201-AM',
    featured: true,
    avatarBg: '#2B5D8A',
  },
  {
    id: 102,
    name: 'Nisha Kapoor',
    role: 'GRADE 11 · COMMERCE',
    department: 'Batch 11C',
    joined: '12 Jul 2023',
    lastActive: '1h ago',
    accessLevel: 'Full Access',
    credentialId: 'STD-1124-NK',
    featured: false,
    avatarBg: '#556B2F',
  },
  {
    id: 103,
    name: 'Rahul Bhatia',
    role: 'GRADE 10 · HUMANITIES',
    department: 'Batch 10B',
    joined: '04 May 2023',
    lastActive: '30m ago',
    accessLevel: 'Restricted',
    credentialId: 'STD-1092-RB',
    featured: false,
    avatarBg: '#5E4B8B',
  },
];

const PARENTS = [
  {
    id: 201,
    name: 'Priya Menon',
    role: 'PARENT · AARAV MENON',
    department: 'Batch 12A',
    joined: '08 Jun 2022',
    lastActive: '2h ago',
    accessLevel: 'Departmental',
    credentialId: 'PAR-2201-PM',
    featured: true,
    avatarBg: '#7A4E2D',
  },
  {
    id: 202,
    name: 'Karan Kapoor',
    role: 'PARENT · NISHA KAPOOR',
    department: 'Batch 11C',
    joined: '12 Jul 2023',
    lastActive: '5h ago',
    accessLevel: 'Full Access',
    credentialId: 'PAR-2277-KK',
    featured: false,
    avatarBg: '#3E6B6F',
  },
  {
    id: 203,
    name: 'Sonal Bhatia',
    role: 'PARENT · RAHUL BHATIA',
    department: 'Batch 10B',
    joined: '04 May 2023',
    lastActive: '1d ago',
    accessLevel: 'Restricted',
    credentialId: 'PAR-2314-SB',
    featured: false,
    avatarBg: '#6A3E55',
  },
];

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Access Management', icon: '🔐', active: true },
  { label: 'Student Records', icon: '🎓' },
  { label: 'Faculty Portal', icon: '👤' },
  { label: 'Institutional Analytics', icon: '📊' },
];

const TABS = ['Teachers', 'Students'];

const INITIAL_RECORDS_BY_TAB = {
  Teachers: FACULTY,
  Students: STUDENTS,
};


// ─── Avatar Placeholder ───────────────────────────────────────────────────────
const AvatarPlaceholder = ({ name, size = 48, bg = '#2D4A3E' }) => {
  const initials = name
    .split(' ')
    .slice(-2)
    .map((n) => n[0])
    .join('');
  return (
    <View
      style={[
        styles.avatarPlaceholder,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.33 }]}>{initials}</Text>
    </View>
  );
};

// ─── Access Level Badge ───────────────────────────────────────────────────────
const AccessBadge = ({ level, size = 'sm' }) => {
  const colorMap = {
    'Full Access': { color: COLORS.fullAccessGreen, bg: COLORS.accentSoft },
    Departmental: { color: '#2E6DA4', bg: '#E8F2FC' },
    Restricted: { color: COLORS.restricted, bg: '#FDF0E6' },
  };
  const { color, bg } = colorMap[level] || { color: COLORS.textMid, bg: COLORS.accentSoft };
  const isLarge = size === 'lg';
  return (
    <View style={[styles.accessBadge, { backgroundColor: bg, paddingHorizontal: isLarge ? 14 : 10, paddingVertical: isLarge ? 5 : 3 }]}>
      <Text style={[styles.accessBadgeText, { color, fontSize: isLarge ? 12 : 10 }]}>{level.toUpperCase()}</Text>
    </View>
  );
};

// ─── Sidebar (Desktop) ────────────────────────────────────────────────────────
const Sidebar = ({ onNavPress }) => (
  <View style={styles.sidebar}>
    <View style={styles.sidebarBrand}>
      <Text style={styles.brandTitle}>THE CURATOR</Text>
      <Text style={styles.brandSub}>COACHING ADMIN PORTAL</Text>
    </View>

    <View style={styles.navList}>
      {NAV_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={[styles.navItem, item.active && styles.navItemActive]}
          onPress={() => onNavPress && onNavPress(item.label)}
          activeOpacity={0.75}
        >
          <Text style={styles.navIcon}>{item.icon}</Text>
          <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.sidebarBottom}>
      <View style={styles.systemStatus}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>SYSTEM STATUS: ACTIVE</Text>
      </View>
      <TouchableOpacity style={styles.navItem} activeOpacity={0.75}>
        <Text style={styles.navIcon}>⚙️</Text>
        <Text style={styles.navLabel}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} activeOpacity={0.75}>
        <Text style={styles.navIcon}>❓</Text>
        <Text style={styles.navLabel}>Support</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Top Header ───────────────────────────────────────────────────────────────
const TopHeader = ({ showBrand = false }) => (
  <View style={styles.topHeader}>
    {showBrand && (
      <View style={styles.mobileBrand}>
        <Text style={styles.brandTitle}>THE CURATOR</Text>
      </View>
    )}
    <View style={styles.headerSearch}>
      <Text style={styles.searchIcon}>🔍</Text>
      <Text style={styles.searchPlaceholder}>Search archive for credentials...</Text>
    </View>
    <View style={styles.headerActions}>
      <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
        <Text style={styles.headerBtnText}>DIRECTIVES</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
        <Text style={styles.headerBtnText}>AUDIT LOGS</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
        <Text style={styles.headerBtnText}>PERMISSIONS</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.createCredBtn} activeOpacity={0.8}>
        <Text style={styles.createCredText}>CREATE CREDENTIAL</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
        <Text>🔔</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.avatarCircle} activeOpacity={0.7}>
        <Text style={styles.avatarCircleText}>A</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Mobile Header ────────────────────────────────────────────────────────────
const MobileHeader = () => (
  <View style={styles.mobileHeader}>
   
    
     
  
    </View>

);

// ─── Featured Faculty Card ────────────────────────────────────────────────────
const FeaturedCard = ({ faculty, onView, onRemove }) => (
  <View style={styles.featuredCard}>
    <View style={styles.featuredCardInner}>
      <AvatarPlaceholder name={faculty.name} size={isTabletOrDesktop ? 96 : 72} bg={faculty.avatarBg} />
      <View style={styles.featuredInfo}>
        <View style={styles.featuredNameRow}>
          <Text style={styles.featuredName}>{faculty.name}</Text>
          <AccessBadge level={faculty.accessLevel} size="lg" />
        </View>
        <Text style={styles.featuredRole}>{faculty.role}</Text>
        <View style={styles.featuredMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>DEPARTMENT</Text>
            <Text style={styles.metaValue}>{faculty.department}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>JOINED DATE</Text>
            <Text style={styles.metaValue}>{faculty.joined}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>LAST ACTIVE</Text>
            <Text style={styles.metaValue}>{faculty.lastActive}</Text>
          </View>
        </View>
        <View style={styles.featuredActions}>
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => onView && onView(faculty)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewProfileText}>VIEW PROFILE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeAccessBtn}
            onPress={() => onRemove && onRemove(faculty)}
            activeOpacity={0.8}
          >
            <Text style={styles.removeAccessText}>REMOVE ACCESS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);

// ─── Access Audit Panel ───────────────────────────────────────────────────────
const AccessAuditPanel = () => (
 
    <View style={styles.auditIconRow}>
     
 
   
   
    
  </View>
);

// ─── Small Faculty Card ───────────────────────────────────────────────────────
const SmallFacultyCard = ({ faculty, onView, onRemove }) => (
  <View style={styles.smallCard}>
    <View style={styles.smallCardHeader}>
      <AvatarPlaceholder name={faculty.name} size={44} bg={faculty.avatarBg} />
      <View style={styles.smallCardTitleGroup}>
        <Text style={styles.smallCardName}>{faculty.name}</Text>
        <Text style={styles.smallCardRole}>{faculty.role}</Text>
      </View>
    </View>
    <View style={styles.smallCardMeta}>
      <View style={styles.smallMetaRow}>
        <Text style={styles.smallMetaLabel}>Access Level</Text>
        <Text
          style={[
            styles.smallMetaValue,
            faculty.accessLevel === 'Restricted' && { color: COLORS.restricted },
            faculty.accessLevel === 'Full Access' && { color: COLORS.fullAccessGreen },
          ]}
        >
          {faculty.accessLevel}
        </Text>
      </View>
      <View style={styles.smallMetaRow}>
        <Text style={styles.smallMetaLabel}>Credential ID</Text>
        <Text style={styles.smallMetaValue}>{faculty.credentialId}</Text>
      </View>
    </View>
    <TouchableOpacity
      style={styles.viewProfileBtnOutline}
      onPress={() => onView && onView(faculty)}
      activeOpacity={0.8}
    >
      <Text style={styles.viewProfileOutlineText}>VIEW PROFILE</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.removeAccessBtnText}
      onPress={() => onRemove && onRemove(faculty)}
      activeOpacity={0.8}
    >
      <Text style={styles.removeAccessText}>REMOVE ACCESS</Text>
    </TouchableOpacity>
  </View>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ current = 1, total = 3, onPage }) => (
  <View style={styles.pagination}>
   
    <View style={styles.paginationControls}>
      <TouchableOpacity style={styles.pageBtn} activeOpacity={0.7} onPress={() => onPage && onPage(current - 1)}>
        <Text style={styles.pageBtnText}>‹</Text>
      </TouchableOpacity>
      {[1, 2, 3].map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.pageBtn, p === current && styles.pageBtnActive]}
          activeOpacity={0.7}
          onPress={() => onPage && onPage(p)}
        >
          <Text style={[styles.pageBtnText, p === current && styles.pageBtnTextActive]}>{p}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.pageBtn} activeOpacity={0.7} onPress={() => onPage && onPage(current + 1)}>
        <Text style={styles.pageBtnText}>›</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Search Bar Component ─────────────────────────────────────────────────────
const SearchBar = ({ placeholder = 'Search archive for credentials...', onSearch }) => (
  <View style={styles.searchBarContainer}>
    <Text style={styles.searchBarIcon}>🔍</Text>
    <TextInput
      style={styles.searchBarInput}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textLight}
      onChangeText={onSearch}
    />
  </View>
);

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
const MobileBottomNav = ({ active = 'Access Management', onPress }) => {
  const items = [
    { label: 'Dashboard', icon: '▦' },
    { label: 'Access', icon: '🔐' },
    { label: 'Students', icon: '🎓' },
    { label: 'Analytics', icon: '📊' },
    { label: 'Settings', icon: '⚙️' },
  ];
  return (
    <View style={styles.mobileBottomNav}>
      {items.map((item) => {
        const isActive = item.label === active || (item.label === 'Access' && active === 'Access Management');
        return (
          <TouchableOpacity
            key={item.label}
            style={styles.bottomNavItem}
            onPress={() => onPress && onPress(item.label)}
            activeOpacity={0.7}
          >
            <Text style={[styles.bottomNavIcon, isActive && styles.bottomNavIconActive]}>{item.icon}</Text>
            <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ProfileModal = ({ visible, person, onClose }) => {
  if (!person) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.profileModalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.profileModalCard}>
          <View style={styles.profileModalHeader}>
            <Text style={styles.profileModalTitle}>Profile Details</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.profileModalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileTopRow}>
            <AvatarPlaceholder name={person.name} size={58} bg={person.avatarBg} />
            <View style={styles.profileTopText}>
              <Text style={styles.profileName}>{person.name}</Text>
              <Text style={styles.profileRole}>{person.role}</Text>
            </View>
          </View>

          <View style={styles.profileMetaGrid}>
            <Text style={styles.profileMetaItem}>Department: {person.department}</Text>
            <Text style={styles.profileMetaItem}>Joined: {person.joined}</Text>
            <Text style={styles.profileMetaItem}>Last Active: {person.lastActive}</Text>
            <Text style={styles.profileMetaItem}>Access: {person.accessLevel}</Text>
            <Text style={styles.profileMetaItem}>Credential ID: {person.credentialId}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AccessManagementScreen = ({ instituteId }) => {
  const [activeTab, setActiveTab] = useState('Teachers'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [recordsByTab, setRecordsByTab] = useState(INITIAL_RECORDS_BY_TAB);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const loadRecords = async () => {
      const resolvedInstituteId = (instituteId || '').trim();
      if (!resolvedInstituteId) {
        return;
      }

      try {
        const [{ response: teacherResponse }, { response: studentResponse }] = await Promise.all([
          fetchWithBaseUrlFallback(`/api/teachers?instituteId=${encodeURIComponent(resolvedInstituteId)}`),
          fetchWithBaseUrlFallback(`/api/students?instituteId=${encodeURIComponent(resolvedInstituteId)}`),
        ]);

        const teacherPayload = await teacherResponse.json();
        const studentPayload = await studentResponse.json();

        const teachers = Array.isArray(teacherPayload)
          ? teacherPayload.map((teacher, index) => ({
              id: teacher?._id || `teacher-${index}`,
              name: teacher?.fullName || 'Teacher',
              role: (teacher?.qualification || 'FACULTY').toUpperCase(),
              department: teacher?.departmentName || 'General',
              joined: teacher?.createdAt ? new Date(teacher.createdAt).toLocaleDateString('en-GB') : '-',
              lastActive: 'Active',
              accessLevel: 'Departmental',
              credentialId: teacher?.teacherId || '-',
              featured: index === 0,
              avatarBg: '#2D4A3E',
            }))
          : [];

        const students = Array.isArray(studentPayload)
          ? studentPayload.map((student, index) => ({
              id: student?._id || `student-${index}`,
              name: student?.fullName || 'Student',
              role: (student?.academicYear || 'STUDENT').toUpperCase(),
              department: student?.academicYear || '-',
              joined: student?.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB') : '-',
              lastActive: 'Active',
              accessLevel: 'Departmental',
              credentialId: student?.studentId || '-',
              featured: index === 0,
              avatarBg: '#2B5D8A',
            }))
          : [];

        setRecordsByTab((prev) => ({
          ...prev,
          Teachers: teachers,
          Students: students,
        }));
      } catch (error) {
        Alert.alert('Network error', 'Could not fetch access records from backend.');
      }
    };

    loadRecords();
  }, [instituteId]);

  const currentRecords = recordsByTab[activeTab] || [];

  const filteredFaculty = currentRecords.filter((faculty) =>
    faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faculty.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faculty.credentialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faculty.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featured = filteredFaculty.length > 0 ? filteredFaculty[0] : null;
  const smallCards = filteredFaculty.length > 1 ? filteredFaculty.slice(1) : (filteredFaculty.length === 0 ? [] : []);

  const handleView = (faculty) => {
    setSelectedProfile(faculty);
    setShowProfileModal(true);
  };

  const handleRemove = async (faculty) => {
    const isWebPlatform = Platform.OS === 'web';
    
    // Web: use window.confirm, Native: use Alert.alert
    const shouldDelete = isWebPlatform
      ? window.confirm(`Are you sure you want to permanently delete ${faculty.name}? This action cannot be undone.`)
      : await new Promise((resolve) => {
          Alert.alert(
            'Remove Access',
            `Are you sure you want to permanently delete ${faculty.name}? This action cannot be undone.`,
            [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
            ]
          );
        });

    if (!shouldDelete) return;

    try {
      const endpoint = activeTab === 'Teachers'
        ? `/api/teachers/${faculty.id}?instituteId=${encodeURIComponent(instituteId)}`
        : `/api/students/${faculty.id}?instituteId=${encodeURIComponent(instituteId)}`;

      console.log(`🔄 Attempting to delete from endpoint: ${endpoint}`);

      const { response } = await fetchWithBaseUrlFallback(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log(`📊 Response status: ${response.status}`);

      if (response.ok) {
        console.log(`✅ ${activeTab.slice(0, -1)} deleted successfully from database`);
        setRecordsByTab((prev) => ({
          ...prev,
          [activeTab]: (prev[activeTab] || []).filter((p) => p.id !== faculty.id),
        }));
        if (selectedProfile?.id === faculty.id) {
          setShowProfileModal(false);
          setSelectedProfile(null);
        }
        
        if (isWebPlatform) {
          alert(`✅ Success: ${faculty.name} has been permanently deleted.`);
        } else {
          Alert.alert('Success', `${faculty.name} has been permanently deleted.`);
        }
      } else {
        // Handle non-OK responses
        let errorMsg = `Server error (${response.status}): `;
        try {
          const errorPayload = await response.json();
          errorMsg += errorPayload?.message || errorPayload?.error || `Failed to delete ${activeTab.slice(0, -1)}`;
          console.error(`❌ Delete error response:`, errorPayload);
        } catch (e) {
          errorMsg += `Failed to delete ${activeTab.slice(0, -1)}`;
          console.error(`❌ Could not parse error response`);
        }
        
        console.error(`❌ Delete failed with status ${response.status}:`, errorMsg);
        
        if (isWebPlatform) {
          alert(`Error: ${errorMsg}`);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    } catch (error) {
      console.error('❌ Network error during delete:', error);
      
      const errorMsg = error?.message || 'Could not connect to server to delete record.';
      if (isWebPlatform) {
        alert(`Network Error: ${errorMsg}`);
      } else {
        Alert.alert('Network Error', errorMsg);
      }
    }
  };

  if (isTabletOrDesktop) {
    // ── Desktop / Tablet Layout ──────────────────────────────────────────────
    return (
      <SafeAreaView style={styles.desktopContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.desktopLayout}>
          {/* Sidebar */}
         

          {/* Main Content */}
          <View style={styles.desktopMain}>
            <ScrollView
              style={styles.desktopScroll}
              contentContainerStyle={styles.desktopScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Search Bar */}
              <SearchBar placeholder="Search faculty members..." onSearch={setSearchQuery} />

              {/* Page Title */}
              <View style={styles.pageHeader}>
                <Text style={styles.pageHeaderSub}>INSTITUTIONAL SECURITY</Text>
                <Text style={styles.pageTitle}>Access Management</Text>
              </View>

              {/* Tabs + Filter/Sort */}
              <View style={styles.tabsRow}>
                <View style={styles.tabs}>
                  {TABS.map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.tab, activeTab === tab && styles.tabActive]}
                      onPress={() => setActiveTab(tab)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
              </View>

              {/* No Results Message */}
              {filteredFaculty.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsIcon}>🔍</Text>
                  <Text style={styles.noResultsTitle}>No {activeTab.toLowerCase()} found</Text>
                  <Text style={styles.noResultsDesc}>Try searching with a different name, role, or credential ID</Text>
                </View>
              )}

              {featured && (
                <>
                  <View style={styles.desktopTopRow}>
                    <View style={styles.desktopFeaturedWrap}>
                      <FeaturedCard faculty={featured} onView={handleView} onRemove={handleRemove} />
                    </View>
                    <View style={styles.desktopAuditWrap}>
                      <AccessAuditPanel />
                    </View>
                  </View>

                  {/* Small Cards Grid */}
                  <View style={styles.desktopCardGrid}>
                    {smallCards.map((f) => (
                      <View key={f.id} style={styles.desktopCardCell}>
                        <SmallFacultyCard faculty={f} onView={handleView} onRemove={handleRemove} />
                      </View>
                    ))}
                  </View>

                  {/* Pagination */}
                
                </>
              )}
            </ScrollView>
          </View>
        </View>

        <ProfileModal
          visible={showProfileModal}
          person={selectedProfile}
          onClose={() => setShowProfileModal(false)}
        />
      </SafeAreaView>
    );
  }

  // ── Mobile Layout ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.mobileContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Search Bar */}
      <SearchBar placeholder="Search faculty..." onSearch={setSearchQuery} />

      <ScrollView
        style={styles.mobileScroll}
        contentContainerStyle={styles.mobileScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderSub}>INSTITUTIONAL SECURITY</Text>
          <Text style={styles.pageTitle}>Access Management</Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Filter / Sort row */}
        

        {/* No Results Message */}
        {filteredFaculty.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsIcon}>🔍</Text>
            <Text style={styles.noResultsTitle}>No {activeTab.toLowerCase()} found</Text>
            <Text style={styles.noResultsDesc}>Try searching with a different name, role, or credential ID</Text>
          </View>
        )}

        {featured && (
          <>
        {/* Featured Card */}
        <FeaturedCard faculty={featured} onView={handleView} onRemove={handleRemove} />

        {/* Audit Panel */}
        <AccessAuditPanel />

        {/* Small Cards */}
        {smallCards.map((f) => (
          <SmallFacultyCard key={f.id} faculty={f} onView={handleView} onRemove={handleRemove} />
        ))}

        {/* Pagination */}
        
            </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <ProfileModal
        visible={showProfileModal}
        person={selectedProfile}
        onClose={() => setShowProfileModal(false)}
      />

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Containers ────────────────────────────────────────────────────────────
  desktopContainer: { flex: 1, backgroundColor: COLORS.background },
  desktopLayout: { flex: 1, flexDirection: 'row' },
  desktopMain: { flex: 1, flexDirection: 'column' },
  desktopScroll: { flex: 1, backgroundColor: COLORS.background },
  desktopScrollContent: { padding: 28, paddingBottom: 48 },
  mobileContainer: { flex: 1, backgroundColor: COLORS.background },
  mobileScroll: { flex: 1 },
  mobileScrollContent: { padding: 16, paddingBottom: 20 },

  // ── Sidebar ───────────────────────────────────────────────────────────────
  sidebar: {
    width: 220,
    backgroundColor: COLORS.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  sidebarBrand: { marginBottom: 28 },
  brandTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textDark, letterSpacing: 1.2 },
  brandSub: { fontSize: 9, color: COLORS.textLight, letterSpacing: 1.5, marginTop: 2 },
  navList: { flex: 1 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: { backgroundColor: COLORS.accentSoft },
  navIcon: { fontSize: 14, marginRight: 10, width: 20, textAlign: 'center' },
  navLabel: { fontSize: 13, color: COLORS.navText, fontWeight: '500' },
  navLabelActive: { color: COLORS.primary, fontWeight: '700' },
  sidebarBottom: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  systemStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, marginRight: 8 },
  statusText: { fontSize: 9, color: COLORS.accent, fontWeight: '700', letterSpacing: 1 },

  // ── Top Header (Desktop) ─────────────────────────────────────────────────
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  headerSearch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  searchIcon: { fontSize: 13, marginRight: 8 },
  searchPlaceholder: { fontSize: 12, color: COLORS.textLight },

  // ── Search Bar ──────────────────────────────────────────────────────────────
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 20,
    marginHorizontal: isTabletOrDesktop ? 0 : 0,
  },
  searchBarIcon: { fontSize: 16, marginRight: 10, color: COLORS.textLight },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '500',
  },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  headerBtnText: { fontSize: 11, color: COLORS.textMid, fontWeight: '600', letterSpacing: 0.5 },
  createCredBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createCredText: { fontSize: 11, color: COLORS.white, fontWeight: '700', letterSpacing: 0.5 },
  iconBtn: { padding: 6 },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  // ── Mobile Header ──────────────────────────────────────────────────────────
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mobileBrand: { marginRight: 12 },
  mobileHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // ── Page Header ────────────────────────────────────────────────────────────
  pageHeader: { marginBottom: 20 },
  pageHeaderSub: { fontSize: 10, color: COLORS.accent, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  pageTitle: { fontSize: isTabletOrDesktop ? 30 : 24, fontWeight: '800', color: COLORS.textDark },

  // ── Tabs ───────────────────────────────────────────────────────────────────
  tabsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  tabsScroll: { marginBottom: 4 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    alignSelf: 'flex-start',
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 7,
  },
  tabActive: { backgroundColor: COLORS.white, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, color: COLORS.textMid, fontWeight: '500' },
  tabTextActive: { color: COLORS.textDark, fontWeight: '700' },
  filterSortRow: { flexDirection: 'row', gap: 8 },
  mobileFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 8 },
  filterSortBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filterSortText: { fontSize: 11, color: COLORS.textMid, fontWeight: '600' },

  // ── Desktop Layout Rows ────────────────────────────────────────────────────
desktopTopRow: { marginBottom: 20 },  
  desktopFeaturedWrap: { flex: 2 },
  desktopAuditWrap: { flex: 1 },
  desktopCardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  desktopCardCell: { flex: 1, minWidth: 260 },

  // ── Featured Card ──────────────────────────────────────────────────────────
  featuredCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredCardInner: { flexDirection: isTabletOrDesktop ? 'row' : 'column', gap: 16 },
  featuredInfo: { flex: 1 },
  featuredNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  featuredName: { fontSize: isTabletOrDesktop ? 20 : 18, fontWeight: '800', color: COLORS.textDark },
  featuredRole: { fontSize: 11, color: COLORS.accent, fontWeight: '700', letterSpacing: 1, marginBottom: 14 },
  featuredMeta: { flexDirection: 'row', gap: 20, marginBottom: 18, flexWrap: 'wrap' },
  metaItem: {},
  metaLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', letterSpacing: 1, marginBottom: 2 },
  metaValue: { fontSize: 13, color: COLORS.textDark, fontWeight: '600' },
  featuredActions: { flexDirection: 'row', gap: 10 },
  viewProfileBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  viewProfileText: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, letterSpacing: 0.5 },
  removeAccessBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
  },
  removeAccessText: { fontSize: 12, fontWeight: '700', color: COLORS.danger, letterSpacing: 0.5 },

  // ── Access Audit Panel ─────────────────────────────────────────────────────
  auditPanel: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  auditIconRow: { marginBottom: 10 },
  auditShieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  auditTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, marginBottom: 8 },
  auditDesc: { fontSize: 13, color: COLORS.textMid, lineHeight: 19, marginBottom: 16 },
  auditSeats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  seatsLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '700', letterSpacing: 1 },
  seatsCount: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  seatBarBg: { height: 6, backgroundColor: COLORS.seatBarBg, borderRadius: 3, overflow: 'hidden' },
  seatBarFill: { height: 6, backgroundColor: COLORS.seatBar, borderRadius: 3 },

  // ── Access Badge ───────────────────────────────────────────────────────────
  accessBadge: { borderRadius: 6, alignSelf: 'flex-start' },
  accessBadgeText: { fontWeight: '700', letterSpacing: 0.8 },

  // ── Small Faculty Card ─────────────────────────────────────────────────────
  smallCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  smallCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  smallCardTitleGroup: { flex: 1 },
  smallCardName: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  smallCardRole: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  smallCardMeta: { marginBottom: 14 },
  smallMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  smallMetaLabel: { fontSize: 12, color: COLORS.textMid },
  smallMetaValue: { fontSize: 12, fontWeight: '700', color: COLORS.textDark },
  viewProfileBtnOutline: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 8,
  },
  viewProfileOutlineText: { fontSize: 11, fontWeight: '700', color: COLORS.textDark, letterSpacing: 0.5 },
  removeAccessBtnText: { alignItems: 'center', paddingVertical: 6 },

  // ── Avatar ─────────────────────────────────────────────────────────────────
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarInitials: { color: COLORS.white, fontWeight: '800', letterSpacing: 0.5 },

  // ── Pagination ─────────────────────────────────────────────────────────────
  pagination: {
    flexDirection: isTabletOrDesktop ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  paginationInfo: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.8 },
  paginationControls: { flexDirection: 'row', gap: 6 },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pageBtnText: { fontSize: 13, color: COLORS.textMid, fontWeight: '600' },
  pageBtnTextActive: { color: COLORS.white },

  // ── No Results ──────────────────────────────────────────────────────────────
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noResultsIcon: { fontSize: 48, marginBottom: 16 },
  noResultsTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  noResultsDesc: { fontSize: 14, color: COLORS.textMid, textAlign: 'center', lineHeight: 20 },

  // ── Mobile Bottom Nav ──────────────────────────────────────────────────────
  mobileBottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({ ios: { paddingBottom: 20 } }),
  },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  bottomNavIcon: { fontSize: 18, marginBottom: 3 },
  bottomNavIconActive: { tintColor: COLORS.primary },
  bottomNavLabel: { fontSize: 9, color: COLORS.textLight, fontWeight: '500' },
  bottomNavLabelActive: { color: COLORS.primary, fontWeight: '700' },

  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileModalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  profileModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  profileModalClose: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  profileTopText: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  profileRole: {
    fontSize: 12,
    color: COLORS.textMid,
    marginTop: 2,
  },
  profileMetaGrid: {
    gap: 8,
  },
  profileMetaItem: {
    fontSize: 13,
    color: COLORS.textDark,
  },
});

export default AccessManagementScreen;
