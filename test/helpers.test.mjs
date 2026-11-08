import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { fmtHours, fmtDistance, hours, statusClass, esc } = load();

test("durations are written with the units of the language and rounded to the minute", () => {
  assert.equal(fmtHours(0.4, "en"), "24 min");
  assert.equal(fmtHours(1.995, "en"), "2 hr");
  // Narrow no-break spaces between number and unit, as Intl writes them in French.
  assert.equal(fmtHours(2.5, "fr").replace(/[\u202f\u00a0]/g, " "), "2 h 30 min");
  assert.equal(fmtHours(741, "en"), "741 hr");
  assert.equal(fmtHours(null, "en"), "—");
  assert.equal(hours({ state: "90", attributes: { unit_of_measurement: "min" } }), 1.5);
  assert.equal(hours({ state: "7200", attributes: { unit_of_measurement: "s" } }), 2);
  assert.equal(hours({ state: "2", attributes: { unit_of_measurement: "d" } }), 48);
  assert.equal(hours({ state: "unknown", attributes: {} }), null);
});

test("distances are written in m or km", () => {
  assert.equal(fmtDistance({ state: "412730", attributes: { unit_of_measurement: "m" } }, "en"), "412.7 km");
  assert.equal(fmtDistance({ state: "850", attributes: { unit_of_measurement: "m" } }, "en"), "850 m");
  assert.equal(fmtDistance({ state: "1860.4", attributes: { unit_of_measurement: "km" } }, "en"), "1,860.4 km");
  assert.equal(fmtDistance({ state: "unknown", attributes: {} }, "en"), "—");
});

test("the status color follows the activity", () => {
  assert.equal(statusClass("mowing"), "active");
  assert.equal(statusClass("returning"), "active");
  assert.equal(statusClass("edgecut"), "active");
  assert.equal(statusClass("docked"), "ok");
  assert.equal(statusClass("paused"), "warn");
  assert.equal(statusClass("rain_delayed"), "warn");
  assert.equal(statusClass("error"), "crit");
  assert.equal(statusClass("escaped_digital_fence"), "crit");
  assert.equal(statusClass("unavailable"), "crit");
  assert.equal(statusClass("idle"), "idle");
});

test("HTML is escaped", () => {
  assert.equal(esc(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});
