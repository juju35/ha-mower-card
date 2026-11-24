// ---------------------------------------------------------------------------
// Brands and integrations
// ---------------------------------------------------------------------------
// The integration a device comes from gives the logo of the header, the colors of the picture and the accent color
// of the buttons: [light theme, dark theme]. The light-theme shades are darker so that the tinted buttons keep a
// contrast of about 3.5:1 on a white card; the dark-theme ones are lighter.
import { IMG_LOGO_DREAME, IMG_LOGO_ECOVACS, IMG_LOGO_GARDENA, IMG_LOGO_HUSQVARNA, IMG_LOGO_INDEGO, IMG_LOGO_LANDROID, IMG_LOGO_MAMMOTION, IMG_LOGO_ZCS } from "./core.js";

export const BRANDS = {
  husqvarna: { logo: IMG_LOGO_HUSQVARNA, name: "Husqvarna", site: "https://www.husqvarna.com", accent: ["#273a60", "#9db4e6"] },
  landroid: { logo: IMG_LOGO_LANDROID, name: "Worx Landroid", site: "https://www.worx.com", accent: ["#b85f00", "#f39c2b"] },
  ecovacs: { logo: IMG_LOGO_ECOVACS, name: "Ecovacs", site: "https://www.ecovacs.com", accent: ["#0b6bc4", "#3d9be9"] },
  mammotion: { logo: IMG_LOGO_MAMMOTION, name: "Mammotion", site: "https://mammotion.com", accent: ["#1f7a3a", "#45c46a"] },
  zcs: { logo: IMG_LOGO_ZCS, name: "ZCS", site: "https://www.zcsrobotics.com", accent: ["#0b63aa", "#4aa3ea"] },
  indego: { logo: IMG_LOGO_INDEGO, name: "Bosch Indego", site: "https://www.bosch-garden.com", accent: ["#a01622", "#ff7b85"] },
  gardena: { logo: IMG_LOGO_GARDENA, name: "Gardena", site: "https://www.gardena.com", accent: ["#b8411a", "#ff8a5c"] },
  dreame: { logo: IMG_LOGO_DREAME, name: "Dreame", site: "https://www.dreametech.com", accent: ["#4a5560", "#aab6c2"] },
  generic: { logo: null, name: "", site: "", accent: ["#2e7d32", "#66bb6a"] },
};
// Integrations the cards know → their brand. Any other integration with a lawn_mower entity gets the generic brand.
export const PLATFORMS = {
  husqvarna_automower: "husqvarna",
  landroid_cloud: "landroid",
  ecovacs: "ecovacs",
  mammotion: "mammotion",
  zcsmower: "zcs",
  indego: "indego",
  gardena_smart_system: "gardena",
  dreame_mower: "dreame",
};
export const brandOf = (dev) => PLATFORMS[dev.platform] || "generic";
export const brandFor = (dev) => BRANDS[brandOf(dev)];
// Accent of the device's brand for the current theme, overriding the default green of the shared styles.
// The day / night shades are kept apart for the illustrated header, which can be forced to night with a light theme (illustration_theme).
export const accentStyle = (dev, hass) => {
  const a = brandFor(dev).accent;
  return `:host { --mc-accent: ${a[hass?.themes?.darkMode ? 1 : 0]}; --mc-accent-day: ${a[0]}; --mc-accent-night: ${a[1]}; }`;
};

// Entities are keyed by their translation_key, mapped per integration to the names the cards read (the Husqvarna
// Automower ones where they match). Integrations without translation keys (Bosch Indego, Gardena) are keyed by the
// end of their entity ids instead (ID_KEYS). Left out: the keys the cards never read.
export const AUTOMOWER_KEYS = {
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
export const LANDROID_KEYS = {
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
export const ECOVACS_KEYS = {
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
export const MAMMOTION_KEYS = {
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
export const ZCS_KEYS = { state: "status", border_cut: "edge_cut", standby: "standby" };
// Dreame (dreame_mower of the Marketplace): its progress, task, consumables (health in %) and schedule.
export const DREAME_KEYS = {
  mowing_progress: "progress",
  current_task: "mode",
  consumable_blade_health: "blade_life",
  consumable_brush_health: "brush_life",
  wifi_signal: "wifi",
};
// Bosch Indego and Gardena: the end of the entity id (after the serial) names the entity.
export const ID_KEYS = {
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
export const KEY_MAPS = { husqvarna_automower: AUTOMOWER_KEYS, landroid_cloud: LANDROID_KEYS, ecovacs: ECOVACS_KEYS, mammotion: MAMMOTION_KEYS, zcsmower: ZCS_KEYS, dreame_mower: DREAME_KEYS, gardena_smart_system: { mower_error: "error" } };
export const PENDING_MS = 45000;
export const DEFAULT_COLLAPSED = ["camera", "stats"];
// lawn_mower supported_features bits.
export const FEATURE = { start: 1, pause: 2, dock: 4, stop: 8 };

export const ICONS = {
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
  // mdi:brush (the brush of the Dreame mowers)
  brush:
    "M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21A4,4 0 0,0 10,17A3,3 0 0,0 7,14Z",
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
