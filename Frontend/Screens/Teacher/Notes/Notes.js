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
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchContextData = async () => {
      if (!resolvedInstituteId) return;

      try {
        const { response } = await fetchWithBaseUrlFallback(
          `/api/schedules?instituteId=${encodeURIComponent(resolvedInstituteId)}`,
          { method: 'GET', headers: { Accept: 'application/json' } }
        );

        const schedules = await response.json();
        if (!response.ok || !Array.isArray(schedules)) return;

        // Teacher references for filtering
        const teacherRefs = [
          resolvedTeacherId.toLowerCase(),
          resolvedTeacherName.toLowerCase(),
        ].filter(Boolean);

        const matchedBatches = new Set();
        const matchedSubjects = new Set();

        schedules.forEach(sched => {
          const sessions = Array.isArray(sched.sessions) ? sched.sessions : [];
          sessions.forEach(sess => {
            const facultyId = String(sess?.faculty?.id || '').toLowerCase();
            const facultyName = String(sess?.faculty?.label || '').toLowerCase();
            const subjectName = String(sess?.subject?.label || '').trim();
            const batchName = String(sched?.batch?.label || sched?.batch?.name || '').trim();

            const isMatch = teacherRefs.some(ref => 
              (facultyId && facultyId === ref) || 
              (facultyName && facultyName === ref)
            );

            if (isMatch) {
              if (batchName) matchedBatches.add(batchName);
              if (subjectName) matchedSubjects.add(subjectName);
            }
          });
        });

        const nextBatchOptions = Array.from(matchedBatches).sort();
        const nextSubjectOptions = Array.from(matchedSubjects).sort();

        if (isMounted) {
          setBatchOptions(nextBatchOptions);
          setSubjectOptions(nextSubjectOptions);

          if (nextSubjectOptions.length > 0 && (!subject || !nextSubjectOptions.includes(subject))) {
            setSubject(nextSubjectOptions[0]);
          }

          if (selectedBatch && !nextBatchOptions.includes(selectedBatch)) {
            setSelectedBatch(null);
          }
        }
      } catch (error) {
        console.error('Error fetching schedule context:', error);
      }

      // Fetch previously uploaded notes
      try {
        const query = new URLSearchParams({ 
          instituteId: resolvedInstituteId,
          teacherId: resolvedTeacherId,
          teacherName: resolvedTeacherName
        });
        
        const { response } = await fetchWithBaseUrlFallback(`/api/notes?${query.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response?.ok) {
          const notes = await response.json();
          if (Array.isArray(notes) && isMounted) {
            const formattedNotes = notes.map(note => {
              const fileType = note.fileType || 'DOCUMENT';
              let icon = '📄';
              let iconBg = '#EEF2FF';
              
              if (fileType.includes('PDF')) {
                icon = '📊';
                iconBg = '#E8F5F1';
              } else if (fileType.includes('PPT')) {
                icon = '▶️';
                iconBg = '#FFF3E8';
              }

              return {
                id: note._id,
                name: note.fileName,
                title: note.title || note.fileName,
                icon,
                iconBg,
                tags: [
                  String(note.subject || '').toUpperCase().replace(/ /g, '-'),
                  String(note.batch || 'OPEN ACCESS')
                ],
                time: new Date(note.createdAt).toLocaleDateString(),
                tagColors: [C.tagBg, C.tagGreen],
                tagTextColors: [C.tagText, C.tagGreenText],
                fileUri: note.fileUri
              };
            });
            setUploadedFiles(formattedNotes);
          }
        }
      } catch (err) {
        console.error('Error fetching uploaded notes:', err);
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
    pendingFiles, setPendingFiles,
    isUploading, setIsUploading,
  };

  const getFileBase64 = async (uri, mimeType) => {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const FileSystem = require('expo-file-system');
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const type = mimeType || 'application/octet-stream';
        return `data:${type};base64,${base64}`;
      }
    } catch (err) {
      console.error('Base64 conversion error:', err);
      return '';
    }
  };

  const handleBrowseFiles = async () => {
    setShowBatchDropdown(false);
    setShowSubjectDropdown(false);
    
    try {


      const DocumentPicker = require('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
          'application/msword',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-powerpoint'
        ],
        copyToCacheDirectory: false,
        multiple: true,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const newPending = result.assets.map(file => {
          const fileName = file.name;
          const fileExt = fileName.split('.').pop().toLowerCase();
          
          if (!['pdf', 'docx', 'doc', 'pptx', 'ppt'].includes(fileExt)) {
             return null;
          }

          let icon = '📄';
          let iconBg = '#EEF2FF';
          
          if (fileExt === 'pdf') {
            icon = '📊';
            iconBg = '#E8F5F1';
          } else if (['pptx', 'ppt'].includes(fileExt)) {
            icon = '▶️';
            iconBg = '#FFF3E8';
          }

          return {
            asset: file,
            fileName,
            fileType: fileExt.toUpperCase(),
            icon,
            iconBg,
            title: resourceTitle || fileName,
          };
        }).filter(Boolean);

        if (newPending.length === 0) {
          Alert.alert('Invalid Format', 'Please select only PDF, DOCX, or PPTX files.');
          return;
        }

        setPendingFiles(prev => [...prev, ...newPending]);
      }
    } catch (err) {
      console.error('Error picking file:', err);
      Alert.alert('Pick failed', err?.message || 'Failed to pick file. Please try again.');
    }
  };

  const handleUploadAll = async () => {
    if (pendingFiles.length === 0) return;
    
    if (!subject) {
      Alert.alert('Validation', 'Please select a subject before uploading.');
      return;
    }

    if (!selectedBatch) {
      Alert.alert('Validation', 'Please select a batch (or Open Access) before uploading.');
      return;
    }

    try {
      setIsUploading(true);
      
      for (const fileObj of pendingFiles) {
        await addFileToUploads(
          fileObj.asset, 
          fileObj.fileName, 
          fileObj.fileType, 
          fileObj.icon, 
          fileObj.iconBg, 
          fileObj.title
        );
      }

      setPendingFiles([]);
      setResourceTitle('');
      Alert.alert('Success', `${pendingFiles.length} note(s) uploaded successfully!`);
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Upload partial failure', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addFileToUploads = async (fileAsset, fileName, fileType, icon, iconBg, title = '') => {
    if (!resolvedInstituteId || !resolvedTeacherId) {
      Alert.alert('Missing session', 'Teacher session is missing institute or teacher ID. Please login again.');
      return;
    }

    const mimeType = String(fileAsset?.mimeType || '').trim();
    const fileData = await getFileBase64(String(fileAsset?.uri || ''), mimeType);

    const filePayload = {
      instituteId: resolvedInstituteId,
      teacherId: resolvedTeacherId,
      teacherName: resolvedTeacherName,
      title: title || fileName,
      subject,
      batch: selectedBatch || 'OPEN ACCESS',
      fileName,
      fileType,
      mimeType,
      fileSize: Number(fileAsset?.size || 0),
      fileUri: String(fileAsset?.uri || '').trim(),
      fileData,
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

  sharedProps.handleBrowseFiles = handleBrowseFiles;
  sharedProps.handleUploadAll = handleUploadAll;
  sharedProps.removePendingFile = removePendingFile;
  sharedProps.addFileToUploads = addFileToUploads;

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
  pendingFiles, setPendingFiles,
  isUploading, setIsUploading,
  handleUploadAll,
  handleBrowseFiles,
  removePendingFile,
  addFileToUploads,
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



  const filterFilesBySubject = () => {
    const allFiles = [...uploadedFiles];
    
    if (activeFilter === 'ALL') {
      return allFiles;
    }
    
    // Dynamically filter by the selected subject name
    return allFiles.filter(item => {
      const firstTag = String(item.tags[0] || '').toUpperCase();
      const filterTag = String(activeFilter).toUpperCase().replace(/ /g, '-');
      return firstTag.includes(filterTag);
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
          
          {pendingFiles.length > 0 && (
            <View style={styles.pendingList}>
              {pendingFiles.map((pf, idx) => (
                <View key={`${pf.fileName}-${idx}`} style={styles.pendingItem}>
                   <Text style={styles.pendingItemText} numberOfLines={1}>📎 {pf.fileName}</Text>
                   <TouchableOpacity onPress={() => removePendingFile(idx)}>
                     <Text style={styles.removePendingText}>✕</Text>
                   </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.uploadBtnRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.browseBtn} onPress={handleBrowseFiles}>
              <Text style={styles.browseBtnText}>Browse Files</Text>
            </TouchableOpacity>

            {pendingFiles.length > 0 && (
              <TouchableOpacity 
                activeOpacity={0.85} 
                style={[styles.uploadNotesBtn, isUploading && styles.uploadNotesBtnDisabled]} 
                onPress={handleUploadAll}
                disabled={isUploading}
              >
                <Text style={styles.uploadNotesBtnText}>
                  {isUploading ? 'Uploading...' : `Upload Notes (${pendingFiles.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Right column ── */}
      <View style={isDesktop ? styles.rightCol : {}}>

        {/* Recent Uploads Card */}
        <View style={styles.card}>
          <View style={styles.filterRow}>
            {['ALL', ...subjectOptions].map(tab => (
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

  // Pending upload styles
  pendingList: { width: '100%', marginTop: 12, marginBottom: 12, gap: 6 },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pendingItemText: { flex: 1, fontSize: 12, color: C.textPrimary, fontWeight: '500' },
  removePendingText: { fontSize: 14, color: '#EF4444', fontWeight: '700', paddingHorizontal: 4 },
  
  uploadBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4, width: '100%', justifyContent: 'center' },
  uploadNotesBtn: {
    backgroundColor: C.teal,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  uploadNotesBtnDisabled: { backgroundColor: C.textMuted },
  uploadNotesBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
});
