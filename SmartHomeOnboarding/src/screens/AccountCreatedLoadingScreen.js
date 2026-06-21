import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/authService';
import { useApp } from '../context/AppContext';

const blobConfigs = [
  { size: 68, radius: 34, top: 11,  left: 96,  colors: ['#D4A373', '#C9B8A8'] },
  { size: 56, radius: 28, top: 42,  left: 162, colors: ['#C9B8A8', '#DDD5C8'] },
  { size: 68, radius: 34, top: 96,  left: 181, colors: ['#D4A373', '#C9B8A8'] },
  { size: 56, radius: 28, top: 162, left: 162, colors: ['#C9B8A8', '#DDD5C8'] },
  { size: 68, radius: 34, top: 181, left: 96,  colors: ['#D4A373', '#C9B8A8'] },
  { size: 56, radius: 28, top: 162, left: 42,  colors: ['#C9B8A8', '#DDD5C8'] },
  { size: 68, radius: 34, top: 96,  left: 11,  colors: ['#D4A373', '#C9B8A8'] },
  { size: 56, radius: 28, top: 42,  left: 42,  colors: ['#C9B8A8', '#DDD5C8'] },
];

const BlobLogo = ({ scaleAnim, rotateAnim }) => (
  <Animated.View
    style={[
      styles.orbitContainer,
      { transform: [{ scale: scaleAnim }, { rotate: rotateAnim }] },
    ]}
  >
    {blobConfigs.map((blob, i) => (
      <View
        key={i}
        style={[
          styles.blobWrapper,
          {
            width: blob.size,
            height: blob.size * 0.85,
            top: blob.top,
            left: blob.left,
            borderRadius: blob.radius,
          },
        ]}
      >
        <LinearGradient
          colors={blob.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    ))}
  </Animated.View>
);

const AccountCreatedLoadingScreen = ({ navigation, route }) => {
  const app = useApp();
  const nextScreen = route?.params?.nextScreen || 'WelcomeSetup';

  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 800,
      delay: 600,
      useNativeDriver: true,
    }).start();

    const performBackgroundTask = async () => {
      const task = route?.params?.task;
      const payload = route?.params?.payload;
      try {
        switch (task) {
          case 'register': {
            const result = await authService.register(payload);
            if (result.success) {
              app.setUsername(result.data.user.username);
              app.setEmail(result.data.user.email);
              app.setAuthToken(result.data.token);
              app.setIsAuthenticated(true);
            }
            break;
          }
          case 'login': {
            const result = await authService.login(payload);
            if (result.success) {
              app.setUsername(result.data.user.username);
              app.setEmail(result.data.user.email);
              app.setAuthToken(result.data.token);
              app.setIsAuthenticated(true);
            }
            break;
          }
          default:
            break;
        }
      } catch (error) {
        console.warn('Background task failed:', error);
      }
    };

    let isMounted = true;
    const minDelay = new Promise(resolve => setTimeout(resolve, 2500));
    Promise.all([performBackgroundTask(), minDelay]).then(() => {
      if (!isMounted) return;
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 600,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        navigation.replace(nextScreen);
      });
    });

    return () => { isMounted = false; };
  }, []);

  const rotateInterp = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />
      <View style={styles.center}>
        <BlobLogo scaleAnim={logoScale} rotateAnim={rotateInterp} />
        <Animated.Text style={[styles.logoText, { opacity: textOpacity }]}>
          Homiee
        </Animated.Text>
      </View>
      <Animated.Text style={[styles.loadingText, { opacity: textOpacity }]}>
        Setting up your account...
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE8DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitContainer: {
    position: 'absolute',
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobWrapper: {
    position: 'absolute',
    overflow: 'hidden',
    opacity: 0.7,
    ...(Platform.OS === 'web' ? { filter: 'blur(12px)' } : {}),
  },
  logoText: {
    fontSize: 40,
    fontWeight: '400',
    color: '#2C2C2C',
    letterSpacing: -0.5,
    zIndex: 10,
    fontFamily:
      Platform.OS === 'web'
        ? '"Georgia", "Times New Roman", serif'
        : Platform.OS === 'ios'
        ? 'Georgia'
        : 'serif',
  },
  loadingText: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 80 : 60,
    fontSize: 14,
    color: 'rgba(44, 44, 44, 0.4)',
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily:
      Platform.OS === 'web'
        ? '"Georgia", "Times New Roman", serif'
        : Platform.OS === 'ios'
        ? 'Georgia'
        : 'serif',
  },
});

export default AccountCreatedLoadingScreen;
