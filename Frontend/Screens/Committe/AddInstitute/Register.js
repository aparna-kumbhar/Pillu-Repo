import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const PURPLE = '#6C63FF';
const PURPLE_LIGHT = '#EEEDFE';
const GRAY_BG = '#F5F5F7';
const BORDER = '#E0DFF5';
const TEXT_PRIMARY = '#1A1A2E';
const TEXT_SECONDARY = '#6B6B8A';
const TEXT_HINT = '#A0A0B8';
const WHITE = '#FFFFFF';

// ─── Icon Components ──────────────────────────────────────────────────────────

const UploadIcon = () => (
  <View style={styles.uploadIconCircle}>
    <Text style={{ fontSize: 22, color: TEXT_SECONDARY }}>↑</Text>
  </View>
);

const SectionIcon = ({ char }) => (
  <View style={styles.sectionIconCircle}>
    <Text style={{ fontSize: 16, color: PURPLE }}>{char}</Text>
  </View>
);

// ─── Toggle Switch ────────────────────────────────────────────────────────────

const ModuleToggleRow = ({ title, subtitle, value, onToggle }) => (
  <View style={styles.moduleRow}>
    <View style={styles.moduleInfo}>
      <View style={styles.moduleIconCircle}>
        <Text style={{ fontSize: 14, color: TEXT_SECONDARY }}>👤</Text>
      </View>
      <View>
        <Text style={styles.moduleTitle}>{title}</Text>
        <Text style={styles.moduleSubtitle}>{subtitle.toUpperCase()}</Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      thumbColor={WHITE}
      trackColor={{ false: BORDER, true: PURPLE }}
      ios_backgroundColor={BORDER}
    />
  </View>
);

// ─── Labeled Input ────────────────────────────────────────────────────────────

const LabeledInput = ({ label, placeholder, keyboardType = 'default', secureTextEntry = false, style, value, onChangeText }) => (
  <View style={[styles.fieldWrapper, style]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={TEXT_HINT}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

// ─── Fake Select ──────────────────────────────────────────────────────────────

const SelectInput = ({ label, selected, onPress }) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TouchableOpacity style={styles.selectBox} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.selectText}>{selected}</Text>
      <Text style={{ color: TEXT_SECONDARY, fontSize: 12 }}>▾</Text>
    </TouchableOpacity>
  </View>
);

// ─── Upload Box ───────────────────────────────────────────────────────────────

const UploadBox = ({ onPress }) => (
  <TouchableOpacity style={styles.uploadBox} onPress={onPress} activeOpacity={0.7}>
    <UploadIcon />
    <Text style={styles.uploadText}>Click to upload or drag and drop</Text>
    <Text style={styles.uploadHint}>SVG, PNG, JPG (max. 800×400px)</Text>
  </TouchableOpacity>
);

// ─── Card Wrapper ─────────────────────────────────────────────────────────────

const Card = ({ children }) => (
  <View style={styles.card}>{children}</View>
);

const CardHeader = ({ icon, title }) => (
  <View style={styles.cardHeader}>
    <SectionIcon char={icon} />
    <Text style={styles.cardTitle}>{title}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Register({ onSubmit, onCancel }) {
  const [instituteName, setInstituteName] = useState('');
  const [instituteId, setInstituteId] = useState('');
  const [institutePassword, setInstitutePassword] = useState('');
  const [location, setLocation] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [joinDate, setJoinDate] = useState('');

  const [studentPortal, setStudentPortal] = useState(true);
  const [teacherPortal, setTeacherPortal] = useState(true);
  const [parentPortal, setParentPortal] = useState(false);
  const [adminPortal, setAdminPortal] = useState(false);

  const handleRegister = () => {
     console.log('📋 ====== FORM SUBMISSION STARTED ======');
     console.log('Submission Timestamp:', new Date().toISOString());
    console.log('instituteName:', instituteName, 'trim:', instituteName.trim());
    console.log('location:', location, 'trim:', location.trim());
    console.log('instituteId:', instituteId, 'trim:', instituteId.trim());
    console.log('institutePassword:', institutePassword, 'trim:', institutePassword.trim());
    console.log('adminName:', adminName, 'trim:', adminName.trim());
    console.log('email:', email, 'trim:', email.trim());
    console.log('phone:', phone, 'trim:', phone.trim());
    console.log('joinDate:', joinDate);
    console.log('joinDate (parsed):', joinDate ? new Date(joinDate).toISOString() : 'EMPTY');
    console.log('📋 ====== VALIDATION CHECK ======');
    
    if (
      !instituteName.trim() ||
      !location.trim() ||
      !instituteId.trim() ||
      !institutePassword.trim() ||
      !adminName.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      const missing = [];
      if (!instituteName.trim()) missing.push('Institute Name');
      if (!location.trim()) missing.push('Location');
      if (!instituteId.trim()) missing.push('Institute ID');
      if (!institutePassword.trim()) missing.push('Password');
      if (!adminName.trim()) missing.push('Admin Name');
      if (!email.trim()) missing.push('Email');
      if (!phone.trim()) missing.push('Phone');
      
      alert(`❌ Please fill in: ${missing.join(', ')}`);
      return;
    }

    let normalizedJoinDate;
    const rawJoinDate = joinDate.trim();
    if (rawJoinDate) {
      const ddmmyyyy = rawJoinDate.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (ddmmyyyy) {
        normalizedJoinDate = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
      } else {
        const parsed = new Date(rawJoinDate);
        if (!Number.isNaN(parsed.getTime())) {
          normalizedJoinDate = parsed.toISOString().slice(0, 10);
        }
      }
    }

    const newInstitute = {
      name: instituteName.trim(),
      location: location.trim(),
      instituteId: instituteId.trim(),
      institutePassword: institutePassword.trim(),
      joinDate: normalizedJoinDate,
      adminName: adminName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      modules: {
        studentPortal,
        teacherPortal,
        parentPortal,
        adminPortal,
      },
    };
    
    console.log('✅ Submitting institute data:', newInstitute);
    onSubmit(newInstitute);
  };

  const handleSaveDraft = () => {
    alert('Draft saved!');
  };

  const handlePreview = () => {
    alert('Launching live preview...');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_BG} />
      
      {/* Back Button Header */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Register new institute</Text>
          <Text style={styles.pageSubtitle}>
            Onboard a new educational entity to the EduCurator ecosystem.
          </Text>
        </View>

        {/* Two-column on tablet, single column on mobile */}
        <View style={isTablet ? styles.tabletLayout : undefined}>
          <View style={isTablet ? styles.mainCol : undefined}>
            {/* ── Institute Basic Info ── */}
            <Card>
              <CardHeader icon="🎓" title="Institute basic info" />

              <LabeledInput 
                label="INSTITUTE NAME" 
                placeholder="e.g. St. Xavier's International"
                value={instituteName}
                onChangeText={setInstituteName}
              />

              <View style={isTablet ? styles.row : undefined}>
                <LabeledInput
                  label="INSTITUTE ID"
                  placeholder="e.g. INST-1024"
                  value={instituteId}
                  onChangeText={setInstituteId}
                />
                <LabeledInput
                  label="LOCATION"
                  placeholder="City, Country"
                  value={location}
                  onChangeText={setLocation}
                  style={isTablet ? { marginLeft: 12 } : undefined}
                />
              </View>

              <View style={isTablet ? styles.row : undefined}>
                <LabeledInput
                  label="INSTITUTE PASSWORD"
                  placeholder="Enter institute password"
                  secureTextEntry={true}
                  value={institutePassword}
                  onChangeText={setInstitutePassword}
                />
                <LabeledInput
                  label="JOIN DATE"
                  placeholder="12-12-2022"
                  value={joinDate}
                  onChangeText={setJoinDate}
                  style={isTablet ? { marginLeft: 12 } : undefined}
                />
              </View>
            </Card>

            {/* ── Administrative Contact ── */}
            <Card>
              <CardHeader icon="👥" title="Administrative contact" />

              <LabeledInput 
                label="ADMIN NAME" 
                placeholder="Full legal name"
                value={adminName}
                onChangeText={setAdminName}
              />

              <View style={isTablet ? styles.row : undefined}>
                <LabeledInput
                  label="EMAIL ADDRESS"
                  placeholder="admin@institute.edu"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <LabeledInput
                  label="PHONE NUMBER"
                  placeholder="+1 (555) 000-0000"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  style={isTablet ? { marginLeft: 12 } : undefined}
                />
              </View>
            </Card>
          </View>

          {/* ── Right Column ── */}
          <View style={isTablet ? styles.rightCol : undefined}>
            {/* Module Configuration */}
            <Card>
              <CardHeader icon="⊞" title="Module configuration" />

              <ModuleToggleRow
                title="Student portal"
                subtitle="Academic tracking"
                value={studentPortal}
                onToggle={() => setStudentPortal(v => !v)}
              />
              <ModuleToggleRow
                title="Teacher portal"
                subtitle="Class management"
                value={teacherPortal}
                onToggle={() => setTeacherPortal(v => !v)}
              />
              <ModuleToggleRow
                title="Parent portal"
                subtitle="Engagement hub"
                value={parentPortal}
                onToggle={() => setParentPortal(v => !v)}
              />
               <ModuleToggleRow
                title="Admin portal"
                subtitle="Overall management"
                value={adminPortal}
                onToggle={() => setAdminPortal(v => !v)}
              />

              <View style={styles.actionArea}>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleRegister}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnPrimaryText}>Register institute</Text>
                </TouchableOpacity>



                <Text style={styles.legalText}>
                  By registering, you agree to the UniVerse Service Agreement and Data
                  Processing Addendum.
                </Text>
              </View>
            </Card>

            {/* Preview Mode */}
          
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GRAY_BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Back Button
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },

  // Page Header
  pageHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },

  // Layout
  tabletLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  mainCol: {
    flex: 1,
  },
  rightCol: {
    width: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Card
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_PRIMARY,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fields
  fieldWrapper: {
    marginBottom: 14,
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: TEXT_SECONDARY,
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: TEXT_PRIMARY,
    backgroundColor: WHITE,
  },
  selectBox: {
    height: 42,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
  },
  selectText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
  },

  // Upload
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 28,
    alignItems: 'center',
    backgroundColor: GRAY_BG,
  },
  uploadIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    borderWidth: 0.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: TEXT_HINT,
  },

  // Module rows
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GRAY_BG,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  moduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moduleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: 0.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_PRIMARY,
  },
  moduleSubtitle: {
    fontSize: 10,
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
  },

  // Actions
  actionArea: {
    marginTop: 16,
  },
  btnPrimary: {
    height: 50,
    backgroundColor: PURPLE,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: WHITE,
  },
  btnSecondary: {
    height: 50,
    backgroundColor: GRAY_BG,
    borderRadius: 25,
    borderWidth: 0.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_PRIMARY,
  },
  legalText: {
    fontSize: 11,
    color: TEXT_HINT,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Preview
  previewImageArea: {
    height: 80,
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  previewBody: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    lineHeight: 18,
    marginBottom: 10,
  },
  previewLink: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});