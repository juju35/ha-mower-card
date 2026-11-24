// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { STRINGS } from "./i18n/strings.js";

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl / toLocale*: the card's language: option, else HA's full locale (keeps its region, e.g.
// pt-BR, de-CH) when its base matches the resolved card language, else that language. A bare "pt" (HA's
// code for European Portuguese) becomes "pt-PT", otherwise Intl formats it the Brazilian way.
export const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

export const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

export const num = (s) => {
  if (!s) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

export const valid = (s) => s && !["unknown", "unavailable", ""].includes(s.state);

export const pretty = (v) => {
  const s = String(v ?? "").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Duration sensor → hours, whatever its unit.
export const hours = (s) => {
  const v = num(s);
  if (v === null) return null;
  const u = s.attributes?.unit_of_measurement;
  return u === "min" ? v / 60 : u === "s" ? v / 3600 : u === "d" ? v * 24 : v;
};

// Unit of a sensor as Home Assistant sends it, `def` by default.
export const unitOf = (s, def) => {
  const u = s?.attributes?.unit_of_measurement;
  return typeof u === "string" && u.trim() ? u : def;
};

// Duration in hours, written with the units of the language ("2 h 30 min", "2 Std. 30 Min.", "2 hr 30 min").
// Rounded to the minute first, so that 1.995 h reads "2 h" (not "1 h 60") and 0.999 h "1 h" (not "60 min").
export const UNIT_FMT = {};
export const fmtUnit = (v, unit, locale) => (UNIT_FMT[`${locale}|${unit}`] ??= new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short" })).format(v);
export const fmtHours = (h, locale) => {
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

export const fmtNum = (v, digits = 0, locale) => (v === null ? "—" : Number(v).toLocaleString(locale, { maximumFractionDigits: digits }));

// Distance sensor (m or km) → "12.4 km" / "850 m".
export const fmtDistance = (s, locale) => {
  const v = num(s);
  if (v === null) return "—";
  const u = unitOf(s, "m");
  if (u === "km" || u === "mi") return `${fmtNum(v, 1, locale)} ${u}`;
  const m = u === "cm" ? v / 100 : v;
  return m >= 1000 ? `${fmtNum(m / 1000, 1, locale)} km` : `${fmtNum(m, 0, locale)} m`;
};

// One formatter per language, built on first use.
export const RTF = {};
export const ago = (hass, config, iso) => {
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
export const statusClass = (state) => {
  const s = String(state || "").toLowerCase();
  if (/error|fence|stuck|fail|unavailable/.test(s)) return "crit";
  if (/paused|rain|starting|unknown/.test(s)) return "warn";
  if (/mow|return|edgecut|zon|search|leaving/.test(s)) return "active";
  if (/docked|charg/.test(s)) return "ok";
  return "idle";
};

export const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;
