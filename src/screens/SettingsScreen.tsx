import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../types';
import { StorageService } from '../storage/storage';
import { APP_NAME, APP_VERSION, DEVELOPER } from '../config/constants';
import ConfirmDialog from '../components/ConfirmDialog';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Settings'>,
  StackScreenProps<RootStackParamList>
>;

interface RowItem {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  labelColor?: string;
}

function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return (
    <View style={sectionHeaderStyles.wrapper}>
      <Text style={sectionHeaderStyles.text}>{title}</Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

function SectionCard({ rows }: { rows: RowItem[] }): React.JSX.Element {
  return (
    <View style={cardStyles.card}>
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        const content = (
          <View style={[cardStyles.row, isLast ? cardStyles.rowLast : null]}>
            <Text
              style={[
                cardStyles.label,
                row.labelColor ? { color: row.labelColor } : null,
              ]}
            >
              {row.label}
            </Text>
            <View style={cardStyles.rightSide}>
              {row.value ? (
                <Text style={cardStyles.value} numberOfLines={3}>
                  {row.value}
                </Text>
              ) : null}
              {row.showChevron ? (
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color="#64748B"
                  style={cardStyles.chevron}
                />
              ) : null}
            </View>
          </View>
        );

        if (row.onPress) {
          return (
            <TouchableOpacity key={row.label} onPress={row.onPress} activeOpacity={0.7}>
              {content}
            </TouchableOpacity>
          );
        }
        return <View key={row.label}>{content}</View>;
      })}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#242830',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A4055',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A4055',
    minHeight: 52,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 15,
    color: '#F1F5F9',
    flex: 1,
    marginRight: 8,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '55%',
  },
  value: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'right',
  },
  chevron: {
    marginLeft: 4,
    flexShrink: 0,
  },
});

function SettingsScreen({ navigation }: Props): React.JSX.Element {
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  function handleAboutAdvertising(): void {
    Alert.alert(
      'About Advertising',
      'This app shows ads provided by Google AdMob on some screens. Ads support keeping the app free. You can manage ad personalization in your Google account settings. Ads may use device identifiers. Your inspection data is never used for advertising.',
      [{ text: 'OK' }],
    );
  }

  function handleDisclaimer(): void {
    Alert.alert(
      'Disclaimer',
      'Used Car Check Pro is an organization and observation tool to help you record your findings during a used car inspection. It does not replace a professional mechanical inspection, vehicle history report, title check, recall check, or independent safety evaluation. It does not certify any vehicle, confirm safety, detect hidden defects, determine value, or recommend a purchase. Always consider a professional pre-purchase inspection before buying.',
      [{ text: 'OK' }],
    );
  }

  async function handleClearData(): Promise<void> {
    setClearDialogVisible(false);
    await StorageService.clearAllData();
    Alert.alert('All data cleared.', '', [
      {
        text: 'OK',
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          });
        },
      },
    ]);
  }

  const aboutRows: RowItem[] = [
    { label: 'App', value: APP_NAME },
    { label: 'Version', value: APP_VERSION },
    { label: 'Developer', value: DEVELOPER },
  ];

  const privacyRows: RowItem[] = [
    {
      label: 'Privacy Policy',
      onPress: () => navigation.navigate('PrivacyPolicy'),
      showChevron: true,
    },
    {
      label: 'About Advertising',
      onPress: handleAboutAdvertising,
      showChevron: true,
    },
    {
      label: 'app-ads.txt',
      value: 'Publisher ID: pub-7831002909037560',
    },
  ];

  const dataRows: RowItem[] = [
    {
      label: 'Clear All Data',
      onPress: () => setClearDialogVisible(true),
      showChevron: true,
      labelColor: '#EF4444',
    },
  ];

  const infoRows: RowItem[] = [
    {
      label: 'Disclaimer',
      onPress: handleDisclaimer,
      showChevron: true,
    },
    {
      label: 'Permissions',
      value:
        'This app uses the INTERNET permission for advertising. No other permissions are required or requested.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Settings</Text>

        <SectionHeader title="About" />
        <SectionCard rows={aboutRows} />

        <SectionHeader title="Privacy and Ads" />
        <SectionCard rows={privacyRows} />

        <SectionHeader title="Data" />
        <SectionCard rows={dataRows} />

        <SectionHeader title="Additional Information" />
        <SectionCard rows={infoRows} />

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ConfirmDialog
        visible={clearDialogVisible}
        title="Clear All Data"
        message="This will permanently delete all saved inspections and reset all settings. This action cannot be undone."
        confirmLabel="Clear All"
        confirmColor="#EF4444"
        onConfirm={handleClearData}
        onCancel={() => setClearDialogVisible(false)}
      />
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
  scrollContent: {
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  bottomPadding: {
    height: 32,
  },
});

export default SettingsScreen;
