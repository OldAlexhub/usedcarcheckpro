import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList, Inspection } from '../types';
import { StorageService } from '../storage/storage';
import VehicleCard from '../components/VehicleCard';
import EmptyState from '../components/EmptyState';
import BannerAdWrapper from '../components/BannerAdWrapper';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  StackScreenProps<RootStackParamList>
>;

function HomeScreen({ navigation }: Props): React.JSX.Element {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      StorageService.getInspections()
        .then((all) => {
          const sorted = [...all].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
          setInspections(sorted);
        })
        .finally(() => setLoading(false));
    }, []),
  );

  const recentInspections = inspections.slice(0, 3);
  const hasMore = inspections.length > 3;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Used Car Check Pro</Text>
        </View>

        <Text style={styles.tagline}>Inspect smarter before you buy.</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('VehicleDetails', {})}
        >
          <Text style={styles.primaryButtonText}>Start New Inspection</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : inspections.length === 0 ? (
          <EmptyState
            icon="directions-car"
            message="No inspections yet"
            subMessage="Tap Start New Inspection to begin."
          />
        ) : (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Inspections</Text>
            {recentInspections.map((inspection) => (
              <VehicleCard
                key={inspection.id}
                inspection={inspection}
                onPress={() =>
                  navigation.navigate('InspectionSummary', {
                    inspectionId: inspection.id,
                  })
                }
              />
            ))}
            {hasMore ? (
              <TouchableOpacity
                style={styles.viewAllButton}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MainTabs')}
              >
                <Text style={styles.viewAllText}>View All Saved</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>

      <BannerAdWrapper />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1D21',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F1F5F9',
    flexShrink: 1,
  },
  tagline: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  primaryButtonText: {
    color: '#F1F5F9',
    fontSize: 17,
    fontWeight: '700',
  },
  loadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  recentSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  viewAllText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default HomeScreen;
