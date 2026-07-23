import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

/**
 * Provides the device's compass heading.
 *
 * expo-location's watchHeadingAsync is preferred over a raw magnetometer read:
 * the OS fuses magnetometer + accelerometer + gyroscope, corrects for device
 * tilt, and (on hardware that supports it) reports BOTH magnetic north and
 * true north along with an accuracy estimate.
 *
 * Returns:
 *   trueHeading     - degrees clockwise from geographic (true) north, or null
 *   magHeading      - degrees clockwise from magnetic north
 *   accuracy        - iOS: ± degrees. Android: 0-3 confidence bucket (3 = high)
 *   declination     - trueHeading - magHeading (local magnetic declination), or null
 */
export default function useHeading() {
  const [magHeading, setMagHeading] = useState(null);
  const [trueHeading, setTrueHeading] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const subRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // Heading needs the same location permission as positioning.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !mounted) return;

      subRef.current = await Location.watchHeadingAsync((data) => {
        if (!mounted) return;
        // trueHeading is -1 when true north can't be resolved (no location fix yet).
        const t = data.trueHeading >= 0 ? data.trueHeading : null;
        setMagHeading(data.magHeading);
        setTrueHeading(t);
        setAccuracy(data.accuracy);
      });
    })();

    return () => {
      mounted = false;
      if (subRef.current) subRef.current.remove();
    };
  }, []);

  // The heading actually used to rotate the rose: prefer true north, fall back
  // to magnetic so the compass still works before a GPS fix arrives.
  const heading = trueHeading != null ? trueHeading : magHeading;

  const declination =
    trueHeading != null && magHeading != null
      ? normalizeSigned(trueHeading - magHeading)
      : null;

  return { heading, trueHeading, magHeading, accuracy, declination };
}

// Wrap a degree difference into the -180..180 range.
function normalizeSigned(deg) {
  let d = ((deg + 180) % 360) - 180;
  if (d < -180) d += 360;
  return d;
}
