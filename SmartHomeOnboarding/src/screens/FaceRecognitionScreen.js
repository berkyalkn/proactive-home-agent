import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { securityService } from '../services/securityService';

const { width: SW, height: SH } = Dimensions.get('window');

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

// ─ Distance tuning ──────────────────────────────────────────────────────────
// OVAL_W controls how large the face guide is on screen.
// Smaller value  →  user stands further away to fill the oval  (0.45 = far)
// Larger value   →  user stands closer                          (0.70 = close)
const OVAL_W = SW * 0.55;
const OVAL_H = OVAL_W * 1.35;

const POSES = [
  { label: 'Look Straight',   sub: 'Center your face in the oval',  icon: 'remove-outline' },
  { label: 'Slightly Left',   sub: 'Turn your head gently left',    icon: 'arrow-back-outline' },
  { label: 'Slightly Right',  sub: 'Turn your head gently right',   icon: 'arrow-forward-outline' },
  { label: 'Look Up',         sub: 'Tilt your chin slightly down',  icon: 'arrow-up-outline' },
  { label: 'Look Down',       sub: 'Lower your gaze gently',        icon: 'arrow-down-outline' },
];

const FaceRecognitionScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep]               = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDone, setIsDone]           = useState(false);
  const [mockPermission, setMockPermission] = useState(false);

  const capturedPhotos = useRef([]);
  const cameraRef      = useRef(null);

  // Permission screen animations
  const permFade  = useRef(new Animated.Value(0)).current;
  const permSlide = useRef(new Animated.Value(32)).current;

  // Camera UI animations
  const flashAnim  = useRef(new Animated.Value(0)).current;
  const checkAnim  = useRef(new Animated.Value(0)).current;
  const labelFade  = useRef(new Animated.Value(1)).current;
  const labelSlide = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;
  const doneScale  = useRef(new Animated.Value(0)).current;
  const ovalPulse  = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      setStep(0);
      setIsCapturing(false);
      setIsDone(false);
      capturedPhotos.current = [];
      labelFade.setValue(1);
      labelSlide.setValue(0);
      doneScale.setValue(0);
      flashAnim.setValue(0);
      checkAnim.setValue(0);
      btnScale.setValue(1);
      ovalPulse.setValue(1);
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(permFade,  { toValue: 1, duration: 600, delay: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(permSlide, { toValue: 0, duration: 600, delay: 100, easing: Easing.out(Easing.back(1.05)), useNativeDriver: true }),
    ]).start();
  }, []);

  const animateLabel = (onReady) => {
    Animated.parallel([
      Animated.timing(labelFade,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(labelSlide, { toValue: -14, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      onReady();
      labelSlide.setValue(14);
      Animated.parallel([
        Animated.timing(labelFade,  { toValue: 1, duration: 240, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(labelSlide, { toValue: 0, duration: 240, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    });
  };

  const handleCapture = async () => {
    if (isCapturing || !cameraRef.current) return;
    setIsCapturing(true);

    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.88, duration: 70, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.72, duration: 55, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(ovalPulse, { toValue: 1.03, duration: 100, useNativeDriver: true }),
      Animated.spring(ovalPulse, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    checkAnim.setValue(0);
    Animated.sequence([
      Animated.timing(checkAnim, { toValue: 1, duration: 140, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.delay(420),
      Animated.timing(checkAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: false });
      capturedPhotos.current.push(photo.uri);
    } catch (_) {}

    setTimeout(async () => {
      if (step < POSES.length - 1) {
        animateLabel(() => setStep(s => s + 1));
        setIsCapturing(false);
      } else {
        setIsDone(true);
        Animated.spring(doneScale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
        
        try {
          await securityService.saveFaceData(capturedPhotos.current);
        } catch (err) {
          console.warn('Failed to save face data:', err);
        }

        setTimeout(() => navigation.replace('SecurityProtocol'), 1300);
      }
    }, 680);
  };

  const handleSkip = () => navigation.replace('SecurityProtocol');

  const handleRequestPermission = async () => {
    try {
      if (requestPermission) {
        const res = await requestPermission();
        if (!res?.granted) setMockPermission(true);
      } else {
        setMockPermission(true);
      }
    } catch (error) {
      setMockPermission(true);
    }
  };

  const isGranted = permission?.granted || mockPermission;

  // ─── PERMISSION SCREEN ───────────────────────────────────────────────────────
  if (!isGranted) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>H O M I E E</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.headerBtn} activeOpacity={0.6}>
            <Text style={styles.skipText}>Skip All</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.permContent, { opacity: permFade, transform: [{ translateY: permSlide }] }]}>
          <View style={styles.permIconWrap}>
            <Ionicons name="scan-outline" size={44} color="#3A5A78" />
          </View>
          <Text style={styles.pageTitle}>Camera Access</Text>
          <Text style={styles.description}>
            Homiee needs your camera to capture your face from 5 angles and build a secure local recognition model.
          </Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Ionicons name="lock-closed-outline" size={12} color="rgba(44,44,44,0.45)" />
              <Text style={styles.tagText}>Stored locally</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="shield-checkmark-outline" size={12} color="rgba(44,44,44,0.45)" />
              <Text style={styles.tagText}>Never shared</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="eye-off-outline" size={12} color="rgba(44,44,44,0.45)" />
              <Text style={styles.tagText}>Private</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.bottom, { opacity: permFade }]}>
          <TouchableOpacity onPress={handleRequestPermission} style={styles.ctaButton} activeOpacity={0.85}>
            <Text style={styles.ctaText}>ALLOW CAMERA</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} style={styles.skipRow} activeOpacity={0.6}>
            <Text style={styles.skipAllText}>Skip Face ID</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ─── CAMERA SCREEN ────────────────────────────────────────────────────────────
  const pose = POSES[step];

  return (
    <View style={styles.camRoot}>
      {/* Translucent status bar — camera goes edge to edge */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-screen camera — zoom={0} is the widest angle available */}
      {mockPermission ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1C1C1E' }]} />
      ) : (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="front"
          zoom={0}
          ref={cameraRef}
        />
      )}

      {/* Light dark overlay so the oval border reads clearly */}
      <View style={[StyleSheet.absoluteFill, styles.camOverlay]} pointerEvents="none" />

      {/* ── Main layout column ── */}
      <View style={styles.camLayout}>

        {/* Header */}
        <View style={styles.camHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.camBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="rgba(237,232,223,0.92)" />
          </TouchableOpacity>
          <Text style={styles.camBrand}>H O M I E E</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.camBtn} activeOpacity={0.6}>
            <Text style={styles.camSkip}>Skip All</Text>
          </TouchableOpacity>
        </View>

        {/* Oval guide — flex:1 centers it perfectly between header and panel */}
        <View style={styles.ovalArea} pointerEvents="none">
          <Animated.View style={[styles.ovalGuide, { transform: [{ scale: ovalPulse }] }]}>
            {/* Checkmark on successful capture */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.ovalCheck,
                { opacity: checkAnim, transform: [{ scale: checkAnim }] },
              ]}
            >
              <Ionicons name="checkmark" size={58} color="#EDE8DF" />
            </Animated.View>
          </Animated.View>

          {/* Arrow hint below oval */}
          <Animated.View style={[styles.dirIcon, { opacity: labelFade }]}>
            <Ionicons name={pose.icon} size={16} color="rgba(237,232,223,0.75)" />
          </Animated.View>
        </View>

        {/* ── Bottom control panel ── */}
        <View style={styles.panel}>

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {POSES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < step   && styles.dotDone,
                  i === step && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Pose label */}
          <Animated.View style={[styles.poseBlock, { opacity: labelFade, transform: [{ translateY: labelSlide }] }]}>
            <Text style={styles.poseLabel}>{pose.label}</Text>
            <Text style={styles.poseSub}>{pose.sub}</Text>
          </Animated.View>

          {/* Capture button / done state */}
          {isDone ? (
            <Animated.View style={[styles.doneWrap, { transform: [{ scale: doneScale }] }]}>
              <Ionicons name="checkmark-circle-outline" size={26} color="rgba(237,232,223,0.85)" />
              <Text style={styles.doneLabel}>Face captured!</Text>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.shutterWrap, { transform: [{ scale: btnScale }] }]}>
              <TouchableOpacity
                onPress={handleCapture}
                style={[styles.shutter, isCapturing && styles.shutterBusy]}
                activeOpacity={0.85}
                disabled={isCapturing}
              >
                <View style={[styles.shutterInner, isCapturing && styles.shutterInnerBusy]} />
              </TouchableOpacity>
            </Animated.View>
          )}

          <Text style={styles.stepCounter}>{step + 1} / {POSES.length}</Text>
        </View>
      </View>

      {/* White flash on shutter */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashAnim }]}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({

  // ── Shared ────────────────────────────────────────────────────────────────────
  root: { flex: 1, backgroundColor: '#EDE8DF' },

  // ── Permission screen ─────────────────────────────────────────────────────────
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

  permContent: { flex: 1, paddingHorizontal: 28, paddingTop: 20 },
  permIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(58,90,120,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(58,90,120,0.22)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
  },
  pageTitle: {
    fontSize: 34, fontWeight: '400', color: '#2C2C2C',
    fontFamily: SERIF, lineHeight: 44, marginBottom: 16,
  },
  description: {
    fontSize: 15, color: 'rgba(44,44,44,0.55)',
    fontFamily: SERIF, lineHeight: 25, marginBottom: 28,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.14)',
    backgroundColor: 'rgba(44,44,44,0.04)',
  },
  tagText: { fontSize: 12, color: 'rgba(44,44,44,0.5)', fontFamily: SERIF },

  bottom: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28 },
  ctaButton: {
    width: '100%', height: 56, backgroundColor: '#2C2C2C',
    alignItems: 'center', justifyContent: 'center', borderRadius: 4,
    shadowColor: '#2C2C2C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 6, marginBottom: 12,
  },
  ctaText: { fontSize: 14, fontWeight: '700', color: '#EDE8DF', letterSpacing: 1.5 },
  skipRow: { alignItems: 'center', paddingVertical: 8 },
  skipAllText: {
    fontSize: 13, color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF, textDecorationLine: 'underline',
  },

  // ── Camera screen ─────────────────────────────────────────────────────────────
  camRoot: { flex: 1, backgroundColor: '#0A0806' },

  // Minimal overlay — just enough for the oval border to read clearly
  camOverlay: { backgroundColor: 'rgba(0,0,0,0.12)' },

  // Full-screen layout column on top of camera
  camLayout: { flex: 1 },

  camHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  camBtn: { width: 56, height: 36, alignItems: 'center', justifyContent: 'center' },
  camBrand: {
    flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '500',
    color: 'rgba(237,232,223,0.88)', letterSpacing: 6, fontFamily: SERIF,
  },
  camSkip: { fontSize: 13, color: 'rgba(237,232,223,0.38)', fontFamily: SERIF },

  // Oval area fills the space between header and panel — centers the oval automatically
  ovalArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalGuide: {
    width: OVAL_W,
    height: OVAL_H,
    borderRadius: OVAL_W / 2,
    borderWidth: 2,
    borderColor: '#EDE8DF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  ovalCheck: {
    borderRadius: OVAL_W / 2,
    backgroundColor: 'rgba(20,16,12,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirIcon: {
    marginTop: 16,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(237,232,223,0.10)',
    borderWidth: 1, borderColor: 'rgba(237,232,223,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Bottom panel — cream, same as rest of the app
  panel: {
    backgroundColor: '#EDE8DF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(44,44,44,0.10)',
    paddingTop: 20,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    alignItems: 'center',
  },

  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(44,44,44,0.14)' },
  dotDone:   { backgroundColor: 'rgba(44,44,44,0.36)' },
  dotActive: { width: 22, height: 6, borderRadius: 3, backgroundColor: '#3C3C3C' },

  poseBlock: { alignItems: 'center', marginBottom: 22 },
  poseLabel: {
    fontSize: 26, fontWeight: '400',
    color: '#2C2C2C', fontFamily: SERIF,
    textAlign: 'center', marginBottom: 4,
  },
  poseSub: {
    fontSize: 13,
    color: 'rgba(44,44,44,0.48)',
    fontFamily: SERIF, textAlign: 'center',
  },

  // Circle shutter button
  shutterWrap: { marginBottom: 14 },
  shutter: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: 'rgba(44,44,44,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterBusy: { borderColor: 'rgba(44,44,44,0.18)' },
  shutterInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2C2C2C',
  },
  shutterInnerBusy: { backgroundColor: 'rgba(44,44,44,0.22)' },

  doneWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 72, justifyContent: 'center', marginBottom: 14,
  },
  doneLabel: {
    fontSize: 16, color: '#5A7A5A',
    fontFamily: SERIF, letterSpacing: 0.5,
  },

  stepCounter: {
    fontSize: 11, color: 'rgba(44,44,44,0.28)',
    letterSpacing: 2.5, fontFamily: SERIF,
  },

  flash: { backgroundColor: '#fff' },
});

export default FaceRecognitionScreen;
