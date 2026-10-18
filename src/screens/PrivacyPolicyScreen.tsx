import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: October 18, 2026</Text>

        <PolicySection title="1. Overview">
          <Body>
            {
              'Used Car Check Pro ("the app") is a free Android application developed by Old Alex Hub. This policy explains how the app handles information.'
            }
          </Body>
        </PolicySection>

        <PolicySection title="2. Information We Collect">
          <Body>
            {
              'Your full inspection record remains on your device. After you accept the data-use disclosure, the app sends Old Alex Hub a structured inspection-outcomes record containing vehicle year, make, model and trim; powertrain; seller category; odometer and asking-price ranges; checklist item statuses; and decision status.'
            }
          </Body>
          <Text style={styles.spacer} />
          <Body>
            {
              'The dataset never includes the VIN, vehicle nickname, listing URL, seller name, free-text notes, precise location, or photos. The app also sends allowlisted product events, app version, platform, and a random installation identifier. Arbitrary text is not accepted by these endpoints.'
            }
          </Body>
          <Text style={styles.spacer} />
          <Body>
            {
              'If you enter a complete VIN, the app sends it to proveh.server.oldalexhub.com and the NHTSA vehicle-data service. Proveh caches a one-way VIN hash and decoded attributes for up to 30 days, not the raw VIN. Infrastructure may temporarily process IP address, request time, and errors for security and reliability.'
            }
          </Body>
          <Text style={styles.spacer} />
          <Body>
            {
              "Google AdMob may separately collect device identifiers, usage data, and ad interaction data under Google's policies."
            }
          </Body>
        </PolicySection>

        <PolicySection title="3. Advertising">
          <Body>
            {
              'The app is free and supported by advertising. Google AdMob displays ads on selected screens. AdMob may show personalized ads based on your Google account settings and device data. You can manage ad personalization in your Google account settings.'
            }
          </Body>
          <Text style={styles.spacer} />
          <Body>
            {
              'For more information about how Google uses data when you use our app, visit: google.com/policies/privacy/partners'
            }
          </Body>
        </PolicySection>

        <PolicySection title="4. Product Dataset and Your Inspection Data">
          <Body>
            {
              'Old Alex Hub uses the pseudonymous dataset only for product analysis, product improvement, and future features built with open-source technology. No LLM is used. We do not sell this dataset, license it to others, or share it for third-party marketing. Inspection outcomes are retained for up to five years and product events for up to one year.'
            }
          </Body>
          <Text style={styles.spacer} />
          <Body>
            {
              'Your complete inspection, including exact price, odometer, VIN, seller details, and notes, remains local. If you export or share it, data goes only to the app and recipient you choose.'
            }
          </Body>
        </PolicySection>

        <PolicySection title="5. Internet Permission">
          <Body>
            {
              'The app uses the INTERNET permission for Google AdMob, related privacy messaging, VIN lookup, and secure delivery of the limited product dataset and events to Proveh Server.'
            }
          </Body>
        </PolicySection>

        <PolicySection title="6. Permissions">
          <Body>
            {
              'The app requests only the INTERNET permission. It does not request camera, microphone, location, contacts, storage, or any other sensitive permissions.'
            }
          </Body>
        </PolicySection>

        <PolicySection title="7. Data Deletion">
          <Body>
            {
              'Settings > Clear All Data deletes local inspections and sends an authenticated request to delete the product dataset and events associated with this anonymous installation. If you are offline, the request is queued and collection pauses until deletion succeeds. VIN cache entries expire automatically after 30 days.'
            }
          </Body>
        </PolicySection>

        <PolicySection title="8. Children">
          <Body>
            {
              'The app is not directed at children under 13. We do not knowingly collect information from children.'
            }
          </Body>
        </PolicySection>

        <PolicySection title="9. Changes">
          <Body>
            {
              'We may update this policy. Continued use of the app after changes constitutes acceptance.'
            }
          </Body>
        </PolicySection>

        <PolicySection title="10. Contact">
          <Body>
            {'For questions about this policy, contact: info@oldalexhub.com'}
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
