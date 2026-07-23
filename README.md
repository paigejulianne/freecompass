# FreeCompass

A cross-platform (iOS + Android) mobile compass and GPS readout built with
[Expo](https://expo.dev) / React Native.

- **Compass dial** with a tick line every **10°** — cardinal ticks (N/E/S/W) are
  longest, 30° ticks are labelled with their bearing. The rose rotates so your
  current heading always sits under the fixed red pointer, with a large digital
  bearing + cardinal in the centre. Uses **true north** when a GPS fix is
  available, otherwise falls back to magnetic north.
- **Bubble level / inclinometer** below the dial. A ball rolls toward the low
  side (like a ball in a dish) and turns green when the phone is flat, with live
  **side-to-side (roll)** and **front-to-back (pitch)** angle readouts. Because a
  magnetic heading is only trustworthy when the phone is held flat, this doubles
  as a "your heading is accurate now" indicator. Derived from the accelerometer's
  gravity vector via `expo-sensors`.
- **Distance Meter** — a step-and-turn path recorder for the field:
  - Toggle recording on; then walk. The **pedometer counts your steps** while the
    **compass tracks your facing direction**.
  - When you turn past ~25°, the current leg is closed and a new one begins, so a
    walk becomes a sequence of legs: *(bearing, steps)*.
  - Every walk is **saved on the device** (survives an app crash mid-walk via an
    auto-recovered in-progress session — no connectivity needed).
  - Recall any walk in a **turn-by-turn view**: "Head 045° (NE) — walk 100 steps",
    "Turn to 120° (ESE) — walk 40 steps", … with per-leg and total distance
    estimates, duration, and straight-line displacement from start.
- **Settings** (persisted between launches):
  - **North reference** — toggle between **True North** and **Magnetic North**.
    True north is used automatically once a GPS fix resolves the local
    declination; until then it falls back to magnetic with a notice.
  - **Refresh rate** — choose how often the GPS position updates:
    **1s / 2s / 3s / 5s / 10s**. Slower rates save battery in the field.
- **Live GPS readout** at the highest accuracy tier the device supports
  (`BestForNavigation`):
  - Latitude & longitude — both decimal degrees and DMS
  - Horizontal accuracy (± metres) with a quality label
  - Altitude (metres + feet) and vertical accuracy
  - Ground speed (km/h + mph) and GPS course
  - Local magnetic declination (true − magnetic heading)
  - Approximate street address (reverse geocoded, rate-limited)
  - Fix timestamp

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (required by Expo SDK 54)
- The **Expo Go** app on your phone (App Store / Play Store), _or_ an iOS
  Simulator / Android Emulator

## Run it

```bash
npm install
npm start
```

Then:

- **On a phone** — scan the QR code shown in the terminal with Expo Go
  (Android) or the Camera app (iOS). This is the best way to test, since
  simulators/emulators have no real GPS or magnetometer.
- **iOS Simulator** — press `i`
- **Android Emulator** — press `a`

The app will ask for location permission on first launch; grant it so the
compass and coordinates can populate.

> Tip: If dependency versions ever mismatch your installed Expo SDK, run
> `npx expo install --fix` to realign them.

## Install a standalone, offline APK (field use)

Expo Go streams the JS from the dev server, so it needs your computer nearby.
For real field use with **no connectivity**, build a **release APK** that bundles
the JavaScript inside the app — it installs once and runs entirely on the phone.

Requirements (one-time): a JDK 17+ and the Android SDK (both ship with Android
Studio), with `JAVA_HOME` and `ANDROID_HOME`/`ANDROID_SDK_ROOT` set.

```bash
# Plug in the phone with USB debugging enabled, then:
npx expo run:android --variant release
```

This prebuilds the native project, compiles a release APK with the JS bundled in,
and installs it over USB. After that you can unplug and use it anywhere.

Everything the app needs works **fully offline**:

| Feature | Offline? | Why |
|---|---|---|
| Compass heading | ✅ | Magnetometer + motion sensors are on-device |
| Bubble level | ✅ | Accelerometer is on-device |
| Latitude / longitude | ✅ | GPS is satellite-based, no data connection needed |
| Altitude, accuracy, speed | ✅ | Part of the GPS fix |
| Street address | ❌ | Reverse geocoding needs a network — fails silently offline; every other field keeps working |

To produce a shareable APK file without installing, run
`npx expo run:android --variant release` once, then find the APK at
`android/app/build/outputs/apk/release/app-release.apk`.

## How the accuracy is maximised

- `Accuracy.BestForNavigation` keeps the GPS radio active and enables extra
  sensor fusion on iOS.
- `enableNetworkProviderAsync()` lets Android bootstrap a fast initial fix from
  wifi/cell before satellites lock.
- Heading comes from `watchHeadingAsync`, which fuses magnetometer +
  accelerometer + gyroscope and reports true north + an accuracy estimate,
  rather than reading the raw magnetometer.
- Position updates stream every 0.5 s with no distance threshold, so values
  refresh continuously.

Real-world accuracy still depends on hardware and sky visibility — expect a few
metres outdoors with a clear view, and larger error indoors or in urban canyons.

## Project structure

```
App.js                     App shell: layout, status text, wiring
index.js                   Expo entry point
app.json                   Expo config + location permission strings
src/
  components/Compass.js            SVG compass rose with 10° tick lines
  components/LevelIndicator.js     Bubble level (roll + pitch)
  components/InfoPanel.js          GPS / sensor data table
  components/SegmentedControl.js   Reusable settings toggle
  components/DistanceMeter.js      Step/turn recorder on/off card
  components/SavedWalks.js         Saved walks list + turn-by-turn view
  hooks/useHeading.js              Compass heading (true + magnetic)
  hooks/useLocation.js             Streaming GPS position (refresh-configurable)
  hooks/useTilt.js                 Phone tilt from the accelerometer
  hooks/useSettings.js             Persisted settings (north ref, refresh)
  hooks/useJourneyRecorder.js      Pedometer + heading -> saved leg sequence
  utils/format.js                  DMS / units / cardinal formatting helpers
  utils/journeys.js                On-device walk storage + haversine
scripts/make-icons.js              Regenerates app icons from the SVG design
```
