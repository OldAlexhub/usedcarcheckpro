import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type Props = StackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function PolicySection({ title, children }: SectionProps): React.JSX.Element {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 8,
  },
});

function Body({ children }: { children: string }): React.JSX.Element {
  return <Text style={bodyStyles.text}>{children}</Text>;
}

const bodyStyles = StyleSheet.create({
  text: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
  },
});

function PrivacyPolicyScreen(_props: Props): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

        <PolicySection title="1. Overview">
          <Body>
            {'Used Car Check Pro ("the app") is a free Android application developed by Old Alex Hub. This policy explains how the app handles information.'}
          </Body>
        </PolicySection>

        <PolicySection title="2. Information We Collect">
          <Body>
            {'The app does not collect or transmit your personal information to any server operated by Old Alex Hub. All inspection records you create are stored locally on your device.'}
          </Body>
          <Text style={styles.spacer} />
          <Body>
            {'The app uses Google AdMob to display advertisements. AdMob may collect device identifiers, usage data, and ad interaction data as described in Google\'s Privacy Policy. This data is processed by Google, not by Old Alex Hub.'}
          </Body>
        </PolicySection>

        <PolicySection title="3. Advertising">
          <Body>
            {'The app is free and supported by advertising. Google AdMob displays ads on selected screens. AdMob may show personalized ads based on your Google account settings and device data. You can manage ad personalization in your Google account settings.'}
          </Body>
          <Text style={styles.spacer} />
          <Body>
            {'For more information about how Google uses data when you use our app, visit: google.com/policies/privacy/partners'}
          </Body>
        </PolicySection>

        <PolicySection title="4. Your Inspection Data">
          <Body>
            {'All inspection data you enter (vehicle details, checklist responses, notes) is stored locally on your device using Android local storage. This data is not transmitted to any server by Old Alex Hub.'}
          </Body>
          <Text style={styles.spacer} />
          <Body>
            {'If you use the export or share feature, your data will be shared in the format and with the app you choose. We have no control over data you choose to share.'}
          </Body>
        </PolicySection>

        <PolicySection title="5. Internet Permission">
          <Body>
            {'The app requires the INTERNET permission solely for loading and displaying advertisements from Google AdMob, and for ad-related privacy messaging required by Google.'}
          </Body>
        </PolicySection>

        <PolicySection title="6. Permissions">
          <Body>
            {'The app requests only the INTERNET permission. It does not request camera, microphone, location, contacts, storage, or any other sensitive permissions.'}
          </Body>
        </PolicySection>

        <PolicySection title="7. Data Deletion">
          <Body>
            {'You can delete all locally stored inspection data at any time in Settings. You can also clear all app data through Android settings under Apps.'}
          </Body>
        </PolicySection>

        <PolicySection title="8. Children">
          <Body>
            {'The app is not directed at children under 13. We do not knowingly collect information from children.'}
          </Body>
        </PolicySection>

        <PolicySection title="9. Changes">
          <Body>
            {'We may update this policy. Continued use of the app after changes constitutes acceptance.'}
          </Body>
        </PolicySection>

        <PolicySection title="10. Contact">
          <Body>
            {'For questions about this policy, contact: mohamedgad.gm@gmail.com'}
          </Body>
        </PolicySection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1D21',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 28,
  },
  spacer: {
    height: 10,
  },
});

export default PrivacyPolicyScreen;
