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

const SecurityProtocolScreen = ({ navigation }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  const tagFade1  = useRef(new Animated.Value(0)).current;
  const tagFade2  = useRef(new Animated.Value(0)).current;
  const tagFade3  = useRef(new Animated.Value(0)).current;

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
      Animated.spring(iconScale, {
        toValue: 1, friction: 5, tension: 55, delay: 280, useNativeDriver: true,
      }),
    ]).start();

    // Stagger the tag pills
    Animated.stagger(120, [
      Animated.timing(tagFade1, { toValue: 1, duration: 400, delay: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(tagFade2, { toValue: 1, duration: 400, delay: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(tagFade3, { toValue: 1, duration: 400, delay: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSetup = () => navigation.navigate('SetupProtocols');
  const handleSkip  = () => navigation.replace('SetupProtocols');
  const handleBack  = () => navigation.goBack();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>H O M I E E</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.headerBtn} activeOpacity={0.6}>
          <Text style={styles.skipText}>Skip All</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Warning icon */}
        <Animated.View
          style={[
            styles.iconWrap,
            { transform: [{ scale: iconScale }] },
          ]}
        >
          <Ionicons name="alert-outline" size={44} color="#C2713A" />
        </Animated.View>

        {/* Title */}
        <Text style={styles.pageTitle}>Security Protocol</Text>

        {/* Description */}
        <Text style={styles.description}>
          Let's configure your Emergency SOS alerts.{'\n'}
          Who should the house contact if you are in danger?
        </Text>

        {/* Feature tags */}
        <View style={styles.tagRow}>
          <Animated.View style={[styles.tag, { opacity: tagFade1 }]}>
            <Ionicons name="call-outline" size={13} color="rgba(44,44,44,0.5)" />
            <Text style={styles.tagText}>Emergency Calls</Text>
          </Animated.View>
          <Animated.View style={[styles.tag, { opacity: tagFade2 }]}>
            <Ionicons name="notifications-outline" size={13} color="rgba(44,44,44,0.5)" />
            <Text style={styles.tagText}>SOS Alerts</Text>
          </Animated.View>
          <Animated.View style={[styles.tag, { opacity: tagFade3 }]}>
            <Ionicons name="shield-checkmark-outline" size={13} color="rgba(44,44,44,0.5)" />
            <Text style={styles.tagText}>Home Safety</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Bottom buttons */}
      <Animated.View style={[styles.bottom, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={handleSetup} style={styles.ctaButton} activeOpacity={0.85}>
          <Ionicons name="shield-outline" size={18} color="#EDE8DF" style={styles.ctaIcon} />
          <Text style={styles.ctaText}>SETUP PROTOCOLS</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipRow} activeOpacity={0.6}>
          <Text style={styles.skipAllText}>Skip</Text>
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
  headerBtn: { width: 56, height: 36, alignItems: 'center', justifyContent: 'center' },
  brandTitle: {
    flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '500',
    color: '#3C3C3C', letterSpacing: 6, fontFamily: SERIF,
  },
  skipText: { fontSize: 13, color: 'rgba(44,44,44,0.4)', fontFamily: SERIF },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
  },

  // Icon
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(194,113,58,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(194,113,58,0.22)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 4,
    shadowColor: '#2C2C2C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 6,
    marginBottom: 12,
  },
  ctaIcon: { marginRight: 8 },
  ctaText: {
    fontSize: 14, fontWeight: '700', color: '#EDE8DF', letterSpacing: 1.5,
  },
  skipRow: { alignItems: 'center', paddingVertical: 8 },
  skipAllText: {
    fontSize: 13, color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF, textDecorationLine: 'underline',
  },
});

export default SecurityProtocolScreen;
