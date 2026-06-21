import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
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

const DEVICE_CARDS = [
  { id: 'sensors',  label: 'Sensors',     icon: 'radio-outline',   accent: '#5856D6' },
  { id: 'plugs',    label: 'Smart Plugs', icon: 'flash-outline',   accent: '#FF9500' },
  { id: 'cameras',  label: 'Cameras',     icon: 'camera-outline',  accent: '#007AFF' },
  { id: 'bulbs',    label: 'Smart Bulbs', icon: 'bulb-outline',    accent: '#FFD60A' },
];

const AddRoomScreen = ({ navigation, route }) => {
  const { addRoom } = useApp();
  const [roomName, setRoomName] = useState('');
  const [confirmedCards, setConfirmedCards] = useState({});

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

  const handleCardConfirm = (cardId) => {
    setConfirmedCards((prev) => ({ ...prev, [cardId]: true }));
  };

  const handleSave = () => {
    // Build devices array from confirmed categories
    const devices = Object.keys(confirmedCards)
      .filter((k) => confirmedCards[k])
      .map((cardId) => {
        const card = DEVICE_CARDS.find((c) => c.id === cardId);
        return { id: cardId, name: card?.label || cardId, category: cardId };
      });
    // Save room to global state
    addRoom({ name: roomName || 'Unnamed Room', devices });
    navigation.replace('RoomLayout');
  };
  const handleSkip = () => navigation.replace('RoomLayout');

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>H O M I E E</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.6}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <Text style={styles.pageTitle}>Add a Room</Text>
          <Text style={styles.pageSubtitle}>Set up your first room to start controlling your home.</Text>

          {/* Room Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ROOM NAME</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={roomName}
                onChangeText={setRoomName}
                placeholder="e.g. Living Room"
                placeholderTextColor="rgba(44,44,44,0.3)"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
              />
              {roomName.length > 0 && (
                <TouchableOpacity onPress={() => setRoomName('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="rgba(44,44,44,0.35)" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.fieldLine} />
          </View>

          {/* Devices */}
          <View style={styles.devicesSection}>
            <Text style={styles.fieldLabel}>DEVICES</Text>
            <Text style={styles.devicesHint}>Tap a category to add devices to this room.</Text>

            <View style={styles.cardGrid}>
              {DEVICE_CARDS.map((card) => {
                const confirmed = confirmedCards[card.id];
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.card,
                      confirmed && styles.cardConfirmed,
                    ]}
                    onPress={() => navigation.navigate('DeviceSelect', { cardId: card.id, onConfirm: handleCardConfirm })}
                    activeOpacity={0.75}
                  >
                    <View style={[
                      styles.iconCircle,
                      confirmed && styles.iconCircleConfirmed,
                    ]}>
                      <Ionicons
                        name={card.icon}
                        size={26}
                        color={confirmed ? '#4C6B5A' : 'rgba(44,44,44,0.4)'}
                      />
                    </View>
                    <Text style={[
                      styles.cardLabel,
                      confirmed && styles.cardLabelConfirmed,
                    ]}>
                      {card.label}
                    </Text>
                    {confirmed ? (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    ) : (
                      <View style={styles.addBadge}>
                        <Ionicons name="add" size={14} color="rgba(44,44,44,0.4)" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Save Room */}
          <TouchableOpacity onPress={handleSave} style={styles.ctaButton} activeOpacity={0.85}>
            <Text style={styles.ctaText}>SAVE ROOM</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipRow} activeOpacity={0.6}>
            <Text style={styles.skipRowText}>I'll add rooms later</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    lineHeight: 22, marginBottom: 36,
  },

  fieldGroup: { marginBottom: 32 },
  fieldLabel: {
    fontSize: 11, fontWeight: '600', color: '#3C3C3C',
    letterSpacing: 1.2, marginBottom: 10,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10 },
  input: { flex: 1, fontSize: 17, color: '#2C2C2C', fontFamily: SERIF, padding: 0 },
  clearBtn: { paddingLeft: 8, paddingVertical: 2 },
  fieldLine: { height: 1, backgroundColor: 'rgba(44,44,44,0.15)' },

  devicesSection: { marginBottom: 36 },
  devicesHint: {
    fontSize: 13, color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF, marginBottom: 18, marginTop: -4,
  },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%', paddingVertical: 20, paddingHorizontal: 16,
    borderRadius: 14, backgroundColor: 'rgba(44,44,44,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(44,44,44,0.1)',
    alignItems: 'flex-start', position: 'relative',
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(44,44,44,0.06)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  cardLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(44,44,44,0.65)', fontFamily: SERIF },
  cardConfirmed: {
    backgroundColor: 'rgba(76,107,90,0.1)',
    borderColor: 'rgba(76,107,90,0.5)',
  },
  iconCircleConfirmed: {
    backgroundColor: 'rgba(76,107,90,0.14)',
  },
  cardLabelConfirmed: {
    color: '#4C6B5A',
  },
  checkBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#4C6B5A',
    alignItems: 'center', justifyContent: 'center',
  },
  addBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(44,44,44,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },

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

export default AddRoomScreen;
