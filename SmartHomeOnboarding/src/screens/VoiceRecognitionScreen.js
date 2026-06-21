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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { securityService } from '../services/securityService';

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

const BAR_PEAKS  = [0.55, 0.85, 0.45, 1.0, 0.7, 0.9, 0.4, 0.75, 0.6];
const BAR_SPEEDS = [360, 280, 430, 250, 390, 300, 460, 320, 410];

const VoiceRecognitionScreen = ({ navigation }) => {
  // null = checking, 'undetermined'|'denied' = show permission screen, 'granted' = recording screen
  const [micPermission, setMicPermission] = useState(null);
  const [recState, setRecState] = useState('idle'); // idle | recording | saving | done
  const [recording, setRecording] = useState(null);

  // Permission screen animations
  const permFade  = useRef(new Animated.Value(0)).current;
  const permSlide = useRef(new Animated.Value(32)).current;

  // Recording screen animations
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(32)).current;
  const cardAnim     = useRef(new Animated.Value(0)).current;
  const barAnims     = useRef(BAR_PEAKS.map(() => new Animated.Value(0.2))).current;
  const pulseScale   = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const micScale     = useRef(new Animated.Value(1)).current;
  const waveLoopsRef = useRef([]);
  const pulseLoopRef = useRef(null);

  // Cleanup loops on unmount
  useEffect(() => {
    return () => {
      waveLoopsRef.current.forEach(l => l.stop());
      pulseLoopRef.current?.stop();
    };
  }, []);

  // Run entry animation whenever permission state resolves
  useEffect(() => {
    if (micPermission === 'granted') {
      Animated.stagger(80, [
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 600, delay: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: 100, easing: Easing.out(Easing.back(1.05)), useNativeDriver: true }),
        ]),
        Animated.timing(cardAnim, { toValue: 1, duration: 500, delay: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    } else if (micPermission === 'undetermined' || micPermission === 'denied') {
      Animated.parallel([
        Animated.timing(permFade,  { toValue: 1, duration: 600, delay: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(permSlide, { toValue: 0, duration: 600, delay: 100, easing: Easing.out(Easing.back(1.05)), useNativeDriver: true }),
      ]).start();
    }
  }, [micPermission]);

  // On every focus: reset everything and re-check permission
  useFocusEffect(
    useCallback(() => {
      // Reset animation values
      fadeAnim.setValue(0);
      slideAnim.setValue(32);
      cardAnim.setValue(0);
      permFade.setValue(0);
      permSlide.setValue(32);
      barAnims.forEach(a => a.setValue(0.2));
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
      micScale.setValue(1);
      // Stop any running waveform
      waveLoopsRef.current.forEach(l => l.stop());
      waveLoopsRef.current = [];
      pulseLoopRef.current?.stop();
      // Reset recording state
      setRecState('idle');
      // Null triggers re-check, which fires the useEffect above
      setMicPermission(null);
      Audio.getPermissionsAsync()
        .then(({ status }) => setMicPermission(status))
        .catch(() => setMicPermission('granted')); // web fallback
    }, [])
  );

  const requestMicAccess = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setMicPermission('mock_granted');
      } else {
        setMicPermission(status);
      }
    } catch (e) {
      setMicPermission('mock_granted');
    }
    // Reset recording screen animations before transition
    fadeAnim.setValue(0);
    slideAnim.setValue(32);
    cardAnim.setValue(0);
  };

  const startAnimations = () => {
    waveLoopsRef.current = barAnims.map((anim, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: BAR_PEAKS[i], duration: BAR_SPEEDS[i], easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.15, duration: BAR_SPEEDS[i] * 0.85, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return loop;
    });

    pulseScale.setValue(0.9);
    pulseOpacity.setValue(0.5);
    pulseLoopRef.current = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseScale,   { toValue: 2.2, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0,   duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current.start();

    Animated.spring(micScale, { toValue: 1.08, friction: 4, tension: 80, useNativeDriver: true }).start(() => {
      Animated.spring(micScale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
    });
  };

  const stopAnimations = () => {
    waveLoopsRef.current.forEach(l => l.stop());
    waveLoopsRef.current = [];
    pulseLoopRef.current?.stop();
    barAnims.forEach(a => Animated.timing(a, { toValue: 0.2, duration: 500, useNativeDriver: true }).start());
    Animated.timing(pulseOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const handleStartRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setRecState('recording');
      startAnimations();
    } catch (err) {
      console.warn('Failed to start recording', err);
    }
  };

  const handleFinish = async () => {
    stopAnimations();
    setRecState('saving');
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        await securityService.saveVoiceData(uri);
      }
    } catch (err) {
      console.warn('Failed to stop recording', err);
    }
    setRecState('done');
  };

  const handleContinue  = () => navigation.navigate('FaceRecognition');
  const handleSkipVoice = () => navigation.navigate('FaceRecognition');
  const handleSkipAll   = () => navigation.replace('FaceRecognition');

  // Loading state while permission check runs
  if (micPermission === null) return <View style={styles.root} />;

  // ─── PERMISSION SCREEN ───────────────────────────────────────────────────────
  if (micPermission !== 'granted' && micPermission !== 'mock_granted') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>H O M I E E</Text>
          <TouchableOpacity onPress={handleSkipAll} style={styles.headerBtn} activeOpacity={0.6}>
            <Text style={styles.skipText}>Skip All</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.permContent, { opacity: permFade, transform: [{ translateY: permSlide }] }]}>
          <View style={styles.permIconWrap}>
            <Ionicons name="mic-outline" size={44} color="#8B5E3C" />
          </View>

          <Text style={styles.pageTitle}>Microphone{'\n'}Access</Text>
          <Text style={styles.description}>
            Homiee needs your microphone to record your voice and build a personalized recognition profile for hands-free control.
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
              <Ionicons name="ear-outline" size={12} color="rgba(44,44,44,0.45)" />
              <Text style={styles.tagText}>Voice only</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.bottom, { opacity: permFade }]}>
          <TouchableOpacity onPress={requestMicAccess} style={styles.ctaButton} activeOpacity={0.85}>
            <Ionicons name="mic-outline" size={18} color="#EDE8DF" style={styles.ctaIcon} />
            <Text style={styles.ctaText}>ALLOW MICROPHONE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkipVoice} style={styles.skipRow} activeOpacity={0.6}>
            <Text style={styles.skipAllText}>Skip Voice</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ─── RECORDING SCREEN ────────────────────────────────────────────────────────
  const isRecording = recState === 'recording';
  const isDone      = recState === 'done';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>H O M I E E</Text>
        <TouchableOpacity onPress={handleSkipAll} style={styles.headerBtn} activeOpacity={0.6}>
          <Text style={styles.skipText}>Skip All</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Mic with pulse ring */}
        <View style={styles.micContainer}>
          <Animated.View
            style={[styles.micPulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
          />
          <Animated.View
            style={[styles.micWrap, isRecording && styles.micWrapRecording, { transform: [{ scale: micScale }] }]}
          >
            <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={38} color={isRecording ? '#8B5E3C' : '#3C3C3C'} />
          </Animated.View>
        </View>

        <Text style={styles.pageTitle}>Voice Recognition</Text>

        <Text style={styles.instruction}>
          Read the phrase below in your normal voice.{'\n'}Press finish when you're done.
        </Text>

        {/* Phrase card */}
        <Animated.View style={[styles.phraseCard, { opacity: cardAnim }]}>
          <View style={styles.readAloudBadge}>
            <Text style={styles.readAloudLabel}>READ ALOUD</Text>
          </View>
          <Text style={styles.phraseText}>
            "Hey Homiee, it's me. I'm setting up my voice so you can recognize me and help manage our home."
          </Text>
        </Animated.View>

        {/* Waveform */}
        <View style={styles.waveformWrap}>
          {barAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  transform: [{ scaleY: anim }],
                  backgroundColor: isRecording ? '#8B5E3C' : 'rgba(44,44,44,0.22)',
                },
              ]}
            />
          ))}
        </View>

        {recState === 'recording' && <Text style={styles.listeningText}>● Listening...</Text>}
        {recState === 'saving' && <Text style={styles.listeningText}>Saving Voice Profile...</Text>}
        {recState === 'done' && (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#5A7A5A" />
            <Text style={styles.doneText}>Voice captured and saved</Text>
          </View>
        )}
      </Animated.View>

      {/* Bottom buttons */}
      <Animated.View style={[styles.bottom, { opacity: fadeAnim }]}>
        {isDone ? (
          <TouchableOpacity onPress={handleContinue} style={[styles.ctaButton, styles.ctaContinue]} activeOpacity={0.85}>
            <Text style={styles.ctaText}>CONTINUE</Text>
            <Ionicons name="arrow-forward-outline" size={18} color="#EDE8DF" style={styles.ctaIconRight} />
          </TouchableOpacity>
        ) : (
          <>
            {recState === 'recording' ? (
              <TouchableOpacity onPress={handleFinish} style={[styles.ctaButton, styles.ctaFinish]} activeOpacity={0.85}>
                <Ionicons name="checkmark-outline" size={18} color="#EDE8DF" style={styles.ctaIcon} />
                <Text style={styles.ctaText}>FINISH & SAVE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleStartRecording} style={styles.ctaButton} activeOpacity={0.85} disabled={recState === 'saving'}>
                <Ionicons name="mic-outline" size={18} color="#EDE8DF" style={styles.ctaIcon} />
                <Text style={styles.ctaText}>{recState === 'saving' ? 'SAVING...' : 'START RECORDING'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSkipVoice} style={styles.skipRow} activeOpacity={0.6}>
              <Text style={styles.skipAllText}>Skip Voice</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDE8DF' },

  // ── Shared header ─────────────────────────────────────────────────────────────
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

  // ── Permission screen ─────────────────────────────────────────────────────────
  permContent: { flex: 1, paddingHorizontal: 28, paddingTop: 20 },
  permIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(139,94,60,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(139,94,60,0.22)',
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

  // ── Shared bottom ─────────────────────────────────────────────────────────────
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
  ctaFinish:    { backgroundColor: '#8B5E3C' },
  ctaContinue:  { backgroundColor: '#3A5A78' },
  ctaIcon:      { marginRight: 8 },
  ctaIconRight: { marginLeft: 8 },
  ctaText: { fontSize: 14, fontWeight: '700', color: '#EDE8DF', letterSpacing: 1.5 },
  skipRow: { alignItems: 'center', paddingVertical: 8 },
  skipAllText: {
    fontSize: 13, color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF, textDecorationLine: 'underline',
  },

  // ── Recording screen ──────────────────────────────────────────────────────────
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 20 },

  micContainer: {
    width: 96, height: 96,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
  },
  micPulse: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(139,94,60,0.18)',
  },
  micWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: 'rgba(44,44,44,0.05)',
    borderColor: 'rgba(44,44,44,0.18)',
  },
  micWrapRecording: {
    backgroundColor: 'rgba(139,94,60,0.1)',
    borderColor: 'rgba(139,94,60,0.4)',
  },

  instruction: {
    fontSize: 15, color: 'rgba(44,44,44,0.55)',
    fontFamily: SERIF, lineHeight: 24, marginBottom: 28,
  },

  phraseCard: {
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.14)',
    borderRadius: 8, padding: 20,
    backgroundColor: 'rgba(255,255,255,0.38)',
    marginBottom: 32,
  },
  readAloudBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.18)',
    borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 14, backgroundColor: 'rgba(44,44,44,0.04)',
  },
  readAloudLabel: {
    fontSize: 10, fontWeight: '700',
    color: 'rgba(44,44,44,0.45)', letterSpacing: 2.5, fontFamily: SERIF,
  },
  phraseText: {
    fontSize: 17, color: '#2C2C2C',
    fontFamily: SERIF, lineHeight: 30, fontStyle: 'italic',
  },

  waveformWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, gap: 5, marginBottom: 14,
  },
  bar: { width: 4, height: 44, borderRadius: 3 },

  listeningText: {
    textAlign: 'center', fontSize: 12, color: '#8B5E3C',
    fontFamily: SERIF, letterSpacing: 1.5,
  },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  doneText: { fontSize: 13, color: '#5A7A5A', fontFamily: SERIF, letterSpacing: 0.5 },
});

export default VoiceRecognitionScreen;
