// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
import { bannerCrop, bannerMowerSvg, mowerSvg, svgUri } from "./drawn-pictures.js";
import { activityOf, gardenSvg, isNight } from "./illustrated-header.js";
import { DEFAULT_COLLAPSED, FEATURE, ICONS, PENDING_MS, accentStyle, brandFor, brandOf } from "./brands-integrations.js";
import { ago, esc, fmtDistance, fmtHours, fmtNum, hours, intlLocale, lang, num, pretty, statusClass, svgIcon, t, unitOf, valid } from "./helpers.js";
import { cameraIds, findDevice, loadStream, mapIds, resolve, sameDeps } from "./registry-based-resolution.js";
import { STRINGS } from "./i18n/strings.js";

export const BASE_STYLE = `
  :host { --mc-accent: #2e7d32; --mc-ok: var(--success-color, #43a047); --mc-warn: var(--warning-color, #ffa600);
          --mc-crit: var(--error-color, #db4437); --mc-idle: var(--disabled-text-color, #9e9e9e); --mc-active: var(--info-color, #039be5);
          /* Text in a state or brand color is mixed with the text color (darker on a light theme, lighter on a dark
             one) so that it reads at 4.5:1 at least; dots, bars and icons keep the plain color. */
          --mc-accent-text: color-mix(in srgb, var(--mc-accent) 50%, var(--primary-text-color)); }
  /* Container queries below follow the width the card is given (Sections view columns, mini card). */
  ha-card { overflow: hidden; container: mc-card / inline-size; }
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
               --ic: var(--mc-idle); background: color-mix(in srgb, var(--ic) 16%, transparent); }
  .type-icon .icon.type { width: 24px; height: 24px; fill: var(--ic); }
  /* The icon's colour tells the status (classic and illustrated header): working (mowing, returning) in the state
     colour (Home Assistant's lawn mower colour, else the brand accent), charging green, waiting (paused, rain) amber,
     error red, resting (docked, idle) grey. */
  .type-icon.active { --ic: var(--state-lawn_mower-mowing-color, var(--mc-accent)); }
  .type-icon.ok { --ic: var(--mc-ok); } .type-icon.warn { --ic: var(--mc-warn); } .type-icon.crit { --ic: var(--mc-crit); }
  .type-icon .logo { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px;
                     background: var(--card-background-color, #fff);
                     box-shadow: 0 0 0 1px var(--divider-color, rgba(0,0,0,.12)), 0 0 0 3px var(--card-background-color, #fff); }
  /* The title takes the room the chip leaves (flex-basis 0: a long name does not push the chip into its ellipsis)
     and keeps about four characters and its ellipsis; the chip shrinks only when even that does not fit. */
  .titles { flex: 1 1 0; min-width: 5ch; font-size: 16px; }
  :host([hide-title]) .titles .name, :host([hide-subtitle]) .titles > .sub { display: none; }
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
  /* Classic header: the detail button in the card's top right corner, out of the title row. */
  .header:has(> .zoom) { position: relative; padding-right: 44px; }
  .header > .zoom { position: absolute; top: 12px; right: 12px; margin: 0; box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.3)); }
  /* Title row (both headers): the name, then the status pill right after it, only when the whole name and the whole
     label fit there (measured by the card, see _fitPill); else the pill takes a line of its own under the subtitle. */
  .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .trow .name { flex: 0 1 auto; min-width: 5ch; }
  .trow .chip { flex: none; max-width: none; }
  .titles.below { display: flex; flex-direction: column; }
  .titles.below .trow { display: contents; }
  .titles.below .name { order: 0; } .titles.below .state { order: 1; } .titles.below .sub { order: 2; }
  .titles.below .chip { order: 3; align-self: flex-start; max-width: 100%; margin-top: 2px; }
  /* No room for the whole label, even on its own line: the dot only (its text stays in title and aria-label). */
  .titles.dot-only .chip { padding: 0; width: 16px; height: 16px; justify-content: center; }
  .titles.dot-only .chip .chip-text { display: none; }
  /* Narrow card: the status chip keeps only its colored dot (its text stays in title and aria-label). */
  @container mc-card (max-width: 200px) {
    .chip { padding: 4px; flex: none; }
    .chip-text { display: none; }
  }
  /* The 40 px type icon keeps its size at every width: the name gives way (ellipsis) instead. */
  @container (max-width: 200px) {
    .header { gap: 6px; }
  }
`;

// The illustrated header: 90 px, the garden and the mower at its right, a 10 px lawn strip edge to edge at its
// bottom, the round icon and the text on the sky at its left. The mower's picture (cropped, MOWER_CROPS) is drawn
// at 0.74 px per unit on the lawn and 0.83 at the station, so that the mower has the same size in both.
export const BANNER_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; --g: 10px; --scene-w: min(200px, 62%);
            color: #0d2a45; background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%); }
  .banner.night { color: #fff; background: linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%); }
  .mc-scene { position: absolute; right: 0; bottom: var(--g); height: calc(100% - var(--g)); width: var(--scene-w); }
  .mc-ground { position: absolute; left: 0; right: 0; bottom: 0; height: var(--g);
               background: repeating-linear-gradient(90deg, #5aa83d 0 22px, #6cbb4c 22px 44px); }
  .night .mc-ground { background: repeating-linear-gradient(90deg, #1f4a2a 0 22px, #245433 22px 44px); }
  .mc-night, .night .mc-day { display: none; }
  .night .mc-night { display: inline; }
  .mc-sun { fill: #ffd65a; } .mc-sun.halo { opacity: .28; }
  .mc-moon { fill: #f3eed2; }
  .mc-star { fill: #fff; opacity: .8; }
  .mc-star.tw { animation: mc-twinkle 3.2s ease-in-out infinite alternate; }
  .mc-cloud { fill: #fff; opacity: .92; animation: mc-drift 4s ease-in-out infinite alternate; }
  .night .mc-cloud { opacity: .1; }
  .mc-hill.far { fill: #a7d39f; } .mc-hill { fill: #86c27f; }
  .night .mc-hill.far { fill: #1d3a4a; } .night .mc-hill { fill: #17303d; }
  .mc-wall { fill: #f3e6d3; } .mc-roof { fill: #c0603a; } .mc-win { fill: #86b9de; } .mc-door { fill: #8a5a3a; }
  .night .mc-wall { fill: #2a3646; } .night .mc-roof { fill: #3a2a2a; } .night .mc-win { fill: #ffcf6e; } .night .mc-door { fill: #1c2530; }
  .mc-trunk { fill: #6b4a2a; } .mc-tree { fill: #5aa83d; } .night .mc-tree { fill: #1a3a2a; }
  @keyframes mc-drift { to { transform: translateX(4px); } }
  @keyframes mc-twinkle { from { opacity: .3; } to { opacity: .9; } }
  /* The mower (its own animations run in its picture), standing on the strip: right-aligned, its lawn tuft over the
     strip's top. */
  .banner .picture { position: absolute; right: 2px; bottom: calc(var(--g) - 4px); width: auto; height: auto; max-width: 48%;
                     display: block; }
  .banner .picture img { display: block; height: 62px; width: auto; max-width: 100%; object-fit: contain; object-position: right bottom;
                         filter: drop-shadow(0 2px 3px rgba(0,0,0,.18)); }
  /* Explicit widths (height × 160 / the crop's height, MOWER_CROPS): the SVG has no intrinsic size, and WebKit would
     size the absolute box from a 300 px default otherwise, the mower then landing on the text. */
  .banner .picture.lawn img { width: 118px; }
  .banner .picture.lawnLidar img { height: 68px; width: 118px; }
  .banner .picture.station img { height: 80px; width: 133px; }
  .banner .picture.custom img { height: 72px; }
  /* Icon and text on the sky, up to where the garden starts. */
  .banner .htext { position: absolute; left: 14px; top: 0; bottom: var(--g); right: calc(var(--scene-w) + 4px);
                   display: flex; align-items: center; gap: 10px; min-width: 0; z-index: 1; }
  .banner .type-icon { background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(47,128,237,.18); }
  .banner.night .type-icon { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner .type-icon.idle { --ic: #7b858f; }
  .banner.night .type-icon.idle { --ic: #a3adb8; }
  .banner .type-icon.active { --ic: var(--state-lawn_mower-mowing-color, var(--mc-accent-day)); }
  .banner.night .type-icon.active { --ic: var(--state-lawn_mower-mowing-color, var(--mc-accent-night)); }
  .banner .type-icon .logo { box-shadow: 0 0 0 1px rgba(13,42,69,.16), 0 1px 3px rgba(13,42,69,.18); background: #fff; }
  .banner .titles { flex: 1 1 auto; display: flex; flex-direction: column; gap: 1px; container: mc-titles / inline-size; }
  .banner .name { font-size: 16px; }
  .banner .chip { flex: none; max-width: none; line-height: 16px;
                  background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .banner .chip .dot { width: 7px; height: 7px; }
  .banner .state { display: flex; align-items: baseline; min-width: 0; font-size: 13px; color: #3b5b78; white-space: nowrap; }
  .banner.night .state { color: rgba(255,255,255,.78); }
  .banner .state .batt-pct { flex: none; white-space: nowrap; }
  .banner .sub { font-size: 12px; color: #3b5b78; }
  .banner.night .sub { color: rgba(255,255,255,.7); }
  /* Detail button (mini card): a small frosted round button in the banner's top right corner. */
  .banner .zoom { position: absolute; top: 5px; right: 5px; margin: 0; z-index: 2; width: 24px; height: 24px; color: #33506b;
                  background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
  .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
  /* Mini card: the mower steps aside for the detail button at the top right. */
  .banner.zoomable .picture { right: 28px; max-width: calc(var(--scene-w) - 28px); }
  /* Narrow card: the garden narrows, the mower shrinks to the room left beside the text; on the narrowest (a mini
     card at 6 columns on a phone) only the sky and the lawn strip stay, the text takes the width. */
  @container (max-width: 300px) {
    .banner { --scene-w: 46%; }
    .banner .htext { left: 10px; gap: 8px; }
  }
  @container mc-card (max-width: 300px) {
    .banner .state .batt-pct { display: none; }
  }
  @container mc-card (max-width: 200px) {
    .banner .chip { padding: 0; width: 16px; height: 16px; justify-content: center; }
    .banner .chip .chip-text { display: none; }
  }
  @container (max-width: 230px) {
    .banner .mc-scene, .banner .picture { display: none; }
    .banner .htext { right: 8px; }
    .banner.zoomable .htext { right: 34px; }
  }
  @media (prefers-reduced-motion: reduce) { .mc-cloud, .mc-star.tw { animation: none !important; } }
`;

// In-card confirmation popup, as in the other ha-* cards: a backdrop over the card with a small dialog at the top of
// the card, so that it stays in view when the card is long.
export const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 160px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 14px; line-height: 1.4; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
`;

// Element names of Home Assistant dialogs (more-info opened from the card, among others).
export const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);

// True for a click outside `card` that is not in a dialog opened from it (more-info, say).
// The whole width of an element's text, in fractional pixels, even when it is cut with an ellipsis.
export const textWidth = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return Math.max(el.scrollWidth, range.getBoundingClientRect().width);
};

export const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// After the confirmation popup closes, clicks on the card are ignored for this long: the second click of a double
// click on OK would otherwise land on what lies under the button (the battery, an action button).
export const CONFIRM_GUARD_MS = 400;

// Inlined pictures (data: URIs of the logos and the mowers) are written as <img data-img="id"> and get their src
// once, then the same node is moved into every later render: the HTML stays small and the picture is not decoded
// again on each update.
export const DATA_IMGS = [];
export const DATA_IMG_IDS = new Map();
export const imgTag = (src, attrs) => {
  if (!String(src).startsWith("data:")) return `<img src="${esc(src)}" ${attrs}>`;
  let id = DATA_IMG_IDS.get(src);
  if (id === undefined) {
    id = DATA_IMGS.push(src) - 1;
    DATA_IMG_IDS.set(src, id);
  }
  return `<img data-img="${id}" ${attrs}>`;
};

// Clicks that send a command to the mower.
export const MOWER_ACTIONS = new Set(["start_mowing", "pause", "stop", "dock"]);
// Error sensor values that mean "no error".
export const NO_ERROR = new Set(["none", "no_error", "ok", "0", "unknown", "", "no_message", "-1"]);
// Reset buttons (maintenance counters), shown next to their counter instead of among the actions.
export const RESET_KEYS = { reset_blade: "blade", reset_cycles: "charging_cycles" };

// Elements a click acts on, and how one is told from the others across renders (see _focusedSpot).
export const FOCUS_SELECTOR = "[data-action], [data-entity]";
export const focusKey = (el) => {
  const data = Object.entries({ ...el.dataset });
  return data.length ? `${el.tagName}|${JSON.stringify(data)}` : "";
};

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count, and a scroll cancels the pointer); keyboard clicks (no click count) still go through the click
// event. The handler keeps its own checks (dialogs opened from the card…). `tap(ev)` is for the tests.
export const watchOutside = (card, handler) => {
  let downOutside = false;
  const outside = (ev) => !ev.composedPath().includes(card);
  const onDown = (ev) => {
    downOutside = outside(ev);
  };
  const onUp = (ev) => {
    if (downOutside && outside(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

export let _mcUid = 0;

export class MowerBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._uid = ++_mcUid;
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // Enter / Space on an element with the button role (tile, section title, chip…) acts as a click, as on a <button>
    // (which clicks on its own: left alone).
    this.shadowRoot.addEventListener("keydown", (ev) => {
      // Used from the keyboard: the focus is kept across the rewrites again.
      this._byPointer = false;
      if ((ev.key !== "Enter" && ev.key !== " ") || ev.target?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      ev.target.click();
    });
    // No rewrite of the card between the press and the release: Home Assistant updates the card several times a
    // second, and a rewrite under the pointer replaces the element pressed, so that the click lands on the card
    // itself and does nothing. The pending render is done once released (after the click). A press also means the
    // pointer is in use: the focus is not put back on the clicked element after a rewrite (no focus ring).
    this.shadowRoot.addEventListener("pointerdown", () => {
      this._byPointer = true;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      clearTimeout(this._pressTimer);
      this._pressTimer = setTimeout(() => {
        if (!this._pressing) return;
        this._pressing = false;
        if (this._dirty) {
          this._dirty = false;
          this._update();
        }
      }, 0);
    };
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
  // On the release, not the press (watchOutside): folding on press would shift the layout under the pointer.
  connectedCallback() {
    // Clicks inside a dialog (the more-info opened from the card) leave the card as it is.
    this._onOutside ??= (ev) => {
      if ((!this._toggled?.size && !this._confirm) || !isOutside(this, ev)) return;
      this._toggled = new Map();
      if (this._confirm) this._closeConfirm();
      else this._update();
    };
    (this._onOutsideWatch ??= watchOutside(this, (ev) => this._onOutside(ev))).on();
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === "function") {
      this._resize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._fitWidth) return;
        this._fitWidth = w;
        cancelAnimationFrame(this._fitFrame);
        this._fitFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._resize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
    // Back on the page after leaving it: rendered again in its default state.
    this._update?.();
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

  // The status pill goes right after the title only when the whole title and the whole label fit there; otherwise it
  // takes a line of its own under the subtitle (.titles.below, the subtitle kept to one line). In the banner, when the
  // title, the subtitle and the pill do not fit above the lawn strip, or when the label is wider than the line, the
  // pill keeps its dot only (.titles.dot-only, back beside the title when the dot fits there). Measured after render
  // (fractional pixels), so that it holds in every language.
  _fitPill() {
    for (const t of this.shadowRoot?.querySelectorAll?.(".titles") || []) {
      const chip = t.querySelector(".trow > .chip");
      if (!chip?.getBoundingClientRect) continue;
      t.classList.remove("below", "dot-only");
      const row = chip.parentElement;
      const name = row.querySelector(".name");
      const fits = () => {
        const shown = name && getComputedStyle(name).display !== "none";
        const title = shown ? textWidth(name) + (parseFloat(getComputedStyle(row).columnGap) || 0) : 0;
        return title + chip.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5;
      };
      if (fits()) continue;
      t.classList.add("below");
      for (const sub of t.querySelectorAll(".sub, .state")) sub.title = sub.scrollWidth > sub.clientWidth ? sub.textContent.trim() : "";
      const banner = t.closest(".banner");
      const text = chip.querySelector(".chip-text");
      const tb = t.getBoundingClientRect();
      const bb = banner?.getBoundingClientRect();
      const ground = banner ? parseFloat(getComputedStyle(banner).getPropertyValue("--g")) || 0 : 0;
      const tall = !!bb && (tb.top < bb.top - 0.5 || tb.bottom > bb.bottom - ground + 0.5);
      if (!tall && !(text && text.scrollWidth > text.clientWidth + 0.5)) continue;
      t.classList.add("dot-only");
      t.classList.remove("below");
      if (!fits()) t.classList.add("below");
    }
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    this._tick = null;
    this._resize?.disconnect();
    this._fitWidth = null;
    this._onOutsideWatch?.off();
    this._pressing = false;
    clearTimeout(this._pressTimer);
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // Left (another dashboard view, a conditional card hidden): back to the default state, so that the card does
    // not come back unfolded or with its popup open.
    this._toggled = new Map();
    this._confirm = null;
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
    // show_title / show_subtitle: the header's title / subtitle, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
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
    // Held while the card is pressed (see the constructor): drawn once released.
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    let html = this._render();
    if (this._confirm) {
      html = html.replace(/<ha-card>([\s\S]*)<\/ha-card>\s*$/, (_, inner) => `<ha-card class="dialog-open">${inner}${this._confirmHtml()}</ha-card>`);
    }
    if (html === this._html) return;
    // The popup keeps its focus across the rewrite (OK, or Cancel when the user moved to it).
    const focused = this._confirm && this.shadowRoot.activeElement?.dataset?.action;
    // Otherwise, the element of the card that has the focus gets it back once rewritten, for the keyboard only: after
    // a click, it would draw the focus ring on the clicked element.
    const kept = this._confirm || this._byPointer ? null : this._focusedSpot();
    this._html = html;
    this.shadowRoot.innerHTML = html;
    this._fitPill();
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
    // The press is over: what the click changes is drawn at once (and a pending update with it).
    this._pressing = false;
    if (ev.detail === 0) this._byPointer = false;
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
    this.shadowRoot.querySelector(".modal .primary")?.focus({ preventScroll: true });
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
    return svgUri(mowerSvg(brandOf(dev), this._activity(dev, status)));
  }

  _activity(dev, status) {
    return activityOf(status?.state, this._charging(dev), this._raining(dev));
  }

  // The illustrated header is shown unless `illustration: false`.
  _illustrated() {
    return this._config.illustration !== false;
  }

  // The mower standing on the header's lawn (opens the lawn_mower entity): the drawn picture cropped to the mower,
  // the given image, or nothing with image: none.
  _bannerPicture(dev, status) {
    const img = this._config.image;
    if (img === "none") return "";
    const custom = img && img !== "auto";
    const brand = brandOf(dev);
    const activity = this._activity(dev, status);
    const src = custom ? img : svgUri(bannerMowerSvg(brand, activity));
    const kind = custom ? "custom" : bannerCrop(brand, activity);
    return `<div class="picture clickable ${kind}" role="button" tabindex="0" aria-label="${esc(this._config.title || dev.name || "")}" data-entity="${esc(dev.mower)}">${imgTag(src, 'alt=""')}</div>`;
  }

  // Status class of the header icon: working, charging, waiting, error, or resting (idle, docked without charging).
  _iconClass(dev, status) {
    const cls = statusClass(status?.state);
    if (cls === "ok") return this._charging(dev) ? "ok" : "idle";
    return cls;
  }

  // Icon of the kind of device, coloured by the status, with the logo of the integration's brand as a badge,
  // linking to its site. Unknown integration: the icon alone.
  _logo(dev, status) {
    const b = brandFor(dev);
    const icon = svgIcon(ICONS.mower, "type");
    const cls = this._iconClass(dev, status);
    if (!b.logo) return `<span class="type-icon ${cls}">${icon}</span>`;
    return `<a class="logo-link type-icon ${cls}" href="${b.site}" target="_blank" rel="noopener noreferrer" title="${esc(b.name)}">${imgTag(b.logo, `class="logo" alt="${esc(b.name)}"`)}${icon}</a>`;
  }

  // Status pill: the same colour as the header icon (resting docked grey, charging green…).
  _statusChip(dev, status) {
    return status
      ? `<span class="chip clickable ${this._iconClass(dev, status)}" role="button" tabindex="0" data-entity="${esc(status.entity)}" title="${esc(status.text)}" aria-label="${esc(
          status.text,
        )}"><span class="dot"></span><span class="chip-text">${esc(status.text)}</span></span>`
      : "";
  }

  // The illustrated header: the garden, the mower on its lawn strip, and on the sky the icon, the name, the status
  // with the battery level, and `sub` (the full card: the next start).
  _banner(dev, status, sub) {
    const c = this._config;
    const { v } = this._batteryLevel(this._battery(dev));
    // The battery level under the name, unless the body shows it big (full card, expanded mini card).
    const pct = v === null || v === undefined || this._heroInBody() ? "" : `<span class="batt-pct">${Math.round(v)} %</span>`;
    return `
      <div class="banner${isNight(this._hass, c) ? " night" : ""}${this._zoomButton() ? " zoomable" : ""}">
        ${gardenSvg(this._uid)}<div class="mc-ground" aria-hidden="true"></div>
        ${this._bannerPicture(dev, status)}
        <div class="htext">
          ${this._logo(dev, status)}
          <div class="titles">
            <div class="trow"><div class="name">${esc(c.title || dev.name)}</div>${this._statusChip(dev, status)}</div>
            ${pct ? `<div class="state">${pct}</div>` : ""}
            ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
          </div>
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  _header(dev, status, sub) {
    if (this._illustrated()) return this._banner(dev, status, sub);
    const c = this._config;
    return `
      <div class="header">
        ${this._logo(dev, status)}
        <div class="titles">
          <div class="trow"><div class="name">${esc(c.title || dev.name)}</div>${this._statusChip(dev, status)}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  // Whether the body shows the battery level big: always on the full card, only expanded on the mini card.
  _heroInBody() {
    return true;
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

export const FULL_STYLE = `
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
  /* Once the player shows its first frame, the placeholder icon goes (the player paints under later siblings). */
  .cam-view:not(.loading) > .cam-icon { display: none; }
  .cam-view.loading .cam-icon { animation: cam-pulse 1.4s ease-in-out infinite; }
  .cam-view .cam-off { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
                       font-size: 12px; color: var(--secondary-text-color); }
  .cam-open { all: unset; position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: grid; place-items: center;
              background: rgba(20,20,20,.55); color: #fff; }
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

export class MowerCard extends MowerBase {
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
    return `<style>${BASE_STYLE}${FULL_STYLE}${this._illustrated() ? BANNER_STYLE : ""}${accentStyle(dev, this._hass)}</style>
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
      ${this._illustrated() ? "" : this._pictureBlock(dev, status)}
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
    const brush = this._s(e.brush_life);
    if (valid(brush) && num(brush) !== null) {
      const v = Math.max(0, Math.min(100, num(brush)));
      row(ICONS.brush, this._t("brush"), { id: brush.entity_id, text: `${Math.round(v)} %` }, v <= 10 ? "crit" : v <= 25 ? "warn" : "ok", v, "");
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
