import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

/**
 * Reports how the phone is tilted, derived from the accelerometer's gravity
 * vector. This is what a bubble level / inclinometer needs: for a (roughly)
 * stationary device the accelerometer reads pure gravity, so the angle of each
 * device axis away from horizontal is exact.
 *
 * Returns degrees:
 *   roll   - side-to-side lean. 0 = level. + = right edge down, − = left edge down.
 *   pitch  - front-to-back lean. 0 = level. + = top edge down, − = top edge up.
 *   tilt   - total angle away from flat, sqrt(roll² + pitch²).
 *   isFlat - true when within FLAT_THRESHOLD degrees of level.
 */
const FLAT_THRESHOLD = 1.5;
const RAD = 180 / Math.PI;

export default function useTilt() {
  const [angles, setAngles] = useState({ roll: 0, pitch: 0, tilt: 0, isFlat: false });
  // Low-pass filtered gravity vector to keep the readout from jittering.
  const g = useRef({ x: 0, y: 0, z: 1 });
  const primed = useRef(false);

  useEffect(() => {
    Accelerometer.setUpdateInterval(60); // ~16 Hz — smooth without wasting battery

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      // Seed the filter with the first real sample, then ease toward each new one.
      if (!primed.current) {
        g.current = { x, y, z };
        primed.current = true;
      } else {
        const a = 0.2;
        g.current = {
          x: g.current.x * (1 - a) + x * a,
          y: g.current.y * (1 - a) + y * a,
          z: g.current.z * (1 - a) + z * a,
        };
      }

      const { x: gx, y: gy, z: gz } = g.current;
      // Angle of each in-plane axis from horizontal. atan2 against the magnitude
      // of the other two axes keeps each reading in a clean −90..90 range and
      // stays well-behaved as the phone approaches vertical.
      const roll = Math.atan2(gx, Math.sqrt(gy * gy + gz * gz)) * RAD;
      const pitch = Math.atan2(gy, Math.sqrt(gx * gx + gz * gz)) * RAD;
      const tilt = Math.sqrt(roll * roll + pitch * pitch);

      setAngles({ roll, pitch, tilt, isFlat: tilt <= FLAT_THRESHOLD });
    });

    return () => sub.remove();
  }, []);

  return angles;
}
