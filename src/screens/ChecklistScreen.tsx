import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Inspection, ChecklistItemData } from '../types';
import { StorageService } from '../storage/storage';
import ProgressBar from '../components/ProgressBar';
import ChecklistItemRow from '../components/ChecklistItemRow';

type Props = StackScreenProps<RootStackParamList, 'Checklist'>;

function ChecklistScreen({ navigation, route }: Props): React.JSX.Element {
  const { inspectionId, sectionIndex, totalSections } = route.params;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Keep a mutable ref of the inspection so callbacks always access the latest version
  const inspectionRef = useRef<Inspection | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    StorageService.getInspection(inspectionId).then((result) => {
      if (cancelled) return;
      if (!result) {
        setNotFound(true);
      } else {
        inspectionRef.current = result;
        setInspection(result);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [inspectionId, sectionIndex]);

  const handleItemUpdate = useCallback(
    (updatedItem: ChecklistItemData) => {
      const current = inspectionRef.current;
      if (!current) return;

      const updatedSections = current.sections.map((section, idx) => {
        if (idx !== sectionIndex) return section;
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === updatedItem.id ? updatedItem : item,
          ),
        };
      });

      const updatedInspection: Inspection = {
        ...current,
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
      };

      inspectionRef.current = updatedInspection;
      setInspection(updatedInspection);
      StorageService.saveInspection(updatedInspection);
    },
    [sectionIndex],
  );

  const handlePrevious = useCallback(() => {
    if (sectionIndex === 0) {
      navigation.goBack();
    } else {
      navigation.navigate('Checklist', {
        inspectionId,
        sectionIndex: sectionIndex - 1,
        totalSections,
      });
    }
  }, [navigation, inspectionId, sectionIndex, totalSections]);

  const handleNext = useCallback(() => {
    if (sectionIndex < totalSections - 1) {
      navigation.navigate('Checklist', {
        inspectionId,
        sectionIndex: sectionIndex + 1,
        totalSections,
      });
    } else {
      navigation.navigate('InspectionSummary', {
        inspectionId,
        isNew: true,
      });
    }
  }, [navigation, inspectionId, sectionIndex, totalSections]);

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading checklist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !inspection) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Inspection Not Found</Text>
          <Text style={styles.errorMessage}>
            This inspection could not be loaded.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const section = inspection.sections[sectionIndex];

  if (!section) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Section Not Found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isLastSection = sectionIndex === totalSections - 1;
  const progressValue = (sectionIndex + 1) / totalSections;

  const ListHeader = (
    <View style={styles.listHeader}>
      <View style={styles.sectionInfoRow}>
        <Text style={styles.sectionCounter}>
          Section {sectionIndex + 1} of {totalSections}
        </Text>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      <View style={styles.progressContainer}>
        <ProgressBar progress={progressValue} height={6} showLabel />
      </View>
      {section.items.length === 0 ? (
        <Text style={styles.emptySection}>No items in this section.</Text>
      ) : (
        <Text style={styles.itemCount}>
          {section.items.length} item{section.items.length !== 1 ? 's' : ''} to check
        </Text>
      )}
    </View>
  );

  const ListFooter = <View style={styles.listFooter} />;

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={section.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChecklistItemRow item={item} onUpdate={handleItemUpdate} />
        )}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {/* Bottom navigation bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.prevButton}
          onPress={handlePrevious}
          activeOpacity={0.8}
        >
          <Text style={styles.prevButtonText}>
            {sectionIndex === 0 ? 'Back' : 'Previous'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {isLastSection ? 'Finish' : 'Next Section'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1D21',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  errorTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 16,
  },
  sectionInfoRow: {
    marginBottom: 10,
  },
  sectionCounter: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  progressContainer: {
    marginBottom: 10,
  },
  itemCount: {
    fontSize: 13,
    color: '#94A3B8',
  },
  emptySection: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  listFooter: {
    height: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#242830',
    borderTopWidth: 1,
    borderTopColor: '#3A4055',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    gap: 12,
  },
  prevButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A4055',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D3340',
  },
  prevButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ChecklistScreen;
