import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SCREEN_WIDTH, scale } from '../../utils/dimensions';

const PHONE_WIDTH = 175 * scale;
const PHONE_HEIGHT = 300 * scale;

const tabIcons = [
  'checkmark-circle-outline',
  'grid-outline',
  'list-outline',
  'play-circle-outline',
  'menu-outline',
];

const ServicesIllustration = ({ isActive, onAnimationComplete }) => {
  const houseScale = useRef(new Animated.Value(0)).current;
  const houseOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const avatarsAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isActive) {
      if (hasAnimated.current) {
        houseScale.setValue(1);
        houseOpacity.setValue(1);
        glowOpacity.setValue(1);
        avatarsAnim.setValue(1);
        cardsAnim.setValue(1);
        if (onAnimationComplete) onAnimationComplete();
        return;
      }

      houseScale.setValue(0.5);
      houseOpacity.setValue(0);
      glowOpacity.setValue(0);
      avatarsAnim.setValue(0);
      cardsAnim.setValue(0);

      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(avatarsAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(cardsAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(houseOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(houseScale, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // glowOpacity drives backgroundColor interpolation — color requires JS driver
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }).start(() => {
          hasAnimated.current = true;
          if (onAnimationComplete) onAnimationComplete();
        });
      });
    }
  }, [isActive]);

  const avatarTranslateY = avatarsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0]
  });

  const cardsTranslateX = cardsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0]
  });

  return (
    <View style={styles.container}>
      <View style={styles.phoneWrapper}>
        <View style={styles.phone}>
          <Animated.View style={[styles.avatarRow, { opacity: avatarsAnim, transform: [{ translateY: avatarTranslateY }] }]}>
            <View style={[styles.avatar, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="home" size={16 * scale} color="#FFFFFF" />
            </View>
            <View style={[styles.avatar, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="person" size={16 * scale} color="#FFFFFF" />
            </View>
            <View style={[styles.avatar, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="person" size={16 * scale} color="#FFFFFF" />
            </View>
          </Animated.View>

          <View style={styles.smallDots}>
            <View style={[styles.smallDot, { backgroundColor: '#3C3C43' }]} />
            <View style={[styles.smallDot, { backgroundColor: 'rgba(60,60,67,0.3)' }]} />
            <View style={[styles.smallDot, { backgroundColor: 'rgba(60,60,67,0.3)' }]} />
          </View>

          <Animated.View style={[styles.infoCard, { opacity: cardsAnim, transform: [{ translateX: cardsTranslateX }] }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="flash" size={18 * scale} color="#FFD60A" />
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { backgroundColor: '#007AFF', width: '65%' }]} />
            </View>
            <View style={[styles.progressBarContainer, { marginTop: 4 * scale }]}>
              <View style={[styles.progressBar, { backgroundColor: '#FF9500', width: '40%' }]} />
            </View>
          </Animated.View>

          <Animated.View style={[styles.infoCard, { marginTop: 8 * scale, opacity: cardsAnim, transform: [{ translateX: cardsTranslateX }] }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={18 * scale} color="#5856D6" />
            </View>
            <View style={styles.locationLines}>
              <View style={styles.locationLine} />
              <View style={[styles.locationLine, { width: '60%' }]} />
            </View>
          </Animated.View>

          <View style={{ flex: 1 }} />

          <View style={styles.tabBar}>
            {tabIcons.map((icon, index) => (
              <Ionicons
                key={index}
                name={icon}
                size={16 * scale}
                color="rgba(0,0,0,0.35)"
              />
            ))}
          </View>
        </View>
      </View>

      <Animated.View style={[
        styles.houseContainer, 
        { 
          opacity: houseOpacity, 
          transform: [{ scale: houseScale }] 
        }
      ]}>
        <Animated.View style={[styles.houseGlow, { opacity: glowOpacity }]} />
        <View style={styles.roof} />
        <View style={styles.houseBody}>
          <Animated.View style={[styles.houseDoor, { backgroundColor: glowOpacity.interpolate({ inputRange: [0,1], outputRange: ['#8B572A', '#FF9500'] }) }]} />
          <Animated.View style={[styles.houseWindow, { backgroundColor: glowOpacity.interpolate({ inputRange: [0,1], outputRange: ['#8B572A', '#FF9F0A'] }) }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: PHONE_HEIGHT + 40 * scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneWrapper: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.5 - PHONE_WIDTH * 0.65,
  },
  phone: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    backgroundColor: '#B8E5E0',
    borderRadius: 28 * scale,
    padding: 14 * scale,
    paddingTop: 18 * scale,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10 * scale,
    marginBottom: 8 * scale,
  },
  avatar: {
    width: 32 * scale,
    height: 32 * scale,
    borderRadius: 16 * scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4 * scale,
    marginBottom: 12 * scale,
  },
  smallDot: {
    width: 4 * scale,
    height: 4 * scale,
    borderRadius: 2 * scale,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12 * scale,
    padding: 10 * scale,
  },
  cardHeader: {
    marginBottom: 8 * scale,
  },
  progressBarContainer: {
    height: 4 * scale,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2 * scale,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2 * scale,
  },
  locationLines: {
    gap: 4 * scale,
  },
  locationLine: {
    height: 3 * scale,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 1.5 * scale,
    width: '80%',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14 * scale,
    paddingVertical: 8 * scale,
  },
  houseContainer: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.08,
    bottom: 10 * scale,
    alignItems: 'center',
    width: 80 * scale,
  },
  houseGlow: {
    position: 'absolute',
    bottom: -5 * scale,
    width: 90 * scale,
    height: 50 * scale,
    backgroundColor: 'rgba(255, 159, 10, 0.4)',
    borderRadius: 45 * scale,
  },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 45 * scale,
    borderRightWidth: 45 * scale,
    borderBottomWidth: 35 * scale,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#3C3C43',
    marginBottom: -1,
  },
  houseBody: {
    width: 70 * scale,
    height: 55 * scale,
    backgroundColor: '#3C3C43',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8 * scale,
    paddingBottom: 0,
  },
  houseDoor: {
    width: 20 * scale,
    height: 35 * scale,
    borderTopLeftRadius: 4 * scale,
    borderTopRightRadius: 4 * scale,
  },
  houseWindow: {
    width: 18 * scale,
    height: 18 * scale,
    borderRadius: 2 * scale,
    marginBottom: 12 * scale,
  },
});

export default ServicesIllustration;
