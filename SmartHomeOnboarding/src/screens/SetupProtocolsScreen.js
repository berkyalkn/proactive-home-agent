import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Easing,
  Switch,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { securityService } from '../services/securityService';
import { useApp } from '../context/AppContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

// ── Data loaded from API ──────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// Reusable Dropdown Selector Component
// ═══════════════════════════════════════════════════════════════════════════
const DropdownSelector = ({ label, icon, placeholder, items, selectedId, onSelect, renderItem }) => {
  const [open, setOpen] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const selectedItem = items.find((i) => i.id === selectedId);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(250, 'easeInEaseOut', 'opacity')
    );
    setOpen((prev) => {
      Animated.timing(chevronAnim, {
        toValue: prev ? 0 : 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
      return !prev;
    });
  }, []);

  const handleSelect = useCallback((id) => {
    onSelect(id);
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
    setOpen(false);
    Animated.timing(chevronAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [onSelect]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.dropdownWrap}>
      {/* Selector button */}
      <TouchableOpacity
        onPress={toggle}
        style={[styles.dropdownTrigger, open && styles.dropdownTriggerOpen]}
        activeOpacity={0.75}
      >
        <View style={styles.dropdownTriggerLeft}>
          <Ionicons name={icon} size={18} color={selectedItem ? '#2C2C2C' : 'rgba(44,44,44,0.3)'} />
          <Text
            style={[
              styles.dropdownTriggerText,
              selectedItem && styles.dropdownTriggerTextSelected,
            ]}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Ionicons name="chevron-down" size={18} color="rgba(44,44,44,0.35)" />
        </Animated.View>
      </TouchableOpacity>

      {/* Dropdown list */}
      {open && (
        <View style={styles.dropdownList}>
          {items.map((item, index) => {
            const isSelected = selectedId === item.id;
            return renderItem
              ? renderItem(item, isSelected, () => handleSelect(item.id), index === items.length - 1)
              : (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.dropdownItem,
                    isSelected && styles.dropdownItemSelected,
                    index === items.length - 1 && styles.dropdownItemLast,
                  ]}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownItemLeft}>
                    <View style={[styles.dropdownItemIcon, isSelected && styles.dropdownItemIconSelected]}>
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isSelected ? '#EDE8DF' : 'rgba(44,44,44,0.4)'}
                      />
                    </View>
                    <Text style={[styles.dropdownItemLabel, isSelected && styles.dropdownItemLabelSelected]}>
                      {item.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#2C2C2C" />
                  )}
                </TouchableOpacity>
              );
          })}
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════════════════════════
const SetupProtocolsScreen = ({ navigation }) => {
  const app = useApp();
  const [sosTriggers, setSosTriggers] = useState([]);
  const [sosCancels, setSosCancels] = useState([]);
  const [alertColors, setAlertColors] = useState([]);
  const [durationOptions, setDurationOptions] = useState([]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [contactName, setContactName]           = useState('');
  const [phoneNumber, setPhoneNumber]           = useState('');
  const [selectedTrigger, setSelectedTrigger]   = useState(null);
  const [selectedCancel, setSelectedCancel]     = useState(null);
  const [selectedColor, setSelectedColor]       = useState('red');
  const [selectedDuration, setSelectedDuration] = useState('10 sec');

  // Smart Sensors
  const [fallDetection, setFallDetection] = useState(false);

  // Notification methods
  const [sendSms, setSendSms]             = useState(false);
  const [voiceCall, setVoiceCall]         = useState(false);
  const [telegramPush, setTelegramPush]   = useState(false);

  // AI voice announcement
  const [announcement, setAnnouncement] = useState(
    'Intruder detected! The authorities have been notified.'
  );

  // ── Animations ────────────────────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, delay: 100,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600, delay: 100,
        easing: Easing.out(Easing.back(1.05)), useNativeDriver: true,
      }),
    ]).start();

    const loadConfig = async () => {
      const [triggers, cancels, colors, durations] = await Promise.all([
        securityService.getSOSTriggers(),
        securityService.getSOSCancels(),
        securityService.getAlertColors(),
        securityService.getDurations(),
      ]);
      if (triggers.success) setSosTriggers(triggers.data);
      if (cancels.success) setSosCancels(cancels.data);
      if (colors.success) setAlertColors(colors.data);
      if (durations.success) setDurationOptions(durations.data);
    };
    loadConfig();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = () => {
    app.setSosConfig({
      contactName, phoneNumber,
      sosTrigger: selectedTrigger,
      sosCancel: selectedCancel,
      alertColor: selectedColor,
      duration: selectedDuration,
      fallDetection, sendSms,
      makeVoiceCall: voiceCall,
      sendTelegram: telegramPush,
      voiceAnnouncement: announcement,
    });
    navigation.replace('HandControl');
  };
  const handleSkip = () => navigation.replace('HandControl');
  const handleBack = () => navigation.goBack();

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderSectionTitle = (icon, title) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color="#C2713A" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderToggleRow = (label, icon, value, setter) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <Ionicons name={icon} size={18} color="rgba(44,44,44,0.5)" />
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={setter}
        trackColor={{ false: 'rgba(44,44,44,0.14)', true: 'rgba(194,113,58,0.45)' }}
        thumbColor={value ? '#C2713A' : 'rgba(44,44,44,0.25)'}
        ios_backgroundColor="rgba(44,44,44,0.14)"
      />
    </View>
  );

  // Custom render for color dropdown items
  const renderColorItem = (item, isSelected, onPress, isLast) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.dropdownItem,
        isSelected && styles.dropdownItemSelected,
        isLast && styles.dropdownItemLast,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.dropdownItemLeft}>
        <View style={[styles.colorDot, { backgroundColor: item.hex }, item.id === 'white' && styles.colorDotWhite]} />
        <Text style={[styles.dropdownItemLabel, isSelected && styles.dropdownItemLabelSelected]}>
          {item.label}
        </Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={20} color="#2C2C2C" />
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>H O M I E E</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.headerBtn} activeOpacity={0.6}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Page header */}
          <Text style={styles.pageTitle}>Setup Protocols</Text>
          <Text style={styles.pageSubtitle}>
            Configure who to contact and how in an emergency.
          </Text>

          {/* ═════════════ CONTACT INFO ═════════════ */}
          {renderSectionTitle('person-outline', 'Emergency Contact')}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CONTACT NAME</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color="rgba(44,44,44,0.3)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={contactName}
                onChangeText={setContactName}
                placeholder="e.g. John Doe"
                placeholderTextColor="rgba(44,44,44,0.3)"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            <View style={styles.fieldLine} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={18} color="rgba(44,44,44,0.3)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="rgba(44,44,44,0.3)"
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
            <View style={styles.fieldLine} />
          </View>

          {/* ═════════════ SOS TRIGGER ═════════════ */}
          {renderSectionTitle('alert-circle-outline', 'SOS Trigger')}
          <DropdownSelector
            label="SOS Trigger"
            icon="hand-left-outline"
            placeholder="Select a gesture..."
            items={sosTriggers}
            selectedId={selectedTrigger}
            onSelect={setSelectedTrigger}
          />

          {/* ═════════════ SOS CANCEL ═════════════ */}
          {renderSectionTitle('close-circle-outline', 'SOS Cancel')}
          <DropdownSelector
            label="SOS Cancel"
            icon="hand-right-outline"
            placeholder="Select a gesture..."
            items={sosCancels}
            selectedId={selectedCancel}
            onSelect={setSelectedCancel}
          />

          {/* ═════════════ ALERT COLOR ═════════════ */}
          {renderSectionTitle('color-palette-outline', 'Alert Color')}
          <DropdownSelector
            label="Alert Color"
            icon="color-fill-outline"
            placeholder="Select a color..."
            items={alertColors}
            selectedId={selectedColor}
            onSelect={setSelectedColor}
            renderItem={renderColorItem}
          />

          {/* ═════════════ DURATION ═════════════ */}
          {renderSectionTitle('timer-outline', 'Duration')}
          <View style={styles.durationRow}>
            {durationOptions.map((d) => {
              const active = selectedDuration === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.durationPill, active && styles.durationPillActive]}
                  onPress={() => setSelectedDuration(d)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.durationText, active && styles.durationTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ═════════════ DIVIDER ═════════════ */}
          <View style={styles.divider} />

          {/* ═════════════ SMART SENSORS ═════════════ */}
          {renderSectionTitle('hardware-chip-outline', 'Smart Sensors')}
          {renderToggleRow('Enable AI Fall Detection', 'body-outline', fallDetection, setFallDetection)}

          {/* ═════════════ DIVIDER ═════════════ */}
          <View style={styles.divider} />

          {/* ═════════════ NOTIFICATION METHODS ═════════════ */}
          {renderSectionTitle('notifications-outline', 'Notification Methods')}
          {renderToggleRow('Send SMS Alert', 'chatbubble-outline', sendSms, setSendSms)}
          {renderToggleRow('Make Voice Call (Robot TTS)', 'call-outline', voiceCall, setVoiceCall)}
          {renderToggleRow('Send Telegram Push', 'paper-plane-outline', telegramPush, setTelegramPush)}

          {/* ═════════════ DIVIDER ═════════════ */}
          <View style={styles.divider} />

          {/* ═════════════ AI VOICE ANNOUNCEMENT ═════════════ */}
          {renderSectionTitle('megaphone-outline', 'AI Voice Announcement')}
          <Text style={styles.announcementHint}>
            This message will be spoken aloud by the home system when an emergency is triggered.
          </Text>
          <View style={styles.announcementCard}>
            <View style={styles.announcementBadge}>
              <Ionicons name="volume-high-outline" size={11} color="rgba(44,44,44,0.45)" />
              <Text style={styles.announcementBadgeText}>CUSTOM MESSAGE</Text>
            </View>
            <TextInput
              style={styles.announcementInput}
              value={announcement}
              onChangeText={setAnnouncement}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="rgba(44,44,44,0.3)"
            />
          </View>

          {/* ═════════════ BOTTOM BUTTONS ═════════════ */}
          <TouchableOpacity onPress={handleSave} style={styles.ctaButton} activeOpacity={0.85}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#EDE8DF" style={styles.ctaIcon} />
            <Text style={styles.ctaText}>SAVE & CONTINUE</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipRow} activeOpacity={0.6}>
            <Text style={styles.skipRowText}>Skip</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDE8DF' },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  headerBtn: { width: 56, height: 36, alignItems: 'center', justifyContent: 'center' },
  brandTitle: {
    flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '500',
    color: '#3C3C3C', letterSpacing: 6, fontFamily: SERIF,
  },
  skipText: { fontSize: 13, color: 'rgba(44,44,44,0.4)', fontFamily: SERIF },

  // ── Scroll ──────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 },

  // ── Page title ──────────────────────────────────────────────────────────
  pageTitle: {
    fontSize: 30, fontWeight: '400', color: '#2C2C2C',
    fontFamily: SERIF, marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15, color: 'rgba(44,44,44,0.45)', fontFamily: SERIF,
    lineHeight: 22, marginBottom: 32,
  },

  // ── Section headers ─────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 14, marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '500', color: '#2C2C2C', fontFamily: SERIF,
  },

  // ── Text fields ─────────────────────────────────────────────────────────
  fieldGroup: { marginBottom: 24 },
  fieldLabel: {
    fontSize: 11, fontWeight: '600', color: '#3C3C3C',
    letterSpacing: 1.2, marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', paddingBottom: 10,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 17, color: '#2C2C2C', fontFamily: SERIF, padding: 0 },
  fieldLine: { height: 1, backgroundColor: 'rgba(44,44,44,0.15)' },

  // ── Dropdown selector ───────────────────────────────────────────────────
  dropdownWrap: {
    marginBottom: 24,
  },
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: 'rgba(44,44,44,0.12)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dropdownTriggerOpen: {
    borderColor: '#2C2C2C',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  dropdownTriggerText: {
    fontSize: 15, color: 'rgba(44,44,44,0.35)', fontFamily: SERIF,
  },
  dropdownTriggerTextSelected: {
    color: '#2C2C2C', fontWeight: '500',
  },
  dropdownList: {
    borderWidth: 1.5, borderColor: '#2C2C2C',
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(44,44,44,0.06)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(44,44,44,0.06)',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  dropdownItemIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(44,44,44,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  dropdownItemIconSelected: {
    backgroundColor: '#2C2C2C',
  },
  dropdownItemLabel: {
    fontSize: 15, color: 'rgba(44,44,44,0.6)', fontFamily: SERIF,
  },
  dropdownItemLabelSelected: {
    color: '#2C2C2C', fontWeight: '600',
  },

  // ── Color dot in dropdown ───────────────────────────────────────────────
  colorDot: {
    width: 22, height: 22, borderRadius: 11,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 2, elevation: 2,
  },
  colorDotWhite: {
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.15)',
  },

  // ── Duration selector ───────────────────────────────────────────────────
  durationRow: {
    flexDirection: 'row', gap: 10, marginBottom: 28, marginTop: 4,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10, borderWidth: 1.5,
    borderColor: 'rgba(44,44,44,0.12)',
    backgroundColor: 'rgba(44,44,44,0.03)',
    alignItems: 'center', justifyContent: 'center',
  },
  durationPillActive: {
    borderColor: '#2C2C2C',
    backgroundColor: '#2C2C2C',
  },
  durationText: {
    fontSize: 14, fontWeight: '500',
    color: 'rgba(44,44,44,0.45)', fontFamily: SERIF,
  },
  durationTextActive: {
    color: '#EDE8DF',
  },

  // ── Divider ─────────────────────────────────────────────────────────────
  divider: {
    height: 1, backgroundColor: 'rgba(44,44,44,0.10)',
    marginBottom: 24,
  },

  // ── Toggle rows ─────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(44,44,44,0.08)',
  },
  toggleLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1,
  },
  toggleLabel: {
    fontSize: 15, color: '#2C2C2C', fontFamily: SERIF,
  },

  // ── Announcement ────────────────────────────────────────────────────────
  announcementHint: {
    fontSize: 13, color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF, lineHeight: 20, marginBottom: 14, marginTop: -8,
  },
  announcementCard: {
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.14)',
    borderRadius: 10, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.38)',
    marginBottom: 36,
  },
  announcementBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.18)',
    borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 14, backgroundColor: 'rgba(44,44,44,0.04)',
  },
  announcementBadgeText: {
    fontSize: 10, fontWeight: '700',
    color: 'rgba(44,44,44,0.45)', letterSpacing: 2, fontFamily: SERIF,
  },
  announcementInput: {
    fontSize: 16, color: '#2C2C2C', fontFamily: SERIF,
    lineHeight: 26, fontStyle: 'italic', padding: 0,
    minHeight: 78,
  },

  // ── CTA ─────────────────────────────────────────────────────────────────
  ctaButton: {
    width: '100%', height: 56, backgroundColor: '#2C2C2C',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 4,
    shadowColor: '#2C2C2C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 6, marginBottom: 12,
  },
  ctaIcon: { marginRight: 8 },
  ctaText: {
    fontSize: 14, fontWeight: '700', color: '#EDE8DF', letterSpacing: 1.5,
  },
  skipRow: { alignItems: 'center', paddingVertical: 8 },
  skipRowText: {
    fontSize: 13, color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF, textDecorationLine: 'underline',
  },
});

export default SetupProtocolsScreen;
