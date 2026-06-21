import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

const SetupCompleteScreen = ({ navigation }) => {
  const { homeName, assistantName, location, rooms } = useApp();

  // ── Summary items (dynamic from context) ──────────────────────────────────
  const SUMMARY_ITEMS = [
    { id: 'home',      label: 'HOME NAME',        value: homeName || "Your Home",         icon: 'home-outline' },
    { id: 'assistant', label: 'SMART ASSISTANT',   value: assistantName || 'Homiee AI',     icon: 'chatbubble-ellipses-outline' },
    { id: 'location',  label: 'LOCATION / ROOMS',  value: rooms.length > 0 ? rooms.map(r => r.name).join(', ') : (location || 'Not set'), icon: 'location-outline' },
    { id: 'topology',  label: 'TOPOLOGY',          value: rooms.length > 0 ? [...new Set(rooms.flatMap(r => r.devices?.map(d => d.name) || []))].join(' · ') || 'No devices' : 'No devices', icon: 'git-network-outline' },
    { id: 'build',     label: 'CUSTOM BUILD',      value: 'Voice + Face ID + Hand Gestures + SOS', icon: 'construct-outline' },
  ];

  const fadeAnim      = useRef(new Animated.Value(0)).current;
  const slideAnim     = useRef(new Animated.Value(30)).current;
  const checkScale    = useRef(new Animated.Value(0)).current;
  const cardAnims     = useRef(SUMMARY_ITEMS.map(() => new Animated.Value(0))).current;
  const bottomFade    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Title entrance
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

    // Check icon bounce
    Animated.spring(checkScale, {
      toValue: 1, friction: 4, tension: 50, delay: 300,
      useNativeDriver: true,
    }).start();

    // Stagger summary cards
    cardAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1, duration: 450, delay: 500 + i * 120,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }).start();
    });

    // Bottom buttons
    Animated.timing(bottomFade, {
      toValue: 1, duration: 500, delay: 800 + SUMMARY_ITEMS.length * 120,
      easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => navigation.replace('Home');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 56 }} />
        <Text style={styles.brandTitle}>H O M I E E</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success header */}
        <Animated.View
          style={[
            styles.successArea,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Animated.View style={[styles.checkWrap, { transform: [{ scale: checkScale }] }]}>
            <Ionicons name="checkmark" size={36} color="#EDE8DF" />
          </Animated.View>

          <Text style={styles.pageTitle}>Setup Complete</Text>
          <Text style={styles.pageSubtitle}>
            Your smart home is ready. Here's a summary of your configuration.
          </Text>
        </Animated.View>

        {/* Summary cards */}
        <View style={styles.summaryList}>
          {SUMMARY_ITEMS.map((item, i) => (
            <Animated.View
              key={item.id}
              style={[
                styles.summaryCard,
                {
                  opacity: cardAnims[i],
                  transform: [{
                    translateY: cardAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={[styles.summaryIconWrap, { backgroundColor: item.accent + '14' }]}>
                <Ionicons name={item.icon} size={20} color={item.accent} />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="rgba(58,90,120,0.5)" />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <Animated.View style={[styles.bottom, { opacity: bottomFade }]}>
        <TouchableOpacity onPress={handleContinue} style={styles.ctaButton} activeOpacity={0.85}>
          <Text style={styles.ctaText}>GO TO DASHBOARD</Text>
          <Ionicons name="arrow-forward-outline" size={18} color="#EDE8DF" style={styles.ctaIconRight} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EDE8DF',
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  brandTitle: {
    flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '500',
    color: '#3C3C3C', letterSpacing: 6, fontFamily: SERIF,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },

  // Success area
  successArea: {
    alignItems: 'center',
    marginBottom: 36,
  },
  checkWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#3A5A78',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#3A5A78', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  pageTitle: {
    fontSize: 32, fontWeight: '400', color: '#2C2C2C',
    fontFamily: SERIF, lineHeight: 42, marginBottom: 12,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 15, color: 'rgba(44,44,44,0.5)',
    fontFamily: SERIF, lineHeight: 24, textAlign: 'center',
    paddingHorizontal: 12,
  },

  // Summary cards
  summaryList: {
    gap: 10,
  },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.08)',
  },
  summaryIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(44,44,44,0.4)',
    letterSpacing: 1.5, fontFamily: SERIF, marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15, color: '#2C2C2C', fontFamily: SERIF, fontWeight: '500',
    lineHeight: 20,
  },

  // Bottom
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 8,
  },
  ctaButton: {
    width: '100%', height: 56, backgroundColor: '#2C2C2C',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 4,
    shadowColor: '#2C2C2C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 6,
  },
  ctaIconRight: { marginLeft: 8 },
  ctaText: {
    fontSize: 14, fontWeight: '700', color: '#EDE8DF', letterSpacing: 1.5,
  },
});

export default SetupCompleteScreen;
