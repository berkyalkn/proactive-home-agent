import React, { useState, useRef, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
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
import { Ionicons } from '@expo/vector-icons';

const { width: SW, height: SH } = Dimensions.get('window');

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

const CameraFeedScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [cameraInfo, setCameraInfo] = useState({ name: 'Living Room Camera', status: 'online' });

  useEffect(() => {
    const loadCamera = async () => {
      const result = await dashboardService.getCameraFeeds();
      if (result.success && result.data.length > 0) {
        setCameraInfo(result.data[0]);
      }
    };
    loadCamera();

    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400,
      easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start();

    // Pulse the LIVE dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3, duration: 800,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1, duration: 800,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleClose = () => navigation.goBack();

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera feed area (mock dark background) */}
      <View style={styles.feedArea}>
        {/* Grid overlay for camera feel */}
        <View style={styles.gridOverlay}>
          {/* Crosshair */}
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />
        </View>

        {/* Camera icon */}
        <Ionicons name="videocam" size={56} color="rgba(255,255,255,0.12)" />

        {/* Corner brackets */}
        <View style={[styles.bracket, styles.bracketTL]} />
        <View style={[styles.bracket, styles.bracketTR]} />
        <View style={[styles.bracket, styles.bracketBL]} />
        <View style={[styles.bracket, styles.bracketBR]} />
      </View>

      {/* Top overlay */}
      <View style={styles.topOverlay}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.liveBadge}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        <View style={styles.timeStamp}>
          <Text style={styles.timeText}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {/* Bottom overlay */}
      <View style={styles.bottomOverlay}>
        <View style={styles.cameraInfoRow}>
          <Ionicons name="camera-outline" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={styles.cameraNameText}>{cameraInfo.name}</Text>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlBtn} activeOpacity={0.7}>
            <Ionicons name="mic-outline" size={22} color="#fff" />
            <Text style={styles.controlLabel}>Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtnMain} activeOpacity={0.7}>
            <Ionicons name="radio-button-on" size={28} color="#E53935" />
            <Text style={styles.controlLabel}>Record</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={22} color="#fff" />
            <Text style={styles.controlLabel}>Snapshot</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Feed area
  feedArea: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center',
  },

  // Grid
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  crosshairH: {
    position: 'absolute',
    width: '100%', height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1, height: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  // Corner brackets
  bracket: {
    position: 'absolute',
    width: 28, height: 28,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  bracketTL: {
    top: '15%', left: '10%',
    borderTopWidth: 2, borderLeftWidth: 2,
  },
  bracketTR: {
    top: '15%', right: '10%',
    borderTopWidth: 2, borderRightWidth: 2,
  },
  bracketBL: {
    bottom: '15%', left: '10%',
    borderBottomWidth: 2, borderLeftWidth: 2,
  },
  bracketBR: {
    bottom: '15%', right: '10%',
    borderBottomWidth: 2, borderRightWidth: 2,
  },

  // Top overlay
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(229,57,53,0.2)',
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E53935',
  },
  liveText: {
    fontSize: 11, fontWeight: '800', color: '#E53935',
    letterSpacing: 1.5,
  },
  timeStamp: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  timeText: {
    fontSize: 12, color: 'rgba(255,255,255,0.6)',
    fontFamily: SERIF, fontWeight: '500',
  },

  // Bottom overlay
  bottomOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 24, paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cameraInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 20,
  },
  cameraNameText: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)',
    fontFamily: SERIF, fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 32,
  },
  controlBtn: {
    alignItems: 'center', gap: 6,
  },
  controlBtnMain: {
    alignItems: 'center', gap: 6,
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
  },
  controlLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.5)',
    fontFamily: SERIF, letterSpacing: 0.3,
  },
});

export default CameraFeedScreen;
