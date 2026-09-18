// Solar exposure for one window of one house, computed rather than asserted.
//
//   npx tsx scripts/solar-window.ts --lat 40.7128 --lon -74.0060 --tz America/New_York --azimuth 287
//   npx tsx scripts/solar-window.ts --lat 32.7767 --lon -96.7970 --tz America/Chicago --azimuth 90 --obstructed
//   npx tsx scripts/solar-window.ts --selftest
//
// -----------------------------------------------------------------------------------------------
// WHY THIS IS THE ENGINE AND NOT AN LLM CALL.
//
// A report that says "your bedroom gets no morning light" is either arithmetic or it is a guess,
// and the entire value of saying it is that it is arithmetic. This implements the NOAA solar
// position algorithm: Julian century, geometric mean longitude and anomaly, equation of centre,
// apparent longitude, obliquity, declination, equation of time, hour angle, then zenith and
// azimuth. Deterministic, reproducible by anyone with the same inputs, and free to run.
//
// --selftest checks the output against published NOAA values for New York at both solstices and an
// equinox before any of it is trusted. If the physics is wrong the product is worthless, so the
// physics gets a test rather than a comment claiming it works.
//
// -----------------------------------------------------------------------------------------------
// WHAT THIS DELIBERATELY DOES NOT KNOW: the neighbour's house, the oak tree, the ridge line.
// Astronomical sunrise at 07:12 means nothing if a two-storey house sits fifteen feet east. So the
// output is labelled an UNOBSTRUCTED solar vector profile, and --obstructed applies a 15-degree
// horizon cutoff, which is roughly what a two-storey building at a typical suburban setback
// subtends. That is an approximation and is reported as one. Selling a precise-looking time that
// a tree makes false is exactly the kind of claim this project does not make.
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const norm360 = (d: number) => ((d % 360) + 360) % 360;

interface SunPos { elevation: number; azimuth: number }

/** Days from the J2000.0 epoch for a UTC instant. */
function julianDay(utcMs: number): number {
  return utcMs / 86400000 + 2440587.5;
}

/**
 * Sun elevation (degrees above the true horizon, refraction-corrected) and azimuth (degrees
 * clockwise from true north) for an instant and a place. NOAA's algorithm, in the order NOAA
 * states it.
 */
export function sunPosition(utcMs: number, lat: number, lon: number): SunPos {
  const T = (julianDay(utcMs) - 2451545) / 36525;

  const L0 = norm360(280.46646 + T * (36000.76983 + T * 0.0003032));
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  const C =
    Math.sin(M * D2R) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * D2R) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * D2R) * 0.000289;

  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * D2R);

  const e0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const obliq = e0 + 0.00256 * Math.cos(omega * D2R);

  const decl = Math.asin(Math.sin(obliq * D2R) * Math.sin(appLong * D2R)) * R2D;

  const y = Math.tan((obliq / 2) * D2R) ** 2;
  const eqTime =
    4 * R2D *
    (y * Math.sin(2 * L0 * D2R) -
      2 * e * Math.sin(M * D2R) +
      4 * e * y * Math.sin(M * D2R) * Math.cos(2 * L0 * D2R) -
      0.5 * y * y * Math.sin(4 * L0 * D2R) -
      1.25 * e * e * Math.sin(2 * M * D2R));

  // Minutes past UTC midnight for this instant.
  const utcMinutes = ((utcMs % 86400000) + 86400000) % 86400000 / 60000;
  // True solar time, in minutes, at this longitude.
  const tst = (utcMinutes + eqTime + 4 * lon + 1440) % 1440;
  let ha = tst / 4 - 180;
  if (ha < -180) ha += 360;

  const latR = lat * D2R, declR = decl * D2R, haR = ha * D2R;
  const cosZen = Math.sin(latR) * Math.sin(declR) + Math.cos(latR) * Math.cos(declR) * Math.cos(haR);
  const zenith = Math.acos(Math.min(1, Math.max(-1, cosZen))) * R2D;
  let elevation = 90 - zenith;

  // Atmospheric refraction. Negligible overhead, worth ~0.5 degrees at the horizon -- which is
  // exactly where sunrise times are decided, so it is not optional here.
  if (elevation > -0.575) {
    const te = Math.tan(elevation * D2R);
    let r: number;
    if (elevation > 85) r = 0;
    else if (elevation > 5) r = 58.1 / te - 0.07 / te ** 3 + 0.000086 / te ** 5;
    else if (elevation > -0.575) r = 1735 + elevation * (-518.2 + elevation * (103.4 + elevation * (-12.79 + elevation * 0.711)));
    else r = -20.774 / te;
    elevation += r / 3600;
  }

  let azimuth: number;
  const denom = Math.cos(latR) * Math.sin(zenith * D2R);
  if (Math.abs(denom) > 1e-9) {
    const c = Math.min(1, Math.max(-1, (Math.sin(latR) * Math.cos(zenith * D2R) - Math.sin(declR)) / denom));
    azimuth = ha > 0 ? norm360(Math.acos(c) * R2D + 180) : norm360(540 - Math.acos(c) * R2D);
  } else {
    azimuth = lat > 0 ? 180 : 0;
  }
  return { elevation, azimuth };
}

/** UTC ms for a given local wall-clock minute in an IANA zone, resolved by iteration. */
function localToUtc(y: number, m: number, d: number, minutes: number, tz: string): number {
  let guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  for (let i = 0; i < 3; i++) {
    const offset = tzOffsetMinutes(guess, tz);
    const target = Date.UTC(y, m - 1, d, 0, 0) + minutes * 60000 - offset * 60000;
    if (Math.abs(target - guess) < 1000) break;
    guess = target;
  }
  return guess;
}

/** Offset of an IANA zone from UTC, in minutes, at a given instant. Handles DST. */
function tzOffsetMinutes(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p: Record<string, string> = {};
  for (const { type, value } of dtf.formatToParts(new Date(utcMs))) p[type] = value;
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

const hhmm = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(Math.round(mins) % 60).padStart(2, '0')}`;

export interface WindowDay {
  date: string;
  sunriseMin: number | null;
  sunsetMin: number | null;
  firstDirectMin: number | null;
  lastDirectMin: number | null;
  directMinutes: number;
  /** Direct minutes falling before 09:00 local -- the circadian-relevant slice. */
  morningDirectMinutes: number;
  peakElevation: number;
}

/**
 * Minute-by-minute scan of one local day: when does direct sun actually reach a vertical window
 * facing `windowAz`, given a horizon cutoff.
 *
 * A vertical window is lit when the sun is above the (possibly obstructed) horizon AND within 90
 * degrees of the window's normal. Beyond 90 degrees the sun is behind the wall.
 */
export function windowDay(
  y: number, m: number, d: number, lat: number, lon: number, tz: string,
  windowAz: number, horizonCutoff = 0,
): WindowDay {
  let sunrise: number | null = null, sunset: number | null = null;
  let first: number | null = null, last: number | null = null;
  let direct = 0, morning = 0, peak = -90;
  let prevUp = false;

  for (let min = 0; min < 1440; min++) {
    const { elevation, azimuth } = sunPosition(localToUtc(y, m, d, min, tz), lat, lon);
    if (elevation > peak) peak = elevation;

    const up = elevation > -0.833;            // standard sunrise/sunset definition
    if (up && !prevUp && sunrise === null) sunrise = min;
    if (!up && prevUp) sunset = min;
    prevUp = up;

    const delta = Math.abs(((azimuth - windowAz + 540) % 360) - 180);
    if (elevation > horizonCutoff && delta < 90) {
      direct++;
      if (min < 540) morning++;
      if (first === null) first = min;
      last = min;
    }
  }
  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    sunriseMin: sunrise, sunsetMin: sunset,
    firstDirectMin: first, lastDirectMin: last,
    directMinutes: direct, morningDirectMinutes: morning,
    peakElevation: Math.round(peak * 10) / 10,
  };
}

// ---- self test ---------------------------------------------------------------------------------
// Published NOAA / US Naval Observatory values for New York City (40.7128 N, 74.0060 W).
// If these drift, everything downstream is wrong and must not ship.
function selftest(): void {
  const NY = { lat: 40.7128, lon: -74.006, tz: 'America/New_York' };
  const cases = [
    { label: 'NYC summer solstice', y: 2026, m: 6, d: 21, sunrise: '05:25', sunset: '20:31', noonEl: 72.7 },
    { label: 'NYC winter solstice', y: 2026, m: 12, d: 21, sunrise: '07:17', sunset: '16:32', noonEl: 25.9 },
    { label: 'NYC March equinox', y: 2026, m: 3, d: 20, sunrise: '06:58', sunset: '19:08', noonEl: 49.3 },
  ];
  let bad = 0;
  console.log('  self test -- computed against published NOAA values for New York City\n');
  console.log(`  ${'case'.padEnd(22)}${'sunrise'.padStart(9)}${'expect'.padStart(9)}${'sunset'.padStart(9)}${'expect'.padStart(9)}${'noon el'.padStart(9)}${'expect'.padStart(8)}`);
  for (const c of cases) {
    const r = windowDay(c.y, c.m, c.d, NY.lat, NY.lon, NY.tz, 180, 0);
    const sr = hhmm(r.sunriseMin!), ss = hhmm(r.sunsetMin!);
    const dSr = Math.abs(r.sunriseMin! - (+c.sunrise.slice(0, 2) * 60 + +c.sunrise.slice(3)));
    const dSs = Math.abs(r.sunsetMin! - (+c.sunset.slice(0, 2) * 60 + +c.sunset.slice(3)));
    const dEl = Math.abs(r.peakElevation - c.noonEl);
    const ok = dSr <= 2 && dSs <= 2 && dEl <= 0.5;
    if (!ok) bad++;
    console.log(`  ${c.label.padEnd(22)}${sr.padStart(9)}${c.sunrise.padStart(9)}${ss.padStart(9)}${c.sunset.padStart(9)}${String(r.peakElevation).padStart(9)}${String(c.noonEl).padStart(8)}  ${ok ? 'ok' : 'FAIL'}`);
  }

  // An east-facing window must see the sun in the morning and never in the afternoon; a
  // north-facing window at this latitude must see almost none. Sanity on the azimuth test itself.
  const east = windowDay(2026, 6, 21, NY.lat, NY.lon, NY.tz, 90, 0);
  const north = windowDay(2026, 12, 21, NY.lat, NY.lon, NY.tz, 0, 0);
  console.log(`\n  east-facing window, 21 Jun : first direct ${hhmm(east.firstDirectMin!)}, last ${hhmm(east.lastDirectMin!)}, ${east.directMinutes} min`);
  console.log(`  north-facing window, 21 Dec: ${north.directMinutes} minutes of direct sun`);
  if (east.lastDirectMin! > 900) { console.log('  FAIL: east window still lit after 15:00'); bad++; }
  if (north.directMinutes > 0) { console.log('  FAIL: north window lit at winter solstice in NYC'); bad++; }

  console.log(bad ? `\n  ${bad} FAILURE(S) -- do not ship\n` : '\n  all checks passed\n');
  if (bad) process.exit(1);
}

// ---- cli ---------------------------------------------------------------------------------------
const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

// windowDay() is exported, so the CLI must not fire on import -- without this guard, any script
// that imports the engine gets the usage message and an exit(1) instead of a function.
const isEntry = process.argv[1]?.includes('solar-window');

if (!isEntry) {
  // imported as a library; nothing to do
} else if (process.argv.includes('--selftest')) {
  selftest();
} else {
  const lat = Number(arg('lat')), lon = Number(arg('lon'));
  const az = Number(arg('azimuth'));
  const tz = arg('tz') ?? 'America/New_York';
  const cutoff = process.argv.includes('--obstructed') ? 15 : 0;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(az)) {
    console.error('usage: --lat <deg> --lon <deg> --azimuth <deg the window faces> [--tz IANA] [--obstructed]');
    process.exit(1);
  }
  const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const face = COMPASS[Math.round(norm360(az) / 22.5) % 16];

  console.log(`\n  UNOBSTRUCTED SOLAR VECTOR PROFILE`);
  console.log(`  ${lat.toFixed(4)}, ${lon.toFixed(4)}  ·  window faces ${norm360(az).toFixed(0)}° ${face}  ·  ${tz}`);
  console.log(cutoff ? `  horizon cutoff ${cutoff}° applied (close building or tree line)\n` : `  open horizon assumed -- see the caveat below\n`);

  const dates: Array<[number, number, number, string]> = [
    [2026, 12, 21, 'winter solstice'], [2026, 3, 20, 'March equinox'],
    [2026, 6, 21, 'summer solstice'], [2026, 9, 22, 'September equinox'],
  ];
  console.log(`  ${'date'.padEnd(20)}${'sunrise'.padStart(9)}${'first direct'.padStart(14)}${'last direct'.padStart(13)}${'total'.padStart(9)}${'before 09:00'.padStart(14)}`);
  for (const [y, m, d, label] of dates) {
    const r = windowDay(y, m, d, lat, lon, tz, az, cutoff);
    const fd = r.firstDirectMin === null ? '—' : hhmm(r.firstDirectMin);
    const ld = r.lastDirectMin === null ? '—' : hhmm(r.lastDirectMin);
    console.log(`  ${label.padEnd(20)}${hhmm(r.sunriseMin!).padStart(9)}${fd.padStart(14)}${ld.padStart(13)}${(`${r.directMinutes}m`).padStart(9)}${(`${r.morningDirectMinutes}m`).padStart(14)}`);
  }
  console.log(`\n  This is the sun's position in an open sky. It does not know about the neighbour's`);
  console.log(`  house, a tree line or a ridge. Re-run with --obstructed for a 15° horizon cutoff.\n`);
}
