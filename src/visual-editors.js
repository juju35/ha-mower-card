// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { DEFAULT_COLLAPSED } from "./brands-integrations.js";
import { lang, t } from "./helpers.js";
import { listDevices, sameDeps } from "./registry-based-resolution.js";
import { MowerCard } from "./shared-styles.js";

export class MowerEditorBase extends HTMLElement {
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

export class MowerCardEditor extends MowerEditorBase {
  static get toggles() {
    return [
      ["illustration", true],
      ["show_title", true],
      ["show_subtitle", true],
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
    return { illustration_theme: "auto", show_map: "mowing", collapsed: DEFAULT_COLLAPSED };
  }

  static extraFields(tr) {
    return [
      {
        name: "illustration_theme",
        selector: {
          select: {
            mode: "dropdown",
            options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })),
          },
        },
      },
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

// The mini card's detail view is the full card: its editor offers the full card's options, plus the detail button.
export class MowerMiniCardEditor extends MowerCardEditor {
  static get toggles() {
    return [...MowerCardEditor.toggles, ["zoom", true]];
  }
}
