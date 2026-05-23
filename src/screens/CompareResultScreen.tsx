import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList, Inspection, DecisionStatus } from '../types';
import { StorageService } from '../storage/storage';
import ProgressBar from '../components/ProgressBar';
import {
  getCompletionStats,
  getCompletionPercentage,
  getDecisionLabel,
  getPowertrainLabel,
} from '../utils/inspectionUtils';
import { formatDate } from '../utils/dateUtils';
import { generateComparisonPDF } from '../utils/pdfExport';
import { shareFile } from '../utils/shareUtils';

type Props = StackScreenProps<RootStackParamList, 'CompareResult'>;

// Column sizing
const LABEL_COLUMN_WIDTH = 100;

const DECISION_COLORS: Record<DecisionStatus, string> = {
  still_reviewing: '#64748B',
  ask_mechanic: '#3B82F6',
  request_info: '#60A5FA',
  considering: '#F59E0B',
  pass: '#EF4444',
  purchased: '#22C55E',
};

interface CompareRowProps {
  label: string;
  values: Array<React.ReactNode>;
  isAlt: boolean;
  vehicleCount: number;
}

function CompareRow({
  label,
  values,
  isAlt,
  vehicleCount,
}: CompareRowProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.tableRow,
        isAlt ? styles.tableRowAlt : styles.tableRowNormal,
      ]}
    >
      <View style={[styles.labelCell, { width: LABEL_COLUMN_WIDTH }]}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
      {values.map((val, idx) => (
        <View
          key={idx}
          style={[
            styles.valueCell,
            idx < vehicleCount - 1 && styles.valueCellBorder,
          ]}
        >
          {typeof val === 'string' || typeof val === 'number' ? (
            <Text style={styles.valueText}>{val}</Text>
          ) : (
            val
          )}
        </View>
      ))}
    </View>
  );
}

function CompareResultScreen({ route }: Props): React.JSX.Element {
  const { inspectionIds } = route.params;
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      StorageService.getInspections()
        .then((all) => {
          const filtered = inspectionIds
            .map((id) => all.find((i) => i.id === id))
            .filter((i): i is Inspection => i !== undefined);
          setInspections(filtered);
        })
        .finally(() => setLoading(false));
    }, [inspectionIds]),
  );

  async function handleExport(): Promise<void> {
    if (inspections.length === 0) return;
    setExporting(true);
    try {
      const filePath = await generateComparisonPDF(inspections);
      await shareFile(filePath, 'Vehicle Comparison');
    } catch {
      Alert.alert(
        'Export Failed',
        'Could not generate the comparison report. Please try again.',
      );
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (inspections.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="error-outline" size={48} color="#3A4055" />
        <Text style={styles.errorText}>No vehicles found for comparison.</Text>
      </View>
    );
  }

  const count = inspections.length;

  // Build vehicle display names
  const vehicleNames: Array<{ nickname: string; subtitle: string }> =
    inspections.map((insp) => {
      const v = insp.vehicle;
      const full = [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ');
      return {
        nickname: v.nickname || full || 'Unnamed Vehicle',
        subtitle: v.nickname && full ? full : '',
      };
    });

  // Helper: build a row's values
  function priceValue(insp: Inspection): React.ReactNode {
    const price = insp.vehicle.askingPrice;
    return (
      <Text style={styles.valueText}>
        {price ? `$${price}` : 'Not entered'}
      </Text>
    );
  }

  function odometerValue(insp: Inspection): React.ReactNode {
    const odo = insp.vehicle.odometer;
    return (
      <Text style={styles.valueText}>
        {odo ? `${odo} miles` : 'Not entered'}
      </Text>
    );
  }

  function completionValue(insp: Inspection): React.ReactNode {
    const pct = getCompletionPercentage(insp);
    return (
      <View style={styles.completionCell}>
        <Text style={styles.valueText}>{pct}%</Text>
        <ProgressBar progress={pct / 100} height={5} />
      </View>
    );
  }

  function criticalValue(insp: Inspection): React.ReactNode {
    const n = getCompletionStats(insp).critical;
    return (
      <Text style={[styles.valueText, n > 0 && { color: '#EF4444' }]}>
        {n}
      </Text>
    );
  }

  function concernValue(insp: Inspection): React.ReactNode {
    const n = getCompletionStats(insp).concern;
    return (
      <Text style={[styles.valueText, n > 0 && { color: '#F59E0B' }]}>
        {n}
      </Text>
    );
  }

  function notCheckedValue(insp: Inspection): React.ReactNode {
    const n = getCompletionStats(insp).notChecked;
    return (
      <Text style={[styles.valueText, n > 0 && { color: '#64748B' }]}>
        {n}
      </Text>
    );
  }

  function decisionValue(insp: Inspection): React.ReactNode {
    const color = DECISION_COLORS[insp.decisionStatus] ?? '#64748B';
    return (
      <Text style={[styles.valueText, { color }]}>
        {getDecisionLabel(insp.decisionStatus)}
      </Text>
    );
  }

  function notesValue(insp: Inspection): React.ReactNode {
    const notes = insp.vehicle.generalNotes;
    const preview = notes ? notes.slice(0, 80) : 'No notes';
    return (
      <Text style={[styles.valueText, !notes && { color: '#64748B' }]}>
        {preview}
        {notes && notes.length > 80 ? '...' : ''}
      </Text>
    );
  }

  interface RowDef {
    label: string;
    getValue: (insp: Inspection) => React.ReactNode;
  }

  const rows: RowDef[] = [
    {
      label: 'Price',
      getValue: priceValue,
    },
    {
      label: 'Odometer',
      getValue: odometerValue,
    },
    {
      label: 'Year',
      getValue: (insp) => (
        <Text style={styles.valueText}>{insp.vehicle.year || 'Not entered'}</Text>
      ),
    },
    {
      label: 'Powertrain',
      getValue: (insp) => (
        <Text style={styles.valueText}>
          {getPowertrainLabel(insp.vehicle.powertrainType)}
        </Text>
      ),
    },
    {
      label: 'Insp. Date',
      getValue: (insp) => (
        <Text style={styles.valueText}>
          {insp.vehicle.inspectionDate
            ? formatDate(insp.vehicle.inspectionDate)
            : 'Not entered'}
        </Text>
      ),
    },
    {
      label: 'Completion',
      getValue: completionValue,
    },
    {
      label: 'Critical',
      getValue: criticalValue,
    },
    {
      label: 'Concerns',
      getValue: concernValue,
    },
    {
      label: 'Not Checked',
      getValue: notCheckedValue,
    },
    {
      label: 'Decision',
      getValue: decisionValue,
    },
    {
      label: 'Notes',
      getValue: notesValue,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Vehicle header row */}
      <View style={styles.vehicleHeaderRow}>
        <View style={[styles.labelCell, { width: LABEL_COLUMN_WIDTH }]} />
        {inspections.map((insp, idx) => (
          <View
            key={insp.id}
            style={[
              styles.vehicleHeaderCell,
              idx < count - 1 && styles.valueCellBorder,
            ]}
          >
            <Text style={styles.vehicleNickname} numberOfLines={2}>
              {vehicleNames[idx].nickname}
            </Text>
            {vehicleNames[idx].subtitle ? (
              <Text style={styles.vehicleSubtitle} numberOfLines={2}>
                {vehicleNames[idx].subtitle}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Comparison table */}
      <View style={styles.table}>
        {rows.map((row, rowIdx) => {
          const values: React.ReactNode[] = inspections.map((insp) =>
            row.getValue(insp),
          );

          return (
            <CompareRow
              key={row.label}
              label={row.label}
              values={values}
              isAlt={rowIdx % 2 === 1}
              vehicleCount={count}
            />
          );
        })}
      </View>

      {/* Export button */}
      <TouchableOpacity
        style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
        onPress={handleExport}
        disabled={exporting}
        activeOpacity={0.85}
      >
        {exporting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" />
        )}
        <Text style={styles.exportButtonText}>
          {exporting ? 'Generating...' : 'Export Comparison PDF'}
        </Text>
      </TouchableOpacity>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        Comparison is based on your recorded observations only. This tool does
        not evaluate vehicle condition or recommend a purchase.
      </Text>
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
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1D21',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // Vehicle header
  vehicleHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#2D3340',
    borderBottomWidth: 1,
    borderBottomColor: '#3A4055',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  vehicleHeaderCell: {
    flex: 1,
    paddingHorizontal: 6,
  },
  vehicleNickname: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  vehicleSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Table
  table: {
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#3A4055',
  },
  tableRowNormal: {
    backgroundColor: '#1A1D21',
  },
  tableRowAlt: {
    backgroundColor: '#242830',
  },
  labelCell: {
    paddingRight: 8,
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  labelText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  valueCell: {
    flex: 1,
    paddingHorizontal: 6,
  },
  valueCellBorder: {
    borderRightWidth: 1,
    borderRightColor: '#3A4055',
  },
  valueText: {
    fontSize: 14,
    color: '#F1F5F9',
    flexWrap: 'wrap',
  },
  completionCell: {
    gap: 5,
    width: '100%',
  },

  // Export button
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    height: 50,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Disclaimer
  disclaimer: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});

export default CompareResultScreen;
