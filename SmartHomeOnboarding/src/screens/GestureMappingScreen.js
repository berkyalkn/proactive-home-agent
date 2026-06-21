import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Easing,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gestureService } from '../services/gestureService';
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
// Inline Dropdown for Gesture Selection
// ═══════════════════════════════════════════════════════════════════════════
const GestureDropdown = ({ actionLabel, selectedGestureId, onSelect, usedGestures, actionId, gestures }) => {
  const [open, setOpen] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const selectedGesture = gestures.find((g) => g.id === selectedGestureId);

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

  const handleSelect = useCallback((gestureId) => {
    onSelect(gestureId);
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
    <View style={styles.gestureDropWrap}>
      {/* Action label */}
      <Text style={styles.actionLabel}>{actionLabel}</Text>

      {/* Selector trigger */}
      <TouchableOpacity
        onPress={toggle}
        style={[styles.gestureTrigger, open && styles.gestureTriggerOpen]}
        activeOpacity={0.75}
      >
        <View style={styles.gestureTriggerLeft}>
          <Ionicons
            name={selectedGesture ? selectedGesture.icon : 'hand-left-outline'}
            size={16}
            color={selectedGesture ? '#2C2C2C' : 'rgba(44,44,44,0.3)'}
          />
          <Text style={[
            styles.gestureTriggerText,
            selectedGesture && styles.gestureTriggerTextSelected,
          ]}>
            {selectedGesture ? selectedGesture.label : 'Select gesture...'}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Ionicons name="chevron-down" size={16} color="rgba(44,44,44,0.3)" />
        </Animated.View>
      </TouchableOpacity>

      {/* Dropdown list */}
      {open && (
        <View style={styles.gestureList}>
          {gestures.map((gesture, index) => {
            const isSelected = selectedGestureId === gesture.id;
            const isUsed = usedGestures[gesture.id] && usedGestures[gesture.id] !== actionId;
            return (
              <TouchableOpacity
                key={gesture.id}
                style={[
                  styles.gestureItem,
                  isSelected && styles.gestureItemSelected,
                  isUsed && styles.gestureItemUsed,
                  index === gestures.length - 1 && styles.gestureItemLast,
                ]}
                onPress={() => !isUsed && handleSelect(gesture.id)}
                activeOpacity={isUsed ? 1 : 0.7}
              >
                <View style={styles.gestureItemLeft}>
                  <View style={[
                    styles.gestureItemIcon,
                    isSelected && styles.gestureItemIconSelected,
                    isUsed && styles.gestureItemIconUsed,
                  ]}>
                    <Ionicons
                      name={gesture.icon}
                      size={16}
                      color={isSelected ? '#EDE8DF' : isUsed ? 'rgba(44,44,44,0.2)' : 'rgba(44,44,44,0.4)'}
                    />
                  </View>
                  <View>
                    <Text style={[
                      styles.gestureItemLabel,
                      isSelected && styles.gestureItemLabelSelected,
                      isUsed && styles.gestureItemLabelUsed,
                    ]}>
                      {gesture.label}
                    </Text>
                    {isUsed && (
                      <Text style={styles.gestureItemUsedHint}>Already assigned</Text>
                    )}
                  </View>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color="#2C2C2C" />
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
const GestureMappingScreen = ({ navigation }) => {
  const app = useApp();
  const [gestures, setGestures] = useState([]);
  const [deviceConfigs, setDeviceConfigs] = useState({});
  const [confirmedDevices, setConfirmedDevices] = useState([]);
  const [gestureMappings, setGestureMappings] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const [gestRes, configRes, confirmedRes] = await Promise.all([
        gestureService.getAvailableGestures(),
        gestureService.getDeviceConfigs(),
        gestureService.getConfirmedDevices(),
      ]);
      if (gestRes.success) setGestures(gestRes.data);
      if (configRes.success) setDeviceConfigs(configRes.data);
      if (confirmedRes.success) setConfirmedDevices(confirmedRes.data);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (confirmedDevices.length === 0 || Object.keys(deviceConfigs).length === 0) return;
    const initial = {};
    confirmedDevices.forEach((deviceKey) => {
      const config = deviceConfigs[deviceKey];
      if (config) {
        config.actions.forEach((act) => {
          initial[act.id] = null; // no gesture assigned yet
        });
      }
    });
    setGestureMappings(initial);
  }, [confirmedDevices, deviceConfigs]);

  // Track which gestures are already used (gesture.id → action.id)
  const usedGestures = {};
  Object.entries(gestureMappings).forEach(([actionId, gestureId]) => {
    if (gestureId) {
      usedGestures[gestureId] = actionId;
    }
  });

  const handleGestureSelect = useCallback((actionId, gestureId) => {
    setGestureMappings((prev) => {
      const updated = { ...prev };
      // If this gesture was assigned to another action, unassign it
      Object.keys(updated).forEach((key) => {
        if (updated[key] === gestureId) {
          updated[key] = null;
        }
      });
      updated[actionId] = gestureId;
      return updated;
    });
  }, []);

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
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = () => {
    app.setGestureMappings(gestureMappings);
    navigation.replace('AlmostReady');
  };
  const handleSkip = () => navigation.replace('AlmostReady');
  const handleBack = () => navigation.goBack();

  // Count assigned gestures
  const assignedCount = Object.values(gestureMappings).filter(Boolean).length;
  const totalCount    = Object.keys(gestureMappings).length;

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
          <Text style={styles.pageTitle}>Gesture Mapping</Text>
          <Text style={styles.pageSubtitle}>
            Assign hand gestures to control each device action.
          </Text>

          {/* Progress indicator */}
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: totalCount > 0 ? `${(assignedCount / totalCount) * 100}%` : '0%' }]} />
            </View>
            <Text style={styles.progressText}>{assignedCount} / {totalCount}</Text>
          </View>

          {/* ── Device sections ── */}
          {confirmedDevices.map((deviceKey) => {
            const config = deviceConfigs[deviceKey];
            if (!config) return null;

            return (
              <View key={deviceKey} style={styles.deviceSection}>
                {/* Device header */}
                <View style={styles.deviceHeader}>
                  <View style={[styles.deviceIconWrap, { backgroundColor: config.accent + '18' }]}>
                    <Ionicons name={config.icon} size={20} color={config.accent} />
                  </View>
                  <Text style={styles.deviceTitle}>{config.label}</Text>
                </View>

                {/* Action → Gesture mappings */}
                {config.actions.map((action) => (
                  <GestureDropdown
                    key={action.id}
                    actionId={action.id}
                    actionLabel={action.label}
                    selectedGestureId={gestureMappings[action.id]}
                    onSelect={(gestureId) => handleGestureSelect(action.id, gestureId)}
                    usedGestures={usedGestures}
                    gestures={gestures}
                  />
                ))}
              </View>
            );
          })}

          {/* ═════════════ BOTTOM BUTTONS ═════════════ */}
          <TouchableOpacity onPress={handleSave} style={styles.ctaButton} activeOpacity={0.85}>
            <Ionicons name="checkmark-done-outline" size={18} color="#EDE8DF" style={styles.ctaIcon} />
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
    lineHeight: 22, marginBottom: 20,
  },

  // ── Progress ────────────────────────────────────────────────────────────
  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 28,
  },
  progressBar: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(44,44,44,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: '#3A5A78',
  },
  progressText: {
    fontSize: 12, color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF, letterSpacing: 0.5,
  },

  // ── Device section ──────────────────────────────────────────────────────
  deviceSection: {
    marginBottom: 32,
    borderTopWidth: 1, borderTopColor: 'rgba(44,44,44,0.08)',
    paddingTop: 20,
  },
  deviceHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 18,
  },
  deviceIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  deviceTitle: {
    fontSize: 18, fontWeight: '500', color: '#2C2C2C', fontFamily: SERIF,
  },

  // ── Gesture dropdown ────────────────────────────────────────────────────
  gestureDropWrap: {
    marginBottom: 16,
  },
  actionLabel: {
    fontSize: 12, fontWeight: '600', color: 'rgba(44,44,44,0.5)',
    letterSpacing: 1, marginBottom: 6, fontFamily: SERIF,
    textTransform: 'uppercase',
  },
  gestureTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: 'rgba(44,44,44,0.12)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gestureTriggerOpen: {
    borderColor: '#2C2C2C',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  gestureTriggerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  gestureTriggerText: {
    fontSize: 14, color: 'rgba(44,44,44,0.35)', fontFamily: SERIF,
  },
  gestureTriggerTextSelected: {
    color: '#2C2C2C', fontWeight: '500',
  },
  gestureList: {
    borderWidth: 1.5, borderColor: '#2C2C2C',
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  gestureItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(44,44,44,0.06)',
  },
  gestureItemSelected: {
    backgroundColor: 'rgba(44,44,44,0.06)',
  },
  gestureItemUsed: {
    opacity: 0.45,
  },
  gestureItemLast: {
    borderBottomWidth: 0,
  },
  gestureItemLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  gestureItemIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(44,44,44,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  gestureItemIconSelected: {
    backgroundColor: '#2C2C2C',
  },
  gestureItemIconUsed: {
    backgroundColor: 'rgba(44,44,44,0.04)',
  },
  gestureItemLabel: {
    fontSize: 14, color: 'rgba(44,44,44,0.6)', fontFamily: SERIF,
  },
  gestureItemLabelSelected: {
    color: '#2C2C2C', fontWeight: '600',
  },
  gestureItemLabelUsed: {
    color: 'rgba(44,44,44,0.3)',
  },
  gestureItemUsedHint: {
    fontSize: 10, color: 'rgba(44,44,44,0.3)',
    fontFamily: SERIF, marginTop: 1,
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

export default GestureMappingScreen;
