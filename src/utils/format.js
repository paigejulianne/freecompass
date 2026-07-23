// Small pure formatting helpers shared across the UI.

// Decimal degrees -> degrees/minutes/seconds string, e.g. 37°48'29.6"N
export function toDMS(value, isLat) {
  if (value == null || Number.isNaN(value)) return '—';
  const hemisphere = isLat
    ? value >= 0 ? 'N' : 'S'
    : value >= 0 ? 'E' : 'W';
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  return `${deg}°${String(min).padStart(2, '0')}'${sec.toFixed(1).padStart(4, '0')}"${hemisphere}`;
}

// Fixed-precision decimal degrees with a trailing hemisphere letter.
export function toDecimal(value, isLat, digits = 6) {
  if (value == null || Number.isNaN(value)) return '—';
  const hemisphere = isLat
    ? value >= 0 ? 'N' : 'S'
    : value >= 0 ? 'E' : 'W';
  return `${Math.abs(value).toFixed(digits)}° ${hemisphere}`;
}

// Metres, formatted with a companion feet value.
export function metresWithFeet(m, digits = 1) {
  if (m == null || Number.isNaN(m)) return '—';
  const feet = m * 3.28084;
  return `${m.toFixed(digits)} m  (${feet.toFixed(0)} ft)`;
}

export function metres(m, digits = 1) {
  if (m == null || Number.isNaN(m) || m < 0) return '—';
  return `${m.toFixed(digits)} m`;
}

// Speed given in m/s -> "x.x km/h · y.y mph".
export function speed(ms) {
  if (ms == null || Number.isNaN(ms) || ms < 0) return '—';
  const kmh = ms * 3.6;
  const mph = ms * 2.236936;
  return `${kmh.toFixed(1)} km/h · ${mph.toFixed(1)} mph`;
}

// Degrees -> "N", "NNE", "NE", ... (16-point compass).
const POINTS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];
export function cardinal(deg) {
  if (deg == null || Number.isNaN(deg)) return '—';
  const idx = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return POINTS[idx];
}

export function degrees(deg, digits = 0) {
  if (deg == null || Number.isNaN(deg)) return '—';
  const norm = ((deg % 360) + 360) % 360;
  return `${norm.toFixed(digits)}°`;
}

export function timestamp(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  return d.toLocaleTimeString();
}

export function dateTime(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// Steps × stride -> "76 m · 249 ft".
export function stepDistance(steps, strideM = 0.75) {
  if (steps == null || Number.isNaN(steps)) return '—';
  const m = steps * strideM;
  const ft = m * 3.28084;
  return `${m.toFixed(0)} m · ${ft.toFixed(0)} ft`;
}

// Duration in ms -> "3m 12s" / "1h 04m".
export function duration(ms) {
  if (!ms || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}
