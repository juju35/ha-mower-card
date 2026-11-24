// ---------------------------------------------------------------------------
// Illustrated header
// ---------------------------------------------------------------------------
// A garden at the right of the header (200 × 80, drawn 1.15× from its bottom right corner): sun or moon, clouds,
// a hill with a house and a tree, under a sky gradient; the mower's picture stands on a 10 px lawn strip that runs
// under the whole header. The left of the header is open sky for the icon and the text. `uid` keeps the ids of each
// card apart on a page with several cards.
export const MC_STARS = [
  [10, 8],
  [40, 20],
  [100, 6],
  [130, 26],
  [170, 10],
  [190, 30],
];
export const mcCloud = (x, y, s) =>
  `<path class="mc-cloud" transform="translate(${x} ${y}) scale(${s})" d="M-14,4 C-17,4 -18,0 -14.5,-1 C-14,-5 -8,-6 -6,-3 C-4,-8 4,-8 5,-2 C9,-3 12,0 10,4 Z"/>`;
export const gardenSvg = (uid) => `<svg class="mc-scene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="mc-fade-${uid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="28" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <mask id="mc-mask-${uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="80"><rect width="200" height="80" fill="url(#mc-fade-${uid})"/></mask>
    </defs>
    <g mask="url(#mc-mask-${uid})"><g transform="translate(200 80) scale(1.15) translate(-200 -80)">
      <g class="mc-day"><circle class="mc-sun halo" cx="70" cy="16" r="9"/><circle class="mc-sun" cx="70" cy="16" r="6"/></g>
      <g class="mc-night">${MC_STARS.map(([x, y], i) => `<circle class="mc-star${i % 2 ? " tw" : ""}" cx="${x}" cy="${y}" r=".6"/>`).join("")}<path class="mc-moon" d="M70 10.5a5.5 5.5 0 1 0 4.6 8.5 4.5 4.5 0 1 1-4.6-8.5Z"/></g>
      ${mcCloud(40, 14, 1)}${mcCloud(150, 22, 0.7)}
      <path class="mc-hill far" d="M0,80 C30,70 60,64 100,66 C140,68 170,60 200,62 L200,80Z"/>
      <g transform="translate(20 50)"><rect class="mc-wall" width="34" height="22"/><path class="mc-roof" d="M-3 1 L17 -12 L37 1Z"/><rect class="mc-win" x="5" y="7" width="7" height="6"/><rect class="mc-door" x="21" y="9" width="6" height="13"/></g>
      <path class="mc-hill" d="M0,80 C40,74 90,75 200,72 L200,80Z"/>
      <rect class="mc-trunk" x="71" y="62" width="2" height="12"/><circle class="mc-tree" cx="72" cy="56" r="9"/>
    </g></g>
  </svg>`;

// Night picture: forced by illustration_theme, else Home Assistant's dark mode alone (a light theme keeps the day
// picture after sunset).
export const isNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// Status (and charging / rain binary sensors) → activity of the picture.
export const activityOf = (state, charging, raining) => {
  if (["mowing", "edgecut", "zoning", "starting", "searching_zone", "leaving"].includes(state)) return "mowing";
  if (state === "returning") return "returning";
  if (state === "docked") return charging ? "charging" : "docked";
  if (state === "error" || state === "escaped_digital_fence") return "error";
  if (state === "rain_delayed" || raining) return "rain";
  return null;
};
