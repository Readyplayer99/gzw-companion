Gray Zone Warfare - Companion App

Helps Take your Supplies, Help's plane upgrades and waste less time figuring out what to loot. 

This is a fan made Companion tracker is designed to help players for GZW with upgrading there hideout and organize their materials.

Current Features:

Hideout Tracking: View the Laboratory, Workshop, and Utility Room, including their individual stations.

Upgrade Requirements: See which materials are needed for each station and upgrade.

Inventory Management: Keep track of materials you've collected and what you're still missing.

Loot Planning: Prioritize the supplies you need instead of collecting unnecessary items.

Simple Interface: Quickly check your progress while playing.

Coming Soon

Future updates are planned to include expanded item databases, suggested loot locations, vendor prices, item values, weapon-building assistance, and additional tracking tools.

Why I made it:

I wanted a simple way to spend less time figuring out what to collect and more time actually playing. Instead of grabbing everything and hoping it's useful, this tracker helps you focus on what matters for your next upgrade.

This is an early version, and I'm continuing to develop and improve it. Feedback, suggestions, and bug reports are welcome.
 
Disclaimer AI was used in the creation of (Gray Zone Warfare - Companion App) I have tested everything my self but being a novice in coding could still have missed thing so please provide feed back. 

Unofficial community-made tool. Not affiliated with or endorsed by MADFINGER Games.

## Patch 0.1.7

This patch keeps the 111 item images already added to the app and expands the
hideout data to 22 crafting/production recipes and 15 disassembly recipes. It
includes the additional recipe items and their images, named unlock missions,
capability requirements, and community-reported production/disassembly timers.
See [CHANGELOG.md](CHANGELOG.md) for the data sources and remaining uncertainties.

### Apply the patch through GitHub

1. Open your current tracker in the browser where you normally use it. In
   **Hideout → Inventory → ⋯**, choose **Download backup** and keep that JSON file.
2. Extract the 0.1.7 download. The replacement application is **index.html**.
3. Open your `Readyplayer99/gzw-companion` repository on GitHub and select `main`.
4. Choose **Add file → Upload files**, upload the replacement **index.html** to
   the repository root, and review the change. Keep the existing artwork files.
5. Commit the update with a message such as **Update GZW Companion to 0.1.7**.
6. After GitHub Pages finishes deploying, reload your normal app URL. Check that
   the displayed version is **0.1.7** and that your saved progress is present.

Keep using the same browser and app URL: tracker progress is stored on that
device, not in the GitHub repository. A separate test copy has separate data.
The update keeps the regular tracker's storage keys. Existing custom recipe
overrides and jobs already in progress are retained; new default durations apply
when you start a new job. Use the backup if you need to restore your progress.

### Apply the Git patch locally

From a checkout of the current app, check the patch before applying it:

```sh
git apply --check gzw-companion-0.1.7.patch
git apply gzw-companion-0.1.7.patch
```

If the check reports a conflict, inspect it before changing your checkout. The
replacement `index.html` is also provided for the GitHub upload method above.
Preparing or downloading this patch does not change `main` or publish the app;
the upload/commit steps are yours to perform when ready.

### Review locally

```sh
npm ci
npm test
npm run test:browser
python3 -m http.server 4173
```

Open `http://localhost:4173/` on the same computer running the server. The
localhost address is a local review address, not a hosted preview link. Browser
checks require Chromium; use `CHROMIUM_PATH` for an existing installation or
install Playwright's browser with `npx playwright install chromium`.

Linked item images require an internet connection. If an image cannot load, the
tracker shows the item's initials.
