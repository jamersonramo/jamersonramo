# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This is `jamersonramo/jamersonramo` — the owner's GitHub **profile README repository** (the repo name matches the username, so GitHub renders `README.md` on their public profile page). It also hosts one real software project, `teleprompter/`, developed here alongside the profile content.

## Structure

- `README.md` — the GitHub profile content (Markdown + an HTML comment). Rendered on the owner's public profile.
- `teleprompter/` — an Electron desktop teleprompter app. See `teleprompter/README.md` for its own usage/dev instructions; the notes below cover only what's non-obvious about its architecture.

## Working in this repo

- Editing `README.md` is just a Markdown/HTML-comment edit — no build step, verify by previewing the rendered file. Preserve the HTML comment explaining the profile-rendering behavior unless asked to remove it.
- For `teleprompter/`, run commands from inside that directory (`cd teleprompter && npm install && npm start`); it has its own `package.json` and is not part of any root build.

## Teleprompter app architecture

- **All renderer surfaces share one animation engine.** The control window (script editor + settings), the Electron display window (fullscreen/second-monitor output), the network client, and the standalone `mobile-webrtc/` page all render scrolling text via `scroll-engine.js`. Each surface runs its own `requestAnimationFrame` loop locally rather than being driven frame-by-frame from the main process — this keeps scrolling smooth under network/WebRTC latency. State pushes are full syncs; only `reset`/`nudge` are one-off commands, position itself is never streamed.
- **State lives in `src/main.js`**, fanned out over two transports: Electron IPC (`state:sync` / `scroll:command`) to BrowserWindows, and WebSocket (`src/server.js`) to network clients. Any state change must go through `broadcastAll()`/`sendCommand()` in `main.js` so both transports stay in sync.
- **The Wi-Fi network mirror is bidirectional and multi-master**, not just a read-only display. `src/server.js`'s WebSocket server relays `{ kind: 'state' | 'command', payload }` messages both ways: any connected browser client can push a state update (`onMessage` callback wired in `main.js`'s `network:toggle` handler calls the same `broadcastAll()`/`sendCommand()` the desktop control window uses), and every client — desktop windows and browsers alike — receives the resulting broadcast. There's no server-side concept of "the controller"; any client can act as one at any time.
- **`src/renderer/shared/mobile-app.js` is the reusable phone/tablet UI** (mirror stage + editor/transport controls in one page, toggled via a body class `mode-mirror`/`mode-control`). It's transport-agnostic — it only needs an object with `send()`/`onMessage()`/`onOpen()`/`onClose()`. This is what lets the exact same UI logic power both `src/renderer/network/` (WebSocket transport, `ws-transport.js`, requires the desktop app running as host) and `mobile-webrtc/` (WebRTC transport, `webrtc-transport.js`, phone-to-phone with no desktop involved).
- **`mobile-webrtc/` is intentionally standalone** — not served by the Electron app, meant to be deployed separately (e.g. GitHub Pages) so two phones can pair directly with no computer in the loop. It vendors its own copies of `scroll-engine.js` and `mobile-app.js` rather than importing from `src/renderer/shared/`; keep both copies in sync by hand if that shared logic changes. Pairing uses PeerJS's public cloud broker (`pairing.js`) only to bootstrap the WebRTC connection (exchange a 5-letter code); actual state/command traffic afterward goes peer-to-peer, never through any server of ours.
- **Remote control (keyboard + gamepad) is fully configurable**, not hardcoded — desktop app only. `src/settings-store.js` persists per-action key/gamepad bindings to disk (Electron `userData`); `src/renderer/shared/remote-control.js` provides the shared capture/matching logic (`eventToAccelerator`, `watchGamepads`) used by both the control window's remapping UI and the display window's local fallback listener. Global OS-level keyboard shortcuts (via `globalShortcut`) are only registered while the display window is open, specifically so they don't swallow normal typing in the script editor.
- **The network mirror server** (`src/server.js`) serves the whole `renderer/` directory statically (not just `renderer/network/`) because the network client's HTML pulls in `shared/scroll-engine.js` and `display/display.css` by root-relative path — keep that in mind if restructuring renderer folders.
- **File import** (`file:import` IPC handler in `main.js`) branches on extension: `.pdf` via `pdf-parse`, `.docx` via `mammoth`, everything else read as plain UTF-8 text. This is desktop-only — both mobile UIs (`network/`, `mobile-webrtc/`) only support `.txt`/`.md` import via the browser's `FileReader`, since there's no Node runtime available to run `pdf-parse`/`mammoth` client-side.
