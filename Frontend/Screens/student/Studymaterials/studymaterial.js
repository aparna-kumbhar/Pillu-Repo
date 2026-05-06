import React, { useState } from 'react';
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
} from 'react-native';

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

// ─── Data ─────────────────────────────────────────────────────────────────────
const allHistory = [
  { id: 'r1', icon: '📄', iconBg: C.indigoLight, iconColor: C.indigo, title: 'Quantum Mechanics Notes', meta: 'Revised 2 hours ago', tag: 'PHYSICS' },
  { id: 'r2', icon: '▶', iconBg: '#FCE7F3', iconColor: C.pink, title: 'Calculus II Video Lecture', meta: '45% Completed', tag: 'MATH' },
  { id: 'r3', icon: '⚗', iconBg: '#ECFDF5', iconColor: C.green, title: 'Organic Chemistry Resource', meta: 'Shared by Dr. Miller', tag: 'CHEMISTRY' },
  { id: 'r4', icon: '📐', iconBg: '#FEF3C7', iconColor: C.amber, title: 'Linear Algebra Exercises', meta: 'Accessed yesterday', tag: 'MATH' },
  { id: 'r5', icon: '🧬', iconBg: '#F0F9FF', iconColor: '#0EA5E9', title: 'Cell Biology Slides', meta: 'Accessed 2 days ago', tag: 'BIOLOGY' },
  { id: 'r6', icon: '⚛︎', iconBg: '#DBEAFE', iconColor: '#3B82F6', title: 'Thermodynamics Problems', meta: 'Accessed 3 days ago', tag: 'PHYSICS' },
  { id: 'r7', icon: '📊', iconBg: '#F3F4F6', iconColor: C.muted, title: 'Statistics Workbook', meta: 'Accessed last week', tag: 'MATH' },
];

const collectionsData = [
  {
    id: 'c1', files: 24, title: 'Advanced Physics', sub: 'Particle dynamics & Relativity',
    subjects: [
      { id: 'f1', icon: '📕', iconBg: '#FEE2E2', title: 'Classical Mechanics', meta: 'Added Oct 12 • 4.2 MB' },
      { id: 'f2', icon: '⚛︎', iconBg: '#DBEAFE', title: 'Quantum Theory', meta: 'Added Oct 10 • 6.1 MB' },
      { id: 'f3', icon: '🌌', iconBg: '#F5F3FF', title: 'Relativity', meta: 'Added Oct 08 • 3.8 MB' },
      { id: 'f4', icon: '🔭', iconBg: '#ECFDF5', title: 'Astrophysics', meta: 'Added Oct 06 • 5.2 MB' },
    ],
  },
  {
    id: 'c2', files: 18, title: 'Digital Literature', sub: 'Post-modern narratives',
    subjects: [
      { id: 'f5', icon: '📖', iconBg: '#FEF3C7', title: 'Modernist Fiction', meta: 'Added Oct 11 • 2.9 MB' },
      { id: 'f6', icon: '✍️', iconBg: '#FCE7F3', title: 'Poetry Analysis', meta: 'Added Oct 09 • 1.5 MB' },
      { id: 'f7', icon: '🎭', iconBg: '#F0F9FF', title: 'Drama Studies', meta: 'Added Oct 07 • 3.1 MB' },
    ],
  },
  {
    id: 'c3', files: 31, title: 'Discrete Mathematics', sub: 'Logic & Computation',
    subjects: [
      { id: 'f8', icon: '🔢', iconBg: '#F3F4F6', title: 'Graph Theory', meta: 'Added Oct 13 • 4.8 MB' },
      { id: 'f9', icon: '💡', iconBg: '#ECFDF5', title: 'Boolean Logic', meta: 'Added Oct 11 • 2.2 MB' },
      { id: 'f10', icon: '🧮', iconBg: '#EEF2FF', title: 'Combinatorics', meta: 'Added Oct 09 • 3.7 MB' },
    ],
  },
  {
    id: 'c4', files: 12, title: 'UI/UX Foundation', sub: 'Heuristics & Prototypes',
    subjects: [
      { id: 'f11', icon: '🎨', iconBg: '#FCE7F3', title: 'Design Principles', meta: 'Added Oct 12 • 2.0 MB' },
      { id: 'f12', icon: '📱', iconBg: '#F0F9FF', title: 'Mobile Patterns', meta: 'Added Oct 10 • 1.8 MB' },
    ],
  },
];

const noteSubjects = [
  {
    id: 'n1', icon: '📕', iconBg: '#FEE2E2', title: 'Physics', meta: 'Added on Oct 12 • 4.2 MB', type: 'Document',
    chapters: [
      { id: 'ch1', title: 'Chapter 1: Introduction to Mechanics', content: 'Mechanics is the branch of physics that deals with the motion of objects and the forces that cause such motion. This chapter covers Newton\'s Laws, kinematics, and basic dynamics.\n\n**Newton\'s First Law:** An object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force.\n\n**Newton\'s Second Law:** F = ma (Force equals mass times acceleration)\n\n**Newton\'s Third Law:** For every action, there is an equal and opposite reaction.\n\nWe also cover projectile motion, circular motion, and introduce the concept of energy and work.' },
      { id: 'ch2', title: 'Chapter 2: Thermodynamics', content: 'Thermodynamics is the study of heat, temperature, and energy transfer. Key concepts include:\n\n**Zeroth Law:** If two systems are each in thermal equilibrium with a third system, they are in thermal equilibrium with each other.\n\n**First Law:** Energy cannot be created or destroyed, only transformed (Conservation of Energy). ΔU = Q - W\n\n**Second Law:** Heat flows spontaneously from hot to cold bodies. Entropy of an isolated system never decreases.\n\n**Third Law:** The entropy of a perfect crystal at absolute zero is zero.' },
      { id: 'ch3', title: 'Chapter 3: Electromagnetism', content: 'Electromagnetism describes the interaction between electrically charged particles and the magnetic fields they produce.\n\n**Coulomb\'s Law:** The force between two charges: F = kq₁q₂/r²\n\n**Gauss\'s Law:** The total electric flux through a closed surface equals the enclosed charge divided by ε₀.\n\n**Faraday\'s Law:** A changing magnetic field induces an EMF in a loop.\n\n**Maxwell\'s Equations:** A set of four equations that form the foundation of classical electromagnetism.' },
      { id: 'ch4', title: 'Chapter 4: Quantum Mechanics', content: 'Quantum mechanics describes the behavior of matter and energy at atomic and subatomic scales.\n\n**Wave-Particle Duality:** Particles like electrons exhibit both wave-like and particle-like properties.\n\n**Heisenberg Uncertainty Principle:** ΔxΔp ≥ ℏ/2 — you cannot simultaneously know the exact position and momentum of a particle.\n\n**Schrödinger Equation:** iℏ ∂ψ/∂t = Ĥψ — describes how the quantum state of a physical system changes over time.\n\n**Quantum Numbers:** Describe the state of electrons in atoms.' },
    ],
  },
  {
    id: 'n2', icon: '⚛︎', iconBg: '#DBEAFE', title: 'Chemistry', meta: 'Added on Oct 10 • 128 MB', type: 'Document',
    chapters: [
      { id: 'ch5', title: 'Chapter 1: Atomic Structure', content: 'Atoms are the basic units of matter and the defining structure of elements. An atom consists of a dense central nucleus surrounded by a cloud of negatively charged electrons.\n\n**Protons:** Positively charged particles in the nucleus. Determines the element.\n\n**Neutrons:** Neutral particles in the nucleus. Determines the isotope.\n\n**Electrons:** Negatively charged particles orbiting the nucleus in shells/orbitals.\n\n**Electron Configuration:** Describes the distribution of electrons in an atom\'s orbitals following the Aufbau principle, Hund\'s rule, and Pauli exclusion principle.' },
      { id: 'ch6', title: 'Chapter 2: Chemical Bonding', content: 'Chemical bonds are the forces that hold atoms together in compounds.\n\n**Ionic Bonds:** Formed by the transfer of electrons between metals and non-metals. Results in positively and negatively charged ions.\n\n**Covalent Bonds:** Formed by the sharing of electrons between non-metals. Can be single, double, or triple bonds.\n\n**Metallic Bonds:** Found in metals; electrons are delocalized and shared among a lattice of atoms.\n\n**Hydrogen Bonds:** Special type of dipole-dipole interaction between hydrogen and electronegative atoms (N, O, F).' },
      { id: 'ch7', title: 'Chapter 3: Organic Chemistry', content: 'Organic chemistry is the study of carbon-containing compounds and their reactions.\n\n**Hydrocarbons:** Compounds containing only carbon and hydrogen (alkanes, alkenes, alkynes, aromatics).\n\n**Functional Groups:** Specific groups of atoms that determine the chemical properties of organic molecules (hydroxyl, carbonyl, carboxyl, amino, etc.).\n\n**Reactions:** Substitution, addition, elimination, oxidation-reduction.\n\n**Polymers:** Large molecules made up of repeating structural units (monomers).' },
    ],
  },
  {
    id: 'n3', icon: '🔢', iconBg: '#F3F4F6', title: 'Maths', meta: 'Added on Oct 08 • 4.2 MB', type: 'Document',
    chapters: [
      { id: 'ch8', title: 'Chapter 1: Calculus', content: 'Calculus is the mathematical study of continuous change.\n\n**Differential Calculus:** Deals with derivatives and rates of change. If f(x) is a function, its derivative f\'(x) gives the slope of the tangent line at any point.\n\n**Power Rule:** d/dx[xⁿ] = nxⁿ⁻¹\n**Chain Rule:** d/dx[f(g(x))] = f\'(g(x))·g\'(x)\n**Product Rule:** d/dx[f·g] = f\'g + fg\'\n\n**Integral Calculus:** Deals with the accumulation of quantities and the areas under curves. The Fundamental Theorem of Calculus links differentiation and integration.' },
      { id: 'ch9', title: 'Chapter 2: Linear Algebra', content: 'Linear algebra is the branch of mathematics concerning linear equations, linear maps, and their representations in vector spaces and through matrices.\n\n**Vectors:** Objects with magnitude and direction. Operations: addition, scalar multiplication, dot product, cross product.\n\n**Matrices:** Rectangular arrays of numbers. Operations: addition, multiplication, transposition, inversion.\n\n**Determinants:** A scalar value that can be computed from the elements of a square matrix. det(A) = 0 means the matrix is singular.\n\n**Eigenvalues/Eigenvectors:** Av = λv — special vectors that only scale under a linear transformation.' },
      { id: 'ch10', title: 'Chapter 3: Statistics & Probability', content: 'Statistics and probability provide tools for analyzing data and quantifying uncertainty.\n\n**Descriptive Statistics:** Mean, median, mode, variance, standard deviation.\n\n**Probability:** P(A) = favorable outcomes / total outcomes. Rules: addition rule, multiplication rule, Bayes\' theorem.\n\n**Distributions:** Normal distribution (bell curve), Binomial distribution, Poisson distribution.\n\n**Hypothesis Testing:** Null hypothesis, alternative hypothesis, p-value, significance level, t-test, chi-square test.' },
    ],
  },
  {
    id: 'n4', icon: '🧬', iconBg: '#F0F9FF', title: 'Biology', meta: 'Added on Oct 08 • 4.2 MB', type: 'Document',
    chapters: [
      { id: 'ch11', title: 'Chapter 1: Cell Biology', content: 'The cell is the basic structural and functional unit of life.\n\n**Prokaryotic Cells:** No membrane-bound nucleus. Includes bacteria and archaea.\n\n**Eukaryotic Cells:** Have a membrane-bound nucleus and organelles. Includes plant, animal, and fungal cells.\n\n**Key Organelles:**\n- Nucleus: Contains DNA and controls cell activities\n- Mitochondria: Powerhouse of the cell; ATP production\n- Ribosomes: Protein synthesis\n- Endoplasmic Reticulum: Protein and lipid synthesis\n- Golgi Apparatus: Protein modification and packaging' },
      { id: 'ch12', title: 'Chapter 2: Genetics', content: 'Genetics is the study of genes, heredity, and genetic variation in living organisms.\n\n**DNA Structure:** Double helix made of nucleotides (Adenine, Thymine, Guanine, Cytosine).\n\n**DNA Replication:** Semi-conservative; each strand serves as a template. Enzyme: DNA polymerase.\n\n**Protein Synthesis:**\n- Transcription: DNA → mRNA (in nucleus)\n- Translation: mRNA → protein (at ribosome)\n\n**Mendelian Genetics:** Dominant and recessive alleles, Punnett squares, law of segregation, law of independent assortment.\n\n**Mutations:** Changes in DNA sequence; can be substitution, insertion, or deletion.' },
    ],
  },
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
function LearningProgress() {
  return (
    <View style={[styles.card, { marginTop: 12 }]}>
      <Text style={styles.sectionTitle}>Learning Progress</Text>
      {[
        { label: 'Reading', pct: 72, color: C.progressReading },
        { label: 'Video Lectures', pct: 45, color: C.progressVideo },
      ].map((item) => (
        <View key={item.label} style={styles.progressRow}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>{item.label}</Text>
            <Text style={[styles.progressPct, { color: item.color }]}>{item.pct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
          </View>
        </View>
      ))}
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
function RecentlyAccessed() {
  const [expanded, setExpanded] = useState(false);

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
function CourseCollections() {
  const [active, setActive] = useState('c1');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const handleFileBadgePress = (col) => {
    setSelectedCollection(col);
    setModalVisible(true);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>Course Collections</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionsRow}>
        {collectionsData.map((col) => {
          const isActive = active === col.id;
          return (
            <TouchableOpacity
              key={col.id}
              activeOpacity={0.8}
              onPress={() => setActive(col.id)}
              style={[styles.collectionCard, isActive && styles.collectionCardActive]}
            >
              {/* File badge — tappable */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleFileBadgePress(col)}
                style={[styles.collectionFileBadge, isActive && styles.collectionFileBadgeActive]}
              >
                <Text style={[styles.collectionFilesText, isActive && styles.collectionFilesTextActive]}>
                  {col.files} Files
                </Text>
              </TouchableOpacity>

              <View style={[styles.collectionIconBox, isActive && styles.collectionIconBoxActive]}>
                <Text style={{ fontSize: 20 }}>📚</Text>
              </View>
              <Text style={[styles.collectionTitle, isActive && styles.collectionTitleActive]}>
                {col.title}
              </Text>
              <Text style={[styles.collectionSub, isActive && styles.collectionSubActive]}>
                {col.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <CollectionFilesModal
        collection={selectedCollection}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ─── CHAPTER DOCUMENT VIEWER ──────────────────────────────────────────────────
function ChapterViewer({ subject, visible, onClose, bookmarks, onToggleBookmark }) {
  const [selectedChapter, setSelectedChapter] = useState(null);

  if (!subject) return null;

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

        {!selectedChapter ? (
          /* Chapter list */
          <ScrollView style={styles.chapterList}>
            <View style={styles.chapterListHeader}>
              <View style={[styles.fileIconBox, { backgroundColor: subject.iconBg, marginBottom: 10 }]}>
                <Text style={{ fontSize: 24 }}>{subject.icon}</Text>
              </View>
              <Text style={styles.chapterListTitle}>{subject.title}</Text>
              <Text style={styles.chapterListMeta}>{subject.chapters.length} Chapters • {subject.meta}</Text>
            </View>
            {subject.chapters.map((ch, i) => (
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
function FileList({ bookmarks, onToggleBookmark }) {
  const [docVisible, setDocVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  return (
    <View style={styles.section}>
      <View style={styles.fileListHeader}>
        <Text style={styles.sectionHeading}>Notes</Text>
      </View>
      <View style={styles.card}>
        {noteSubjects.map((file, i) => (
          <TouchableOpacity
            key={file.id}
            activeOpacity={0.75}
            style={[styles.fileRow, i < noteSubjects.length - 1 && styles.fileRowBorder]}
            onPress={() => {
              setSelectedSubject(file);
              setDocVisible(true);
            }}
          >
            <View style={[styles.fileIconBox, { backgroundColor: file.iconBg }]}>
              <Text style={styles.fileIconText}>{file.icon}</Text>
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileTitle} numberOfLines={1}>{file.title}</Text>
              <Text style={styles.fileMeta}>{file.meta}</Text>
            </View>
            <Text style={styles.fileType}>{file.type}</Text>
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
export default function CuratedResources() {
  const [bookmarks, setBookmarks] = useState([
    { id: 'b1', label: 'Modernist Poetry Intro' },
    { id: 'b2', label: 'React Lifecycle Hooks' },
    { id: 'b3', label: "Maxwell's Equations Summary" },
  ]);

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
            Your personalized learning vault, organized for academic excellence.
          </Text>
        </View>

        {/* Main layout */}
        <View style={[styles.mainGrid, !isTablet && styles.mainGridCol]}>
          {/* Left / main column */}
          <View style={isTablet ? styles.leftCol : styles.fullWidth}>
            <RecentlyAccessed />
            <CourseCollections />
            <FileList bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />
          </View>

          {/* Right panel */}
          <View style={isTablet ? styles.rightCol : styles.fullWidth}>
            <StreakBanner />
            <LearningProgress />
            <Bookmarks bookmarks={bookmarks} onRemoveBookmark={handleRemoveBookmark} />
          </View>
        </View>
      </ScrollView>
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
});
