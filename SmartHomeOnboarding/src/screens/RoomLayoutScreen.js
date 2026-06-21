import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

const RoomLayoutScreen = ({ navigation }) => {
  const { rooms, removeRoom, homeName } = useApp();

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

  const handleContinue = () => {
    navigation.replace('AccountCreatedLoading', { nextScreen: 'PersonalizeAssistant' });
  };

  const handleAddMore = () => {
    navigation.navigate('AddRoom');
  };

  const getDeviceIcon = (category) => {
    const map = {
      sensors: 'radio-outline',
      plugs: 'flash-outline',
      cameras: 'camera-outline',
      bulbs: 'bulb-outline',
    };
    return map[category] || 'cube-outline';
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>H O M I E E</Text>
        <TouchableOpacity onPress={handleContinue} style={styles.skipButton} activeOpacity={0.6}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <Text style={styles.pageTitle}>Room's Layout</Text>
          <Text style={styles.pageSubtitle}>
            {homeName ? `${homeName}'s rooms` : 'Your rooms'} — manage or add more rooms to your smart home.
          </Text>

          {/* Room list */}
          {rooms.length > 0 ? (
            <View style={styles.roomList}>
              {rooms.map((room, index) => (
                <View key={room.id} style={styles.roomCard}>
                  <View style={styles.roomCardLeft}>
                    <View style={styles.roomIconWrap}>
                      <Ionicons name="home-outline" size={20} color="#3A5A78" />
                    </View>
                    <View style={styles.roomInfo}>
                      <Text style={styles.roomName}>{room.name}</Text>
                      <View style={styles.deviceTags}>
                        {room.devices && room.devices.length > 0 ? (
                          room.devices.map((device) => (
                            <View key={device.id} style={styles.deviceTag}>
                              <Ionicons name={getDeviceIcon(device.category)} size={11} color="#3A5A78" />
                              <Text style={styles.deviceTagText}>{device.name}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noDevicesText}>No devices added</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeRoom(room.id)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="trash-outline" size={18} color="rgba(229,57,53,0.6)" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="home-outline" size={36} color="rgba(44,44,44,0.15)" />
              </View>
              <Text style={styles.emptyTitle}>No rooms yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your first room to start organizing{'\n'}your smart home devices.
              </Text>
            </View>
          )}

          {/* Add another room */}
          <TouchableOpacity
            style={styles.addRoomBtn}
            onPress={handleAddMore}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color="#3A5A78" />
            <Text style={styles.addRoomText}>Add Another Room</Text>
          </TouchableOpacity>

          {/* Room count badge */}
          {rooms.length > 0 && (
            <View style={styles.countBadge}>
              <Ionicons name="layers-outline" size={14} color="rgba(44,44,44,0.4)" />
              <Text style={styles.countText}>
                {rooms.length} room{rooms.length !== 1 ? 's' : ''} · {rooms.reduce((sum, r) => sum + (r.devices?.length || 0), 0)} device{rooms.reduce((sum, r) => sum + (r.devices?.length || 0), 0) !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Continue CTA */}
          <TouchableOpacity
            onPress={handleContinue}
            style={styles.ctaButton}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>CONTINUE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            style={styles.skipRow}
            activeOpacity={0.6}
          >
            <Text style={styles.skipRowText}>I'll add rooms later</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDE8DF' },

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
  skipButton: { width: 36, alignItems: 'flex-end', paddingVertical: 4 },
  skipText: { fontSize: 14, color: 'rgba(44,44,44,0.45)', fontFamily: SERIF },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },

  pageTitle: {
    fontSize: 30, fontWeight: '400', color: '#2C2C2C',
    fontFamily: SERIF, marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15, color: 'rgba(44,44,44,0.45)', fontFamily: SERIF,
    lineHeight: 22, marginBottom: 32,
  },

  // ── Room list ─────────────────────────────────────────────────────────────
  roomList: { gap: 12, marginBottom: 24 },
  roomCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.06)',
  },
  roomCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  roomIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(58,90,120,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  roomInfo: { flex: 1 },
  roomName: {
    fontSize: 16, fontWeight: '600', color: '#2C2C2C',
    fontFamily: SERIF, marginBottom: 6,
  },
  deviceTags: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  deviceTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(58,90,120,0.06)',
  },
  deviceTagText: {
    fontSize: 10, color: '#3A5A78', fontFamily: SERIF, fontWeight: '500',
  },
  noDevicesText: {
    fontSize: 11, color: 'rgba(44,44,44,0.3)', fontFamily: SERIF, fontStyle: 'italic',
  },
  removeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(229,57,53,0.06)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center', paddingVertical: 48, marginBottom: 8,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(44,44,44,0.04)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '500', color: 'rgba(44,44,44,0.3)',
    fontFamily: SERIF, marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13, color: 'rgba(44,44,44,0.25)', fontFamily: SERIF,
    textAlign: 'center', lineHeight: 20,
  },

  // ── Add room button ───────────────────────────────────────────────────────
  addRoomBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(58,90,120,0.2)',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  addRoomText: {
    fontSize: 15, fontWeight: '500', color: '#3A5A78', fontFamily: SERIF,
  },

  // ── Count badge ───────────────────────────────────────────────────────────
  countBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginBottom: 28,
  },
  countText: {
    fontSize: 12, color: 'rgba(44,44,44,0.4)', fontFamily: SERIF,
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaButton: {
    width: '100%', height: 56, backgroundColor: '#2C2C2C',
    alignItems: 'center', justifyContent: 'center', borderRadius: 4,
    shadowColor: '#2C2C2C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 6, marginBottom: 16,
  },
  ctaText: { fontSize: 14, fontWeight: '700', color: '#EDE8DF', letterSpacing: 1.5 },
  skipRow: { alignItems: 'center', paddingVertical: 8 },
  skipRowText: {
    fontSize: 13, color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF, textDecorationLine: 'underline',
  },
});

export default RoomLayoutScreen;
