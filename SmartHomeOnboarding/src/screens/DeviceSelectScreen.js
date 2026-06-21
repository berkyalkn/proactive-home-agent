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
import { homeService } from '../services/homeService';

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

const DeviceSelectScreen = ({ navigation, route }) => {
  const { cardId } = route.params;

  const [card, setCard] = useState(null);
  const [devices, setDevices] = useState([]);
  const [addedDevices, setAddedDevices] = useState([]);
  const [deviceName, setDeviceName] = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, delay: 80,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 500, delay: 80,
        easing: Easing.out(Easing.back(1.05)), useNativeDriver: true,
      }),
    ]).start();

    const loadData = async () => {
      const catResult = await homeService.getDeviceCategories();
      if (catResult.success) {
        const foundCard = catResult.data.find((c) => c.id === cardId);
        setCard(foundCard);
      }
      const devResult = await homeService.getDevicesByCategory(cardId);
      if (devResult.success) {
        setDevices(devResult.data);
      }
    };
    loadData();
  }, [cardId]);

  const toggleDevice = (deviceId) => {
    setAddedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleConfirm = () => {
    if (addedDevices.length > 0 && route.params?.onConfirm) {
      route.params.onConfirm(cardId);
    }
    navigation.goBack();
  };

  if (!card) return <View style={styles.root} />;

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
        <View style={{ width: 36 }} />
      </View>

      <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Category title row */}
        <View style={styles.titleRow}>
          <View style={[styles.titleIconCircle, { backgroundColor: card.accent + '18' }]}>
            <Ionicons name={card.icon} size={22} color={card.accent} />
          </View>
          <View>
            <Text style={styles.pageTitle}>{card.label}</Text>
            <Text style={styles.pageSubtitle}>Select devices to add to this room.</Text>
          </View>
        </View>

        {/* Scan indicator */}
        <View style={styles.scanRow}>
          <View style={styles.scanDot} />
          <Text style={styles.scanText}>Devices found on your network</Text>
        </View>

        {/* Device list */}
        <ScrollView
          style={styles.deviceList}
          contentContainerStyle={styles.deviceListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {devices.map((device, index) => {
            const isAdded = addedDevices.includes(device.id);
            return (
              <View
                key={device.id}
                style={[
                  styles.deviceRow,
                  index === devices.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.deviceInfo}>
                  <View style={[
                    styles.deviceDot,
                    isAdded && { backgroundColor: card.accent },
                  ]} />
                  <Text style={[
                    styles.deviceName,
                    isAdded && { color: '#2C2C2C', fontWeight: '500' },
                  ]}>
                    {device.name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.deviceBtn, isAdded && styles.deviceBtnRemove]}
                  onPress={() => toggleDevice(device.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.deviceBtnText, isAdded && styles.deviceBtnTextRemove]}>
                    {isAdded ? 'Remove' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <View style={styles.divider} />

          {/* Name input */}
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              value={deviceName}
              onChangeText={setDeviceName}
              placeholder="Give this device a name"
              placeholderTextColor="rgba(44,44,44,0.3)"
              autoCorrect={false}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.nameSaveBtn, deviceName.length === 0 && styles.nameSaveBtnDisabled]}
              activeOpacity={0.8}
              disabled={deviceName.length === 0}
            >
              <Text style={[styles.nameSaveText, deviceName.length === 0 && styles.nameSaveTextDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Confirm */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              addedDevices.length > 0 && styles.confirmBtnActive,
            ]}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>Confirm Selection</Text>
            {addedDevices.length > 0 && (
              <View style={styles.confirmBadge}>
                <Text style={styles.confirmBadgeText}>{addedDevices.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDE8DF' },
  flex: { flex: 1 },

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

  // Title
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4, gap: 16,
  },
  titleIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 28, fontWeight: '400', color: '#2C2C2C',
    fontFamily: SERIF, marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13, color: 'rgba(44,44,44,0.45)', fontFamily: SERIF,
  },

  // Scan row
  scanRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8, gap: 8,
  },
  scanDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#34C759',
  },
  scanText: {
    fontSize: 12, color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF, letterSpacing: 0.2,
  },

  // Device list
  deviceList: { flex: 1 },
  deviceListContent: { paddingHorizontal: 24, paddingTop: 4 },
  deviceRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: 'rgba(44,44,44,0.07)',
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  deviceDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(44,44,44,0.18)',
  },
  deviceName: {
    fontSize: 16, color: 'rgba(44,44,44,0.7)', fontFamily: SERIF,
  },
  deviceBtn: {
    paddingHorizontal: 22, paddingVertical: 9,
    borderRadius: 22, borderWidth: 1.5,
    borderColor: 'rgba(44,44,44,0.22)',
    backgroundColor: 'transparent',
  },
  deviceBtnRemove: {
    borderColor: 'rgba(255,59,48,0.35)',
    backgroundColor: 'rgba(255,59,48,0.05)',
  },
  deviceBtnText: {
    fontSize: 13, fontWeight: '600',
    color: 'rgba(44,44,44,0.55)',
  },
  deviceBtnTextRemove: { color: '#FF3B30' },

  // Bottom
  bottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  divider: {
    height: 1, backgroundColor: 'rgba(44,44,44,0.1)',
    marginHorizontal: 24, marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, gap: 12, marginBottom: 16,
  },
  nameInput: {
    flex: 1, fontSize: 15, color: '#2C2C2C', fontFamily: SERIF,
    borderBottomWidth: 1, borderBottomColor: 'rgba(44,44,44,0.2)',
    paddingBottom: 8, padding: 0,
  },
  nameSaveBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 8, backgroundColor: '#2C2C2C',
  },
  nameSaveBtnDisabled: { backgroundColor: 'rgba(44,44,44,0.12)' },
  nameSaveText: { fontSize: 14, fontWeight: '600', color: '#EDE8DF' },
  nameSaveTextDisabled: { color: 'rgba(44,44,44,0.3)' },

  confirmBtn: {
    marginHorizontal: 24, height: 56,
    backgroundColor: 'rgba(44,44,44,0.18)',
    borderRadius: 4, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10,
  },
  confirmBtnActive: {
    backgroundColor: '#4C6B5A',
    shadowColor: '#4C6B5A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#EDE8DF', letterSpacing: 1.2 },
  confirmBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

export default DeviceSelectScreen;
