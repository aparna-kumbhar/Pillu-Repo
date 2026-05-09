import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  indigo: '#6366F1',
  indigoLight: '#EEF2FF',
  dark: '#0F172A',
  text: '#334155',
  muted: '#64748B',
  border: '#E2E8F0',
  red: '#EF4444',
  redLight: '#FEF2F2',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatRelativeTime = (value) => {
  if (!value) return 'Recently';
  const createdAt = new Date(value);
  if (isNaN(createdAt.getTime())) return 'Recently';
  const diffMs = Date.now() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return createdAt.toLocaleDateString();
};

const normalizeNoteItem = (note) => {
  const subject = String(note?.subject || 'General').trim();
  const fileName = String(note?.fileName || note?.title || 'Untitled').trim();
  const teacherName = String(note?.teacherName || 'Teacher').trim();

  return {
    id: note?._id || Math.random().toString(),
    title: String(note?.title || fileName).trim(),
    subject,
    teacher: teacherName,
    date: formatRelativeTime(note?.createdAt),
    fileUri: note?.fileUri || '',
    fileData: note?.fileData || '',
    fileType: note?.fileType || 'PDF',
  };
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function LearningProgress({ readingProgress = 0 }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeading}>Learning Progress</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Overall Completion</Text>
          <Text style={[styles.progressPct, { color: C.indigo }]}>{Math.round(readingProgress)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${readingProgress}%`, backgroundColor: C.indigo }]} />
        </View>
      </View>
      <Text style={styles.progressSub}>Keep it up! You're making great progress in your courses.</Text>
    </View>
  );
}

function SubjectGroup({ subject, notes, onFilePress }) {
  return (
    <View style={styles.subjectContainer}>
      <View style={styles.subjectHeader}>
        <View style={styles.subjectIconBox}>
          <Text style={{ fontSize: 18 }}>📚</Text>
        </View>
        <Text style={styles.subjectTitle}>{subject}</Text>
      </View>
      <View style={styles.notesList}>
        {notes.map((note, idx) => (
          <TouchableOpacity
            key={note.id || idx}
            activeOpacity={0.7}
            style={[styles.noteRow, idx < notes.length - 1 && styles.borderBottom]}
            onPress={() => onFilePress(note)}
          >
            <View style={styles.noteIconBox}>
              <Text style={{ fontSize: 20 }}>📄</Text>
            </View>
            <View style={styles.noteInfo}>
              <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
              <Text style={styles.noteMeta}>{note.teacher} • {note.date}</Text>
            </View>
            <Text style={styles.viewText}>View →</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function CuratedResources({ instituteId = '', batchId = '', student }) {
  const [notes, setNotes] = useState([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const resolvedInstituteId = instituteId || student?.instituteId || '';
  const resolvedBatchId = batchId || student?.batchId || student?.batch || '';

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      setError('');
      try {
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
          }
        }
      } catch (err) {
        setError('Unable to load notes. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    loadNotes();
  }, [resolvedInstituteId, resolvedBatchId]);

  const groupedNotes = useMemo(() => {
    const groups = {};
    notes.forEach((n) => {
      if (!groups[n.subject]) groups[n.subject] = [];
      groups[n.subject].push(n);
    });
    return groups;
  }, [notes]);

  const handleOpenFile = (file) => {
    if (!file.fileUri && !file.fileData) {
      Alert.alert('Missing Resource', 'This note has no content attached.');
      return;
    }
    setSelectedFile(file);
    setModalVisible(true);
    setReadingProgress(prev => Math.min(100, prev + 2));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Study Materials</Text>
          <Text style={styles.headerSub}>Access all resources shared by your teachers subject-wise.</Text>
        </View>

        <LearningProgress readingProgress={readingProgress} />

        {loading && (
          <ActivityIndicator size="large" color={C.indigo} style={{ marginTop: 40 }} />
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && notes.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Notes Yet</Text>
            <Text style={styles.emptySub}>Uploaded notes from your teachers will appear here.</Text>
          </View>
        )}

        <View style={styles.grid}>
          {Object.entries(groupedNotes).map(([subject, subNotes]) => (
            <SubjectGroup 
              key={subject} 
              subject={subject} 
              notes={subNotes} 
              onFilePress={handleOpenFile} 
            />
          ))}
        </View>
      </ScrollView>

      {/* PDF / Document Viewer Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.pdfSafe}>
          <View style={styles.pdfHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.pdfClose}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.pdfTitle} numberOfLines={1}>{selectedFile?.title}</Text>
            <View style={{ width: 40 }} />
          </View>

          {selectedFile && (
            Platform.OS === 'web' ? (
              <iframe 
                src={selectedFile.fileData || selectedFile.fileUri}
                style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
                title="Document"
              />
            ) : (
              <WebView
                source={{ 
                  uri: selectedFile.fileData || 
                       `https://docs.google.com/gview?url=${encodeURIComponent(selectedFile.fileUri)}&embedded=true` 
                }}
                style={{ flex: 1 }}
                startInLoadingState
              />
            )
          )}

          <View style={styles.pdfFooter}>
            <TouchableOpacity
              onPress={() => {
                const target = selectedFile?.fileData || selectedFile?.fileUri;
                if (target) {
                  if (Platform.OS === 'web' && selectedFile?.fileData) {
                    const link = document.createElement('a');
                    link.href = selectedFile.fileData;
                    link.download = selectedFile.title || 'resource';
                    link.click();
                  } else {
                    Linking.openURL(target).catch(() => Alert.alert('Error', 'Cannot open file.'));
                  }
                }
              }}
            >
              <Text style={styles.downloadText}>📥 Download / Open Externally</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1, ...Platform.select({ web: { overflowY: 'auto' } }) },
  scrollContent: { padding: 20 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: C.dark },
  headerSub: { fontSize: 14, color: C.muted, marginTop: 4 },

  card: { backgroundColor: C.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 24 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 12 },
  progressRow: { marginBottom: 8 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: C.muted, fontWeight: '600' },
  progressPct: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: C.bg, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressSub: { fontSize: 12, color: C.muted, marginTop: 4 },

  grid: { gap: 20 },
  subjectContainer: { backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  subjectHeader: { padding: 16, backgroundColor: '#F8FAFF', borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  subjectIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.indigoLight, alignItems: 'center', justifyContent: 'center' },
  subjectTitle: { fontSize: 16, fontWeight: '700', color: C.dark },

  notesList: { paddingHorizontal: 12 },
  noteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: C.border },
  noteIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  noteInfo: { flex: 1 },
  noteTitle: { fontSize: 14, fontWeight: '600', color: C.dark },
  noteMeta: { fontSize: 11, color: C.muted, marginTop: 2 },
  viewText: { fontSize: 12, fontWeight: '700', color: C.indigo },

  errorBox: { padding: 16, backgroundColor: C.redLight, borderRadius: 12, marginBottom: 20 },
  errorText: { color: C.red, fontWeight: '600', textAlign: 'center' },

  emptyBox: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.dark },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 4 },

  pdfSafe: { flex: 1, backgroundColor: C.white },
  pdfHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  pdfClose: { color: C.indigo, fontWeight: '700' },
  pdfTitle: { flex: 1, textAlign: 'center', fontWeight: '700', marginHorizontal: 20 },
  pdfFooter: { padding: 16, borderTopWidth: 1, borderTopColor: C.border, alignItems: 'center' },
  downloadText: { color: C.indigo, fontWeight: '700' },
});
