import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { degrees, cardinal, stepDistance } from '../utils/format';

/**
 * On/off distance-meter card. While recording it shows the live leg (bearing +
 * steps), running total, and leg count. Also opens the saved-walks list.
 */
export default function DistanceMeter({ recorder, strideM = 0.75, onOpenSaved }) {
  const { recording, available, live, start, stop } = recorder;

  async function toggle() {
    if (recording) {
      const j = await stop();
      if (j && j.segments.length) {
        Alert.alert('Walk saved', `${j.totalSteps} steps over ${j.segments.length} leg(s).`);
      }
    } else {
      const res = await start();
      if (res && res.error) Alert.alert('Cannot start', res.error);
    }
  }

  const unavailable = available === false;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Distance Meter</Text>
        <View style={[styles.dot, recording && styles.dotOn]} />
      </View>

      {unavailable ? (
        <Text style={styles.warn}>
          This device has no step-counter sensor, so walks can't be recorded.
        </Text>
      ) : recording ? (
        <View style={styles.liveWrap}>
          <View style={styles.liveMain}>
            <Text style={styles.liveHeading}>{degrees(live.activeHeading)}</Text>
            <Text style={styles.liveCardinal}>{cardinal(live.activeHeading)}</Text>
          </View>
          <View style={styles.liveStats}>
            <Stat label="This leg" value={`${live.activeSteps} steps`} />
            <Stat label="Total" value={`${live.totalSteps} steps`} />
            <Stat label="Legs" value={`${live.legs}`} />
            <Stat label="Distance" value={stepDistance(live.totalSteps, strideM)} />
          </View>
        </View>
      ) : (
        <Text style={styles.idle}>
          Start recording, then walk. Each turn begins a new leg you can replay
          later, turn-by-turn.
        </Text>
      )}

      <View style={styles.buttons}>
        <Pressable
          onPress={toggle}
          disabled={unavailable}
          style={[
            styles.btn,
            recording ? styles.btnStop : styles.btnStart,
            unavailable && styles.btnDisabled,
          ]}
          android_ripple={{ color: '#00000022' }}
        >
          <Text style={styles.btnText}>{recording ? 'Stop & Save' : 'Start Recording'}</Text>
        </Pressable>
        <Pressable onPress={onOpenSaved} style={[styles.btn, styles.btnGhost]} android_ripple={{ color: '#1c2b3a' }}>
          <Text style={styles.btnGhostText}>Saved Walks</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginTop: 22,
    padding: 16,
    backgroundColor: '#0e141b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e2a36',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    color: '#e6edf3',
    fontSize: 16,
    fontWeight: '800',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#33414f',
  },
  dotOn: {
    backgroundColor: '#ff4d4d',
  },
  idle: {
    color: '#8ba0b3',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  warn: {
    color: '#e0a34e',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  liveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 16,
  },
  liveMain: {
    alignItems: 'center',
    minWidth: 96,
  },
  liveHeading: {
    color: '#6ea8fe',
    fontSize: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  liveCardinal: {
    color: '#8ba0b3',
    fontSize: 15,
    fontWeight: '700',
    marginTop: -2,
  },
  liveStats: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  stat: {
    width: '50%',
  },
  statLabel: {
    color: '#5b6b7b',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#e6edf3',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnStart: {
    backgroundColor: '#1d4ed8',
  },
  btnStop: {
    backgroundColor: '#b91c1c',
  },
  btnDisabled: {
    backgroundColor: '#26313c',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2a3a4a',
    flex: 0.9,
  },
  btnGhostText: {
    color: '#8ba0b3',
    fontSize: 15,
    fontWeight: '700',
  },
});
