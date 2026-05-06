import Constants from 'expo-constants';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  Alert,
  NativeModules,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_DESKTOP = SCREEN_WIDTH >= 768;

// ── Colour tokens ──────────────────────────────────────────────
const C = {
  navy: '#0D1B3E',
  navyLight: '#1A2D5A',
  teal: '#2D8C72',
  tealLight: '#3AAF8F',
  tealPale: '#E8F5F1',
  tealBorder: '#B2DDD3',
  white: '#FFFFFF',
  bg: '#F4F7F6',
  card: '#FFFFFF',
  textPrimary: '#0D1B3E',
  textSecondary: '#6B7A99',
  textMuted: '#9AAAC2',
  border: '#DDE4EF',
  tagBg: '#EEF2FF',
  tagText: '#3D52A0',
  tagGreen: '#E8F5F1',
  tagGreenText: '#2D7A62',
  inputBg: '#F8FAFB',
  shadow: 'rgba(13,27,62,0.08)',
};

const IS_WEB = Platform.OS === 'web';

// ── Data ───────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════
export default function Notes({ instituteId = '', teacherId = '', teacherName = '' }) {
  const resolvedInstituteId = String(instituteId || '').trim();
  const resolvedTeacherId = String(teacherId || '').trim();
  const resolvedTeacherName = String(teacherName || '').trim();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [subject, setSubject] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchContextData = async () => {
      if (!resolvedInstituteId) {
        return;
      }

      try {
        const { response } = await fetchWithBaseUrlFallback(
          `/api/batches?instituteId=${encodeURIComponent(resolvedInstituteId)}`,
          { method: 'GET', headers: { Accept: 'application/json' } }
        );

        const payload = await response.json();
        if (!response.ok || !Array.isArray(payload)) {
          return;
        }

        const dbBatchNames = payload
          .map((batch) => String(batch?.name || '').trim())
          .filter(Boolean);

        const dbSubjects = payload
          .map((batch) => String(batch?.faculty?.subject || '').trim())
          .filter(Boolean);

        const nextBatchOptions = Array.from(new Set(dbBatchNames));
        const nextSubjectOptions = Array.from(new Set(dbSubjects));

        if (isMounted) {
          setBatchOptions(nextBatchOptions);
          setSubjectOptions(nextSubjectOptions);

          if (!subject || !nextSubjectOptions.includes(subject)) {
            setSubject(nextSubjectOptions[0] || '');
          }

          if (selectedBatch && !nextBatchOptions.includes(selectedBatch)) {
            setSelectedBatch(null);
          }
        }
      } catch (error) {
        // Keep default context options on network failure.
      }
    };

    fetchContextData();

    return () => {
      isMounted = false;
    };
  }, [resolvedInstituteId]);

  const sharedProps = {
    selectedBatch, setSelectedBatch,
    resourceTitle, setResourceTitle,
    subject, setSubject,
    activeFilter, setActiveFilter,
    showBatchDropdown, setShowBatchDropdown,
    showSubjectDropdown, setShowSubjectDropdown,
    uploadedFiles, setUploadedFiles,
    batchOptions,
    subjectOptions,
    resolvedInstituteId,
    resolvedTeacherId,
    resolvedTeacherName,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {IS_DESKTOP ? (
        <View style={{ flex: 1, minHeight: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, padding: 32, paddingBottom: 120 }}
            showsVerticalScrollIndicator={true}
          >
            <MainContent {...sharedProps} isDesktop={true} />
          </ScrollView>
        </View>
      ) : (
        <View style={styles.mobileRoot}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.mobileScroll}
            showsVerticalScrollIndicator={false}
          >
            <MainContent {...sharedProps} isDesktop={false} />
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════
// Reusable Dropdown List
// ══════════════════════════════════════════════════════════════
function DropdownList({ items, selectedValue, onSelect }) {
  return (
    <View style={styles.dropdown}>
      {items.map((item, index) => {
        const isSelected = selectedValue === item;
        return (
          <TouchableOpacity
            key={item}
            activeOpacity={0.75}
            style={[
              styles.dropdownItem,
              isSelected && styles.dropdownItemSelected,
              index === items.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={() => onSelect(item)}
          >
            <View style={styles.dropdownItemRow}>
              <View style={[styles.dropdownDot, isSelected && styles.dropdownDotSelected]} />
              <Text style={[styles.dropdownText, isSelected && styles.dropdownTextSelected]}>
                {item}
              </Text>
              {isSelected && <Text style={styles.dropdownCheck}>✓</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Content
// ══════════════════════════════════════════════════════════════
function MainContent({
  selectedBatch, setSelectedBatch,
  resourceTitle, setResourceTitle,
  subject, setSubject,
  activeFilter, setActiveFilter,
  isDesktop,
  showBatchDropdown, setShowBatchDropdown,
  showSubjectDropdown, setShowSubjectDropdown,
  uploadedFiles, setUploadedFiles,
  batchOptions,
  subjectOptions,
  resolvedInstituteId,
  resolvedTeacherId,
  resolvedTeacherName,
}) {
  const wrap = isDesktop
    ? { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 20 }
    : {};

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setShowBatchDropdown(false);
  };

  const handleSubjectSelect = (sub) => {
    setSubject(sub);
    setShowSubjectDropdown(false);
  };

  const closeAll = () => {
    setShowBatchDropdown(false);
    setShowSubjectDropdown(false);
  };

  const handleBrowseFiles = async () => {
    closeAll();
    
    try {
      if (IS_WEB) {
        Alert.alert(
          'File Upload Unavailable',
          'Browse Files is available in the native app build only. Please use the mobile app to upload resources.'
        );
        return;
      }

      const DocumentPicker = require('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        copyToCacheDirectory: false,
      });

      if (result.canceled) return;

      if (!subject) {
        Alert.alert('Validation', 'Please select a subject before uploading.');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        for (const file of result.assets) {
          const fileName = file.name;
          const fileType = fileName.split('.').pop().toUpperCase();
          
          // Determine icon based on file type
          let icon = '📄';
          let iconBg = '#EEF2FF';
          
          if (['PDF'].includes(fileType)) {
            icon = '📊';
            iconBg = '#E8F5F1';
          } else if (['DOCX', 'DOC'].includes(fileType)) {
            icon = '📄';
            iconBg = '#EEF2FF';
          } else if (['PPTX', 'PPT'].includes(fileType)) {
            icon = '▶️';
            iconBg = '#FFF3E8';
          } else if (['XLSX', 'XLS'].includes(fileType)) {
            icon = '📊';
            iconBg = '#E8F5F1';
          }
          
          await addFileToUploads(file, fileName, fileType, icon, iconBg, resourceTitle);
        }
      }
    } catch (err) {
      console.error('Error picking file:', err);
      Alert.alert('Upload failed', err?.message || 'Failed to pick file. Please try again.');
    }
  };

  const addFileToUploads = async (fileAsset, fileName, fileType, icon, iconBg, title = '') => {
    if (!resolvedInstituteId || !resolvedTeacherId) {
      Alert.alert('Missing session', 'Teacher session is missing institute or teacher ID. Please login again.');
      return;
    }

    const filePayload = {
      instituteId: resolvedInstituteId,
      teacherId: resolvedTeacherId,
      teacherName: resolvedTeacherName,
      title: title || fileName,
      subject,
      batch: selectedBatch || 'OPEN ACCESS',
      fileName,
      fileType,
      mimeType: String(fileAsset?.mimeType || '').trim(),
      fileSize: Number(fileAsset?.size || 0),
      fileUri: String(fileAsset?.uri || '').trim(),
    };

    const { response } = await fetchWithBaseUrlFallback('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filePayload),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to save note in database');
    }

    const newFile = {
      id: payload?._id || Date.now(),
      name: fileName,
      title: title || fileName,
      icon: icon,
      iconBg: iconBg,
      tags: [
        subject.toUpperCase().replace(/ /g, '-'),
        selectedBatch || 'OPEN ACCESS',
      ],
      time: 'Just now',
      tagColors: [C.tagBg, C.tagGreen],
      tagTextColors: [C.tagText, C.tagGreenText],
    };

    setUploadedFiles((prev) => [newFile, ...prev]);
  };

  const filterFilesBySubject = () => {
    const allFiles = [...uploadedFiles];
    
    if (activeFilter === 'ALL') {
      return allFiles;
    }
    
    return allFiles.filter(item => {
      const firstTag = item.tags[0] || '';
      
      if (activeFilter === 'PHYSICS') {
        return firstTag.includes('PHYSICS');
      } else if (activeFilter === 'MATH') {
        return firstTag.includes('MATH') || firstTag.includes('CALCULUS');
      } else if (activeFilter === 'CHEMISTRY') {
        return firstTag.includes('CHEMISTRY') || firstTag.includes('ECON');
      }
      
      return true;
    });
  };

  return (
    <View style={wrap}>

      {/* ── Hero ── */}
      <View style={[styles.heroSection, isDesktop && styles.heroSectionDesktop]}>
        <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
          Notes & Resources 
        </Text>
        <Text style={styles.heroSub}>
          Distribute learning materials across your active batches with precision and ease.
        </Text>
      </View>

      {/* ── Left column ── */}
      <View style={isDesktop ? styles.leftCol : {}}>

        {/* Active Context Card */}
        <View style={styles.card}>
          <Text style={styles.contextLabel}>ACTIVE CONTEXT</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.batchSelector,
              showBatchDropdown && styles.selectorOpen,
            ]}
            onPress={() => {
              setShowBatchDropdown(prev => !prev);
              setShowSubjectDropdown(false);
            }}
          >
            <View style={styles.batchSelectorLeft}>
              <View style={styles.batchIconBadge}>
                <Text style={styles.batchIconGlyph}>◆</Text>
              </View>
              <Text style={[
                styles.batchSelectorText,
                !selectedBatch && styles.placeholderText,
              ]}>
                {selectedBatch || 'Select Batch'}
              </Text>
            </View>
            <Text style={[styles.chevron, showBatchDropdown && styles.chevronActive]}>
              {showBatchDropdown ? '⌃' : '⌄'}
            </Text>
          </TouchableOpacity>

          {showBatchDropdown && (
            <DropdownList
              items={batchOptions}
              selectedValue={selectedBatch}
              onSelect={handleBatchSelect}
            />
          )}
        </View>

        {/* Resource Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIconDoc}>📋</Text>
            <Text style={styles.cardTitle}>Resource Details</Text>
          </View>

          <Text style={styles.fieldLabel}>RESOURCE TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Advanced Calculus – Week 4 Notes"
            placeholderTextColor={C.textMuted}
            value={resourceTitle}
            onChangeText={setResourceTitle}
            onFocus={closeAll}
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>SUBJECT</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.selectBox,
              showSubjectDropdown && styles.selectorOpen,
            ]}
            onPress={() => {
              setShowSubjectDropdown(prev => !prev);
              setShowBatchDropdown(false);
            }}
          >
            <Text style={styles.selectText}>{subject || 'Select Subject'}</Text>
            <Text style={[styles.chevron, showSubjectDropdown && styles.chevronActive]}>
              {showSubjectDropdown ? '⌃' : '⌄'}
            </Text>
          </TouchableOpacity>

          {showSubjectDropdown && (
            <DropdownList
              items={subjectOptions}
              selectedValue={subject}
              onSelect={handleSubjectSelect}
            />
          )}
        </View>

        {/* Upload Zone Card */}
        <View style={[styles.card, styles.uploadZone]}>
          <View style={styles.uploadIconCircle}>
            <Text style={styles.uploadIconText}>↑</Text>
          </View>
          <Text style={styles.uploadTitle}>Drag & Drop Materials</Text>
          <Text style={styles.uploadSub}>
            Supported formats: PDF, DOCX, PPTX{'\n'}(Max 25MB)
          </Text>
          <TouchableOpacity activeOpacity={0.85} style={styles.browseBtn} onPress={handleBrowseFiles}>
            <Text style={styles.browseBtnText}>Browse Files</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Right column ── */}
      <View style={isDesktop ? styles.rightCol : {}}>

        {/* Recent Uploads Card */}
        <View style={styles.card}>
          <View style={styles.filterRow}>
            {['ALL', 'PHYSICS', 'MATH', 'CHEMISTRY'].map(tab => (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
                onPress={() => { setActiveFilter(tab); closeAll(); }}
              >
                <Text style={[
                  styles.filterTabText,
                  activeFilter === tab && styles.filterTabTextActive,
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Uploads</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={closeAll}>
            
            </TouchableOpacity>
          </View>

          {filterFilesBySubject().length > 0 ? (
            filterFilesBySubject().map(item => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                style={styles.uploadItem}
                onPress={closeAll}
              >
                <View style={[styles.uploadItemIcon, { backgroundColor: item.iconBg }]}>
                  <Text style={styles.uploadItemIconText}>{item.icon}</Text>
                </View>
                <View style={styles.uploadItemInfo}>
                  {item.title && (
                    <Text style={styles.uploadItemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  )}
                  <Text style={styles.uploadItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.tagRow}>
                    {item.tags.map((tag, ti) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: item.tagColors[ti] }]}>
                        <Text style={[styles.tagText, { color: item.tagTextColors[ti] }]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.uploadTime}>{item.time}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noFilesText}>No files found for {activeFilter}</Text>
          )}
        </View>

        {/* Storage Card */}
      
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// Styles
// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  mobileRoot: { flex: 1, backgroundColor: C.bg },
  mobileScroll: { padding: 16, paddingBottom: 90 },

  heroSection: { marginBottom: 20 },
  heroSectionDesktop: { width: '100%', marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  heroTitleDesktop: { fontSize: 34 },
  heroSub: { fontSize: 13, color: C.textSecondary, marginTop: 4, lineHeight: 18 },

  leftCol: { flex: 1, minWidth: 280 },
  rightCol: { flex: 1, minWidth: 280 },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({
      ios: {
        shadowColor: C.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  cardIconDoc: { fontSize: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },

  // Batch selector
  contextLabel: {
    fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1, marginBottom: 8,
  },
  batchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  selectorOpen: {
    borderColor: C.teal,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: C.tealPale,
  },
  batchSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  batchIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: C.tealPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.tealBorder,
  },
  batchIconGlyph: { color: C.teal, fontSize: 10, fontWeight: '700' },
  batchSelectorText: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  placeholderText: { color: C.textMuted, fontWeight: '400' },
  chevron: { color: C.textSecondary, fontSize: 16 },
  chevronActive: { color: C.teal },

  // Dropdown
  dropdown: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.teal,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    marginBottom: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dropdownItemSelected: { backgroundColor: C.tealPale },
  dropdownItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.border,
  },
  dropdownDotSelected: { backgroundColor: C.teal },
  dropdownText: { flex: 1, fontSize: 13, color: C.textPrimary, fontWeight: '500' },
  dropdownTextSelected: { color: C.teal, fontWeight: '700' },
  dropdownCheck: { fontSize: 13, color: C.teal, fontWeight: '700' },

  // Form fields
  fieldLabel: {
    fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1, marginBottom: 6,
  },
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: C.textPrimary,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectText: { fontSize: 13, color: C.textPrimary, fontWeight: '500' },

  // Upload zone
  uploadZone: {
    borderStyle: 'dashed',
    borderColor: C.tealBorder,
    alignItems: 'center',
    paddingVertical: 28,
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.tealPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadIconText: { fontSize: 22, color: C.teal, fontWeight: '700' },
  uploadTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  uploadSub: {
    fontSize: 12, color: C.textSecondary, textAlign: 'center', lineHeight: 17, marginBottom: 16,
  },
  browseBtn: {
    backgroundColor: C.navy, paddingHorizontal: 36, paddingVertical: 13, borderRadius: 10,
  },
  browseBtnText: { color: C.white, fontWeight: '700', fontSize: 14, letterSpacing: 0.3 },

  // Filter tabs
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterTabActive: { backgroundColor: C.teal, borderColor: C.teal },
  filterTabText: { fontSize: 11, fontWeight: '700', color: C.textSecondary, letterSpacing: 0.5 },
  filterTabTextActive: { color: C.white },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  viewArchive: { fontSize: 10, fontWeight: '700', color: C.teal, letterSpacing: 0.8 },

  uploadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  uploadItemIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  uploadItemIconText: { fontSize: 18 },
  uploadItemInfo: { flex: 1 },
  uploadItemTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 3 },
  uploadItemName: { fontSize: 12, fontWeight: '500', color: C.textSecondary, marginBottom: 5 },
  tagRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  uploadTime: { fontSize: 10, color: C.textMuted, fontWeight: '500' },

  noFilesText: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 20 },

  storageCard: { backgroundColor: C.navy, borderColor: C.navyLight },
  storageLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 6,
  },
  storageValue: { fontSize: 28, fontWeight: '800', color: C.white, marginBottom: 12 },
  storageTotal: { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.5)' },
  storageBarBg: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 10, overflow: 'hidden',
  },
  storageBarFill: { height: '100%', backgroundColor: C.tealLight, borderRadius: 3 },
  storageNote: { fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 16 },
});
