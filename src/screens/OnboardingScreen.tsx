import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { StorageService } from '../storage/storage';
import { DataCollectionService } from '../services/dataCollection';

type Props = StackScreenProps<RootStackParamList, 'Onboarding'>;

const SLIDE_COUNT = 3;

function SlideWelcome(): React.JSX.Element {
  return (
    <View style={slideStyles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={slideStyles.logo}
        resizeMode="contain"
      />
      <Text style={slideStyles.appName}>Used Car Check Pro</Text>
      <Text style={slideStyles.tagline}>Inspect smarter before you buy.</Text>
      <Text style={slideStyles.developer}>by Old Alex Hub</Text>
    </View>
  );
}

function SlideNotice(): React.JSX.Element {
  return (
    <View style={slideStyles.container}>
      <MaterialIcons name="info-outline" size={64} color="#F59E0B" />
      <Text style={slideStyles.slideTitle}>Important Notice</Text>
      <ScrollView
        style={slideStyles.bodyScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={slideStyles.bodyText}>
          Used Car Check Pro is an organization and observation tool to help you
          record your findings during a used car inspection.
        </Text>
        <Text style={slideStyles.bodyText}>
          This app does not replace a professional mechanical inspection,
          vehicle history report, title check, recall check, or independent
          safety evaluation.
        </Text>
        <Text style={slideStyles.bodyText}>
          It does not certify any vehicle, confirm safety, detect hidden
          defects, determine value, or recommend a purchase.
        </Text>
        <Text style={slideStyles.bodyText}>
          Always consider a professional pre-purchase inspection before buying.
        </Text>
      </ScrollView>
    </View>
  );
}

function SlideDataUse(): React.JSX.Element {
  return (
    <View style={slideStyles.container}>
      <MaterialIcons name="dataset" size={64} color="#3B82F6" />
      <Text style={slideStyles.slideTitle}>Data Use and Advertising</Text>
      <ScrollView
        style={slideStyles.bodyScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={slideStyles.bodyText}>
          Old Alex Hub uses a limited, pseudonymous inspection-outcomes dataset
          to analyze and improve this product and develop future features using
          open-source technology. No LLMs are used.
        </Text>
        <Text style={slideStyles.bodyText}>
          It includes vehicle year, make, model and trim; powertrain and seller
          category; price and odometer ranges; checklist statuses; and your
          decision. It never includes your VIN, nickname, listing URL, seller
          name, written notes, precise location, or photos.
        </Text>
        <Text style={slideStyles.bodyText}>
          Data is used only by Old Alex Hub for product analysis and feature
          development. We do not sell it or share it for third-party marketing.
          You can delete collected data from Settings.
        </Text>
        <Text style={slideStyles.bodyText}>
          VIN lookup sends the VIN to Proveh Server and NHTSA. Google AdMob
          separately processes advertising data under Google&apos;s policies. By
          tapping Agree &amp; Get Started, you accept this data use.
        </Text>
      </ScrollView>
    </View>
  );
}

function OnboardingScreen({ navigation }: Props): React.JSX.Element {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    StorageService.getSettings().then(settings => {
      if (settings.hasCompletedOnboarding && !settings.hasAcceptedDataUse) {
        setCurrentSlide(SLIDE_COUNT - 1);
      }
    });
  }, []);

  async function handleGetStarted(): Promise<void> {
    const settings = await StorageService.getSettings();
    await StorageService.saveSettings({
      ...settings,
      hasCompletedOnboarding: true,
      hasAcceptedDataUse: true,
    });
    DataCollectionService.trackEvent('onboarding_completed');
    navigation.replace('MainTabs');
  }

  function handleNext(): void {
    if (currentSlide < SLIDE_COUNT - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleGetStarted();
    }
  }

  function handleSkip(): void {
    setCurrentSlide(SLIDE_COUNT - 1);
  }

  function renderSlide(): React.JSX.Element {
    switch (currentSlide) {
      case 0:
        return <SlideWelcome />;
      case 1:
        return <SlideNotice />;
      case 2:
        return <SlideDataUse />;
      default:
        return <SlideWelcome />;
    }
  }

  const isLastSlide = currentSlide === SLIDE_COUNT - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.slideArea}>{renderSlide()}</View>

      <View style={styles.bottomArea}>
        <View style={styles.dotsRow}>
          {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Agree & Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        {!isLastSlide ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
}

const slideStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F1F5F9',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  developer: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F1F5F9',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  bodyScroll: {
    width: '100%',
  },
  bodyText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
    textAlign: 'left',
    marginBottom: 14,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1D21',
  },
  slideArea: {
    flex: 1,
  },
  bottomArea: {
    paddingHorizontal: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#3A4055',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#F1F5F9',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: '#64748B',
    fontSize: 15,
  },
  skipPlaceholder: {
    height: 40,
    marginTop: 16,
  },
});

export default OnboardingScreen;
