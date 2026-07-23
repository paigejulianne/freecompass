import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import Compass from './src/components/Compass';
import LevelIndicator from './src/components/LevelIndicator';
import InfoPanel from './src/components/InfoPanel';
import SegmentedControl from './src/components/SegmentedControl';
import DistanceMeter from './src/components/DistanceMeter';
import SavedWalks from './src/components/SavedWalks';
import useHeading from './src/hooks/useHeading';
import useLocation from './src/hooks/useLocation';
import useTilt from './src/hooks/useTilt';
import useSettings, { REFRESH_OPTIONS } from './src/hooks/useSettings';
import useJourneyRecorder from './src/hooks/useJourneyRecorder';

const NORTH_OPTIONS = [
  { label: 'True North', value: 'true' },
  { label: 'Magnetic', value: 'magnetic' },
];

export default function App() {
  const [settings, setSetting] = useSettings();
  const { trueHeading, magHeading, accuracy: headingAccuracy, declination } = useHeading();
  const { location, errorMsg, address } = useLocation(settings.refreshMs);
  const tilt = useTilt();
  const [showSaved, setShowSaved] = useState(false);

  // Choose which heading to show based on the user's preference. If they want
  // true north but no GPS fix has resolved it yet, fall back to magnetic.
  const wantTrue = settings.northRef === 'true';
  const usingTrueNorth = wantTrue && trueHeading != null;
  const heading = usingTrueNorth ? trueHeading : magHeading;
  const trueUnavailable = wantTrue && trueHeading == null;

  // The path recorder tracks steps + turns using the heading currently shown.
  const recorder = useJourneyRecorder({
    heading,
    location,
    northRef: settings.northRef,
  });

  const waiting = !location && !errorMsg;

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>FreeCompass</Text>
        <Text style={styles.subtitle}>
          {waiting
            ? 'Acquiring GPS signal…'
            : errorMsg
            ? 'Location unavailable'
            : `Heading accuracy ${formatHeadingAcc(headingAccuracy)}`}
        </Text>

        <Compass heading={heading} usingTrueNorth={usingTrueNorth} />

        {trueUnavailable ? (
          <Text style={styles.note}>
            True north needs a GPS fix — showing magnetic for now
          </Text>
        ) : null}

        <LevelIndicator
          roll={tilt.roll}
          pitch={tilt.pitch}
          tilt={tilt.tilt}
          isFlat={tilt.isFlat}
        />
        <Text style={styles.levelHint}>
          {tilt.isFlat
            ? 'Phone is flat — heading is most accurate'
            : 'Hold the phone flat for the most accurate heading'}
        </Text>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : (
          <InfoPanel location={location} address={address} declination={declination} />
        )}

        <View style={styles.settings}>
          <DistanceMeter recorder={recorder} onOpenSaved={() => setShowSaved(true)} />

          <View style={{ height: 22 }} />

          <SegmentedControl
            label="North reference"
            options={NORTH_OPTIONS}
            value={settings.northRef}
            onChange={(v) => setSetting('northRef', v)}
          />
          <SegmentedControl
            label="Refresh rate"
            options={REFRESH_OPTIONS}
            value={settings.refreshMs}
            onChange={(v) => setSetting('refreshMs', v)}
          />
        </View>

        <SavedWalks visible={showSaved} onClose={() => setShowSaved(false)} />

        <Text style={styles.footer}>
          Values reflect the raw device GPS/magnetometer fix. Accuracy improves
          outdoors with a clear view of the sky.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// iOS gives ± degrees; Android reports a 0-3 confidence bucket.
function formatHeadingAcc(acc) {
  if (acc == null) return '—';
  if (Platform.OS === 'ios') return `± ${Math.round(acc)}°`;
  const labels = ['unreliable', 'low', 'medium', 'high'];
  return labels[Math.max(0, Math.min(3, acc))] || '—';
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b0f14',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scroll: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 8,
  },
  title: {
    color: '#e6edf3',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#6ea8fe',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  note: {
    color: '#e0a34e',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
  },
  levelHint: {
    color: '#5b6b7b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 24,
  },
  settings: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 22,
  },
  errorBox: {
    marginTop: 20,
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#2a1416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5a2327',
  },
  errorText: {
    color: '#ff8a8a',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    color: '#3d4a57',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 32,
    lineHeight: 16,
  },
});
