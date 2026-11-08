# Changelog

## 1.0.0 - 2026-11-08

### Features
- First release: a full **Mower Card** (`custom:mower-card`) and a compact **Mower Mini Card** (`custom:mower-mini-card`) for robot lawn mowers, whatever the integration: every device with a `lawn_mower` entity is found through the Home Assistant registries.
- Known integrations read in depth: Husqvarna Automower, Ecovacs (GOAT), Landroid Cloud (Worx, Kress, Landxcape), Mammotion, ZCS Mower, Bosch Indego and Gardena Smart System; any other integration gets the status, the controls, the battery, its buttons as actions and its switches as options.
- Drawn mower picture in the brand's colors, animated by what the mower is doing (mowing, returning, charging, error, rain delay), header icon with the brand logo as a badge, buttons in the brand's color.
- Battery and charging, next start or last completed session, progress, time left and area of the current session, work area, mode, cutting height, headlights, schedule, errors, rain sensor and rain delay.
- Start / pause, stop and dock buttons following the entity's supported features; actions and option toggles with a confirmation; maintenance (blades with reset, charge cycles, collisions); statistics; map while mowing.
- Visual editor for both cards, 22 languages, light and dark themes, narrow layouts for the Sections view.
