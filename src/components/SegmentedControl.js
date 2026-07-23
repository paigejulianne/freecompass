import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

/**
 * A compact segmented button row.
 * options: [{ label, value }]  ·  value: selected value  ·  onChange(value)
 */
export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => onChange(opt.value)}
              style={[styles.segment, selected && styles.segmentSelected]}
              android_ripple={{ color: '#1c2b3a' }}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    color: '#5b6b7b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: '#0e141b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e2a36',
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: '#1d4ed8',
  },
  segmentText: {
    color: '#8ba0b3',
    fontSize: 15,
    fontWeight: '600',
  },
  segmentTextSelected: {
    color: '#ffffff',
  },
});
