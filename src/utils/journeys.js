import AsyncStorage from '@react-native-async-storage/async-storage';

// Persisted list of finished walks, plus a slot for the in-progress one so a
// crash mid-walk doesn't lose recorded steps.
const LIST_KEY = '@freecompass/journeys';
const ACTIVE_KEY = '@freecompass/active-journey';

// Average adult walking stride, used to estimate distance from step count.
export const DEFAULT_STRIDE_M = 0.75;

export async function loadJourneys() {
  try {
    const raw = await AsyncStorage.getItem(LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveJourney(journey) {
  const list = await loadJourneys();
  // Newest first; de-dupe by id in case of a recovery + normal save race.
  const next = [journey, ...list.filter((j) => j.id !== journey.id)];
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(next));
  return next;
}

export async function deleteJourney(id) {
  const list = await loadJourneys();
  const next = list.filter((j) => j.id !== id);
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(next));
  return next;
}

export async function clearJourneys() {
  await AsyncStorage.removeItem(LIST_KEY);
  return [];
}

// --- in-progress session (crash safety) ---
export async function saveActive(journey) {
  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(journey));
}

export async function loadActive() {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearActive() {
  await AsyncStorage.removeItem(ACTIVE_KEY);
}

// Great-circle distance between two {latitude, longitude} points, in metres.
export function haversine(a, b) {
  if (!a || !b) return null;
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
