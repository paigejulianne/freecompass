import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  toDecimal,
  toDMS,
  metresWithFeet,
  metres,
  speed,
  degrees,
  cardinal,
  timestamp,
} from '../utils/format';

function Row({ label, value, hint }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueWrap}>
        <Text style={styles.value}>{value}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

// Turn horizontal accuracy in metres into a plain-language quality label.
function accuracyQuality(m) {
  if (m == null) return '';
  if (m <= 5) return 'excellent';
  if (m <= 12) return 'good';
  if (m <= 30) return 'fair';
  return 'weak';
}

export default function InfoPanel({ location, address, declination }) {
  const c = location?.coords;

  return (
    <View style={styles.container}>
      <Section title="Position">
        <Row label="Latitude" value={toDecimal(c?.latitude, true)} hint={toDMS(c?.latitude, true)} />
        <Row label="Longitude" value={toDecimal(c?.longitude, false)} hint={toDMS(c?.longitude, false)} />
        <Row
          label="Accuracy"
          value={c?.accuracy != null ? `± ${metres(c.accuracy)}` : '—'}
          hint={accuracyQuality(c?.accuracy)}
        />
      </Section>

      <Section title="Elevation">
        <Row label="Altitude" value={metresWithFeet(c?.altitude)} />
        <Row
          label="Vertical acc."
          value={c?.altitudeAccuracy != null ? `± ${metres(c.altitudeAccuracy)}` : 'n/a'}
        />
      </Section>

      <Section title="Motion">
        <Row label="Ground speed" value={speed(c?.speed)} />
        <Row
          label="GPS course"
          value={c?.heading != null && c.heading >= 0 ? degrees(c.heading) : '—'}
          hint={c?.heading != null && c.heading >= 0 ? cardinal(c.heading) : ''}
        />
      </Section>

      <Section title="Magnetics">
        <Row
          label="Declination"
          value={declination != null ? `${declination >= 0 ? '+' : ''}${declination.toFixed(1)}°` : '—'}
          hint={declination != null ? (declination >= 0 ? 'east' : 'west') : ''}
        />
      </Section>

      {address ? (
        <Section title="Place (approx.)">
          <Row
            label="Address"
            value={formatAddress(address)}
          />
        </Section>
      ) : null}

      <Section title="Fix">
        <Row label="Updated" value={timestamp(location?.timestamp)} />
      </Section>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function formatAddress(a) {
  const parts = [
    [a.streetNumber, a.street].filter(Boolean).join(' '),
    a.city || a.subregion,
    a.region,
    a.postalCode,
    a.country,
  ].filter(Boolean);
  return parts.join(', ') || '—';
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#5b6b7b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a2530',
  },
  label: {
    color: '#8ba0b3',
    fontSize: 15,
    flexShrink: 0,
  },
  valueWrap: {
    alignItems: 'flex-end',
    flexShrink: 1,
    paddingLeft: 12,
  },
  value: {
    color: '#e6edf3',
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  hint: {
    color: '#5b6b7b',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
