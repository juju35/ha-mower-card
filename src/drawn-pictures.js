// ---------------------------------------------------------------------------
// Drawn pictures
// ---------------------------------------------------------------------------
// The mower is a drawing, colored after its brand and animated by what it is doing (`activity`): mowing (it drives
// across the lawn, its wheels turn and clippings fly), returning (it slides back onto its charging station),
// charging (the station light pulses), error (its light blinks red), rain (drops fall while it waits), none (at rest).

// Animations, shared by every picture. Pictures are <img>, so CSS animations run but no script does.
export const ANIM_CSS = `
  .spin { transform-box: fill-box; transform-origin: center; animation: spin .6s linear infinite; }
  .sway { animation: sway 2.6s ease-in-out infinite alternate; }
  .home { animation: home 2.8s cubic-bezier(.3,.7,.4,1) infinite; }
  .clip { animation: clip 1.1s ease-out infinite; }
  .wave { transform-box: fill-box; transform-origin: 50% 100%; animation: wave 1.4s ease-in-out infinite alternate; }
  .pulse { animation: pulse 1.8s ease-in-out infinite; }
  .blink { animation: blink 1s steps(2, start) infinite; }
  .drop { animation: drop 1.2s linear infinite; }
  .d1 { animation-delay: -.25s; } .d2 { animation-delay: -.5s; } .d3 { animation-delay: -.75s; } .d4 { animation-delay: -1s; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes sway { from { transform: translateX(-8px); } to { transform: translateX(8px); } }
  @keyframes home { 0% { transform: translateX(-80px); opacity: 0; } 15% { opacity: 1; } 65%, 100% { transform: none; opacity: 1; } }
  @keyframes clip { from { transform: translate(0, 0) rotate(0); opacity: 0; } 25% { opacity: .95; } to { transform: translate(-10px, -16px) rotate(140deg); opacity: 0; } }
  @keyframes wave { from { transform: skewX(-8deg); } to { transform: skewX(8deg); } }
  @keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
  @keyframes blink { to { opacity: 0; } }
  @keyframes drop { from { transform: translateY(-14px); opacity: 0; } 20% { opacity: .9; } to { transform: translateY(26px); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`;

// Body colors of the drawn mower, per brand: top shell, lower shell, bumper stripe, wheels.
export const MOWER_COLORS = {
  husqvarna: { top: "#4b5057", side: "#2b2f34", stripe: "#f35321", wheel: "#1c1e21", hub: "#8d939a" },
  landroid: { top: "#f08a1d", side: "#2b2b2b", stripe: "#1f1f1f", wheel: "#1c1e21", hub: "#9a9ea3" },
  ecovacs: { top: "#3e4349", side: "#24272b", stripe: "#3d9be9", wheel: "#1c1e21", hub: "#8d939a" },
  mammotion: { top: "#f1f2f0", side: "#2f3338", stripe: "#45c46a", wheel: "#1c1e21", hub: "#b5b9bd" },
  zcs: { top: "#f1f2f0", side: "#2f3338", stripe: "#4aa3ea", wheel: "#1c1e21", hub: "#b5b9bd" },
  indego: { top: "#4faa3b", side: "#2b2f34", stripe: "#e8e8e6", wheel: "#1c1e21", hub: "#8d939a" },
  gardena: { top: "#3d4a52", side: "#262d33", stripe: "#1fb3c9", wheel: "#1c1e21", hub: "#8d939a" },
  dreame: { top: "#eceef0", side: "#2e3136", stripe: "#b08a5a", wheel: "#1c1e21", hub: "#b5b9bd", lidar: "#3a3e44" },
  generic: { top: "#4b5057", side: "#2b2f34", stripe: "#45c46a", wheel: "#1c1e21", hub: "#8d939a" },
};

export const svgDoc = (w, h, body, defs = "", anim = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${anim ? `<style>${ANIM_CSS}</style>` : ""}${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`;

// A wheel of radius r centred on (cx, cy): tyre, hub and spokes (turning while `moving`).
export const wheel = (cx, cy, r, col, moving) => {
  const spokes = [0, 60, 120]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      const dx = r * 0.62 * Math.cos(rad), dy = r * 0.62 * Math.sin(rad);
      return `<line x1="${(cx - dx).toFixed(1)}" y1="${(cy - dy).toFixed(1)}" x2="${(cx + dx).toFixed(1)}" y2="${(cy + dy).toFixed(1)}" stroke="${col.hub}" stroke-width="${(r * 0.16).toFixed(1)}" stroke-linecap="round"/>`;
    })
    .join("");
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col.wheel}"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.86).toFixed(1)}" fill="none" stroke="#3a3e43" stroke-width="${(r * 0.14).toFixed(1)}" stroke-dasharray="${(r * 0.3).toFixed(1)} ${(r * 0.22).toFixed(1)}"/>
    <g class="${moving ? "spin" : ""}">${spokes}<circle cx="${cx}" cy="${cy}" r="${(r * 0.24).toFixed(1)}" fill="${col.hub}"/></g>`;
};

// The mower seen from the side, drawn in its own coordinates (104 wide, the ground at y = 0, the body above it) and
// placed with a transform: rounded lower shell, hood in the brand color, bumper stripe, big rear wheel and small front
// wheel, red stop button and status light (`light`: a color, or null for none); the LiDAR turret of the brands that
// have one (`col.lidar`, Dreame).
export const mowerShape = (transform, col, { moving = false, light = null, lightClass = "" } = {}) => {
  let s = `<ellipse cx="54" cy="0" rx="56" ry="4" opacity=".2"/>`;
  s += `<path d="M6 -12 H98 Q104 -12 104 -18 V-24 Q104 -30 96 -30 H10 Q2 -30 2 -22 V-18 Q2 -12 6 -12 Z" fill="${col.side}"/>`;
  // Lidar turret (Dreame): behind the hood, which hides its base.
  if (col.lidar) s += `<rect x="62" y="-59" width="20" height="16" rx="3" fill="${col.lidar}"/><rect x="63.5" y="-55" width="17" height="3.2" rx="1.4" fill="#11161b"/><rect x="64" y="-59.8" width="16" height="1.8" rx=".9" fill="${col.stripe}"/>`;
  s += `<path d="M8 -30 Q10 -46 30 -48 H72 Q92 -48 98 -30 Z" fill="${col.top}"/>`;
  s += `<line x1="6" y1="-30" x2="100" y2="-30" stroke="${col.stripe}" stroke-width="3" stroke-linecap="round"/>`;
  s += `<rect x="${col.lidar ? 34 : 40}" y="-53" width="16" height="6" rx="2" fill="#c62828"/>`;
  if (light) s += `<circle class="${lightClass}" cx="90" cy="-40" r="2.5" fill="${light}"/>`;
  s += wheel(24, -14, 14, col, moving);
  s += wheel(86, -7, 7, col, moving);
  return `<g transform="${transform}">${s}</g>`;
};

// Lawn under the mower (width w from x, its top at y), its blades waving while the mower works.
export const lawn = (x, y, w, moving) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="10" rx="4" fill="#5aa83d"/>`;
  for (let i = 0; i < w / 9; i++) {
    const bx = x + 4 + i * 9;
    s += `<path class="${moving ? `wave d${i % 4}` : ""}" d="M${bx} ${y + 2} q1.5 -6 3 -9 q0 5 2 9" fill="#79c257"/>`;
  }
  return s;
};

// Clippings flying up behind the blade deck, at (x, y).
export const clippings = (x, y) =>
  [0, 8, 16, 24]
    .map((dx, i) => `<rect class="clip d${i}" x="${x + dx}" y="${y}" width="4" height="1.6" rx=".8" fill="#9ad66f"/>`)
    .join("");

// Rain over the lawn.
export const rain = (x, y, w) =>
  [0.1, 0.3, 0.5, 0.7, 0.9]
    .map((f, i) => `<line class="drop d${i % 4}" x1="${x + f * w}" y1="${y}" x2="${x + f * w - 2}" y2="${y + 9}" stroke="#4aa3ea" stroke-width="2" stroke-linecap="round" opacity="0"/>`)
    .join("");

// Mower out on the lawn (160 × 104): driving while it mows, still otherwise; rain falling while it waits for it to stop.
export const onLawn = (col, activity) => {
  const moving = activity === "mowing";
  const light = activity === "error" ? "#e53935" : moving ? "#43c463" : null;
  let s = lawn(4, 86, 152, moving);
  s += `<g class="${moving ? "sway" : ""}">${mowerShape("translate(12 86) scale(1.3)", col, { moving, light, lightClass: activity === "error" ? "blink" : "" })}${moving ? clippings(4, 78) : ""}</g>`;
  if (activity === "rain") s += rain(10, 24, 140);
  return svgDoc(160, 104, s, "", !!activity);
};

// Mower on its charging station (160 × 160): a base plate with its post, the light pulsing while charging; returning,
// the mower slides in from the left.
export const onStation = (col, activity) => {
  const charging = activity === "charging";
  let s = lawn(4, 142, 152, false);
  // Station: base plate and post with its light.
  s += `<path d="M8 142 V138 Q8 134 14 134 H146 Q152 134 152 138 V142 Z" fill="#3a3e43"/>`;
  s += `<rect x="128" y="60" width="20" height="76" rx="6" fill="#4b5057"/><rect x="132" y="66" width="12" height="34" rx="4" fill="#2b2f34"/>`;
  s += `<circle class="${charging ? "pulse" : ""}" cx="138" cy="76" r="3.5" fill="${charging ? "#43c463" : activity === "error" ? "#e53935" : "#8d939a"}"/>`;
  s += `<g class="${activity === "returning" ? "home" : ""}">${mowerShape("translate(10 134) scale(1.15)", col, { moving: activity === "returning", light: charging ? "#43c463" : null })}</g>`;
  return svgDoc(160, 160, s, "", !!activity);
};

// The picture of a device: its brand's colors, on the lawn or at the station depending on the activity.
export const mowerSvg = (brand, activity = null) => {
  const col = MOWER_COLORS[brand] || MOWER_COLORS.generic;
  return ["docked", "charging", "returning"].includes(activity) ? onStation(col, activity === "docked" ? null : activity) : onLawn(col, activity);
};
export const svgUri = (svg) => svg && `data:image/svg+xml,${encodeURIComponent(svg)}`;

// The same picture cropped to the mower (and its station), for the illustrated header: the frame starts just above
// the red stop button (the LiDAR turret of a Dreame, the station's post) and ends just under the lawn tuft. The
// scale is the same on the lawn and at the station (the header draws them 0.74 / 0.83 px per unit, see BANNER_STYLE).
export const MOWER_CROPS = { lawn: [14, 84], lawnLidar: [6, 92], station: [58, 96] };
export const bannerCrop = (brand, activity) => {
  if (["docked", "charging", "returning"].includes(activity)) return "station";
  return MOWER_COLORS[brand]?.lidar ? "lawnLidar" : "lawn";
};
export const bannerMowerSvg = (brand, activity) => {
  const [y, h] = MOWER_CROPS[bannerCrop(brand, activity)];
  return mowerSvg(brand, activity).replace(/viewBox="[^"]*"/, `viewBox="0 ${y} 160 ${h}"`);
};
