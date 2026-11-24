# Changelog

## 1.5.6 - 2026-11-24

### Maintenance
- The card source is split into ES modules: `src/` (entry `src/index.js`), cut at its sections, with the translations in one file per language (`i18n/<lang>.js`). `scripts/bundle.mjs` concatenates them back, in their original order, into the same single file and per-language files as before; the tests evaluate that bundle.

## 1.5.5 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.5.4 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.5.3 - 2026-11-20

### Fixes
- Device detection: the brand of a mower (picture colours, logo, accent, entity keys) now comes from its `lawn_mower` entity. It came from the first entity of the device, which can belong to another integration that adds entities to devices (Battery Notes, for one): the mower then showed as a generic one.
- Confirmation popup: focusing its button no longer scrolls the page; the timers left by a press and the status pill's pending measure are cleared when the card leaves the page.

### Maintenance
- CI: Validate runs in a Debian 12 container with Chromium, so the browser tests (status pill placement) now run on every pull request instead of being skipped; a missing browser fails the job.
- CI: the branch cleanup recognises the commits of the `juju35-screenshots` app.

## 1.5.2 - 2026-11-18

### Fixes
- Illustrated header: `auto` now follows the Home Assistant theme alone — a light theme keeps the day picture after sunset, a dark theme still shows the night one.

## 1.5.1 - 2026-11-17

### Fixes
- Illustrated header in Safari (WebKit): the mower gets an explicit width, so that WebKit no longer sizes the picture from an SVG's default 300 px width and lays it over the title.

## 1.5.0 - 2026-11-17

### Features
- **Illustrated header** on the full and mini cards (90 px): a garden under a day or night sky, with the card's own drawn mower (brand colours, same model choice and animations as before) on a 10 px lawn strip running edge to edge, at its charging station while docked, charging or returning, out on the lawn while mowing, in error or waiting for the rain. The icon, the name, the status with the battery level (and the next start on the full card) sit on the sky; the brand logo stays as a badge on the icon. The picture moves from beside the battery into the header.
- **Night sky** while `sun.sun` is below the horizon or with Home Assistant's dark theme, forced with `illustration_theme: day | night`; `illustration: false` brings back the classic header. Both options are in the visual editor of both cards. Animations stop with the system's reduced-motion setting.
- **Status colour of the header icon**, in both headers and both cards: working (mowing, returning) in the state colour (Home Assistant's lawn mower colour, else the brand accent), charging green, waiting (paused, rain) amber, error red, resting grey.
- **Status pill in the illustrated header**: the coloured dot and the status sit right after the name, in the header icon's colour, the battery level on the line below; the pill stays on the title row only when the whole name and its whole label fit there (the name is never cut for it), else it takes a line of its own under the subtitle (kept to one line); when even that does not fit in the header, and on cards 200 px wide or less, only its dot stays (the status in its tooltip). Measured on the rendered header, so it holds in every language, in both headers. The mini card's detail button is a small frosted round button in the banner's top right corner (in the card's corner with the classic header).

### Fixes
- `show_title: false` hides the title again in the illustrated header, where it sits in the title row with the status pill.
- Night picture with the dark theme even while the sun is up (`illustration_theme: auto`): the header is night when `sun.sun` is below the horizon or Home Assistant's theme is dark; `day` / `night` still force it.
- No repeated battery level: where the body shows the battery level big (full card, expanded mini card), the illustrated header no longer repeats it under the name and keeps the next start (else the last completed session); the compact mini card keeps the level in its header.

## 1.4.2 - 2026-11-14

### Fixes
- **Mini card visual editor**: its detail view is the full card, but its editor offered only the title, subtitle, controls and detail button options. It now offers every option of the full card too: map, settings, actions, options, maintenance, statistics and camera sections, folded sections, map and camera entities.
- **README**: these options are marked as working on both cards, and `entities` is marked as YAML only (the visual editor keeps it).

## 1.4.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so the unfolded sections, the confirmation popup and the detail view of the mini card stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything, and keyboard clicks still work.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state, instead of coming back unfolded or with its popup open.
- Clicks no longer get lost under an update: Home Assistant updates the card several times a second, and a rewrite between the press and the release replaced the element pressed, so the click did nothing. The card is not rewritten while pressed; the pending update is drawn right after the click.
- No focus ring after a mouse click: the focus is put back on the clicked element after an update only for the keyboard.

## 1.4.0 - 2026-11-12

### Features
- `show_title` and `show_subtitle` options (also in the visual editor) hide the header's title and its subtitle, separately, for a card placed under a section heading of its own (asked in juju35/ha-vehicle-card#72).

## 1.3.0 - 2026-11-11

### Features
- **Dreame** ([#11](https://github.com/juju35/ha-mower-card/issues/11)): the [Dreame Mower](https://github.com/antondaubert/dreame-mower) integration of the Marketplace gets its logo, its own drawing (with its LiDAR turret) and colors, and its progress, current task, blade and brush health (a Brush row in the maintenance section) and schedules mapped. It has no camera and no action buttons, so these sections stay hidden.
- **Entities of your choice**: `entities` sets the entities read under each name (`battery`, `progress`, `blade_life`, `next_start`, `rain`…), replacing the ones found, for an integration the cards do not know or a sensor of your own.

## 1.2.1 - 2026-11-09

### Fixes
- Translations: the cards are defined once the page's language file has arrived (at most 1.5 s; Home Assistant builds a card when its element gets defined), so the first render is already translated instead of English then redrawn; until a language file is in, a missing text reads the English one wherever the card has no fallback of its own.

## 1.2.0 - 2026-11-09

### Performance
- **Translations load on demand**: the bundle keeps English only (238 KB → 179 KB) and each other language is its own `mower-card.i18n.<lang>.js` file next to it, fetched the first time a card needs it. Home Assistant loads every dashboard resource on every dashboard, so each page used to download and parse all 22 languages to use one. Until a language file has arrived (a few milliseconds), texts fall back to English, and the cards redraw once it is there.

### Maintenance
- Build: `scripts/i18n-split.mjs` splits the built bundle and rebuilds every table from the split files to check them (the build fails on any difference); `src/` keeps every language as before.
- Release: every file of `dist/` is attached. Manual installation copies the translation files too.

## 1.1.0 - 2026-11-08

### Features
- Camera section: the live cameras of the mower (Mammotion Luba / Yuka vision cameras, or any camera with `camera_entity`), one tab per camera, played by Home Assistant's own player. Folded by default (`collapsed` now `[camera, stats]`): the stream only runs while the section is unfolded and the card visible on screen, and stops when it is folded, scrolled away or in a hidden tab. `show_camera: false` removes it.
- Cameras that only render a picture (the Bosch Indego garden map) are shown as the map, not as a live camera.

## 1.0.0 - 2026-11-08

### Features
- First release: a full **Mower Card** (`custom:mower-card`) and a compact **Mower Mini Card** (`custom:mower-mini-card`) for robot lawn mowers, whatever the integration: every device with a `lawn_mower` entity is found through the Home Assistant registries.
- Known integrations read in depth: Husqvarna Automower, Ecovacs (GOAT), Landroid Cloud (Worx, Kress, Landxcape), Mammotion, ZCS Mower, Bosch Indego and Gardena Smart System; any other integration gets the status, the controls, the battery, its buttons as actions and its switches as options.
- Drawn mower picture in the brand's colors, animated by what the mower is doing (mowing, returning, charging, error, rain delay), header icon with the brand logo as a badge, buttons in the brand's color.
- Battery and charging, next start or last completed session, progress, time left and area of the current session, work area, mode, cutting height, headlights, schedule, errors, rain sensor and rain delay.
- Start / pause, stop and dock buttons following the entity's supported features; actions and option toggles with a confirmation; maintenance (blades with reset, charge cycles, collisions); statistics; map while mowing.
- Visual editor for both cards, 22 languages, light and dark themes, narrow layouts for the Sections view.
