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
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ORBIT_RADIUS = 115;
const FACE_SIZE = 60;
const NUM_FACES = 6;

const faceImages = [
  require('../../assets/face_1.png'),
  require('../../assets/face_2.png'),
  require('../../assets/face_3.png'),
  require('../../assets/face_4.png'),
  require('../../assets/face_5.png'),
  require('../../assets/face_6.png'),
];

// Pre-compute angles (starting from top)
const FACE_ANGLES = [];
for (let i = 0; i < NUM_FACES; i++) {
  FACE_ANGLES.push((i / NUM_FACES) * 2 * Math.PI - Math.PI / 2);
}

// Single face — stays upright via counter-rotation
const FaceCircle = ({ image, angle, index, orbitRotation }) => {
  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterScale = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300 + index * 120),
      Animated.parallel([
        Animated.timing(enterOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(enterScale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const x = Math.cos(angle) * ORBIT_RADIUS;
  const y = Math.sin(angle) * ORBIT_RADIUS;

  const counterRotate = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.facePosition,
        {
          transform: [{ translateX: x }, { translateY: y }],
          opacity: enterOpacity,
        },
      ]}
    >
      <Animated.View
        style={{
          transform: [{ scale: enterScale }, { rotate: counterRotate }],
        }}
      >
        <View style={styles.faceBorder}>
          <Image source={image} style={styles.faceImg} />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const WelcomeScreen = ({ navigation }) => {
  const orbitRotation = useRef(new Animated.Value(0)).current;

  // Center text
  const centerOpacity = useRef(new Animated.Value(0)).current;
  const centerScale = useRef(new Animated.Value(0.7)).current;

  // Bottom
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const bottomTranslateY = useRef(new Animated.Value(30)).current;

  // Word cycling
  const words = ['your home', 'your safety', 'your comfort', 'your family'];
  const [wordIndex, setWordIndex] = useState(0);
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordTranslateY = useRef(new Animated.Value(12)).current;

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Slow orbit
    Animated.loop(
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 35000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Center text
    Animated.parallel([
      Animated.timing(centerOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(centerScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Bottom
    Animated.parallel([
      Animated.timing(bottomOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(bottomTranslateY, {
        toValue: 0,
        duration: 1000,
        delay: 1600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Words
    const wordTimer = setTimeout(() => {
      if (mounted.current) cycleWords();
    }, 2200);

    return () => {
      mounted.current = false;
      clearTimeout(wordTimer);
    };
  }, []);

  const cycleWords = () => {
    const animate = () => {
      if (!mounted.current) return;
      wordTranslateY.setValue(12);
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(wordTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          if (!mounted.current) return;
          Animated.parallel([
            Animated.timing(wordOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(wordTranslateY, { toValue: -10, duration: 400, useNativeDriver: true }),
          ]).start(() => {
            if (!mounted.current) return;
            setWordIndex((prev) => (prev + 1) % words.length);
            animate();
          });
        }, 2500);
      });
    };
    animate();
  };

  const handleContinue = () => {
    navigation.replace('Onboarding');
  };

  const handleBack = () => {
    navigation.replace('Splash');
  };

  const orbitDeg = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* ── Back button ── */}
      <TouchableOpacity
        onPress={handleBack}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color="#5C5C5C" />
      </TouchableOpacity>

      {/* ── Orbit area ── */}
      <View style={styles.orbitSection}>
        <Animated.View
          style={[
            styles.orbitWrapper,
            { transform: [{ rotate: orbitDeg }] },
          ]}
        >
          {faceImages.map((img, i) => (
            <FaceCircle
              key={i}
              image={img}
              angle={FACE_ANGLES[i]}
              index={i}
              orbitRotation={orbitRotation}
            />
          ))}
        </Animated.View>

        {/* Center "Homiee" */}
        <Animated.View
          style={[
            styles.centerArea,
            {
              opacity: centerOpacity,
              transform: [{ scale: centerScale }],
            },
          ]}
        >
          <Text style={styles.centerText}>Homiee</Text>
        </Animated.View>
      </View>

      {/* ── Bottom ── */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            opacity: bottomOpacity,
            transform: [{ translateY: bottomTranslateY }],
          },
        ]}
      >
        <View style={styles.descArea}>
          <Text style={styles.descStatic}>We care about</Text>
          <View style={styles.wordBox}>
            <Animated.Text
              style={[
                styles.descHighlight,
                {
                  opacity: wordOpacity,
                  transform: [{ translateY: wordTranslateY }],
                },
              ]}
            >
              {words[wordIndex]}
            </Animated.Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          style={styles.ctaButton}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By using Homiee, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE8DF',
  },

  // ── Back button ──
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 20,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(44, 44, 44, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Orbit ──
  orbitSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitWrapper: {
    width: ORBIT_RADIUS * 2 + FACE_SIZE,
    height: ORBIT_RADIUS * 2 + FACE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Face ──
  facePosition: {
    position: 'absolute',
    width: FACE_SIZE,
    height: FACE_SIZE,
    marginLeft: -FACE_SIZE / 2,
    marginTop: -FACE_SIZE / 2,
    left: '50%',
    top: '50%',
  },
  faceBorder: {
    width: FACE_SIZE,
    height: FACE_SIZE,
    borderRadius: FACE_SIZE / 2,
    borderWidth: 2.5,
    borderColor: 'rgba(180, 160, 130, 0.5)',
    overflow: 'hidden',
    backgroundColor: '#D4CFC6',
    shadowColor: 'rgba(100, 80, 60, 0.2)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  faceImg: {
    width: '100%',
    height: '100%',
    borderRadius: FACE_SIZE / 2,
  },

  // ── Center ──
  centerArea: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 30,
    fontWeight: '400',
    color: '#2C2C2C',
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'web'
      ? '"Georgia", "Times New Roman", serif'
      : Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // ── Bottom ──
  bottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 50 : 34,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  descArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  descStatic: {
    fontSize: 20,
    fontWeight: '400',
    color: '#8C8C8C',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web'
      ? '"Georgia", "Times New Roman", serif'
      : Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  wordBox: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descHighlight: {
    fontSize: 24,
    fontWeight: '400',
    color: '#2C2C2C',
    fontFamily: Platform.OS === 'web'
      ? '"Georgia", "Times New Roman", serif'
      : Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  ctaButton: {
    width: '100%',
    height: 58,
    borderRadius: 30,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2C2C2C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#EDE8DF',
    letterSpacing: 0.3,
  },
  terms: {
    fontSize: 12,
    color: 'rgba(44, 44, 44, 0.3)',
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web'
      ? '"Georgia", "Times New Roman", serif'
      : Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  termsLink: {
    textDecorationLine: 'underline',
    color: 'rgba(44, 44, 44, 0.5)',
  },
});

export default WelcomeScreen;
