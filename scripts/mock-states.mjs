// Mock Home Assistant registries and states shaped like the integrations the cards read: Husqvarna Automower (an
// Automower 430X NERA), Landroid Cloud (a Worx Landroid Vision), Ecovacs (a GOAT G1 with its map), Mammotion (a Luba 2)
// and Bosch Indego (an Indego S+ 500, entities keyed by their ids), used to render screenshots and run the tests.
// Entity ids are in French on purpose (the cards never rely on them); the names shown are in English.
export const states = {};
export const entities = {};
export const devices = {};

const device = (id, name, model, manufacturer) => (devices[id] = { id, name, model, manufacturer, identifiers: [[id, id]], name_by_user: null });
const entity = (entity_id, device_id, translation_key, state, attributes = {}, platform = "husqvarna_automower", entity_category = null) => {
  entities[entity_id] = { entity_id, device_id, platform, translation_key: translation_key || null, entity_category };
  states[entity_id] = { entity_id, state: String(state), attributes };
};
const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();
const hoursAhead = (h) => new Date(Date.now() + h * 3600e3).toISOString();

// Garden map standing in for the Ecovacs GOAT map image.
const MAP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">
  <rect width="400" height="220" fill="#1f2a1f" rx="12"/>
  <path d="M30 40 Q60 20 140 24 L360 30 Q380 60 372 110 L350 190 Q300 205 200 196 L60 190 Q24 150 30 40Z" fill="#4f8f3a" stroke="#2f5a24" stroke-width="3"/>
  <rect x="150" y="80" width="90" height="60" rx="6" fill="#8a96a8" stroke="#2f3a44" stroke-width="3"/>
  <circle cx="300" cy="150" r="22" fill="#3f6fd6" stroke="#1f3a7a" stroke-width="3"/>
  <path d="M50 60h80M50 76h80M50 92h80M50 108h80M50 124h60" stroke="#ffffff" stroke-opacity=".3" stroke-width="6" fill="none"/>
  <rect x="34" y="150" width="18" height="12" rx="2" fill="#f1f2f0"/>
  <circle cx="110" cy="130" r="7" fill="#fff" stroke="#3d9be9" stroke-width="3"/>
</svg>`;

// Husqvarna Automower 430X NERA: docked and charging, scheduled to start again this afternoon.
device("automower", "Automower 430X NERA", "430X NERA", "Husqvarna");
entity("lawn_mower.tondeuse", "automower", null, "docked", { supported_features: 7, friendly_name: "Automower 430X NERA" });
entity("sensor.tondeuse_batterie", "automower", null, "78", { device_class: "battery", unit_of_measurement: "%" });
entity("binary_sensor.tondeuse_charge", "automower", null, "on", { device_class: "battery_charging" });
entity("binary_sensor.tondeuse_sortie", "automower", "leaving_dock", "off");
entity("sensor.tondeuse_mode", "automower", "mode", "main_area", { device_class: "enum", options: ["main_area", "secondary_area", "home", "demo", "poi"] });
entity("sensor.tondeuse_zone", "automower", "work_area", "Front garden", { device_class: "enum" });
entity("sensor.tondeuse_erreur", "automower", "error", "no_error", { device_class: "enum" });
entity("sensor.tondeuse_restriction", "automower", "restricted_reason", "week_schedule", { device_class: "enum" });
entity("sensor.tondeuse_prochain_depart", "automower", "next_start_timestamp", hoursAhead(3.4), { device_class: "timestamp" });
entity("sensor.tondeuse_progression", "automower", "work_area_progress", "0", { unit_of_measurement: "%" });
entity("sensor.tondeuse_lames", "automower", "cutting_blade_usage_time", "151200", { unit_of_measurement: "s", device_class: "duration" });
entity("sensor.tondeuse_temps_tonte", "automower", "total_cutting_time", "2667600", { unit_of_measurement: "s", device_class: "duration" });
entity("sensor.tondeuse_temps_fonctionnement", "automower", "total_running_time", "3225600", { unit_of_measurement: "s", device_class: "duration" });
entity("sensor.tondeuse_temps_charge", "automower", "total_charging_time", "1998000", { unit_of_measurement: "s", device_class: "duration" });
entity("sensor.tondeuse_temps_recherche", "automower", "total_searching_time", "558000", { unit_of_measurement: "s", device_class: "duration" });
entity("sensor.tondeuse_distance", "automower", "total_drive_distance", "412730", { unit_of_measurement: "m", device_class: "distance" });
entity("sensor.tondeuse_cycles", "automower", "number_of_charging_cycles", "1312");
entity("sensor.tondeuse_collisions", "automower", "number_of_collisions", "11842");
entity("number.tondeuse_hauteur", "automower", "cutting_height", "5", { min: 1, max: 9, step: 1 }, "husqvarna_automower", "config");
entity("select.tondeuse_phares", "automower", "headlight_mode", "evening_and_night", { options: ["always_on", "always_off", "evening_only", "evening_and_night"] }, "husqvarna_automower", "config");
entity("switch.tondeuse_programmation", "automower", "enable_schedule", "on", { friendly_name: "Automower 430X NERA Enable schedule" });
entity("switch.tondeuse_eviter_potager", "automower", "stay_out_zones", "on", { friendly_name: "Automower 430X NERA Avoid Vegetable patch" });
entity("switch.tondeuse_eviter_bac_a_sable", "automower", "stay_out_zones", "off", { friendly_name: "Automower 430X NERA Avoid Sandpit" });
entity("button.tondeuse_confirmer_erreur", "automower", "confirm_error", "unknown", { friendly_name: "Automower 430X NERA Confirm error" });
entity("button.tondeuse_horloge", "automower", "sync_clock", "unknown", { friendly_name: "Automower 430X NERA Sync clock" }, "husqvarna_automower", "diagnostic");
entity("button.tondeuse_reinitialiser_lames", "automower", "reset_cutting_blade_usage_time", "unknown", { friendly_name: "Automower 430X NERA Reset cutting blade usage time" }, "husqvarna_automower", "config");
entity("device_tracker.tondeuse", "automower", null, "home", { latitude: 48.1, longitude: -1.68 });

// Worx Landroid Vision M600 (Landroid Cloud): mowing the back lawn, its rain sensor dry.
device("landroid", "Landroid Vision", "WR206E", "Worx");
entity("lawn_mower.landroid", "landroid", "mower", "mowing", { supported_features: 7, friendly_name: "Landroid Vision" }, "landroid_cloud");
entity("sensor.landroid_batterie", "landroid", "battery", "64", { device_class: "battery", unit_of_measurement: "%" }, "landroid_cloud");
entity("binary_sensor.landroid_charge", "landroid", "charging", "off", { device_class: "battery_charging" }, "landroid_cloud");
entity("binary_sensor.landroid_pluie", "landroid", "rain_sensor", "off", { device_class: "moisture" }, "landroid_cloud");
entity("sensor.landroid_erreur", "landroid", "error", "no_error", { device_class: "enum" }, "landroid_cloud");
entity("sensor.landroid_progression", "landroid", "daily_progress", "37", { unit_of_measurement: "%" }, "landroid_cloud");
entity("sensor.landroid_prochaine_tonte", "landroid", "next_schedule", hoursAhead(19), { device_class: "timestamp" }, "landroid_cloud");
entity("sensor.landroid_report_pluie", "landroid", "rain_delay_remaining", "0", { unit_of_measurement: "min", device_class: "duration" }, "landroid_cloud");
entity("sensor.landroid_lames", "landroid", "blade_runtime_total", "4320", { unit_of_measurement: "min", device_class: "duration" }, "landroid_cloud");
entity("sensor.landroid_distance", "landroid", "distance_driven_total", "1860.4", { unit_of_measurement: "km", device_class: "distance" }, "landroid_cloud");
entity("sensor.landroid_temps", "landroid", "mower_runtime_total", "61200", { unit_of_measurement: "min", device_class: "duration" }, "landroid_cloud");
entity("sensor.landroid_cycles", "landroid", "battery_charge_cycles_total", "542", {}, "landroid_cloud");
entity("number.landroid_hauteur", "landroid", "cutting_height", "45", { unit_of_measurement: "mm", min: 30, max: 60 }, "landroid_cloud", "config");
entity("select.landroid_zone", "landroid", "zone", "Back lawn", { options: ["Back lawn", "Front lawn", "Side strip"] }, "landroid_cloud", "config");
entity("switch.landroid_programmation", "landroid", "auto_schedule", "on", { friendly_name: "Landroid Vision Auto schedule" }, "landroid_cloud", "config");
entity("switch.landroid_fete", "landroid", "party_mode", "off", { friendly_name: "Landroid Vision Party mode" }, "landroid_cloud", "config");
entity("switch.landroid_verrou", "landroid", "lock", "off", { friendly_name: "Landroid Vision Lock" }, "landroid_cloud", "config");
entity("button.landroid_bordures", "landroid", "edge_cut", "unknown", { friendly_name: "Landroid Vision Edge cut" }, "landroid_cloud");
entity("button.landroid_reinitialiser_lames", "landroid", "reset_blade_time", "unknown", { friendly_name: "Landroid Vision Reset blade time" }, "landroid_cloud", "config");
entity("button.landroid_reinitialiser_cycles", "landroid", "reset_battery_cycles", "unknown", { friendly_name: "Landroid Vision Reset battery cycles" }, "landroid_cloud", "config");

// Ecovacs GOAT G1: docked, with its garden map and blade life.
device("goat", "GOAT G1", "GOAT G1", "Ecovacs");
entity("lawn_mower.goat", "goat", "mower", "docked", { supported_features: 15, friendly_name: "GOAT G1" }, "ecovacs");
entity("sensor.goat_batterie", "goat", null, "100", { device_class: "battery", unit_of_measurement: "%" }, "ecovacs");
entity("sensor.goat_erreur", "goat", "error", "0", { description: "NoError: Robot is operational" }, "ecovacs");
entity("sensor.goat_surface", "goat", "stats_area_mower", "312", { unit_of_measurement: "m²" }, "ecovacs");
entity("sensor.goat_duree", "goat", "stats_time_mower", "142", { unit_of_measurement: "min", device_class: "duration" }, "ecovacs");
entity("sensor.goat_surface_totale", "goat", "total_stats_area_mower", "18420", { unit_of_measurement: "m²" }, "ecovacs");
entity("sensor.goat_duree_totale", "goat", "total_stats_time_mower", "9420", { unit_of_measurement: "min", device_class: "duration" }, "ecovacs");
entity("sensor.goat_tontes", "goat", "total_stats_cleanings_mower", "64", {}, "ecovacs");
entity("sensor.goat_lames", "goat", "lifespan_blade", "42", { unit_of_measurement: "%" }, "ecovacs");
entity("button.goat_reinitialiser_lames", "goat", "reset_lifespan_blade", "unknown", { friendly_name: "GOAT G1 Reset blade lifespan" }, "ecovacs", "config");
entity("button.goat_relocaliser", "goat", "relocate", "unknown", { friendly_name: "GOAT G1 Relocate" }, "ecovacs", "config");
entity("select.goat_mode", "goat", "work_mode", "auto", { options: ["auto", "edge", "spot"] }, "ecovacs", "config");
entity("number.goat_direction", "goat", "cut_direction", "45", { unit_of_measurement: "°" }, "ecovacs", "config");
entity("switch.goat_bordure", "goat", "border_switch", "on", { friendly_name: "GOAT G1 Border cutting" }, "ecovacs", "config");
entity("image.goat_carte", "goat", "map", hoursAgo(0.5), { friendly_name: "GOAT G1 Map", entity_picture: `data:image/svg+xml;base64,${Buffer.from(MAP).toString("base64")}` }, "ecovacs");

// Mammotion Luba 2 AWD 3000: mowing the orchard, 41 minutes to go.
device("luba", "Luba 2 AWD", "Luba 2 AWD 3000", "Mammotion");
entity("lawn_mower.luba", "luba", null, "mowing", { supported_features: 15, friendly_name: "Luba 2 AWD" }, "mammotion");
entity("sensor.luba_batterie", "luba", "battery_percent", "57", { device_class: "battery", unit_of_measurement: "%" }, "mammotion");
entity("binary_sensor.luba_charge", "luba", "charging", "off", { device_class: "battery_charging" }, "mammotion");
entity("binary_sensor.luba_pluie", "luba", "rain_detected", "off", { device_class: "moisture" }, "mammotion");
entity("sensor.luba_mode", "luba", "activity_mode", "mowing", { device_class: "enum" }, "mammotion");
entity("sensor.luba_zone", "luba", "work_area", "Orchard", { device_class: "enum" }, "mammotion");
entity("sensor.luba_surface", "luba", "area", "1240", { unit_of_measurement: "m²" }, "mammotion");
entity("sensor.luba_progression", "luba", "progress", "62", { unit_of_measurement: "%" }, "mammotion");
entity("sensor.luba_temps_restant", "luba", "left_time", "41", { unit_of_measurement: "min", device_class: "duration" }, "mammotion");
entity("sensor.luba_temps_ecoule", "luba", "elapsed_time", "67", { unit_of_measurement: "min", device_class: "duration" }, "mammotion");
entity("sensor.luba_lames", "luba", "blade_used_time", "97200", { unit_of_measurement: "s", device_class: "duration" }, "mammotion");
entity("sensor.luba_hauteur", "luba", "blade_height", "60", { unit_of_measurement: "mm" }, "mammotion");
entity("sensor.luba_erreur", "luba", "error_1_message", "", {}, "mammotion");
entity("sensor.luba_distance", "luba", "maintenance_distance", "98400", { unit_of_measurement: "m", device_class: "distance" }, "mammotion");
entity("sensor.luba_temps_travail", "luba", "maintenance_work_time", "612000", { unit_of_measurement: "s", device_class: "duration" }, "mammotion");
entity("sensor.luba_cycles", "luba", "maintenance_bat_cycles", "188", {}, "mammotion");
entity("switch.luba_eclairage", "luba", "night_light", "off", { friendly_name: "Luba 2 AWD Night light" }, "mammotion");
entity("switch.luba_detection_pluie", "luba", "rain_detection", "on", { friendly_name: "Luba 2 AWD Rain detection" }, "mammotion", "config");
entity("button.luba_reprendre", "luba", "continue_last_job", "unknown", { friendly_name: "Luba 2 AWD Continue last job" }, "mammotion");
entity("button.luba_annuler", "luba", "cancel_task", "unknown", { friendly_name: "Luba 2 AWD Cancel task" }, "mammotion");
entity("button.luba_redemarrer", "luba", "restart_mower", "unknown", { friendly_name: "Luba 2 AWD Restart mower" }, "mammotion", "diagnostic");

// Bosch Indego S+ 500 (entities named by their ids, no translation keys): docked, lawn 85 % mowed.
device("indego", "Indego S+ 500", "Indego S+ 500", "Bosch");
entity("lawn_mower.indego_1234", "indego", null, "docked", { supported_features: 7, friendly_name: "Indego S+ 500" }, "indego");
entity("sensor.indego_1234_battery_percentage", "indego", null, "92", { device_class: "battery", unit_of_measurement: "%" }, "indego");
entity("binary_sensor.indego_1234_battery_charging", "indego", null, "on", { device_class: "battery_charging" }, "indego");
entity("sensor.indego_1234_lawn_mowed", "indego", null, "85", { unit_of_measurement: "%" }, "indego");
entity("sensor.indego_1234_lawn_mowed_size", "indego", null, "230", { unit_of_measurement: "m²", device_class: "area" }, "indego");
entity("sensor.indego_1234_last_completed", "indego", null, hoursAgo(30), { device_class: "timestamp" }, "indego");
entity("sensor.indego_1234_next_mow", "indego", null, hoursAhead(14), { device_class: "timestamp" }, "indego");
entity("sensor.indego_1234_mowing_mode", "indego", null, "smart", {}, "indego");
entity("sensor.indego_1234_runtime_total", "indego", null, "1823", { unit_of_measurement: "h", device_class: "duration" }, "indego");
entity("sensor.indego_1234_garden_size", "indego", null, "260", { unit_of_measurement: "m²", device_class: "area" }, "indego");
entity("binary_sensor.indego_1234_mower_stuck", "indego", null, "off", { device_class: "problem" }, "indego");
entity("binary_sensor.indego_1234_alert", "indego", null, "off", { device_class: "problem" }, "indego");
entity("sensor.indego_1234_last_error_code", "indego", null, "none", {}, "indego");
entity("sensor.indego_1234_session_count", "indego", null, "412", {}, "indego", "diagnostic");
entity("sensor.indego_1234_battery_cycles", "indego", null, "273", {}, "indego", "diagnostic");
entity("switch.indego_1234_smartmowing", "indego", null, "on", { friendly_name: "Indego S+ 500 SmartMowing" }, "indego", "config");

// Overrides for the animated states (GIFs) and the tests: patched into the states for one capture only.
export const mowing = {
  "lawn_mower.tondeuse": { state: "mowing" },
  "binary_sensor.tondeuse_charge": { state: "off" },
  "sensor.tondeuse_progression": { state: "48" },
  "sensor.tondeuse_restriction": { state: "none" },
};
export const returning = {
  "lawn_mower.tondeuse": { state: "returning" },
  "binary_sensor.tondeuse_charge": { state: "off" },
  "sensor.tondeuse_restriction": { state: "none" },
};
export const charging = { "lawn_mower.tondeuse": { state: "docked" }, "binary_sensor.tondeuse_charge": { state: "on" } };
export const error = {
  "lawn_mower.tondeuse": { state: "error" },
  "binary_sensor.tondeuse_charge": { state: "off" },
  "sensor.tondeuse_erreur": { state: "wheel_motor_blocked_rear_right" },
  "sensor.tondeuse_restriction": { state: "none" },
};
export const rainDelay = {
  "lawn_mower.landroid": { state: "rain_delayed" },
  "binary_sensor.landroid_pluie": { state: "on" },
  "sensor.landroid_report_pluie": { state: "95" },
  "sensor.landroid_progression": { state: "12" },
};
export const lubaDocked = {
  "lawn_mower.luba": { state: "docked" },
  "binary_sensor.luba_charge": { state: "on" },
  "sensor.luba_mode": { state: "charging" },
  "sensor.luba_progression": { state: "100" },
  "sensor.luba_temps_restant": { state: "0" },
};
