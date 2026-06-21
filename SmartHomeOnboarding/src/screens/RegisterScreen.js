import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

const RegisterScreen = ({ navigation }) => {
  const app = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    navigation.replace('AccountCreatedLoading', {
      nextScreen: 'WelcomeSetup',
      task: 'register',
      payload: { username, email, password },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
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
        {/* ── Page title ── */}
        <Text style={styles.pageTitle}>Create Account</Text>

        {/* ── Form ── */}
        <View style={styles.form}>

          {/* USERNAME */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>USERNAME</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="your_username"
                placeholderTextColor="rgba(44,44,44,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              {username.length > 0 && (
                <TouchableOpacity onPress={() => setUsername('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="rgba(44,44,44,0.35)" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.fieldLine} />
          </View>

          {/* EMAIL */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <View style={styles.inputRow}>
              <TextInput
                ref={emailRef}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="rgba(44,44,44,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              {email.length > 0 && (
                <TouchableOpacity onPress={() => setEmail('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="rgba(44,44,44,0.35)" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.fieldLine} />
          </View>

          {/* PASSWORD */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={styles.inputRow}>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor="rgba(44,44,44,0.3)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((p) => !p)}
                style={styles.clearBtn}
              >
                <Text style={styles.showToggle}>{showPassword ? 'hide' : 'show'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldLine} />
            <Text style={styles.passwordHint}>
              Must contain at least 8 characters, one uppercase letter, and one number.
            </Text>
          </View>
        </View>

        {/* ── Info block ── */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            Homiee uses this information to securely manage your smart home devices. 
            Your personal data is processed solely to make your home more comfortable and secure.{' '}
            <Text style={styles.infoLink}>More Information.</Text>
          </Text>
        </View>

        {/* ── Policy ── */}
        <Text style={styles.policyText}>
          By using Homiee, you agree to our{' '}
          <Text style={styles.policyLink}>Terms & Conditions</Text>
          {', '}
          <Text style={styles.policyLink}>Privacy Policy</Text>
          {', and '}
          <Text style={styles.policyLink}>Data Policy</Text>
          {' regarding the processing of smart home data.'}
        </Text>

        {/* ── CTA button ── */}
        <TouchableOpacity
          onPress={handleContinue}
          style={styles.ctaButton}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>AGREE AND CONTINUE</Text>
        </TouchableOpacity>

        {/* ── Switch to login ── */}
        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => navigation.replace('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.switchText}>
            Already registered?{'  '}
            <Text style={styles.switchLink}>Log In</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EDE8DF',
  },

  // ── Header ──
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

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // ── Page title ──
  pageTitle: {
    fontSize: 30,
    fontWeight: '400',
    color: '#2C2C2C',
    fontFamily: SERIF,
    marginBottom: 36,
  },

  // ── Form ──
  form: {
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3C3C3C',
    letterSpacing: 1.2,
    marginBottom: 10,
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
  showToggle: {
    fontSize: 14,
    color: 'rgba(44,44,44,0.5)',
    fontWeight: '500',
  },
  fieldLine: {
    height: 1,
    backgroundColor: 'rgba(44,44,44,0.15)',
  },
  passwordHint: {
    fontSize: 12,
    color: 'rgba(44,44,44,0.45)',
    marginTop: 8,
    lineHeight: 17,
    fontFamily: SERIF,
  },

  // ── Info block ──
  infoBlock: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(44,44,44,0.1)',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#3C3C3C',
    lineHeight: 22,
    fontFamily: SERIF,
  },
  infoLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // ── Policy ──
  policyText: {
    fontSize: 12,
    color: 'rgba(44,44,44,0.45)',
    lineHeight: 18,
    marginBottom: 20,
    fontFamily: SERIF,
  },
  policyLink: {
    color: 'rgba(44,44,44,0.65)',
    textDecorationLine: 'underline',
  },

  // ── CTA ──
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

  // ── Switch ──
  switchRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    color: 'rgba(44,44,44,0.5)',
    fontFamily: SERIF,
  },
  switchLink: {
    color: '#2C2C2C',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  bottomSpacer: {
    height: 20,
  },
});

export default RegisterScreen;