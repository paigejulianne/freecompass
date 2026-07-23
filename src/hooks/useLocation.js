import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

/**
 * Streams the most accurate position fix the device can produce.
 *
 * Uses Accuracy.BestForNavigation (the highest tier — keeps the GPS radio hot
 * and, on iOS, enables additional sensor fusion). We also kick the Android
 * network provider on so a fix arrives quickly indoors before satellites lock.
 *
 * The `location.coords` object exposes:
 *   latitude, longitude          - degrees
 *   altitude                     - metres above the WGS-84 ellipsoid / sea level
 *   accuracy                     - horizontal radius of 68% confidence, in metres
 *   altitudeAccuracy             - vertical ± metres (iOS; often null on Android)
 *   heading                      - GPS course over ground, degrees (−1 if unknown)
 *   speed                        - ground speed, metres/second (−1 if unknown)
 * plus a `timestamp` on the fix itself.
 *
 * @param {number} timeInterval - minimum ms between position updates (refresh rate).
 */
export default function useLocation(timeInterval = 1000) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [permission, setPermission] = useState('undetermined');
  const [address, setAddress] = useState(null);
  const subRef = useRef(null);
  const lastGeocodeRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;
      setPermission(status);

      if (status !== 'granted') {
        setErrorMsg('Location permission was denied. Enable it in Settings to see your position.');
        return;
      }

      // Helps Android get an initial fix faster (uses wifi/cell as a bootstrap).
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // User declined the "turn on location services" dialog, or unsupported. Non-fatal.
      }

      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval, // refresh rate chosen in Settings
          distanceInterval: 0, // report every update, don't wait for movement
          mayShowUserSettingsDialog: true,
        },
        (loc) => {
          if (!mounted) return;
          setLocation(loc);
          maybeReverseGeocode(loc);
        }
      );
    })();

    return () => {
      mounted = false;
      if (subRef.current) subRef.current.remove();
    };
    // Re-subscribe whenever the refresh interval changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeInterval]);

  // Reverse geocode is rate-limited and comparatively slow — only run it at most
  // once every 15s so it never throttles the position stream.
  async function maybeReverseGeocode(loc) {
    const now = loc.timestamp || 0;
    if (now - lastGeocodeRef.current < 15000) return;
    lastGeocodeRef.current = now;
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (results && results.length) setAddress(results[0]);
    } catch {
      // Reverse geocoding is a best-effort extra; ignore failures.
    }
  }

  return { location, errorMsg, permission, address };
}
