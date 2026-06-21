import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

// ── Checklist steps ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 'personalize', icon: 'home-outline',          label: (name) => `Personalizing ${name || 'your'}'s home` },
  { id: 'privacy',     icon: 'shield-checkmark-outline', label: () => 'Securing your privacy and Face ID' },
  { id: 'sos',         icon: 'alert-circle-outline',    label: () => 'Activating your emergency SOS alerts' },
  { id: 'gestures',    icon: 'hand-left-outline',       label: () => 'Saving your custom hand gestures' },
];

const STEP_DELAY = 1200; // ms between each step completing

const AlmostReadyScreen = ({ navigation, route }) => {
  const { homeName: ctxHomeName } = useApp();
  const homeName = ctxHomeName || 'Alex';

  const [completedSteps, setCompletedSteps] = useState([]);
  const [currentStep, setCurrentStep]       = useState(0);

  // Animations
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(24)).current;
  const titleFade  = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const fadeOut     = useRef(new Animated.Value(1)).current;

  // Per-step fade animations
  const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(titleFade, {
        toValue: 1, duration: 700, delay: 100,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(titleSlide, {
        toValue: 0, duration: 700, delay: 100,
        easing: Easing.out(Easing.back(1.05)), useNativeDriver: true,
      }),
    ]).start();

    // Stagger step items appearing
    STEPS.forEach((_, i) => {
      setTimeout(() => {
        Animated.timing(stepAnims[i], {
          toValue: 1, duration: 400,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }).start();
      }, 400 + i * 200);
    });

    // Simulate steps completing one by one
    STEPS.forEach((step, i) => {
      setTimeout(() => {
        setCurrentStep(i);
        setTimeout(() => {
          setCompletedSteps((prev) => [...prev, step.id]);
        }, STEP_DELAY - 300);
      }, 1000 + i * STEP_DELAY);
    });

    // After all steps complete, transition out
    const totalTime = 1000 + STEPS.length * STEP_DELAY + 800;
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0, duration: 500,
        easing: Easing.in(Easing.ease), useNativeDriver: true,
      }).start(() => {
        navigation.replace('FinalLoading');
      });
    }, totalTime);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fadeOut }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      <View style={styles.container}>
        {/* Title area */}
        <Animated.View
          style={[
            styles.titleArea,
            { opacity: titleFade, transform: [{ translateY: titleSlide }] },
          ]}
        >
          <Text style={styles.pageTitle}>Almost Ready</Text>
          <Text style={styles.pageSubtitle}>
            Please wait while we put the finishing touches on your smart home.
          </Text>
        </Animated.View>

        {/* Checklist */}
        <View style={styles.checklist}>
          {STEPS.map((step, i) => {
            const isCompleted = completedSteps.includes(step.id);
            const isActive    = currentStep === i && !isCompleted;

            return (
              <Animated.View
                key={step.id}
                style={[
                  styles.stepRow,
                  { opacity: stepAnims[i] },
                  i === STEPS.length - 1 && styles.stepRowLast,
                ]}
              >
                {/* Status icon */}
                <View style={styles.stepLeft}>
                  {isCompleted ? (
                    <View style={styles.stepCheckCircle}>
                      <Ionicons name="checkmark" size={14} color="#EDE8DF" />
                    </View>
                  ) : isActive ? (
                    <View style={styles.stepSpinnerWrap}>
                      <ActivityIndicator size="small" color="#3A5A78" />
                    </View>
                  ) : (
                    <View style={styles.stepEmptyCircle} />
                  )}

                  {/* Connecting line (except last) */}
                  {i < STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        isCompleted && styles.stepLineDone,
                      ]}
                    />
                  )}
                </View>

                {/* Label */}
                <View style={styles.stepContent}>
                  <Ionicons
                    name={step.icon}
                    size={18}
                    color={isCompleted ? '#3A5A78' : isActive ? '#2C2C2C' : 'rgba(44,44,44,0.25)'}
                    style={styles.stepIcon}
                  />
                  <Text
                    style={[
                      styles.stepLabel,
                      isCompleted && styles.stepLabelDone,
                      isActive && styles.stepLabelActive,
                    ]}
                  >
                    {step.label(homeName)}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EDE8DF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Title
  titleArea: {
    marginBottom: 48,
  },
  pageTitle: {
    fontSize: 34, fontWeight: '400', color: '#2C2C2C',
    fontFamily: SERIF, lineHeight: 44, marginBottom: 14,
  },
  pageSubtitle: {
    fontSize: 16, color: 'rgba(44,44,44,0.5)',
    fontFamily: SERIF, lineHeight: 26,
  },

  // Checklist
  checklist: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  stepRowLast: {
    minHeight: 40,
  },

  // Left column (circles + lines)
  stepLeft: {
    width: 32,
    alignItems: 'center',
  },
  stepCheckCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#3A5A78',
    alignItems: 'center', justifyContent: 'center',
  },
  stepSpinnerWrap: {
    width: 26, height: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  stepEmptyCircle: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: 'rgba(44,44,44,0.12)',
    backgroundColor: 'rgba(44,44,44,0.03)',
  },
  stepLine: {
    flex: 1, width: 2, marginVertical: 4,
    backgroundColor: 'rgba(44,44,44,0.08)',
    borderRadius: 1,
  },
  stepLineDone: {
    backgroundColor: 'rgba(58,90,120,0.3)',
  },

  // Content
  stepContent: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start',
    paddingLeft: 14, paddingTop: 3,
    gap: 10,
  },
  stepIcon: {
    marginTop: 1,
  },
  stepLabel: {
    flex: 1,
    fontSize: 15, color: 'rgba(44,44,44,0.3)',
    fontFamily: SERIF, lineHeight: 22,
  },
  stepLabelDone: {
    color: '#3A5A78',
  },
  stepLabelActive: {
    color: '#2C2C2C', fontWeight: '500',
  },
});

export default AlmostReadyScreen;
