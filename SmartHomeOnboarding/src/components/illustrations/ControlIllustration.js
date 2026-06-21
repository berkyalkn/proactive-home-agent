import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SCREEN_WIDTH, scale } from '../../utils/dimensions';

const PHONE_WIDTH = 190 * scale;
const PHONE_HEIGHT = 320 * scale;
const CARD_WIDTH = 75 * scale;
const CARD_HEIGHT = 55 * scale;
const CARD_GAP = 8 * scale;
const CARD_RADIUS = 10 * scale;

const deviceCards = [
  { icon: 'bulb-outline', color: '#FF9500' },
  { icon: 'server-outline', color: '#3C3C43' },
  { icon: 'tv-outline', color: '#007AFF' },
  { icon: 'ellipse-outline', color: '#3C3C43' },
  { icon: 'grid-outline', color: '#34C759' },
  { icon: 'document-text-outline', color: '#FF2D55' },
  { icon: 'volume-medium-outline', color: '#3C3C43' },
];

const tabIcons = [
  'checkmark-circle-outline',
  'grid-outline',
  'list-outline',
  'play-circle-outline',
  'menu-outline',
];

const layersData = [
  { color: '#C8D8B0', opacity: 0.5, finalX: -36 * scale, finalY: 6 * scale, scaleW: 0.88, scaleH: 0.92 },
  { color: '#A8DCD1', opacity: 0.6, finalX: -24 * scale, finalY: 4 * scale, scaleW: 0.92, scaleH: 0.95 },
  { color: '#C4B8E8', opacity: 0.7, finalX: -12 * scale, finalY: 2 * scale, scaleW: 0.96, scaleH: 0.97 },
  { color: '#D4A898', opacity: 0.6, finalX: 24 * scale, finalY: 4 * scale, scaleW: 0.92, scaleH: 0.95 },
  { color: '#D4B896', opacity: 0.7, finalX: 12 * scale, finalY: 2 * scale, scaleW: 0.96, scaleH: 0.97 },
];

const ControlIllustration = ({ isActive, onAnimationComplete }) => {
  const bgAnim = useRef(new Animated.Value(0)).current;
  const layerAnims = useRef(layersData.map(() => new Animated.Value(0))).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isActive) {
      if (hasAnimated.current) {
        bgAnim.setValue(1);
        layerAnims.forEach(anim => anim.setValue(1));
        cardsAnim.setValue(1);
        if (onAnimationComplete) onAnimationComplete();
        return;
      }

      bgAnim.setValue(0);
      layerAnims.forEach(anim => anim.setValue(0));
      cardsAnim.setValue(0);

      Animated.sequence([
        Animated.delay(200),
        Animated.stagger(100, layerAnims.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          })
        )),
        Animated.timing(cardsAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Color interpolation requires JS driver — must run outside native sequence
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }).start(() => {
          hasAnimated.current = true;
          if (onAnimationComplete) onAnimationComplete();
        });
      });
    }
  }, [isActive]);

  const phoneBgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#B8E5E0', '#FF9500']
  });

  return (
    <View style={styles.container}>
      {/* Background colored layers */}
      {layersData.map((layer, index) => {
        const translateX = layerAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, layer.finalX]
        });
        const translateY = layerAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, layer.finalY]
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.layer,
              {
                width: PHONE_WIDTH * layer.scaleW,
                height: PHONE_HEIGHT * layer.scaleH,
                backgroundColor: layer.color,
                opacity: layer.opacity,
                transform: [
                  { translateX },
                  { translateY },
                ],
              },
            ]}
          />
        );
      })}

      {/* Phone mockup */}
      <Animated.View style={[styles.phone, { backgroundColor: phoneBgColor }]}>
        <View style={styles.phoneInner}>
          <View style={styles.cardGrid}>
            {deviceCards.map((device, index) => {
              const row = Math.floor(index / 2);
              const col = index % 2;
              
              const translateY = cardsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              });

              const isLast = index === 6;

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.card,
                    {
                      position: 'absolute',
                      top: row * (CARD_HEIGHT + CARD_GAP),
                      left: isLast ? 0 : col * (CARD_WIDTH + CARD_GAP),
                      opacity: cardsAnim,
                      transform: [{ translateY }]
                    },
                  ]}
                >
                  <Ionicons
                    name={device.icon}
                    size={22 * scale}
                    color={device.color}
                  />
                </Animated.View>
              );
            })}
          </View>

          <View style={styles.internalDots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.internalDot,
                  i === 0 ? styles.internalDotActive : styles.internalDotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.tabBar}>
          {tabIcons.map((icon, index) => (
            <Ionicons
              key={index}
              name={icon}
              size={18 * scale}
              color="rgba(255,255,255,0.7)"
            />
          ))}
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
  layer: {
    position: 'absolute',
    borderRadius: 28 * scale,
  },
  phone: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    borderRadius: 28 * scale,
    padding: 8 * scale,
    justifyContent: 'space-between',
    zIndex: 10,
    elevation: 10,
  },
  phoneInner: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20 * scale,
    padding: 10 * scale,
    overflow: 'hidden',
  },
  cardGrid: {
    flex: 1,
    position: 'relative',
    width: CARD_WIDTH * 2 + CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#F2F2F7',
    borderRadius: CARD_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  internalDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6 * scale,
    gap: 4 * scale,
  },
  internalDot: {
    width: 5 * scale,
    height: 5 * scale,
    borderRadius: 2.5 * scale,
  },
  internalDotActive: {
    backgroundColor: '#3C3C43',
  },
  internalDotInactive: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14 * scale,
    paddingVertical: 8 * scale,
    marginTop: 4 * scale,
  },
});

export default ControlIllustration;
