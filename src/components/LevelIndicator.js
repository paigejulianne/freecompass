import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';

const SIZE = 150;
const CENTER = SIZE / 2;
const BODY_R = 66; // outer level ring
const BALL_R = 15;
const TARGET_R = 20; // "centered" zone
const MAX_TRAVEL = BODY_R - BALL_R; // px the ball can move from centre
const PX_PER_DEG = 3.2; // sensitivity: ~20° tilt pushes the ball to the edge

const LEVEL = '#4ade80'; // green when flat
const OFF = '#6ea8fe'; // blue otherwise

/**
 * A circular bubble level. The ball rolls toward the low side (like a ball in a
 * dish), so you tilt the phone to roll it back into the centre ring. Turns green
 * and reports "LEVEL" when the phone is flat enough for a trustworthy heading.
 */
export default function LevelIndicator({ roll, pitch, tilt, isFlat }) {
  // Screen y grows downward, so a top-edge-down pitch (positive) moves the ball up.
  let bx = roll * PX_PER_DEG;
  let by = -pitch * PX_PER_DEG;
  // Keep the ball inside the ring.
  const dist = Math.sqrt(bx * bx + by * by);
  if (dist > MAX_TRAVEL) {
    bx = (bx / dist) * MAX_TRAVEL;
    by = (by / dist) * MAX_TRAVEL;
  }

  const color = isFlat ? LEVEL : OFF;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={CENTER} cy={CENTER} r={BODY_R} stroke="#233240" strokeWidth={2} fill="#0e141b" />
        {/* Crosshair */}
        <Line x1={CENTER - BODY_R} y1={CENTER} x2={CENTER + BODY_R} y2={CENTER} stroke="#1e2a36" strokeWidth={1} />
        <Line x1={CENTER} y1={CENTER - BODY_R} x2={CENTER} y2={CENTER + BODY_R} stroke="#1e2a36" strokeWidth={1} />
        {/* Centre target */}
        <Circle cx={CENTER} cy={CENTER} r={TARGET_R} stroke={color} strokeWidth={1.5} fill="none" opacity={0.6} />
        {/* The rolling ball */}
        <G>
          <Circle cx={CENTER + bx} cy={CENTER + by} r={BALL_R} fill={color} opacity={0.9} />
          <Circle cx={CENTER + bx} cy={CENTER + by} r={BALL_R} stroke="#0b0f14" strokeWidth={1.5} fill="none" />
        </G>
      </Svg>

      <View style={styles.readout}>
        <Text style={[styles.status, { color }]}>{isFlat ? 'LEVEL' : `${tilt.toFixed(1)}° OFF`}</Text>
        <View style={styles.axes}>
          <Axis label="Side-to-side" value={roll} lowLabel="L" highLabel="R" />
          <Axis label="Front-to-back" value={pitch} lowLabel="U" highLabel="D" />
        </View>
      </View>
    </View>
  );
}

function Axis({ label, value, lowLabel, highLabel }) {
  // Show the direction of lean so the number is unambiguous.
  const mag = Math.abs(value).toFixed(1);
  const dir = Math.abs(value) < 0.1 ? '' : value > 0 ? highLabel : lowLabel;
  return (
    <View style={styles.axisRow}>
      <Text style={styles.axisLabel}>{label}</Text>
      <Text style={styles.axisValue}>
        {mag}° {dir}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
    marginBottom: 6,
  },
  readout: {
    minWidth: 140,
  },
  status: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  axes: {
    gap: 6,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
  },
  axisLabel: {
    color: '#8ba0b3',
    fontSize: 13,
  },
  axisValue: {
    color: '#e6edf3',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
