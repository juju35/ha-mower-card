// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------
import { ICONS, accentStyle } from "./brands-integrations.js";
import { esc, svgIcon } from "./helpers.js";
import { findDevice } from "./registry-based-resolution.js";
import { BANNER_STYLE, BASE_STYLE, MowerCard, isOutside, watchOutside } from "./shared-styles.js";

export const MINI_STYLE = `
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
export class MowerMiniCard extends MowerCard {
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
    (this._onUnzoomWatch ??= watchOutside(this, (ev) => this._onUnzoom(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    this._update?.();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._onUnzoomWatch?.off();
    // Left (another dashboard view, a conditional card hidden): back to the default state, so that the card does
    // not come back unfolded or with its popup open.
    this._zoomed = false;
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

  _heroInBody() {
    return !!this._zoomed;
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
    return `<style>${BASE_STYLE}${MINI_STYLE}${this._illustrated() ? BANNER_STYLE : ""}${accentStyle(dev, this._hass)}</style>
      <ha-card>
        ${this._header(dev, status, "")}
        <div class="content">
          ${this._illustrated() ? "" : this._pictureBlock(dev, status)}
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
