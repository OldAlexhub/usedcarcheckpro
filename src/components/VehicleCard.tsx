import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Inspection, ChecklistStatus, DecisionStatus } from '../types';

interface Props {
  inspection: Inspection;
  onPress: () => void;
  onDelete?: () => void;
  showDeleteButton?: boolean;
}

interface DecisionConfig {
  label: string;
  color: string;
}

const DECISION_CONFIG: Record<DecisionStatus, DecisionConfig> = {
  still_reviewing: { label: 'Still Reviewing', color: '#64748B' },
  ask_mechanic: { label: 'Ask a Mechanic', color: '#3B82F6' },
  request_info: { label: 'Request Info', color: '#60A5FA' },
  considering: { label: 'Considering', color: '#F59E0B' },
  pass: { label: 'Pass', color: '#EF4444' },
  purchased: { label: 'Purchased', color: '#22C55E' },
};

function getStatusCounts(inspection: Inspection): Record<ChecklistStatus, number> {
  const counts: Record<ChecklistStatus, number> = {
    good: 0,
    concern: 0,
    critical: 0,
    not_checked: 0,
    not_applicable: 0,
  };
  for (const section of inspection.sections) {
    for (const item of section.items) {
      counts[item.status] = (counts[item.status] || 0) + 1;
    }
  }
  return counts;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const VehicleCard: React.FC<Props> = ({
  inspection,
  onPress,
  onDelete,
  showDeleteButton = false,
}) => {
  const { vehicle, decisionStatus } = inspection;
  const counts = getStatusCounts(inspection);
  const decision = DECISION_CONFIG[decisionStatus] ?? DECISION_CONFIG.still_reviewing;

  const vehicleLine = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(' ');

  const displayDate = vehicle.inspectionDate
    ? formatDate(vehicle.inspectionDate)
    : formatDate(inspection.createdAt);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <Text style={styles.nickname} numberOfLines={1}>
          {vehicle.nickname || vehicleLine || 'Unnamed Vehicle'}
        </Text>
        {showDeleteButton && onDelete ? (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        ) : null}
      </View>

      {vehicleLine ? (
        <Text style={styles.vehicleLine} numberOfLines={1}>
          {vehicleLine}
        </Text>
      ) : null}

      {displayDate ? (
        <Text style={styles.dateText}>Inspected {displayDate}</Text>
      ) : null}

      <View style={styles.statsRow}>
        {counts.critical > 0 ? (
          <View style={styles.statBadge}>
            <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.statText, { color: '#EF4444' }]}>
              {counts.critical} Critical
            </Text>
          </View>
        ) : null}
        {counts.concern > 0 ? (
          <View style={styles.statBadge}>
            <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.statText, { color: '#F59E0B' }]}>
              {counts.concern} Concern
            </Text>
          </View>
        ) : null}
        {counts.not_checked > 0 ? (
          <View style={styles.statBadge}>
            <View style={[styles.statDot, { backgroundColor: '#64748B' }]} />
            <Text style={[styles.statText, { color: '#64748B' }]}>
              {counts.not_checked} Skipped
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomRow}>
        <View
          style={[
            styles.decisionBadge,
            { borderColor: decision.color, backgroundColor: decision.color + '22' },
          ]}
        >
          <Text style={[styles.decisionLabel, { color: decision.color }]}>
            {decision.label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2D3340',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nickname: {
    color: '#F1F5F9',
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 2,
  },
  vehicleLine: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  dateText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  decisionBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  decisionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default VehicleCard;
