import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

// Smart home taglines that cycle
const taglines = [
  'Control your home\nwith a single touch.',
  'Stay safe with\ninstant fall detection.',
  'Gesture-powered\nlight control.',
  'Intelligent living,\npeaceful mind.',
  'Every device works\nin harmony.',
];

const SplashScreen = ({ navigation }) => {
  const app = useApp();
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);

  useEffect(() => {
    if (app.isAuthenticated || app.authToken) {
      navigation.replace('Home');
    }
  }, [app.isAuthenticated, app.authToken, navigation]);

  // Title "HOMIEE"
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;

  // Big tagline text
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(24)).current;

  // "Let us show you around" + arrow
  const showAroundOpacity = useRef(new Animated.Value(0)).current;

  // Arrow bounce
  const arrowTranslateX = useRef(new Animated.Value(0)).current;

  // Button
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(30)).current;

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // ─── Phase 1: "HOMIEE" title fades in ───
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 1200,
        delay: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // ─── Phase 2: "Let us show you around" + arrow ───
    Animated.timing(showAroundOpacity, {
      toValue: 1,
      duration: 1000,
      delay: 1400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Arrow gentle bounce right
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowTranslateX, {
          toValue: 8,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arrowTranslateX, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ─── Phase 3: Button slides up ───
    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(buttonTranslateY, {
        toValue: 0,
        friction: 6,
        tension: 40,
        delay: 1800,
        useNativeDriver: true,
      }),
    ]).start();

    // ─── Phase 4: Taglines cycle ───
    const taglineTimer = setTimeout(() => {
      if (mounted.current) startTaglineCycle();
    }, 1600);

    return () => {
      mounted.current = false;
      clearTimeout(taglineTimer);
    };
  }, []);

  const startTaglineCycle = () => {
    const animateText = () => {
      if (!mounted.current) return;
      taglineTranslateY.setValue(24);

      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          if (!mounted.current) return;
          Animated.parallel([
            Animated.timing(taglineOpacity, {
              toValue: 0,
              duration: 500,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(taglineTranslateY, {
              toValue: -16,
              duration: 500,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (!mounted.current) return;
            setCurrentTaglineIndex((prev) => (prev + 1) % taglines.length);
            animateText();
          });
        }, 3000);
      });
    };
    animateText();
  };

  const handleStart = () => {
    navigation.replace('Loading');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* ── Content centered vertically ── */}
      <View style={styles.contentArea}>
        {/* Spaced-out "HOMIEE" title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <Text style={styles.brandTitle}>H O M I E E</Text>
        </Animated.View>

        {/* Cycling taglines — big serif text */}
        <View style={styles.taglineArea}>
          <Animated.Text
            style={[
              styles.taglineText,
              {
                opacity: taglineOpacity,
                transform: [{ translateY: taglineTranslateY }],
              },
            ]}
          >
            {taglines[currentTaglineIndex]}
          </Animated.Text>
        </View>

        {/* "Let us show you around." + arrow */}
        <Animated.View
          style={[styles.showAroundRow, { opacity: showAroundOpacity }]}
        >
          <Text style={styles.showAroundText}>Let us show you around.</Text>
          <Animated.View
            style={{ transform: [{ translateX: arrowTranslateX }] }}
          >
            <Ionicons
              name="arrow-forward"
              size={22}
              color="#3C3C3C"
              style={{ marginLeft: 8 }}
            />
          </Animated.View>
        </Animated.View>
      </View>

      {/* ── Bottom: Button ── */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleStart}
          style={styles.ctaButton}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>Start Your Journey</Text>
          <Ionicons name="arrow-forward" size={18} color="#EDE8DF" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE8DF',
  },

  // ── Content ──
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },

  // ── Brand title — spaced letters like Magnolia ──
  brandTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#3C3C3C',
    letterSpacing: 8,
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web'
      ? '"Georgia", "Times New Roman", serif'
      : Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // ── Tagline — large serif like Magnolia ──
  taglineArea: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  taglineText: {
    fontSize: 36,
    lineHeight: 48,
    fontWeight: '400',
    color: '#2C2C2C',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web'
      ? '"Georgia", "Times New Roman", serif'
      : Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // ── "Let us show you around" ──
  showAroundRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showAroundText: {
    fontSize: 17,
    color: '#5C5C5C',
    fontWeight: '400',
    fontFamily: Platform.OS === 'web'
      ? '"Georgia", "Times New Roman", serif'
      : Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // ── Bottom button ──
  bottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 50 : 34,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    height: 58,
    borderRadius: 30,
    backgroundColor: '#2C2C2C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#EDE8DF',
    letterSpacing: 0.3,
  },
});

export default SplashScreen;
