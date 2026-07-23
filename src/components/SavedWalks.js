import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { degrees, cardinal, stepDistance, dateTime, duration } from '../utils/format';
import { loadJourneys, deleteJourney, clearJourneys, haversine } from '../utils/journeys';

/**
 * Full-screen modal listing saved walks. Tap one to open a turn-by-turn view:
 * "Head 045° (NE) — walk 100 steps", "Turn to 120° (ESE) — walk 40 steps", …
 */
export default function SavedWalks({ visible, onClose }) {
  const [journeys, setJourneys] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (visible) {
      setSelected(null);
      loadJourneys().then(setJourneys);
    }
  }, [visible]);

  function confirmDelete(j) {
    Alert.alert('Delete walk?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = await deleteJourney(j.id);
          setJourneys(next);
          setSelected(null);
        },
      },
    ]);
  }

  function confirmClearAll() {
    if (!journeys.length) return;
    Alert.alert('Delete all walks?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: async () => {
          await clearJourneys();
          setJourneys([]);
          setSelected(null);
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={selected ? () => setSelected(null) : onClose} hitSlop={12}>
            <Text style={styles.back}>{selected ? '‹ Back' : 'Close'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{selected ? 'Turn-by-turn' : 'Saved Walks'}</Text>
          {selected ? (
            <Pressable onPress={() => confirmDelete(selected)} hitSlop={12}>
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          ) : (
            <Pressable onPress={confirmClearAll} hitSlop={12}>
              <Text style={[styles.delete, !journeys.length && styles.dim]}>Clear</Text>
            </Pressable>
          )}
        </View>

        {selected ? (
          <Detail journey={selected} />
        ) : (
          <ScrollView contentContainerStyle={styles.listPad}>
            {journeys.length === 0 ? (
              <Text style={styles.empty}>
                No saved walks yet. Turn on the Distance Meter and take a walk —
                it'll appear here.
              </Text>
            ) : (
              journeys.map((j) => (
                <Pressable
                  key={j.id}
                  style={styles.row}
                  onPress={() => setSelected(j)}
                  android_ripple={{ color: '#16202b' }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{dateTime(j.startedAt)}</Text>
                    <Text style={styles.rowSub}>
                      {j.totalSteps} steps · {j.segments.length} leg
                      {j.segments.length === 1 ? '' : 's'} ·{' '}
                      {stepDistance(j.totalSteps, j.strideM)}
                      {j.recovered ? '  · recovered' : ''}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function Detail({ journey }) {
  const displacement = haversine(journey.start, journey.end);
  const dur =
    journey.endedAt && journey.startedAt ? journey.endedAt - journey.startedAt : null;

  return (
    <ScrollView contentContainerStyle={styles.detailPad}>
      <View style={styles.summary}>
        <Summary label="Started" value={dateTime(journey.startedAt)} />
        <Summary label="Duration" value={duration(dur)} />
        <Summary label="Total steps" value={`${journey.totalSteps}`} />
        <Summary label="Est. walked" value={stepDistance(journey.totalSteps, journey.strideM)} />
        {displacement != null ? (
          <Summary label="Straight-line" value={`${displacement.toFixed(0)} m from start`} />
        ) : null}
        <Summary label="Bearings" value={journey.northRef === 'magnetic' ? 'Magnetic north' : 'True north'} />
      </View>

      {journey.segments.map((seg, i) => (
        <View key={i} style={styles.step}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepText}>
              {i === 0 ? 'Head ' : 'Turn to '}
              <Text style={styles.stepBearing}>
                {degrees(seg.heading)} ({cardinal(seg.heading)})
              </Text>
            </Text>
            <Text style={styles.stepSub}>
              Walk {seg.steps} steps · {stepDistance(seg.steps, journey.strideM)}
            </Text>
          </View>
        </View>
      ))}

      <Text style={styles.footnote}>
        Distances are estimated from step count (≈{journey.strideM} m stride).
      </Text>
    </ScrollView>
  );
}

function Summary({ label, value }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0f14',
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a2530',
  },
  back: {
    color: '#6ea8fe',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
  },
  headerTitle: {
    color: '#e6edf3',
    fontSize: 17,
    fontWeight: '800',
  },
  delete: {
    color: '#ff6b6b',
    fontSize: 15,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  dim: {
    color: '#3d4a57',
  },
  listPad: {
    padding: 16,
  },
  empty: {
    color: '#8ba0b3',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a2530',
  },
  rowTitle: {
    color: '#e6edf3',
    fontSize: 15,
    fontWeight: '700',
  },
  rowSub: {
    color: '#8ba0b3',
    fontSize: 13,
    marginTop: 3,
  },
  chevron: {
    color: '#3d4a57',
    fontSize: 26,
    paddingLeft: 10,
  },
  detailPad: {
    padding: 16,
    paddingBottom: 40,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    backgroundColor: '#0e141b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e2a36',
    padding: 14,
    marginBottom: 18,
  },
  summaryItem: {
    width: '50%',
  },
  summaryLabel: {
    color: '#5b6b7b',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: '#e6edf3',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#132132',
    borderWidth: 1,
    borderColor: '#284057',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNumText: {
    color: '#6ea8fe',
    fontSize: 14,
    fontWeight: '800',
  },
  stepText: {
    color: '#e6edf3',
    fontSize: 16,
  },
  stepBearing: {
    color: '#6ea8fe',
    fontWeight: '800',
  },
  stepSub: {
    color: '#8ba0b3',
    fontSize: 13,
    marginTop: 2,
  },
  footnote: {
    color: '#3d4a57',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },
});
