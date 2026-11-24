// ---------------------------------------------------------------------------
// Registry-based resolution
// ---------------------------------------------------------------------------
import { ID_KEYS, KEY_MAPS } from "./brands-integrations.js";

export const _cache = new WeakMap();

// Key of an entity: its translation_key, mapped per integration (KEY_MAPS), else the end of its entity id for
// the integrations that have no translation keys (ID_KEYS), else "" (kept under its domain only).
export const keyOf = (e, domain) => {
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
export const resolve = (hass) => {
  if (!hass.entities || !hass.devices) return null;
  const cached = _cache.get(hass.entities);
  if (cached && cached.devices === hass.devices) return cached.model;

  const byDevice = new Map();
  for (const e of Object.values(hass.entities)) {
    if (!e.device_id || e.hidden) continue;
    const domain = e.entity_id.split(".")[0];
    const item = byDevice.get(e.device_id) || { platform: e.platform, entities: {}, extra: {}, categories: {} };
    // The brand comes from the lawn_mower entity: another integration may add its entities to the device (Battery
    // Notes, a template…) and come first.
    if (domain === "lawn_mower" && !item.mower) {
      item.mower = e.entity_id;
      item.platform = e.platform;
    }
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
export const sameDeps = (a, b) => !!a && a.length === b.length && a.every((d, i) => d === b[i]);
// A camera entity with a live stream (frontend_stream_type: hls or web_rtc), as opposed to a camera that only
// renders a picture (the Bosch Indego map).
export const isLive = (s) => !!s?.attributes?.frontend_stream_type;
// Map pictures of a device: the entity set with map_entity (which may belong to no device), else the
// integration's image entities and its cameras without a live stream (Ecovacs GOAT map, Bosch Indego camera).
export const mapIds = (dev, config, hass) =>
  config?.map_entity ? [config.map_entity] : [...(dev.extra.image || []), ...(dev.extra.camera || []).filter((id) => !isLive(hass?.states[id]))];
// Live cameras of a device (Mammotion Luba / Yuka vision cameras): the entity set with camera_entity, else the
// cameras of the device that stream.
export const cameraIds = (dev, config, hass) => (config?.camera_entity ? [config.camera_entity] : (dev.extra.camera || []).filter((id) => isLive(hass?.states[id])));

// Home Assistant's own live player (WebRTC, HLS or MJPEG, whichever the camera offers). It ships with the picture
// cards, which are loaded on demand: building one loads it. Resolves once <ha-camera-stream> is defined.
export let streamLoad = null;
export const loadStream = (entity) => {
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

export const listDevices = (hass) => {
  const m = hass && resolve(hass);
  return m ? m.devices.map((d) => ({ value: d.id, label: d.name })) : [];
};

export const findDevice = (hass, config) => {
  const m = resolve(hass);
  if (!m) return { error: "no_registry" };
  if (!m.devices.length) return { error: "no_device" };
  if (!config.device) return { dev: withEntities(m.devices[0], config.entities) };
  const dev = m.devices.find((d) => d.id === config.device || d.name === config.device);
  return dev ? { dev: withEntities(dev, config.entities) } : { error: "unknown_device" };
};

// The `entities` option: entities of the user's choice under the names the cards read (battery, progress, blade_life,
// next_start, rain…), replacing the ones found. One result per device and option, a stable object while neither
// changes.
export const isEntityId = (v) => typeof v === "string" && /^[a-z_]+\.[a-z0-9_]+$/.test(v);
export const withEntitiesCache = new WeakMap();
export const withEntities = (dev, entities) => {
  if (!dev || !entities || typeof entities !== "object") return dev;
  const own = Object.keys(entities).filter((k) => /^[a-z_]+$/.test(k) && isEntityId(entities[k]));
  if (!own.length) return dev;
  const key = own.map((k) => `${k}=${entities[k]}`).join(",");
  const hit = withEntitiesCache.get(dev);
  if (hit?.key === key) return hit.result;
  const result = { ...dev, entities: { ...dev.entities, ...Object.fromEntries(own.map((k) => [k, entities[k]])) } };
  withEntitiesCache.set(dev, { key, result });
  return result;
};
