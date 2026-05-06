import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const BATCHES = [
  'Grade 10 - Section A',
  'Grade 10 - Section B',
  'Grade 9 - Section B',
  'Grade 11 - Science',
];

const STUDENTS = [
  { id: '1', name: 'Aarav Sharma', roll: '10A001', online: true, initials: 'AS' },
  { id: '2', name: 'Ishani Patel', roll: '10A005', online: true, initials: 'IP' },
  { id: '3', name: 'Vikram Kapoor', roll: '10A012', online: false, initials: 'VK' },
  { id: '4', name: 'Rohan Das', roll: '10A018', online: false, initials: 'RD' },
  { id: '5', name: 'Ananya Mishra', roll: '10A022', online: false, initials: 'AM' },
  { id: '6', name: 'Siddharth Mehta', roll: '10A031', online: false, initials: 'SM' },
];

const PARENTS = [
  { id: '1', name: 'Mr. Rajesh Sharma', roll: 'Parent of Aarav', online: true, initials: 'RS' },
  { id: '2', name: 'Mrs. Priya Patel', roll: 'Parent of Ishani', online: false, initials: 'PP' },
  { id: '3', name: 'Mr. Suresh Kapoor', roll: 'Parent of Vikram', online: false, initials: 'SK' },
  { id: '4', name: 'Mrs. Sunita Das', roll: 'Parent of Rohan', online: true, initials: 'SD' },
  { id: '5', name: 'Mr. Anil Mishra', roll: 'Parent of Ananya', online: false, initials: 'AM' },
  { id: '6', name: 'Mrs. Kavita Mehta', roll: 'Parent of Siddharth', online: false, initials: 'KM' },
];

const COLORS = {
  primary: '#1a2e5e',
  primaryLight: '#2d4a8a',
  accent: '#3b5fc0',
  bg: '#f4f6fb',
  card: '#ffffff',
  border: '#e0e6f0',
  text: '#1a2e5e',
  textMuted: '#7a8bb0',
  online: '#22c55e',
  avatarBg: '#dce6f5',
  avatarText: '#2d4a8a',
  tabActive: '#1a2e5e',
  tabInactive: '#f4f6fb',
  tabBorder: '#1a2e5e',
  inputBg: '#ffffff',
  shadow: 'rgba(26,46,94,0.10)',
};

export default function Messeagebatch() {
  const [activeTab, setActiveTab] = useState('Students');
  const [selectedBatch, setSelectedBatch] = useState(BATCHES[0]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [message, setMessage] = useState('');
  const data = activeTab === 'Students' ? STUDENTS : PARENTS;

  const numColumns = isTablet ? 3 : 2;

  const Avatar = ({ item }) => (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarText}>{item.initials}</Text>
      {item.online && <View style={styles.onlineDot} />}
    </View>
  );

  const PersonCard = ({ item }) => (
    <View style={[styles.card, { width: isTablet ? '31%' : '47%' }]}>
      <Avatar item={item} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardRoll}>{item.roll}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={10}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Batch Management</Text>
          {/* Batch Selector */}
          <TouchableOpacity
            style={styles.batchSelector}
            activeOpacity={0.8}
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={styles.batchSelectorText} numberOfLines={1}>{selectedBatch}</Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* Batch Dropdown Modal */}
        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdownMenu}>
              {BATCHES.map((batch) => (
                <TouchableOpacity
                  key={batch}
                  style={[
                    styles.dropdownItem,
                    selectedBatch === batch && styles.dropdownItemActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedBatch(batch);
                    setDropdownVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedBatch === batch && styles.dropdownItemTextActive,
                    ]}
                  >
                    {batch}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['Students', 'Parents'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                activeTab === tab && styles.tabBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === tab && styles.tabBtnTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Count Row */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing {data.length} of {data.length * 4} {activeTab.toLowerCase()}
          </Text>
        </View>

        {/* Grid */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PersonCard item={item} />}
        />

        {/* Bottom Message Bar */}
        <View style={styles.messageBar}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageTo}>Send Message to {selectedBatch}</Text>
            <Text style={styles.messageHint}>All {activeTab.toLowerCase()} in this batch will receive this message</Text>
          </View>
          <View style={styles.messageInputRow}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              placeholderTextColor={COLORS.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} activeOpacity={0.8}>
              <Text style={styles.sendIcon}>▶</Text>
              <Text style={styles.sendBtnText}>Send to Batch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  backArrow: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: isTablet ? 20 : 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  batchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
    maxWidth: isTablet ? 220 : 160,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  batchSelectorText: {
    color: '#fff',
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  chevron: {
    color: '#fff',
    fontSize: 13,
  },

  // Dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 70,
    paddingRight: 16,
  },
  dropdownMenu: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownItem: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 8,
    marginHorizontal: 6,
    marginVertical: 2,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.bg,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 0,
  },
  tabBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.tabBorder,
    backgroundColor: COLORS.tabInactive,
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: COLORS.tabActive,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tabBtnTextActive: {
    color: '#fff',
  },

  // Count
  countRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Grid
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.avatarText,
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: isTablet ? 14 : 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardRoll: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Message Bar
  messageBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 14,
  },
  messageHeader: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isTablet ? 'center' : 'flex-start',
    marginBottom: 8,
    gap: 2,
  },
  messageTo: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  messageHint: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  messageInputRow: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 10,
    alignItems: isTablet ? 'flex-end' : 'stretch',
  },
  messageInput: {
    flex: isTablet ? 1 : undefined,
    height: isTablet ? 52 : 70,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 13,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    alignSelf: isTablet ? 'auto' : 'flex-end',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 13,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});