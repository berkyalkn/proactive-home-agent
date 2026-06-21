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

const HOUSEHOLD_TYPES = ['Solo', 'Couple', 'Family', 'Roommates'];
const AGE_GROUPS = ['18–25', '26–40', '41–60', '60+'];

const WelcomeSetupScreen = ({ navigation }) => {
  const app = useApp();
  const [homeName, setHomeName] = useState(app.homeName || '');
  const [assistantName, setAssistantName] = useState(app.assistantName || '');
  const [location, setLocation] = useState(app.location || '');
  const [householdType, setHouseholdType] = useState(app.householdType || '');
  const [ageGroup, setAgeGroup] = useState(app.ageGroup || '');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        delay: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay: 150,
        easing: Easing.out(Easing.back(1.05)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    // Save all data to global context
    app.setHomeName(homeName);
    app.setAssistantName(assistantName);
    app.setLocation(location);
    app.setHouseholdType(householdType);
    app.setAgeGroup(ageGroup);
    navigation.replace('AddRoom');
  };

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
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Title */}
          <Text style={styles.pageTitle}>Welcome to{'\n'}Homiee</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Let's personalize your smart home experience.
          </Text>

          {/* Info block */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoText}>
              Homiee uses this information to tailor automation settings,
              comfort preferences, and AI-powered assistance specifically for
              your household.
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* HOME NAME */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>HOME NAME</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={homeName}
                  onChangeText={setHomeName}
                  placeholder="e.g. Berkay's Villa"
                  placeholderTextColor="rgba(44,44,44,0.3)"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {homeName.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setHomeName('')}
                    style={styles.clearBtn}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color="rgba(44,44,44,0.35)"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.fieldLine} />
            </View>

            {/* ASSISTANT NAME */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ASSISTANT NAME</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={assistantName}
                  onChangeText={setAssistantName}
                  placeholder="e.g. Aria"
                  placeholderTextColor="rgba(44,44,44,0.3)"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {assistantName.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setAssistantName('')}
                    style={styles.clearBtn}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color="rgba(44,44,44,0.35)"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.fieldLine} />
            </View>

            {/* LOCATION */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>LOCATION</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Istanbul, Turkey"
                  placeholderTextColor="rgba(44,44,44,0.3)"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {location.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setLocation('')}
                    style={styles.clearBtn}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color="rgba(44,44,44,0.35)"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.fieldLine} />
            </View>

            {/* HOUSEHOLD TYPE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>HOUSEHOLD TYPE</Text>
              <View style={styles.chipRow}>
                {HOUSEHOLD_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      householdType === type && styles.chipSelected,
                    ]}
                    onPress={() => setHouseholdType(type)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        householdType === type && styles.chipTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.fieldLine} />
            </View>

            {/* YOUR AGE GROUP */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>YOUR AGE GROUP</Text>
              <View style={styles.chipRow}>
                {AGE_GROUPS.map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.chip,
                      ageGroup === age && styles.chipSelected,
                    ]}
                    onPress={() => setAgeGroup(age)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        ageGroup === age && styles.chipTextSelected,
                      ]}
                    >
                      {age}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.fieldLine} />
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleContinue}
            style={styles.ctaButton}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>GET STARTED</Text>
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity
            onPress={handleContinue}
            style={styles.skipRow}
            activeOpacity={0.6}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EDE8DF',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C3C',
    letterSpacing: 6,
    fontFamily: SERIF,
  },
  headerSpacer: {
    width: 36,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },

  pageTitle: {
    fontSize: 34,
    fontWeight: '400',
    color: '#2C2C2C',
    fontFamily: SERIF,
    lineHeight: 44,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(44,44,44,0.5)',
    fontFamily: SERIF,
    lineHeight: 24,
    marginBottom: 28,
  },

  infoBlock: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: 'rgba(44,44,44,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(44,44,44,0.08)',
    marginBottom: 36,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(44,44,44,0.55)',
    lineHeight: 21,
    fontFamily: SERIF,
  },

  form: {
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3C3C3C',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#2C2C2C',
    fontFamily: SERIF,
    padding: 0,
  },
  clearBtn: {
    paddingLeft: 8,
    paddingVertical: 2,
  },
  fieldLine: {
    height: 1,
    backgroundColor: 'rgba(44,44,44,0.15)',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 14,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(44,44,44,0.2)',
    backgroundColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#2C2C2C',
    borderColor: '#2C2C2C',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(44,44,44,0.55)',
    fontFamily: SERIF,
  },
  chipTextSelected: {
    color: '#EDE8DF',
    fontWeight: '500',
  },

  ctaButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    shadowColor: '#2C2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EDE8DF',
    letterSpacing: 1.5,
  },

  skipRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    color: 'rgba(44,44,44,0.4)',
    fontFamily: SERIF,
    textDecorationLine: 'underline',
  },

  bottomSpacer: {
    height: 20,
  },
});

export default WelcomeSetupScreen;
