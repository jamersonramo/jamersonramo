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

- **Three renderer surfaces share one animation engine.** The control window (script editor + settings), the Electron display window (fullscreen/second-monitor output), and the network client (plain browser page served to phones/tablets on the same Wi-Fi) all render scrolling text via `src/renderer/shared/scroll-engine.js`. Each surface runs its own `requestAnimationFrame` loop locally rather than being driven frame-by-frame from the main process — this keeps scrolling smooth under network latency. The main process only pushes full state syncs and one-off commands (`reset`, `nudge`); it never streams position.
- **State lives in `src/main.js`**, fanned out over two transports: Electron IPC (`state:sync` / `scroll:command`) to BrowserWindows, and WebSocket (`src/server.js`) to network clients. Any state change must go through `broadcastAll()`/`sendCommand()` in `main.js` so both transports stay in sync.
- **Remote control (keyboard + gamepad) is fully configurable**, not hardcoded. `src/settings-store.js` persists per-action key/gamepad bindings to disk (Electron `userData`); `src/renderer/shared/remote-control.js` provides the shared capture/matching logic (`eventToAccelerator`, `watchGamepads`) used by both the control window's remapping UI and the display window's local fallback listener. Global OS-level keyboard shortcuts (via `globalShortcut`) are only registered while the display window is open, specifically so they don't swallow normal typing in the script editor.
- **The network mirror server** (`src/server.js`) serves the whole `renderer/` directory statically (not just `renderer/network/`) because the network client's HTML pulls in `shared/scroll-engine.js` and `display/display.css` by root-relative path — keep that in mind if restructuring renderer folders.
- **File import** (`file:import` IPC handler in `main.js`) branches on extension: `.pdf` via `pdf-parse`, `.docx` via `mammoth`, everything else read as plain UTF-8 text.
