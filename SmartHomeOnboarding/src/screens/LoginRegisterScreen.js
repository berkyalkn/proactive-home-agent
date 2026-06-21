import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

const LoginRegisterScreen = ({ navigation }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(-20)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  const btn1Opacity = useRef(new Animated.Value(0)).current;
  const btn1TranslateY = useRef(new Animated.Value(30)).current;

  const btn2Opacity = useRef(new Animated.Value(0)).current;
  const btn2TranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 900,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 900,
        delay: 200,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(subtitleOpacity, {
      toValue: 1,
      duration: 800,
      delay: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(btn1Opacity, {
        toValue: 1,
        duration: 700,
        delay: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(btn1TranslateY, {
        toValue: 0,
        friction: 6,
        tension: 40,
        delay: 900,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(btn2Opacity, {
        toValue: 1,
        duration: 700,
        delay: 1100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(btn2TranslateY, {
        toValue: 0,
        friction: 6,
        tension: 40,
        delay: 1100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    navigation.replace('Onboarding');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* Back button */}
      <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={24} color="#5C5C5C" />
      </TouchableOpacity>

      {/* Center — brand + tagline */}
      <View style={styles.centerArea}>
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.brandTitle}>H O M I E E</Text>
        </Animated.View>

        <Animated.View style={{ opacity: subtitleOpacity, alignItems: 'center', marginTop: 16 }}>
          <Text style={styles.tagline}>Your smart home,</Text>
          <Text style={styles.taglineAccent}>your way.</Text>
        </Animated.View>

        <Animated.View style={[styles.dividerRow, { opacity: subtitleOpacity }]}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Get Started</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        <Animated.Text style={[styles.getStartedSubtitle, { opacity: subtitleOpacity }]}>
          Seamless comfort and security for your smart home ecosystem.
        </Animated.Text>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomSection}>
        <Animated.View
          style={{
            width: '100%',
            opacity: btn1Opacity,
            transform: [{ translateY: btn1TranslateY }],
          }}
        >
          <TouchableOpacity onPress={handleLogin} style={styles.primaryButton} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Log In</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{
            width: '100%',
            opacity: btn2Opacity,
            transform: [{ translateY: btn2TranslateY }],
          }}
        >
          <TouchableOpacity
            onPress={handleRegister}
            style={styles.secondaryButton}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text style={[styles.terms, { opacity: btn2Opacity }]}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE8DF',
  },

  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 20,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(44, 44, 44, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },

  brandTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#3C3C3C',
    letterSpacing: 8,
    textAlign: 'center',
    fontFamily: SERIF,
  },

  tagline: {
    fontSize: 32,
    fontWeight: '400',
    color: '#8C8C8C',
    textAlign: 'center',
    fontFamily: SERIF,
    lineHeight: 42,
  },
  taglineAccent: {
    fontSize: 36,
    fontWeight: '400',
    color: '#2C2C2C',
    textAlign: 'center',
    fontFamily: SERIF,
    lineHeight: 46,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 48,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(44, 44, 44, 0.12)',
  },
  dividerText: {
    fontSize: 13,
    color: 'rgba(44, 44, 44, 0.4)',
    marginHorizontal: 14,
    letterSpacing: 1.5,
    fontFamily: SERIF,
  },

  getStartedSubtitle: {
    fontSize: 15,
    color: 'rgba(44, 44, 44, 0.45)',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 22,
    fontFamily: SERIF,
  },

  bottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 50 : 34,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 14,
  },

  primaryButton: {
    width: '100%',
    height: 58,
    borderRadius: 30,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2C2C2C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#EDE8DF',
    letterSpacing: 0.3,
  },

  secondaryButton: {
    width: '100%',
    height: 58,
    borderRadius: 30,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(44, 44, 44, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#3C3C3C',
    letterSpacing: 0.2,
  },

  terms: {
    fontSize: 12,
    color: 'rgba(44, 44, 44, 0.3)',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    fontFamily: SERIF,
  },
  termsLink: {
    textDecorationLine: 'underline',
    color: 'rgba(44, 44, 44, 0.5)',
  },
});

export default LoginRegisterScreen;
