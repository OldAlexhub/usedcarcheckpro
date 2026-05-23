import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RootStackParamList,
  Inspection,
  DecisionStatus,
  ChecklistItemData,
} from '../types';
import { StorageService } from '../storage/storage';
import {
  getCompletionStats,
  getCompletionPercentage,
  getCriticalItems,
  getConcernItems,
  getNotCheckedItems,
  getDecisionLabel,
  getPowertrainLabel,
} from '../utils/inspectionUtils';
import { formatDate } from '../utils/dateUtils';
import { generateInspectionPDF } from '../utils/pdfExport';
import { shareFile } from '../utils/shareUtils';
import { exportInspectionJSON } from '../utils/jsonExport';
import { tryShowInterstitial } from '../config/admob';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';

type Props = StackScreenProps<RootStackParamList, 'InspectionSummary'>;

interface DecisionOption {
  value: DecisionStatus;
  label: string;
  color: string;
}

const DECISION_OPTIONS: DecisionOption[] = [
  { value: 'still_reviewing', label: 'Still Reviewing', color: '#64748B' },
  { value: 'ask_mechanic', label: 'Ask a Mechanic', color: '#3B82F6' },
  { value: 'request_info', label: 'Request More Information', color: '#60A5FA' },
  { value: 'considering', label: 'Considering Purchase', color: '#F59E0B' },
  { value: 'pass', label: 'Pass on This Vehicle', color: '#EF4444' },
  { value: 'purchased', label: 'Purchased - Personal Record', color: '#22C55E' },
];

function SectionHeader({
  label,
  color,
}: {
  label: string;
  color: string;
}): React.JSX.Element {
  return (
    <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
      <Text style={[styles.sectionHeaderText, { color }]}>{label}</Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatPill({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: string;
}): React.JSX.Element {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statPillCount, { color }]}>{count}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function InspectionSummaryScreen({ navigation, route }: Props): React.JSX.Element {
  const { inspectionId, isNew } = route.params;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [returningHome, setReturningHome] = useState(false);

  useEffect(() => {
    let cancelled = false;
    StorageService.getInspection(inspectionId).then((insp) => {
      if (cancelled) return;
      if (!insp) {
        setNotFound(true);
      } else {
        setInspection(insp);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [inspectionId]);

  const handleDecisionSelect = useCallback(
    async (status: DecisionStatus) => {
      if (!inspection) return;
      setDecisionModalVisible(false);
      const updated: Inspection = {
        ...inspection,
        decisionStatus: status,
        updatedAt: new Date().toISOString(),
      };
      setInspection(updated);
      await StorageService.saveInspection(updated);
    },
    [inspection],
  );

  const handleExportPdf = useCallback(async () => {
    if (!inspection) return;
    setExportingPdf(true);
    try {
      const filePath = await generateInspectionPDF(inspection);
      await shareFile(filePath, `${inspection.vehicle.nickname || 'Inspection'} - Report`);
      await tryShowInterstitial();
    } catch {
      Alert.alert('Export Failed', 'Could not generate the PDF report. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  }, [inspection]);

  const handleExportJson = useCallback(async () => {
    if (!inspection) return;
    setExportingJson(true);
    try {
      const filePath = await exportInspectionJSON(inspection);
      await shareFile(filePath, `${inspection.vehicle.nickname || 'Inspection'} - Backup`);
    } catch {
      Alert.alert('Export Failed', 'Could not export the JSON backup. Please try again.');
    } finally {
      setExportingJson(false);
    }
  }, [inspection]);

  const handleReturnHome = useCallback(async () => {
    if (returningHome) return;
    setReturningHome(true);
    await tryShowInterstitial();
    navigation.navigate('MainTabs');
  }, [navigation, returningHome]);

  const handleSectionTap = useCallback(
    (sectionIdx: number) => {
      if (!inspection) return;
      navigation.navigate('Checklist', {
        inspectionId,
        sectionIndex: sectionIdx,
        totalSections: inspection.sections.length,
      });
    },
    [inspection, inspectionId, navigation],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !inspection) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Inspection Not Found</Text>
          <Text style={styles.errorMessage}>
            This inspection could not be loaded.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { vehicle } = inspection;
  const stats = getCompletionStats(inspection);
  const completionPct = getCompletionPercentage(inspection);
  const criticalItems = getCriticalItems(inspection);
  const concernItems = getConcernItems(inspection);
  const notCheckedItems = getNotCheckedItems(inspection);

  // Build section index lookup for navigation
  const sectionIndexMap: Record<string, number> = {};
  inspection.sections.forEach((s, idx) => {
    sectionIndexMap[s.id] = idx;
  });

  function getSectionIndex(sectionTitle: string): number {
    const idx = inspection!.sections.findIndex((s) => s.title === sectionTitle);
    return idx >= 0 ? idx : 0;
  }

  const vehicleYMM = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(' ');

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ------------------------------------------------------------------ */}
        {/* Section 1 - Vehicle Info                                            */}
        {/* ------------------------------------------------------------------ */}
        <View style={styles.card}>
          <Text style={styles.vehicleNickname}>{vehicle.nickname || vehicleYMM}</Text>
          <Text style={styles.vehicleYMM}>{vehicleYMM}</Text>
          <Text style={styles.powertrainBadge}>{getPowertrainLabel(vehicle.powertrainType)}</Text>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            {vehicle.odometer ? (
              <InfoRow label="Odometer" value={`${vehicle.odometer} mi`} />
            ) : null}
            {vehicle.askingPrice ? (
              <InfoRow label="Asking Price" value={`$${vehicle.askingPrice}`} />
            ) : null}
            {vehicle.inspectionDate ? (
              <InfoRow label="Inspected" value={formatDate(vehicle.inspectionDate)} />
            ) : null}
            {vehicle.exteriorColor ? (
              <InfoRow label="Color" value={vehicle.exteriorColor} />
            ) : null}
            {vehicle.sellerType || vehicle.sellerLabel ? (
              <InfoRow
                label="Seller"
                value={[
                  vehicle.sellerType === 'private'
                    ? 'Private Seller'
                    : vehicle.sellerType === 'dealer'
                    ? 'Dealer'
                    : vehicle.sellerType === 'other'
                    ? 'Other'
                    : '',
                  vehicle.sellerLabel,
                ]
                  .filter(Boolean)
                  .join(' - ')}
              />
            ) : null}
            {vehicle.vin ? (
              <InfoRow label="VIN" value={vehicle.vin} />
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('VehicleDetails', { inspectionId })}
            activeOpacity={0.8}
          >
            <Text style={styles.editButtonText}>Edit Vehicle Details</Text>
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Section 2 - Completion Overview                                     */}
        {/* ------------------------------------------------------------------ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Completion Overview</Text>

          <View style={styles.progressRow}>
            <ProgressBar progress={completionPct / 100} height={8} showLabel />
          </View>

          <Text style={styles.completionSummary}>
            {stats.total - stats.notChecked - stats.notApplicable} of{' '}
            {stats.total - stats.notApplicable} applicable items reviewed
          </Text>

          <View style={styles.statsRow}>
            <StatPill count={stats.good} label="Good" color="#22C55E" />
            <StatPill count={stats.concern} label="Concern" color="#F59E0B" />
            <StatPill count={stats.critical} label="Critical" color="#EF4444" />
            <StatPill count={stats.notChecked} label="Skipped" color="#64748B" />
            <StatPill count={stats.notApplicable} label="N/A" color="#475569" />
          </View>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Section 3 - Decision Status                                         */}
        {/* ------------------------------------------------------------------ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Decision</Text>
          <View style={styles.decisionRow}>
            <StatusBadge status={inspection.decisionStatus} size="medium" />
            <TouchableOpacity
              style={styles.changeDecisionButton}
              onPress={() => setDecisionModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.changeDecisionText}>Change Decision</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Section 4 - Critical Items                                          */}
        {/* ------------------------------------------------------------------ */}
        {criticalItems.length > 0 ? (
          <View style={styles.card}>
            <SectionHeader
              label={`Critical Attention (${criticalItems.length})`}
              color="#EF4444"
            />
            {criticalItems.map(({ sectionTitle, item }) => {
              const sectionIdx = getSectionIndex(sectionTitle);
              return (
                <TouchableOpacity
                  key={`${sectionTitle}-${item.id}`}
                  style={styles.flaggedItem}
                  onPress={() => handleSectionTap(sectionIdx)}
                  activeOpacity={0.75}
                >
                  <View style={styles.flaggedItemLeft}>
                    <Text style={styles.flaggedItemSection}>{sectionTitle}</Text>
                    <Text style={styles.flaggedItemLabel}>{item.label}</Text>
                    {item.notes ? (
                      <Text style={styles.flaggedItemNotes} numberOfLines={2}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.flaggedItemChevron}>{'>'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Section 5 - Concern Items                                           */}
        {/* ------------------------------------------------------------------ */}
        {concernItems.length > 0 ? (
          <View style={styles.card}>
            <SectionHeader
              label={`Concerns (${concernItems.length})`}
              color="#F59E0B"
            />
            {concernItems.map(({ sectionTitle, item }) => {
              const sectionIdx = getSectionIndex(sectionTitle);
              return (
                <TouchableOpacity
                  key={`${sectionTitle}-${item.id}`}
                  style={styles.flaggedItem}
                  onPress={() => handleSectionTap(sectionIdx)}
                  activeOpacity={0.75}
                >
                  <View style={styles.flaggedItemLeft}>
                    <Text style={styles.flaggedItemSection}>{sectionTitle}</Text>
                    <Text style={styles.flaggedItemLabel}>{item.label}</Text>
                    {item.notes ? (
                      <Text style={styles.flaggedItemNotes} numberOfLines={2}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.flaggedItemChevron}>{'>'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Section 6 - Not Checked Items                                       */}
        {/* ------------------------------------------------------------------ */}
        {notCheckedItems.length > 0 ? (
          <View style={styles.card}>
            <SectionHeader
              label={`Not Checked (${notCheckedItems.length})`}
              color="#64748B"
            />
            {notCheckedItems.map(({ sectionTitle, item }: { sectionTitle: string; item: ChecklistItemData }) => (
              <View key={`${sectionTitle}-${item.id}`} style={styles.notCheckedItem}>
                <Text style={styles.notCheckedSection}>{sectionTitle}</Text>
                <Text style={styles.notCheckedLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Section 7 - Actions                                                 */}
        {/* ------------------------------------------------------------------ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Export and Share</Text>

          <TouchableOpacity
            style={[styles.actionButton, exportingPdf ? styles.actionButtonDisabled : null]}
            onPress={handleExportPdf}
            activeOpacity={0.8}
            disabled={exportingPdf}
          >
            {exportingPdf ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text style={styles.actionButtonText}>Export PDF Report</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary, exportingJson ? styles.actionButtonDisabled : null]}
            onPress={handleExportJson}
            activeOpacity={0.8}
            disabled={exportingJson}
          >
            {exportingJson ? (
              <ActivityIndicator size="small" color="#94A3B8" />
            ) : (
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                Export JSON Backup
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Return to Home / Back button */}
        {isNew ? (
          <TouchableOpacity
            style={[styles.primaryButton, returningHome ? styles.primaryButtonDisabled : null]}
            onPress={handleReturnHome}
            activeOpacity={0.85}
            disabled={returningHome}
          >
            {returningHome ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Return to Home</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* -------------------------------------------------------------------- */}
      {/* Decision Modal                                                        */}
      {/* -------------------------------------------------------------------- */}
      <Modal
        visible={decisionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDecisionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Decision</Text>
              <TouchableOpacity
                onPress={() => setDecisionModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {DECISION_OPTIONS.map((option) => {
              const isSelected = inspection.decisionStatus === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.decisionOption,
                    isSelected ? styles.decisionOptionSelected : null,
                  ]}
                  onPress={() => handleDecisionSelect(option.value)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[styles.decisionDot, { backgroundColor: option.color }]}
                  />
                  <Text
                    style={[
                      styles.decisionOptionText,
                      isSelected ? { color: option.color } : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Text style={[styles.decisionCheck, { color: option.color }]}>
                      Selected
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            <View style={styles.modalBottomPad} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1D21',
  },
  flex: {
    flex: 1,
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
  scrollContent: {
    padding: 16,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#242830',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A4055',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 12,
  },
  vehicleNickname: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  vehicleYMM: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 6,
  },
  powertrainBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    backgroundColor: '#1D3461',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#3A4055',
    marginVertical: 12,
  },
  infoGrid: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    width: 100,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 13,
    color: '#F1F5F9',
    flex: 1,
    fontWeight: '500',
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#3A4055',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  progressRow: {
    marginBottom: 8,
  },
  completionSummary: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: '#2D3340',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 54,
  },
  statPillCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statPillLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  changeDecisionButton: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  changeDecisionText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
  },
  flaggedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3A4055',
    gap: 8,
  },
  flaggedItemLeft: {
    flex: 1,
  },
  flaggedItemSection: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  flaggedItemLabel: {
    fontSize: 14,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  flaggedItemNotes: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 17,
  },
  flaggedItemChevron: {
    color: '#64748B',
    fontSize: 15,
    paddingLeft: 4,
  },
  notCheckedItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333D50',
  },
  notCheckedSection: {
    fontSize: 11,
    color: '#64748B',
  },
  notCheckedLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 1,
  },
  actionButton: {
    backgroundColor: '#1D3461',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
    minHeight: 50,
  },
  actionButtonSecondary: {
    backgroundColor: '#2D3340',
    borderColor: '#3A4055',
    marginBottom: 0,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#94A3B8',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#3A4055',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  outlineButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 24,
  },
  // Decision Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: '#242830',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#3A4055',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A4055',
  },
  modalTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
  },
  modalClose: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },
  decisionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3340',
  },
  decisionOptionSelected: {
    backgroundColor: '#2D3340',
  },
  decisionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  decisionOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  decisionCheck: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalBottomPad: {
    height: 32,
  },
});

export default InspectionSummaryScreen;
