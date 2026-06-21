import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LIGHT_COLORS } from '../services/mockData/devices';
import { dashboardService } from '../services/dashboardService';

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

// Data loaded from API/Mock

const LightSettingsScreen = ({ navigation, route }) => {
  const [lightOn, setLightOn]             = useState(route?.params?.lightOn ?? true);
  const [brightness, setBrightness]       = useState(route?.params?.brightness ?? 75);
  const [selectedColor, setSelectedColor] = useState(route?.params?.selectedColor ?? 'warm');

  const currentColor = LIGHT_COLORS.find((c) => c.id === selectedColor)?.hex || '#FFD54F';

  const handleDone = async () => {
    await dashboardService.updateLightSettings({ lightOn, brightness, selectedColor });
    if (route?.params?.onSave) {
      route.params.onSave({ lightOn, brightness, selectedColor });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#3C3C3C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Light Settings</Text>
        <TouchableOpacity onPress={handleDone} style={styles.headerBtn} activeOpacity={0.7}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bulb visual */}
        <View style={styles.bulbArea}>
          <View style={[styles.bulbGlowOuter, {
            backgroundColor: lightOn ? currentColor + '15' : 'rgba(44,44,44,0.03)',
            transform: [{ scale: lightOn ? 0.7 + brightness / 200 : 0.7 }],
          }]}>
            <View style={[styles.bulbGlowInner, {
              backgroundColor: lightOn ? currentColor + '20' : 'transparent',
            }]}>
              <Ionicons name="bulb" size={64} color={lightOn ? currentColor : 'rgba(44,44,44,0.15)'} />
            </View>
          </View>
          <Text style={styles.bulbStatusText}>
            {lightOn ? `${brightness}% · ${LIGHT_COLORS.find(c => c.id === selectedColor)?.label}` : 'Off'}
          </Text>
        </View>

        {/* Power toggle */}
        <TouchableOpacity
          style={[styles.powerRow, lightOn && styles.powerRowOn]}
          onPress={() => setLightOn(!lightOn)}
          activeOpacity={0.7}
        >
          <View style={styles.powerLeft}>
            <Ionicons name="power" size={20} color={lightOn ? '#EDE8DF' : 'rgba(44,44,44,0.4)'} />
            <Text style={[styles.powerLabel, lightOn && styles.powerLabelOn]}>
              {lightOn ? 'Light is On' : 'Light is Off'}
            </Text>
          </View>
          <View style={[styles.powerDot, { backgroundColor: lightOn ? '#66BB6A' : 'rgba(44,44,44,0.15)' }]} />
        </TouchableOpacity>

        {/* Brightness */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sunny-outline" size={16} color="#C2713A" />
            <Text style={styles.sectionTitle}>Brightness</Text>
            <Text style={styles.sectionValue}>{brightness}%</Text>
          </View>

          <View style={styles.brightnessBarWrap}>
            <View style={styles.brightnessBarBg}>
              <View style={[styles.brightnessBarFill, { width: `${brightness}%`, opacity: lightOn ? 1 : 0.3 }]} />
            </View>
          </View>

          <View style={styles.brightnessControls}>
            <TouchableOpacity
              style={styles.fineBtn}
              onPress={() => lightOn && setBrightness(Math.max(0, brightness - 5))}
              activeOpacity={0.6}
            >
              <Ionicons name="remove" size={18} color={lightOn ? '#2C2C2C' : 'rgba(44,44,44,0.2)'} />
            </TouchableOpacity>

            {[25, 50, 75, 100].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.presetBtn, brightness === val && styles.presetBtnActive]}
                onPress={() => lightOn && setBrightness(val)}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetText, brightness === val && styles.presetTextActive]}>
                  {val}%
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.fineBtn}
              onPress={() => lightOn && setBrightness(Math.min(100, brightness + 5))}
              activeOpacity={0.6}
            >
              <Ionicons name="add" size={18} color={lightOn ? '#2C2C2C' : 'rgba(44,44,44,0.2)'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Color */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={16} color="#C2713A" />
            <Text style={styles.sectionTitle}>Color</Text>
          </View>

          <View style={styles.colorGrid}>
            {LIGHT_COLORS.map((c) => {
              const active = selectedColor === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.colorItem, active && styles.colorItemActive]}
                  onPress={() => lightOn && setSelectedColor(c.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorDot, { backgroundColor: c.hex }]} />
                  <Text style={[styles.colorLabel, active && styles.colorLabelActive]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDE8DF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  headerBtn: { width: 56, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '500', color: '#2C2C2C', fontFamily: SERIF },
  doneText: { fontSize: 15, fontWeight: '600', color: '#3A5A78', fontFamily: SERIF },

  content: { paddingHorizontal: 24, paddingBottom: 40 },

  // Bulb
  bulbArea: { alignItems: 'center', paddingVertical: 32 },
  bulbGlowOuter: {
    width: 180, height: 180, borderRadius: 90,
    alignItems: 'center', justifyContent: 'center',
  },
  bulbGlowInner: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  bulbStatusText: {
    fontSize: 14, color: 'rgba(44,44,44,0.45)', fontFamily: SERIF, marginTop: 16,
  },

  // Power
  powerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 18,
    borderRadius: 12, marginBottom: 28,
    backgroundColor: 'rgba(44,44,44,0.06)',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.08)',
  },
  powerRowOn: {
    backgroundColor: '#2C2C2C',
    borderColor: '#2C2C2C',
  },
  powerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  powerLabel: { fontSize: 15, fontWeight: '500', color: 'rgba(44,44,44,0.5)', fontFamily: SERIF },
  powerLabelOn: { color: '#EDE8DF' },
  powerDot: { width: 10, height: 10, borderRadius: 5 },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
  },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '500', color: '#2C2C2C', fontFamily: SERIF },
  sectionValue: { fontSize: 14, fontWeight: '600', color: '#2C2C2C', fontFamily: SERIF },

  // Brightness
  brightnessBarWrap: { marginBottom: 14 },
  brightnessBarBg: {
    height: 8, borderRadius: 4,
    backgroundColor: 'rgba(44,44,44,0.08)', overflow: 'hidden',
  },
  brightnessBarFill: { height: '100%', borderRadius: 4, backgroundColor: '#2C2C2C' },
  brightnessControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  fineBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(44,44,44,0.06)',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  presetBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 8, borderWidth: 1.5,
    borderColor: 'rgba(44,44,44,0.12)',
    backgroundColor: 'rgba(44,44,44,0.03)',
  },
  presetBtnActive: { borderColor: '#2C2C2C', backgroundColor: '#2C2C2C' },
  presetText: { fontSize: 13, fontWeight: '500', color: 'rgba(44,44,44,0.4)', fontFamily: SERIF },
  presetTextActive: { color: '#EDE8DF' },

  // Color
  colorGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  colorItem: {
    alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent',
  },
  colorItemActive: {
    borderColor: '#2C2C2C', backgroundColor: 'rgba(44,44,44,0.06)',
  },
  colorDot: {
    width: 32, height: 32, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  colorLabel: { fontSize: 11, color: 'rgba(44,44,44,0.35)', fontFamily: SERIF },
  colorLabelActive: { color: '#2C2C2C', fontWeight: '600' },
});

export default LightSettingsScreen;
