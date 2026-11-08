import assert from "node:assert/strict";
import { test } from "node:test";
import { devices, entities, error as errorState, mowing, rainDelay, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const mc = load();
// Values built inside the card's sandbox have another realm's prototypes: compared as plain data.
const plain = (v) => JSON.parse(JSON.stringify(v));

const makeHass = (st = states) => {
  const calls = [];
  return { calls, entities, devices, states: st, language: "en", callService: (...a) => calls.push(a) };
};

const withOverrides = (overrides) => {
  const st = { ...states };
  for (const [id, o] of Object.entries(overrides)) st[id] = { ...st[id], ...o };
  return st;
};

const newCard = (hass, config = {}, Card = mc.MowerCard) => {
  const card = new Card();
  card.setConfig({ device: "automower", collapsed: [], ...config });
  card.hass = hass;
  return card;
};

// A click on an element of the card, as composedPath() would report it.
const click = (card, dataset, extra = []) => {
  const el = { dataset };
  card._onClick({ composedPath: () => [el, ...extra], stopPropagation() {} });
  return el;
};

test("every device with a lawn_mower entity is listed, whatever its integration, and nothing else", () => {
  const { devices: list } = mc.resolve(makeHass());
  assert.deepEqual(
    plain(list.map((d) => [d.name, d.platform, d.mower])),
    [
      ["Automower 430X NERA", "husqvarna_automower", "lawn_mower.tondeuse"],
      ["GOAT G1", "ecovacs", "lawn_mower.goat"],
      ["Indego S+ 500", "indego", "lawn_mower.indego_1234"],
      ["Landroid Vision", "landroid_cloud", "lawn_mower.landroid"],
      ["Luba 2 AWD", "mammotion", "lawn_mower.luba"],
    ],
  );
});

test("entities are keyed by their translation key, mapped per integration, or by the end of their id", () => {
  const { devices: list } = mc.resolve(makeHass());
  const by = Object.fromEntries(list.map((d) => [d.platform, d.entities]));
  assert.equal(by.husqvarna_automower.blade_time, "sensor.tondeuse_lames");
  assert.equal(by.husqvarna_automower.next_start, "sensor.tondeuse_prochain_depart");
  assert.equal(by.husqvarna_automower.schedule, "switch.tondeuse_programmation");
  assert.equal(by.landroid_cloud.progress, "sensor.landroid_progression");
  assert.equal(by.landroid_cloud.reset_blade, "button.landroid_reinitialiser_lames");
  assert.equal(by.ecovacs.blade_life, "sensor.goat_lames");
  assert.equal(by.ecovacs.sessions, "sensor.goat_tontes");
  assert.equal(by.mammotion.remaining_time, "sensor.luba_temps_restant");
  assert.equal(by.indego.progress, "sensor.indego_1234_lawn_mowed");
  assert.equal(by.indego.schedule, "switch.indego_1234_smartmowing");
  assert.equal(by.indego.last_completed, "sensor.indego_1234_last_completed");
});

test("the brand follows the integration, unknown ones get the generic brand", () => {
  assert.equal(mc.brandOf({ platform: "husqvarna_automower" }), "husqvarna");
  assert.equal(mc.brandOf({ platform: "landroid_cloud" }), "landroid");
  assert.equal(mc.brandOf({ platform: "some_other_mower" }), "generic");
  for (const b of Object.values(mc.BRANDS)) assert.equal(b.accent.length, 2);
  for (const p of Object.keys(mc.PLATFORMS)) assert.ok(mc.BRANDS[mc.PLATFORMS[p]], p);
});

test("the full card renders the header, the battery, the controls and the sections", () => {
  const card = newCard(makeHass());
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /class="name">Automower 430X NERA</);
  assert.match(html, /Next start in 3 hours/);
  assert.match(html, /chip clickable ok"[^>]*title="Docked"/);
  assert.match(html, />78<small>%<\/small>/);
  assert.match(html, /class="icon bolt"/, "charging bolt");
  assert.match(html, /data-action="start_mowing"/);
  assert.match(html, /data-action="dock"/);
  assert.doesNotMatch(html, /data-action="stop"/, "no stop button without the STOP feature");
  assert.match(html, /Week schedule/, "restricted reason while docked");
  for (const section of ["actions", "options", "maintenance", "stats"]) assert.match(html, new RegExp(`data-section="${section}"`));
  assert.match(html, /Confirm error/);
  assert.doesNotMatch(html, /Sync clock/, "diagnostic buttons are left out of the actions");
  assert.doesNotMatch(html, /Reset cutting blade/, "reset buttons sit next to their counter");
  assert.match(html, /data-action="reset" data-entity="button.tondeuse_reinitialiser_lames"/);
  assert.match(html, /42 hr used/);
  assert.match(html, /Mowing time/);
  assert.match(html, /412\.7 km/);
});

test("the controls follow the supported features and the activity", () => {
  const goat = newCard(makeHass(), { device: "GOAT G1" });
  assert.match(goat.shadowRoot.innerHTML, /data-action="stop"/, "STOP feature");
  const luba = newCard(makeHass(), { device: "Luba 2 AWD" });
  const html = luba.shadowRoot.innerHTML;
  assert.match(html, /data-action="pause"/, "pause while mowing");
  assert.doesNotMatch(html, /data-action="start_mowing"/);
  assert.match(html, /Progress 62 % · 41 min left · 1,240 m²/);
  assert.match(html, /chip clickable active"/);
});

test("the commands go to the lawn_mower services, none while the mower is unavailable", () => {
  const hass = makeHass();
  const card = newCard(hass);
  click(card, { action: "start_mowing", entity: "lawn_mower.tondeuse" });
  click(card, { action: "dock", entity: "lawn_mower.tondeuse" });
  assert.deepEqual(plain(hass.calls), [
    ["lawn_mower", "start_mowing", { entity_id: "lawn_mower.tondeuse" }],
    ["lawn_mower", "dock", { entity_id: "lawn_mower.tondeuse" }],
  ]);
  const off = makeHass(withOverrides({ "lawn_mower.tondeuse": { state: "unavailable" } }));
  const offCard = newCard(off);
  assert.match(offCard.shadowRoot.innerHTML, /data-action="start_mowing"[^>]* disabled/);
  click(offCard, { action: "start_mowing", entity: "lawn_mower.tondeuse" });
  assert.equal(off.calls.length, 0);
});

test("an action asks for confirmation in the card, Cancel does nothing, OK presses the button once", () => {
  const hass = makeHass();
  const card = newCard(hass);
  click(card, { action: "button", entity: "button.tondeuse_confirmer_erreur", label: "Confirm error" });
  assert.equal(hass.calls.length, 0);
  assert.match(card.shadowRoot.innerHTML, /class="dialog-open"/);
  assert.match(card.shadowRoot.innerHTML, /Run Confirm error\?/);
  click(card, { action: "confirm_cancel" });
  assert.equal(hass.calls.length, 0);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /dialog-open/);
  card._confirmClosedAt = 0;
  click(card, { action: "reset", entity: "button.tondeuse_reinitialiser_lames", label: "Blades" });
  // Clicks elsewhere in the card do nothing while the popup is open.
  click(card, { action: "dock", entity: "lawn_mower.tondeuse" });
  assert.equal(hass.calls.length, 0);
  click(card, { action: "confirm_ok" });
  assert.deepEqual(plain(hass.calls), [["button", "press", { entity_id: "button.tondeuse_reinitialiser_lames" }]]);
});

test("a switch toggles with a pending state until the entity reports it", async () => {
  const hass = makeHass();
  const card = newCard(hass);
  const id = "switch.tondeuse_eviter_bac_a_sable";
  click(card, { action: "switch", entity: id });
  assert.deepEqual(plain(hass.calls), [["switch", "turn_on", { entity_id: id }]]);
  assert.equal(card._isOn(id), true, "requested state shown meanwhile");
  assert.match(card.shadowRoot.innerHTML, new RegExp(`toggle-btn on"[^>]*data-entity="${id}"`));
  // A failed call drops the pending state.
  const failing = { ...makeHass(), callService: () => Promise.reject(new Error("read-only")) };
  const card2 = newCard(failing);
  click(card2, { action: "switch", entity: id });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(card2._isOn(id), false);
  card.disconnectedCallback();
  card2.disconnectedCallback();
});

test("an unrelated state change does not rebuild the card", () => {
  const hass = makeHass();
  const card = newCard(hass);
  let renders = 0;
  const render = card._render.bind(card);
  card._render = () => {
    renders++;
    return render();
  };
  card.hass = { ...hass, states: { ...states, "light.elsewhere": { entity_id: "light.elsewhere", state: "on", attributes: {} } } };
  assert.equal(renders, 0);
  const batt = "sensor.tondeuse_batterie";
  card.hass = { ...hass, states: { ...states, [batt]: { ...states[batt], state: "99" } } };
  assert.equal(renders, 1);
  assert.match(card.shadowRoot.innerHTML, />99<small>/);
});

test("the error of the mower is shown from its error sensor, and the rain delay from its sensor", () => {
  const err = newCard(makeHass(withOverrides(errorState)));
  const html = err.shadowRoot.innerHTML;
  assert.match(html, /chip clickable crit"[^>]*title="Error"/);
  assert.match(html, /alert-line crit[^>]*data-entity="sensor.tondeuse_erreur"[^>]*>.*Wheel motor blocked rear right/);
  const rain = newCard(makeHass(withOverrides(rainDelay)), { device: "Landroid Vision" });
  const rh = rain.shadowRoot.innerHTML;
  assert.match(rh, /title="Rain delay"/);
  assert.match(rh, /Rain delay · 1 hr 35 min/);
  // No error line while the error sensor says "no_error" / "0".
  assert.doesNotMatch(newCard(makeHass()).shadowRoot.innerHTML, /class="alert-line/);
  assert.doesNotMatch(newCard(makeHass(), { device: "GOAT G1" }).shadowRoot.innerHTML, /class="alert-line/);
});

test("the picture follows the activity", () => {
  assert.equal(mc.activityOf("mowing", false, false), "mowing");
  assert.equal(mc.activityOf("edgecut", false, false), "mowing");
  assert.equal(mc.activityOf("returning", false, false), "returning");
  assert.equal(mc.activityOf("docked", true, false), "charging");
  assert.equal(mc.activityOf("docked", false, false), "docked");
  assert.equal(mc.activityOf("error", false, false), "error");
  assert.equal(mc.activityOf("rain_delayed", false, false), "rain");
  assert.equal(mc.activityOf("paused", false, true), "rain");
  assert.equal(mc.activityOf("paused", false, false), null);
  assert.match(mc.mowerSvg("husqvarna", "mowing"), /class="sway"/);
  assert.match(mc.mowerSvg("husqvarna", "mowing"), /class="spin"/);
  assert.match(mc.mowerSvg("landroid", "returning"), /class="home"/);
  assert.match(mc.mowerSvg("ecovacs", "charging"), /class="pulse"/);
  assert.match(mc.mowerSvg("generic", "error"), /class="blink"/);
  assert.match(mc.mowerSvg("generic", "rain"), /class="drop/);
  assert.doesNotMatch(mc.mowerSvg("generic", null), /<style>/, "no animation at rest");
  // The card shows its own picture, none with image: none, the given URL otherwise.
  const card = newCard(makeHass(withOverrides(mowing)));
  assert.match(card.shadowRoot.innerHTML, /<img data-img="\d+" alt="">/);
  assert.doesNotMatch(newCard(makeHass(), { image: "none" }).shadowRoot.innerHTML, /class="picture/);
  assert.match(newCard(makeHass(), { image: "/local/mower.png" }).shadowRoot.innerHTML, /<img src="\/local\/mower.png"/);
});

test("the mini card shows the compact view, its detail button switches to the full card and back", () => {
  const card = newCard(makeHass(), {}, mc.MowerMiniCard);
  let html = card.shadowRoot.innerHTML;
  assert.match(html, /class="zoom" data-action="zoom"/);
  assert.match(html, /btn round primary/);
  assert.doesNotMatch(html, /data-section="stats"/);
  assert.deepEqual(plain(card.getGridOptions()), { columns: 6, min_columns: 6, rows: "auto" });
  card._toggleZoom({ detail: 1 });
  html = card.shadowRoot.innerHTML;
  assert.match(html, /data-section="stats"/);
  assert.deepEqual(plain(card.getGridOptions()), { columns: 12, min_columns: 9, rows: "auto" });
  card.connectedCallback();
  card._onUnzoom({ composedPath: () => [{ tagName: "DIV" }] });
  assert.doesNotMatch(card.shadowRoot.innerHTML, /data-section="stats"/);
  card.disconnectedCallback();
  assert.doesNotMatch(newCard(makeHass(), { zoom: false }, mc.MowerMiniCard).shadowRoot.innerHTML, /data-action="zoom"/);
});

test("a click inside the more-info dialog keeps the sections unfolded", () => {
  const card = newCard(makeHass());
  card.connectedCallback();
  click(card, { action: "toggle_section", section: "stats" });
  assert.equal(card._toggled.size, 1);
  card._onOutside({ composedPath: () => [{ tagName: "DIV" }, { tagName: "HA-MORE-INFO-DIALOG" }] });
  assert.equal(card._toggled.size, 1);
  card._onOutside({ composedPath: () => [{ tagName: "DIV" }] });
  assert.equal(card._toggled.size, 0);
  card.disconnectedCallback();
});

test("the map is shown while mowing by default, always or never on request", () => {
  const goat = (config) => newCard(makeHass(), { device: "GOAT G1", ...config }).shadowRoot.innerHTML;
  assert.doesNotMatch(goat({}), /data-map=/, "docked: no map");
  assert.match(goat({ show_map: "always" }), /data-map="image.goat_carte"/);
  assert.match(goat({ show_map: true }), /data-map="image.goat_carte"/);
  assert.doesNotMatch(goat({ show_map: "never" }), /data-map=/);
});

test("error cards: no registry, no mower, unknown device", () => {
  const card = new mc.MowerCard();
  card.setConfig({});
  card.hass = { states: {}, language: "en" };
  assert.match(card.shadowRoot.innerHTML, /Home Assistant 2024\.8/);
  card.hass = { states: {}, entities: {}, devices: {}, language: "en" };
  assert.match(card.shadowRoot.innerHTML, /No robot lawn mower found/);
  card.setConfig({ device: "nope" });
  card.hass = makeHass();
  assert.match(card.shadowRoot.innerHTML, /Lawn mower not found: nope/);
});

test("the relative time formatter is built once per language", () => {
  const hass = makeHass();
  const iso = new Date(Date.now() - 2 * 3600e3).toISOString();
  mc.ago(hass, {}, iso);
  const fmt = mc.RTF.en;
  assert.ok(fmt);
  mc.ago(hass, {}, iso);
  assert.equal(mc.RTF.en, fmt);
  mc.ago(hass, { language: "fr" }, iso);
  assert.ok(mc.RTF.fr && mc.RTF.fr !== fmt);
});

test("the editor lists the mowers and keeps the YAML minimal", () => {
  const editor = new mc.MowerCardEditor();
  const events = [];
  editor.dispatchEvent = (ev) => events.push(ev);
  editor.setConfig({ device: "automower" });
  editor.hass = makeHass();
  const schema = editor._form.schema;
  assert.deepEqual(
    plain(schema[0].selector.select.options.map((o) => o.label)),
    ["Automower 430X NERA", "GOAT G1", "Indego S+ 500", "Landroid Vision", "Luba 2 AWD"],
  );
  editor._form.listeners["value-changed"]({
    stopPropagation() {},
    detail: { value: { device: "automower", title: "", image: "auto", show_controls: true, show_stats: false, show_map: "mowing", collapsed: ["camera", "stats"], language: "" } },
  });
  assert.deepEqual(plain(events.at(-1).detail.config), { device: "automower", show_stats: false });
});

test("the live cameras get their own section, folded by default, with a tab per camera; a picture-only camera is the map", () => {
  const luba = (config = {}) => newCard(makeHass(), { device: "Luba 2 AWD", ...config }).shadowRoot.innerHTML;
  let html = luba({ collapsed: ["camera"] });
  assert.match(html, /data-section="camera" aria-expanded="false"/);
  assert.doesNotMatch(html, /class="cam-view/, "no player while folded: the stream does not run");
  html = luba();
  assert.match(html, /<div class="cam-view loading" data-cam="camera.luba_gauche">/);
  assert.match(html, /data-action="camera" data-entity="camera.luba_droite"/);
  assert.match(html, /data-action="camera" data-entity="camera.luba_arriere"/);
  assert.match(html, /class="btn on" data-action="camera" data-entity="camera.luba_gauche"[^>]*><span>Left vision camera</);
  assert.doesNotMatch(html, /data-map=/, "streaming cameras are not maps");
  // Picking another camera.
  const card = newCard(makeHass(), { device: "Luba 2 AWD" });
  click(card, { action: "camera", entity: "camera.luba_arriere" });
  assert.match(card.shadowRoot.innerHTML, /data-cam="camera.luba_arriere"/);
  // camera_entity replaces the device's cameras; show_camera: false removes the section.
  assert.match(luba({ camera_entity: "camera.luba_droite" }), /data-cam="camera.luba_droite"/);
  assert.doesNotMatch(luba({ camera_entity: "camera.luba_droite" }), /class="cam-tabs"/);
  assert.doesNotMatch(luba({ show_camera: false }), /data-section="camera"/);
  // An unavailable camera says so.
  const off = withOverrides({ "camera.luba_gauche": { state: "unavailable" } });
  assert.match(newCard(makeHass(off), { device: "Luba 2 AWD" }).shadowRoot.innerHTML, /Camera unavailable/);
  // Bosch Indego: its camera renders the map, no live section.
  const indego = newCard(makeHass(), { device: "Indego S+ 500", show_map: "always" }).shadowRoot.innerHTML;
  assert.doesNotMatch(indego, /data-section="camera"/);
  assert.match(indego, /data-map="camera.indego_1234_camera"/);
});
