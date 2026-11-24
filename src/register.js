// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { MowerCard } from "./shared-styles.js";
import { MowerMiniCard } from "./mini-card.js";
import { MowerCardEditor, MowerMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
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
