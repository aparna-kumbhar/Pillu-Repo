import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Alert, NativeModules,
} from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URLS, fetchWithBaseUrlFallback } from '../../Src/axios';
import { createStackNavigator } from '@react-navigation/stack';
import StudentSidebar from '../../Screens/student/Dashboard/sidebar';
import Sidebar from '../Parent/Dashboard/sidebar.js';
import CommitteeSidebar from '../Committe/Dashboard/CommitteeSidebar';
import TeacherSidebar from '../Teacher/Dashboard/sidebar.js';
import AdminSidebar from '../Admin/Dashboard/AdminSidebar';
import AssistantSidebar from '../Assistant/Dashboard/AssistantSidebar.js';
const isWeb = Platform.OS === 'web';

const STUDENT_CREDENTIALS = { email: '123', password: '123' };
const PARENT_CREDENTIALS = { email: 'parent@123', password: 'parent123' };
const Committee_CREDENTIALS = { email: '12345', password: '12345' };
const Assistant_CREDENTIALS = { email: 'assistant', password: 'assistant' };


const LoginStack = createStackNavigator();

// ─── The actual login form ────────────────────────────────────────────────────
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [signInPressed, setSignInPressed] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const loginId = email.trim();
    const loginPassword = password;

    const isCommittee = email === Committee_CREDENTIALS.email && password === Committee_CREDENTIALS.password;

    if (isCommittee) {
      navigation.replace('CommitteeDashboard');
      return;
    }

    try {
      // Try assistant login first
      try {
        const { response: assistantResponse } = await fetchWithBaseUrlFallback('/api/assistants/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assistantName: loginId,
            password: loginPassword,
          }),
        });

        const assistantPayload = await assistantResponse.json();
        if (assistantResponse.ok) {
          console.log('Assistant login successful');
          navigation.replace('AssistantDashboard', {
            assistant: assistantPayload?.assistant || {},
            instituteId: assistantPayload?.instituteId || '',
          });
          return;
        }
      } catch (assistantErr) {
        // ignore and try teacher login next
      }

      // Try teacher login
      const { response: teacherResponse, baseUrl: teacherBaseUrl } = await fetchWithBaseUrlFallback('/api/teachers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: loginId,
          teacherPassword: loginPassword,
        }),
      });

      const teacherPayload = await teacherResponse.json();
      if (teacherResponse.ok) {
        console.log('Teacher login endpoint used:', `${teacherBaseUrl}/api/teachers/login`);
        navigation.replace('TeacherDashboard', {
          teacher: teacherPayload?.teacher || {},
          instituteId: teacherPayload?.teacher?.instituteId || '',
        });
        return;
      }

      if (teacherResponse.status !== 401) {
        setError(teacherPayload?.message || 'Unable to sign in right now');
        return;
      }

      const { response, baseUrl } = await fetchWithBaseUrlFallback('/api/institutes/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: loginId,
          adminPassword: loginPassword,
        }),
      });

      const payload = await response.json();
      if (response.ok) {
        const institute = payload?.institute || payload || {};
        console.log('Admin login endpoint used:', `${baseUrl}/api/institutes/admin-login`);
        navigation.replace('AdminDashboard', {
          instituteId: institute?.instituteId || institute?.adminId || loginId,
          instituteName: institute?.name || '',
          adminEmail: institute?.email || '',
          adminName: institute?.adminName || '',
        });
        return;
      }

      if (response.status !== 401) {
        setError(payload?.message || 'Unable to sign in right now');
        return;
      }
    } catch (networkError) {
      Alert.alert(
        'Network error',
        `Could not connect to server for teacher/admin login.\n\nTried URLs:\n${API_BASE_URLS.join('\n')}`
      );
      return;
    }

    // Try student login (student name + student password)
    try {
      const { response: studentResponse } = await fetchWithBaseUrlFallback('/api/students/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginId, password: loginPassword }),
      });

      const studentPayload = await studentResponse.json();
      if (studentResponse.ok) {
        navigation.replace('StudentDashboard', {
          student: studentPayload?.student || studentPayload || {},
          instituteId: studentPayload?.student?.instituteId || '',
        });
        return;
      }
    } catch (err) {
      // ignore and try parent login next
    }

    // Try parent login (parent id [student name] + parent password)
    try {
      const { response: parentResponse } = await fetchWithBaseUrlFallback('/api/parents/parent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: loginId, parentPassword: loginPassword }),
      });

      const parentPayload = await parentResponse.json();
      if (parentResponse.ok) {
        navigation.replace('ParentDashboard', {
          parent: parentPayload?.parent || parentPayload || {},
          instituteId: parentPayload?.parent?.instituteId || '',
        });
        return;
      }
    } catch (err) {
      // fall through to final error
    }

    setError('Invalid username or password');
    setPassword('');
  };

  const handleForgotPassword = () => console.log('Forgot password tapped');
  const handleJoinCollective = () => console.log('Join the Collective tapped');

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#EEF3F5" animated={false} />
      {/* ✅ FIX: ScrollView with explicit style for web so it fills and scrolls */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <Text style={styles.brandTitle}>UniVerse</Text>
          <Text style={styles.brandSubtitle}>THE DIGITAL ATELIER</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome back</Text>
            <Text style={styles.welcomeSubtext}>
              Please enter your credentials to access the curriculum.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>USERNAME / EMAIL / INSTITUTE ID</Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              placeholder="curator@atelier.edu or INST-1024"
              placeholderTextColor="#B0BEC5"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.passwordRow}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.6}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, passwordFocused && styles.inputFocused]}
              placeholder="••••••••"
              placeholderTextColor="#B0BEC5"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.signInButton, signInPressed && styles.signInButtonPressed]}
            onPress={handleSignIn}
            onPressIn={() => setSignInPressed(true)}
            onPressOut={() => setSignInPressed(false)}
            activeOpacity={0.85}
          >
            <Text style={styles.signInText}>Sign In  →</Text>
          </TouchableOpacity>

          <View style={styles.joinSection}>
            <Text style={styles.joinText}>New to the atelier?{' '}</Text>
            <TouchableOpacity onPress={handleJoinCollective} activeOpacity={0.6}>
              <Text style={styles.joinLink}>Join the Collective</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 THE ACADEMIC CURATOR • PRIVATE INSTITUTION
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Nested stack that owns both Login form + Dashboard ──────────────────────
export default function Login() {
  return (
    <LoginStack.Navigator screenOptions={{ headerShown: false }}>
      <LoginStack.Screen name="LoginScreen" component={LoginScreen} />
      <LoginStack.Screen name="StudentDashboard" component={StudentSidebar} />
      <LoginStack.Screen name="ParentDashboard" component={Sidebar} />
      <LoginStack.Screen name="CommitteeDashboard" component={CommitteeSidebar} />
      <LoginStack.Screen name="TeacherDashboard" component={TeacherSidebar} />
      <LoginStack.Screen name="AdminDashboard"   component={AdminSidebar} />
      <LoginStack.Screen name="AssistantDashboard"   component={AssistantSidebar} />
    </LoginStack.Navigator>
  );
}

const cardMaxWidth = isWeb ? 480 : undefined;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#EEF3F5',
    // ✅ FIX: On web, KeyboardAvoidingView needs explicit height
    ...(isWeb && { minHeight: '100vh' }),
  },

  // ✅ FIX: ScrollView style — on web use overflow:auto so page scrolls
  scrollView: {
    flex: 1,
    ...(isWeb && { overflow: 'auto' }),
  },

  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: isWeb ? 24 : 20,
    paddingTop: isWeb ? 60 : 50,
    paddingBottom: 32,
    backgroundColor: '#EEF3F5',
  },
  header: {
    alignItems: 'center',
    marginBottom: isWeb ? 48 : 36,
    width: '100%',
    maxWidth: cardMaxWidth,
  },
  brandTitle: {
    fontSize: isWeb ? 42 : 34,
    fontWeight: '800',
    color: '#1A2F5A',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: 'Georgia, "Times New Roman", serif',
    }),
    letterSpacing: -0.5,
    lineHeight: isWeb ? 52 : 42,
  },
  brandSubtitle: {
    marginTop: 8,
    fontSize: isWeb ? 13 : 11,
    fontWeight: '500',
    color: '#8A9BB0',
    letterSpacing: 4,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif',
      web: '"Helvetica Neue", Arial, sans-serif',
    }),
  },
  card: {
    width: '100%',
    maxWidth: cardMaxWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: isWeb ? 40 : 24,
    paddingTop: isWeb ? 40 : 32,
    paddingBottom: isWeb ? 36 : 28,
    ...(isWeb
      ? { boxShadow: '0px 4px 20px rgba(26, 47, 90, 0.08)' }
      : {
          shadowColor: '#1A2F5A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 4,
        }),
  },
  welcomeSection: { marginBottom: 28 },
  welcomeTitle: {
    fontSize: isWeb ? 28 : 24,
    fontWeight: '700',
    color: '#1A2F5A',
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', web: 'Georgia, serif' }),
  },
  welcomeSubtext: {
    fontSize: isWeb ? 15 : 14,
    color: '#5A6E85',
    lineHeight: isWeb ? 24 : 22,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', web: '"Courier New", Courier, monospace' }),
  },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: isWeb ? 11 : 10,
    fontWeight: '600',
    color: '#8A9BB0',
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif', web: '"Helvetica Neue", Arial, sans-serif' }),
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F4F7F9',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8EDF2',
    paddingHorizontal: 18,
    paddingVertical: isWeb ? 16 : 14,
    fontSize: isWeb ? 15 : 14,
    color: '#1A2F5A',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', web: '"Courier New", Courier, monospace' }),
    // ✅ FIX: outlineStyle is web-only, use Platform.select to avoid warnings
    ...(isWeb && { outlineStyle: 'none' }),
  },
  inputFocused: {
    borderColor: '#2E6DA4',
    backgroundColor: '#FAFCFF',
  },
  forgotText: {
    fontSize: isWeb ? 13 : 12,
    color: '#2E9E7A',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', web: '"Courier New", Courier, monospace' }),
    letterSpacing: 0.3,
  },
  signInButton: {
    backgroundColor: '#1A2F5A',
    borderRadius: 14,
    paddingVertical: isWeb ? 18 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 28,
    ...(isWeb
      ? { boxShadow: '0px 4px 10px rgba(26, 47, 90, 0.3)' }
      : {
          shadowColor: '#1A2F5A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 5,
        }),
  },
  signInButtonPressed: {
    backgroundColor: '#122248',
    transform: [{ scale: 0.985 }],
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: isWeb ? 16 : 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', web: 'Georgia, serif' }),
  },
  joinSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  joinText: {
    fontSize: isWeb ? 14 : 13,
    color: '#1A2F5A',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', web: '"Courier New", Courier, monospace' }),
  },
  joinLink: {
    fontSize: isWeb ? 14 : 13,
    color: '#2E6DA4',
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', web: '"Courier New", Courier, monospace' }),
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: isWeb ? 11 : 10,
    color: '#8A9BB0',
    letterSpacing: 1.5,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif', web: '"Helvetica Neue", Arial, sans-serif' }),
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
  },
  errorText: {
    fontSize: isWeb ? 13 : 12,
    color: '#C62828',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', web: '"Courier New", Courier, monospace' }),
  },
});
