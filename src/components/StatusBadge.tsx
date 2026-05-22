import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChecklistStatus, DecisionStatus } from '../types';

interface Props {
  status: ChecklistStatus | DecisionStatus;
  label?: string;
  size?: 'small' | 'medium';
}

interface StatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // ChecklistStatus
  good: {
    label: 'Good',
    color: '#22C55E',
    backgroundColor: '#14532D',
  },
  concern: {
    label: 'Concern',
    color: '#F59E0B',
    backgroundColor: '#78350F',
  },
  critical: {
    label: 'Critical',
    color: '#EF4444',
    backgroundColor: '#7F1D1D',
  },
  not_checked: {
    label: 'Not Checked',
    color: '#64748B',
    backgroundColor: '#1E293B',
  },
  not_applicable: {
    label: 'N/A',
    color: '#475569',
    backgroundColor: '#1E293B',
  },
  // DecisionStatus
  still_reviewing: {
    label: 'Still Reviewing',
    color: '#64748B',
    backgroundColor: '#64748B22',
  },
  ask_mechanic: {
    label: 'Ask a Mechanic',
    color: '#3B82F6',
    backgroundColor: '#3B82F622',
  },
  request_info: {
    label: 'Request Info',
    color: '#60A5FA',
    backgroundColor: '#60A5FA22',
  },
  considering: {
    label: 'Considering',
    color: '#F59E0B',
    backgroundColor: '#F59E0B22',
  },
  pass: {
    label: 'Pass',
    color: '#EF4444',
    backgroundColor: '#EF444422',
  },
  purchased: {
    label: 'Purchased',
    color: '#22C55E',
    backgroundColor: '#22C55E22',
  },
};

const StatusBadge: React.FC<Props> = ({ status, label, size = 'medium' }) => {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: '#64748B',
    backgroundColor: '#1E293B',
  };

  const displayLabel = label ?? config.label;
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.color,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 12,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: isSmall ? 11 : 13,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});

export default StatusBadge;
