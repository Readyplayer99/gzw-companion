# 0.1.7 validation

Checked 14 November 2026.

- Data checks: 5 passed.
- Browser regression checks: 10 passed.
- All 135 built-in item images rendered and decoded in desktop/mobile tests using substitute image responses.
- All 111 previously integrated image URLs are unchanged. The 24 additional URLs returned HTTP 200 and decoded as PNG images in a separate network audit.
- All 36 existing room upgrade costs, effects and requirements match the previous release.
- Confirmed multiple capability checks, one-second craft timers, editing, undo, backup export/import, custom item/recipe collisions, and preservation of existing active jobs.
- New disassembly jobs use 4/6/8-hour community estimates; existing jobs retain saved durations.
- The regular storage key remains gzw-companion and the save schema remains version 2.

Community production/disassembly durations remain marked as estimates. Browser image tests substitute responses for repeatability; source URL availability was checked independently.

Patch base: main commit 2f6971e426aff2c016de896450dd7ac6c26b75b9. Only index.html changes when applying the Git patch.
