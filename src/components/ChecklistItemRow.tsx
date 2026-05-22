import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ChecklistItemData, ChecklistStatus } from '../types';

interface Props {
  item: ChecklistItemData;
  onUpdate: (updated: ChecklistItemData) => void;
}

interface StatusOption {
  value: ChecklistStatus;
  label: string;
  color: string;
  bgColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'good', label: 'Good', color: '#22C55E', bgColor: '#14532D' },
  { value: 'concern', label: 'Concern', color: '#F59E0B', bgColor: '#78350F' },
  { value: 'critical', label: 'Critical', color: '#EF4444', bgColor: '#7F1D1D' },
  { value: 'not_applicable', label: 'N/A', color: '#475569', bgColor: '#1E293B' },
  { value: 'not_checked', label: 'Skip', color: '#64748B', bgColor: '#1E293B' },
];

const ChecklistItemRow: React.FC<Props> = ({ item, onUpdate }) => {
  const handleStatusPress = (status: ChecklistStatus) => {
    onUpdate({ ...item, status });
  };

  const handleNotesChange = (text: string) => {
    onUpdate({ ...item, notes: text });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{item.label}</Text>

      {item.description ? (
        <Text style={styles.description}>{item.description}</Text>
      ) : null}

      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map(option => {
          const isSelected = item.status === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleStatusPress(option.value)}
              style={[
                styles.statusButton,
                isSelected
                  ? { backgroundColor: option.bgColor, borderColor: option.color }
                  : styles.statusButtonUnselected,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  { color: isSelected ? option.color : '#64748B' },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.notesInput}
        value={item.notes}
        onChangeText={handleNotesChange}
        placeholder="Add notes..."
        placeholderTextColor="#64748B"
        multiline
        textAlignVertical="top"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#242830',
    borderColor: '#3A4055',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  label: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: 'bold',
  },
  description: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  statusButton: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  statusButtonUnselected: {
    backgroundColor: 'transparent',
    borderColor: '#3A4055',
  },
  statusButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  notesInput: {
    color: '#94A3B8',
    backgroundColor: '#242830',
    borderColor: '#3A4055',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    minHeight: 40,
    marginTop: 10,
    fontSize: 13,
  },
});

export default ChecklistItemRow;
