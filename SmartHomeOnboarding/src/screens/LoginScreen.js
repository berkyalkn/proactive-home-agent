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

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const passwordRef = useRef(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogin = () => {
    navigation.replace('AccountCreatedLoading', {
      nextScreen: 'Home',
      task: 'login',
      payload: { email, password, rememberMe },
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
        <Text style={styles.pageTitle}>Log In</Text>

        {/* ── Form ── */}
        <View style={styles.form}>

          {/* EMAIL */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <View style={styles.inputRow}>
              <TextInput
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
                placeholder="••••••••"
                placeholderTextColor="rgba(44,44,44,0.3)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((p) => !p)}
                style={styles.clearBtn}
              >
                <Text style={styles.showToggle}>{showPassword ? 'hide' : 'show'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldLine} />
          </View>

          {/* Remember me + Forgot password */}
          <View style={styles.rememberForgotRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe((r) => !r)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={11} color="#EDE8DF" />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.6}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Info block ── */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            By logging into your account, you can manage your smart home devices, automation rules, 
            and security settings.{' '}
            <Text style={styles.infoLink}>More information.</Text>
          </Text>
        </View>

        {/* ── Policy ── */}
        <Text style={styles.policyText}>
          By logging into Homiee, you agree to our{' '}
          <Text style={styles.policyLink}>Terms & Conditions</Text>
          {', '}
          <Text style={styles.policyLink}>Privacy Policy</Text>
          {', and '}
          <Text style={styles.policyLink}>Data Policy</Text>
          {' regarding the processing of smart home data.'}
        </Text>

        {/* ── CTA button ── */}
        <TouchableOpacity
          onPress={handleLogin}
          style={styles.ctaButton}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>LOG IN</Text>
        </TouchableOpacity>

        {/* ── Switch to register ── */}
        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => navigation.replace('Register')}
          activeOpacity={0.7}
        >
          <Text style={styles.switchText}>
            Don't have an account?{'  '}
            <Text style={styles.switchLink}>Create Account</Text>
          </Text>
        </TouchableOpacity>

        {/* ── Face ID ── */}
        <TouchableOpacity style={styles.faceIdButton} activeOpacity={0.7}>
          <Ionicons name="scan-outline" size={20} color="#2C2C2C" />
          <Text style={styles.faceIdText}>Login with Face ID</Text>
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
    marginBottom: 28,
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

  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(44,44,44,0.3)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2C2C2C',
    borderColor: '#2C2C2C',
  },
  rememberText: {
    fontSize: 13,
    color: 'rgba(44,44,44,0.5)',
    fontFamily: SERIF,
  },
  forgotText: {
    fontSize: 13,
    color: 'rgba(44,44,44,0.5)',
    textDecorationLine: 'underline',
    fontFamily: SERIF,
  },

  // ── Info block ──
  infoBlock: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(44,44,44,0.1)',
    marginBottom: 16,
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
    marginBottom: 28,
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
    marginBottom: 20,
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

  // ── Face ID ──
  faceIdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(44,44,44,0.18)',
    backgroundColor: 'rgba(44,44,44,0.04)',
  },
  faceIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    letterSpacing: 0.3,
    fontFamily: SERIF,
  },

  bottomSpacer: {
    height: 20,
  },
});

export default LoginScreen;