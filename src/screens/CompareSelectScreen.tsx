import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList, RootStackParamList, Inspection } from '../types';
import { StorageService } from '../storage/storage';
import EmptyState from '../components/EmptyState';
import BannerAdWrapper from '../components/BannerAdWrapper';
import { getCompletionStats, getDecisionLabel } from '../utils/inspectionUtils';
import { formatDate } from '../utils/dateUtils';

const MAX_SELECTIONS = 3;

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Compare'>,
  StackScreenProps<RootStackParamList>
>;

function CompareSelectScreen({ navigation }: Props): React.JSX.Element {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setSelectedIds([]);
      StorageService.getInspections()
        .then((all) => {
          const sorted = [...all].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
          setInspections(sorted);
        })
        .finally(() => setLoading(false));
    }, []),
  );

  function toggleSelect(id: string): void {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_SELECTIONS) {
        return prev;
      }
      return [...prev, id];
    });
  }

  function handleCompare(): void {
    if (selectedIds.length >= 2) {
      navigation.navigate('CompareResult', { inspectionIds: selectedIds });
    }
  }

  const canCompare = selectedIds.length >= 2;
  const atMax = selectedIds.length >= MAX_SELECTIONS;

  function renderItem({ item }: { item: Inspection }): React.JSX.Element {
    const isSelected = selectedIds.includes(item.id);
    const isDisabled = atMax && !isSelected;

    const vehicleLine = [
      item.vehicle.year,
      item.vehicle.make,
      item.vehicle.model,
      item.vehicle.trim,
    ]
      .filter(Boolean)
      .join(' ');

    const displayName =
      item.vehicle.nickname || vehicleLine || 'Unnamed Vehicle';

    const displayDate = item.vehicle.inspectionDate
      ? formatDate(item.vehicle.inspectionDate)
      : formatDate(item.createdAt);

    const stats = getCompletionStats(item);
    const decisionLabel = getDecisionLabel(item.decisionStatus);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          isDisabled && styles.cardDisabled,
        ]}
        onPress={() => !isDisabled && toggleSelect(item.id)}
        activeOpacity={isDisabled ? 1 : 0.75}
        disabled={isDisabled}
      >
        <View style={styles.cardInner}>
          {/* Checkbox column */}
          <View style={styles.checkboxArea}>
            <View
              style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
              ]}
            >
              {isSelected ? (
                <MaterialIcons name="check" size={14} color="#FFFFFF" />
              ) : null}
            </View>
          </View>

          {/* Content column */}
          <View style={styles.cardContent}>
            <Text
              style={[styles.cardName, isDisabled && styles.textDisabled]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {vehicleLine && vehicleLine !== displayName ? (
              <Text
                style={[styles.cardVehicleLine, isDisabled && styles.textDisabled]}
                numberOfLines={1}
              >
                {vehicleLine}
              </Text>
            ) : null}
            {displayDate ? (
              <Text
                style={[styles.cardDate, isDisabled && styles.textDisabled]}
              >
                {displayDate}
              </Text>
            ) : null}

            <View style={styles.cardStatsRow}>
              {stats.critical > 0 ? (
                <View style={styles.statChip}>
                  <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={[styles.statChipText, { color: '#EF4444' }]}>
                    {stats.critical} Critical
                  </Text>
                </View>
              ) : null}
              {stats.concern > 0 ? (
                <View style={styles.statChip}>
                  <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={[styles.statChipText, { color: '#F59E0B' }]}>
                    {stats.concern} Concern
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.decisionText, isDisabled && styles.textDisabled]}>
                {decisionLabel}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.root}>
        {/* Custom header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Compare Vehicles</Text>
          <Text style={styles.headerSub}>Select 2 or 3 vehicles to compare</Text>
        </View>

        {/* Selection counter */}
        {!loading && inspections.length > 0 ? (
          <View style={styles.counterRow}>
            <Text style={styles.counterText}>
              {selectedIds.length} / {MAX_SELECTIONS} selected
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : inspections.length < 2 ? (
          <EmptyState
            icon="compare-arrows"
            message="No inspections to compare"
            subMessage="Save at least 2 inspections to use the compare feature."
          />
        ) : (
          <FlatList
            data={inspections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Compare button */}
        {!loading && inspections.length >= 2 ? (
          <TouchableOpacity
            style={[
              styles.compareButton,
              !canCompare && styles.compareButtonDisabled,
            ]}
            onPress={handleCompare}
            disabled={!canCompare}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name="compare-arrows"
              size={20}
              color={canCompare ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.compareButtonText,
                !canCompare && styles.compareButtonTextDisabled,
              ]}
            >
              Compare Selected
            </Text>
          </TouchableOpacity>
        ) : null}

        <BannerAdWrapper />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1D21',
  },
  root: {
    flex: 1,
    backgroundColor: '#1A1D21',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A4055',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  counterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3A4055',
  },
  counterText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  loadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    backgroundColor: '#242830',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3A4055',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#1B2C45',
  },
  cardDisabled: {
    opacity: 0.4,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
  },
  checkboxArea: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#3A4055',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  cardVehicleLine: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  decisionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  textDisabled: {
    color: '#64748B',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    height: 50,
    borderRadius: 12,
  },
  compareButtonDisabled: {
    backgroundColor: '#2D3340',
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  compareButtonTextDisabled: {
    color: '#64748B',
  },
});

export default CompareSelectScreen;
