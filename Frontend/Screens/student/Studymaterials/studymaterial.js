import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  FlatList,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#F2F2F7',
  white: '#FFFFFF',
  indigo: '#4F46E5',
  indigoLight: '#EEF2FF',
  indigoDark: '#3730A3',
  dark: '#111827',
  text: '#374151',
  muted: '#9CA3AF',
  mutedLight: '#E5E7EB',
  border: '#E5E7EB',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  streakFrom: '#F97316',
  streakTo: '#7C3AED',
  pink: '#DB2777',
  pinkLight: '#FCE7F3',
  progressReading: '#4F46E5',
  progressVideo: '#7C3AED',
  cardPurple: '#4338CA',
  overlay: 'rgba(0,0,0,0.5)',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatRelativeTime = (value) => {
  if (!value) return 'Recently added';

  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return 'Recently added';

  const diffMs = Date.now() - createdAt.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return createdAt.toLocaleDateString();
};

const normalizeNoteItem = (note) => {
  const subject = String(note?.subject || 'Note').trim();
  const batch = String(note?.batch || 'OPEN ACCESS').trim();
  const fileName = String(note?.fileName || note?.title || subject || 'Untitled Note').trim();
  const fileType = String(note?.fileType || 'Document').trim();
  const title = String(note?.title || fileName).trim();
  const teacherName = String(note?.teacherName || 'Teacher').trim();

  return {
    id: note?._id || fileName,
    icon: fileType.toLowerCase().includes('video') ? '▶' : '📄',
    iconBg: fileType.toLowerCase().includes('video') ? '#FCE7F3' : C.indigoLight,
    iconColor: fileType.toLowerCase().includes('video') ? C.pink : C.indigo,
    title,
    meta: `${teacherName} • ${subject} • ${formatRelativeTime(note?.createdAt)}`,
    tag: batch,
    fileUri: note?.fileUri || '',
    fileType,
  };
};

const collectionsData = [
  // Removed dummy data — now fetched from backend batch subjects
];

// ─── TOP NAV ──────────────────────────────────────────────────────────────────
function TopNav() {
  const [search, setSearch] = useState('');
  return (
    <View style={styles.topNav}>
    </View>
  );
}

// ─── STREAK BANNER ────────────────────────────────────────────────────────────
function StreakBanner() {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.streakBanner}>
      <View style={styles.streakOverlay} />
      <View style={styles.streakContent}>
        <View style={styles.streakTagRow}>
          <Text style={styles.streakFire}>🔥</Text>
          <Text style={styles.streakTag}>ACTIVE STREAK</Text>
        </View>
        <Text style={styles.streakTitle}>12 Days{'\n'}Streak</Text>
        <Text style={styles.streakSub}>You're in the top 5% of students this month!</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── LEARNING PROGRESS ────────────────────────────────────────────────────────
function LearningProgress({ readingProgress = 0 }) {
  return (
    <View style={[styles.card, { marginTop: 12 }]}>
      <Text style={styles.sectionTitle}>Learning Progress</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Reading</Text>
          <Text style={[styles.progressPct, { color: C.progressReading }]}>{Math.round(readingProgress)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${readingProgress}%`, backgroundColor: C.progressReading }]} />
        </View>
      </View>
    </View>
  );
}

// ─── BOOKMARKS ────────────────────────────────────────────────────────────────
function Bookmarks({ bookmarks, onRemoveBookmark }) {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newBookmark, setNewBookmark] = useState('');

  // Note: adding bookmarks via free text is supported too, 
  // but chapter bookmarks come from the document viewer

  return (
    <View style={[styles.card, { marginTop: 12 }]}>
      <View style={styles.bookmarksHeader}>
        <Text style={styles.sectionTitle}>Bookmarks</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.savedGuides}>SAVED GUIDES</Text>
        </TouchableOpacity>
      </View>
      {bookmarks.length === 0 ? (
        <Text style={styles.emptyText}>No bookmarks yet. Add one below!</Text>
      ) : (
        bookmarks.map((b) => (
          <View key={b.id} style={styles.bookmarkItem}>
            <Text style={styles.bookmarkIcon}>🔖</Text>
            <Text style={styles.bookmarkLabel} numberOfLines={1}>{b.label}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onRemoveBookmark(b.id)}
              style={styles.bookmarkRemoveBtn}
            >
              <Text style={styles.bookmarkRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Add New Bookmark Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddModalVisible(false)}
        >
          <View style={styles.addBookmarkModal}>
            <Text style={styles.modalTitle}>Add New Bookmark</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter bookmark name..."
              placeholderTextColor={C.muted}
              value={newBookmark}
              onChangeText={setNewBookmark}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.modalCancelBtn}
                onPress={() => { setAddModalVisible(false); setNewBookmark(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.modalConfirmBtn}
                onPress={() => {
                  if (newBookmark.trim()) {
                    // handled in parent
                    Alert.alert('Use the document viewer to bookmark chapters!');
                    setAddModalVisible(false);
                    setNewBookmark('');
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.addBookmarkBtn}
        onPress={() => setAddModalVisible(true)}
      >
        <Text style={styles.addBookmarkText}>+ Add New Bookmark</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── RECENTLY ACCESSED (with expand toggle) ───────────────────────────────────
function RecentlyAccessed({ notes = [] }) {
  const [expanded, setExpanded] = useState(false);

  const allHistory = Array.isArray(notes) ? notes : [];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Recently Accessed</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.viewAll}>{expanded ? '▲ Collapse' : '▼ View History'}</Text>
        </TouchableOpacity>
      </View>

      {!expanded ? (
        /* Horizontal preview */
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
          {allHistory.slice(0, 3).map((item) => (
            <TouchableOpacity key={item.id} activeOpacity={0.8} style={styles.recentCard}>
              <View style={[styles.recentIconBox, { backgroundColor: item.iconBg }]}>
                <Text style={[styles.recentIconText, { color: item.iconColor }]}>{item.icon}</Text>
              </View>
              <Text style={styles.recentTitle}>{item.title}</Text>
              <Text style={styles.recentMeta}>{item.meta}</Text>
              <View style={styles.recentTag}>
                <Text style={styles.recentTagText}>{item.tag}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        /* Expanded full list */
        <View style={styles.card}>
          <Text style={styles.historyHeadingSmall}>All History ({allHistory.length} items)</Text>
          {allHistory.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              style={[styles.historyRow, i < allHistory.length - 1 && styles.fileRowBorder]}
            >
              <View style={[styles.historyIconBox, { backgroundColor: item.iconBg }]}>
                <Text style={{ fontSize: 16, color: item.iconColor }}>{item.icon}</Text>
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileTitle}>{item.title}</Text>
                <Text style={styles.fileMeta}>{item.meta}</Text>
              </View>
              <View style={styles.recentTag}>
                <Text style={styles.recentTagText}>{item.tag}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.collapseBtn}
            onPress={() => setExpanded(false)}
          >
            <Text style={styles.collapseBtnText}>▲ Collapse</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── COLLECTION FILES MODAL ───────────────────────────────────────────────────
function CollectionFilesModal({ collection, visible, onClose }) {
  if (!collection) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.collectionModal}>
          <View style={styles.collectionModalHeader}>
            <Text style={styles.collectionModalTitle}>{collection.title}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.collectionModalSub}>{collection.files} Files • {collection.sub}</Text>
          {collection.subjects.map((sub, i) => (
            <View
              key={sub.id}
              style={[styles.fileRow, i < collection.subjects.length - 1 && styles.fileRowBorder]}
            >
              <View style={[styles.fileIconBox, { backgroundColor: sub.iconBg }]}>
                <Text style={styles.fileIconText}>{sub.icon}</Text>
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileTitle}>{sub.title}</Text>
                <Text style={styles.fileMeta}>{sub.meta}</Text>
              </View>
              <Text style={styles.fileType}>Document</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── COURSE COLLECTIONS ───────────────────────────────────────────────────────
function CourseCollections({ subjects = [] }) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Course Collections</Text>
        <Text style={styles.emptyText}>No subjects available in your batch.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>Course Collections</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionsRow}>
        {subjects.map((subjectName, i) => (
          <TouchableOpacity key={`${subjectName}-${i}`} activeOpacity={0.8} style={styles.collectionCard}>
            <View style={styles.collectionIconBox}>
              <Text style={{ fontSize: 20 }}>📚</Text>
            </View>
            <Text style={styles.collectionTitle}>{subjectName}</Text>
            <Text style={styles.collectionSub}>Subject materials</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── CHAPTER DOCUMENT VIEWER ──────────────────────────────────────────────────
function ChapterViewer({ subject, visible, onClose, bookmarks, onToggleBookmark }) {
  const [selectedChapter, setSelectedChapter] = useState(null);

  if (!subject) return null;

  const chapters = Array.isArray(subject.chapters) ? subject.chapters : [];
  const isTeacherNote = chapters.length === 0;

  const isChapterBookmarked = (chapterId) =>
    bookmarks.some((b) => b.id === `bk-${chapterId}`);

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.docSafe}>
        {/* Document viewer header */}
        <View style={styles.docHeader}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (selectedChapter) {
                setSelectedChapter(null);
              } else {
                onClose();
              }
            }}
            style={styles.docBackBtn}
          >
            <Text style={styles.docBackText}>← {selectedChapter ? 'Chapters' : 'Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.docHeaderTitle} numberOfLines={1}>
            {selectedChapter ? selectedChapter.title : subject.title}
          </Text>
          {selectedChapter && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onToggleBookmark(`bk-${selectedChapter.id}`, `${subject.title}: ${selectedChapter.title}`)}
              style={styles.bookmarkIconBtn}
            >
              <Text style={styles.bookmarkIconBtnText}>
                {isChapterBookmarked(selectedChapter.id) ? '🔖' : '🏷️'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isTeacherNote ? (
          <ScrollView style={styles.chapterList} contentContainerStyle={{ padding: 20 }}>
            <View style={styles.chapterListHeader}>
              <View style={[styles.fileIconBox, { backgroundColor: subject.iconBg, marginBottom: 10 }]}>
                <Text style={{ fontSize: 24 }}>{subject.icon}</Text>
              </View>
              <Text style={styles.chapterListTitle}>{subject.title}</Text>
              <Text style={styles.chapterListMeta}>{subject.meta}</Text>
            </View>

            <View style={{ backgroundColor: C.white, borderRadius: 16, padding: 16, gap: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }}>Shared by teacher</Text>
              <Text style={{ fontSize: 13, color: C.text, lineHeight: 20 }}>
                {subject.fileType || 'Document'} • {subject.tag || 'OPEN ACCESS'}
              </Text>
              {!!subject.fileUri && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.bookmarkChapterBtn, { marginTop: 12 }]}
                  onPress={() => Alert.alert('File attached', subject.fileUri)}
                >
                  <Text style={styles.bookmarkChapterBtnText}>View File Link</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        ) : !selectedChapter ? (
          /* Chapter list */
          <ScrollView style={styles.chapterList}>
            <View style={styles.chapterListHeader}>
              <View style={[styles.fileIconBox, { backgroundColor: subject.iconBg, marginBottom: 10 }]}>
                <Text style={{ fontSize: 24 }}>{subject.icon}</Text>
              </View>
              <Text style={styles.chapterListTitle}>{subject.title}</Text>
              <Text style={styles.chapterListMeta}>{chapters.length} Chapters • {subject.meta}</Text>
            </View>
            {chapters.map((ch, i) => (
              <TouchableOpacity
                key={ch.id}
                activeOpacity={0.75}
                style={styles.chapterItem}
                onPress={() => setSelectedChapter(ch)}
              >
                <View style={styles.chapterNumBox}>
                  <Text style={styles.chapterNum}>{i + 1}</Text>
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.chapterItemTitle}>{ch.title}</Text>
                  {isChapterBookmarked(ch.id) && (
                    <Text style={styles.chapterBookmarkedBadge}>🔖 Bookmarked</Text>
                  )}
                </View>
                <Text style={styles.chapterArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          ) : (
          /* Chapter content */
          <ScrollView style={styles.chapterContent} contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.chapterContentTitle}>{selectedChapter.title}</Text>
            <View style={styles.chapterDivider} />
            <Text style={styles.chapterContentBody}>{selectedChapter.content}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.bookmarkChapterBtn,
                isChapterBookmarked(selectedChapter.id) && styles.bookmarkChapterBtnActive,
              ]}
              onPress={() =>
                onToggleBookmark(`bk-${selectedChapter.id}`, `${subject.title}: ${selectedChapter.title}`)
              }
            >
              <Text style={[
                styles.bookmarkChapterBtnText,
                isChapterBookmarked(selectedChapter.id) && styles.bookmarkChapterBtnTextActive,
              ]}>
                {isChapterBookmarked(selectedChapter.id) ? '🔖 Bookmarked' : '🏷️ Bookmark this Chapter'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── FILE LIST (Notes) ────────────────────────────────────────────────────────
function FileList({ notes, bookmarks, onToggleBookmark, onFilePress }) {
  const [docVisible, setDocVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  return (
    <View style={styles.section}>
      <View style={styles.fileListHeader}>
        <Text style={styles.sectionHeading}>Notes</Text>
      </View>
      <View style={styles.card}>
        {notes.length === 0 ? (
          <Text style={styles.emptyText}>No notes shared by teachers yet.</Text>
        ) : notes.map((file, i) => (
          <TouchableOpacity
            key={file.id}
            activeOpacity={0.75}
            style={[styles.fileRow, i < notes.length - 1 && styles.fileRowBorder]}
            onPress={() => {
              if (onFilePress) {
                onFilePress(file);
              } else {
                setSelectedSubject(file);
                setDocVisible(true);
              }
            }}
          >
            <View style={[styles.fileIconBox, { backgroundColor: file.iconBg }]}>
              <Text style={styles.fileIconText}>{file.icon}</Text>
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileTitle} numberOfLines={1}>{file.title}</Text>
              <Text style={styles.fileMeta}>{file.meta}</Text>
            </View>
            <Text style={styles.fileType}>{file.fileType || 'Document'}</Text>
            <TouchableOpacity activeOpacity={0.7} style={styles.fileMenuBtn}>
              <Text style={styles.fileMenuIcon}>›</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      <ChapterViewer
        subject={selectedSubject}
        visible={docVisible}
        onClose={() => { setDocVisible(false); setSelectedSubject(null); }}
        bookmarks={bookmarks}
        onToggleBookmark={onToggleBookmark}
      />
    </View>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function CuratedResources({ instituteId = '', batchId = '', student }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [batchSubjects, setBatchSubjects] = useState([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [pdfVisible, setPdfVisible] = useState(false);

  const resolvedInstituteId = instituteId || student?.instituteId || '';
  const resolvedBatchId = batchId || student?.batchId || student?.batch || '';

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch notes if we have an institute ID
        if (resolvedInstituteId) {
          const query = new URLSearchParams({ instituteId: resolvedInstituteId });
          if (resolvedBatchId) query.set('batch', resolvedBatchId);

          const { response } = await fetchWithBaseUrlFallback(`/api/notes?${query.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response?.ok) {
            const payload = await response.json();
            const normalized = Array.isArray(payload) ? payload.map(normalizeNoteItem) : [];
            setNotes(normalized);
          } else {
            setNotes([]);
          }
        } else {
          setNotes([]);
        }

        // Fetch batch subjects if we have both institute and batch IDs
        if (resolvedBatchId && resolvedInstituteId) {
          const { response } = await fetchWithBaseUrlFallback(
            `/api/batches/${resolvedBatchId}?instituteId=${resolvedInstituteId}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
          );

          if (response?.ok) {
            const batch = await response.json();
            setBatchSubjects(Array.isArray(batch?.subjects) ? batch.subjects : []);
          } else {
            setBatchSubjects([]);
          }
        } else {
          setBatchSubjects([]);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load resources');
        setNotes([]);
        setBatchSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [resolvedInstituteId, resolvedBatchId]);

  const handleToggleBookmark = (id, label) => {
    setBookmarks((prev) => {
      const exists = prev.find((b) => b.id === id);
      if (exists) {
        return prev.filter((b) => b.id !== id);
      }
      return [...prev, { id, label }];
    });
  };

  const handleRemoveBookmark = (id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddBookmarkFromPdf = (file) => {
    const id = `bk-${Date.now()}`;
    const label = file.title || file.fileName || 'Bookmark';
    setBookmarks((p) => [...p, { id, label }]);
    Alert.alert('Bookmark added');
  };

  const handleUpdateProgress = (updater) => {
    setReadingProgress((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return Math.max(0, Math.min(100, next));
    });
  };

  const openPdfFile = (file) => {
    if (!file || !file.fileUri) {
      Alert.alert('No file', 'This note has no file attached.');
      return;
    }
    setSelectedPdfFile(file);
    setPdfVisible(true);
    handleUpdateProgress((p) => Math.min(100, p + 5));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Curated Resources</Text>
          <Text style={styles.pageSub}>
            Notes shared by your teachers and filtered for your class.
          </Text>
        </View>

        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ color: C.muted }}>Loading teacher notes...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={{ backgroundColor: C.redLight, borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: C.red, fontWeight: '700' }}>{error}</Text>
          </View>
        )}

        {/* Main layout */}
        <View style={[styles.mainGrid, !isTablet && styles.mainGridCol]}>
          {/* Left / main column */}
          <View style={isTablet ? styles.leftCol : styles.fullWidth}>
            <RecentlyAccessed notes={notes} />
            <CourseCollections subjects={batchSubjects} />
            <FileList notes={notes} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} onFilePress={openPdfFile} />
          </View>

          {/* Right panel */}
          <View style={isTablet ? styles.rightCol : styles.fullWidth}>
            <StreakBanner />
            <LearningProgress readingProgress={readingProgress} />
            <Bookmarks bookmarks={bookmarks} onRemoveBookmark={handleRemoveBookmark} />
          </View>
        </View>
      </ScrollView>

      {/* PDF Viewer Modal */}
      {selectedPdfFile && (
        <Modal visible={pdfVisible} animationType="slide" presentationStyle="fullScreen">
          <SafeAreaView style={styles.pdfSafe}>
            <View style={styles.pdfHeader}>
              <TouchableOpacity onPress={() => setPdfVisible(false)}>
                <Text style={styles.pdfCloseBtn}>✕ Close</Text>
              </TouchableOpacity>
              <Text style={styles.pdfTitle} numberOfLines={1}>{selectedPdfFile.title}</Text>
              <TouchableOpacity onPress={() => handleAddBookmarkFromPdf(selectedPdfFile)}>
                <Text style={styles.pdfBookmarkBtn}>🔖</Text>
              </TouchableOpacity>
            </View>

            {selectedPdfFile.fileUri && (
              <WebView
                source={{ uri: `https://docs.google.com/gview?url=${encodeURIComponent(selectedPdfFile.fileUri)}&embedded=true` }}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.pdfLoading}>
                    <ActivityIndicator size="large" color={C.indigo} />
                    <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                  </View>
                )}
                onLoadEnd={() => handleUpdateProgress((p) => Math.min(100, p + 20))}
                style={styles.pdf}
              />
            )}

            <View style={styles.pdfFooter}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedPdfFile.fileUri) {
                    Linking.openURL(selectedPdfFile.fileUri).catch(() =>
                      Alert.alert('Error', 'Cannot open external app')
                    );
                  }
                }}
              >
                <Text style={styles.pdfFooterText}>📥 Open in default app</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // ── Nav ──
  topNav: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.white,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border, gap: 12,
  },
  searchWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 8, gap: 6,
    maxWidth: isTablet ? 400 : undefined,
  },
  searchIcon: { fontSize: 13, color: C.muted },
  searchInput: { flex: 1, fontSize: 13, color: C.text, padding: 0 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navBrand: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: C.bg },
  navBrandText: { fontSize: 13, fontWeight: '800', color: C.dark },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { padding: isTablet ? 24 : 16 },

  // ── Page Header ──
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: isTablet ? 32 : 26, fontWeight: '800', color: C.dark, letterSpacing: -0.8 },
  pageSub: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 18 },

  // ── Layout ──
  mainGrid: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  mainGridCol: { flexDirection: 'column' },
  leftCol: { flex: 2 },
  rightCol: { width: 260 },
  fullWidth: { width: '100%' },

  // ── Shared ──
  card: {
    backgroundColor: C.white, borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12, elevation: 2,
  },
  section: { marginBottom: 22 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  sectionHeading: { fontSize: 17, fontWeight: '800', color: C.dark },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.dark, marginBottom: 14 },
  viewAll: { fontSize: 13, fontWeight: '700', color: C.indigo },
  emptyText: { fontSize: 13, color: C.muted, marginBottom: 10 },

  // ── Streak Banner ──
  streakBanner: { height: 160, borderRadius: 20, backgroundColor: '#5B21B6', overflow: 'hidden', marginBottom: 0 },
  streakOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(67,56,202,0.55)' },
  streakContent: { padding: 18, flex: 1, justifyContent: 'space-between' },
  streakTagRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakFire: { fontSize: 14 },
  streakTag: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: 1.2 },
  streakTitle: { fontSize: 28, fontWeight: '900', color: C.white, lineHeight: 34, letterSpacing: -0.5 },
  streakSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 15 },

  // ── Progress ──
  progressRow: { marginBottom: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  progressPct: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: C.bg, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  // ── Bookmarks ──
  bookmarksHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  savedGuides: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8 },
  bookmarkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.bg,
  },
  bookmarkIcon: { fontSize: 16 },
  bookmarkLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: C.dark },
  bookmarkRemoveBtn: { padding: 4 },
  bookmarkRemoveText: { fontSize: 12, color: C.red, fontWeight: '700' },
  addBookmarkBtn: {
    marginTop: 10, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  addBookmarkText: { fontSize: 13, fontWeight: '600', color: C.muted },

  // ── Add Bookmark Modal ──
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  addBookmarkModal: {
    backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.dark, marginBottom: 16 },
  modalInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.dark, marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: C.muted },
  modalConfirmBtn: {
    flex: 1, backgroundColor: C.indigo, borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: C.white },

  // ── Recently Accessed ──
  recentRow: { gap: 12, paddingRight: 16 },
  recentCard: {
    width: isTablet ? 200 : SCREEN_WIDTH * 0.52, backgroundColor: C.white, borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2, gap: 6,
  },
  recentIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  recentIconText: { fontSize: 18 },
  recentTitle: { fontSize: 14, fontWeight: '800', color: C.dark, lineHeight: 19 },
  recentMeta: { fontSize: 11, color: C.muted },
  recentTag: {
    alignSelf: 'flex-start', backgroundColor: C.bg, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 4,
  },
  recentTagText: { fontSize: 9, fontWeight: '700', color: C.muted, letterSpacing: 0.8 },

  // ── History Expanded ──
  historyHeadingSmall: { fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 4, letterSpacing: 0.5 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12,
  },
  historyIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  collapseBtn: {
    marginTop: 12, backgroundColor: C.bg, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  collapseBtnText: { fontSize: 13, fontWeight: '700', color: C.indigo },

  // ── Course Collections ──
  collectionsRow: { gap: 12, paddingRight: 16 },
  collectionCard: {
    width: isTablet ? 170 : SCREEN_WIDTH * 0.44, backgroundColor: C.white, borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2, gap: 6,
  },
  collectionCardActive: {
    backgroundColor: C.cardPurple, shadowColor: C.cardPurple, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  collectionFileBadge: {
    alignSelf: 'flex-start', backgroundColor: C.indigoLight, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4,
  },
  collectionFileBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  collectionFilesText: { fontSize: 10, fontWeight: '700', color: C.indigo, letterSpacing: 0.3 },
  collectionFilesTextActive: { color: C.white },
  collectionIconBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.indigoLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  collectionIconBoxActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  collectionTitle: { fontSize: 15, fontWeight: '800', color: C.dark, lineHeight: 20 },
  collectionTitleActive: { color: C.white },
  collectionSub: { fontSize: 11, color: C.muted, lineHeight: 15 },
  collectionSubActive: { color: 'rgba(255,255,255,0.7)' },

  // ── Collection Modal ──
  collectionModal: {
    backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%',
  },
  collectionModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  collectionModalTitle: { fontSize: 20, fontWeight: '800', color: C.dark },
  collectionModalSub: { fontSize: 12, color: C.muted, marginBottom: 18 },
  closeBtn: { fontSize: 18, color: C.muted, fontWeight: '700', padding: 4 },

  // ── File List ──
  fileListHeader: {
    flexDirection: isTablet ? 'row' : 'column', justifyContent: 'space-between',
    alignItems: isTablet ? 'center' : 'flex-start', gap: 10, marginBottom: 14,
  },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  fileRowBorder: { borderBottomWidth: 1, borderBottomColor: C.bg },
  fileIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fileIconText: { fontSize: 20 },
  fileInfo: { flex: 1 },
  fileTitle: { fontSize: 13, fontWeight: '700', color: C.dark },
  fileMeta: { fontSize: 11, color: C.muted, marginTop: 2 },
  fileType: { fontSize: 12, color: C.muted, fontWeight: '500', minWidth: 60, textAlign: 'right' },
  fileMenuBtn: { padding: 6 },
  fileMenuIcon: { fontSize: 20, color: C.indigo, fontWeight: '700' },

  // ── Chapter Viewer / Document ──
  docSafe: { flex: 1, backgroundColor: C.white },
  docHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.white, gap: 10,
  },
  docBackBtn: { paddingVertical: 4, paddingRight: 8 },
  docBackText: { fontSize: 14, fontWeight: '700', color: C.indigo },
  docHeaderTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.dark },
  bookmarkIconBtn: { padding: 6 },
  bookmarkIconBtnText: { fontSize: 20 },

  chapterList: { flex: 1, backgroundColor: C.bg },
  chapterListHeader: { alignItems: 'center', padding: 28, backgroundColor: C.white, marginBottom: 8 },
  chapterListTitle: { fontSize: 24, fontWeight: '900', color: C.dark, marginBottom: 4 },
  chapterListMeta: { fontSize: 13, color: C.muted },

  chapterItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.white,
    marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 16, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1,
  },
  chapterNumBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.indigoLight,
    alignItems: 'center', justifyContent: 'center',
  },
  chapterNum: { fontSize: 14, fontWeight: '800', color: C.indigo },
  chapterItemTitle: { fontSize: 14, fontWeight: '700', color: C.dark, lineHeight: 19 },
  chapterBookmarkedBadge: { fontSize: 11, color: C.indigo, marginTop: 3 },
  chapterArrow: { fontSize: 22, color: C.muted, fontWeight: '300' },

  chapterContent: { flex: 1, backgroundColor: C.white },
  chapterContentTitle: { fontSize: 20, fontWeight: '900', color: C.dark, lineHeight: 28, marginBottom: 12 },
  chapterDivider: { height: 2, backgroundColor: C.indigo, width: 40, borderRadius: 1, marginBottom: 20 },
  chapterContentBody: { fontSize: 15, color: C.text, lineHeight: 26 },

  bookmarkChapterBtn: {
    marginTop: 32, borderWidth: 2, borderColor: C.indigo, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: 32,
  },
  bookmarkChapterBtnActive: { backgroundColor: C.indigo },
  bookmarkChapterBtnText: { fontSize: 15, fontWeight: '700', color: C.indigo },
  bookmarkChapterBtnTextActive: { color: C.white },

  // ── PDF Viewer ──
  pdfSafe: { flex: 1, backgroundColor: C.white },
  pdfHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.white,
  },
  pdfCloseBtn: { color: C.indigo, fontWeight: '700', fontSize: 14 },
  pdfTitle: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 15 },
  pdfBookmarkBtn: { fontSize: 20, padding: 8 },
  pdfLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pdfLoadingText: { marginTop: 8, color: C.muted, fontSize: 13 },
  pdf: { flex: 1 },
  pdfFooter: { padding: 12, borderTopWidth: 1, borderTopColor: C.border, alignItems: 'center' },
  pdfFooterText: { color: C.indigo, fontWeight: '700', fontSize: 13 },
});

