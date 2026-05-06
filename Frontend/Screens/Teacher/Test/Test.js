import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ✅ Import the real TestCreation screen
import Testcreation from './Testcreation';

const Stack = createNativeStackNavigator();

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = '#555' }) => {
  const map = {
    grid: '⊞', book: '📚', question: '❓', results: '📊', batch: '👥',
    bell: '🔔', settings: '⚙️', search: '🔍', plus: '＋', help: '❓',
    archive: '🗄️', lightning: '⚡', star: '✦', calendar: '📅', user: '👤',
    file: '📄', check: '✔', edit: '✏️', ai: '✦', curator: '🔵',
  };
  return <Text style={{ fontSize: size, color }}>{map[name] ?? '●'}</Text>;
};

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  bg: '#F7F8FA',
  sidebar: '#FFFFFF',
  sidebarActive: '#1A1A2E',
  accent: '#2D6A4F',
  accentLight: '#E8F4F0',
  accentOrange: '#F4A261',
  accentOrangeLight: '#FEF3EA',
  text: '#1A1A2E',
  textMuted: '#7A7A9A',
  border: '#E8E8F0',
  white: '#FFFFFF',
  published: '#2D6A4F',
  publishedBg: '#E8F4F0',
  draft: '#B5540A',
  draftBg: '#FEF3EA',
  cardBg: '#FFFFFF',
  aiCard: '#1A1A2E',
  shadow: 'rgba(26,26,46,0.08)',
};

const NAV_ITEMS = [
  { id: 'panel',    label: 'Academic Panel',    icon: 'grid'     },
  { id: 'library',  label: 'Test Library',      icon: 'book'     },
  { id: 'question', label: 'Question Bank',     icon: 'question' },
  { id: 'results',  label: 'Results',           icon: 'results'  },
  { id: 'batch',    label: 'Batch Management',  icon: 'batch'    },
];

const ASSESSMENTS = [
  {
    id: '1',
    title: 'Cellular Biology Midterm Q4',
    status: 'PUBLISHED',
    questions: 45,
    date: 'Oct 12, 2023',
    author: 'Dr. Aris Thorne',
    emoji: '🦠',
  },
  {
    id: '2',
    title: 'Advanced Organic Synthesis II',
    status: 'DRAFT',
    questions: 12,
    date: 'Oct 28, 2023',
    author: 'Prof. H. Weiss',
    emoji: '🧪',
  },
  {
    id: '3',
    title: 'Quantum Mechanics Fundamentals',
    status: 'PUBLISHED',
    questions: 30,
    date: 'Sept 15, 2023',
    author: 'Dr. Julian Vance',
    emoji: '⚛️',
  },
];

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ value, label, icon, color }) => (
  <View style={[styles.statCard, { flex: 1 }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
      <Icon name={icon} size={18} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── AssessmentCard ───────────────────────────────────────────────────────────
const AssessmentCard = ({ item, onPress }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[styles.assessmentCard, pressed && styles.assessmentCardPressed]}
    >
      <View style={styles.assessmentThumb}>
        <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.assessmentHeader}>
          <Text style={styles.assessmentTitle} numberOfLines={1}>{item.title}</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  item.status === 'PUBLISHED' ? C.publishedBg : C.draftBg,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: item.status === 'PUBLISHED' ? C.published : C.draft },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
        <View style={styles.assessmentMeta}>
          <Icon name="file" size={12} color={C.textMuted} />
          <Text style={styles.metaText}>{item.questions} Questions</Text>
          <Icon name="calendar" size={12} color={C.textMuted} />
          <Text style={styles.metaText}>{item.date}</Text>
          <Icon name="user" size={12} color={C.textMuted} />
          <Text style={[styles.metaText, { color: C.accent }]} numberOfLines={1}>
            {item.author}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ activeNav, onNav, isTablet }) => (
  <View style={[styles.sidebar, isTablet && styles.sidebarTablet]}>
    <View style={[styles.logo, !isTablet && { justifyContent: 'center' }]}>
     
      {isTablet && (
        <View>
          <Text style={styles.logoTitle}>Modern Scholar</Text>
          <Text style={styles.logoSub}>Academic Portal</Text>
        </View>
      )}
    </View>

    <View style={styles.nav}>
      {NAV_ITEMS.map(item => {
        const active = activeNav === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.75}
            onPress={() => onNav(item.id)}
            style={[
              styles.navItem,
              active && styles.navItemActive,
              !isTablet && { justifyContent: 'center', paddingHorizontal: 0 },
            ]}
          >
            <Icon name={item.icon} size={18} color={active ? C.white : C.textMuted} />
            {isTablet && (
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>

    <View style={styles.sidebarBottom}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.newAssessmentBtn,
          !isTablet && { paddingHorizontal: 0, justifyContent: 'center' },
        ]}
      >
        <Icon name="plus" size={16} color={C.white} />
        {isTablet && <Text style={styles.newAssessmentText}>New Assessment</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.navItem, !isTablet && { justifyContent: 'center', paddingHorizontal: 0 }]}
      >
        <Icon name="help" size={18} color={C.textMuted} />
        {isTablet && <Text style={styles.navLabel}>Help Center</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.navItem, !isTablet && { justifyContent: 'center', paddingHorizontal: 0 }]}
      >
        <Icon name="settings" size={18} color={C.textMuted} />
        {isTablet && <Text style={styles.navLabel}>Archive Settings</Text>}
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Batch Selection Screen ───────────────────────────────────────────────────
function BatchSelectionScreen({ navigation, route }) {
  // Mock batch data
  const batches = [
    { id: '1', name: 'A1 - Physics Stream', students: 45 },
    { id: '2', name: 'A2 - Chemistry Stream', students: 38 },
    { id: '3', name: 'B1 - Biology Stream', students: 52 },
    { id: '4', name: 'B2 - Commerce Stream', students: 41 },
    { id: '5', name: 'C1 - Arts Stream', students: 55 },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      
      <View style={styles.selectionHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontSize: 20, color: C.accent }}>‹</Text>
          <Text style={{ fontSize: 16, color: C.accent, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.selectionContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.selectionTitle}>Select Batch</Text>
        <Text style={styles.selectionSubtitle}>
          Choose the batch to create test for
        </Text>

        <View style={styles.batchListContainer}>
          {batches.map((batch) => (
            <TouchableOpacity
              key={batch.id}
              style={styles.batchCard}
              onPress={() =>
                navigation.navigate('TestCreation', {
                  selectedBatch: batch,
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.batchCardLeft}>
                <View style={styles.batchIcon}>
                  <Text style={{ fontSize: 24 }}>👥</Text>
                </View>
                <View>
                  <Text style={styles.batchName}>{batch.name}</Text>
                  <Text style={styles.batchStudents}>{batch.students} students</Text>
                </View>
              </View>
              <Text style={styles.batchArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TestCreationWrapper ──────────────────────────────────────────────────────
function TestCreationScreen({ navigation, route }) {
  const onTestCreated = route?.params?.onTestCreated || (() => {});
  const selectedBatch = route?.params?.selectedBatch;
  const isEditMode = route?.params?.isEditMode || false;
  const testData = route?.params?.testData;
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f4' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f6f4" />
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#E8E8F0',
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 18, color: '#1d9e75' }}>‹</Text>
        <Text style={{ fontSize: 14, color: '#1d9e75', fontWeight: '600' }}>
          {isEditMode ? 'Back to Test' : 'Back to Batch'}
        </Text>
      </TouchableOpacity>
      <Testcreation 
        navigation={navigation} 
        onTestCreated={onTestCreated}
        selectedBatch={selectedBatch}
        isEditMode={isEditMode}
        testData={testData}
      />
    </SafeAreaView>
  );
}

// ─── Test In Progress Screen ──────────────────────────────────────────────────
function TestInProgressScreen({ navigation, route }) {
  const test = route?.params?.test;
  const [elapsedTime, setElapsedTime] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!test) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.errorText}>Test not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={styles.testInProgressHeader}>
        <View style={styles.testInProgressTitle}>
          <Text style={styles.testEmoji}>{test.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.testInProgressName}>{test.title}</Text>
            <Text style={styles.testInProgressAuthor}>by {test.author}</Text>
          </View>
        </View>
        <View style={styles.testStatusBadge}>
          <Text style={styles.testStatusText}>🔴 LIVE</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.testInProgressContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Section */}
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>Time Elapsed</Text>
          <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.timerSubtext}>
            Started at {new Date().toLocaleTimeString()}
          </Text>
        </View>

        {/* Test Information */}
        <View style={styles.testInfoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📄 Questions</Text>
            <Text style={styles.infoValue}>{test.questions}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⭐ Points per Q</Text>
            <Text style={styles.infoValue}>{test.points || 10} pts</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📝 Type</Text>
            <Text style={styles.infoValue}>{test.questionType}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Instructions</Text>
          <Text style={styles.instructionsText}>
            • Read each question carefully before answering{'\n'}
            • You can review your answers before submitting{'\n'}
            • Total time spent will be tracked{'\n'}
            • Click "End Test" to complete the test
          </Text>
        </View>

        {/* Test Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIndicator} />
          <View>
            <Text style={styles.statusTitle}>Test is Currently Active</Text>
            <Text style={styles.statusDescription}>
              You are now taking this test. All answers will be recorded.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* End Test Footer */}
      <View style={styles.testInProgressFooter}>
        <TouchableOpacity
          style={styles.endTestActionBtn}
          onPress={() => {
            Alert.alert(
              'End Test',
              `Are you sure you want to end this test?\nTime spent: ${formatTime(elapsedTime)}`,
              [
                { text: 'Continue', onPress: () => {} },
                {
                  text: 'End Test',
                  onPress: () => {
                    Alert.alert('Test Completed', `Test completed in ${formatTime(elapsedTime)}!`);
                    navigation.navigate('TestHome');
                  },
                  style: 'destructive',
                },
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.endTestActionText}>✕ End Test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Test Detail Screen ───────────────────────────────────────────────────────
function TestDetailScreen({ navigation, route }) {
  const test = route?.params?.test;
  const [isTestRunning, setIsTestRunning] = useState(false);

  if (!test) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.errorText}>Test not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={styles.testDetailHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontSize: 20, color: C.accent }}>‹</Text>
          <Text style={{ fontSize: 16, color: C.accent, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <View
          style={[
            styles.badge,
            {
              backgroundColor: test.status === 'PUBLISHED' ? C.publishedBg : C.draftBg,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: test.status === 'PUBLISHED' ? C.published : C.draft },
            ]}
          >
            {test.status}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.testDetailContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Test Header */}
        <View style={styles.testHeader}>
          <Text style={styles.testEmoji}>{test.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.testTitle}>{test.title}</Text>
            <View style={styles.testMetaRow}>
              <Icon name="file" size={12} color={C.textMuted} />
              <Text style={styles.testMeta}>{test.questions} Questions</Text>
              <Text style={styles.testMetaDot}>•</Text>
              <Icon name="calendar" size={12} color={C.textMuted} />
              <Text style={styles.testMeta}>{test.date}</Text>
              <Text style={styles.testMetaDot}>•</Text>
              <Text style={styles.testMeta}>{test.points || 10} Points</Text>
            </View>
          </View>
        </View>

        {/* Questions Section */}
        <View style={styles.questionsSection}>
          <Text style={styles.questionsSectionTitle}>Questions</Text>
          
          {test.questions && typeof test.questions === 'number' ? (
            <View style={styles.questionCountCard}>
              <Text style={styles.questionCountText}>
                Total: {test.questions} question{test.questions > 1 ? 's' : ''}
              </Text>
              <Text style={styles.questionCountSubtext}>
                {test.status === 'PUBLISHED'
                  ? 'This test is published and visible to students'
                  : 'This test is in draft mode. Publish to make it visible to students'}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.noQuestionsText}>No questions in this test yet</Text>
            </View>
          )}
        </View>

        {/* Test Details */}
        <View style={styles.testDetailsCard}>
          <Text style={styles.detailsTitle}>Test Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Question Type:</Text>
            <Text style={styles.detailValue}>{test.questionType || 'Multiple Choice'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Points per Question:</Text>
            <Text style={styles.detailValue}>{test.points || 10} pts</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created by:</Text>
            <Text style={styles.detailValue}>{test.author}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created on:</Text>
            <Text style={styles.detailValue}>{test.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: test.status === 'PUBLISHED' ? C.published : C.draft,
                  fontWeight: '700',
                },
              ]}
            >
              {test.status}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* End Test Button */}
      <View style={styles.testDetailFooter}>
        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              isTestRunning ? styles.endTestBtn : styles.startTestBtn,
            ]}
            onPress={() => {
              if (!isTestRunning) {
                setIsTestRunning(true);
                Alert.alert('Test Started', 'The test is now active.');
                return;
              }

              Alert.alert('End Test', 'Are you sure you want to end this test?', [
                { text: 'Cancel', onPress: () => {} },
                {
                  text: 'End Test',
                  onPress: () => {
                    setIsTestRunning(false);
                    Alert.alert('Test Ended', 'The test has been ended.');
                  },
                  style: 'destructive',
                },
              ]);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>
              {isTestRunning ? '✕ End Test' : '▶ Start Test'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.editTestBtn]}
            onPress={() => {
              navigation.navigate('TestCreation', {
                isEditMode: true,
                testData: test,
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>✎ Edit Test</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteTestBtn]}
            onPress={() => {
              Alert.alert(
                'Delete Test',
                `Are you sure you want to delete "${test.title}"? This cannot be undone.`,
                [
                  { text: 'Cancel', onPress: () => {} },
                  {
                    text: 'Delete',
                    onPress: () => {
                      Alert.alert('Deleted', 'Test has been deleted');
                      navigation.goBack();
                    },
                    style: 'destructive',
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── All Archives Screen ──────────────────────────────────────────────────────
function AllArchivesScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [assessments, setAssessments] = useState(route?.params?.assessments || ASSESSMENTS);

  const handlePublish = (testId) => {
    const updatedAssessments = assessments.map(item =>
      item.id === testId ? { ...item, status: 'PUBLISHED' } : item
    );
    setAssessments(updatedAssessments);
    
    const publishedTest = updatedAssessments.find(t => t.id === testId);
    Alert.alert(
      'Published Successfully',
      `"${publishedTest.title}" is now visible to students in their dashboard`,
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const handleUnpublish = (testId) => {
    const updatedAssessments = assessments.map(item =>
      item.id === testId ? { ...item, status: 'DRAFT' } : item
    );
    setAssessments(updatedAssessments);
    
    const test = updatedAssessments.find(t => t.id === testId);
    Alert.alert('Unpublished', `"${test.title}" is now hidden from students`);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      
      {/* Header */}
      <View style={styles.archiveHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontSize: 20, color: C.accent }}>‹</Text>
          <Text style={{ fontSize: 16, color: C.accent, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.archiveTitle}>All Archives ({assessments.length})</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Archives List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.archiveContent}
        showsVerticalScrollIndicator={false}
      >
        {assessments.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.archiveCard}
            onPress={() => navigation.navigate('TestDetail', { test: item })}
            activeOpacity={0.7}
          >
            <View style={styles.archiveCardLeft}>
              <View style={styles.archiveThumb}>
                <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.archiveTitle2} numberOfLines={2}>{item.title}</Text>
                <View style={styles.archiveMeta}>
                  <Icon name="file" size={11} color={C.textMuted} />
                  <Text style={styles.metaTextSmall}>{item.questions} Q</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Icon name="calendar" size={11} color={C.textMuted} />
                  <Text style={styles.metaTextSmall}>{item.date}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Icon name="user" size={11} color={C.textMuted} />
                  <Text style={styles.metaTextSmall} numberOfLines={1}>{item.author}</Text>
                </View>
              </View>
            </View>

            <View style={styles.archiveCardRight}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.status === 'PUBLISHED' ? C.publishedBg : C.draftBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: item.status === 'PUBLISHED' ? C.published : C.draft },
                  ]}
                >
                  {item.status}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.publishBtn,
                  item.status === 'PUBLISHED' && styles.publishBtnActive,
                ]}
                onPress={() =>
                  item.status === 'DRAFT'
                    ? handlePublish(item.id)
                    : handleUnpublish(item.id)
                }
                activeOpacity={0.8}
              >
                <Text style={styles.publishBtnText}>
                  {item.status === 'DRAFT' ? '📤 Publish' : '✓ Published'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
function TestHome({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [activeNav, setActiveNav] = useState('library');
  const [search, setSearch] = useState('');
  const [assessments, setAssessments] = useState(ASSESSMENTS);

  // Handle adding new test to assessments when returning from TestCreation
  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.newTest) {
        setAssessments(prev => [route.params.newTest, ...prev]);
        // Clear the param so it doesn't trigger multiple times
        navigation.setParams({ newTest: undefined });
      }
    }, [route?.params?.newTest, navigation])
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={styles.layout}>

        {/* ✅ Sidebar restored to fix JSX structure */}
      

        {/* Main Content */}
        <View style={styles.main}>

          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.searchWrap}>
              <Icon name="search" size={14} color={C.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search archive repositories..."
                placeholderTextColor={C.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {isTablet && (
              <View style={styles.tabs}>
                {['Drafts', 'Published', 'Archived'].map((t, i) => (
                  <TouchableOpacity key={t} activeOpacity={0.7}>
                    <Text style={[styles.tab, i === 0 && styles.tabActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.topActions}>
             
             
              
            </View>
          </View>

          {/* Body */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={isTablet ? styles.bodyRow : styles.bodyCol}>

              {/* ── Center Column ── */}
              <View style={isTablet ? styles.centerCol : styles.fullCol}>

                {/* Page Header */}
                <View style={styles.pageHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pageTitle}>Assessment Archives</Text>
                    <Text style={styles.pageSubtitle}>
                      Curating academic excellence through precision testing.
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.quickAddBtn}
                    onPress={() => navigation.navigate('BatchSelection')}
                  >
                    <Icon name="lightning" size={14} color={C.white} />
                    <Text style={styles.quickAddText}>Test Add</Text>
                  </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <StatCard value="34" label="Total Assessments" icon="file"  color={C.accent} />
                  <View style={{ width: 12 }} />
                  <StatCard value="12" label="Active Drafts"      icon="edit"  color={C.accentOrange} />
                  <View style={{ width: 12 }} />
                  <StatCard value="22" label="Published Units"    icon="check" color="#5B6EEE" />
                </View>

                {/* Active Repositories */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Repositories</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        navigation.navigate('AllArchives', { assessments })
                      }
                    >
                      <Text style={styles.viewAll}>View All Archive →</Text>
                    </TouchableOpacity>
                  </View>
                  {assessments.map(item => (
                    <AssessmentCard 
                      key={item.id} 
                      item={item}
                      onPress={() => navigation.navigate('TestDetail', { test: item })}
                    />
                  ))}
                </View>
              </View>

              {/* ── Right Column ── */}
              <View style={isTablet ? styles.rightCol : styles.fullCol}>

                {/* AI Suggestion */}
                <View style={styles.aiCard}>
                  <View style={styles.aiCardHeader}>
                    <Icon name="ai" size={14} color={C.accentOrange} />
                    <Text style={styles.aiCardLabel}>AI SUGGESTION</Text>
                  </View>
                  <Text style={styles.aiCardTitle}>Microbiology Finals</Text>
                  <Text style={styles.aiCardBody}>
                    Based on current student weak points, we recommend adding a
                    section on Viral Replication cycles.
                  </Text>
                  <TouchableOpacity activeOpacity={0.85} style={styles.generateBtn}>
                    <Text style={styles.generateBtnText}>Generate Questions</Text>
                  </TouchableOpacity>
                </View>

                {/* Upcoming Archivals */}
                <View style={styles.upcomingCard}>
                  <Text style={styles.upcomingTitle}>UPCOMING ARCHIVALS</Text>
                  {[
                    { name: 'Psychology 101', time: '48h remaining' },
                    { name: 'Modern Ethics',  time: '5 days remaining' },
                  ].map(u => (
                    <TouchableOpacity
                      key={u.name}
                      activeOpacity={0.8}
                      style={styles.upcomingItem}
                    >
                      <View style={styles.upcomingAccent} />
                      <View>
                        <Text style={styles.upcomingName}>{u.name}</Text>
                        <Text style={styles.upcomingTime}>Scheduled: {u.time}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Curator Insights */}
                

              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  layout: { flex: 1, flexDirection: 'row' }, // ✅ row so sidebar sits beside main

  sidebar: {
    width: 56,
    backgroundColor: C.white,
    borderRightWidth: 1,
    borderRightColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarTablet: { width: 220, alignItems: 'flex-start', paddingHorizontal: 16 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24, width: '100%' },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.sidebarActive,
    alignItems: 'center', justifyContent: 'center',
  },
  logoTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  logoSub:   { fontSize: 11, color: C.textMuted },
  nav:       { flex: 1, width: '100%', gap: 4 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8,
  },
  navItemActive: { backgroundColor: C.sidebarActive },
  navLabel:      { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  navLabelActive: { color: C.white },
  sidebarBottom: { width: '100%', gap: 4 },
  newAssessmentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.sidebarActive, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8,
  },
  newAssessmentText: { color: C.white, fontSize: 13, fontWeight: '600' },

  main: { flex: 1, flexDirection: 'column' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.bg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: C.border,
    flex: 1, maxWidth: 320,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.text, padding: 0 },
  tabs:        { flexDirection: 'row', gap: 12 },
  tab:         { fontSize: 13, color: C.textMuted, paddingBottom: 2 },
  tabActive: {
    color: C.text, fontWeight: '700',
    borderBottomWidth: 2, borderBottomColor: C.text,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  iconBtn:    { padding: 6 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.sidebarActive,
    alignItems: 'center', justifyContent: 'center',
  },

  body:      { padding: 16, paddingBottom: 40 },
  bodyRow:   { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  bodyCol:   { flexDirection: 'column', gap: 16 },
  centerCol: { flex: 1 },
  rightCol:  { width: 220, gap: 14 },
  fullCol:   {},

  pageHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 16, gap: 12,
  },
  pageTitle:    { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  quickAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.accentOrange, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  quickAddText: { color: C.white, fontWeight: '700', fontSize: 13 },

  statsRow: { flexDirection: 'row', marginBottom: 20 },
  statCard: {
    backgroundColor: C.cardBg, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  statIcon: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  section:       {},
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  viewAll:      { fontSize: 13, color: C.accent, fontWeight: '600' },

  assessmentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.cardBg, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  assessmentCardPressed: {
    backgroundColor: '#F0F0F8',
    transform: [{ scale: 0.985 }],
  },
  assessmentThumb: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: '#E8E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  assessmentHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 6, flexWrap: 'wrap',
  },
  assessmentTitle: { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },
  badge:           { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:       { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  assessmentMeta:  { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  metaText:        { fontSize: 11, color: C.textMuted, marginRight: 4 },

  aiCard:       { backgroundColor: C.aiCard, borderRadius: 14, padding: 16 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  aiCardLabel:  { fontSize: 10, fontWeight: '800', color: C.accentOrange, letterSpacing: 1 },
  aiCardTitle:  { fontSize: 15, fontWeight: '800', color: C.white, marginBottom: 8 },
  aiCardBody:   { fontSize: 12, color: '#AAAACC', lineHeight: 17, marginBottom: 14 },
  generateBtn: {
    backgroundColor: C.white, borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
  },
  generateBtnText: { fontSize: 13, fontWeight: '700', color: C.sidebarActive },

  upcomingCard:  {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  upcomingTitle: {
    fontSize: 10, fontWeight: '800', color: C.textMuted,
    letterSpacing: 1, marginBottom: 10,
  },
  upcomingItem:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  upcomingAccent: { width: 3, height: 32, borderRadius: 2, backgroundColor: C.accent },
  upcomingName:  { fontSize: 13, fontWeight: '700', color: C.text },
  upcomingTime:  { fontSize: 11, color: C.textMuted },

  curatorCard: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  curatorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  curatorIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#5B6EEE', alignItems: 'center', justifyContent: 'center',
  },
  curatorTitle:  { fontSize: 14, fontWeight: '700', color: C.text },
  curatorQuote: {
    fontSize: 12, color: C.textMuted,
    fontStyle: 'italic', lineHeight: 17, marginBottom: 12,
  },
  curatorFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportId:      { fontSize: 10, color: C.textMuted },
  downloadLink:  { fontSize: 11, color: C.accent, fontWeight: '600' },

  // Archive Screen Styles
  archiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  archiveTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  archiveContent: { padding: 16, paddingBottom: 40 },
  archiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    gap: 12,
  },
  archiveCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  archiveThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E8E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveTitle2: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 5 },
  archiveMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexWrap: 'wrap',
  },
  metaTextSmall: { fontSize: 10, color: C.textMuted },
  metaDot: { color: C.textMuted, marginHorizontal: 2 },
  archiveCardRight: { flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  publishBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.accent,
    backgroundColor: C.accentLight,
  },
  publishBtnActive: {
    backgroundColor: C.publishedBg,
    borderColor: C.published,
  },
  publishBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.accent,
  },
  // Test Detail Screen Styles
  testDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F5',
  },
  testDetailContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
  },
  testEmoji: {
    fontSize: 40,
  },
  testTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
  },
  testMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  testMeta: {
    fontSize: 12,
    color: C.textMuted,
  },
  testMetaDot: {
    color: C.textMuted,
    marginHorizontal: 2,
  },
  questionsSection: {
    marginBottom: 24,
  },
  questionsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  questionCountCard: {
    backgroundColor: '#F5F8FB',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.accent,
  },
  questionCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  questionCountSubtext: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
  },
  noQuestionsText: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  testDetailsCard: {
    backgroundColor: '#F5F8FB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5EC',
  },
  detailLabel: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: C.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  testDetailFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: '#EEF0F5',
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  startTestBtn: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  editTestBtn: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  endTestBtn: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  deleteTestBtn: {
    backgroundColor: '#F97316',
    borderColor: '#EA580C',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
  },
  endTestBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
  // Batch Selection Styles
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F5',
  },
  selectionContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  selectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: C.textMuted,
    marginBottom: 30,
    lineHeight: 20,
  },
  batchListContainer: {
    gap: 12,
  },
  batchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  batchCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  batchIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E8F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  batchStudents: {
    fontSize: 12,
    color: C.textMuted,
  },
  batchArrow: {
    fontSize: 20,
    color: C.accent,
  },
  // Test In Progress Screen Styles
  testInProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.white,
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
  },
  testInProgressTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  testInProgressName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  testInProgressAuthor: {
    fontSize: 12,
    color: C.textMuted,
  },
  testStatusBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  testStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  testInProgressContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  timerSection: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: '900',
    color: C.white,
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  timerSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  testInfoCard: {
    backgroundColor: C.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.accent,
  },
  infoDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  instructionsCard: {
    backgroundColor: '#FEF3EA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.accentOrange,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
  },
  statusCard: {
    backgroundColor: '#E8F4F0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2D6A4F',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 16,
  },
  testInProgressFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  endTestActionBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  endTestActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
  errorText: {
    fontSize: 16,
    color: C.text,
    textAlign: 'center',
    marginTop: 20,
  },
});


// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function Test() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TestHome" component={TestHome} />
      <Stack.Screen
        name="BatchSelection"
        component={BatchSelectionScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="TestCreation"
        component={TestCreationScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AllArchives"
        component={AllArchivesScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="TestDetail"
        component={TestDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="TestInProgress"
        component={TestInProgressScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}