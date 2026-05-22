import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Props {
  icon?: string;
  message: string;
  subMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<Props> = ({
  icon,
  message,
  subMessage,
  actionLabel,
  onAction,
}) => {
  const showAction = actionLabel && onAction;

  return (
    <View style={styles.container}>
      {icon ? (
        <MaterialIcons name={icon as any} size={64} color="#3A4055" />
      ) : null}

      <Text style={styles.message}>{message}</Text>

      {subMessage ? (
        <Text style={styles.subMessage}>{subMessage}</Text>
      ) : null}

      {showAction ? (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  message: {
    color: '#94A3B8',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  subMessage: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  actionButton: {
    marginTop: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  actionLabel: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default EmptyState;
