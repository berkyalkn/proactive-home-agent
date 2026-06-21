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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

const PersonalizeAssistantScreen = ({ navigation }) => {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(36)).current;
  const iconScale1 = useRef(new Animated.Value(0)).current;
  const iconScale2 = useRef(new Animated.Value(0)).current;

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
      Animated.spring(iconScale1, {
        toValue: 1, friction: 6, tension: 60, delay: 300, useNativeDriver: true,
      }),
      Animated.spring(iconScale2, {
        toValue: 1, friction: 6, tension: 60, delay: 440, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStart = () => navigation.navigate('VoiceRecognition');
  const handleSkip  = () => navigation.replace('VoiceRecognition');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>H O M I E E</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.6}>
          <Text style={styles.skipText}>Skip All</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Icons */}
        <View style={styles.iconRow}>
          <Animated.View style={[styles.iconWrap, styles.iconWrapVoice, { transform: [{ scale: iconScale1 }] }]}>
            <Ionicons name="mic-outline" size={36} color="#8B5E3C" />
          </Animated.View>

          <View style={styles.iconDivider} />

          <Animated.View style={[styles.iconWrap, styles.iconWrapFace, { transform: [{ scale: iconScale2 }] }]}>
            <Ionicons name="scan-outline" size={36} color="#3A5A78" />
          </Animated.View>
        </View>

        {/* Title */}
        <Text style={styles.pageTitle}>Personalize Your{'\n'}Assistant</Text>

        {/* Description */}
        <Text style={styles.description}>
          Teach your smart home to recognize your face and voice so it can adapt to your needs and keep your home secure.
        </Text>

        {/* Feature tags */}
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Ionicons name="mic-outline" size={13} color="rgba(44,44,44,0.5)" />
            <Text style={styles.tagText}>Voice Recognition</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="scan-outline" size={13} color="rgba(44,44,44,0.5)" />
            <Text style={styles.tagText}>Face ID</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="shield-checkmark-outline" size={13} color="rgba(44,44,44,0.5)" />
            <Text style={styles.tagText}>Secure</Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom buttons */}
      <Animated.View style={[styles.bottom, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={handleStart} style={styles.ctaButton} activeOpacity={0.85}>
          <Text style={styles.ctaText}>LET'S GET STARTED</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipRow} activeOpacity={0.6}>
          <Text style={styles.skipAllText}>Skip All</Text>
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
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brandTitle: {
    flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '500',
    color: '#3C3C3C', letterSpacing: 6, fontFamily: SERIF,
  },
  skipButton: { alignItems: 'flex-end', paddingVertical: 4 },
  skipText: { fontSize: 13, color: 'rgba(44,44,44,0.4)', fontFamily: SERIF },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
  },

  // Icons
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 44,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  iconWrapVoice: {
    backgroundColor: 'rgba(139,94,60,0.08)',
    borderColor: 'rgba(139,94,60,0.2)',
  },
  iconWrapFace: {
    backgroundColor: 'rgba(58,90,120,0.08)',
    borderColor: 'rgba(58,90,120,0.2)',
  },
  iconDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(44,44,44,0.1)',
    marginHorizontal: 12,
  },

  // Text
  pageTitle: {
    fontSize: 34, fontWeight: '400', color: '#2C2C2C',
    fontFamily: SERIF, lineHeight: 44, marginBottom: 20,
  },
  description: {
    fontSize: 16, color: 'rgba(44,44,44,0.55)',
    fontFamily: SERIF, lineHeight: 26, marginBottom: 32,
  },

  // Tags
  tagRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(44,44,44,0.15)',
    backgroundColor: 'rgba(44,44,44,0.04)',
  },
  tagText: {
    fontSize: 12, color: 'rgba(44,44,44,0.5)',
    fontFamily: SERIF,
  },

  // Bottom
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  ctaButton: {
    width: '100%', height: 56, backgroundColor: '#2C2C2C',
    alignItems: 'center', justifyContent: 'center', borderRadius: 4,
    shadowColor: '#2C2C2C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 6, marginBottom: 12,
  },
  ctaText: {
    fontSize: 14, fontWeight: '700', color: '#EDE8DF', letterSpacing: 1.5,
  },
  skipRow: { alignItems: 'center', paddingVertical: 8 },
  skipAllText: {
    fontSize: 13, color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF, textDecorationLine: 'underline',
  },
});

export default PersonalizeAssistantScreen;
