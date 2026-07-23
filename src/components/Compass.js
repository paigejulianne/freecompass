import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText, Polygon } from 'react-native-svg';
import { degrees, cardinal } from '../utils/format';

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 138;

// Precompute every tick mark once. One line every 10° (36 ticks). Cardinal
// ticks (every 90°) are longest, intercardinal reference ticks (every 30°) are
// medium, the rest are short.
const TICKS = [];
for (let deg = 0; deg < 360; deg += 10) {
  const isCardinal = deg % 90 === 0;
  const isMajor = deg % 30 === 0;
  const len = isCardinal ? 24 : isMajor ? 16 : 9;
  const width = isCardinal ? 3 : isMajor ? 2 : 1;
  // Screen angle: 0° at top, increasing clockwise.
  const rad = ((deg - 90) * Math.PI) / 180;
  const outer = RADIUS;
  const inner = RADIUS - len;
  TICKS.push({
    deg,
    isMajor,
    isCardinal,
    width,
    x1: CENTER + outer * Math.cos(rad),
    y1: CENTER + outer * Math.sin(rad),
    x2: CENTER + inner * Math.cos(rad),
    y2: CENTER + inner * Math.sin(rad),
    // Label anchor, tucked inside the medium/long ticks.
    lx: CENTER + (RADIUS - 40) * Math.cos(rad),
    ly: CENTER + (RADIUS - 40) * Math.sin(rad),
  });
}

const CARDINALS = [
  { label: 'N', deg: 0, color: '#ff5252' },
  { label: 'E', deg: 90, color: '#e6edf3' },
  { label: 'S', deg: 180, color: '#e6edf3' },
  { label: 'W', deg: 270, color: '#e6edf3' },
];

function CardinalLabel({ label, deg, color }) {
  const rad = ((deg - 90) * Math.PI) / 180;
  const r = RADIUS - 40;
  return (
    <SvgText
      x={CENTER + r * Math.cos(rad)}
      y={CENTER + r * Math.sin(rad)}
      fill={color}
      fontSize={26}
      fontWeight="bold"
      textAnchor="middle"
      alignmentBaseline="central"
    >
      {label}
    </SvgText>
  );
}

export default function Compass({ heading, usingTrueNorth }) {
  const h = heading == null ? 0 : heading;

  // Rotate the whole rose the opposite way to the heading so the current
  // bearing always sits under the fixed pointer at the top.
  const rose = useMemo(
    () => (
      <G rotation={-h} origin={`${CENTER}, ${CENTER}`}>
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#233240" strokeWidth={2} fill="none" />
        {TICKS.map((t) => (
          <Line
            key={`t${t.deg}`}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.isCardinal ? '#6ea8fe' : t.isMajor ? '#8ba0b3' : '#43586b'}
            strokeWidth={t.width}
          />
        ))}
        {TICKS.filter((t) => t.isMajor && t.deg % 90 !== 0).map((t) => (
          <SvgText
            key={`l${t.deg}`}
            x={t.lx}
            y={t.ly}
            fill="#8ba0b3"
            fontSize={13}
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {t.deg}
          </SvgText>
        ))}
        {CARDINALS.map((c) => (
          <CardinalLabel key={c.label} {...c} />
        ))}
      </G>
    ),
    [h]
  );

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {rose}

        {/* Fixed pointer at the top, pointing down into the rose. */}
        <Polygon
          points={`${CENTER - 12},8 ${CENTER + 12},8 ${CENTER},34`}
          fill="#ff5252"
        />
        {/* Hub */}
        <Circle cx={CENTER} cy={CENTER} r={6} fill="#6ea8fe" />
      </Svg>

      {/* Digital readout in the middle of the dial. */}
      <View style={styles.readout} pointerEvents="none">
        <Text style={styles.headingValue}>{degrees(heading)}</Text>
        <Text style={styles.headingCardinal}>{cardinal(heading)}</Text>
        <Text style={styles.headingRef}>{usingTrueNorth ? 'TRUE' : 'MAGNETIC'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readout: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingValue: {
    color: '#e6edf3',
    fontSize: 44,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  headingCardinal: {
    color: '#6ea8fe',
    fontSize: 20,
    fontWeight: '600',
    marginTop: -4,
  },
  headingRef: {
    color: '#5b6b7b',
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 2,
  },
});
