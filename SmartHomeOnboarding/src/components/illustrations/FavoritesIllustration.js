import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SCREEN_WIDTH, scale } from '../../utils/dimensions';

const PHONE_WIDTH = 190 * scale;
const PHONE_HEIGHT = 320 * scale;

const tabIcons = [
  'checkmark-circle-outline',
  'grid-outline',
  'list-outline',
  'play-circle-outline',
  'menu-outline',
];

const FavoritesIllustration = ({ isActive, onAnimationComplete }) => {
  const row1Anim = useRef(new Animated.Value(0)).current;
  const row2Anim = useRef(new Animated.Value(0)).current;
  const row3Anim = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isActive) {
      if (hasAnimated.current) {
        row1Anim.setValue(1);
        row2Anim.setValue(1);
        row3Anim.setValue(1);
        bottomAnim.setValue(1);
        if (onAnimationComplete) onAnimationComplete();
        return;
      }

      row1Anim.setValue(0);
      row2Anim.setValue(0);
      row3Anim.setValue(0);
      bottomAnim.setValue(0);

      Animated.sequence([
        Animated.delay(200),
        Animated.stagger(150, [
          Animated.timing(row1Anim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(row2Anim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(row3Anim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(bottomAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      ]).start(() => {
        hasAnimated.current = true;
        if (onAnimationComplete) onAnimationComplete();
      });
    }
  }, [isActive]);

  const getTransform = (animValue) => {
    return [{
      translateY: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0]
      })
    }];
  };

  return (
    <View style={styles.container}>
      <View style={styles.phone}>
        <Animated.View style={[styles.cardRow, { opacity: row1Anim, transform: getTransform(row1Anim) }]}>
          <View style={[styles.card, styles.cardTall]}>
            <Ionicons name="sunny" size={24 * scale} color="#FFC107" />
          </View>
          <View style={[styles.card, styles.cardTall]}>
            <View style={styles.shieldCircle}>
              <Ionicons name="shield-checkmark" size={18 * scale} color="#FFFFFF" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.cardRow, { opacity: row2Anim, transform: getTransform(row2Anim) }]}>
          <View style={styles.card}>
            <Ionicons name="home" size={20 * scale} color="#3C3C43" />
          </View>
          <View style={styles.card}>
            <Ionicons name="cafe" size={20 * scale} color="#8B6914" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.cardRow, { opacity: row3Anim, transform: getTransform(row3Anim) }]}>
          <View style={styles.card}>
            <Ionicons name="bulb" size={20 * scale} color="#FF9500" />
          </View>
          <View style={styles.card}>
            <Ionicons name="ellipse" size={20 * scale} color="#5856D6" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.avatarSection, { opacity: bottomAnim, transform: getTransform(bottomAnim) }]}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="home" size={14 * scale} color="#FFFFFF" />
            </View>
            <View style={[styles.avatar, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="person" size={14 * scale} color="#FFFFFF" />
            </View>
            <View style={[styles.avatar, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="person" size={14 * scale} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotInactive]} />
            <View style={[styles.dot, styles.dotInactive]} />
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <View style={styles.tabBar}>
          {tabIcons.map((icon, index) => (
            <Ionicons
              key={index}
              name={index === 0 ? 'checkmark-circle' : icon}
              size={16 * scale}
              color={index === 0 ? '#007AFF' : 'rgba(0,0,0,0.35)'}
            />
          ))}
        </View>
      </View>
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
  phone: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    backgroundColor: '#B8E5E0',
    borderRadius: 28 * scale,
    padding: 14 * scale,
    paddingTop: 18 * scale,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 8 * scale,
    marginBottom: 8 * scale,
  },
  card: {
    flex: 1,
    height: 55 * scale,
    backgroundColor: '#FFFFFF',
    borderRadius: 10 * scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTall: {
    height: 70 * scale,
  },
  shieldCircle: {
    width: 32 * scale,
    height: 32 * scale,
    borderRadius: 16 * scale,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12 * scale,
    padding: 10 * scale,
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10 * scale,
    marginBottom: 8 * scale,
  },
  avatar: {
    width: 30 * scale,
    height: 30 * scale,
    borderRadius: 15 * scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4 * scale,
  },
  dot: {
    width: 5 * scale,
    height: 5 * scale,
    borderRadius: 2.5 * scale,
  },
  dotActive: {
    backgroundColor: '#3C3C43',
  },
  dotInactive: {
    backgroundColor: 'rgba(60,60,67,0.3)',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14 * scale,
    paddingVertical: 8 * scale,
  },
});

export default FavoritesIllustration;
