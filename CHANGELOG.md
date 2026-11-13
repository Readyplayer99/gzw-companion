# Changelog

## 0.1.7

- Keep all 111 item-image links from the preceding image integration and include
  images for the additional recipe items.
- Expand crafting and production from 8 to 22 documented recipes: 6 Workshop
  recipes and 16 Laboratory recipes.
- Fill previously missing ingredients, quantities and unlock-mission names for
  the existing Tracking Tag and medical recipes. Replace guessed hacking-tool
  station levels with the documented capability requirements.
- Add Basic and Advanced Tracking Tags; DT-0X, Fenethylline, Morphine and
  Strychnine; and 8 laboratory production recipes.
- Support recipes needing several capabilities and short craft durations.
- Keep the existing 15 disassembly input/output combinations and use
  community-reported durations of 4, 6 or 8 hours instead of one 12-hour default.
- Keep the 15 room stations and their existing material/cash requirements. Do
  not add an unverified extra Ventilation upgrade.
- Retain saved inventory, favorites, custom items and recipes, personal recipe
  overrides, station progress, pins, artwork, and active craft/disassembly jobs.
  Updated default timers apply to new jobs; active jobs keep their saved times.

### Data sources and confidence

The catalogue was checked on **14 November 2026**. These are in-game recipes
documented by community sources; the additional entries are new to this tracker,
not evidence that the latest game patch introduced 14 new recipes.

- [GZW Items crafting catalogue](https://gzwitems.com/hideout/crafting): 22
  crafting/production recipes, ingredient quantities, unlock missions,
  capability requirements and reported durations.
- [GZW Items disassembly catalogue](https://gzwitems.com/hideout/disassembly):
  the existing 15 source items with reported 4-, 6- and 8-hour durations. Per-item
  Workshop level requirements are not supplied and should not be guessed.
- [GZW Items room upgrade requirements](https://gzwitems.com/hideout): 15
  stations; the listed material and cash requirements agree with the tracker.
- [Official Patch 0.5.1.0, 5 November 2026](https://www.grayzonewarfare.com/news/patch-0510-devlog):
  confirms reduced production and disassembly durations, but does not publish a
  complete table of the replacement times.
- [Zone Intel hideout catalogue](https://zoneintel.gg/hideout) and its
  [data provenance](https://zoneintel.gg/about): useful corroboration for
  ingredients and quantities, but its 22 October 2026 game build predates the
  November timer changes.

Exact replacement production/disassembly durations are community-reported, not
officially confirmed per-item values. The app marks uncertain data accordingly.
Ventilation's second recorded upgrade is labelled Level III by some sources;
the missing level numbering remains unresolved. It is represented once to avoid
charging for a duplicate upgrade.

### Applying this release

Back up your tracker before replacing `index.html`. Follow the instructions in
[README.md](README.md). The release package does not contain your browser's saved
progress, and applying it does not require resetting that progress.
