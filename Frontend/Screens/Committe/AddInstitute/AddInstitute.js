import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  NativeModules,
  useWindowDimensions,
  ScrollView,
  Alert,
} from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URLS, fetchWithBaseUrlFallback } from '../../../Src/axios';
import Register from './Register';


console.log('API platform:', Platform.OS);
console.log('API base URLs:', API_BASE_URLS);

const formatPricePerUser = (pricePerUser) => {
  const value = String(pricePerUser || '').trim().replace(/^₹\s*/, '');
  return value ? `₹${value}/user` : 'Not set';
};

const AccreditationBadge = ({ level }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeCheck}>✓</Text>
    <Text style={styles.badgeText}>{level}</Text>
  </View>
);

// ─── Institute Detail View ────────────────────────────────────────────────────
const InstituteDetailView = ({ institute, onBack, onEdit, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Institute',
      `Are you sure you want to delete "${institute.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            setIsDeleting(true);
            onDelete(institute.id);
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f3" />
      
      {/* Header with back button */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        {/* Institute Avatar */}
        <View style={styles.detailAvatarContainer}>
          <View style={[styles.detailAvatar, { backgroundColor: institute.bg }]}>
            <Text style={[styles.detailAvatarText, { color: institute.color }]}>
              {institute.initials}
            </Text>
          </View>
        </View>

        {/* Institute Name */}
        <Text style={styles.detailTitle}>{institute.name}</Text>

        {/* Details Table */}
        <View style={styles.detailsTable}>
          {/* Location Row */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>📍 Location</Text>
            <Text style={styles.tableValue}>{institute.location}</Text>
          </View>

          {/* Price Row */}
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.tableLabel}>💰 Pricing</Text>
            <Text style={styles.tableValue}>{institute.price}</Text>
          </View>

          {/* Institute ID Row */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>🆔 Institute ID</Text>
            <Text style={styles.tableValue}>{institute.instituteId || `INS-${institute.id}`}</Text>
          </View>

          {/* Accreditation Row */}
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.tableLabel}>✓ Accreditation</Text>
            <Text style={styles.tableValue}>{institute.accreditation}</Text>
          </View>

          {/* Joined Date Row */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>📅 Joined Date</Text>
            <Text style={styles.tableValue}>{institute.joined}</Text>
          </View>

            {/*Admin detains Row*/}
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={styles.tableLabel}>👮 Admin Name</Text>
              <Text style={styles.tableValue}>{institute.adminName || 'Not provided'}</Text>
            </View>

            {/*Admin contact Row*/}
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={styles.tableLabel}>📞 Admin Contact</Text>
              <Text style={styles.tableValue}>{institute.phone || 'Not provided'}</Text>
            </View>



            {/*Admin email Row*/}
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={styles.tableLabel}>✉️ Admin Email</Text>
              <Text style={styles.tableValue}>{institute.email || 'Not provided'}</Text>
            </View>

          {/* Bank Account Details Section */}
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.tableLabel}>🏦 Bank Account</Text>
            <View style={styles.bankDetailsContainer}>
              <Text style={styles.bankDetailItem}>
                {institute.bankAccount?.accountHolderName || 'Not provided'}
              </Text>
              <Text style={styles.bankDetailItem}>
                Account: ****{institute.bankAccount?.accountNumber?.slice(-4) || '****'}
              </Text>
              <Text style={styles.bankDetailItem}>
                IFSC: {institute.bankAccount?.ifscCode || 'Not provided'}
              </Text>
              <Text style={styles.bankDetailItem}>
                Status: {institute.razorpayDetails?.accountStatus || 'pending'}
              </Text>
              {institute.razorpayDetails?.lastError ? (
                <Text style={styles.bankDetailItem}>
                  Error: {institute.razorpayDetails.lastError}
                </Text>
              ) : null}
            </View>
	          </View>

          {/* Payment Status Section */}
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.tableLabel}>💳 Payment Status</Text>
            <View style={styles.paymentDetailsContainer}>
              <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(institute.payment?.status) }]}>
                <Text style={styles.paymentBadgeText}>
                  {getPaymentStatusEmoji(institute.payment?.status)} {(institute.payment?.status || 'pending').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.bankDetailItem}>
                Amount: {institute.payment?.amount || '₹0'}
              </Text>
              {institute.payment?.dueDate && (
                <Text style={styles.bankDetailItem}>
                  Due: {new Date(institute.payment.dueDate).toLocaleDateString()}
                </Text>
              )}
              {institute.payment?.paidDate && (
                <Text style={styles.bankDetailItem}>
                  Paid: {new Date(institute.payment.paidDate).toLocaleDateString()}
                </Text>
              )}
              {institute.payment?.transactionId && (
                <Text style={styles.bankDetailItem}>
                  TxID: {institute.payment.transactionId}
                </Text>
              )}
            </View>
          </View>

          {/* Access Levels Row */}
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.tableLabel}>🔐 Access Levels</Text>
            <View style={styles.accessLevelsList}>
              {institute.access && institute.access.map((type, index) => (
                <View key={index} style={styles.accessBadgeSmall}>
                  <Text style={styles.accessBadgeSmallText}>
                    {type === 'Student' && '👨‍🎓'} 
                    {type === 'Parent' && '👨‍👩‍👧'} 
                    {type === 'Teacher' && '👨‍🏫'} {type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsGroup}>
          <TouchableOpacity 
            style={styles.actionButtonPrimary} 
            activeOpacity={0.85}
            onPress={() => onEdit(institute)}
          >
            <Text style={styles.actionButtonPrimaryText}>✏️  Edit Institute</Text>
          </TouchableOpacity>
        
          <TouchableOpacity 
            style={styles.actionButtonSecondary} 
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonSecondaryText}>📋  Download Report</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButtonSecondary, styles.deleteButton]} 
            activeOpacity={0.85}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>🗑️  Delete Institute</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const AccreditationBadge2 = ({ level }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeCheck}>✓</Text>
    <Text style={styles.badgeText}>{level}</Text>
  </View>
);

const PaymentBadge = ({ status }) => {
  const isPaid = status === 'completed';
  return (
    <View style={[styles.badge, { backgroundColor: isPaid ? '#ECFDF3' : '#FFF7ED', marginLeft: 8 }]}>
      <Text style={[styles.badgeText, { color: isPaid ? '#168A5A' : '#B45309' }]}>
        {isPaid ? '💰 Paid' : '⏳ Pending'}
      </Text>
    </View>
  );
};

const InstituteCard = ({ item, isDesktop, isMatch, hasQuery, onPress }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[
        styles.card,
        pressed && styles.cardPressed,
        isDesktop && styles.cardDesktop,
        isMatch && hasQuery && styles.cardHighlighted,
      ]}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: item.bg }]}>
        <Text style={[styles.avatarText, { color: item.color }]}>{item.initials}</Text>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.instituteName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText}>{item.location}</Text>
        </View>
        <View style={styles.metaRowWrap}>
          <AccreditationBadge level={item.accreditation} />
          <PaymentBadge status={item.payment?.status} />
          <View style={styles.joinedRow}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>{item.joined}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Text style={styles.actionIcon}>⋮</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function AddInstitute({ onInstituteClick, selectedInstitute: externalSelectedInstitute }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [query, setQuery] = useState('');
  const [institutes, setInstitutes] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(externalSelectedInstitute || null);

  // Update selected institute when external prop changes
  useEffect(() => {
    if (externalSelectedInstitute) {
      setSelectedInstitute(externalSelectedInstitute);
    }
  }, [externalSelectedInstitute]);

  useEffect(() => {
    let isMounted = true;

    const fetchInstitutes = async () => {
      try {
        const { response, baseUrl } = await fetchWithBaseUrlFallback('/api/institutes');
        console.log('Fetching institutes from:', `${baseUrl}/api/institutes`);
        console.log('Fetch institutes - Response status:', response.status);
        const payload = await response.json();
        console.log('Fetch institutes - Payload received:', payload);

        if (!response.ok || !Array.isArray(payload) || !isMounted) {
          console.warn('Response not ok or not array or unmounted');
          return;
        }

        const colors = ['#1D9E75', '#534AB7', '#3B6D11', '#993C1D', '#0f6e56'];
        const bgs = ['#E1F5EE', '#EEEDFE', '#EAF3DE', '#FAECE7', '#E0F2FE'];

        const mapped = payload.map((inst, index) => {
          const words = String(inst?.name || 'Institute').trim().split(/\s+/);
          const initials = words
            .slice(0, 2)
            .map((word) => word[0] || '')
            .join('')
            .toUpperCase() || 'IN';

          const created = inst?.createdAt ? new Date(inst.createdAt) : new Date();
          const safeDate = Number.isNaN(created.getTime()) ? new Date() : created;

          return {
            id: inst?._id || String(index + 1),
            name: inst?.name || 'Unnamed Institute',
            location: inst?.location || 'Unknown Location',
            instituteId: inst?.instituteId || '',
            adminName: inst?.adminName || '',
            email: inst?.email || '',
            phone: inst?.phone || '',
            accreditation: 'Accredited Level III',
            joined: `Joined ${safeDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`,
            initials,
            color: colors[index % colors.length],
            bg: bgs[index % bgs.length],
            access: [
              inst?.modules?.studentPortal ? 'Student' : null,
              inst?.modules?.parentPortal ? 'Parent' : null,
              inst?.modules?.teacherPortal ? 'Teacher' : null,
              inst?.modules?.adminPortal ? 'Admin' : null,
	            ].filter(Boolean),
	            pricePerUser: inst?.pricePerUser || '',
	            price: formatPricePerUser(inst?.pricePerUser),
	            bankAccount: inst?.bankAccount,
	            razorpayDetails: inst?.razorpayDetails,
	            payment: inst?.payment,
	          };
	        });

        setInstitutes(mapped);
      } catch (error) {
        console.error('Error fetching institutes:', error);
        console.error('Could not connect to backend. Tried:', API_BASE_URLS.join(', '));
      }
    };

    fetchInstitutes();

    return () => {
      isMounted = false;
    };
  }, []);

  const isMatch = (inst) => {
    const q = query.trim().toLowerCase();
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.location.toLowerCase().includes(q) ||
      inst.accreditation.toLowerCase().includes(q)
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return institutes;
    const matches = institutes.filter((inst) =>
      inst.name.toLowerCase().includes(q) ||
      inst.location.toLowerCase().includes(q) ||
      inst.accreditation.toLowerCase().includes(q)
    );
    const rest = institutes.filter((inst) =>
      !inst.name.toLowerCase().includes(q) &&
      !inst.location.toLowerCase().includes(q) &&
      !inst.accreditation.toLowerCase().includes(q)
    );
    return [...matches, ...rest];
  }, [query, institutes]);

  const hasQuery = query.trim().length > 0;
  const matchCount = hasQuery ? filtered.filter(isMatch).length : institutes.length;

  const handleAddInstitute = async (newInstitute) => {
    try {
      console.log('API base URLs:', API_BASE_URLS);
      console.log('Sending registration data:', newInstitute);
      console.log('🔄 About to call fetchWithBaseUrlFallback for /api/institutes/register');
      
      const { response, baseUrl } = await fetchWithBaseUrlFallback('/api/institutes/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInstitute),
      });

      console.log('✅ Request successful!');
      console.log('Registration endpoint used:', `${baseUrl}/api/institutes/register`);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      const payload = await response.json();
      console.log('Response payload:', payload);
      console.log('Response.ok:', response.ok);
      
      if (!response.ok) {
        const errorMsg = payload?.message || `HTTP ${response.status}: ${response.statusText}` || 'Unable to register institute';
        console.error('❌ Registration error:', errorMsg);
        console.error('Full error payload:', JSON.stringify(payload, null, 2));
        Alert.alert('Registration failed', errorMsg);
        return;
      }

      const id = payload?._id || (institutes.length + 1).toString();
      const name = payload?.name || newInstitute.name;
      const initials = name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase();

      const colors = ['#1D9E75', '#534AB7', '#3B6D11', '#993C1D', '#0f6e56'];
      const bgs = ['#E1F5EE', '#EEEDFE', '#EAF3DE', '#FAECE7', '#E0F2FE'];
      const colorIndex = institutes.length % colors.length;

      const instituteData = {
        id,  // This is the MongoDB _id - CRITICAL!
        name,
        location: payload?.location || newInstitute.location,
        instituteId: payload?.instituteId || newInstitute.instituteId,
        adminName: payload?.adminName || newInstitute.adminName,
        email: payload?.email || newInstitute.email,
        phone: payload?.phone || newInstitute.phone,
        accreditation: 'Accredited Level III',
        joined: `Joined ${new Date(payload?.createdAt || Date.now()).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        })}`,
        initials,
        color: colors[colorIndex],
        bg: bgs[colorIndex],
        bankAccount: payload?.bankAccount,
        razorpayDetails: payload?.razorpayDetails,
	        payment: payload?.payment,
	        pricePerUser: payload?.pricePerUser || newInstitute.pricePerUser,
	        access: [
          payload?.modules?.studentPortal ? 'Student' : null,
          payload?.modules?.parentPortal ? 'Parent' : null,
          payload?.modules?.teacherPortal ? 'Teacher' : null,
          payload?.modules?.adminPortal ? 'Admin' : null,
        ].filter(Boolean),
	        price: formatPricePerUser(payload?.pricePerUser || newInstitute.pricePerUser),
	      };

      console.log('📝 Created institute object with ID:', instituteData.id);
      setInstitutes((prev) => [...prev, instituteData]);
      setIsRegistering(false);
      
      // CRITICAL: Refetch institutes from backend to ensure we have correct IDs
      console.log('🔄 Refetching institutes list from backend...');
      try {
        const { response } = await fetchWithBaseUrlFallback('/api/institutes');
        if (response.ok) {
          const payload = await response.json();
          if (Array.isArray(payload)) {
            const colors = ['#1D9E75', '#534AB7', '#3B6D11', '#993C1D', '#0f6e56'];
            const bgs = ['#E1F5EE', '#EEEDFE', '#EAF3DE', '#FAECE7', '#E0F2FE'];

            const mapped = payload.map((inst, index) => {
              const words = String(inst?.name || 'Institute').trim().split(/\s+/);
              const initials = words
                .slice(0, 2)
                .map((word) => word[0] || '')
                .join('')
                .toUpperCase() || 'IN';

              const created = inst?.createdAt ? new Date(inst.createdAt) : new Date();
              const safeDate = Number.isNaN(created.getTime()) ? new Date() : created;

              return {
                id: inst?._id || String(index + 1),
                name: inst?.name || 'Unnamed Institute',
                location: inst?.location || 'Unknown Location',
                instituteId: inst?.instituteId || '',
                adminName: inst?.adminName || '',
                email: inst?.email || '',
                phone: inst?.phone || '',
                accreditation: 'Accredited Level III',
                joined: `Joined ${safeDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`,
                initials,
                color: colors[index % colors.length],
                bg: bgs[index % bgs.length],
                bankAccount: inst?.bankAccount,
                razorpayDetails: inst?.razorpayDetails,
                payment: inst?.payment,
                access: [
                  inst?.modules?.studentPortal ? 'Student' : null,
                  inst?.modules?.parentPortal ? 'Parent' : null,
                  inst?.modules?.teacherPortal ? 'Teacher' : null,
                  inst?.modules?.adminPortal ? 'Admin' : null,
	                ].filter(Boolean),
	                pricePerUser: inst?.pricePerUser || '',
	                price: formatPricePerUser(inst?.pricePerUser),
	              };
            });
            setInstitutes(mapped);
            console.log('✅ Institutes list refreshed from backend');
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not refetch institutes:', error.message);
        // Continue anyway - use the local data
      }
      
      Alert.alert('✅ Institute registered successfully!', 'Institute ID and password are now the Admin login credentials.');
      return;
    } catch (error) {
      console.error('Catch block error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert(
        'Network error',
        `Could not reach backend server: ${error.message}\n\nTried URLs:\n${API_BASE_URLS.join('\n')}\n\nMake sure:\n1. Backend server is running on port 5001\n2. Network is connected\n3. Backend is accessible from your device`
      );
    }
  };

  const handleEditInstitute = async (updatedData) => {
    try {
      console.log('🔄 Updating institute:', editingInstitute.id);
      console.log('Updated data to send:', updatedData);
      
      // Ensure we have all the required fields for update
      const updatePayload = {
        name: updatedData.name,
        location: updatedData.location,
        instituteId: updatedData.instituteId,
        adminName: updatedData.adminName,
        email: updatedData.email,
        phone: updatedData.phone,
        pricePerUser: updatedData.pricePerUser,
        modules: updatedData.modules,
        bankAccount: updatedData.bankAccount,
      };

      console.log('Update payload:', updatePayload);
      
      const { response, baseUrl } = await fetchWithBaseUrlFallback(`/api/institutes/${editingInstitute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      console.log('Update response status:', response.status);
      const payload = await response.json();
      console.log('Update response payload:', payload);
      
      if (!response.ok) {
        const errorMsg = payload?.message || 'Unable to update institute';
        console.error('Update error:', errorMsg);
        Alert.alert('Update failed', errorMsg);
        return;
      }

      // Update local state with the new data
      const updatedInstitute = {
        ...editingInstitute,
        name: payload.name,
        location: payload.location,
        instituteId: payload.instituteId,
        adminName: payload.adminName,
        email: payload.email,
	        phone: payload.phone,
	        pricePerUser: payload.pricePerUser,
	        price: formatPricePerUser(payload.pricePerUser),
	        bankAccount: payload.bankAccount,
        razorpayDetails: payload.razorpayDetails,
        access: [
          payload.modules?.studentPortal ? 'Student' : null,
          payload.modules?.parentPortal ? 'Parent' : null,
          payload.modules?.teacherPortal ? 'Teacher' : null,
          payload.modules?.adminPortal ? 'Admin' : null,
        ].filter(Boolean),
      };

      setInstitutes((prev) => 
        prev.map((inst) => 
          inst.id === editingInstitute.id 
            ? updatedInstitute
            : inst
        )
      );
      
      setIsEditing(false);
      setEditingInstitute(null);
      setSelectedInstitute(null);
      Alert.alert('✅ Institute updated successfully!');
    } catch (error) {
      console.error('Edit error:', error);
      Alert.alert('Error', `Failed to update institute: ${error.message}`);
    }
  };

  const handleDeleteInstitute = async (instituteId) => {
    try {
      console.log('🗑️ Deleting institute:', instituteId);
      
      const { response, baseUrl } = await fetchWithBaseUrlFallback(`/api/institutes/${instituteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const payload = await response.json();
      
      if (!response.ok) {
        const errorMsg = payload?.message || 'Unable to delete institute';
        Alert.alert('Delete failed', errorMsg);
        return;
      }

      // Remove from local state
      setInstitutes((prev) => prev.filter((inst) => inst.id !== instituteId));
      setSelectedInstitute(null);
      Alert.alert('✅ Institute deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', `Failed to delete institute: ${error.message}`);
    }
  };

  const renderItem = ({ item, index }) => {
    const matched = hasQuery && isMatch(item);
    const prevItem = filtered[index - 1];
    const prevMatched = prevItem && hasQuery && isMatch(prevItem);
    const showDivider = hasQuery && !matched && index > 0 && prevMatched;

    return (
      <>
        {showDivider && (
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Other institutes</Text>
            <View style={styles.dividerLine} />
          </View>
        )}
        <InstituteCard
          item={item}
          isDesktop={isDesktop}
          isMatch={matched}
          hasQuery={hasQuery}
          onPress={() => setSelectedInstitute(item)}
        />
      </>
    );
  };

  if (isRegistering) {
    return <Register onSubmit={handleAddInstitute} onCancel={() => setIsRegistering(false)} />;
  }

  if (isEditing && editingInstitute) {
    return <Register 
      isEditMode={true}
      initialData={editingInstitute}
      onSubmit={handleEditInstitute} 
      onCancel={() => {
        setIsEditing(false);
        setEditingInstitute(null);
      }} 
    />;
  }

  if (selectedInstitute) {
    return <InstituteDetailView 
      institute={selectedInstitute} 
      onBack={() => {
        setSelectedInstitute(null);
        if (externalSelectedInstitute) {
          onInstituteClick?.(null);
        }
      }}
      onEdit={(inst) => {
        setEditingInstitute(inst);
        setIsEditing(true);
      }}
      onDelete={handleDeleteInstitute}
    />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f3" />

      <View style={[styles.container, isDesktop && styles.containerDesktop]}>

        {/* ── Header ── */}
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>Institute Registry</Text>
            <Text style={styles.pageSubtitle}>
              Management and oversight of all accredited coaching institutes.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.registerBtn} 
            activeOpacity={0.85}
            onPress={() => setIsRegistering(true)}
          >
            <Text style={styles.registerBtnText}>＋ Register New Institute</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIconEmoji}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, director, or location..."
              placeholderTextColor="#aaa"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && Platform.OS === 'android' && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
         
        </View>

        {/* ── Match count ── */}
        {hasQuery && (
          <Text style={styles.matchNote}>
            {matchCount > 0
              ? `${matchCount} result${matchCount !== 1 ? 's' : ''} for "${query}"`
              : `No results for "${query}"`}
          </Text>
        )}

        {/* ── List ── */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            <Text style={styles.footer}>
              Showing {filtered.length} of {institutes.length} registered institutes
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// Helper functions for payment status
const getPaymentStatusColor = (status) => {
  switch(status) {
    case 'completed': return '#4CAF50';
    case 'pending': return '#FFC107';
    case 'overdue': return '#FF5722';
    case 'failed': return '#FF6B6B';
    default: return '#999';
  }
};

const getPaymentStatusEmoji = (status) => {
  switch(status) {
    case 'completed': return '✅';
    case 'pending': return '⏳';
    case 'overdue': return '⚠️';
    case 'failed': return '❌';
    default: return '❓';
  }
};

const NAVY = '#0d2340';
const TEAL = '#0f6e56';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },

  /* Layout */
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  containerDesktop: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },

  /* Header */
  header: {
    marginBottom: 20,
  },
  headerDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  registerBtn: {
    marginTop: 12,
    backgroundColor: NAVY,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Search row */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIconEmoji: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 13,
    color: '#aaa',
  },
  filterBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  filterText: {
    fontSize: 13,
    color: TEAL,
    fontWeight: '600',
  },

  /* Match note */
  matchNote: {
    fontSize: 13,
    color: '#777',
    marginBottom: 10,
    marginLeft: 2,
  },

  /* List */
  list: {
    paddingBottom: 32,
  },

  /* Card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ececec',
    padding: 14,
    marginBottom: 10,
  },
  cardPressed: {
    backgroundColor: '#f9f9f9',
    borderColor: '#d5d5d5',
  },
  cardDesktop: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardHighlighted: {
    borderColor: '#0f6e56',
    borderWidth: 1.5,
    backgroundColor: '#f5fdf9',
  },

  /* Avatar */
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },

  /* Card content */
  cardContent: {
    flex: 1,
    gap: 4,
  },
  instituteName: {
    fontSize: 15,
    fontWeight: '600',
    color: NAVY,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  metaIcon: {
    fontSize: 11,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  /* Badge */
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5EE',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  badgeCheck: {
    fontSize: 10,
    color: TEAL,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 11,
    color: TEAL,
    fontWeight: '600',
  },

  /* Card actions */
  cardActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 6,
  },
  actionIcon: {
    fontSize: 14,
  },

  /* Divider */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },

  /* Footer */
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: '#aaa',
    marginTop: 8,
    paddingBottom: 8,
  },

  /* Detail View */
  detailHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: NAVY,
  },
  detailContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  detailAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailAvatar: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarText: {
    fontSize: 40,
    fontWeight: '700',
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
    marginBottom: 24,
  },
  
  /* Details Table */
  detailsTable: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 28,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  tableLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
    flex: 0.4,
  },
  tableValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    flex: 0.6,
    textAlign: 'right',
  },
  accessLevelsList: {
    flex: 0.6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  accessBadgeSmall: {
    backgroundColor: TEAL,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  accessBadgeSmallText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  bankDetailsContainer: {
    flex: 0.6,
    alignItems: 'flex-end',
  },
  bankDetailItem: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
    marginVertical: 2,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  detailCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#f5f5f3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  detailCardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  detailCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 6,
  },
  detailCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: NAVY,
    textAlign: 'center',
  },
  actionButtonsGroup: {
    gap: 12,
    marginBottom: 24,
  },
  actionButtonPrimary: {
    backgroundColor: NAVY,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    backgroundColor: '#f5f5f3',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonSecondaryText: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '600',
  },
  
  /* Access Section - Kept for compatibility */
  accessSection: {
    marginBottom: 24,
  },
  accessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 12,
  },
  accessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  accessBadge: {
    backgroundColor: TEAL,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  accessBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  
  /* Joined Section - Kept for compatibility */
  joinedSection: {
    backgroundColor: '#f5f5f3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  joinedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
  },

  /* Delete Button */
  deleteButton: {
    borderColor: '#ff4444',
    backgroundColor: '#fff3f3',
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Payment Status */
  paymentDetailsContainer: {
    flex: 0.6,
    alignItems: 'flex-end',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  paymentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
