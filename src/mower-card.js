/*
 * Mower Card for Home Assistant
 * https://github.com/juju35/ha-mower-card
 *
 * Lovelace cards for robot lawn mowers, whatever the integration: Husqvarna Automower
 * (https://www.home-assistant.io/integrations/husqvarna_automower/), Ecovacs GOAT
 * (https://www.home-assistant.io/integrations/ecovacs/), Landroid Cloud (https://github.com/MTrab/landroid_cloud),
 * Mammotion (https://github.com/mikey0000/Mammotion-HA), ZCS Mower (https://github.com/ufozone/ha-zcs-mower),
 * Bosch Indego (https://github.com/jm-73/indego), Gardena Smart System
 * (https://github.com/py-smart-gardena/hass-gardena-smart-system) and any other integration with a lawn_mower entity.
 * Entities are resolved through the entity and device registries (platform, translation_key and device), so they
 * work whatever the Home Assistant language or entity ids.
 */

const VERSION = "__VERSION__";
const IMG_LOGO_HUSQVARNA = "__IMG_LOGO_HUSQVARNA__";
const IMG_LOGO_LANDROID = "__IMG_LOGO_LANDROID__";
const IMG_LOGO_ECOVACS = "__IMG_LOGO_ECOVACS__";
const IMG_LOGO_MAMMOTION = "__IMG_LOGO_MAMMOTION__";
const IMG_LOGO_ZCS = "__IMG_LOGO_ZCS__";
const IMG_LOGO_INDEGO = "__IMG_LOGO_INDEGO__";
const IMG_LOGO_GARDENA = "__IMG_LOGO_GARDENA__";

// ---------------------------------------------------------------------------
// Drawn pictures
// ---------------------------------------------------------------------------
// The mower is a drawing, colored after its brand and animated by what it is doing (`activity`): mowing (it drives
// across the lawn, its wheels turn and clippings fly), returning (it slides back onto its charging station),
// charging (the station light pulses), error (its light blinks red), rain (drops fall while it waits), none (at rest).

// Animations, shared by every picture. Pictures are <img>, so CSS animations run but no script does.
const ANIM_CSS = `
  .spin { transform-box: fill-box; transform-origin: center; animation: spin .6s linear infinite; }
  .sway { animation: sway 2.6s ease-in-out infinite alternate; }
  .home { animation: home 2.8s cubic-bezier(.3,.7,.4,1) infinite; }
  .clip { animation: clip 1.1s ease-out infinite; }
  .wave { transform-box: fill-box; transform-origin: 50% 100%; animation: wave 1.4s ease-in-out infinite alternate; }
  .pulse { animation: pulse 1.8s ease-in-out infinite; }
  .blink { animation: blink 1s steps(2, start) infinite; }
  .drop { animation: drop 1.2s linear infinite; }
  .d1 { animation-delay: -.25s; } .d2 { animation-delay: -.5s; } .d3 { animation-delay: -.75s; } .d4 { animation-delay: -1s; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes sway { from { transform: translateX(-8px); } to { transform: translateX(8px); } }
  @keyframes home { 0% { transform: translateX(-80px); opacity: 0; } 15% { opacity: 1; } 65%, 100% { transform: none; opacity: 1; } }
  @keyframes clip { from { transform: translate(0, 0) rotate(0); opacity: 0; } 25% { opacity: .95; } to { transform: translate(-10px, -16px) rotate(140deg); opacity: 0; } }
  @keyframes wave { from { transform: skewX(-8deg); } to { transform: skewX(8deg); } }
  @keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
  @keyframes blink { to { opacity: 0; } }
  @keyframes drop { from { transform: translateY(-14px); opacity: 0; } 20% { opacity: .9; } to { transform: translateY(26px); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`;

// Body colors of the drawn mower, per brand: top shell, lower shell, bumper stripe, wheels.
const MOWER_COLORS = {
  husqvarna: { top: "#4b5057", side: "#2b2f34", stripe: "#f35321", wheel: "#1c1e21", hub: "#8d939a" },
  landroid: { top: "#f08a1d", side: "#2b2b2b", stripe: "#1f1f1f", wheel: "#1c1e21", hub: "#9a9ea3" },
  ecovacs: { top: "#3e4349", side: "#24272b", stripe: "#3d9be9", wheel: "#1c1e21", hub: "#8d939a" },
  mammotion: { top: "#f1f2f0", side: "#2f3338", stripe: "#45c46a", wheel: "#1c1e21", hub: "#b5b9bd" },
  zcs: { top: "#f1f2f0", side: "#2f3338", stripe: "#4aa3ea", wheel: "#1c1e21", hub: "#b5b9bd" },
  indego: { top: "#4faa3b", side: "#2b2f34", stripe: "#e8e8e6", wheel: "#1c1e21", hub: "#8d939a" },
  gardena: { top: "#3d4a52", side: "#262d33", stripe: "#1fb3c9", wheel: "#1c1e21", hub: "#8d939a" },
  generic: { top: "#4b5057", side: "#2b2f34", stripe: "#45c46a", wheel: "#1c1e21", hub: "#8d939a" },
};

const svgDoc = (w, h, body, defs = "", anim = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${anim ? `<style>${ANIM_CSS}</style>` : ""}${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`;

// A wheel of radius r centred on (cx, cy): tyre, hub and spokes (turning while `moving`).
const wheel = (cx, cy, r, col, moving) => {
  const spokes = [0, 60, 120]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      const dx = r * 0.62 * Math.cos(rad), dy = r * 0.62 * Math.sin(rad);
      return `<line x1="${(cx - dx).toFixed(1)}" y1="${(cy - dy).toFixed(1)}" x2="${(cx + dx).toFixed(1)}" y2="${(cy + dy).toFixed(1)}" stroke="${col.hub}" stroke-width="${(r * 0.16).toFixed(1)}" stroke-linecap="round"/>`;
    })
    .join("");
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col.wheel}"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.86).toFixed(1)}" fill="none" stroke="#3a3e43" stroke-width="${(r * 0.14).toFixed(1)}" stroke-dasharray="${(r * 0.3).toFixed(1)} ${(r * 0.22).toFixed(1)}"/>
    <g class="${moving ? "spin" : ""}">${spokes}<circle cx="${cx}" cy="${cy}" r="${(r * 0.24).toFixed(1)}" fill="${col.hub}"/></g>`;
};

// The mower seen from the side, drawn in its own coordinates (104 wide, the ground at y = 0, the body above it) and
// placed with a transform: rounded lower shell, hood in the brand color, bumper stripe, big rear wheel and small front
// wheel, red stop button and status light (`light`: a color, or null for none).
const mowerShape = (transform, col, { moving = false, light = null, lightClass = "" } = {}) => {
  let s = `<ellipse cx="54" cy="0" rx="56" ry="4" opacity=".2"/>`;
  s += `<path d="M6 -12 H98 Q104 -12 104 -18 V-24 Q104 -30 96 -30 H10 Q2 -30 2 -22 V-18 Q2 -12 6 -12 Z" fill="${col.side}"/>`;
  s += `<path d="M8 -30 Q10 -46 30 -48 H72 Q92 -48 98 -30 Z" fill="${col.top}"/>`;
  s += `<line x1="6" y1="-30" x2="100" y2="-30" stroke="${col.stripe}" stroke-width="3" stroke-linecap="round"/>`;
  s += `<rect x="40" y="-53" width="16" height="6" rx="2" fill="#c62828"/>`;
  if (light) s += `<circle class="${lightClass}" cx="90" cy="-40" r="2.5" fill="${light}"/>`;
  s += wheel(24, -14, 14, col, moving);
  s += wheel(86, -7, 7, col, moving);
  return `<g transform="${transform}">${s}</g>`;
};

// Lawn under the mower (width w from x, its top at y), its blades waving while the mower works.
const lawn = (x, y, w, moving) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="10" rx="4" fill="#5aa83d"/>`;
  for (let i = 0; i < w / 9; i++) {
    const bx = x + 4 + i * 9;
    s += `<path class="${moving ? `wave d${i % 4}` : ""}" d="M${bx} ${y + 2} q1.5 -6 3 -9 q0 5 2 9" fill="#79c257"/>`;
  }
  return s;
};

// Clippings flying up behind the blade deck, at (x, y).
const clippings = (x, y) =>
  [0, 8, 16, 24]
    .map((dx, i) => `<rect class="clip d${i}" x="${x + dx}" y="${y}" width="4" height="1.6" rx=".8" fill="#9ad66f"/>`)
    .join("");

// Rain over the lawn.
const rain = (x, y, w) =>
  [0.1, 0.3, 0.5, 0.7, 0.9]
    .map((f, i) => `<line class="drop d${i % 4}" x1="${x + f * w}" y1="${y}" x2="${x + f * w - 2}" y2="${y + 9}" stroke="#4aa3ea" stroke-width="2" stroke-linecap="round" opacity="0"/>`)
    .join("");

// Mower out on the lawn (160 × 104): driving while it mows, still otherwise; rain falling while it waits for it to stop.
const onLawn = (col, activity) => {
  const moving = activity === "mowing";
  const light = activity === "error" ? "#e53935" : moving ? "#43c463" : null;
  let s = lawn(4, 86, 152, moving);
  s += `<g class="${moving ? "sway" : ""}">${mowerShape("translate(12 86) scale(1.3)", col, { moving, light, lightClass: activity === "error" ? "blink" : "" })}${moving ? clippings(4, 78) : ""}</g>`;
  if (activity === "rain") s += rain(10, 24, 140);
  return svgDoc(160, 104, s, "", !!activity);
};

// Mower on its charging station (160 × 160): a base plate with its post, the light pulsing while charging; returning,
// the mower slides in from the left.
const onStation = (col, activity) => {
  const charging = activity === "charging";
  let s = lawn(4, 142, 152, false);
  // Station: base plate and post with its light.
  s += `<path d="M8 142 V138 Q8 134 14 134 H146 Q152 134 152 138 V142 Z" fill="#3a3e43"/>`;
  s += `<rect x="128" y="60" width="20" height="76" rx="6" fill="#4b5057"/><rect x="132" y="66" width="12" height="34" rx="4" fill="#2b2f34"/>`;
  s += `<circle class="${charging ? "pulse" : ""}" cx="138" cy="76" r="3.5" fill="${charging ? "#43c463" : activity === "error" ? "#e53935" : "#8d939a"}"/>`;
  s += `<g class="${activity === "returning" ? "home" : ""}">${mowerShape("translate(10 134) scale(1.15)", col, { moving: activity === "returning", light: charging ? "#43c463" : null })}</g>`;
  return svgDoc(160, 160, s, "", !!activity);
};

// The picture of a device: its brand's colors, on the lawn or at the station depending on the activity.
const mowerSvg = (brand, activity = null) => {
  const col = MOWER_COLORS[brand] || MOWER_COLORS.generic;
  return ["docked", "charging", "returning"].includes(activity) ? onStation(col, activity === "docked" ? null : activity) : onLawn(col, activity);
};
const svgUri = (svg) => svg && `data:image/svg+xml,${encodeURIComponent(svg)}`;

// Status (and charging / rain binary sensors) → activity of the picture.
const activityOf = (state, charging, raining) => {
  if (["mowing", "edgecut", "zoning", "starting", "searching_zone", "leaving"].includes(state)) return "mowing";
  if (state === "returning") return "returning";
  if (state === "docked") return charging ? "charging" : "docked";
  if (state === "error" || state === "escaped_digital_fence") return "error";
  if (state === "rain_delayed" || raining) return "rain";
  return null;
};

// ---------------------------------------------------------------------------
// Brands and integrations
// ---------------------------------------------------------------------------
// The integration a device comes from gives the logo of the header, the colors of the picture and the accent color
// of the buttons: [light theme, dark theme]. The light-theme shades are darker so that the tinted buttons keep a
// contrast of about 3.5:1 on a white card; the dark-theme ones are lighter.
const BRANDS = {
  husqvarna: { logo: IMG_LOGO_HUSQVARNA, name: "Husqvarna", site: "https://www.husqvarna.com", accent: ["#273a60", "#9db4e6"] },
  landroid: { logo: IMG_LOGO_LANDROID, name: "Worx Landroid", site: "https://www.worx.com", accent: ["#b85f00", "#f39c2b"] },
  ecovacs: { logo: IMG_LOGO_ECOVACS, name: "Ecovacs", site: "https://www.ecovacs.com", accent: ["#0b6bc4", "#3d9be9"] },
  mammotion: { logo: IMG_LOGO_MAMMOTION, name: "Mammotion", site: "https://mammotion.com", accent: ["#1f7a3a", "#45c46a"] },
  zcs: { logo: IMG_LOGO_ZCS, name: "ZCS", site: "https://www.zcsrobotics.com", accent: ["#0b63aa", "#4aa3ea"] },
  indego: { logo: IMG_LOGO_INDEGO, name: "Bosch Indego", site: "https://www.bosch-garden.com", accent: ["#a01622", "#ff7b85"] },
  gardena: { logo: IMG_LOGO_GARDENA, name: "Gardena", site: "https://www.gardena.com", accent: ["#b8411a", "#ff8a5c"] },
  generic: { logo: null, name: "", site: "", accent: ["#2e7d32", "#66bb6a"] },
};
// Integrations the cards know → their brand. Any other integration with a lawn_mower entity gets the generic brand.
const PLATFORMS = {
  husqvarna_automower: "husqvarna",
  landroid_cloud: "landroid",
  ecovacs: "ecovacs",
  mammotion: "mammotion",
  zcsmower: "zcs",
  indego: "indego",
  gardena_smart_system: "gardena",
};
const brandOf = (dev) => PLATFORMS[dev.platform] || "generic";
const brandFor = (dev) => BRANDS[brandOf(dev)];
// Accent of the device's brand for the current theme, overriding the default green of the shared styles.
const accentStyle = (dev, hass) => `:host { --mc-accent: ${brandFor(dev).accent[hass?.themes?.darkMode ? 1 : 0]}; }`;

// Entities are keyed by their translation_key, mapped per integration to the names the cards read (the Husqvarna
// Automower ones where they match). Integrations without translation keys (Bosch Indego, Gardena) are keyed by the
// end of their entity ids instead (ID_KEYS). Left out: the keys the cards never read.
const AUTOMOWER_KEYS = {
  cutting_blade_usage_time: "blade_time",
  total_drive_distance: "total_distance",
  number_of_charging_cycles: "charging_cycles",
  number_of_collisions: "collisions",
  next_start_timestamp: "next_start",
  work_area_progress: "progress",
  work_area_last_time_completed: "last_completed",
  headlight_mode: "headlight",
  enable_schedule: "schedule",
  reset_cutting_blade_usage_time: "reset_blade",
};
const LANDROID_KEYS = {
  daily_progress: "progress",
  next_schedule: "next_start",
  blade_runtime_total: "blade_time",
  distance_driven_total: "total_distance",
  mower_runtime_total: "total_running_time",
  battery_charge_cycles_total: "charging_cycles",
  rain_sensor: "rain",
  zone: "work_area",
  auto_schedule: "schedule",
  reset_blade_time: "reset_blade",
  reset_battery_cycles: "reset_cycles",
};
const ECOVACS_KEYS = {
  stats_area_mower: "area",
  stats_time_mower: "time",
  total_stats_area_mower: "total_area",
  total_stats_time_mower: "total_cutting_time",
  total_stats_cleanings_mower: "sessions",
  lifespan_blade: "blade_life",
  reset_lifespan_blade: "reset_blade",
  work_mode: "mode",
  map: "_image",
};
const MAMMOTION_KEYS = {
  activity_mode: "mode",
  left_time: "remaining_time",
  elapsed_time: "time",
  blade_used_time: "blade_time",
  blade_height: "cutting_height",
  error_1_message: "error",
  rain_detected: "rain",
  maintenance_distance: "total_distance",
  maintenance_work_time: "total_running_time",
  maintenance_bat_cycles: "charging_cycles",
  night_light: "headlight",
};
const ZCS_KEYS = { state: "status", border_cut: "edge_cut", standby: "standby" };
// Bosch Indego and Gardena: the end of the entity id (after the serial) names the entity.
const ID_KEYS = {
  indego: {
    lawn_mowed: "progress",
    lawn_mowed_size: "area",
    last_completed: "last_completed",
    next_mow: "next_start",
    mowing_mode: "mode",
    runtime_total: "total_running_time",
    garden_size: "total_area",
    mower_stuck: "stuck",
    last_error_code: "error",
    maintenance_hours: "blade_time",
    session_count: "sessions",
    battery_cycles: "charging_cycles",
    battery_charging: "charging",
    alert: "alert",
    mower_state_detail: "status",
    camera: "_camera",
    smartmowing: "schedule",
  },
  gardena_smart_system: { operating_hours: "total_running_time", last_error_code: "error" },
};
const KEY_MAPS = { husqvarna_automower: AUTOMOWER_KEYS, landroid_cloud: LANDROID_KEYS, ecovacs: ECOVACS_KEYS, mammotion: MAMMOTION_KEYS, zcsmower: ZCS_KEYS, gardena_smart_system: { mower_error: "error" } };
const PENDING_MS = 45000;
const DEFAULT_COLLAPSED = ["camera", "stats"];
// lawn_mower supported_features bits.
const FEATURE = { start: 1, pause: 2, dock: 4, stop: 8 };

const ICONS = {
  play: "M8,5.14V19.14L19,12.14L8,5.14Z",
  pause: "M14,19H18V5H14M6,19H10V5H6V19Z",
  stop: "M18,18H6V6H18V18Z",
  home: "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
  battery: "M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
  bolt: "M11,15H6L13,1V9H18L11,23V15Z",
  action: "M10,16.5V7.5L16,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  // mdi:robot-mower-outline and mdi:robot-mower (header icon of the kind of device)
  mower:
    "M17 20C15.34 20 14 18.66 14 17S15.34 14 17 14 20 15.34 20 17 18.66 20 17 20M17 12C14.24 12 12 14.24 12 17S14.24 22 17 22 22 19.76 22 17 19.76 12 17 12M7 18C6.45 18 6 17.55 6 17S6.45 16 7 16 8 16.45 8 17 7.55 18 7 18M7 14C5.34 14 4 15.34 4 17S5.34 20 7 20 10 18.66 10 17 8.66 14 7 14M20 9H18V7H20V9M15 7H13V9H15V7M10 7H8V9H10V7M6 7V9H3V13H5V11H8.7C8.9 10.7 9.2 10.4 9.5 10.2L9.9 10H6L6 7Z M22 5H2V3H22V5Z M3 11H6.1C6.5 10.4 7 9.9 7.6 9.5L6 7H3V11Z M21 11V13H13.1C13.5 12.4 14 11.9 14.6 11.5L13 9H21V11Z",
  grass:
    "M12,20H2V18H4.5C4.5,17.03 4.75,16.11 5.17,15.29L3.59,13.71C3.21,13.33 3,12.84 3,12.3V7H5V12.3L6.59,13.89C7.26,13.3 8.09,12.9 9,12.76V7H11V12.76C11.91,12.9 12.74,13.3 13.41,13.89L15,12.3V7H17V12.3C17,12.84 16.79,13.33 16.41,13.71L14.83,15.29C15.25,16.11 15.5,17.03 15.5,18H22V20H12Z",
  area: "M3,3H21V21H3V3M5,5V19H19V5H5M7,7H11V9H9V11H7V7M17,17H13V15H15V13H17V17Z",
  clock:
    "M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z",
  count:
    "M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3",
  stats: "M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z",
  map: "M15,19L9,16.89V5L15,7.11M20.5,3C20.44,3 20.39,3 20.34,3L15,5.1L9,3L3.36,4.9C3.15,4.97 3,5.15 3,5.38V20.5A0.5,0.5 0 0,0 3.5,21C3.55,21 3.61,21 3.66,20.97L9,18.9L15,21L20.64,19.1C20.85,19 21,18.85 21,18.62V3.5A0.5,0.5 0 0,0 20.5,3Z",
  alert: "M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z",
  chevron_down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  // mdi:arrow-expand and mdi:arrow-collapse (mini card detail button)
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
  blade: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4L14.5,9.5L20,12L14.5,14.5L12,20L9.5,14.5L4,12L9.5,9.5L12,4M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z",
  reset: "M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.6L7,5.6L12,0.6V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z",
  calendar: "M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z",
  height: "M13,6.99H16L12,3L8,6.99H11V17.01H8L12,21L16,17.01H13V6.99Z",
  mode: "M3,3H11V11H3V3M13,3H21V11H13V3M3,13H11V21H3V13M18,13H16V16H13V18H16V21H18V18H21V16H18V13Z",
  zone: "M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z",
  rain: "M6,14.03A1,1 0 0,1 7,15.03C7,15.58 6.55,16.03 6,16.03C3.24,16.03 1,13.79 1,11.03C1,8.27 3.24,6.03 6,6.03C7,3.68 9.3,2.03 12,2.03C15.43,2.03 18.24,4.69 18.5,8.06L19,8.03A4,4 0 0,1 23,12.03C23,14.23 21.21,16.03 19,16.03H18C17.45,16.03 17,15.58 17,15.03C17,14.47 17.45,14.03 18,14.03H19A2,2 0 0,0 21,12.03A2,2 0 0,0 19,10.03H17V9.03C17,6.27 14.76,4.03 12,4.03C9.5,4.03 7.45,5.84 7.06,8.21C6.73,8.09 6.37,8.03 6,8.03A3,3 0 0,0 3,11.03A3,3 0 0,0 6,14.03M12,14.15L13.76,16.29C14.75,17.47 14.75,19.45 13.76,20.63C12.79,21.79 11.21,21.79 10.24,20.63C9.25,19.45 9.25,17.47 10.24,16.29L12,14.15Z",
  distance: "M6.5 8.11C5.61 8.11 4.89 7.39 4.89 6.5A1.61 1.61 0 0 1 6.5 4.89C7.39 4.89 8.11 5.61 8.11 6.5V6.5A1.61 1.61 0 0 1 6.5 8.11M6.5 2C4 2 2 4 2 6.5C2 9.87 6.5 14 6.5 14S11 9.87 11 6.5C11 4 9 2 6.5 2M17.5 15.11C16.61 15.11 15.89 14.39 15.89 13.5A1.61 1.61 0 0 1 17.5 11.89C18.39 11.89 19.11 12.61 19.11 13.5A1.61 1.61 0 0 1 17.5 15.11M17.5 9C15 9 13 11 13 13.5C13 16.87 17.5 21 17.5 21S22 16.87 22 13.5C22 11 20 9 17.5 9M17.5 19H6.5A1.5 1.5 0 0 1 5 17.5A1.5 1.5 0 0 1 6.5 16H8.5A3.5 3.5 0 0 0 12 12.5A3.5 3.5 0 0 0 8.5 9H6.5V11H8.5A1.5 1.5 0 0 1 10 12.5A1.5 1.5 0 0 1 8.5 14H6.5A3.5 3.5 0 0 0 3 17.5A3.5 3.5 0 0 0 6.5 21H17.5V19Z",
  collision: "M11,15H6L13,1V9H18L11,23V15Z",
  bulb: "M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z",
  options: "M3,17V19H9V17H3M3,5V7H13V5H3M13,21V19H21V17H13V15H11V21H13M7,9V11H3V13H7V15H9V9H7M21,13V11H11V13H21M15,9H17V7H21V5H17V3H15V9Z",
  // mdi:video
  camera: "M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z",
  lock: "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",
};

const STRINGS = {
  en: {
    start: "Start",
    pause: "Pause",
    stop: "Stop",
    dock: "Dock",
    battery: "Battery",
    charging: "Charging",
    progress: "Progress",
    remaining: "{time} left",
    next_start: "Next start {when}",
    last_completed: "Completed {when}",
    actions: "Actions",
    run_action: "Run {name}?",
    options: "Options",
    on: "On",
    off: "Off",
    cancel: "Cancel",
    reset: "Reset",
    confirm_reset: "Reset the {name} counter? Do it after replacing the part.",
    maintenance: "Maintenance",
    blade: "Blades",
    blade_used: "{time} used",
    charging_cycles: "Charge cycles",
    collisions: "Collisions",
    statistics: "Statistics",
    last_session: "Last session",
    total_cutting_time: "Mowing time",
    total_running_time: "Running time",
    total_charging_time: "Charging time",
    total_searching_time: "Searching time",
    total_distance: "Distance",
    total_area: "Total area",
    sessions: "Mowing sessions",
    map: "Map",
    camera: "Camera",
    camera_unavailable: "Camera unavailable",
    show_camera: "Show camera",
    camera_entity: "Camera entity (optional, replaces the cameras of the device)",
    rain: "Rain detected",
    rain_delay: "Rain delay · {time}",
    cutting_height: "Cutting height",
    stuck: "Mower stuck",
    no_device: "No robot lawn mower found. Is an integration with a lawn mower entity (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…) installed?",
    unknown_device: "Lawn mower not found",
    no_registry: "This card needs Home Assistant 2024.8 or later.",
    // Editor
    device: "Lawn mower",
    title: "Title (optional, defaults to the device name)",
    image: "Device picture",
    image_auto: "Automatic (drawn, brand colors)",
    image_none: "None",
    show_controls: "Show control buttons",
    show_settings: "Show mower settings",
    show_actions: "Show actions",
    show_options: "Show options",
    show_maintenance: "Show maintenance",
    show_stats: "Show statistics",
    show_map: "Show map",
    collapsed: "Sections folded by default",
    map_entity: "Map entity (optional, a camera or image entity)",
    map_never: "Never",
    map_mowing: "While mowing",
    map_always: "Always",
    language: "Language",
    lang_auto: "Automatic",
    zoom: "Detail button",
    zoom_helper: "Button at the top right that switches the mini card to the full card and back",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    // States
    s_mowing: "Mowing",
    s_docked: "Docked",
    s_paused: "Paused",
    s_returning: "Returning to station",
    s_error: "Error",
    s_idle: "Idle",
    s_starting: "Starting",
    s_edgecut: "Edge cutting",
    s_zoning: "Changing zone",
    s_searching_zone: "Searching zone",
    s_escaped_digital_fence: "Outside its area",
    s_rain_delayed: "Rain delay",
    s_leaving: "Leaving station",
    s_unavailable: "Unavailable",
    s_unknown: "Unknown",
  },
  fr: {
    start: "Tondre",
    pause: "Pause",
    stop: "Stop",
    dock: "Station",
    battery: "Batterie",
    charging: "En charge",
    progress: "Progression",
    remaining: "{time} restantes",
    next_start: "Prochain départ {when}",
    last_completed: "Terminé {when}",
    actions: "Actions",
    run_action: "Lancer {name} ?",
    options: "Options",
    on: "Activé",
    off: "Désactivé",
    cancel: "Annuler",
    reset: "Réinitialiser",
    confirm_reset: "Réinitialiser le compteur {name} ? À faire après le remplacement de la pièce.",
    maintenance: "Entretien",
    blade: "Lames",
    blade_used: "{time} d'usage",
    charging_cycles: "Cycles de charge",
    collisions: "Collisions",
    statistics: "Statistiques",
    last_session: "Dernière tonte",
    total_cutting_time: "Temps de tonte",
    total_running_time: "Temps de fonctionnement",
    total_charging_time: "Temps de charge",
    total_searching_time: "Temps de recherche",
    total_distance: "Distance",
    total_area: "Surface totale",
    sessions: "Tontes",
    map: "Carte",
    camera: "Caméra",
    camera_unavailable: "Caméra indisponible",
    show_camera: "Afficher la caméra",
    camera_entity: "Entité caméra (optionnelle, remplace les caméras de l'appareil)",
    rain: "Pluie détectée",
    rain_delay: "Report pluie · {time}",
    cutting_height: "Hauteur de coupe",
    stuck: "Tondeuse bloquée",
    no_device: "Aucun robot tondeuse trouvé. Une intégration avec une entité tondeuse (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…) est-elle installée ?",
    unknown_device: "Tondeuse introuvable",
    no_registry: "Cette carte nécessite Home Assistant 2024.8 ou plus récent.",
    device: "Tondeuse",
    title: "Titre (optionnel, le nom de l'appareil par défaut)",
    image: "Image de l'appareil",
    image_auto: "Automatique (dessin aux couleurs de la marque)",
    image_none: "Aucune",
    show_controls: "Afficher les boutons de commande",
    show_settings: "Afficher les réglages de la tondeuse",
    show_actions: "Afficher les actions",
    show_options: "Afficher les options",
    show_maintenance: "Afficher l'entretien",
    show_stats: "Afficher les statistiques",
    show_map: "Afficher la carte",
    collapsed: "Sections repliées par défaut",
    map_entity: "Entité carte (optionnelle, une caméra ou une image)",
    map_never: "Jamais",
    map_mowing: "Pendant la tonte",
    map_always: "Toujours",
    language: "Langue",
    lang_auto: "Automatique",
    zoom: "Bouton détail",
    zoom_helper: "Bouton en haut à droite qui bascule la mini-carte vers la carte complète et inversement",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Retour à la vue compacte",
    s_mowing: "Tonte en cours",
    s_docked: "À la station",
    s_paused: "En pause",
    s_returning: "Retour à la station",
    s_error: "Erreur",
    s_idle: "Inactive",
    s_starting: "Démarrage",
    s_edgecut: "Coupe des bordures",
    s_zoning: "Changement de zone",
    s_searching_zone: "Recherche de zone",
    s_escaped_digital_fence: "Hors de sa zone",
    s_rain_delayed: "Report pluie",
    s_leaving: "Sortie de la station",
    s_unavailable: "Indisponible",
    s_unknown: "Inconnu",
  },
  de: {
    start: "Mähen",
    pause: "Pause",
    stop: "Stopp",
    dock: "Ladestation",
    battery: "Akku",
    charging: "Lädt",
    progress: "Fortschritt",
    remaining: "{time} verbleibend",
    next_start: "Nächster Start {when}",
    last_completed: "Abgeschlossen {when}",
    actions: "Aktionen",
    run_action: "{name} ausführen?",
    options: "Optionen",
    on: "Ein",
    off: "Aus",
    cancel: "Abbrechen",
    reset: "Zurücksetzen",
    confirm_reset: "Zähler {name} zurücksetzen? Nach dem Austausch des Teils ausführen.",
    maintenance: "Wartung",
    blade: "Messer",
    blade_used: "{time} genutzt",
    charging_cycles: "Ladezyklen",
    collisions: "Kollisionen",
    statistics: "Statistiken",
    last_session: "Letzter Mähvorgang",
    total_cutting_time: "Mähzeit",
    total_running_time: "Betriebszeit",
    total_charging_time: "Ladezeit",
    total_searching_time: "Suchzeit",
    total_distance: "Strecke",
    total_area: "Gesamtfläche",
    sessions: "Mähvorgänge",
    map: "Karte",
    camera: "Kamera",
    camera_unavailable: "Kamera nicht verfügbar",
    show_camera: "Kamera anzeigen",
    camera_entity: "Kamera-Entität (optional, ersetzt die Kameras des Geräts)",
    rain: "Regen erkannt",
    rain_delay: "Regenpause · {time}",
    cutting_height: "Schnitthöhe",
    stuck: "Mäher steckt fest",
    no_device: "Kein Mähroboter gefunden. Ist eine Integration mit einer Mäher-Entität (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…) installiert?",
    unknown_device: "Mähroboter nicht gefunden",
    no_registry: "Diese Karte benötigt Home Assistant 2024.8 oder neuer.",
    device: "Mähroboter",
    title: "Titel (optional, standardmäßig der Gerätename)",
    image: "Gerätebild",
    image_auto: "Automatisch (Zeichnung in Markenfarben)",
    image_none: "Keins",
    show_controls: "Bedienknöpfe anzeigen",
    show_settings: "Mähereinstellungen anzeigen",
    show_actions: "Aktionen anzeigen",
    show_options: "Optionen anzeigen",
    show_maintenance: "Wartung anzeigen",
    show_stats: "Statistiken anzeigen",
    show_map: "Karte anzeigen",
    collapsed: "Standardmäßig eingeklappte Abschnitte",
    map_entity: "Karten-Entität (optional, eine Kamera- oder Bild-Entität)",
    map_never: "Nie",
    map_mowing: "Beim Mähen",
    map_always: "Immer",
    language: "Sprache",
    lang_auto: "Automatisch",
    zoom: "Detail-Knopf",
    zoom_helper: "Knopf oben rechts, der die Mini-Karte zur vollständigen Karte und zurück wechselt",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur Kompaktansicht",
    s_mowing: "Mäht",
    s_docked: "In der Ladestation",
    s_paused: "Pausiert",
    s_returning: "Fährt zur Ladestation",
    s_error: "Fehler",
    s_idle: "Inaktiv",
    s_starting: "Startet",
    s_edgecut: "Kantenschnitt",
    s_zoning: "Zonenwechsel",
    s_searching_zone: "Sucht Zone",
    s_escaped_digital_fence: "Außerhalb des Bereichs",
    s_rain_delayed: "Regenpause",
    s_leaving: "Verlässt die Ladestation",
    s_unavailable: "Nicht verfügbar",
    s_unknown: "Unbekannt",
  },
  es: {
    start: "Cortar",
    pause: "Pausa",
    stop: "Detener",
    dock: "Base",
    battery: "Batería",
    charging: "Cargando",
    progress: "Progreso",
    remaining: "{time} restantes",
    next_start: "Próximo inicio {when}",
    last_completed: "Completado {when}",
    actions: "Acciones",
    run_action: "¿Ejecutar {name}?",
    options: "Opciones",
    on: "Activado",
    off: "Desactivado",
    cancel: "Cancelar",
    reset: "Restablecer",
    confirm_reset: "¿Restablecer el contador {name}? Hazlo tras sustituir la pieza.",
    maintenance: "Mantenimiento",
    blade: "Cuchillas",
    blade_used: "{time} de uso",
    charging_cycles: "Ciclos de carga",
    collisions: "Colisiones",
    statistics: "Estadísticas",
    last_session: "Último corte",
    total_cutting_time: "Tiempo de corte",
    total_running_time: "Tiempo de funcionamiento",
    total_charging_time: "Tiempo de carga",
    total_searching_time: "Tiempo de búsqueda",
    total_distance: "Distancia",
    total_area: "Superficie total",
    sessions: "Cortes",
    map: "Mapa",
    camera: "Cámara",
    camera_unavailable: "Cámara no disponible",
    show_camera: "Mostrar cámara",
    camera_entity: "Entidad de cámara (opcional, sustituye a las cámaras del dispositivo)",
    rain: "Lluvia detectada",
    rain_delay: "Retraso por lluvia · {time}",
    cutting_height: "Altura de corte",
    stuck: "Cortacésped atascado",
    no_device: "No se encontró ningún robot cortacésped. ¿Hay instalada una integración con una entidad de cortacésped (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Cortacésped no encontrado",
    no_registry: "Esta tarjeta necesita Home Assistant 2024.8 o posterior.",
    device: "Cortacésped",
    title: "Título (opcional, por defecto el nombre del dispositivo)",
    image: "Imagen del dispositivo",
    image_auto: "Automática (dibujo con los colores de la marca)",
    image_none: "Ninguna",
    show_controls: "Mostrar botones de control",
    show_settings: "Mostrar ajustes del cortacésped",
    show_actions: "Mostrar acciones",
    show_options: "Mostrar opciones",
    show_maintenance: "Mostrar mantenimiento",
    show_stats: "Mostrar estadísticas",
    show_map: "Mostrar mapa",
    collapsed: "Secciones plegadas por defecto",
    map_entity: "Entidad de mapa (opcional, una cámara o imagen)",
    map_never: "Nunca",
    map_mowing: "Durante el corte",
    map_always: "Siempre",
    language: "Idioma",
    lang_auto: "Automático",
    zoom: "Botón de detalle",
    zoom_helper: "Botón arriba a la derecha que cambia la minitarjeta a la tarjeta completa y viceversa",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    s_mowing: "Cortando",
    s_docked: "En la base",
    s_paused: "En pausa",
    s_returning: "Volviendo a la base",
    s_error: "Error",
    s_idle: "Inactivo",
    s_starting: "Iniciando",
    s_edgecut: "Corte de bordes",
    s_zoning: "Cambio de zona",
    s_searching_zone: "Buscando zona",
    s_escaped_digital_fence: "Fuera de su zona",
    s_rain_delayed: "Retraso por lluvia",
    s_leaving: "Saliendo de la base",
    s_unavailable: "No disponible",
    s_unknown: "Desconocido",
  },
  sr: {
    start: "Коси",
    pause: "Пауза",
    stop: "Стоп",
    dock: "Станица",
    battery: "Батерија",
    charging: "Пуњење",
    progress: "Напредак",
    remaining: "преостало {time}",
    next_start: "Следећи почетак {when}",
    last_completed: "Завршено {when}",
    actions: "Радње",
    run_action: "Покренути {name}?",
    options: "Опције",
    on: "Укључено",
    off: "Искључено",
    cancel: "Откажи",
    reset: "Ресетуј",
    confirm_reset: "Ресетовати бројач {name}? Урадите то након замене дела.",
    maintenance: "Одржавање",
    blade: "Ножеви",
    blade_used: "{time} коришћења",
    charging_cycles: "Циклуси пуњења",
    collisions: "Судари",
    statistics: "Статистика",
    last_session: "Последње кошење",
    total_cutting_time: "Време кошења",
    total_running_time: "Време рада",
    total_charging_time: "Време пуњења",
    total_searching_time: "Време тражења",
    total_distance: "Раздаљина",
    total_area: "Укупна површина",
    sessions: "Кошења",
    map: "Мапа",
    camera: "Камера",
    camera_unavailable: "Камера недоступна",
    show_camera: "Прикажи камеру",
    camera_entity: "Ентитет камере (опционо, замењује камере уређаја)",
    rain: "Откривена киша",
    rain_delay: "Одлагање због кише · {time}",
    cutting_height: "Висина кошења",
    stuck: "Косилица је заглављена",
    no_device: "Није пронађена роботска косилица. Да ли је инсталирана интеграција са ентитетом косилице (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Косилица није пронађена",
    no_registry: "Ова картица захтева Home Assistant 2024.8 или новији.",
    device: "Косилица",
    title: "Наслов (опционо, подразумевано назив уређаја)",
    image: "Слика уређаја",
    image_auto: "Аутоматски (цртеж у бојама бренда)",
    image_none: "Нема",
    show_controls: "Прикажи контролне дугмиће",
    show_settings: "Прикажи подешавања косилице",
    show_actions: "Прикажи радње",
    show_options: "Прикажи опције",
    show_maintenance: "Прикажи одржавање",
    show_stats: "Прикажи статистику",
    show_map: "Прикажи мапу",
    collapsed: "Подразумевано скупљени одељци",
    map_entity: "Ентитет мапе (опционо, камера или слика)",
    map_never: "Никад",
    map_mowing: "Током кошења",
    map_always: "Увек",
    language: "Језик",
    lang_auto: "Аутоматски",
    zoom: "Дугме за детаље",
    zoom_helper: "Дугме у горњем десном углу које пребацује мини картицу на пуну картицу и назад",
    zoom_in: "Прикажи пуну картицу",
    zoom_out: "Назад на компактни приказ",
    s_mowing: "Коси",
    s_docked: "На станици",
    s_paused: "Паузирана",
    s_returning: "Враћа се на станицу",
    s_error: "Грешка",
    s_idle: "Неактивна",
    s_starting: "Покреће се",
    s_edgecut: "Кошење ивица",
    s_zoning: "Промена зоне",
    s_searching_zone: "Тражи зону",
    s_escaped_digital_fence: "Ван свог подручја",
    s_rain_delayed: "Одлагање због кише",
    s_leaving: "Напушта станицу",
    s_unavailable: "Недоступна",
    s_unknown: "Непознато",
  },
  "sr-Latn": {
    start: "Kosi",
    pause: "Pauza",
    stop: "Stop",
    dock: "Stanica",
    battery: "Baterija",
    charging: "Punjenje",
    progress: "Napredak",
    remaining: "preostalo {time}",
    next_start: "Sledeći početak {when}",
    last_completed: "Završeno {when}",
    actions: "Radnje",
    run_action: "Pokrenuti {name}?",
    options: "Opcije",
    on: "Uključeno",
    off: "Isključeno",
    cancel: "Otkaži",
    reset: "Resetuj",
    confirm_reset: "Resetovati brojač {name}? Uradite to nakon zamene dela.",
    maintenance: "Održavanje",
    blade: "Noževi",
    blade_used: "{time} korišćenja",
    charging_cycles: "Ciklusi punjenja",
    collisions: "Sudari",
    statistics: "Statistika",
    last_session: "Poslednje košenje",
    total_cutting_time: "Vreme košenja",
    total_running_time: "Vreme rada",
    total_charging_time: "Vreme punjenja",
    total_searching_time: "Vreme traženja",
    total_distance: "Razdaljina",
    total_area: "Ukupna površina",
    sessions: "Košenja",
    map: "Mapa",
    camera: "Kamera",
    camera_unavailable: "Kamera nedostupna",
    show_camera: "Prikaži kameru",
    camera_entity: "Entitet kamere (opciono, zamenjuje kamere uređaja)",
    rain: "Otkrivena kiša",
    rain_delay: "Odlaganje zbog kiše · {time}",
    cutting_height: "Visina košenja",
    stuck: "Kosilica je zaglavljena",
    no_device: "Nije pronađena robotska kosilica. Da li je instalirana integracija sa entitetom kosilice (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Kosilica nije pronađena",
    no_registry: "Ova kartica zahteva Home Assistant 2024.8 ili noviji.",
    device: "Kosilica",
    title: "Naslov (opciono, podrazumevano naziv uređaja)",
    image: "Slika uređaja",
    image_auto: "Automatski (crtež u bojama brenda)",
    image_none: "Nema",
    show_controls: "Prikaži kontrolne dugmiće",
    show_settings: "Prikaži podešavanja kosilice",
    show_actions: "Prikaži radnje",
    show_options: "Prikaži opcije",
    show_maintenance: "Prikaži održavanje",
    show_stats: "Prikaži statistiku",
    show_map: "Prikaži mapu",
    collapsed: "Podrazumevano skupljeni odeljci",
    map_entity: "Entitet mape (opciono, kamera ili slika)",
    map_never: "Nikad",
    map_mowing: "Tokom košenja",
    map_always: "Uvek",
    language: "Jezik",
    lang_auto: "Automatski",
    zoom: "Dugme za detalje",
    zoom_helper: "Dugme u gornjem desnom uglu koje prebacuje mini karticu na punu karticu i nazad",
    zoom_in: "Prikaži punu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    s_mowing: "Kosi",
    s_docked: "Na stanici",
    s_paused: "Pauzirana",
    s_returning: "Vraća se na stanicu",
    s_error: "Greška",
    s_idle: "Neaktivna",
    s_starting: "Pokreće se",
    s_edgecut: "Košenje ivica",
    s_zoning: "Promena zone",
    s_searching_zone: "Traži zonu",
    s_escaped_digital_fence: "Van svog područja",
    s_rain_delayed: "Odlaganje zbog kiše",
    s_leaving: "Napušta stanicu",
    s_unavailable: "Nedostupna",
    s_unknown: "Nepoznato",
  },
  it: {
    start: "Taglia",
    pause: "Pausa",
    stop: "Stop",
    dock: "Base",
    battery: "Batteria",
    charging: "In carica",
    progress: "Avanzamento",
    remaining: "{time} rimanenti",
    next_start: "Prossimo avvio {when}",
    last_completed: "Completato {when}",
    actions: "Azioni",
    run_action: "Eseguire {name}?",
    options: "Opzioni",
    on: "Attivo",
    off: "Disattivo",
    cancel: "Annulla",
    reset: "Azzera",
    confirm_reset: "Azzerare il contatore {name}? Fallo dopo aver sostituito il componente.",
    maintenance: "Manutenzione",
    blade: "Lame",
    blade_used: "{time} di utilizzo",
    charging_cycles: "Cicli di ricarica",
    collisions: "Collisioni",
    statistics: "Statistiche",
    last_session: "Ultimo taglio",
    total_cutting_time: "Tempo di taglio",
    total_running_time: "Tempo di funzionamento",
    total_charging_time: "Tempo di ricarica",
    total_searching_time: "Tempo di ricerca",
    total_distance: "Distanza",
    total_area: "Superficie totale",
    sessions: "Tagli",
    map: "Mappa",
    camera: "Telecamera",
    camera_unavailable: "Telecamera non disponibile",
    show_camera: "Mostra la telecamera",
    camera_entity: "Entità telecamera (opzionale, sostituisce le telecamere del dispositivo)",
    rain: "Pioggia rilevata",
    rain_delay: "Pausa pioggia · {time}",
    cutting_height: "Altezza di taglio",
    stuck: "Robot bloccato",
    no_device: "Nessun robot tagliaerba trovato. È installata un'integrazione con un'entità tagliaerba (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Tagliaerba non trovato",
    no_registry: "Questa scheda richiede Home Assistant 2024.8 o successivo.",
    device: "Tagliaerba",
    title: "Titolo (opzionale, predefinito il nome del dispositivo)",
    image: "Immagine del dispositivo",
    image_auto: "Automatica (disegno nei colori del marchio)",
    image_none: "Nessuna",
    show_controls: "Mostra i pulsanti di controllo",
    show_settings: "Mostra le impostazioni del robot",
    show_actions: "Mostra le azioni",
    show_options: "Mostra le opzioni",
    show_maintenance: "Mostra la manutenzione",
    show_stats: "Mostra le statistiche",
    show_map: "Mostra la mappa",
    collapsed: "Sezioni chiuse per impostazione predefinita",
    map_entity: "Entità mappa (opzionale, una camera o un'immagine)",
    map_never: "Mai",
    map_mowing: "Durante il taglio",
    map_always: "Sempre",
    language: "Lingua",
    lang_auto: "Automatica",
    zoom: "Pulsante dettaglio",
    zoom_helper: "Pulsante in alto a destra che passa dalla mini scheda alla scheda completa e viceversa",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    s_mowing: "Taglio in corso",
    s_docked: "Alla base",
    s_paused: "In pausa",
    s_returning: "Rientro alla base",
    s_error: "Errore",
    s_idle: "Inattivo",
    s_starting: "Avvio",
    s_edgecut: "Taglio dei bordi",
    s_zoning: "Cambio zona",
    s_searching_zone: "Ricerca zona",
    s_escaped_digital_fence: "Fuori dalla sua area",
    s_rain_delayed: "Pausa pioggia",
    s_leaving: "Uscita dalla base",
    s_unavailable: "Non disponibile",
    s_unknown: "Sconosciuto",
  },
  nl: {
    start: "Maaien",
    pause: "Pauze",
    stop: "Stop",
    dock: "Laadstation",
    battery: "Batterij",
    charging: "Laadt op",
    progress: "Voortgang",
    remaining: "{time} resterend",
    next_start: "Volgende start {when}",
    last_completed: "Voltooid {when}",
    actions: "Acties",
    run_action: "{name} uitvoeren?",
    options: "Opties",
    on: "Aan",
    off: "Uit",
    cancel: "Annuleren",
    reset: "Resetten",
    confirm_reset: "Teller {name} resetten? Doe dit na het vervangen van het onderdeel.",
    maintenance: "Onderhoud",
    blade: "Messen",
    blade_used: "{time} gebruikt",
    charging_cycles: "Laadcycli",
    collisions: "Botsingen",
    statistics: "Statistieken",
    last_session: "Laatste maaibeurt",
    total_cutting_time: "Maaitijd",
    total_running_time: "Bedrijfstijd",
    total_charging_time: "Laadtijd",
    total_searching_time: "Zoektijd",
    total_distance: "Afstand",
    total_area: "Totale oppervlakte",
    sessions: "Maaibeurten",
    map: "Kaart",
    camera: "Camera",
    camera_unavailable: "Camera niet beschikbaar",
    show_camera: "Camera tonen",
    camera_entity: "Camera-entiteit (optioneel, vervangt de camera's van het apparaat)",
    rain: "Regen gedetecteerd",
    rain_delay: "Regenvertraging · {time}",
    cutting_height: "Maaihoogte",
    stuck: "Maaier zit vast",
    no_device: "Geen robotmaaier gevonden. Is een integratie met een maaier-entiteit (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…) geïnstalleerd?",
    unknown_device: "Maaier niet gevonden",
    no_registry: "Deze kaart vereist Home Assistant 2024.8 of nieuwer.",
    device: "Maaier",
    title: "Titel (optioneel, standaard de apparaatnaam)",
    image: "Afbeelding van het apparaat",
    image_auto: "Automatisch (tekening in merkkleuren)",
    image_none: "Geen",
    show_controls: "Bedieningsknoppen tonen",
    show_settings: "Maaierinstellingen tonen",
    show_actions: "Acties tonen",
    show_options: "Opties tonen",
    show_maintenance: "Onderhoud tonen",
    show_stats: "Statistieken tonen",
    show_map: "Kaart tonen",
    collapsed: "Standaard ingeklapte secties",
    map_entity: "Kaart-entiteit (optioneel, een camera of afbeelding)",
    map_never: "Nooit",
    map_mowing: "Tijdens het maaien",
    map_always: "Altijd",
    language: "Taal",
    lang_auto: "Automatisch",
    zoom: "Detailknop",
    zoom_helper: "Knop rechtsboven die de minikaart naar de volledige kaart en terug schakelt",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    s_mowing: "Aan het maaien",
    s_docked: "In het laadstation",
    s_paused: "Gepauzeerd",
    s_returning: "Terug naar het laadstation",
    s_error: "Fout",
    s_idle: "Inactief",
    s_starting: "Start",
    s_edgecut: "Randen maaien",
    s_zoning: "Van zone wisselen",
    s_searching_zone: "Zone zoeken",
    s_escaped_digital_fence: "Buiten zijn gebied",
    s_rain_delayed: "Regenvertraging",
    s_leaving: "Verlaat het laadstation",
    s_unavailable: "Niet beschikbaar",
    s_unknown: "Onbekend",
  },
  pt: {
    start: "Cortar",
    pause: "Pausa",
    stop: "Parar",
    dock: "Base",
    battery: "Bateria",
    charging: "A carregar",
    progress: "Progresso",
    remaining: "{time} restantes",
    next_start: "Próximo início {when}",
    last_completed: "Concluído {when}",
    actions: "Ações",
    run_action: "Executar {name}?",
    options: "Opções",
    on: "Ligado",
    off: "Desligado",
    cancel: "Cancelar",
    reset: "Repor",
    confirm_reset: "Repor o contador {name}? Faça-o após substituir a peça.",
    maintenance: "Manutenção",
    blade: "Lâminas",
    blade_used: "{time} de utilização",
    charging_cycles: "Ciclos de carga",
    collisions: "Colisões",
    statistics: "Estatísticas",
    last_session: "Último corte",
    total_cutting_time: "Tempo de corte",
    total_running_time: "Tempo de funcionamento",
    total_charging_time: "Tempo de carga",
    total_searching_time: "Tempo de procura",
    total_distance: "Distância",
    total_area: "Área total",
    sessions: "Cortes",
    map: "Mapa",
    camera: "Câmara",
    camera_unavailable: "Câmara indisponível",
    show_camera: "Mostrar câmara",
    camera_entity: "Entidade de câmara (opcional, substitui as câmaras do dispositivo)",
    rain: "Chuva detetada",
    rain_delay: "Atraso por chuva · {time}",
    cutting_height: "Altura de corte",
    stuck: "Corta-relva preso",
    no_device: "Nenhum robô corta-relva encontrado. Está instalada uma integração com uma entidade de corta-relva (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Corta-relva não encontrado",
    no_registry: "Este cartão requer o Home Assistant 2024.8 ou posterior.",
    device: "Corta-relva",
    title: "Título (opcional, por predefinição o nome do dispositivo)",
    image: "Imagem do dispositivo",
    image_auto: "Automática (desenho nas cores da marca)",
    image_none: "Nenhuma",
    show_controls: "Mostrar botões de controlo",
    show_settings: "Mostrar definições do corta-relva",
    show_actions: "Mostrar ações",
    show_options: "Mostrar opções",
    show_maintenance: "Mostrar manutenção",
    show_stats: "Mostrar estatísticas",
    show_map: "Mostrar mapa",
    collapsed: "Secções recolhidas por predefinição",
    map_entity: "Entidade do mapa (opcional, uma câmara ou imagem)",
    map_never: "Nunca",
    map_mowing: "Durante o corte",
    map_always: "Sempre",
    language: "Idioma",
    lang_auto: "Automático",
    zoom: "Botão de detalhe",
    zoom_helper: "Botão no canto superior direito que alterna o minicartão para o cartão completo e vice-versa",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    s_mowing: "A cortar",
    s_docked: "Na base",
    s_paused: "Em pausa",
    s_returning: "A regressar à base",
    s_error: "Erro",
    s_idle: "Inativo",
    s_starting: "A iniciar",
    s_edgecut: "Corte das bordas",
    s_zoning: "Mudança de zona",
    s_searching_zone: "À procura da zona",
    s_escaped_digital_fence: "Fora da sua área",
    s_rain_delayed: "Atraso por chuva",
    s_leaving: "A sair da base",
    s_unavailable: "Indisponível",
    s_unknown: "Desconhecido",
  },
  pl: {
    start: "Koś",
    pause: "Pauza",
    stop: "Stop",
    dock: "Stacja",
    battery: "Bateria",
    charging: "Ładowanie",
    progress: "Postęp",
    remaining: "pozostało {time}",
    next_start: "Następny start {when}",
    last_completed: "Ukończono {when}",
    actions: "Akcje",
    run_action: "Uruchomić {name}?",
    options: "Opcje",
    on: "Włączone",
    off: "Wyłączone",
    cancel: "Anuluj",
    reset: "Resetuj",
    confirm_reset: "Zresetować licznik {name}? Zrób to po wymianie części.",
    maintenance: "Konserwacja",
    blade: "Ostrza",
    blade_used: "{time} użycia",
    charging_cycles: "Cykle ładowania",
    collisions: "Kolizje",
    statistics: "Statystyki",
    last_session: "Ostatnie koszenie",
    total_cutting_time: "Czas koszenia",
    total_running_time: "Czas pracy",
    total_charging_time: "Czas ładowania",
    total_searching_time: "Czas szukania",
    total_distance: "Dystans",
    total_area: "Łączna powierzchnia",
    sessions: "Koszenia",
    map: "Mapa",
    camera: "Kamera",
    camera_unavailable: "Kamera niedostępna",
    show_camera: "Pokaż kamerę",
    camera_entity: "Encja kamery (opcjonalna, zastępuje kamery urządzenia)",
    rain: "Wykryto deszcz",
    rain_delay: "Opóźnienie deszczowe · {time}",
    cutting_height: "Wysokość koszenia",
    stuck: "Kosiarka utknęła",
    no_device: "Nie znaleziono robota koszącego. Czy zainstalowano integrację z encją kosiarki (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Nie znaleziono kosiarki",
    no_registry: "Ta karta wymaga Home Assistant 2024.8 lub nowszego.",
    device: "Kosiarka",
    title: "Tytuł (opcjonalny, domyślnie nazwa urządzenia)",
    image: "Obraz urządzenia",
    image_auto: "Automatyczny (rysunek w kolorach marki)",
    image_none: "Brak",
    show_controls: "Pokaż przyciski sterowania",
    show_settings: "Pokaż ustawienia kosiarki",
    show_actions: "Pokaż akcje",
    show_options: "Pokaż opcje",
    show_maintenance: "Pokaż konserwację",
    show_stats: "Pokaż statystyki",
    show_map: "Pokaż mapę",
    collapsed: "Sekcje domyślnie zwinięte",
    map_entity: "Encja mapy (opcjonalna, kamera lub obraz)",
    map_never: "Nigdy",
    map_mowing: "Podczas koszenia",
    map_always: "Zawsze",
    language: "Język",
    lang_auto: "Automatyczny",
    zoom: "Przycisk szczegółów",
    zoom_helper: "Przycisk w prawym górnym rogu przełączający minikartę na pełną kartę i z powrotem",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Powrót do widoku kompaktowego",
    s_mowing: "Kosi",
    s_docked: "W stacji",
    s_paused: "Wstrzymana",
    s_returning: "Wraca do stacji",
    s_error: "Błąd",
    s_idle: "Bezczynna",
    s_starting: "Uruchamianie",
    s_edgecut: "Koszenie krawędzi",
    s_zoning: "Zmiana strefy",
    s_searching_zone: "Szukanie strefy",
    s_escaped_digital_fence: "Poza swoim obszarem",
    s_rain_delayed: "Opóźnienie deszczowe",
    s_leaving: "Opuszcza stację",
    s_unavailable: "Niedostępna",
    s_unknown: "Nieznany",
  },
  ro: {
    start: "Tunde",
    pause: "Pauză",
    stop: "Stop",
    dock: "Stație",
    battery: "Baterie",
    charging: "Se încarcă",
    progress: "Progres",
    remaining: "{time} rămase",
    next_start: "Următoarea pornire {when}",
    last_completed: "Finalizat {when}",
    actions: "Acțiuni",
    run_action: "Rulezi {name}?",
    options: "Opțiuni",
    on: "Activat",
    off: "Dezactivat",
    cancel: "Anulează",
    reset: "Resetează",
    confirm_reset: "Resetezi contorul {name}? Fă-o după înlocuirea piesei.",
    maintenance: "Întreținere",
    blade: "Lame",
    blade_used: "{time} de utilizare",
    charging_cycles: "Cicluri de încărcare",
    collisions: "Coliziuni",
    statistics: "Statistici",
    last_session: "Ultima tundere",
    total_cutting_time: "Timp de tundere",
    total_running_time: "Timp de funcționare",
    total_charging_time: "Timp de încărcare",
    total_searching_time: "Timp de căutare",
    total_distance: "Distanță",
    total_area: "Suprafață totală",
    sessions: "Tunderi",
    map: "Hartă",
    camera: "Cameră",
    camera_unavailable: "Cameră indisponibilă",
    show_camera: "Afișează camera",
    camera_entity: "Entitate cameră (opțional, înlocuiește camerele dispozitivului)",
    rain: "Ploaie detectată",
    rain_delay: "Amânare ploaie · {time}",
    cutting_height: "Înălțime de tăiere",
    stuck: "Robot blocat",
    no_device: "Nu s-a găsit niciun robot de tuns iarba. Este instalată o integrare cu o entitate de tuns iarba (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Robotul de tuns nu a fost găsit",
    no_registry: "Acest card necesită Home Assistant 2024.8 sau mai nou.",
    device: "Robot de tuns iarba",
    title: "Titlu (opțional, implicit numele dispozitivului)",
    image: "Imaginea dispozitivului",
    image_auto: "Automată (desen în culorile mărcii)",
    image_none: "Niciuna",
    show_controls: "Afișează butoanele de control",
    show_settings: "Afișează setările robotului",
    show_actions: "Afișează acțiunile",
    show_options: "Afișează opțiunile",
    show_maintenance: "Afișează întreținerea",
    show_stats: "Afișează statisticile",
    show_map: "Afișează harta",
    collapsed: "Secțiuni restrânse implicit",
    map_entity: "Entitate hartă (opțional, o cameră sau o imagine)",
    map_never: "Niciodată",
    map_mowing: "În timpul tunderii",
    map_always: "Întotdeauna",
    language: "Limbă",
    lang_auto: "Automată",
    zoom: "Buton detalii",
    zoom_helper: "Buton în dreapta sus care comută mini-cardul la cardul complet și înapoi",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    s_mowing: "Tunde",
    s_docked: "În stație",
    s_paused: "În pauză",
    s_returning: "Se întoarce la stație",
    s_error: "Eroare",
    s_idle: "Inactiv",
    s_starting: "Pornește",
    s_edgecut: "Tunde marginile",
    s_zoning: "Schimbă zona",
    s_searching_zone: "Caută zona",
    s_escaped_digital_fence: "În afara zonei sale",
    s_rain_delayed: "Amânare ploaie",
    s_leaving: "Părăsește stația",
    s_unavailable: "Indisponibil",
    s_unknown: "Necunoscut",
  },
  da: {
    start: "Klip",
    pause: "Pause",
    stop: "Stop",
    dock: "Ladestation",
    battery: "Batteri",
    charging: "Oplader",
    progress: "Fremskridt",
    remaining: "{time} tilbage",
    next_start: "Næste start {when}",
    last_completed: "Fuldført {when}",
    actions: "Handlinger",
    run_action: "Kør {name}?",
    options: "Indstillinger",
    on: "Til",
    off: "Fra",
    cancel: "Annuller",
    reset: "Nulstil",
    confirm_reset: "Nulstil tælleren {name}? Gør det efter udskiftning af delen.",
    maintenance: "Vedligeholdelse",
    blade: "Knive",
    blade_used: "{time} brugt",
    charging_cycles: "Ladecyklusser",
    collisions: "Kollisioner",
    statistics: "Statistik",
    last_session: "Seneste klipning",
    total_cutting_time: "Klippetid",
    total_running_time: "Driftstid",
    total_charging_time: "Ladetid",
    total_searching_time: "Søgetid",
    total_distance: "Afstand",
    total_area: "Samlet areal",
    sessions: "Klipninger",
    map: "Kort",
    camera: "Kamera",
    camera_unavailable: "Kamera utilgængeligt",
    show_camera: "Vis kamera",
    camera_entity: "Kamera-entitet (valgfri, erstatter enhedens kameraer)",
    rain: "Regn registreret",
    rain_delay: "Regnforsinkelse · {time}",
    cutting_height: "Klippehøjde",
    stuck: "Robotten sidder fast",
    no_device: "Ingen robotplæneklipper fundet. Er en integration med en plæneklipper-entitet (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…) installeret?",
    unknown_device: "Plæneklipper ikke fundet",
    no_registry: "Dette kort kræver Home Assistant 2024.8 eller nyere.",
    device: "Plæneklipper",
    title: "Titel (valgfri, standard er enhedens navn)",
    image: "Enhedsbillede",
    image_auto: "Automatisk (tegning i mærkets farver)",
    image_none: "Intet",
    show_controls: "Vis betjeningsknapper",
    show_settings: "Vis klipperens indstillinger",
    show_actions: "Vis handlinger",
    show_options: "Vis indstillinger",
    show_maintenance: "Vis vedligeholdelse",
    show_stats: "Vis statistik",
    show_map: "Vis kort",
    collapsed: "Sektioner foldet sammen som standard",
    map_entity: "Kort-entitet (valgfri, et kamera eller et billede)",
    map_never: "Aldrig",
    map_mowing: "Under klipning",
    map_always: "Altid",
    language: "Sprog",
    lang_auto: "Automatisk",
    zoom: "Detaljeknap",
    zoom_helper: "Knap øverst til højre, der skifter minikortet til det fulde kort og tilbage",
    zoom_in: "Vis det fulde kort",
    zoom_out: "Tilbage til den kompakte visning",
    s_mowing: "Klipper",
    s_docked: "I ladestationen",
    s_paused: "På pause",
    s_returning: "På vej til ladestationen",
    s_error: "Fejl",
    s_idle: "Inaktiv",
    s_starting: "Starter",
    s_edgecut: "Kantklipning",
    s_zoning: "Skifter zone",
    s_searching_zone: "Søger zone",
    s_escaped_digital_fence: "Uden for sit område",
    s_rain_delayed: "Regnforsinkelse",
    s_leaving: "Forlader ladestationen",
    s_unavailable: "Utilgængelig",
    s_unknown: "Ukendt",
  },
  sv: {
    start: "Klipp",
    pause: "Paus",
    stop: "Stopp",
    dock: "Laddstation",
    battery: "Batteri",
    charging: "Laddar",
    progress: "Förlopp",
    remaining: "{time} kvar",
    next_start: "Nästa start {when}",
    last_completed: "Slutfört {when}",
    actions: "Åtgärder",
    run_action: "Kör {name}?",
    options: "Alternativ",
    on: "På",
    off: "Av",
    cancel: "Avbryt",
    reset: "Återställ",
    confirm_reset: "Återställa räknaren {name}? Gör det efter byte av delen.",
    maintenance: "Underhåll",
    blade: "Knivar",
    blade_used: "{time} använt",
    charging_cycles: "Laddcykler",
    collisions: "Kollisioner",
    statistics: "Statistik",
    last_session: "Senaste klippning",
    total_cutting_time: "Klipptid",
    total_running_time: "Drifttid",
    total_charging_time: "Laddtid",
    total_searching_time: "Söktid",
    total_distance: "Sträcka",
    total_area: "Total yta",
    sessions: "Klippningar",
    map: "Karta",
    camera: "Kamera",
    camera_unavailable: "Kameran är otillgänglig",
    show_camera: "Visa kamera",
    camera_entity: "Kameraentitet (valfri, ersätter enhetens kameror)",
    rain: "Regn upptäckt",
    rain_delay: "Regnfördröjning · {time}",
    cutting_height: "Klipphöjd",
    stuck: "Klipparen har fastnat",
    no_device: "Ingen robotgräsklippare hittades. Är en integration med en gräsklipparentitet (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…) installerad?",
    unknown_device: "Gräsklipparen hittades inte",
    no_registry: "Detta kort kräver Home Assistant 2024.8 eller senare.",
    device: "Gräsklippare",
    title: "Titel (valfri, enhetens namn som standard)",
    image: "Enhetsbild",
    image_auto: "Automatisk (ritning i märkets färger)",
    image_none: "Ingen",
    show_controls: "Visa kontrollknappar",
    show_settings: "Visa klipparens inställningar",
    show_actions: "Visa åtgärder",
    show_options: "Visa alternativ",
    show_maintenance: "Visa underhåll",
    show_stats: "Visa statistik",
    show_map: "Visa karta",
    collapsed: "Sektioner ihopfällda som standard",
    map_entity: "Kartentitet (valfri, en kamera eller bild)",
    map_never: "Aldrig",
    map_mowing: "Under klippning",
    map_always: "Alltid",
    language: "Språk",
    lang_auto: "Automatiskt",
    zoom: "Detaljknapp",
    zoom_helper: "Knapp uppe till höger som växlar minikortet till det fullständiga kortet och tillbaka",
    zoom_in: "Visa det fullständiga kortet",
    zoom_out: "Tillbaka till den kompakta vyn",
    s_mowing: "Klipper",
    s_docked: "I laddstationen",
    s_paused: "Pausad",
    s_returning: "På väg till laddstationen",
    s_error: "Fel",
    s_idle: "Inaktiv",
    s_starting: "Startar",
    s_edgecut: "Kantklippning",
    s_zoning: "Byter zon",
    s_searching_zone: "Söker zon",
    s_escaped_digital_fence: "Utanför sitt område",
    s_rain_delayed: "Regnfördröjning",
    s_leaving: "Lämnar laddstationen",
    s_unavailable: "Otillgänglig",
    s_unknown: "Okänt",
  },
  bg: {
    start: "Косене",
    pause: "Пауза",
    stop: "Стоп",
    dock: "Станция",
    battery: "Батерия",
    charging: "Зарежда се",
    progress: "Напредък",
    remaining: "остават {time}",
    next_start: "Следващ старт {when}",
    last_completed: "Завършено {when}",
    actions: "Действия",
    run_action: "Изпълни {name}?",
    options: "Опции",
    on: "Включено",
    off: "Изключено",
    cancel: "Отказ",
    reset: "Нулиране",
    confirm_reset: "Да се нулира ли броячът {name}? Направете го след смяна на частта.",
    maintenance: "Поддръжка",
    blade: "Ножове",
    blade_used: "{time} употреба",
    charging_cycles: "Цикли на зареждане",
    collisions: "Сблъсъци",
    statistics: "Статистика",
    last_session: "Последно косене",
    total_cutting_time: "Време за косене",
    total_running_time: "Време на работа",
    total_charging_time: "Време за зареждане",
    total_searching_time: "Време за търсене",
    total_distance: "Разстояние",
    total_area: "Обща площ",
    sessions: "Косения",
    map: "Карта",
    camera: "Камера",
    camera_unavailable: "Камерата е недостъпна",
    show_camera: "Показване на камерата",
    camera_entity: "Обект за камера (по избор, замества камерите на устройството)",
    rain: "Открит дъжд",
    rain_delay: "Отлагане заради дъжд · {time}",
    cutting_height: "Височина на косене",
    stuck: "Косачката е заседнала",
    no_device: "Не е намерена роботизирана косачка. Инсталирана ли е интеграция с обект косачка (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Косачката не е намерена",
    no_registry: "Тази карта изисква Home Assistant 2024.8 или по-нов.",
    device: "Косачка",
    title: "Заглавие (по избор, по подразбиране името на устройството)",
    image: "Изображение на устройството",
    image_auto: "Автоматично (рисунка в цветовете на марката)",
    image_none: "Без",
    show_controls: "Показване на бутоните за управление",
    show_settings: "Показване на настройките на косачката",
    show_actions: "Показване на действията",
    show_options: "Показване на опциите",
    show_maintenance: "Показване на поддръжката",
    show_stats: "Показване на статистиката",
    show_map: "Показване на картата",
    collapsed: "Свити по подразбиране секции",
    map_entity: "Обект за карта (по избор, камера или изображение)",
    map_never: "Никога",
    map_mowing: "По време на косене",
    map_always: "Винаги",
    language: "Език",
    lang_auto: "Автоматично",
    zoom: "Бутон за подробности",
    zoom_helper: "Бутон горе вдясно, който превключва миникартата към пълната карта и обратно",
    zoom_in: "Показване на пълната карта",
    zoom_out: "Обратно към компактния изглед",
    s_mowing: "Коси",
    s_docked: "На станцията",
    s_paused: "На пауза",
    s_returning: "Връща се към станцията",
    s_error: "Грешка",
    s_idle: "Неактивна",
    s_starting: "Стартира",
    s_edgecut: "Косене на ръбовете",
    s_zoning: "Смяна на зона",
    s_searching_zone: "Търси зона",
    s_escaped_digital_fence: "Извън зоната си",
    s_rain_delayed: "Отлагане заради дъжд",
    s_leaving: "Напуска станцията",
    s_unavailable: "Недостъпна",
    s_unknown: "Неизвестно",
  },
  ru: {
    start: "Косить",
    pause: "Пауза",
    stop: "Стоп",
    dock: "Станция",
    battery: "Батарея",
    charging: "Заряжается",
    progress: "Прогресс",
    remaining: "осталось {time}",
    next_start: "Следующий запуск {when}",
    last_completed: "Завершено {when}",
    actions: "Действия",
    run_action: "Выполнить {name}?",
    options: "Параметры",
    on: "Вкл.",
    off: "Выкл.",
    cancel: "Отмена",
    reset: "Сбросить",
    confirm_reset: "Сбросить счётчик {name}? Сделайте это после замены детали.",
    maintenance: "Обслуживание",
    blade: "Ножи",
    blade_used: "{time} наработки",
    charging_cycles: "Циклы зарядки",
    collisions: "Столкновения",
    statistics: "Статистика",
    last_session: "Последняя стрижка",
    total_cutting_time: "Время стрижки",
    total_running_time: "Время работы",
    total_charging_time: "Время зарядки",
    total_searching_time: "Время поиска",
    total_distance: "Расстояние",
    total_area: "Общая площадь",
    sessions: "Стрижки",
    map: "Карта",
    camera: "Камера",
    camera_unavailable: "Камера недоступна",
    show_camera: "Показывать камеру",
    camera_entity: "Объект камеры (необязательно, заменяет камеры устройства)",
    rain: "Обнаружен дождь",
    rain_delay: "Задержка из-за дождя · {time}",
    cutting_height: "Высота стрижки",
    stuck: "Газонокосилка застряла",
    no_device: "Робот-газонокосилка не найден. Установлена ли интеграция с объектом газонокосилки (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Газонокосилка не найдена",
    no_registry: "Эта карточка требует Home Assistant 2024.8 или новее.",
    device: "Газонокосилка",
    title: "Заголовок (необязательно, по умолчанию имя устройства)",
    image: "Изображение устройства",
    image_auto: "Автоматически (рисунок в цветах бренда)",
    image_none: "Нет",
    show_controls: "Показывать кнопки управления",
    show_settings: "Показывать настройки газонокосилки",
    show_actions: "Показывать действия",
    show_options: "Показывать параметры",
    show_maintenance: "Показывать обслуживание",
    show_stats: "Показывать статистику",
    show_map: "Показывать карту",
    collapsed: "Свёрнутые по умолчанию разделы",
    map_entity: "Объект карты (необязательно, камера или изображение)",
    map_never: "Никогда",
    map_mowing: "Во время стрижки",
    map_always: "Всегда",
    language: "Язык",
    lang_auto: "Автоматически",
    zoom: "Кнопка подробностей",
    zoom_helper: "Кнопка в правом верхнем углу, переключающая мини-карточку на полную и обратно",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    s_mowing: "Косит",
    s_docked: "На станции",
    s_paused: "Пауза",
    s_returning: "Возвращается на станцию",
    s_error: "Ошибка",
    s_idle: "Ожидание",
    s_starting: "Запуск",
    s_edgecut: "Стрижка краёв",
    s_zoning: "Смена зоны",
    s_searching_zone: "Поиск зоны",
    s_escaped_digital_fence: "Вне своей зоны",
    s_rain_delayed: "Задержка из-за дождя",
    s_leaving: "Покидает станцию",
    s_unavailable: "Недоступна",
    s_unknown: "Неизвестно",
  },
  uk: {
    start: "Косити",
    pause: "Пауза",
    stop: "Стоп",
    dock: "Станція",
    battery: "Батарея",
    charging: "Заряджається",
    progress: "Прогрес",
    remaining: "залишилось {time}",
    next_start: "Наступний запуск {when}",
    last_completed: "Завершено {when}",
    actions: "Дії",
    run_action: "Виконати {name}?",
    options: "Параметри",
    on: "Увімк.",
    off: "Вимк.",
    cancel: "Скасувати",
    reset: "Скинути",
    confirm_reset: "Скинути лічильник {name}? Зробіть це після заміни деталі.",
    maintenance: "Обслуговування",
    blade: "Ножі",
    blade_used: "{time} напрацювання",
    charging_cycles: "Цикли заряджання",
    collisions: "Зіткнення",
    statistics: "Статистика",
    last_session: "Останнє косіння",
    total_cutting_time: "Час косіння",
    total_running_time: "Час роботи",
    total_charging_time: "Час заряджання",
    total_searching_time: "Час пошуку",
    total_distance: "Відстань",
    total_area: "Загальна площа",
    sessions: "Косіння",
    map: "Мапа",
    camera: "Камера",
    camera_unavailable: "Камера недоступна",
    show_camera: "Показувати камеру",
    camera_entity: "Сутність камери (необов'язково, замінює камери пристрою)",
    rain: "Виявлено дощ",
    rain_delay: "Затримка через дощ · {time}",
    cutting_height: "Висота косіння",
    stuck: "Газонокосарка застрягла",
    no_device: "Робот-газонокосарку не знайдено. Чи встановлено інтеграцію з сутністю газонокосарки (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Газонокосарку не знайдено",
    no_registry: "Ця картка потребує Home Assistant 2024.8 або новішої версії.",
    device: "Газонокосарка",
    title: "Заголовок (необов'язково, типово назва пристрою)",
    image: "Зображення пристрою",
    image_auto: "Автоматично (малюнок у кольорах бренду)",
    image_none: "Немає",
    show_controls: "Показувати кнопки керування",
    show_settings: "Показувати налаштування газонокосарки",
    show_actions: "Показувати дії",
    show_options: "Показувати параметри",
    show_maintenance: "Показувати обслуговування",
    show_stats: "Показувати статистику",
    show_map: "Показувати мапу",
    collapsed: "Типово згорнуті розділи",
    map_entity: "Сутність мапи (необов'язково, камера або зображення)",
    map_never: "Ніколи",
    map_mowing: "Під час косіння",
    map_always: "Завжди",
    language: "Мова",
    lang_auto: "Автоматично",
    zoom: "Кнопка деталей",
    zoom_helper: "Кнопка вгорі праворуч, що перемикає мінікартку на повну картку і назад",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    s_mowing: "Косить",
    s_docked: "На станції",
    s_paused: "Пауза",
    s_returning: "Повертається на станцію",
    s_error: "Помилка",
    s_idle: "Очікування",
    s_starting: "Запуск",
    s_edgecut: "Косіння країв",
    s_zoning: "Зміна зони",
    s_searching_zone: "Пошук зони",
    s_escaped_digital_fence: "Поза своєю зоною",
    s_rain_delayed: "Затримка через дощ",
    s_leaving: "Залишає станцію",
    s_unavailable: "Недоступна",
    s_unknown: "Невідомо",
  },
  hu: {
    start: "Nyírás",
    pause: "Szünet",
    stop: "Stop",
    dock: "Töltőállomás",
    battery: "Akkumulátor",
    charging: "Töltés",
    progress: "Előrehaladás",
    remaining: "{time} van hátra",
    next_start: "Következő indulás {when}",
    last_completed: "Befejezve {when}",
    actions: "Műveletek",
    run_action: "{name} futtatása?",
    options: "Beállítások",
    on: "Be",
    off: "Ki",
    cancel: "Mégse",
    reset: "Nullázás",
    confirm_reset: "Nullázza a(z) {name} számlálót? Az alkatrész cseréje után tegye meg.",
    maintenance: "Karbantartás",
    blade: "Kések",
    blade_used: "{time} használat",
    charging_cycles: "Töltési ciklusok",
    collisions: "Ütközések",
    statistics: "Statisztika",
    last_session: "Utolsó nyírás",
    total_cutting_time: "Nyírási idő",
    total_running_time: "Üzemidő",
    total_charging_time: "Töltési idő",
    total_searching_time: "Keresési idő",
    total_distance: "Távolság",
    total_area: "Összes terület",
    sessions: "Nyírások",
    map: "Térkép",
    camera: "Kamera",
    camera_unavailable: "A kamera nem elérhető",
    show_camera: "Kamera megjelenítése",
    camera_entity: "Kamera entitás (opcionális, az eszköz kameráit helyettesíti)",
    rain: "Eső észlelve",
    rain_delay: "Eső miatti késleltetés · {time}",
    cutting_height: "Vágási magasság",
    stuck: "A fűnyíró elakadt",
    no_device: "Nem található robotfűnyíró. Telepítve van fűnyíró entitást adó integráció (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "A fűnyíró nem található",
    no_registry: "Ehhez a kártyához Home Assistant 2024.8 vagy újabb szükséges.",
    device: "Fűnyíró",
    title: "Cím (opcionális, alapértelmezés az eszköz neve)",
    image: "Eszköz képe",
    image_auto: "Automatikus (rajz a márka színeiben)",
    image_none: "Nincs",
    show_controls: "Vezérlőgombok megjelenítése",
    show_settings: "A fűnyíró beállításainak megjelenítése",
    show_actions: "Műveletek megjelenítése",
    show_options: "Beállítások megjelenítése",
    show_maintenance: "Karbantartás megjelenítése",
    show_stats: "Statisztika megjelenítése",
    show_map: "Térkép megjelenítése",
    collapsed: "Alapértelmezetten összecsukott szakaszok",
    map_entity: "Térkép entitás (opcionális, kamera vagy kép)",
    map_never: "Soha",
    map_mowing: "Nyírás közben",
    map_always: "Mindig",
    language: "Nyelv",
    lang_auto: "Automatikus",
    zoom: "Részletek gomb",
    zoom_helper: "Jobb felső gomb, amely a minikártyát a teljes kártyára váltja és vissza",
    zoom_in: "Teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    s_mowing: "Nyír",
    s_docked: "A töltőállomáson",
    s_paused: "Szünetel",
    s_returning: "Visszatér a töltőállomásra",
    s_error: "Hiba",
    s_idle: "Tétlen",
    s_starting: "Indul",
    s_edgecut: "Szegélynyírás",
    s_zoning: "Zónaváltás",
    s_searching_zone: "Zónát keres",
    s_escaped_digital_fence: "A területén kívül",
    s_rain_delayed: "Eső miatti késleltetés",
    s_leaving: "Elhagyja a töltőállomást",
    s_unavailable: "Nem elérhető",
    s_unknown: "Ismeretlen",
  },
  sk: {
    start: "Kosiť",
    pause: "Pauza",
    stop: "Stop",
    dock: "Stanica",
    battery: "Batéria",
    charging: "Nabíja sa",
    progress: "Priebeh",
    remaining: "zostáva {time}",
    next_start: "Ďalší štart {when}",
    last_completed: "Dokončené {when}",
    actions: "Akcie",
    run_action: "Spustiť {name}?",
    options: "Možnosti",
    on: "Zapnuté",
    off: "Vypnuté",
    cancel: "Zrušiť",
    reset: "Vynulovať",
    confirm_reset: "Vynulovať počítadlo {name}? Urobte to po výmene dielu.",
    maintenance: "Údržba",
    blade: "Nože",
    blade_used: "{time} používania",
    charging_cycles: "Nabíjacie cykly",
    collisions: "Kolízie",
    statistics: "Štatistiky",
    last_session: "Posledné kosenie",
    total_cutting_time: "Čas kosenia",
    total_running_time: "Čas prevádzky",
    total_charging_time: "Čas nabíjania",
    total_searching_time: "Čas hľadania",
    total_distance: "Vzdialenosť",
    total_area: "Celková plocha",
    sessions: "Kosenia",
    map: "Mapa",
    camera: "Kamera",
    camera_unavailable: "Kamera nedostupná",
    show_camera: "Zobraziť kameru",
    camera_entity: "Entita kamery (voliteľná, nahrádza kamery zariadenia)",
    rain: "Zistený dážď",
    rain_delay: "Odklad pre dážď · {time}",
    cutting_height: "Výška kosenia",
    stuck: "Kosačka uviazla",
    no_device: "Nenašla sa žiadna robotická kosačka. Je nainštalovaná integrácia s entitou kosačky (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Kosačka sa nenašla",
    no_registry: "Táto karta vyžaduje Home Assistant 2024.8 alebo novší.",
    device: "Kosačka",
    title: "Názov (voliteľný, predvolene názov zariadenia)",
    image: "Obrázok zariadenia",
    image_auto: "Automaticky (kresba vo farbách značky)",
    image_none: "Žiadny",
    show_controls: "Zobraziť ovládacie tlačidlá",
    show_settings: "Zobraziť nastavenia kosačky",
    show_actions: "Zobraziť akcie",
    show_options: "Zobraziť možnosti",
    show_maintenance: "Zobraziť údržbu",
    show_stats: "Zobraziť štatistiky",
    show_map: "Zobraziť mapu",
    collapsed: "Predvolene zbalené sekcie",
    map_entity: "Entita mapy (voliteľná, kamera alebo obrázok)",
    map_never: "Nikdy",
    map_mowing: "Počas kosenia",
    map_always: "Vždy",
    language: "Jazyk",
    lang_auto: "Automaticky",
    zoom: "Tlačidlo podrobností",
    zoom_helper: "Tlačidlo vpravo hore, ktoré prepne minikartu na úplnú kartu a späť",
    zoom_in: "Zobraziť úplnú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    s_mowing: "Kosí",
    s_docked: "V stanici",
    s_paused: "Pozastavená",
    s_returning: "Vracia sa do stanice",
    s_error: "Chyba",
    s_idle: "Nečinná",
    s_starting: "Štartuje",
    s_edgecut: "Kosenie okrajov",
    s_zoning: "Zmena zóny",
    s_searching_zone: "Hľadá zónu",
    s_escaped_digital_fence: "Mimo svojej oblasti",
    s_rain_delayed: "Odklad pre dážď",
    s_leaving: "Opúšťa stanicu",
    s_unavailable: "Nedostupná",
    s_unknown: "Neznáme",
  },
  cs: {
    start: "Sekat",
    pause: "Pauza",
    stop: "Stop",
    dock: "Stanice",
    battery: "Baterie",
    charging: "Nabíjí se",
    progress: "Průběh",
    remaining: "zbývá {time}",
    next_start: "Další start {when}",
    last_completed: "Dokončeno {when}",
    actions: "Akce",
    run_action: "Spustit {name}?",
    options: "Možnosti",
    on: "Zapnuto",
    off: "Vypnuto",
    cancel: "Zrušit",
    reset: "Vynulovat",
    confirm_reset: "Vynulovat počítadlo {name}? Proveďte po výměně dílu.",
    maintenance: "Údržba",
    blade: "Nože",
    blade_used: "{time} používání",
    charging_cycles: "Nabíjecí cykly",
    collisions: "Kolize",
    statistics: "Statistiky",
    last_session: "Poslední sekání",
    total_cutting_time: "Doba sekání",
    total_running_time: "Doba provozu",
    total_charging_time: "Doba nabíjení",
    total_searching_time: "Doba hledání",
    total_distance: "Vzdálenost",
    total_area: "Celková plocha",
    sessions: "Sekání",
    map: "Mapa",
    camera: "Kamera",
    camera_unavailable: "Kamera nedostupná",
    show_camera: "Zobrazit kameru",
    camera_entity: "Entita kamery (volitelná, nahrazuje kamery zařízení)",
    rain: "Zjištěn déšť",
    rain_delay: "Odklad kvůli dešti · {time}",
    cutting_height: "Výška sekání",
    stuck: "Sekačka uvízla",
    no_device: "Nebyla nalezena žádná robotická sekačka. Je nainstalována integrace s entitou sekačky (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Sekačka nenalezena",
    no_registry: "Tato karta vyžaduje Home Assistant 2024.8 nebo novější.",
    device: "Sekačka",
    title: "Název (volitelný, výchozí je název zařízení)",
    image: "Obrázek zařízení",
    image_auto: "Automaticky (kresba v barvách značky)",
    image_none: "Žádný",
    show_controls: "Zobrazit ovládací tlačítka",
    show_settings: "Zobrazit nastavení sekačky",
    show_actions: "Zobrazit akce",
    show_options: "Zobrazit možnosti",
    show_maintenance: "Zobrazit údržbu",
    show_stats: "Zobrazit statistiky",
    show_map: "Zobrazit mapu",
    collapsed: "Výchozí sbalené sekce",
    map_entity: "Entita mapy (volitelná, kamera nebo obrázek)",
    map_never: "Nikdy",
    map_mowing: "Během sekání",
    map_always: "Vždy",
    language: "Jazyk",
    lang_auto: "Automaticky",
    zoom: "Tlačítko podrobností",
    zoom_helper: "Tlačítko vpravo nahoře, které přepne minikartu na úplnou kartu a zpět",
    zoom_in: "Zobrazit úplnou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    s_mowing: "Seká",
    s_docked: "Ve stanici",
    s_paused: "Pozastavena",
    s_returning: "Vrací se do stanice",
    s_error: "Chyba",
    s_idle: "Nečinná",
    s_starting: "Startuje",
    s_edgecut: "Sekání okrajů",
    s_zoning: "Změna zóny",
    s_searching_zone: "Hledá zónu",
    s_escaped_digital_fence: "Mimo svou oblast",
    s_rain_delayed: "Odklad kvůli dešti",
    s_leaving: "Opouští stanici",
    s_unavailable: "Nedostupná",
    s_unknown: "Neznámé",
  },
  sl: {
    start: "Košnja",
    pause: "Premor",
    stop: "Stop",
    dock: "Postaja",
    battery: "Baterija",
    charging: "Polnjenje",
    progress: "Napredek",
    remaining: "še {time}",
    next_start: "Naslednji zagon {when}",
    last_completed: "Dokončano {when}",
    actions: "Dejanja",
    run_action: "Zaženem {name}?",
    options: "Možnosti",
    on: "Vklopljeno",
    off: "Izklopljeno",
    cancel: "Prekliči",
    reset: "Ponastavi",
    confirm_reset: "Ponastavim števec {name}? Storite to po zamenjavi dela.",
    maintenance: "Vzdrževanje",
    blade: "Rezila",
    blade_used: "{time} uporabe",
    charging_cycles: "Cikli polnjenja",
    collisions: "Trki",
    statistics: "Statistika",
    last_session: "Zadnja košnja",
    total_cutting_time: "Čas košnje",
    total_running_time: "Čas delovanja",
    total_charging_time: "Čas polnjenja",
    total_searching_time: "Čas iskanja",
    total_distance: "Razdalja",
    total_area: "Skupna površina",
    sessions: "Košnje",
    map: "Zemljevid",
    camera: "Kamera",
    camera_unavailable: "Kamera ni na voljo",
    show_camera: "Prikaži kamero",
    camera_entity: "Entiteta kamere (neobvezno, nadomesti kamere naprave)",
    rain: "Zaznan dež",
    rain_delay: "Zamik zaradi dežja · {time}",
    cutting_height: "Višina košnje",
    stuck: "Kosilnica je obtičala",
    no_device: "Robotske kosilnice ni mogoče najti. Je nameščena integracija z entiteto kosilnice (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Kosilnice ni mogoče najti",
    no_registry: "Ta kartica zahteva Home Assistant 2024.8 ali novejši.",
    device: "Kosilnica",
    title: "Naslov (neobvezno, privzeto ime naprave)",
    image: "Slika naprave",
    image_auto: "Samodejno (risba v barvah znamke)",
    image_none: "Brez",
    show_controls: "Prikaži gumbe za upravljanje",
    show_settings: "Prikaži nastavitve kosilnice",
    show_actions: "Prikaži dejanja",
    show_options: "Prikaži možnosti",
    show_maintenance: "Prikaži vzdrževanje",
    show_stats: "Prikaži statistiko",
    show_map: "Prikaži zemljevid",
    collapsed: "Privzeto strnjeni razdelki",
    map_entity: "Entiteta zemljevida (neobvezno, kamera ali slika)",
    map_never: "Nikoli",
    map_mowing: "Med košnjo",
    map_always: "Vedno",
    language: "Jezik",
    lang_auto: "Samodejno",
    zoom: "Gumb za podrobnosti",
    zoom_helper: "Gumb zgoraj desno, ki preklopi mini kartico na polno kartico in nazaj",
    zoom_in: "Prikaži polno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    s_mowing: "Kosi",
    s_docked: "Na postaji",
    s_paused: "Začasno ustavljena",
    s_returning: "Vrača se na postajo",
    s_error: "Napaka",
    s_idle: "Nedejavna",
    s_starting: "Zaganja se",
    s_edgecut: "Košnja robov",
    s_zoning: "Menjava območja",
    s_searching_zone: "Išče območje",
    s_escaped_digital_fence: "Zunaj svojega območja",
    s_rain_delayed: "Zamik zaradi dežja",
    s_leaving: "Zapušča postajo",
    s_unavailable: "Ni na voljo",
    s_unknown: "Neznano",
  },
  lv: {
    start: "Pļaut",
    pause: "Pauze",
    stop: "Stop",
    dock: "Stacija",
    battery: "Akumulators",
    charging: "Lādējas",
    progress: "Progress",
    remaining: "atlicis {time}",
    next_start: "Nākamais starts {when}",
    last_completed: "Pabeigts {when}",
    actions: "Darbības",
    run_action: "Palaist {name}?",
    options: "Opcijas",
    on: "Ieslēgts",
    off: "Izslēgts",
    cancel: "Atcelt",
    reset: "Atiestatīt",
    confirm_reset: "Atiestatīt skaitītāju {name}? Dariet to pēc detaļas nomaiņas.",
    maintenance: "Apkope",
    blade: "Asmeņi",
    blade_used: "{time} lietošanas",
    charging_cycles: "Uzlādes cikli",
    collisions: "Sadursmes",
    statistics: "Statistika",
    last_session: "Pēdējā pļaušana",
    total_cutting_time: "Pļaušanas laiks",
    total_running_time: "Darbības laiks",
    total_charging_time: "Uzlādes laiks",
    total_searching_time: "Meklēšanas laiks",
    total_distance: "Attālums",
    total_area: "Kopējā platība",
    sessions: "Pļaušanas",
    map: "Karte",
    camera: "Kamera",
    camera_unavailable: "Kamera nav pieejama",
    show_camera: "Rādīt kameru",
    camera_entity: "Kameras entītija (neobligāta, aizstāj ierīces kameras)",
    rain: "Konstatēts lietus",
    rain_delay: "Lietus aizkave · {time}",
    cutting_height: "Pļaušanas augstums",
    stuck: "Pļāvējs iestrēdzis",
    no_device: "Robotizēts zāles pļāvējs nav atrasts. Vai ir instalēta integrācija ar pļāvēja entītiju (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…)?",
    unknown_device: "Pļāvējs nav atrasts",
    no_registry: "Šai kartei nepieciešams Home Assistant 2024.8 vai jaunāks.",
    device: "Zāles pļāvējs",
    title: "Virsraksts (neobligāts, pēc noklusējuma ierīces nosaukums)",
    image: "Ierīces attēls",
    image_auto: "Automātiski (zīmējums zīmola krāsās)",
    image_none: "Nav",
    show_controls: "Rādīt vadības pogas",
    show_settings: "Rādīt pļāvēja iestatījumus",
    show_actions: "Rādīt darbības",
    show_options: "Rādīt opcijas",
    show_maintenance: "Rādīt apkopi",
    show_stats: "Rādīt statistiku",
    show_map: "Rādīt karti",
    collapsed: "Pēc noklusējuma sakļautās sadaļas",
    map_entity: "Kartes entītija (neobligāta, kamera vai attēls)",
    map_never: "Nekad",
    map_mowing: "Pļaušanas laikā",
    map_always: "Vienmēr",
    language: "Valoda",
    lang_auto: "Automātiski",
    zoom: "Detaļu poga",
    zoom_helper: "Poga augšējā labajā stūrī, kas pārslēdz minikarti uz pilno karti un atpakaļ",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    s_mowing: "Pļauj",
    s_docked: "Stacijā",
    s_paused: "Pauzēts",
    s_returning: "Atgriežas stacijā",
    s_error: "Kļūda",
    s_idle: "Dīkstāvē",
    s_starting: "Startē",
    s_edgecut: "Malu pļaušana",
    s_zoning: "Zonas maiņa",
    s_searching_zone: "Meklē zonu",
    s_escaped_digital_fence: "Ārpus savas teritorijas",
    s_rain_delayed: "Lietus aizkave",
    s_leaving: "Pamet staciju",
    s_unavailable: "Nav pieejams",
    s_unknown: "Nezināms",
  },
  el: {
    start: "Κούρεμα",
    pause: "Παύση",
    stop: "Στοπ",
    dock: "Βάση",
    battery: "Μπαταρία",
    charging: "Φορτίζει",
    progress: "Πρόοδος",
    remaining: "απομένουν {time}",
    next_start: "Επόμενη εκκίνηση {when}",
    last_completed: "Ολοκληρώθηκε {when}",
    actions: "Ενέργειες",
    run_action: "Εκτέλεση {name};",
    options: "Επιλογές",
    on: "Ενεργό",
    off: "Ανενεργό",
    cancel: "Άκυρο",
    reset: "Επαναφορά",
    confirm_reset: "Επαναφορά του μετρητή {name}; Κάντε το μετά την αντικατάσταση του εξαρτήματος.",
    maintenance: "Συντήρηση",
    blade: "Λεπίδες",
    blade_used: "{time} χρήσης",
    charging_cycles: "Κύκλοι φόρτισης",
    collisions: "Συγκρούσεις",
    statistics: "Στατιστικά",
    last_session: "Τελευταίο κούρεμα",
    total_cutting_time: "Χρόνος κουρέματος",
    total_running_time: "Χρόνος λειτουργίας",
    total_charging_time: "Χρόνος φόρτισης",
    total_searching_time: "Χρόνος αναζήτησης",
    total_distance: "Απόσταση",
    total_area: "Συνολική έκταση",
    sessions: "Κουρέματα",
    map: "Χάρτης",
    camera: "Κάμερα",
    camera_unavailable: "Η κάμερα δεν είναι διαθέσιμη",
    show_camera: "Εμφάνιση κάμερας",
    camera_entity: "Οντότητα κάμερας (προαιρετική, αντικαθιστά τις κάμερες της συσκευής)",
    rain: "Εντοπίστηκε βροχή",
    rain_delay: "Καθυστέρηση λόγω βροχής · {time}",
    cutting_height: "Ύψος κοπής",
    stuck: "Το ρομπότ κόλλησε",
    no_device: "Δεν βρέθηκε ρομποτική μηχανή γκαζόν. Είναι εγκατεστημένη ενσωμάτωση με οντότητα μηχανής γκαζόν (Husqvarna Automower, Ecovacs, Landroid Cloud, Mammotion, ZCS, Indego, Gardena…);",
    unknown_device: "Η μηχανή γκαζόν δεν βρέθηκε",
    no_registry: "Αυτή η κάρτα απαιτεί Home Assistant 2024.8 ή νεότερο.",
    device: "Μηχανή γκαζόν",
    title: "Τίτλος (προαιρετικός, προεπιλογή το όνομα της συσκευής)",
    image: "Εικόνα συσκευής",
    image_auto: "Αυτόματη (σχέδιο στα χρώματα της μάρκας)",
    image_none: "Καμία",
    show_controls: "Εμφάνιση κουμπιών ελέγχου",
    show_settings: "Εμφάνιση ρυθμίσεων της μηχανής",
    show_actions: "Εμφάνιση ενεργειών",
    show_options: "Εμφάνιση επιλογών",
    show_maintenance: "Εμφάνιση συντήρησης",
    show_stats: "Εμφάνιση στατιστικών",
    show_map: "Εμφάνιση χάρτη",
    collapsed: "Ενότητες συμπτυγμένες από προεπιλογή",
    map_entity: "Οντότητα χάρτη (προαιρετική, κάμερα ή εικόνα)",
    map_never: "Ποτέ",
    map_mowing: "Κατά το κούρεμα",
    map_always: "Πάντα",
    language: "Γλώσσα",
    lang_auto: "Αυτόματη",
    zoom: "Κουμπί λεπτομερειών",
    zoom_helper: "Κουμπί πάνω δεξιά που εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    s_mowing: "Κουρεύει",
    s_docked: "Στη βάση",
    s_paused: "Σε παύση",
    s_returning: "Επιστρέφει στη βάση",
    s_error: "Σφάλμα",
    s_idle: "Αδρανές",
    s_starting: "Εκκίνηση",
    s_edgecut: "Κοπή άκρων",
    s_zoning: "Αλλαγή ζώνης",
    s_searching_zone: "Αναζήτηση ζώνης",
    s_escaped_digital_fence: "Εκτός της περιοχής του",
    s_rain_delayed: "Καθυστέρηση λόγω βροχής",
    s_leaving: "Αποχωρεί από τη βάση",
    s_unavailable: "Μη διαθέσιμο",
    s_unknown: "Άγνωστο",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl / toLocale*: the card's language: option, else HA's full locale (keeps its region, e.g.
// pt-BR, de-CH) when its base matches the resolved card language, else that language. A bare "pt" (HA's
// code for European Portuguese) becomes "pt-PT", otherwise Intl formats it the Brazilian way.
const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const num = (s) => {
  if (!s) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

const valid = (s) => s && !["unknown", "unavailable", ""].includes(s.state);

const pretty = (v) => {
  const s = String(v ?? "").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Duration sensor → hours, whatever its unit.
const hours = (s) => {
  const v = num(s);
  if (v === null) return null;
  const u = s.attributes?.unit_of_measurement;
  return u === "min" ? v / 60 : u === "s" ? v / 3600 : u === "d" ? v * 24 : v;
};

// Unit of a sensor as Home Assistant sends it, `def` by default.
const unitOf = (s, def) => {
  const u = s?.attributes?.unit_of_measurement;
  return typeof u === "string" && u.trim() ? u : def;
};

// Duration in hours, written with the units of the language ("2 h 30 min", "2 Std. 30 Min.", "2 hr 30 min").
// Rounded to the minute first, so that 1.995 h reads "2 h" (not "1 h 60") and 0.999 h "1 h" (not "60 min").
const UNIT_FMT = {};
const fmtUnit = (v, unit, locale) => (UNIT_FMT[`${locale}|${unit}`] ??= new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short" })).format(v);
const fmtHours = (h, locale) => {
  if (h === null || h === undefined) return "—";
  if (h <= 0) return fmtUnit(0, "hour", locale);
  const total = Math.round(h * 60);
  if (total < 60) return fmtUnit(Math.max(1, total), "minute", locale);
  if (total < 600) {
    const m = total % 60;
    const H = fmtUnit(Math.floor(total / 60), "hour", locale);
    return m ? `${H} ${fmtUnit(m, "minute", locale)}` : H;
  }
  return fmtUnit(Math.round(h), "hour", locale);
};

const fmtNum = (v, digits = 0, locale) => (v === null ? "—" : Number(v).toLocaleString(locale, { maximumFractionDigits: digits }));

// Distance sensor (m or km) → "12.4 km" / "850 m".
const fmtDistance = (s, locale) => {
  const v = num(s);
  if (v === null) return "—";
  const u = unitOf(s, "m");
  if (u === "km" || u === "mi") return `${fmtNum(v, 1, locale)} ${u}`;
  const m = u === "cm" ? v / 100 : v;
  return m >= 1000 ? `${fmtNum(m / 1000, 1, locale)} km` : `${fmtNum(m, 0, locale)} m`;
};

// One formatter per language, built on first use.
const RTF = {};
const ago = (hass, config, iso) => {
  const d = Date.parse(iso);
  if (!Number.isFinite(d)) return null;
  const diff = (d - Date.now()) / 1000;
  const l = intlLocale(hass, config);
  const rtf = (RTF[l] ??= new Intl.RelativeTimeFormat(l, { numeric: "auto" }));
  const abs = Math.abs(diff);
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
};

// Mower status → color class.
const statusClass = (state) => {
  const s = String(state || "").toLowerCase();
  if (/error|fence|stuck|fail|unavailable/.test(s)) return "crit";
  if (/paused|rain|starting|unknown/.test(s)) return "warn";
  if (/mow|return|edgecut|zon|search|leaving/.test(s)) return "active";
  if (/docked|charg/.test(s)) return "ok";
  return "idle";
};

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// ---------------------------------------------------------------------------
// Registry-based resolution
// ---------------------------------------------------------------------------

const _cache = new WeakMap();

// Key of an entity: its translation_key, mapped per integration (KEY_MAPS), else the end of its entity id for
// the integrations that have no translation keys (ID_KEYS), else "" (kept under its domain only).
const keyOf = (e, domain) => {
  const tk = e.translation_key;
  if (tk) return KEY_MAPS[e.platform]?.[tk] || tk;
  const ids = ID_KEYS[e.platform];
  if (ids) {
    const name = e.entity_id.slice(domain.length + 1);
    for (const [suffix, key] of Object.entries(ids)) if (name === suffix || name.endsWith(`_${suffix}`)) return key;
  }
  return "";
};

/**
 * Build the model from hass.entities / hass.devices:
 * { devices: [{ id, name, platform, mower, entities, extra: { sensor: [...], button: [...], switch: [...] } }] }
 * A device is a lawn mower when it carries a lawn_mower entity; its other entities are keyed by the names the cards
 * read ("_<domain>" when they have none) and listed by domain in `extra`.
 */
const resolve = (hass) => {
  if (!hass.entities || !hass.devices) return null;
  const cached = _cache.get(hass.entities);
  if (cached && cached.devices === hass.devices) return cached.model;

  const byDevice = new Map();
  for (const e of Object.values(hass.entities)) {
    if (!e.device_id || e.hidden) continue;
    const domain = e.entity_id.split(".")[0];
    const item = byDevice.get(e.device_id) || { platform: e.platform, entities: {}, extra: {}, categories: {} };
    if (domain === "lawn_mower") item.mower ??= e.entity_id;
    const key = keyOf(e, domain);
    if (key && !(key in item.entities)) item.entities[key] = e.entity_id;
    (item.extra[domain] = item.extra[domain] || []).push(e.entity_id);
    if (!(`_${domain}` in item.entities)) item.entities[`_${domain}`] = e.entity_id;
    if (e.entity_category) item.categories[e.entity_id] = e.entity_category;
    byDevice.set(e.device_id, item);
  }

  const devices = [];
  for (const [id, item] of byDevice) {
    const d = hass.devices[id];
    if (!d || !item.mower) continue;
    devices.push({
      id,
      name: d.name_by_user || d.name || "",
      rawName: d.name,
      model: d.model,
      platform: item.platform,
      mower: item.mower,
      entities: item.entities,
      extra: item.extra,
      categories: item.categories,
    });
  }
  const model = { devices: devices.sort((a, b) => a.name.localeCompare(b.name)) };
  _cache.set(hass.entities, { devices: hass.devices, model });
  return model;
};

// Same dependency list (same length, same objects): what a memoized value was built from has not changed.
const sameDeps = (a, b) => !!a && a.length === b.length && a.every((d, i) => d === b[i]);
// A camera entity with a live stream (frontend_stream_type: hls or web_rtc), as opposed to a camera that only
// renders a picture (the Bosch Indego map).
const isLive = (s) => !!s?.attributes?.frontend_stream_type;
// Map pictures of a device: the entity set with map_entity (which may belong to no device), else the
// integration's image entities and its cameras without a live stream (Ecovacs GOAT map, Bosch Indego camera).
const mapIds = (dev, config, hass) =>
  config?.map_entity ? [config.map_entity] : [...(dev.extra.image || []), ...(dev.extra.camera || []).filter((id) => !isLive(hass?.states[id]))];
// Live cameras of a device (Mammotion Luba / Yuka vision cameras): the entity set with camera_entity, else the
// cameras of the device that stream.
const cameraIds = (dev, config, hass) => (config?.camera_entity ? [config.camera_entity] : (dev.extra.camera || []).filter((id) => isLive(hass?.states[id])));

// Home Assistant's own live player (WebRTC, HLS or MJPEG, whichever the camera offers). It ships with the picture
// cards, which are loaded on demand: building one loads it. Resolves once <ha-camera-stream> is defined.
let streamLoad = null;
const loadStream = (entity) => {
  if (customElements.get("ha-camera-stream")) return Promise.resolve();
  if (!streamLoad) {
    streamLoad = (async () => {
      const helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null;
      if (!helpers) throw new Error("loadCardHelpers unavailable");
      helpers.createCardElement({ type: "picture-entity", entity, camera_view: "live" });
      // whenDefined never rejects: time out so that a failed load rearms streamLoad instead of hanging forever.
      let timer;
      try {
        await Promise.race([
          customElements.whenDefined("ha-camera-stream"),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error("ha-camera-stream not loaded")), 15000);
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    })().catch((err) => {
      streamLoad = null; // the next update tries again
      throw err;
    });
  }
  return streamLoad;
};

const listDevices = (hass) => {
  const m = hass && resolve(hass);
  return m ? m.devices.map((d) => ({ value: d.id, label: d.name })) : [];
};

const findDevice = (hass, config) => {
  const m = resolve(hass);
  if (!m) return { error: "no_registry" };
  if (!m.devices.length) return { error: "no_device" };
  if (!config.device) return { dev: m.devices[0] };
  const dev = m.devices.find((d) => d.id === config.device || d.name === config.device);
  return dev ? { dev } : { error: "unknown_device" };
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --mc-accent: #2e7d32; --mc-ok: var(--success-color, #43a047); --mc-warn: var(--warning-color, #ffa600);
          --mc-crit: var(--error-color, #db4437); --mc-idle: var(--disabled-text-color, #9e9e9e); --mc-active: var(--info-color, #039be5);
          /* Text in a state or brand color is mixed with the text color (darker on a light theme, lighter on a dark
             one) so that it reads at 4.5:1 at least; dots, bars and icons keep the plain color. */
          --mc-accent-text: color-mix(in srgb, var(--mc-accent) 50%, var(--primary-text-color)); }
  /* Container queries below follow the width the card is given (Sections view columns, mini card). */
  ha-card { overflow: hidden; container-type: inline-size; }
  /* A size container has no width of its own content: in a parent that sizes to its content the card would fall to
     its borders. This empty, zero-height grid gives the card a natural (max-content) width without any minimum. */
  :host { display: block; min-width: 0; --mc-natural-width: 360px; }
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, var(--mc-natural-width)); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, var(--mc-accent)); outline-offset: 2px; border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
  .ok { --c: var(--mc-ok); } .warn { --c: var(--mc-warn); } .crit { --c: var(--mc-crit); } .idle { --c: var(--mc-idle); } .active { --c: var(--mc-active); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--mc-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--mc-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--mc-ok)) 50%, var(--primary-text-color));
          flex: 0 1 auto; min-width: 0; max-width: 50%; overflow: hidden; box-sizing: border-box; }
  .chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--mc-ok)); transition: width .6s ease; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0; }
  .logo { width: 40px; height: 40px; object-fit: contain; flex: none; }
  a.logo-link { display: flex; flex: none; text-decoration: none; }
  .type-icon { position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none;
               background: color-mix(in srgb, var(--mc-accent) 16%, transparent); }
  .type-icon .icon.type { width: 24px; height: 24px; fill: var(--mc-accent); }
  .type-icon .logo { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px;
                     background: var(--card-background-color, #fff);
                     box-shadow: 0 0 0 1px var(--divider-color, rgba(0,0,0,.12)), 0 0 0 3px var(--card-background-color, #fff); }
  /* The title takes the room the chip leaves (flex-basis 0: a long name does not push the chip into its ellipsis)
     and keeps about four characters and its ellipsis; the chip shrinks only when even that does not fit. */
  .titles { flex: 1 1 0; min-width: 5ch; font-size: 16px; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--mc-warn) 50%, var(--primary-text-color)); }
  .picture { flex: none; display: flex; align-items: center; justify-content: center; }
  .picture img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  .line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .alert-line { display: flex; align-items: center; gap: 6px; font-size: 13px; color: color-mix(in srgb, var(--c, var(--mc-crit)) 50%, var(--primary-text-color)); }
  .alert-line .icon { width: 16px; height: 16px; color: var(--c, var(--mc-crit)); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; cursor: pointer; font: inherit; font-size: 13px;
         font-weight: 500; padding: 6px 12px; border-radius: 18px; background: var(--secondary-background-color, rgba(127,127,127,.12));
         color: var(--primary-text-color); min-width: 0; }
  .btn span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btn:not(.disabled):hover { background: color-mix(in srgb, var(--mc-accent) 12%, var(--secondary-background-color, rgba(127,127,127,.12))); }
  .btn.primary { background: color-mix(in srgb, var(--mc-accent) 16%, transparent); color: var(--mc-accent-text); }
  .btn.primary .icon { color: var(--mc-accent); }
  .btn.primary:not(.disabled):hover { background: color-mix(in srgb, var(--mc-accent) 24%, transparent); }
  .btn .icon { width: 18px; height: 18px; }
  .btn.round { width: 36px; height: 36px; padding: 0; border-radius: 50%; }
  .btn.disabled { opacity: .45; cursor: default; }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--mc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, var(--mc-accent)); outline-offset: 1px; }
  /* Narrow card: the status chip keeps only its colored dot (its text stays in title and aria-label). */
  @container (max-width: 230px) {
    .chip { padding: 4px; flex: none; }
    .chip-text { display: none; }
  }
  /* The 40 px type icon keeps its size at every width: the name gives way (ellipsis) instead. */
  @container (max-width: 200px) {
    .header { gap: 6px; }
  }
`;

// In-card confirmation popup, as in the other ha-* cards: a backdrop over the card with a small dialog at the top of
// the card, so that it stays in view when the card is long.
const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 160px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 14px; line-height: 1.4; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
`;

// Element names of Home Assistant dialogs (more-info opened from the card, among others).
const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);

// True for a click outside `card` that is not in a dialog opened from it (more-info, say).
const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// After the confirmation popup closes, clicks on the card are ignored for this long: the second click of a double
// click on OK would otherwise land on what lies under the button (the battery, an action button).
const CONFIRM_GUARD_MS = 400;

// Inlined pictures (data: URIs of the logos and the mowers) are written as <img data-img="id"> and get their src
// once, then the same node is moved into every later render: the HTML stays small and the picture is not decoded
// again on each update.
const DATA_IMGS = [];
const DATA_IMG_IDS = new Map();
const imgTag = (src, attrs) => {
  if (!String(src).startsWith("data:")) return `<img src="${esc(src)}" ${attrs}>`;
  let id = DATA_IMG_IDS.get(src);
  if (id === undefined) {
    id = DATA_IMGS.push(src) - 1;
    DATA_IMG_IDS.set(src, id);
  }
  return `<img data-img="${id}" ${attrs}>`;
};

// Clicks that send a command to the mower.
const MOWER_ACTIONS = new Set(["start_mowing", "pause", "stop", "dock"]);
// Error sensor values that mean "no error".
const NO_ERROR = new Set(["none", "no_error", "ok", "0", "unknown", "", "no_message", "-1"]);
// Reset buttons (maintenance counters), shown next to their counter instead of among the actions.
const RESET_KEYS = { reset_blade: "blade", reset_cycles: "charging_cycles" };

// Elements a click acts on, and how one is told from the others across renders (see _focusedSpot).
const FOCUS_SELECTOR = "[data-action], [data-entity]";
const focusKey = (el) => {
  const data = Object.entries({ ...el.dataset });
  return data.length ? `${el.tagName}|${JSON.stringify(data)}` : "";
};

class MowerBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // Enter / Space on an element with the button role (tile, section title, chip…) acts as a click, as on a <button>
    // (which clicks on its own: left alone).
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key !== "Enter" && ev.key !== " ") || ev.target?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      ev.target.click();
    });
    // Escape closes the confirmation popup (as Cancel). Listened on the window while the popup is open: a re-render
    // or a click on its text takes the focus out of the card.
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || !this._confirm) return;
      ev.stopPropagation();
      this._closeConfirm();
    };
  }

  // Home Assistant pushes a new hass on every state change of the whole instance: the card is only
  // rebuilt when something it shows changed (see _deps).
  set hass(hass) {
    this._hass = hass;
    const deps = this._deps();
    const prev = this._lastDeps;
    if (deps && prev && sameDeps(prev, deps)) return;
    this._lastDeps = deps;
    this._update();
  }

  // What a render reads from hass: the registries, the language, the state objects of the device's entities (HA
  // replaces a state object whenever its state or attributes change) and the relative times ("next start in…"),
  // which move on their own. null (no device found): always render.
  _deps() {
    const h = this._hass;
    if (!h || !this._config) return null;
    const { dev } = findDevice(h, this._config);
    if (!dev) return null;
    const ids = [dev.mower, ...Object.values(dev.entities), ...Object.values(dev.extra).flat(), this._config.map_entity, this._config.camera_entity];
    return [h.entities, h.devices, h.language, h.locale, h.localize, h.formatEntityState, h.themes?.darkMode, this._subtitle(dev), ...ids.map((id) => h.states[id])];
  }

  get hass() {
    return this._hass;
  }

  // A click elsewhere on the page folds the sections back to their defaults (as in ha-carburants-france).
  // A click, not a pointerdown: folding on press would shift the layout under the pointer before the click.
  connectedCallback() {
    // Clicks inside a dialog (the more-info opened from the card) leave the card as it is.
    this._onOutside ??= (ev) => {
      if ((!this._toggled?.size && !this._confirm) || !isOutside(this, ev)) return;
      this._toggled = new Map();
      if (this._confirm) this._closeConfirm();
      else this._update();
    };
    document.addEventListener("click", this._onOutside, true);
    // Reattached with the popup still open (view switch, editor): Escape keeps closing it.
    if (this._confirm) window.addEventListener("keydown", this._onKey);
    // The live camera stream stops while the card is off-screen or the tab hidden, and connects again when it shows.
    this._onVisibility ??= () => this._syncCamera();
    document.addEventListener("visibilitychange", this._onVisibility);
    if (typeof IntersectionObserver === "function") {
      this._observer ??= new IntersectionObserver((entries) => {
        this._offscreen = !entries.at(-1).isIntersecting;
        this._syncCamera();
      });
      this._observer.observe(this);
    }
    // "Next start in 5 minutes" moves on its own: re-checked every minute while the card is on the page (set hass
    // only rebuilds the card when the text, part of _deps, changed).
    clearInterval(this._tick);
    this._tick = setInterval(() => {
      if (this._hass) this.hass = this._hass;
    }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    this._tick = null;
    document.removeEventListener("click", this._onOutside, true);
    window.removeEventListener("keydown", this._onKey);
    document.removeEventListener("visibilitychange", this._onVisibility);
    this._observer?.disconnect();
    clearTimeout(this._pendingTimer);
    this._syncCamera();
  }

  // Service call whose failure is already reported by Home Assistant (toast): the rejection is handled here so
  // that it does not end up as "Uncaught (in promise)". `onError` undoes what the card showed meanwhile.
  _call(domain, service, data, onError) {
    return Promise.resolve(this._hass.callService(domain, service, data)).catch(() => onError?.());
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this._html = "";
    this._lastDeps = null;
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  _update() {
    if (!this._hass || !this._config) return;
    let html = this._render();
    if (this._confirm) {
      html = html.replace(/<ha-card>([\s\S]*)<\/ha-card>\s*$/, (_, inner) => `<ha-card class="dialog-open">${inner}${this._confirmHtml()}</ha-card>`);
    }
    if (html === this._html) return;
    // The popup keeps its focus across the rewrite (OK, or Cancel when the user moved to it).
    const focused = this._confirm && this.shadowRoot.activeElement?.dataset?.action;
    // Otherwise, the element of the card that has the focus (keyboard user) gets it back once rewritten.
    const kept = this._confirm ? null : this._focusedSpot();
    this._html = html;
    this.shadowRoot.innerHTML = html;
    this._placeImages();
    this._placeCamera();
    if (kept) this._restoreFocus(kept);
    if (this._confirm) {
      const sel = focused === "confirm_cancel" ? '[data-action="confirm_cancel"]' : ".modal .primary";
      // preventScroll: an update while the popup is open must not bring a scrolled page back to the card.
      this.shadowRoot.querySelector(sel)?.focus({ preventScroll: true });
    }
  }

  // The live player (<ha-camera-stream>) outlives the renders, like the pictures: moving it reconnects the stream,
  // and a fresh one shows nothing until its first frame. It is created once the player is loaded (see loadStream),
  // and given its camera in _syncCamera.
  _placeCamera() {
    const slot = this.shadowRoot.querySelector(".cam-view");
    if (!slot) {
      this._camNode = null;
      this._syncCamera();
      return;
    }
    if (this._camNode) {
      slot.prepend(this._camNode);
    } else if (customElements.get("ha-camera-stream")) {
      const stream = document.createElement("ha-camera-stream");
      stream.muted = true;
      stream.fitMode = "cover";
      stream.aspectRatio = 16 / 9;
      stream.addEventListener("load", () => this.shadowRoot.querySelector(".cam-view")?.classList.remove("loading"));
      slot.prepend(stream);
      this._camNode = stream;
    } else {
      loadStream(slot.dataset.cam).then(
        () => {
          if (this.isConnected && this.shadowRoot.querySelector(".cam-view")) this._placeCamera();
        },
        () => {},
      );
    }
    this._syncCamera();
  }

  // Gives the player its camera, or none while the card is off-screen, hidden, detached, or shows no camera (the
  // stream then stops: a cellular mower meters its streaming time).
  _syncCamera() {
    const stream = this._camNode;
    if (!stream) return;
    const slot = this.shadowRoot.querySelector(".cam-view");
    const id = slot?.dataset.cam;
    const st = id && this._hass?.states[id];
    const live = !!st && st.state !== "unavailable" && this.isConnected && !this._offscreen && !document.hidden;
    const obj = live ? st : undefined;
    // Older Home Assistant versions take hass; newer ones read it from the page and do not declare it.
    if (stream.constructor.elementProperties?.has?.("hass")) stream.hass = this._hass;
    if (obj?.entity_id !== stream.stateObj?.entity_id) slot?.classList.toggle("loading", !!obj);
    if (stream.stateObj !== obj) stream.stateObj = obj;
  }

  // The focused element of the card, as what identifies it in the next render: its tag and data attributes, and its
  // rank among the elements that share them. null: the focus is elsewhere (more-info dialog, another card) or on an
  // element that cannot be found again.
  _focusedSpot() {
    const el = this.shadowRoot.activeElement;
    if (!el?.dataset) return null;
    const key = focusKey(el);
    if (!key) return null;
    const index = this._focusables(key).indexOf(el);
    return index < 0 ? null : { key, index };
  }

  _focusables(key) {
    return [...this.shadowRoot.querySelectorAll(FOCUS_SELECTOR)].filter((n) => focusKey(n) === key);
  }

  // preventScroll: a state update must not bring a scrolled page back to the card.
  _restoreFocus({ key, index }) {
    this._focusables(key)[index]?.focus({ preventScroll: true });
  }

  // Moves the inlined pictures kept from the previous render into the new one, or gives them their src once. The
  // map <img> outlives the renders the same way (a new node has no height until its picture has loaded, which would
  // collapse the card); its src follows the entity picture.
  _placeImages() {
    const kept = this._imgNodes || new Map();
    this._imgNodes = new Map();
    for (const img of this.shadowRoot.querySelectorAll("img[data-img], img[data-map]")) {
      const key = img.dataset.map ? `map|${img.dataset.map}` : `${img.dataset.img}|${img.className}`;
      const old = kept.get(key);
      const src = img.dataset.map ? this._s(img.dataset.map)?.attributes?.entity_picture : DATA_IMGS[img.dataset.img];
      if (old) {
        kept.delete(key);
        img.replaceWith(old);
        this._imgNodes.set(key, old);
        if (src && old.getAttribute("src") !== src) old.setAttribute("src", src);
      } else {
        if (src) img.setAttribute("src", src);
        this._imgNodes.set(key, img);
      }
    }
  }

  // Switches only change state on the next poll of the integration (up to ~30 s): the requested state is shown
  // meanwhile, until the entity reports it or the delay runs out.
  _setPending(id, state) {
    this._pending = { ...this._pending, [id]: { state, until: Date.now() + PENDING_MS } };
    clearTimeout(this._pendingTimer);
    this._pendingTimer = setTimeout(() => this._update(), PENDING_MS + 100);
    this._update();
  }

  _isOn(id) {
    const s = this._s(id);
    const p = this._pending?.[id];
    if (p && (Date.now() > p.until || s?.state === p.state)) delete this._pending[id];
    else if (p) return p.state === "on";
    return s?.state === "on";
  }

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    // Just closed: the rest of a double click on OK does nothing.
    if (!this._confirm && Date.now() - (this._confirmClosedAt ?? 0) < CONFIRM_GUARD_MS) {
      ev.stopPropagation();
      return;
    }
    // Confirmation popup open: only its buttons and the backdrop itself (outside the dialog) act.
    if (this._confirm) {
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "confirm_ok") {
        const { entity } = this._confirm;
        this._closeConfirm();
        this._call("button", "press", { entity_id: entity });
      } else if (action === "confirm_cancel" || (action === "confirm_backdrop" && path[0] === el)) {
        this._closeConfirm();
      }
      return;
    }
    if (!el) return;
    ev.stopPropagation();
    const { action, entity, label } = el.dataset;
    // No command to a mower that cannot take it (its buttons are drawn disabled; this also covers a click that
    // reaches a button before the card re-renders).
    if ((MOWER_ACTIONS.has(action) || action === "button") && this._offline(this._dev)) return;
    if (action === "zoom") return this._toggleZoom(ev);
    if (action === "camera") {
      this._camera = entity;
      return this._update();
    }
    if (action === "toggle_section") {
      const key = el.dataset.section;
      this._toggled = new Map(this._toggled).set(key, !this._isCollapsed(key));
      return this._update();
    }
    if (action === "switch") {
      const on = this._isOn(entity);
      this._setPending(entity, on ? "off" : "on");
      return this._call("switch", on ? "turn_off" : "turn_on", { entity_id: entity }, () => {
        // The request failed: show the entity's real state again.
        if (this._pending) delete this._pending[entity];
        this._update();
      });
    }
    if (action === "reset") {
      this._openConfirm({ entity, text: this._t("confirm_reset", { name: label }), ok: this._t("reset") });
    } else if (action === "button") {
      this._openConfirm({ entity, text: this._t("run_action", { name: label }), ok: this._t("start") });
    } else if (MOWER_ACTIONS.has(action)) {
      this._call("lawn_mower", action, { entity_id: entity });
    } else if (entity) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
    }
  }

  // Confirmation before pressing a button entity (action, counter reset): Cancel does nothing.
  _openConfirm(confirm) {
    this._confirm = confirm;
    window.addEventListener("keydown", this._onKey);
    this._update();
    this.shadowRoot.querySelector(".modal .primary")?.focus();
  }

  _closeConfirm() {
    this._confirm = null;
    this._confirmClosedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
  }

  _confirmHtml() {
    const c = this._confirm;
    return `<style>${DIALOG_STYLE}</style><div class="backdrop" data-action="confirm_backdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="msg">${esc(c.text)}</div>
        <div class="modal-actions">
          <button class="btn" data-action="confirm_cancel"><span>${esc(this._t("cancel"))}</span></button>
          <button class="btn primary" data-action="confirm_ok"><span>${esc(c.ok)}</span></button>
        </div>
      </div>
    </div>`;
  }

  // Translated state: card strings first (they follow the language option), then Home Assistant's
  // own translation of the integration, then a readable version of the raw value.
  _fmt(stateObj, prefix = "v_", value) {
    if (!stateObj && value === undefined) return "—";
    const raw = value ?? stateObj.state;
    const own = STRINGS[lang(this._hass, this._config)][`${prefix}${String(raw).toLowerCase()}`];
    if (own) return own;
    if (stateObj && value === undefined && this._hass.formatEntityState) {
      try {
        return this._hass.formatEntityState(stateObj);
      } catch (_e) {
        /* older Home Assistant */
      }
    }
    return pretty(raw);
  }

  // Status of the device: the lawn_mower entity's activity (its own states first, then the integration's extras).
  _status(dev) {
    const m = this._s(dev.mower);
    if (!m) return null;
    return { state: m.state, text: this._fmt(m, "s_"), entity: m.entity_id };
  }

  // Battery: the battery sensor (translation key, else device class), else the battery_level attribute of the mower.
  _battery(dev) {
    const ids = [dev.entities.battery, ...(dev.extra.sensor || [])];
    for (const id of ids) {
      const s = this._s(id);
      if (s && (id === dev.entities.battery || s.attributes?.device_class === "battery")) return s;
    }
    const m = this._s(dev.mower);
    const level = m?.attributes?.battery_level;
    return level === undefined || level === null ? undefined : { entity_id: m.entity_id, state: String(level), attributes: {} };
  }

  // Charging: the charging binary sensor (translation key, else device class battery_charging).
  _charging(dev) {
    const ids = [dev.entities.charging, ...(dev.extra.binary_sensor || [])];
    for (const id of ids) {
      const s = this._s(id);
      if (s && (id === dev.entities.charging || s.attributes?.device_class === "battery_charging")) return s.state === "on";
    }
    return false;
  }

  // Rain: the rain binary sensor (translation key, else device class moisture), on.
  _raining(dev) {
    const ids = [dev.entities.rain, ...(dev.extra.binary_sensor || [])];
    for (const id of ids) {
      const s = this._s(id);
      if (s && (id === dev.entities.rain || s.attributes?.device_class === "moisture")) return s.state === "on";
    }
    return false;
  }

  // The error of the mower: its error sensor (a code or a text), a binary error / alert / stuck sensor, or the
  // error attribute of the lawn_mower entity.
  _error(dev) {
    const e = dev.entities;
    const err = this._s(e.error);
    if (valid(err) && err.entity_id.startsWith("sensor.") && !NO_ERROR.has(String(err.state).toLowerCase()))
      return { entity: err.entity_id, text: err.attributes?.description || this._fmt(err, "e_") };
    if (err?.state === "on") return { entity: err.entity_id, text: this._t("s_error") };
    for (const [k, label] of [
      ["stuck", "stuck"],
      ["alert", "s_error"],
    ]) {
      const s = this._s(e[k]);
      if (s?.state === "on") return { entity: s.entity_id, text: this._t(label) };
    }
    const m = this._s(dev.mower);
    const attr = m?.attributes?.error || m?.attributes?.error_message;
    if (attr && m.state === "error") return { entity: m.entity_id, text: String(attr) };
    return null;
  }

  // Mower error (opens its entity), or "".
  _errorLine(dev) {
    const err = this._error(dev);
    return err
      ? `<div class="alert-line crit clickable" role="button" tabindex="0" data-entity="${esc(err.entity)}">${svgIcon(ICONS.alert)}<span>${esc(err.text)}</span></div>`
      : "";
  }

  // Rain detected, or a rain delay still running (opens its entity), or "".
  _rainLine(dev) {
    const e = dev.entities;
    const delay = this._s(e.rain_delay_remaining);
    const h = hours(delay);
    if (valid(delay) && h > 0)
      return `<div class="line clickable" role="button" tabindex="0" data-entity="${esc(delay.entity_id)}">${svgIcon(ICONS.rain)}<span>${esc(this._t("rain_delay", { time: fmtHours(h, this._locale()) }))}</span></div>`;
    if (!this._raining(dev)) return "";
    const ids = [e.rain, ...(dev.extra.binary_sensor || [])];
    const id = ids.find((i) => this._s(i)?.state === "on" && (i === e.rain || this._s(i).attributes?.device_class === "moisture"));
    return `<div class="line clickable" role="button" tabindex="0" data-entity="${esc(id || "")}">${svgIcon(ICONS.rain)}<span>${esc(this._t("rain"))}</span></div>`;
  }

  // Picture of the mower (opens the lawn_mower entity), or "" when there is none.
  _pictureBlock(dev, status) {
    const pic = this._picture(dev, status);
    return pic
      ? `<div class="picture clickable" role="button" tabindex="0" aria-label="${esc(this._config.title || dev.name || "")}" data-entity="${esc(dev.mower)}">${imgTag(pic, 'alt=""')}</div>`
      : "";
  }

  _picture(dev, status) {
    const img = this._config.image;
    if (img === "none") return null;
    if (img && img !== "auto") return img;
    return svgUri(mowerSvg(brandOf(dev), activityOf(status?.state, this._charging(dev), this._raining(dev))));
  }

  // Icon of the kind of device, tinted with the brand color, with the logo of the integration's brand as a badge,
  // linking to its site. Unknown integration: the icon alone.
  _logo(dev) {
    const b = brandFor(dev);
    const icon = svgIcon(ICONS.mower, "type");
    if (!b.logo) return `<span class="type-icon">${icon}</span>`;
    return `<a class="logo-link type-icon" href="${b.site}" target="_blank" rel="noopener noreferrer" title="${esc(b.name)}">${imgTag(b.logo, `class="logo" alt="${esc(b.name)}"`)}${icon}</a>`;
  }

  _header(dev, status, sub) {
    const c = this._config;
    return `
      <div class="header">
        ${this._logo(dev)}
        <div class="titles">
          <div class="name">${esc(c.title || dev.name)}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>
        ${
          status
            ? `<span class="chip clickable ${statusClass(status.state)}" role="button" tabindex="0" data-entity="${esc(status.entity)}" title="${esc(status.text)}" aria-label="${esc(
                status.text,
              )}"><span class="dot"></span><span class="chip-text">${esc(status.text)}</span></span>`
            : ""
        }
        ${this._zoomButton()}
      </div>`;
  }

  // Detail button at the far right of the header (mini card only).
  _zoomButton() {
    return "";
  }

  _errorCard(key) {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(
      key === "unknown_device" ? `${this._t(key)}: ${this._config.device}` : this._t(key),
    )}</div></ha-card>`;
  }

  // Subtitle of the header: the next scheduled start when it is known, else when the last session completed.
  _subtitle(dev) {
    const next = this._s(dev.entities.next_start);
    const when = valid(next) ? ago(this._hass, this._config, next.state) : null;
    if (when) return this._t("next_start", { when });
    const last = this._s(dev.entities.last_completed);
    const done = valid(last) ? ago(this._hass, this._config, last.state) : null;
    return done ? this._t("last_completed", { when: done }) : "";
  }

  _batteryLevel(batt) {
    const v = num(batt);
    return { v, cls: v === null ? "idle" : v <= 15 ? "crit" : v <= 30 ? "warn" : "ok" };
  }

  // True when the mower can take no command: unavailable, or unknown.
  _offline(dev) {
    const m = this._s(dev?.mower);
    return !m || m.state === "unavailable" || m.state === "unknown";
  }

  // supported_features of the lawn_mower entity (start, pause and dock when the integration does not say).
  _features(dev) {
    const f = this._s(dev.mower)?.attributes?.supported_features;
    return Number.isFinite(f) ? f : FEATURE.start | FEATURE.pause | FEATURE.dock;
  }

  _controls(dev, round = false) {
    const m = this._s(dev.mower);
    if (!m || this._config.show_controls === false) return "";
    const f = this._features(dev);
    const mowing = statusClass(m.state) === "active" && m.state !== "returning";
    // Home Assistant drops a service call to an unavailable entity without a word: the buttons say it instead.
    const off = this._offline(dev);
    const btn = (action, icon, label, cls = "") =>
      `<button class="btn ${round ? "round" : ""} ${cls}${off ? " disabled" : ""}" title="${esc(label)}" data-action="${action}" data-entity="${esc(m.entity_id)}"${
        off ? " disabled" : ""
      }>${svgIcon(icon)}${round ? "" : `<span>${esc(label)}</span>`}</button>`;
    const list = [
      mowing && f & FEATURE.pause ? btn("pause", ICONS.pause, this._t("pause"), "primary") : f & FEATURE.start ? btn("start_mowing", ICONS.play, this._t("start"), "primary") : "",
      !round && f & FEATURE.stop ? btn("stop", ICONS.stop, this._t("stop")) : "",
      f & FEATURE.dock ? btn("dock", ICONS.home, this._t("dock")) : "",
    ];
    return list.join("");
  }

  // Name of an entity of the device, without the device name it starts with.
  _shortName(dev, s) {
    let name = s.attributes?.friendly_name || s.entity_id;
    for (const p of [dev.rawName, dev.name]) if (p && name.startsWith(`${p} `)) name = name.slice(p.length + 1);
    return name;
  }
}

const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .hero { display: flex; gap: 12px; align-items: center; }
  .picture { width: 96px; height: 104px; }
  .picture img { filter: drop-shadow(0 4px 8px rgba(0,0,0,.18)); }
  .batt { display: flex; align-items: center; gap: 8px; }
  .batt .pct { font-size: 30px; font-weight: 400; line-height: 1; }
  .batt .pct small { font-size: 14px; margin-left: 2px; color: var(--secondary-text-color); }
  .batt .icon { color: var(--c); }
  .batt .bolt { color: var(--mc-ok); width: 20px; height: 20px; }
  .line .icon { width: 16px; height: 16px; }
  .tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .tag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 6px; border-radius: 8px;
         background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); white-space: nowrap;
         max-width: 100%; min-width: 0; box-sizing: border-box; }
  .tag span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .tag .icon { width: 14px; height: 14px; color: var(--secondary-text-color); }
  .controls { display: flex; flex-wrap: wrap; gap: 6px; }
  .controls .btn { flex: 1 1 auto; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .section-title.toggle { cursor: pointer; user-select: none; }
  .section-title.toggle[aria-expanded="false"] { margin-bottom: 0; }
  .section-title .chevron { margin-left: auto; width: 16px; height: 16px; transition: transform .2s ease; }
  .section-title.toggle[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
  .actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .actions .btn { font-weight: 400; padding: 6px 12px 6px 8px; }
  .actions .btn .icon { color: var(--mc-accent); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 6px; }
  .tiles.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .tile { display: flex; flex-direction: column; gap: 2px; padding: 6px 10px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .k { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile .k span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .tile .k .icon { width: 14px; height: 14px; color: var(--c, var(--secondary-text-color)); }
  .tile .v { font-size: 14px; font-weight: 500; line-height: 1.3; overflow-wrap: anywhere; }
  .tile.warn .v, .tile.crit .v { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); }
  .rows { display: grid; grid-template-columns: 18px minmax(0, 1fr) 90px 56px; align-items: center; gap: 2px 8px; font-size: 12px; }
  .rows .icon { color: var(--secondary-text-color); }
  .rows .lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rows .v { text-align: right; font-weight: 500; white-space: nowrap; }
  .rows .v.warn, .rows .v.crit { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); }
  .rows .nobar { height: 6px; }
  .rows.with-reset { grid-template-columns: 18px minmax(0, 1fr) 90px 56px 28px; }
  .reset { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 50%;
           background: transparent; color: var(--secondary-text-color); cursor: pointer; padding: 0; }
  .reset:hover { background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--mc-accent-text); }
  .reset .icon { width: 18px; height: 18px; }
  .options { display: flex; flex-direction: column; gap: 4px; }
  .option { display: flex; align-items: center; gap: 8px; font-size: 13px; min-width: 0; }
  .option .lbl { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .option .lbl .icon { width: 16px; height: 16px; color: var(--secondary-text-color); vertical-align: -3px; margin-right: 6px; }
  .toggle-btn { all: unset; cursor: pointer; width: 34px; height: 18px; border-radius: 9px; position: relative; flex: none;
                background: var(--divider-color, rgba(127,127,127,.3)); transition: background .2s ease; }
  .toggle-btn::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff;
                       box-shadow: 0 1px 2px rgba(0,0,0,.3); transition: transform .2s ease; }
  .toggle-btn.on { background: var(--mc-accent); }
  .toggle-btn.on::after { transform: translateX(16px); }
  .toggle-btn:focus-visible { outline: 2px solid var(--primary-color, var(--mc-accent)); outline-offset: 2px; }
  .toggle-btn.disabled { opacity: .45; cursor: default; }
  .map img { width: 100%; border-radius: 10px; display: block; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .cam-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
  .cam-tabs .btn { font-weight: 400; }
  .cam-tabs .btn.on { background: color-mix(in srgb, var(--mc-accent) 16%, transparent); color: var(--mc-accent-text); font-weight: 500; }
  .cam-view { position: relative; aspect-ratio: 16 / 9; border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center;
              background: color-mix(in srgb, var(--primary-text-color) 8%, var(--secondary-background-color, rgba(127,127,127,.08))); }
  .cam-view ha-camera-stream { position: absolute; inset: 0; width: 100%; height: 100%; }
  .cam-view .cam-icon { width: 40px; height: 40px; color: var(--secondary-text-color); opacity: .5; }
  .cam-view.loading .cam-icon { animation: cam-pulse 1.4s ease-in-out infinite; }
  .cam-view .cam-off { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
                       font-size: 12px; color: var(--secondary-text-color); }
  .cam-open { all: unset; position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: grid; place-items: center;
              background: rgba(20,20,20,.45); color: #fff; backdrop-filter: blur(4px); }
  .cam-open .icon { width: 18px; height: 18px; }
  .cam-open:hover { background: rgba(20,20,20,.65); }
  .cam-open:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
  @keyframes cam-pulse { 0%, 100% { opacity: .25; } 50% { opacity: .6; } }
  /* Narrow card (9 of 12 columns in a narrow Sections view, ~240 px): the maintenance bars give way to the labels
     (the value keeps its state color), then the picture shrinks and the statistics take one column. */
  @container (max-width: 360px) {
    .rows { grid-template-columns: 18px minmax(0, 1fr) auto; }
    .rows.with-reset { grid-template-columns: 18px minmax(0, 1fr) auto 28px; }
    .rows .bar, .rows .nobar { display: none; }
  }
  @container (max-width: 300px) {
    .picture { width: 72px; height: 80px; }
    .hero { gap: 10px; }
    .tiles.two { grid-template-columns: minmax(0, 1fr); }
  }
  /* Below its 9 columns (a "1fr 1fr" layout-card or grid on a phone, ~156-200 px): the battery keeps its "100 %". */
  @container (max-width: 200px) {
    .picture { width: 48px; height: 56px; }
    .hero { gap: 8px; }
    .batt { gap: 4px; }
    .batt .pct { font-size: 24px; }
  }
`;

class MowerCard extends MowerBase {
  static getConfigElement() {
    return document.createElement("mower-card-editor");
  }

  static getStubConfig(hass) {
    const m = hass && resolve(hass);
    return m?.devices[0] ? { device: m.devices[0].id } : {};
  }

  getCardSize() {
    return 7;
  }

  // Below 9 of 12 columns (~240 px in the narrowest Sections view) the hero, the controls and the maintenance rows
  // no longer fit: 9 is the narrowest width the layout holds at.
  getGridOptions() {
    return { columns: 12, min_columns: 9 };
  }

  _render() {
    const { dev, error } = findDevice(this._hass, this._config);
    if (error) return this._errorCard(error);
    this._dev = dev;
    const c = this._config;
    const status = this._status(dev);
    const parts = [this._hero(dev, status)];
    if (c.show_controls !== false) parts.push(`<div class="controls">${this._controls(dev)}</div>`);
    if (c.show_actions !== false) parts.push(this._actions(dev));
    if (c.show_options !== false) parts.push(this._options(dev));
    if (c.show_maintenance !== false) parts.push(this._maintenance(dev));
    if (c.show_stats !== false) parts.push(this._stats(dev));
    if (c.show_camera !== false) parts.push(this._cameraSection(dev));
    if (this._showMap(status)) parts.push(this._map(dev));
    return `<style>${BASE_STYLE}${FULL_STYLE}${accentStyle(dev, this._hass)}</style>
      <ha-card>
        ${this._header(dev, status, this._subtitle(dev))}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _hero(dev, status) {
    const e = dev.entities;
    const batt = this._battery(dev);
    const { v, cls } = this._batteryLevel(batt);
    const charging = this._charging(dev);
    const lines = [];
    const line = (id, icon, text) => `<div class="line clickable" role="button" tabindex="0" data-entity="${esc(id || "")}">${svgIcon(icon)}<span>${esc(text)}</span></div>`;

    if (statusClass(status?.state) === "active") {
      const pct = num(this._s(e.progress));
      const areaS = this._s(e.area);
      const area = num(areaS);
      const left = hours(this._s(e.remaining_time));
      const time = hours(this._s(e.time));
      const bits = [
        pct !== null ? `${this._t("progress")} ${Math.round(pct)} %` : null,
        left !== null && left > 0 ? this._t("remaining", { time: fmtHours(left, this._locale()) }) : null,
        area !== null && area > 0 ? `${fmtNum(area, 1, this._locale())} ${unitOf(areaS, "m²")}` : null,
        time !== null && time > 0 && left === null ? fmtHours(time, this._locale()) : null,
      ].filter(Boolean);
      if (bits.length) lines.push(line(e.progress || e.remaining_time || e.area || e.time, ICONS.clock, bits.join(" · ")));
    }

    lines.push(this._errorLine(dev), this._rainLine(dev));
    // Husqvarna Automower: why the mower stays parked (week schedule, frost, daily limit…), while it is docked.
    const restricted = this._s(e.restricted_reason);
    if (valid(restricted) && status?.state === "docked" && !["none", "not_applicable"].includes(restricted.state)) lines.push(line(restricted.entity_id, ICONS.calendar, this._fmt(restricted)));

    if (this._config.show_settings !== false) {
      const tags = [];
      const tag = (id, icon, text) => (text ? `<span class="tag clickable" role="button" tabindex="0" data-entity="${esc(id)}">${svgIcon(icon)}<span>${esc(text)}</span></span>` : "");
      const area = this._s(e.work_area);
      if (valid(area)) tags.push(tag(area.entity_id, ICONS.zone, this._fmt(area)));
      const mode = this._s(e.mode);
      if (valid(mode)) tags.push(tag(mode.entity_id, ICONS.mode, this._fmt(mode)));
      const height = this._s(e.cutting_height);
      if (valid(height) && num(height) !== null) tags.push(tag(height.entity_id, ICONS.height, `${fmtNum(num(height), 1, this._locale())} ${unitOf(height, "")}`.trim()));
      const light = this._s(e.headlight);
      if (valid(light)) tags.push(tag(light.entity_id, ICONS.bulb, this._fmt(light)));
      const schedule = this._s(e.schedule);
      if (valid(schedule)) tags.push(tag(schedule.entity_id, ICONS.calendar, this._t(this._isOn(schedule.entity_id) ? "on" : "off")));
      if (tags.length) lines.push(`<div class="tags">${tags.join("")}</div>`);
    }

    return `<div class="hero">
      ${this._pictureBlock(dev, status)}
      <div class="info">
        ${
          batt
            ? `<div class="batt clickable ${cls}" role="button" tabindex="0" data-entity="${esc(batt.entity_id)}">
                 ${svgIcon(ICONS.battery)}<span class="pct">${v === null ? "—" : Math.round(v)}<small>%</small></span>
                 ${charging ? svgIcon(ICONS.bolt, "bolt") : ""}
               </div>
               <div class="bar ${cls}"><div style="width:${Math.max(0, Math.min(100, v ?? 0))}%"></div></div>`
            : ""
        }
        ${lines.join("")}
      </div>
    </div>`;
  }

  // The available entities among `ids`, as { id, name } sorted by their name without the device name.
  _items(dev, ids) {
    return ids
      .map((id) => this._s(id))
      .filter((s) => s && s.state !== "unavailable")
      .map((s) => ({ id: s.entity_id, name: this._shortName(dev, s) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Buttons of the device (edge cut, confirm error, relocate, sync clock…) as one-tap actions with a confirmation;
  // the counter resets are shown next to their counter instead, and the diagnostic buttons are left out.
  _actionButtons(dev) {
    const resets = new Set(Object.keys(RESET_KEYS).map((k) => dev.entities[k]));
    return this._items(
      dev,
      (dev.extra.button || []).filter((id) => !resets.has(id) && dev.categories[id] !== "diagnostic"),
    );
  }

  _actions(dev) {
    const items = this._actionButtons(dev);
    if (!items.length) return "";
    const off = this._offline(dev);
    return `<div>
      ${this._sectionTitle("actions", ICONS.action, this._t("actions"))}
      ${
        this._isCollapsed("actions")
          ? ""
          : `<div class="actions">${items
              .map(
                (r) =>
                  `<button class="btn${off ? " disabled" : ""}" data-action="button" data-entity="${esc(r.id)}" data-label="${esc(r.name)}"${off ? " disabled" : ""}>${svgIcon(
                    ICONS.action,
                  )}<span>${esc(r.name)}</span></button>`,
              )
              .join("")}</div>`
      }
    </div>`;
  }

  // Switches of the device (schedule, party mode, lock, stay-out zones…) as toggles.
  _options(dev) {
    const items = this._items(dev, dev.extra.switch || []);
    if (!items.length) return "";
    const off = this._offline(dev);
    return `<div>
      ${this._sectionTitle("options", ICONS.options, this._t("options"))}
      ${
        this._isCollapsed("options")
          ? ""
          : `<div class="options">${items
              .map((o) => {
                const on = this._isOn(o.id);
                const icon = o.id === dev.entities.schedule ? ICONS.calendar : o.id === dev.entities.lock ? ICONS.lock : ICONS.options;
                return `<div class="option"><span class="lbl clickable" role="button" tabindex="0" data-entity="${esc(o.id)}">${svgIcon(icon)}${esc(o.name)}</span>
                  <button class="toggle-btn${on ? " on" : ""}${off ? " disabled" : ""}" role="switch" aria-checked="${on}" aria-label="${esc(o.name)}" data-action="switch" data-entity="${esc(o.id)}"${off ? " disabled" : ""}></button></div>`;
              })
              .join("")}</div>`
      }
    </div>`;
  }

  // Collapsible sections: `collapsed` lists the sections folded by default (statistics unless set); a click on a
  // section title folds or unfolds it, and a click elsewhere on the page folds it back.
  _isCollapsed(key) {
    if (this._toggled?.has(key)) return this._toggled.get(key);
    const c = this._config.collapsed ?? DEFAULT_COLLAPSED;
    return (Array.isArray(c) ? c : [c]).includes(key);
  }

  _sectionTitle(key, icon, label) {
    const closed = this._isCollapsed(key);
    return `<div class="section-title toggle" role="button" tabindex="0" data-action="toggle_section" data-section="${key}" aria-expanded="${!closed}">${svgIcon(icon)}<span>${esc(
      label,
    )}</span>${svgIcon(ICONS.chevron_down, "chevron")}</div>`;
  }

  _tile(id, icon, label, value, cls = "") {
    return `<div class="tile clickable ${cls}" role="button" tabindex="0" data-entity="${esc(id || "")}"><div class="k">${svgIcon(icon)}<span>${esc(label)}</span></div><div class="v">${esc(value)}</div></div>`;
  }

  // Maintenance: the blades (usage time, or remaining life in percent), the battery charge cycles and the
  // collisions, each with its reset button when the integration provides one.
  _maintenance(dev) {
    const e = dev.entities;
    const rows = [];
    const reset = (key, label) => {
      const id = e[key];
      if (!id || this._config.show_controls === false) return "";
      const off = this._offline(dev);
      return `<button class="reset${off ? " disabled" : ""}" title="${esc(this._t("reset"))}" data-action="reset" data-entity="${esc(id)}" data-label="${esc(label)}"${off ? " disabled" : ""}>${svgIcon(ICONS.reset)}</button>`;
    };
    const withReset = Object.keys(RESET_KEYS).some((k) => e[k]);
    const row = (icon, label, value, cls, bar, resetHtml) =>
      rows.push(
        `${svgIcon(icon)}<span class="lbl clickable" role="button" tabindex="0" data-entity="${esc(value.id)}">${esc(label)}</span>${
          bar === null ? `<span class="nobar"></span>` : `<div class="bar ${cls}"><div style="width:${bar}%"></div></div>`
        }<span class="v clickable ${cls}" role="button" tabindex="0" data-entity="${esc(value.id)}">${esc(value.text)}</span>${withReset ? resetHtml || "<span></span>" : ""}`,
      );
    const life = this._s(e.blade_life);
    const time = this._s(e.blade_time);
    if (valid(life) && num(life) !== null) {
      const v = Math.max(0, Math.min(100, num(life)));
      row(ICONS.blade, this._t("blade"), { id: life.entity_id, text: `${Math.round(v)} %` }, v <= 10 ? "crit" : v <= 25 ? "warn" : "ok", v, reset("reset_blade", this._t("blade")));
    } else if (valid(time) && hours(time) !== null) {
      const h = hours(time);
      // Blades are usually changed every 1 to 3 months of mowing: colored from 100 h of use.
      row(ICONS.blade, this._t("blade"), { id: time.entity_id, text: this._t("blade_used", { time: fmtHours(h, this._locale()) }) }, h >= 200 ? "crit" : h >= 100 ? "warn" : "ok", null, reset("reset_blade", this._t("blade")));
    }
    const cycles = this._s(e.charging_cycles);
    if (valid(cycles) && num(cycles) !== null) row(ICONS.count, this._t("charging_cycles"), { id: cycles.entity_id, text: fmtNum(num(cycles), 0, this._locale()) }, "ok", null, reset("reset_cycles", this._t("charging_cycles")));
    const coll = this._s(e.collisions);
    if (valid(coll) && num(coll) !== null) row(ICONS.collision, this._t("collisions"), { id: coll.entity_id, text: fmtNum(num(coll), 0, this._locale()) }, "ok", null, "");
    if (!rows.length) return "";
    return `<div>
      ${this._sectionTitle("maintenance", ICONS.blade, this._t("maintenance"))}
      ${this._isCollapsed("maintenance") ? "" : `<div class="rows${withReset ? " with-reset" : ""}">${rows.join("")}</div>`}
    </div>`;
  }

  _stats(dev) {
    const e = dev.entities;
    const tiles = [];
    const L = this._locale();
    // Counters still at 0 (device never used, or not reporting them) are left out, and the whole section when
    // nothing is left. The current session's area and time are shown in the hero while the mower works.
    const area = this._s(e.area);
    const time = this._s(e.time);
    if (statusClass(this._s(dev.mower)?.state) !== "active" && ((valid(area) && num(area)) || (valid(time) && num(time)))) {
      const bits = [valid(area) && num(area) ? `${fmtNum(num(area), 1, L)} ${unitOf(area, "m²")}` : null, valid(time) && num(time) ? fmtHours(hours(time), L) : null].filter(Boolean);
      tiles.push(this._tile((area || time).entity_id, ICONS.clock, this._t("last_session"), bits.join(" · ")));
    }
    const duration = (key, icon) => {
      const s = this._s(e[key]);
      if (valid(s) && num(s)) tiles.push(this._tile(s.entity_id, icon, this._t(key), fmtHours(hours(s), L)));
    };
    duration("total_cutting_time", ICONS.grass);
    duration("total_running_time", ICONS.clock);
    duration("total_charging_time", ICONS.bolt);
    duration("total_searching_time", ICONS.zone);
    const dist = this._s(e.total_distance);
    if (valid(dist) && num(dist)) tiles.push(this._tile(dist.entity_id, ICONS.distance, this._t("total_distance"), fmtDistance(dist, L)));
    const tArea = this._s(e.total_area);
    if (valid(tArea) && num(tArea)) tiles.push(this._tile(tArea.entity_id, ICONS.area, this._t("total_area"), `${fmtNum(num(tArea), 0, L)} ${unitOf(tArea, "m²")}`));
    const count = this._s(e.sessions);
    if (valid(count) && num(count)) tiles.push(this._tile(count.entity_id, ICONS.count, this._t("sessions"), fmtNum(num(count), 0, L)));
    if (!tiles.length) return "";
    return `<div>
      ${this._sectionTitle("stats", ICONS.stats, this._t("statistics"))}
      ${this._isCollapsed("stats") ? "" : `<div class="tiles two">${tiles.join("")}</div>`}
    </div>`;
  }

  // show_map: true / "always", false / "never", or "mowing" (default) to show it only while the mower works.
  _showMap(status) {
    const m = this._config.show_map ?? "mowing";
    if (m === true || m === "always") return true;
    if (m !== "mowing") return false;
    return statusClass(status?.state) === "active";
  }

  // Live camera of the mower (Mammotion Luba / Yuka: left, right, rear and vision cameras), in a section folded by
  // default: the stream only runs while the section is unfolded and the card visible. Several cameras: one tab each.
  _cameraSection(dev) {
    const ids = cameraIds(dev, this._config, this._hass).filter((id) => this._s(id));
    if (!ids.length) return "";
    const current = ids.includes(this._camera) ? this._camera : ids[0];
    const title = this._sectionTitle("camera", ICONS.camera, this._t("camera"));
    if (this._isCollapsed("camera")) return `<div>${title}</div>`;
    const tabs =
      ids.length > 1
        ? `<div class="cam-tabs">${ids
            .map((id) => `<button class="btn${id === current ? " on" : ""}" data-action="camera" data-entity="${esc(id)}"><span>${esc(this._shortName(dev, this._s(id)))}</span></button>`)
            .join("")}</div>`
        : "";
    const st = this._s(current);
    const off = !st || st.state === "unavailable";
    return `<div>
      ${title}
      ${tabs}
      <div class="cam-view${off ? "" : " loading"}" data-cam="${esc(current)}">
        ${off ? `<div class="cam-off">${svgIcon(ICONS.camera, "cam-icon")}<span>${esc(this._t("camera_unavailable"))}</span></div>` : svgIcon(ICONS.camera, "cam-icon")}
        <button class="cam-open" data-entity="${esc(current)}" title="${esc(this._shortName(dev, st || { entity_id: current }))}" aria-label="${esc(this._shortName(dev, st || { entity_id: current }))}">${svgIcon(ICONS.expand)}</button>
      </div>
    </div>`;
  }

  _map(dev) {
    const map = mapIds(dev, this._config, this._hass)
      .map((id) => this._s(id))
      .find((s) => s?.attributes?.entity_picture);
    if (!map) return "";
    return `<div class="map clickable" role="button" tabindex="0" data-entity="${esc(map.entity_id)}" title="${esc(this._t("map"))}"><img alt="${esc(this._t("map"))}" data-map="${esc(map.entity_id)}"></div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

const MINI_STYLE = `
  /* Natural width in a parent that sizes to its content (see :host::before in BASE_STYLE). */
  :host { --mc-natural-width: 300px; }
  .name { font-size: 16px; }
  .content { padding: 8px 12px 12px; display: flex; align-items: center; gap: 12px; }
  .picture { width: 64px; height: 72px; }
  .picture img { filter: drop-shadow(0 2px 4px rgba(0,0,0,.18)); }
  .batt { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .batt .icon { color: var(--c); width: 16px; height: 16px; }
  .batt .bar { flex: 1; }
  .batt .v { font-weight: 500; min-width: 40px; text-align: right; }
  .batt .bolt { color: var(--mc-ok); width: 14px; height: 14px; }
  .line .icon { width: 14px; height: 14px; }
  .controls { display: flex; gap: 6px; flex: none; }
  /* Narrow mini card (6 of 12 columns, 156-250 px): the round buttons move under the mower, then the picture
     gives way to the battery and the info lines. */
  @container (max-width: 300px) {
    .content { flex-wrap: wrap; row-gap: 8px; }
    .controls { flex-basis: 100%; justify-content: flex-end; }
  }
  @container (max-width: 200px) {
    .picture { display: none; }
  }
`;

// The mini card is a full card drawn compact: its detail button (top right, `zoom: false` removes it) switches it
// to the full card's content and back, and a click anywhere else on the page brings the compact view back.
class MowerMiniCard extends MowerCard {
  constructor() {
    super();
    // Clicks inside a dialog (the more-info opened from the card) leave it zoomed in.
    this._onUnzoom = (ev) => {
      if (this._zoomed && isOutside(this, ev)) this._setZoom(false);
    };
  }

  static getConfigElement() {
    return document.createElement("mower-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._onUnzoom, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._onUnzoom, true);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    // rows: "auto": the compact and the full view each take the height they need in a Sections view.
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
    // getCardSize()/getGridOptions() changed: tell the view to re-measure the card (masonry listens to
    // iron-resize; harmless elsewhere).
    this.dispatchEvent(new CustomEvent("iron-resize", { bubbles: true, composed: true }));
  }

  // The click never reaches the header or an action (stopped in _onClick). From the keyboard (Enter / Space: no
  // click count), the focus moves to the button that replaced this one, in the same place: preventScroll, the page
  // must not jump to it when the card grows or shrinks.
  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _render() {
    if (this._zoomed) return super._render();
    const { dev, error } = findDevice(this._hass, this._config);
    if (error) return this._errorCard(error);
    this._dev = dev;
    const status = this._status(dev);
    const batt = this._battery(dev);
    const { v, cls } = this._batteryLevel(batt);
    const lines = [this._errorLine(dev), this._rainLine(dev)];
    const sub = this._subtitle(dev);
    if (sub) lines.push(`<div class="line">${svgIcon(ICONS.clock)}<span>${esc(sub)}</span></div>`);
    return `<style>${BASE_STYLE}${MINI_STYLE}${accentStyle(dev, this._hass)}</style>
      <ha-card>
        ${this._header(dev, status, "")}
        <div class="content">
          ${this._pictureBlock(dev, status)}
          <div class="info">
            ${
              batt
                ? `<div class="batt clickable ${cls}" role="button" tabindex="0" data-entity="${esc(batt.entity_id)}">${svgIcon(ICONS.battery)}<div class="bar ${cls}"><div style="width:${Math.max(
                    0,
                    Math.min(100, v ?? 0),
                  )}%"></div></div><span class="v">${v === null ? "—" : `${Math.round(v)} %`}</span>${this._charging(dev) ? svgIcon(ICONS.bolt, "bolt") : ""}</div>`
                : ""
            }
            ${lines.join("")}
          </div>
          ${this._config.show_controls !== false ? `<div class="controls">${this._controls(dev, true)}</div>` : ""}
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

class MowerEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [];
  }

  static get selects() {
    return {};
  }

  static extraFields() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    return [
      { name: "device", selector: { select: { mode: "dropdown", options: listDevices(this._hass) } } },
      { name: "title", selector: { text: {} } },
      {
        name: "image",
        selector: {
          select: {
            mode: "dropdown",
            custom_value: true,
            options: [
              { value: "auto", label: tr("image_auto") },
              { value: "none", label: tr("image_none") },
            ],
          },
        },
      },
      ...this.constructor.extraFields(tr),
      {
        type: "grid",
        name: "",
        schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })),
      },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("lang_auto") },
              { value: "en", label: "English" },
              { value: "fr", label: "Français" },
              { value: "de", label: "Deutsch" },
              { value: "es", label: "Español" },
              { value: "sr", label: "Српски" },
              { value: "sr-Latn", label: "Srpski (latinica)" },
              { value: "it", label: "Italiano" },
              { value: "nl", label: "Nederlands" },
              { value: "pt", label: "Português (Portugal)" },
              { value: "pl", label: "Polski" },
              { value: "ro", label: "Română" },
              { value: "da", label: "Dansk" },
              { value: "sv", label: "Svenska" },
              { value: "bg", label: "Български" },
              { value: "ru", label: "Русский" },
              { value: "uk", label: "Українська" },
              { value: "hu", label: "Magyar" },
              { value: "sk", label: "Slovenčina" },
              { value: "cs", label: "Čeština" },
              { value: "sl", label: "Slovenščina" },
              { value: "lv", label: "Latviešu" },
              { value: "el", label: "Ελληνικά" },
            ],
          },
        },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    const toggles = this.constructor.toggles;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => (s.name === "zoom" ? t(this._hass, this._config, "zoom_helper") : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        const defaults = { ...Object.fromEntries(toggles), image: "auto", ...this.constructor.selects };
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          if (v === "" || v === undefined || v === null || (k in defaults && JSON.stringify(v) === JSON.stringify(defaults[k]))) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { image: "auto", ...this.constructor.selects, ...this._config };
    if (data.show_map === true) data.show_map = "always";
    if (data.show_map === false) data.show_map = "never";
    for (const [name, def] of toggles) if (data[name] === undefined) data[name] = def;
    if (!data.device) data.device = MowerCard.getStubConfig(this._hass).device;
    this._form.hass = this._hass;
    // A new data or schema object re-renders the whole form: only hand over new ones when the config, the language
    // or the registries changed, not on every state change.
    const h = this._hass;
    const dataDeps = [this._config, h.entities, h.devices];
    if (!sameDeps(this._dataDeps, dataDeps)) {
      this._dataDeps = dataDeps;
      this._form.data = data;
    }
    const deps = [lang(h, this._config), h.entities, h.devices];
    if (!sameDeps(this._schemaDeps, deps)) {
      this._schemaDeps = deps;
      this._form.schema = this._schema();
    }
  }
}

class MowerCardEditor extends MowerEditorBase {
  static get toggles() {
    return [
      ["show_controls", true],
      ["show_settings", true],
      ["show_actions", true],
      ["show_options", true],
      ["show_maintenance", true],
      ["show_stats", true],
      ["show_camera", true],
    ];
  }

  static get selects() {
    return { show_map: "mowing", collapsed: DEFAULT_COLLAPSED };
  }

  static extraFields(tr) {
    return [
      {
        name: "show_map",
        selector: {
          select: {
            mode: "dropdown",
            options: ["never", "mowing", "always"].map((v) => ({ value: v, label: tr(`map_${v}`) })),
          },
        },
      },
      {
        name: "collapsed",
        selector: {
          select: {
            multiple: true,
            mode: "list",
            options: [
              ["actions", "actions"],
              ["options", "options"],
              ["maintenance", "maintenance"],
              ["stats", "statistics"],
              ["camera", "camera"],
            ].map(([value, label]) => ({ value, label: tr(label) })),
          },
        },
      },
      { name: "map_entity", selector: { entity: { domain: ["camera", "image"] } } },
      { name: "camera_entity", selector: { entity: { domain: "camera" } } },
    ];
  }
}

class MowerMiniCardEditor extends MowerEditorBase {
  static get toggles() {
    return [
      ["show_controls", true],
      ["zoom", true],
    ];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("mower-card", MowerCard);
define("mower-mini-card", MowerMiniCard);
define("mower-card-editor", MowerCardEditor);
define("mower-mini-card-editor", MowerMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "mower-card",
    name: "Mower Card",
    description: "Monitor and control a robot lawn mower (Husqvarna Automower, Ecovacs GOAT, Worx Landroid, Mammotion, ZCS, Bosch Indego, Gardena…): status, battery, schedule, actions, maintenance, statistics, camera and map.",
  },
  {
    type: "mower-mini-card",
    name: "Mower Mini Card",
    description: "Compact robot lawn mower overview: status, battery, next start and quick controls.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-mower-card" });
}

console.info(
  `%c MOWER-CARD %c v${VERSION} `,
  "color: white; background: #2e7d32; font-weight: 700;",
  "color: #2e7d32; background: white; font-weight: 700;",
);
