import { useCallback, useEffect, useRef, useState } from 'react';
import { Pedometer } from 'expo-sensors';
import {
  saveJourney,
  saveActive,
  loadActive,
  clearActive,
  DEFAULT_STRIDE_M,
} from '../utils/journeys';

// A new leg (segment) begins once your facing direction differs from the
// current leg's bearing by more than this many degrees.
const TURN_THRESHOLD = 25;
// Throttle how often the in-progress journey is written to disk.
const PERSIST_MS = 2000;

// Smallest angle between two bearings, 0..180.
function angDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Records a walk as a sequence of legs: { heading, steps }. The pedometer counts
 * steps; the compass heading (passed in) decides when you've turned enough to
 * start a new leg. Everything is persisted so it can be recalled later, and an
 * interrupted session is recovered on next launch.
 *
 * @param {object}  opts
 * @param {number}  opts.heading   current compass heading (user's chosen reference)
 * @param {object}  opts.location  latest expo-location object (for start/end coords)
 * @param {string}  opts.northRef  'true' | 'magnetic' (stored on the journey)
 */
export default function useJourneyRecorder({ heading, location, northRef }) {
  const [recording, setRecording] = useState(false);
  const [available, setAvailable] = useState(null); // null=checking, bool otherwise
  const [live, setLive] = useState({
    totalSteps: 0,
    legs: 0,
    activeSteps: 0,
    activeHeading: null,
  });

  // Keep the latest sensor values reachable from the pedometer callback.
  const headingRef = useRef(heading);
  const locationRef = useRef(location);
  useEffect(() => {
    headingRef.current = heading;
  }, [heading]);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Mutable working state for the active recording.
  const subRef = useRef(null);
  const lastTotalRef = useRef(0); // pedometer cumulative baseline
  const segmentsRef = useRef([]); // finalized legs
  const activeStepsRef = useRef(0);
  const activeHeadingRef = useRef(null);
  const totalStepsRef = useRef(0);
  const startRef = useRef(null);
  const lastPersistRef = useRef(0);

  // On mount: check the sensor and recover any interrupted session.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ok = await Pedometer.isAvailableAsync();
        if (mounted) setAvailable(ok);
      } catch {
        if (mounted) setAvailable(false);
      }
      try {
        const stale = await loadActive();
        if (stale && stale.segments && stale.segments.length) {
          await saveJourney({
            ...stale,
            endedAt: stale.endedAt || stale.startedAt,
            recovered: true,
          });
        }
        await clearActive();
      } catch {
        // best-effort recovery
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function coordsNow() {
    const l = locationRef.current;
    return l ? { latitude: l.coords.latitude, longitude: l.coords.longitude } : null;
  }

  function pushLive() {
    setLive({
      totalSteps: totalStepsRef.current,
      legs: segmentsRef.current.length + (activeStepsRef.current > 0 ? 1 : 0),
      activeSteps: activeStepsRef.current,
      activeHeading: activeHeadingRef.current,
    });
  }

  function buildJourney(endedAt) {
    const segments =
      activeStepsRef.current > 0
        ? [...segmentsRef.current, { heading: activeHeadingRef.current, steps: activeStepsRef.current }]
        : [...segmentsRef.current];
    return {
      id: startRef.current.id,
      startedAt: startRef.current.startedAt,
      endedAt: endedAt || null,
      totalSteps: totalStepsRef.current,
      segments,
      start: startRef.current.start,
      end: coordsNow() || startRef.current.start,
      strideM: DEFAULT_STRIDE_M,
      northRef: startRef.current.northRef,
    };
  }

  function maybePersist(now) {
    if (now - lastPersistRef.current >= PERSIST_MS) {
      lastPersistRef.current = now;
      saveActive(buildJourney(null)).catch(() => {});
    }
  }

  // Pedometer callback: result.steps is cumulative since the watch began.
  function onStep(result) {
    const delta = result.steps - lastTotalRef.current;
    lastTotalRef.current = result.steps;
    if (delta <= 0) return;

    const h = headingRef.current;
    if (activeHeadingRef.current == null && h != null) {
      activeHeadingRef.current = h;
    }
    // Turn detection: close the current leg and open a new one at the new bearing.
    if (
      activeHeadingRef.current != null &&
      h != null &&
      activeStepsRef.current > 0 &&
      angDiff(h, activeHeadingRef.current) > TURN_THRESHOLD
    ) {
      segmentsRef.current.push({
        heading: activeHeadingRef.current,
        steps: activeStepsRef.current,
      });
      activeStepsRef.current = 0;
      activeHeadingRef.current = h;
      // A turn is a meaningful checkpoint — persist immediately.
      lastPersistRef.current = 0;
    }
    activeStepsRef.current += delta;
    totalStepsRef.current += delta;
    pushLive();
    maybePersist(Date.now());
  }

  const start = useCallback(async () => {
    if (recording) return {};
    try {
      const { status } = await Pedometer.requestPermissionsAsync();
      if (status !== 'granted') {
        setAvailable(false);
        return { error: 'Motion & fitness permission is needed to count steps.' };
      }
    } catch {
      // Some platforms don't gate the pedometer behind a permission — continue.
    }

    lastTotalRef.current = 0;
    segmentsRef.current = [];
    activeStepsRef.current = 0;
    activeHeadingRef.current = headingRef.current ?? null;
    totalStepsRef.current = 0;
    lastPersistRef.current = 0;
    startRef.current = {
      id: 'j' + Date.now(),
      startedAt: Date.now(),
      start: coordsNow(),
      northRef,
    };

    try {
      subRef.current = Pedometer.watchStepCount(onStep);
    } catch (e) {
      setAvailable(false);
      return { error: 'Could not start the step counter on this device.' };
    }
    setRecording(true);
    pushLive();
    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, northRef]);

  const stop = useCallback(async () => {
    if (!recording) return null;
    if (subRef.current) {
      subRef.current.remove();
      subRef.current = null;
    }
    const journey = buildJourney(Date.now());
    setRecording(false);
    try {
      if (journey.segments.length) await saveJourney(journey);
      await clearActive();
    } catch {
      // best-effort
    }
    segmentsRef.current = [];
    activeStepsRef.current = 0;
    totalStepsRef.current = 0;
    activeHeadingRef.current = null;
    setLive({ totalSteps: 0, legs: 0, activeSteps: 0, activeHeading: null });
    return journey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  // Clean up the subscription if the app unmounts mid-recording.
  useEffect(
    () => () => {
      if (subRef.current) subRef.current.remove();
    },
    []
  );

  return { recording, available, live, start, stop };
}
