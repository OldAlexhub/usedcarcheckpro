import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
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
import VehicleCard from '../components/VehicleCard';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import BannerAdWrapper from '../components/BannerAdWrapper';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Saved'>,
  StackScreenProps<RootStackParamList>
>;

function SavedInspectionsScreen({ navigation }: Props): React.JSX.Element {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
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

  function handleDeletePress(id: string): void {
    setDeleteTargetId(id);
    setDeleteDialogVisible(true);
  }

  function handleDeleteCancel(): void {
    setDeleteDialogVisible(false);
    setDeleteTargetId(null);
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!deleteTargetId) return;
    setDeleteDialogVisible(false);
    await StorageService.deleteInspection(deleteTargetId);
    setDeleteTargetId(null);
    // Reload the list
    const all = await StorageService.getInspections();
    const sorted = [...all].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    setInspections(sorted);
  }

  const deleteTarget = deleteTargetId
    ? inspections.find((i) => i.id === deleteTargetId)
    : null;

  const deleteTargetName = deleteTarget
    ? deleteTarget.vehicle.nickname ||
      [
        deleteTarget.vehicle.year,
        deleteTarget.vehicle.make,
        deleteTarget.vehicle.model,
      ]
        .filter(Boolean)
        .join(' ') ||
      'this inspection'
    : 'this inspection';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.root}>
        {/* Custom header */}
        <View style={styles.header}>
          <View style={styles.headerIconRow}>
            <MaterialIcons name="bookmark" size={22} color="#3B82F6" />
            <Text style={styles.headerTitle}>Saved Inspections</Text>
          </View>
          {!loading ? (
            <Text style={styles.headerCount}>
              {inspections.length === 1
                ? '1 inspection saved'
                : `${inspections.length} inspections saved`}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : inspections.length === 0 ? (
          <EmptyState
            icon="bookmark-border"
            message="No saved inspections"
            subMessage="Complete an inspection to see it here."
          />
        ) : (
          <FlatList
            data={inspections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VehicleCard
                inspection={item}
                onPress={() =>
                  navigation.navigate('InspectionSummary', {
                    inspectionId: item.id,
                    isNew: false,
                  })
                }
                showDeleteButton
                onDelete={() => handleDeletePress(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <BannerAdWrapper />
      </View>

      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Inspection"
        message={`Are you sure you want to delete the inspection for "${deleteTargetName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmColor="#EF4444"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
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
    backgroundColor: '#1A1D21',
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  headerCount: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  loadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
});

export default SavedInspectionsScreen;
