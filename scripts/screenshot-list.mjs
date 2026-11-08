// The README screenshots (PNG) and animations (GIF) rendered by scripts/screenshots.mjs.
// Every capture has a twin in the other theme ("-dark" for a light capture, "-light" for a dark one)
// that shows exactly the same state: only the theme differs (checked by test/screenshots.test.mjs).
import { charging, error, lubaDocked, mowing, rainDelay, returning } from "./mock-states.mjs";

const both = (file, type, width, config, extra = {}) => [
  { file, type, theme: "light", width, config, ...extra },
  { file: `${file}-dark`, type, theme: "dark", width, config, ...extra },
];
const bothDark = (file, type, width, config, extra = {}) => [
  { file, type, theme: "dark", width, config, ...extra },
  { file: `${file}-light`, type, theme: "light", width, config, ...extra },
];

export const shots = [
  // Husqvarna Automower: docked and charging, the default device.
  ...both("card", "mower-card", 460, {}),
  ...both("mini-card", "mower-mini-card", 380, {}),
  // Worx Landroid (Landroid Cloud): out mowing.
  ...both("card-landroid", "mower-card", 460, { device: "Landroid Vision", collapsed: [] }),
  ...both("mini-card-landroid", "mower-mini-card", 380, { device: "Landroid Vision" }),
  // Ecovacs GOAT: docked, with its garden map always shown.
  ...bothDark("card-ecovacs", "mower-card", 460, { device: "GOAT G1", show_map: "always" }),
  ...bothDark("mini-card-ecovacs", "mower-mini-card", 380, { device: "GOAT G1" }),
  // Mammotion Luba: mowing the orchard, time left.
  ...bothDark("card-mammotion", "mower-card", 460, { device: "Luba 2 AWD", collapsed: ["options"] }),
  ...bothDark("mini-card-mammotion", "mower-mini-card", 380, { device: "Luba 2 AWD" }),
  // Bosch Indego: entities without translation keys.
  ...both("card-indego", "mower-card", 460, { device: "Indego S+ 500", collapsed: [] }),
  ...both("mini-card-indego", "mower-mini-card", 380, { device: "Indego S+ 500" }),
  // Mini card switched to the full card by its detail button.
  ...both("mini-card-zoom", "mower-mini-card", 460, {}, { clicks: [".zoom"] }),
  // Confirmation popup of an action.
  ...both("card-confirm", "mower-card", 460, { device: "Landroid Vision" }, { clicks: ['[data-action="button"]'] }),
  // Narrow cards: the full card at its minimum width (9 of 12 columns of a 320 px Sections view, 238 px) and the
  // mini card at 6 columns of a phone's Sections view (170 px).
  ...both("card-narrow", "mower-card", 238, { collapsed: [] }),
  ...both("mini-card-narrow", "mower-mini-card", 170, {}),
];

// One looping GIF per distinct animated state the card shows (each plays different keyframes):
//   mowing     — mower driving across the lawn, wheels turning, clippings flying, grass waving (sway, spin, clip, wave)
//   returning  — mower sliding back onto its charging station (home, spin)
//   charging   — mower docked, the station light pulsing (pulse)
//   error      — mower stopped on the lawn, its light blinking red (blink)
//   rain-delay — Landroid waiting for the rain to stop, drops falling (drop)
// Each one is followed by its twin in the other theme: "-dark" for a light capture, "-light" for a dark one.
export const gifs = [
  ...both("mowing", "mower-card", 460, {}, { overrides: mowing }),
  ...both("returning", "mower-card", 460, {}, { overrides: returning }),
  ...bothDark("charging", "mower-card", 460, {}, { overrides: charging }),
  ...bothDark("error", "mower-card", 460, {}, { overrides: error }),
  ...both("rain-delay", "mower-card", 460, { device: "Landroid Vision" }, { overrides: rainDelay }),
  ...bothDark("mammotion-charging", "mower-mini-card", 380, { device: "Luba 2 AWD" }, { overrides: lubaDocked }),
];
