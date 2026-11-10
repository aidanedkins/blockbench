# Addon's Studio changes to Blockbench 5.2.2

This branch is **Blockbench v5.2.2** (tag `v5.2.2`, commit `c9ace42ef1b770bdadfe656729c7833b8feb37d2`) by JannisX11 and
contributors, released under the **GNU General Public License v3.0 or later** (see `LICENSE.MD` in the repository
root), plus the files in this `addons-studio/` folder.

[Addon's Studio](https://add-on-studio.com) hosts a modified copy of the Blockbench 5.2.2 web build at
`https://add-on-studio.com/editor/blockbench/5.2.2/`, so its app can open a model in Blockbench and receive it straight
back when the player presses **Save**. The hosted copy is the web build served at https://web.blockbench.net on
10 November 2026, with these changes (and no others):

| File | Change |
|---|---|
| `aos-bridge.js` | **Added.** Talks to the Addon's Studio app with `postMessage`: opens the model it sends, adds a "Save to Addon's Studio" action and sends the saved project back. The server fills in the app's addresses where the file says `/*ALLOWED_PARENTS*/[]`. |
| `index.html` | **One added line** that loads `aos-bridge.js` before `dist/bundle.js` (marked with a comment). The full file is in this folder. |
| `service_worker.js` | Not served (it would keep stale copies). |

To rebuild the hosted copy from source: build Blockbench 5.2.2's web version as described in the repository's README,
copy `aos-bridge.js` next to the built `index.html`, and add the line shown in this folder's `index.html`.

This is not the official Blockbench website, and Addon's Studio is not affiliated with or endorsed by Blockbench.
Questions: warpzoneaddon@gmail.com
