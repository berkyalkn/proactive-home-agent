import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { SCREEN_WIDTH } from '../utils/dimensions';

const OnboardingSlide = ({ 
  title, 
  subtitle, 
  titleAlign, 
  IllustrationComponent, 
  scrollX, 
  index,
  isActive,
  onAnimationComplete
}) => {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const translateY = scrollX ? scrollX.interpolate({
    inputRange,
    outputRange: [50, 0, 50],
    extrapolate: 'clamp',
  }) : 0;

  const opacity = scrollX ? scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  }) : 1;

  const scale = scrollX ? scrollX.interpolate({
    inputRange,
    outputRange: [0.8, 1, 0.8],
    extrapolate: 'clamp',
  }) : 1;

  return (
    <View style={[styles.container, { width: SCREEN_WIDTH }]}>
      <Animated.View style={[styles.textContainer, { opacity, transform: [{ translateY }] }]}>
        <Text
          style={[
            styles.title,
            { textAlign: titleAlign || 'left' },
          ]}
        >
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>

      <Animated.View style={[styles.illustrationContainer, { opacity, transform: [{ scale }] }]}>
        {IllustrationComponent && (
          <IllustrationComponent 
            isActive={isActive} 
            onAnimationComplete={onAnimationComplete} 
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textContainer: {
    paddingTop: spacing.titleMarginTop,
    paddingHorizontal: spacing.titlePaddingHorizontal,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.subtitle,
    marginTop: spacing.subtitleMarginTop,
    paddingHorizontal: 26,
    textAlign: 'center',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
});

export default OnboardingSlide;
