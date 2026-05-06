import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';

// ─── Types / Constants ────────────────────────────────────────────────────────

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

const INITIAL_OPTIONS = [
  { id: '1', text: '', isCorrect: false },
  { id: '2', text: '', isCorrect: false },
];

const SIDEBAR_QUESTIONS = [
  { text: 'What was the primary language of administrative documents in...', subject: 'Physics', points: 4, active: true },
  { text: "Describe the significance of Planck's constant in the context...", subject: 'Physics', points: 10, active: false },
  { text: 'Calculate the angular momentum of an electron in the 3rd Bohr...', subject: 'Physics', points: 6, active: false },
];

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  green: '#1d9e75',
  greenLight: '#e1f5ee',
  greenBorder: '#9fe1cb',
  bg: '#f6f6f4',
  white: '#ffffff',
  border: 'rgba(0,0,0,0.12)',
  borderMid: 'rgba(0,0,0,0.2)',
  text: '#1a1a18',
  textSec: '#6b6b67',
  textTert: '#9a9a94',
};

const IS_WEB = Platform.OS === 'web';

// ─── CheckCircle ──────────────────────────────────────────────────────────────

function CheckCircle({ checked, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.checkCircle, checked && styles.checkCircleChecked]}
      activeOpacity={0.7}
    >
      {checked && <Text style={styles.checkMark}>✓</Text>}
    </TouchableOpacity>
  );
}

// ─── OptionRow ────────────────────────────────────────────────────────────────

function OptionRow({ option, letter, onSelect, onChangeText, onDelete, showDelete }) {
  return (
    <View style={[styles.optionRow, option.isCorrect && styles.optionRowCorrect]}>
      <Text style={styles.optLetter}>{letter}.</Text>
      <TextInput
        style={styles.optInput}
        value={option.text}
        onChangeText={onChangeText}
        placeholder={`Enter option ${letter} text…`}
        placeholderTextColor={C.textTert}
      />
      <CheckCircle checked={option.isCorrect} onPress={onSelect} />
      {showDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteOptionBtn}>
          <Text style={styles.deleteOptionText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <View style={styles.sidebar}>
      <View style={styles.batchCard} />
      <Text style={styles.sectionLabel}>PHYSICS SECTION (4/12)</Text>
      {SIDEBAR_QUESTIONS.map((q, i) => (
        <View key={i} style={[styles.qItem, q.active && styles.qItemActive]}>
          <Text style={styles.qItemText} numberOfLines={2}>{q.text}</Text>
          <View style={styles.qMeta}>
            <View style={styles.dot} />
            <Text style={styles.qMetaText}>{q.subject} · {q.points} Points</Text>
          </View>
        </View>
      ))}
      <View style={{ flex: 1 }} />
      <View style={styles.sidebarFooter} />
    </View>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar() {
  const items = ['B', 'I', '☰', 'Σ', '🖼'];
  return (
    <View style={styles.toolbar}>
      {items.map((label, i) => (
        <React.Fragment key={i}>
          {label === 'Σ' && <View style={styles.dividerV} />}
          <TouchableOpacity style={styles.tbBtn} activeOpacity={0.7}>
            <Text style={{ fontSize: 13, color: C.textSec }}>{label}</Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Question Type Selector ───────────────────────────────────────────────────

function QuestionTypeSelector({ value, onChange }) {
  const types = ['Multiple Choice', 'True / False', 'Short Answer'];
  const [open, setOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 13, color: C.text, flex: 1 }}>{value}</Text>
        <Text style={{ fontSize: 11, color: C.textSec }}>▾</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdown}>
          {types.map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.dropdownItem}
              onPress={() => { onChange(t); setOpen(false); }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, color: C.text }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Smart PDF Parser & Analyzer ──────────────────────────────────────────────

function parsePDFContent(text) {
  const lines = text.split(/\r?\n/);
  const questions = [];
  let currentQuestion = null;
  let currentOptions = [];
  let currentCorrectAnswer = null;
  
  const questionNumberPattern = /^(\d+)[\.\)]\s+(.+)/;
  const optionPattern = /^([A-J])[\.\)]\s+(.+)/i;
  const correctAnswerPattern = /(?:correct|answer|ans|correct answer)[:\s]*([A-J])/i;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line || line.length < 2) continue;
    
    const qMatch = line.match(questionNumberPattern);
    if (qMatch) {
      if (currentQuestion && currentOptions.length > 0) {
        questions.push({
          questionText: currentQuestion,
          options: [...currentOptions],
          correctAnswer: currentCorrectAnswer
        });
      }
      
      currentQuestion = qMatch[2].trim();
      currentOptions = [];
      currentCorrectAnswer = null;
      continue;
    }
    
    const optMatch = line.match(optionPattern);
    if (optMatch && currentQuestion) {
      currentOptions.push({
        letter: optMatch[1].toUpperCase(),
        text: optMatch[2].trim()
      });
      continue;
    }
    
    const correctMatch = line.match(correctAnswerPattern);
    if (correctMatch && currentQuestion) {
      currentCorrectAnswer = correctMatch[1].toUpperCase();
    }
  }
  
  if (currentQuestion && currentOptions.length >= 2) {
    questions.push({
      questionText: currentQuestion,
      options: currentOptions,
      correctAnswer: currentCorrectAnswer
    });
  }
  
  return questions;
}

async function readPDFWithModernAPI(fileUri) {
  try {
    if (IS_WEB) {
      throw new Error('PDF import is not supported in the web preview for this screen.');
    }

    const { File } = require('expo-file-system');
    const file = new File(fileUri);
    if (!file.exists) {
      throw new Error('File does not exist or cannot be accessed');
    }
    const textContent = await file.text();
    return textContent;
  } catch (error) {
    console.error('Modern API read failed:', error);
    throw new Error('Could not read PDF text. Please ensure the PDF contains selectable text.');
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Testcreation({ navigation, onTestCreated, isEditMode, testData }) {
  const [questionType, setQuestionType] = useState('Multiple Choice');
  const [points, setPoints] = useState('10');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showParserModal, setShowParserModal] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [savedQuestions, setSavedQuestions] = useState([]);

  // Load existing questions when in edit mode
  React.useEffect(() => {
    if (isEditMode && testData) {
      // If testData has questionsArray, load them as saved questions
      if (testData.questionsArray && Array.isArray(testData.questionsArray)) {
        setSavedQuestions(testData.questionsArray);
      }
      // Set form data from test
      setPrompt(testData.title || '');
      setQuestionType(testData.questionType || 'Multiple Choice');
      setPoints(String(testData.points || 10));
    }
  }, [isEditMode, testData]);

  const handleSelect = (id) => {
    setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.id === id })));
  };

  const handleChangeText = (id, text) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const handleAddChoice = () => {
    if (options.length >= 10) {
      Alert.alert('Limit Reached', 'Maximum 10 options allowed per question');
      return;
    }
    const newId = String(Date.now());
    setOptions((prev) => [...prev, { id: newId, text: '', isCorrect: false }]);
  };

  const handleRemoveChoice = (id) => {
    if (options.length <= 2) {
      Alert.alert('Cannot Remove', 'Minimum 2 options required per question');
      return;
    }
    setOptions((prev) => {
      const newOptions = prev.filter((o) => o.id !== id);
      // If the removed option was correct, reset correct selection
      const removedOption = prev.find((o) => o.id === id);
      if (removedOption?.isCorrect && newOptions.length > 0) {
        newOptions[0].isCorrect = true;
      }
      return newOptions;
    });
  };

  const handleSaveAndAddNext = () => {
    // Validate at least 2 options have text
    const validOptions = options.filter(opt => opt.text.trim().length > 0);
    if (validOptions.length < 2) {
      Alert.alert('Invalid', 'Please add at least 2 valid options');
      return;
    }
    
    const hasCorrectAnswer = options.some(opt => opt.isCorrect && opt.text.trim().length > 0);
    if (!hasCorrectAnswer) {
      Alert.alert('Invalid', 'Please select a correct answer');
      return;
    }

    const newQuestion = {
      id: Date.now().toString(),
      questionType,
      points: parseInt(points),
      prompt,
      options: options.filter(opt => opt.text.trim().length > 0),
    };

    setSavedQuestions(prev => [...prev, newQuestion]);
    
    // Reset form for next question
    setPrompt('');
    setOptions(INITIAL_OPTIONS);
    setPoints('10');
    setQuestionType('Multiple Choice');
    
    Alert.alert('Success', `Question saved! (${savedQuestions.length + 1} total)`);
  };

  const handleCreateTest = () => {
    // Validate at least 2 options have text
    const validOptions = options.filter(opt => opt.text.trim().length > 0);
    if (validOptions.length < 2) {
      Alert.alert('Invalid', 'Please add at least 2 valid options');
      return;
    }
    
    const hasCorrectAnswer = options.some(opt => opt.isCorrect && opt.text.trim().length > 0);
    if (!hasCorrectAnswer) {
      Alert.alert('Invalid', 'Please select a correct answer');
      return;
    }

    const currentQuestion = {
      id: Date.now().toString(),
      questionType,
      points: parseInt(points),
      prompt,
      options: options.filter(opt => opt.text.trim().length > 0),
    };

    // Include current question plus all saved questions
    const allQuestions = [...savedQuestions, currentQuestion];

    const newTest = {
      id: isEditMode ? testData.id : Date.now().toString(),
      title: prompt || 'Untitled Assessment',
      questionType,
      points: parseInt(points),
      prompt,
      questions: allQuestions.length,
      questionsArray: allQuestions, // Store full questions for editing
      status: isEditMode ? testData.status : 'DRAFT',
      date: isEditMode ? testData.date : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      author: isEditMode ? testData.author : 'Current Teacher',
      emoji: isEditMode ? testData.emoji : '❓',
    };

    setRepositories((prev) => [...prev, newTest]);
    
    // Navigate back with new test
    if (navigation && navigation.navigate) {
      if (isEditMode) {
        Alert.alert('Success', `Test updated with ${allQuestions.length} question(s)!`);
        navigation.goBack();
      } else {
        navigation.navigate('TestHome', { newTest });
      }
    } else if (onTestCreated) {
      onTestCreated(newTest);
    }
    
    // Reset form only if not in edit mode
    if (!isEditMode) {
      setPrompt('');
      setOptions(INITIAL_OPTIONS);
      setPoints('10');
      setQuestionType('Multiple Choice');
      setSavedQuestions([]);
    }
    
    if (!isEditMode) {
      Alert.alert('Success', `Test created with ${allQuestions.length} question(s)!`);
    }
  };

  const handleImportPDF = async () => {
    try {
      if (IS_WEB) {
        Alert.alert(
          'PDF Import Unavailable',
          'This teacher test screen can import PDFs only in the native app build. Please use the mobile app for PDF uploads.'
        );
        return;
      }

      const DocumentPicker = require('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) return;
      
      setLoading(true);
      
      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name;
      
      const extractedText = await readPDFWithModernAPI(fileUri);
      const questions = parsePDFContent(extractedText);
      
      if (questions.length === 0) {
        Alert.alert(
          'No Questions Found',
          'Could not extract questions from this PDF. Please ensure:\n\n• PDF has selectable text\n• Questions are numbered (1., 2., etc.)\n• Options are labeled (A., B., etc.)\n• Correct answer is indicated (Answer: A)\n\nSupports 2-10 options per question!'
        );
      } else {
        setParsedQuestions(questions);
        setShowParserModal(true);
        Alert.alert('Success', `Extracted ${questions.length} questions from ${fileName}!`);
      }
      
    } catch (error) {
      console.error('Error parsing PDF:', error);
      Alert.alert(
        'Extraction Failed',
        `Error: ${error.message}\n\nMake sure your PDF has selectable text and follows the format:\n1. Question?\nA) Option 1\nB) Option 2\nAnswer: A`
      );
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionToForm = (question) => {
    const newOptions = question.options.map((opt, idx) => ({
      id: String(idx + 1),
      text: opt.text,
      isCorrect: opt.letter === question.correctAnswer,
    }));
    
    setPrompt(question.questionText);
    setOptions(newOptions);
    setShowParserModal(false);
    Alert.alert('Success', `Loaded question with ${newOptions.length} options!`);
  };

  return (
    <View style={styles.safe}>
      
      
      <View style={styles.body}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>{isEditMode ? 'Edit Question' : 'Add Question'}</Text>
            <Text style={styles.pageSubtitle}>
              {isEditMode 
                ? 'Update test questions and details'
                : 'Create a new assessment item for the upcoming JEE Mock Test.'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.pdfImportBtn}
            onPress={handleImportPDF}
            activeOpacity={0.7}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={C.green} />
            ) : (
              <>
                <Text style={styles.pdfImportIcon}>📄</Text>
                <Text style={styles.pdfImportText}>Import Questions from PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.rowTop}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>QUESTION TYPE</Text>
              <QuestionTypeSelector value={questionType} onChange={setQuestionType} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>POINTS</Text>
              <TextInput
                style={styles.pointsInput}
                value={points}
                onChangeText={setPoints}
                keyboardType="numeric"
                textAlign="center"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Question Prompt</Text>
          <Toolbar />
          <TextInput
            style={styles.promptInput}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Type your academic question here… use LaTeX for formulas."
            placeholderTextColor={C.textTert}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.respHeader}>
            <Text style={styles.sectionTitle}>Response Options</Text>
            <Text style={styles.respHint}>Select the correct answer (Supports 2-10 options)</Text>
          </View>

          {options.map((opt, i) => (
            <OptionRow
              key={opt.id}
              option={opt}
              letter={LETTERS[i]}
              onSelect={() => handleSelect(opt.id)}
              onChangeText={(text) => handleChangeText(opt.id, text)}
              onDelete={() => handleRemoveChoice(opt.id)}
              showDelete={options.length > 2}
            />
          ))}

          <View style={styles.choiceButtonsContainer}>
            <TouchableOpacity style={styles.addChoice} onPress={handleAddChoice} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, color: C.green }}>+ Add Option</Text>
            </TouchableOpacity>
            <Text style={styles.optionCountText}>{options.length} / 10 options</Text>
          </View>

          {/* Saved Questions Display */}
          {savedQuestions.length > 0 && (
            <View style={styles.savedQuestionsSection}>
              <View style={styles.savedQuestionsHeader}>
                <Text style={styles.savedQuestionsTitle}>
                  Saved Questions ({savedQuestions.length})
                </Text>
              </View>
              {savedQuestions.map((q, idx) => (
                <View key={q.id} style={styles.savedQuestionItem}>
                  <View style={styles.savedQuestionNumber}>
                    <Text style={styles.savedQuestionNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedQuestionPrompt} numberOfLines={1}>{q.prompt}</Text>
                    <View style={styles.savedQuestionMeta}>
                      <Text style={styles.savedQuestionMetaText}>{q.questionType}</Text>
                      <Text style={styles.savedQuestionDot}>•</Text>
                      <Text style={styles.savedQuestionMetaText}>{q.options?.length || 0} options</Text>
                      <Text style={styles.savedQuestionDot}>•</Text>
                      <Text style={styles.savedQuestionMetaText}>{q.points} pts</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.previewBtn} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, color: C.textSec }}>👁 Preview Question</Text>
            </TouchableOpacity>
            <View style={styles.actionRight}>
              <TouchableOpacity 
                style={styles.btnSecondary} 
                activeOpacity={0.8}
                onPress={handleSaveAndAddNext}
              >
                <Text style={{ fontSize: 13, color: C.text }}>Save & Add Next</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                activeOpacity={0.8}
                onPress={handleCreateTest}
              >
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '500' }}>
                  {isEditMode ? 'Update Test' : 'Create the test'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={showParserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowParserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Extracted Questions ({parsedQuestions.length})</Text>
              <TouchableOpacity onPress={() => setShowParserModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {parsedQuestions.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.extractedQuestionCard}
                  onPress={() => loadQuestionToForm(q)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.extractedQuestionText}>
                    {idx + 1}. {q.questionText}
                  </Text>
                  <View style={styles.extractedOptions}>
                    {q.options.map((opt, optIdx) => (
                      <Text key={optIdx} style={[
                        styles.extractedOption,
                        opt.letter === q.correctAnswer && styles.extractedCorrectOption
                      ]}>
                        {opt.letter}. {opt.text}
                        {opt.letter === q.correctAnswer && ' ✓'}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.optionCountBadge}>{q.options.length} options</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },
  topNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 52, backgroundColor: C.white, borderBottomWidth: 0.5, borderBottomColor: C.border },
  body: { flex: 1, backgroundColor: C.bg },
  sidebar: { width: 200, backgroundColor: C.white, borderRightWidth: 0.5, borderRightColor: C.border, padding: 12 },
  batchCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, borderRadius: 10, padding: 10, marginBottom: 12 },
  sectionLabel: { fontSize: 9, letterSpacing: 0.5, color: C.textTert, marginBottom: 6, textTransform: 'uppercase' },
  qItem: { padding: 8, borderRadius: 8, marginBottom: 4, borderWidth: 0.5, borderColor: 'transparent' },
  qItemActive: { backgroundColor: C.greenLight, borderColor: C.greenBorder },
  qItemText: { fontSize: 11, color: C.text, lineHeight: 15 },
  qMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.border },
  qMetaText: { fontSize: 10, color: C.textSec },
  sidebarFooter: { flexDirection: 'row', gap: 8 },
  content: { padding: 20, paddingBottom: 40 },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 20, fontWeight: '500', color: C.text },
  pageSubtitle: { fontSize: 12, color: C.textSec, marginTop: 4 },
  rowTop: { flexDirection: 'row', gap: 16, marginBottom: 18, alignItems: 'flex-end' },
  fieldGroup: { marginBottom: 10 },
  fieldLabel: { fontSize: 9, letterSpacing: 0.5, color: C.textSec, marginBottom: 5, textTransform: 'uppercase' },
  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 0.5, borderColor: C.borderMid, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: C.white, minWidth: 150 },
  dropdown: { position: 'absolute', top: 38, left: 0, right: 0, zIndex: 99, backgroundColor: C.white, borderWidth: 0.5, borderColor: C.borderMid, borderRadius: 8, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: C.border },
  pointsInput: { width: 70, borderWidth: 0.5, borderColor: C.borderMid, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 13, color: C.text, backgroundColor: C.white },
  sectionTitle: { fontSize: 13, fontWeight: '500', color: C.text, marginBottom: 8 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, backgroundColor: C.bg, borderWidth: 0.5, borderColor: C.border, borderBottomWidth: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  tbBtn: { width: 30, height: 28, borderRadius: 6, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  dividerV: { width: 0.5, height: 20, backgroundColor: C.borderMid, marginHorizontal: 2 },
  promptInput: { borderWidth: 0.5, borderColor: C.border, borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, padding: 12, fontSize: 13, color: C.text, backgroundColor: C.white, lineHeight: 20, marginBottom: 20, minHeight: 120 },
  respHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  respHint: { fontSize: 11, color: C.textSec },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: C.white, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, marginBottom: 8 },
  optionRowCorrect: { borderColor: C.green, backgroundColor: C.greenLight },
  optLetter: { fontSize: 13, fontWeight: '500', color: C.textSec, width: 25 },
  optInput: { flex: 1, fontSize: 13, color: C.text, padding: 0, backgroundColor: 'transparent' },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  checkCircleChecked: { backgroundColor: C.green, borderColor: C.green },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  deleteOptionBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  deleteOptionText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  choiceButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 20 },
  addChoice: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: C.green, borderStyle: 'dashed', alignItems: 'center' },
  optionCountText: { fontSize: 11, color: C.textSec },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 18, flexWrap: 'wrap', gap: 10 },
  previewBtn: { paddingVertical: 4 },
  actionRight: { flexDirection: 'row', gap: 8 },
  btnSecondary: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 0.5, borderColor: C.borderMid, backgroundColor: C.white },
  btnPrimary: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.green },
  pdfImportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, borderWidth: 1, borderColor: C.green, borderRadius: 10, paddingVertical: 12, marginBottom: 20, gap: 8 },
  pdfImportIcon: { fontSize: 18 },
  pdfImportText: { fontSize: 13, color: C.green, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: C.white, borderRadius: 16, width: '90%', maxHeight: '80%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: C.border },
  modalTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  modalClose: { fontSize: 18, color: C.textSec, padding: 4 },
  modalContent: { padding: 16 },
  extractedQuestionCard: { backgroundColor: C.bg, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 0.5, borderColor: C.border },
  extractedQuestionText: { fontSize: 13, fontWeight: '500', color: C.text, marginBottom: 8 },
  extractedOptions: { gap: 4, marginBottom: 6 },
  extractedOption: { fontSize: 12, color: C.textSec, paddingVertical: 2 },
  extractedCorrectOption: { color: C.green, fontWeight: '500' },
  optionCountBadge: { fontSize: 10, color: C.textTert, marginTop: 4, fontStyle: 'italic' },
  
  // Saved Questions Section
  savedQuestionsSection: {
    backgroundColor: C.greenLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.greenBorder,
  },
  savedQuestionsHeader: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.greenBorder,
  },
  savedQuestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.green,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  savedQuestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.greenBorder,
  },
  savedQuestionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedQuestionNumberText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 12,
  },
  savedQuestionPrompt: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
    marginBottom: 3,
  },
  savedQuestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedQuestionMetaText: {
    fontSize: 10,
    color: C.textSec,
  },
  savedQuestionDot: {
    color: C.textSec,
    marginHorizontal: 2,
  },
  removeQuestionBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});