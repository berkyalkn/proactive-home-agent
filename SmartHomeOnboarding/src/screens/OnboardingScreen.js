import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { onboardingData } from '../data/onboardingData';
import { SCREEN_WIDTH } from '../utils/dimensions';
import OnboardingSlide from '../components/OnboardingSlide';
import Pagination from '../components/Pagination';

// Illustration components
import ControlIllustration from '../components/illustrations/ControlIllustration';
import ServicesIllustration from '../components/illustrations/ServicesIllustration';
import AutomateIllustration from '../components/illustrations/AutomateIllustration';
import FavoritesIllustration from '../components/illustrations/FavoritesIllustration';

const illustrationMap = {
  control: ControlIllustration,
  services: ServicesIllustration,
  automate: AutomateIllustration,
  favorites: FavoritesIllustration,
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const OnboardingScreen = ({ navigation }) => {
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const scrollX = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0.4)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (!isAnimating) {
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 0.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAnimating]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const onMomentumScrollEnd = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (activeIndex !== index) {
      setActiveIndex(index);
      setIsAnimating(true);
    }
  };

  const handleNext = () => {
    if (activeIndex < onboardingData.length - 1) {
      const nextIndex = activeIndex + 1;
      setIsAnimating(true);
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      const prevIndex = activeIndex - 1;
      setIsAnimating(true);
      setActiveIndex(prevIndex);
      flatListRef.current?.scrollToIndex({
        index: prevIndex,
        animated: true,
      });
    } else {
      navigation.replace('Splash');
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    navigation.replace('LoginRegister');
  };

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const renderItem = ({ item, index }) => {
    const IllustrationComp = illustrationMap[item.illustration];
    const isActive = index === activeIndex;

    return (
      <OnboardingSlide
        title={item.title}
        subtitle={item.subtitle}
        titleAlign={item.titleAlign}
        IllustrationComponent={IllustrationComp}
        scrollX={scrollX}
        index={index}
        isActive={isActive}
        onAnimationComplete={handleAnimationComplete}
      />
    );
  };

  const isLastSlide = activeIndex === onboardingData.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipTopButton}>
          <Text style={styles.skipTopText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <View style={styles.bottomContainer}>
        <Pagination totalDots={4} activeIndex={activeIndex} />
        
        <View style={styles.buttonsRow}>
          <AnimatedTouchable
            onPress={handleBack}
            style={[
              styles.navButton, 
              styles.backButton, 
              { opacity: buttonOpacity, transform: [{ scale: buttonScale }] }
            ]}
            activeOpacity={0.7}
            disabled={isAnimating}
          >
            <Text style={[styles.navButtonText, styles.backButtonText]}>Back</Text>
          </AnimatedTouchable>

          <AnimatedTouchable
            onPress={handleNext}
            style={[
              styles.navButton, 
              styles.nextButton, 
              { opacity: buttonOpacity, transform: [{ scale: buttonScale }] }
            ]}
            activeOpacity={0.7}
            disabled={isAnimating}
          >
            <Text style={[styles.navButtonText, styles.nextButtonText]}>
              {isLastSlide ? 'Start' : 'Next'}
            </Text>
          </AnimatedTouchable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  skipTopButton: {
    padding: 8,
  },
  skipTopText: {
    ...typography.navButton,
    color: colors.subtitleGray,
    fontWeight: '600',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  navButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(28, 28, 30, 0.08)', // Soft gray fill
  },
  nextButton: {
    backgroundColor: colors.buttonPrimary,
    shadowColor: colors.buttonPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  navButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  backButtonText: {
    color: colors.buttonPrimary,
  },
  nextButtonText: {
    color: '#EDE8DF',
  },
});

export default OnboardingScreen;
