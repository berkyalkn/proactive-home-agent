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

const AutomateIllustration = ({ isActive, onAnimationComplete }) => {
  const blindsAnim = useRef(new Animated.Value(0)).current;
  const lampOpacity = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isActive) {
      if (hasAnimated.current) {
        blindsAnim.setValue(1);
        lampOpacity.setValue(1);
        cardsAnim.setValue(1);
        if (onAnimationComplete) onAnimationComplete();
        return;
      }

      blindsAnim.setValue(0);
      lampOpacity.setValue(0);
      cardsAnim.setValue(0);

      Animated.sequence([
        Animated.delay(200),
        Animated.timing(cardsAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Height and color animations require JS driver — run after native sequence
        Animated.sequence([
          Animated.timing(blindsAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.bounce),
            useNativeDriver: false,
          }),
          Animated.timing(lampOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
        ]).start(() => {
          hasAnimated.current = true;
          if (onAnimationComplete) onAnimationComplete();
        });
      });
    }
  }, [isActive]);

  const blindsHeight = blindsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 70 * scale]
  });

  const lampColor = lampOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ['#5C5033', '#FF9500']
  });

  const cardsScale = cardsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  });

  return (
    <View style={styles.container}>
      <View style={styles.phoneWrapper}>
        <View style={styles.phone}>
          <Animated.View style={[styles.cardRow, { opacity: cardsAnim, transform: [{ scale: cardsScale }] }]}>
            <View style={[styles.card, styles.cardWide]}>
              <Ionicons name="home" size={20 * scale} color="#3C3C43" />
            </View>
            <View style={styles.card}>
              <Ionicons name="cafe" size={20 * scale} color="#8B6914" />
            </View>
          </Animated.View>

          <Animated.View style={[styles.cardRow, { opacity: cardsAnim, transform: [{ scale: cardsScale }] }]}>
            <View style={styles.card}>
              <Ionicons name="cloud" size={20 * scale} color="#8E8E93" />
            </View>
            <View style={styles.card}>
              <Ionicons name="moon" size={20 * scale} color="#5856D6" />
            </View>
          </Animated.View>

          <Animated.View style={[styles.automationCard, { opacity: cardsAnim, transform: [{ scale: cardsScale }] }]}>
            <View style={styles.automationRow}>
              <View style={styles.automationIcon}>
                <Ionicons name="sunny" size={14 * scale} color="#FF9500" />
              </View>
              <Ionicons name="chevron-forward" size={12 * scale} color="rgba(0,0,0,0.3)" />
              <View style={styles.automationIcon}>
                <Ionicons name="bulb" size={14 * scale} color="#FFD60A" />
              </View>
              <Ionicons name="chevron-forward" size={12 * scale} color="rgba(0,0,0,0.3)" />
              <View style={styles.automationIcon}>
                <Ionicons name="musical-notes" size={14 * scale} color="#007AFF" />
              </View>
            </View>
          </Animated.View>

          <View style={{ flex: 1 }} />

          <View style={styles.tabBar}>
            {tabIcons.map((icon, index) => (
              <View key={index} style={index === 3 ? styles.tabActiveContainer : null}>
                <Ionicons
                  name={icon}
                  size={16 * scale}
                  color={index === 3 ? '#007AFF' : 'rgba(0,0,0,0.35)'}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.furnitureContainer}>
        <Animated.View style={[styles.blinds, { height: blindsHeight }]}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={styles.blindStripe} />
          ))}
        </Animated.View>

        <View style={styles.couchContainer}>
          <View style={styles.couch}>
            <View style={styles.armrestLeft} />
            <View style={styles.seat} />
            <View style={styles.armrestRight} />
          </View>
          <View style={styles.couchBase} />
        </View>

        <View style={styles.floorLamp}>
          <Animated.View style={[styles.lampShade, { backgroundColor: lampColor }]} />
          <View style={styles.lampStand} />
          <View style={styles.lampBase} />
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
  phoneWrapper: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.08,
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
    height: 50 * scale,
    backgroundColor: '#FFFFFF',
    borderRadius: 10 * scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWide: {
    flex: 1.5,
  },
  automationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10 * scale,
    padding: 12 * scale,
    marginTop: 4 * scale,
  },
  automationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8 * scale,
  },
  automationIcon: {
    width: 28 * scale,
    height: 28 * scale,
    borderRadius: 14 * scale,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14 * scale,
    paddingVertical: 8 * scale,
  },
  tabActiveContainer: {
    backgroundColor: '#FFFFFF',
    width: 28 * scale,
    height: 28 * scale,
    borderRadius: 14 * scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  furnitureContainer: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.15,
    bottom: 20 * scale,
    alignItems: 'center',
  },
  blinds: {
    width: 90 * scale,
    backgroundColor: 'rgba(139,115,85,0.1)',
    borderRadius: 4 * scale,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    paddingVertical: 2 * scale,
    gap: 2 * scale,
  },
  blindStripe: {
    width: '100%',
    height: 6 * scale,
    backgroundColor: '#8B7355',
    borderRadius: 1 * scale,
  },
  couchContainer: {
    marginTop: 10 * scale,
    alignItems: 'center',
  },
  couch: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 90 * scale,
    height: 30 * scale,
  },
  armrestLeft: {
    width: 14 * scale,
    height: 30 * scale,
    backgroundColor: '#5C5033',
    borderTopLeftRadius: 10 * scale,
    borderBottomLeftRadius: 4 * scale,
  },
  seat: {
    flex: 1,
    height: 22 * scale,
    backgroundColor: '#5C5033',
    borderTopLeftRadius: 4 * scale,
    borderTopRightRadius: 4 * scale,
  },
  armrestRight: {
    width: 14 * scale,
    height: 30 * scale,
    backgroundColor: '#5C5033',
    borderTopRightRadius: 10 * scale,
    borderBottomRightRadius: 4 * scale,
  },
  couchBase: {
    width: 70 * scale,
    height: 5 * scale,
    backgroundColor: '#3C3C28',
    borderBottomLeftRadius: 2 * scale,
    borderBottomRightRadius: 2 * scale,
  },
  floorLamp: {
    position: 'absolute',
    right: -20 * scale,
    bottom: 0,
    alignItems: 'center',
    height: 60 * scale,
  },
  lampShade: {
    width: 18 * scale,
    height: 14 * scale,
    borderTopLeftRadius: 2 * scale,
    borderTopRightRadius: 2 * scale,
    borderBottomLeftRadius: 9 * scale,
    borderBottomRightRadius: 9 * scale,
  },
  lampStand: {
    width: 2.5 * scale,
    height: 38 * scale,
    backgroundColor: '#8E8E93',
  },
  lampBase: {
    width: 12 * scale,
    height: 3 * scale,
    backgroundColor: '#8E8E93',
    borderRadius: 1.5 * scale,
  },
});

export default AutomateIllustration;
