import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Platform,
  TextInput,
  PanResponder,
  Modal,
  Alert,
  NativeModules,
} from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { fetchWithBaseUrlFallback } from '../../../Src/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTabletOrLaptop = SCREEN_WIDTH >= 768;

const loadRazorpayScript = () => {
  if (Platform.OS !== 'web') return Promise.resolve(true);
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const getRazorpayHtml = (options) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body { background-color: #f4f6f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
    .loader { border: 4px solid #f3f3f3; border-top: 4px solid #2A9D8F; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader"></div>
  <script>
    var options = ${JSON.stringify(options)};
    options.handler = function (response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', payload: response }));
    };
    options.modal = {
      ondismiss: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'dismiss' }));
      }
    };
    var rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response){
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'error', error: response.error.description }));
    });
    rzp1.open();
  </script>
</body>
</html>
`;

const openCheckout = async (options) => {
  if (Platform.OS === 'web') {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) throw new Error('Unable to load Razorpay checkout');
    return new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        ...options,
        handler: resolve,
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
      });
      checkout.open();
    });
  }
  const razorpayModule = require('react-native-razorpay');
  const RazorpayCheckout = razorpayModule.default || razorpayModule;
  if (!RazorpayCheckout || !RazorpayCheckout.open) throw new Error('Razorpay native module missing');
  return RazorpayCheckout.open(options);
};


// ─── Colour tokens ───────────────────────────────────────────────────────────
const COLORS = {
  navy: '#0D1B3E',
  teal: '#2A9D8F',
  tealLight: '#3DBDB0',
  darkGreen: '#1B4332',
  white: '#FFFFFF',
  offWhite: '#F4F6F9',
  lightGray: '#E8ECF0',
  textMuted: '#6B7A99',
  badgeBg: '#E8F5F3',
  badgeText: '#2A9D8F',
  parentCard: '#FFFFFF',
  parentBorder: '#DDE3EE',
  footerBg: '#0D1B3E',
};

// ─── Portal Card Component ────────────────────────────────────────────────────
const PortalCard = ({ variant, badge, icon, title, description, buttonLabel, onPress, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isLight = variant === 'light';
  const isDark = variant === 'dark';
  const isGreen = variant === 'green';

  const cardStyle = [
    styles.card,
    isTabletOrLaptop && styles.cardTablet,
    isDark && styles.cardDark,
    isGreen && styles.cardGreen,
    isLight && styles.cardLight,
  ];

  const titleStyle = [
    styles.cardTitle,
    (isDark || isGreen) && styles.cardTitleLight,
  ];

  const descStyle = [
    styles.cardDesc,
    (isDark || isGreen) && styles.cardDescLight,
  ];

  const btnStyle = [
    styles.cardButton,
    (isDark || isGreen) ? styles.cardButtonLight : styles.cardButtonDark,
  ];

  const btnTextStyle = [
    styles.cardButtonText,
    (isDark || isGreen) ? styles.cardButtonTextDark : styles.cardButtonTextLight,
  ];

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        isTabletOrLaptop && styles.cardWrapper,
      ]}
    >
      <View style={cardStyle}>
        {/* Background overlay for dark/green cards */}
        {(isDark || isGreen) && (
          <View style={[styles.cardOverlay, isDark && styles.overlayDark, isGreen && styles.overlayGreen]} />
        )}

        {/* Badge */}
        {badge && (
          <View style={[styles.badge, (isDark || isGreen) && styles.badgeLight]}>
            <Text style={[styles.badgeText, (isDark || isGreen) && styles.badgeTextLight]}>
              {badge.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Icon */}
        <View style={[styles.iconBox, (isDark || isGreen) && styles.iconBoxLight]}>
          <Text style={styles.iconEmoji}>{icon}</Text>
        </View>

        <Text style={titleStyle}>{title}</Text>
        <Text style={descStyle}>{description}</Text>

        {/* CTA */}
        <TouchableOpacity
          style={btnStyle}
          onPress={onPress}
          activeOpacity={0.75}
        >
          <Text style={btnTextStyle}>{buttonLabel}</Text>
          {isLight && <Text style={[btnTextStyle, { marginLeft: 6 }]}>›</Text>}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── Bottom Nav Item ──────────────────────────────────────────────────────────
const NavItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>
    <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Student Bottom Sheet Component ────────────────────────────────────────────
const StudentBottomSheet = ({ visible, onClose, instituteId, adminEmail = '', adminName = '' }) => {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [parentId, setParentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPassword, setParentPassword] = useState('parentpassword');
  const [studentPhoneNumber, setStudentPhoneNumber] = useState('');
  const [parentPhoneNumber, setParentPhoneNumber] = useState('');
  const [lastYearMarks, setLastYearMarks] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [totalFees, setTotalFees] = useState('');
  const [payAdvance, setPayAdvance] = useState('');
  const [advancedFeePayment, setAdvancedFeePayment] = useState('');
  const [paying, setPaying] = useState(false);
  const [razorpayWebOptions, setRazorpayWebOptions] = useState(null);
  
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    const normalized = fullName.trim();
    setStudentId(normalized);
    setParentId(normalized);
  }, [fullName]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleSubmit = async () => {
    try {
      if (!String(instituteId || '').trim()) {
        Alert.alert('Missing institute', 'Please sign in again as institute admin.');
        return;
      }

      if (!fullName.trim()) {
        Alert.alert('Validation', 'Full name is required.');
        return;
      }

      if (!studentPassword.trim()) {
        Alert.alert('Validation', 'Student password is required.');
        return;
      }

      const { response } = await fetchWithBaseUrlFallback('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: instituteId.trim(),
          fullName: fullName.trim(),
          studentId: fullName.trim(),
          studentPassword: studentPassword.trim(),
          parentId: fullName.trim(),
          parentName: parentName.trim(),
          parentPassword: parentPassword.trim(),
          studentPhoneNumber: studentPhoneNumber.trim(),
          parentPhoneNumber: parentPhoneNumber.trim(),
          advancedFeePayment: (advancedFeePayment.trim() || payAdvance.trim() || lastYearMarks.trim()),
          totalFees: (totalFees || '').toString(),
          dateOfBirth: dateOfBirth.trim(),
          academicYear: academicYear.trim(),
          createdBy: {
            email: (adminEmail || '').trim().toLowerCase(),
            adminName: (adminName || '').trim(),
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        Alert.alert('Save failed', payload?.message || 'Unable to save student.');
        return;
      }

      Alert.alert('Saved', 'Student saved to database successfully.');
      handleClose();
    } catch (error) {
      Alert.alert('Network error', 'Could not connect to backend to save student.');
    }
  };

  const verifyPayment = async (sid, paymentResult) => {
    try {
      const { response } = await fetchWithBaseUrlFallback(`/api/students/${sid}/pay-fee/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
          amount: payAdvance,
        }),
      });
      if (!response.ok) throw new Error('Verification failed');
      Alert.alert('Success', 'Advance payment successful and student saved.');
      handleClose();
    } catch (err) {
      Alert.alert('Verification Error', err.message);
    } finally {
      setPaying(false);
      setRazorpayWebOptions(null);
    }
  };

  const handlePayAdvance = async () => {
    const amt = (payAdvance || '').trim();
    if (!amt) {
      Alert.alert('Validation', 'Enter an advance amount to pay.');
      return;
    }
    if (!fullName.trim() || !studentPassword.trim()) {
      Alert.alert('Validation', 'Please fill required student details (Name, Password) before paying.');
      return;
    }

    try {
      setPaying(true);
      // 1. Save student first
      const { response: studentResp } = await fetchWithBaseUrlFallback('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: instituteId.trim(),
          fullName: fullName.trim(),
          studentId: fullName.trim(),
          studentPassword: studentPassword.trim(),
          parentId: fullName.trim(),
          parentName: parentName.trim(),
          parentPassword: parentPassword.trim(),
          studentPhoneNumber: studentPhoneNumber.trim(),
          parentPhoneNumber: parentPhoneNumber.trim(),
          totalFees: (totalFees || '').toString(),
          dateOfBirth: dateOfBirth.trim(),
          academicYear: academicYear.trim(),
          createdBy: {
            email: (adminEmail || '').trim().toLowerCase(),
            adminName: (adminName || '').trim(),
          },
        }),
      });

      const studentPayload = await studentResp.json();
      if (!studentResp.ok) throw new Error(studentPayload?.message || 'Unable to save student.');

      const savedStudentId = studentPayload._id;

      // 2. Create Razorpay order
      const { response: orderResp } = await fetchWithBaseUrlFallback(`/api/students/${savedStudentId}/pay-fee/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });

      const orderPayload = await orderResp.json();
      if (!orderResp.ok) throw new Error(orderPayload?.message || 'Unable to create payment order. Is Institute Linked Account setup?');

      const options = {
        key: orderPayload.keyId,
        amount: orderPayload.order.amount,
        currency: orderPayload.order.currency || 'INR',
        name: 'Advance Fee Payment',
        description: `Advance fee payment for ${fullName}`,
        order_id: orderPayload.order.id,
        prefill: {
          name: fullName,
          email: '',
          contact: studentPhoneNumber
        },
        theme: { color: COLORS.teal },
      };

      if (Platform.OS !== 'web') {
        let isNativeModuleMissing = false;
        try {
          const razorpayModule = require('react-native-razorpay');
          const RazorpayCheckout = razorpayModule.default || razorpayModule;
          if (!RazorpayCheckout || !RazorpayCheckout.open) isNativeModuleMissing = true;
          else {
            const paymentResult = await RazorpayCheckout.open(options);
            await verifyPayment(savedStudentId, paymentResult);
            return;
          }
        } catch (e) {
          console.log('Native fallback to webview:', e.message);
          setRazorpayWebOptions({ ...options, studentId: savedStudentId });
          return;
        }
        if (isNativeModuleMissing) setRazorpayWebOptions({ ...options, studentId: savedStudentId });
      } else {
        const paymentResult = await openCheckout(options);
        await verifyPayment(savedStudentId, paymentResult);
      }
    } catch (err) {
      setPaying(false);
      Alert.alert('Payment Error', err.message || 'Something went wrong');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.sheetOverlay}>
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle}>
            <View style={styles.dragBar} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Student Information</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter full name"
                placeholderTextColor={COLORS.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Student ID */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Student ID</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Auto from student name"
                placeholderTextColor={COLORS.textMuted}
                value={studentId}
                editable={false}
              />
            </View>

            {/* Student Password */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Student Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter student password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={studentPassword}
                onChangeText={setStudentPassword}
              />
            </View>

            {/* Parent ID */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Parent ID</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Auto from student name"
                placeholderTextColor={COLORS.textMuted}
                value={parentId}
                editable={false}
              />
            </View>

            {/* Parent Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Parent Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter parent name"
                placeholderTextColor={COLORS.textMuted}
                value={parentName}
                onChangeText={setParentName}
              />
            </View>

            {/* Parent Password */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Parent Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Default: parentpassword"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={parentPassword}
                onChangeText={setParentPassword}
              />
            </View>

            {/* Student Phone Number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Student Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter student phone number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={studentPhoneNumber}
                onChangeText={setStudentPhoneNumber}
              />
            </View>

            {/* Parent Phone Number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Parent Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter parent phone number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={parentPhoneNumber}
                onChangeText={setParentPhoneNumber}
              />
            </View>

            {/* Last Year Marks */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Student Last Year Marks</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter last year marks"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={lastYearMarks}
                onChangeText={setLastYearMarks}
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date of Birth</Text>
              <TextInput
                style={styles.textInput}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={COLORS.textMuted}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
            </View>

            {/* Academic Year */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Academic Year</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 2024-2025"
                placeholderTextColor={COLORS.textMuted}
                value={academicYear}
                onChangeText={setAcademicYear}
              />
            </View>

            {/* Total Fees */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Total Fees</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter total fees"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={totalFees}
                onChangeText={setTotalFees}
              />
            </View>

            {/* Pay Advance */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pay Advance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.textInput, { flex: 1, marginRight: 10 }]}
                  placeholder="Amount to pay"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={payAdvance}
                  onChangeText={setPayAdvance}
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.teal,
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    minWidth: 90,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={handlePayAdvance}
                  disabled={paying}
                >
                  <Text style={styles.submitButtonText}>{paying ? 'Processing...' : 'Pay'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={paying}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>

      <Modal visible={!!razorpayWebOptions} animationType="slide" onRequestClose={() => { setRazorpayWebOptions(null); setPaying(false); }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f6f9' }}>
          <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ccc', alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={() => { setRazorpayWebOptions(null); setPaying(false); }} style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ color: COLORS.navy, fontSize: 15, fontWeight: '700' }}>Cancel Payment</Text>
            </TouchableOpacity>
          </View>
          {razorpayWebOptions && (
            <WebView
              originWhitelist={['*']}
              source={{ html: getRazorpayHtml(razorpayWebOptions) }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.event === 'success') {
                    verifyPayment(razorpayWebOptions.studentId, data.payload);
                  } else if (data.event === 'dismiss') {
                    setRazorpayWebOptions(null);
                    setPaying(false);
                    Alert.alert('Payment cancelled', 'You closed the payment window.');
                  } else if (data.event === 'error') {
                    setRazorpayWebOptions(null);
                    setPaying(false);
                    Alert.alert('Payment error', data.error || 'An error occurred during payment.');
                  }
                } catch (e) {
                  // ignore
                }
              }}
              style={{ flex: 1 }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </Modal>
  );
};

// ─── Teacher Bottom Sheet Component ────────────────────────────────────────────
const TeacherBottomSheet = ({ visible, onClose, instituteId, adminEmail = '', adminName = '' }) => {
  const [fullName, setFullName] = useState('');
  const [experience, setExperience] = useState('');
  const [qualification, setQualification] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    setTeacherId(fullName.trim());
  }, [fullName]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleSubmit = async () => {
    try {
      if (!String(instituteId || '').trim()) {
        Alert.alert('Missing institute', 'Please sign in again as institute admin.');
        return;
      }

      if (!fullName.trim()) {
        Alert.alert('Validation', 'Full name is required.');
        return;
      }

      if (!teacherPassword.trim()) {
        Alert.alert('Validation', 'Teacher password is required.');
        return;
      }

      const { response } = await fetchWithBaseUrlFallback('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: instituteId.trim(),
          instituteId: instituteId.trim(),
          fullName: fullName.trim(),
          experience: experience.trim(),
          qualification: qualification.trim(),
          teacherId: fullName.trim(),
          teacherPassword: teacherPassword.trim(),
          departmentName: departmentName.trim(),
          createdBy: {
            email: (adminEmail || '').trim().toLowerCase(),
            adminName: (adminName || '').trim(),
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        Alert.alert('Save failed', payload?.message || 'Unable to save teacher.');
        return;
      }

      Alert.alert('Saved', 'Teacher saved to database successfully.');
      handleClose();
    } catch (error) {
      Alert.alert('Network error', 'Could not connect to backend to save teacher.');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.sheetOverlay}>
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle}>
            <View style={styles.dragBar} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Teacher Information</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter full name"
                placeholderTextColor={COLORS.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Experience */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Experience</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 5 years"
                placeholderTextColor={COLORS.textMuted}
                value={experience}
                onChangeText={setExperience}
              />
            </View>

            {/* Qualification */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Qualification</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., M.Sc, B.Ed"
                placeholderTextColor={COLORS.textMuted}
                value={qualification}
                onChangeText={setQualification}
              />
            </View>

            {/* Teacher ID */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Teacher ID</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Auto from teacher name"
                placeholderTextColor={COLORS.textMuted}
                value={teacherId}
                editable={false}
              />
            </View>

            {/* Teacher Password */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Teacher Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter teacher password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={teacherPassword}
                onChangeText={setTeacherPassword}
              />
            </View>

            {/* Department Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Department Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter department name"
                placeholderTextColor={COLORS.textMuted}
                value={departmentName}
                onChangeText={setDepartmentName}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};
// ─── Assistant Bottom Sheet Component ───────────────────────────────────────
const AssistantBottomSheet = ({ visible, onClose, instituteId, adminEmail = '', adminName = '' }) => {
  const [assistantName, setAssistantName] = useState('');
  const [qualification, setQualification] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [yearOfExperience, setYearOfExperience] = useState('');
  const [department, setDepartment] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleSubmit = async () => {
    if (!assistantName.trim()) {
      Alert.alert('Validation', 'Assistant name is required.');
      return;
    }

    if (!qualification.trim()) {
      Alert.alert('Validation', 'Qualification is required.');
      return;
    }

    if (!dateOfBirth.trim()) {
      Alert.alert('Validation', 'Date of birth is required.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Validation', 'Password is required.');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Validation', 'Phone number is required.');
      return;
    }

    if (!yearOfExperience.trim()) {
      Alert.alert('Validation', 'Years of experience is required.');
      return;
    }

    try {
      const { response } = await fetchWithBaseUrlFallback('/api/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteId: instituteId.trim(),
          assistantName: assistantName.trim(),
          qualification: qualification.trim(),
          dateOfBirth: dateOfBirth.trim(),
          password: password.trim(),
          phoneNumber: phoneNumber.trim(),
          yearOfExperience: yearOfExperience.trim(),
          department: department.trim(),
          address: address.trim(),
          email: email.trim(),
          notes: notes.trim(),
          createdBy: {
            email: (adminEmail || '').trim().toLowerCase(),
            adminName: (adminName || '').trim(),
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        Alert.alert('Error', payload?.message || 'Failed to save assistant');
        return;
      }

      Alert.alert('Success', `Assistant ${assistantName.trim()} saved successfully`);
      handleClose();
    } catch (error) {
      Alert.alert('Network error', 'Could not connect to backend to save assistant.');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.sheetOverlay}>
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.dragHandle}>
            <View style={styles.dragBar} />
          </View>

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Assistant Information</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Assistant Name</Text>
              <TextInput style={styles.textInput} placeholder="Enter assistant name" placeholderTextColor={COLORS.textMuted} value={assistantName} onChangeText={setAssistantName} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Qualification</Text>
              <TextInput style={styles.textInput} placeholder="e.g., B.A., M.A., Diploma" placeholderTextColor={COLORS.textMuted} value={qualification} onChangeText={setQualification} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date of Birth</Text>
              <TextInput style={styles.textInput} placeholder="DD/MM/YYYY" placeholderTextColor={COLORS.textMuted} value={dateOfBirth} onChangeText={setDateOfBirth} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password</Text>
              <TextInput style={styles.textInput} placeholder="Enter password" placeholderTextColor={COLORS.textMuted} secureTextEntry value={password} onChangeText={setPassword} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput style={styles.textInput} placeholder="Enter phone number" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Years of Experience</Text>
              <TextInput style={styles.textInput} placeholder="e.g., 3" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={yearOfExperience} onChangeText={setYearOfExperience} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Department / Section</Text>
              <TextInput style={styles.textInput} placeholder="Enter department or section" placeholderTextColor={COLORS.textMuted} value={department} onChangeText={setDepartment} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address</Text>
              <TextInput style={styles.textInput} placeholder="Enter address" placeholderTextColor={COLORS.textMuted} value={address} onChangeText={setAddress} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput style={styles.textInput} placeholder="Enter email" placeholderTextColor={COLORS.textMuted} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes / Other Points</Text>
              <TextInput style={styles.textInput} placeholder="Add any extra details" placeholderTextColor={COLORS.textMuted} value={notes} onChangeText={setNotes} />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};
// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ScholarEthosHub({ initialPortal, instituteId, adminEmail = '', adminName = '' }) {
  const headerFade = useRef(new Animated.Value(0)).current;
  const [showStudentSheet, setShowStudentSheet] = useState(false);
  const [showTeacherSheet, setShowTeacherSheet] = useState(false);
  const [showAssistantSheet, setShowAssistantSheet] = useState(false);

  const openPortalSheet = (portalType) => {
    setShowStudentSheet(false);
    setShowTeacherSheet(false);
    setShowAssistantSheet(false);

    if (portalType === 'student') {
      setShowStudentSheet(true);
    } else if (portalType === 'teacher') {
      setShowTeacherSheet(true);
    } else if (portalType === 'assistant') {
      setShowAssistantSheet(true);
    }
  };

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (initialPortal) {
      openPortalSheet(initialPortal);
    }
  }, [initialPortal]);

  const handlePortalPress = (portal) => {
    if (portal === 'Students') {
      openPortalSheet('student');
    } else if (portal === 'Faculty & Academic Records') {
      openPortalSheet('teacher');
    } else if (portal === 'Assistant') {
      openPortalSheet('assistant');
    } else {
      // Navigation logic for other portals
      console.log(`Navigate to: ${portal}`);
    }
  };

  const portalCards = [
    {
      variant: 'dark',
      icon: '🎓',
      title: 'Students',
      description: 'Access your curriculum, track grades, and connect with peer groups through our dedicated learning portal.',
      buttonLabel: 'Enter Database',
      delay: 200,
    },
    {
      variant: 'green',
      badge: 'Faculty Access',
      icon: '🖥️',
      title: 'Faculty & Academic Records',
      description: 'Manage course materials, update student evaluations, and access advanced administrative tools for curators.',
      buttonLabel: 'Enter Database ',
      delay: 500,
    },
    {
      variant: 'light',
      badge: 'Assistant Access',
      icon: '🧑‍💼',
      title: 'Assistant',
      description: 'Capture assistant profiles with qualifications, contact details, experience, and secure credentials.',
      buttonLabel: 'Enter Database',
      delay: 700,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.offWhite} />

      {/* ── Top Navigation Bar ── */}
      

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ── */}
        <Animated.View style={[styles.hero, { opacity: headerFade }]}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>INSTITUTIONAL ACCESS</Text>
          </View>
          <Text style={styles.heroTitle}>
            DATABASE CENTER{' '}
            <Text style={styles.heroTitleAccent}>Scholar Ethos{'\n'}Selection Hub.</Text>
          </Text>
          
        </Animated.View>

        {/* ── Portal Cards ── */}
        <View style={[styles.cardsContainer, isTabletOrLaptop && styles.cardsContainerTablet]}>
          {portalCards.map((card, i) => (
            <PortalCard
              key={card.title}
              {...card}
              onPress={() => handlePortalPress(card.title)}
            />
          ))}
        </View>

        {/* ── Footer ── */}
        
      </ScrollView>

      {/* ── Student Bottom Sheet ── */}
      <StudentBottomSheet
        visible={showStudentSheet}
        instituteId={instituteId}
        adminEmail={adminEmail}
        adminName={adminName}
        onClose={() => setShowStudentSheet(false)}
      />

      {/* ── Teacher Bottom Sheet ── */}
      <TeacherBottomSheet
        visible={showTeacherSheet}
        instituteId={instituteId}
        adminEmail={adminEmail}
        adminName={adminName}
        onClose={() => setShowTeacherSheet(false)}
      />

      {/* ── Assistant Bottom Sheet ── */}
      <AssistantBottomSheet
        visible={showAssistantSheet}
        instituteId={instituteId}
        adminEmail={adminEmail}
        adminName={adminName}
        onClose={() => setShowAssistantSheet(false)}
      />

      {/* ── Bottom Tab Bar ── */}
      
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTabletOrLaptop ? 40 : 20,
    paddingVertical: 14,
    backgroundColor: COLORS.offWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  hamburger: {
    fontSize: 22,
    color: COLORS.navy,
  },
  brandName: {
    fontSize: isTabletOrLaptop ? 20 : 17,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: 0.3,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarEmoji: {
    fontSize: 20,
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ── Hero ──
  hero: {
    paddingHorizontal: isTabletOrLaptop ? 80 : 24,
    paddingTop: isTabletOrLaptop ? 48 : 32,
    paddingBottom: isTabletOrLaptop ? 32 : 24,
    alignItems: isTabletOrLaptop ? 'flex-start' : 'center',
  },
  heroBadge: {
    backgroundColor: COLORS.badgeBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.tealLight + '55',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.badgeText,
    letterSpacing: 1.8,
  },
  heroTitle: {
    fontSize: isTabletOrLaptop ? 42 : 28,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: isTabletOrLaptop ? 'left' : 'center',
    lineHeight: isTabletOrLaptop ? 52 : 36,
    marginBottom: 16,
  },
  heroTitleAccent: {
    color: COLORS.teal,
  },
  heroSubtitle: {
    fontSize: isTabletOrLaptop ? 16 : 14,
    color: COLORS.textMuted,
    textAlign: isTabletOrLaptop ? 'left' : 'center',
    lineHeight: 22,
    maxWidth: isTabletOrLaptop ? 560 : '100%',
  },

  // ── Cards Container ──
  cardsContainer: {
    paddingHorizontal: isTabletOrLaptop ? 40 : 16,
    gap: 16,
  },
  cardsContainerTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },

  // ── Card Base ──
  cardWrapper: {
    width: isTabletOrLaptop ? (SCREEN_WIDTH - 120) / 3 : '100%',
    minWidth: 260,
  },
  card: {
    borderRadius: 18,
    padding: isTabletOrLaptop ? 28 : 24,
    marginBottom: isTabletOrLaptop ? 0 : 4,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },
  cardTablet: {
    flex: 1,
    minHeight: 300,
  },
  cardDark: {
    backgroundColor: COLORS.navy,
    minHeight: isTabletOrLaptop ? 320 : 260,
  },
  cardGreen: {
    backgroundColor: COLORS.darkGreen,
    minHeight: isTabletOrLaptop ? 320 : 280,
  },
  cardLight: {
    backgroundColor: COLORS.parentCard,
    borderWidth: 1.5,
    borderColor: COLORS.parentBorder,
  },

  // Card overlay tint
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    opacity: 0.15,
  },
  overlayDark: {
    backgroundColor: COLORS.teal,
  },
  overlayGreen: {
    backgroundColor: '#A8DADC',
  },

  // ── Card Badge ──
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeLight: {},
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tealLight,
    letterSpacing: 1.5,
  },
  badgeTextLight: {
    color: COLORS.tealLight,
  },

  // ── Icon Box ──
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconBoxLight: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  iconEmoji: {
    fontSize: 22,
  },

  // ── Card Text ──
  cardTitle: {
    fontSize: isTabletOrLaptop ? 22 : 20,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 10,
    lineHeight: isTabletOrLaptop ? 28 : 26,
  },
  cardTitleLight: {
    color: COLORS.white,
  },
  cardDesc: {
    fontSize: 13.5,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 24,
    flex: isTabletOrLaptop ? 1 : 0,
  },
  cardDescLight: {
    color: 'rgba(255,255,255,0.80)',
  },

  // ── Card Button ──
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignSelf: isTabletOrLaptop ? 'stretch' : 'flex-start',
    minWidth: 180,
  },
  cardButtonLight: {
    backgroundColor: COLORS.white,
  },
  cardButtonDark: {
    backgroundColor: COLORS.teal,
  },

  cardButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardButtonTextLight: {
    color: COLORS.white,
  },
  cardButtonTextDark: {
    color: COLORS.navy,
  },

  // ── Footer ──
  footer: {
    marginTop: 32,
    paddingHorizontal: isTabletOrLaptop ? 40 : 20,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.offWhite,
  },
  footerBrand: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 17,
    flex: 1,
  },
  footerLink: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 17,
    textAlign: 'center',
    marginLeft: 20,
  },

  // ── Bottom Navigation ──
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 10 },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 20,
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  navIconActive: {
    color: COLORS.teal,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
  },
  navLabelActive: {
    color: COLORS.teal,
  },

  // ── Bottom Sheet Styles ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 20 },
    }),
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingTop: 16,
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textMuted,
    padding: 8,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  // ── Form Styles ──
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.navy,
    backgroundColor: COLORS.offWhite,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.badgeBg,
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 13,
    color: COLORS.badgeText,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
