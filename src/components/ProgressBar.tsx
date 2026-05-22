import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
  showLabel?: boolean;
  label?: string;
}

const ProgressBar: React.FC<Props> = ({
  progress,
  color = '#3B82F6',
  backgroundColor = '#3A4055',
  height = 6,
  borderRadius = 3,
  showLabel = false,
  label,
}) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const percentage = Math.round(clamped * 100);
  const displayLabel = label ?? `${percentage}%`;

  return (
    <View style={styles.wrapper}>
      {showLabel ? (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>{displayLabel}</Text>
        </View>
      ) : null}
      <View
        style={[
          styles.track,
          {
            backgroundColor,
            height,
            borderRadius,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: `${clamped * 100}%`,
              height,
              borderRadius,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  labelRow: {
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  labelText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    // width and height set inline
  },
});

export default ProgressBar;
