# AGENTS.md - Human Typer Extension

## Project Overview

**Human Typer** is a Chrome extension that simulates realistic human typing from pasted text. Users paste text and it gets "typed" character by character with natural timing, pauses, and optional typos.

## Key Files

- `manifest.json` - Chrome extension manifest (v3)
- `sidepanel.html` - Main UI (side panel that slides from right)
- `popup.html` - Backup popup version
- `popup.js` - All UI logic, state management, paywall
- `content.js` - Injected script that does the actual typing
- `background.js` - Service worker for shortcuts and side panel

## Tech Stack

- Vanilla JS (no framework)
- Chrome Extension Manifest V3
- Chrome Side Panel API
- Chrome Storage API

## Current State

Version 1.2.0 with:
- Full typing simulation with realistic timing
- Side panel UI
- 90-word free limit with paywall
- Pro upgrade (currently just stores flag locally - no real payment yet)

## Before Working

1. **Read ROADMAP.md** for current status and upcoming features
2. Test changes by loading unpacked extension in Chrome
3. The side panel requires clicking the extension icon to open

## Important Notes

- Side panel HTML is `sidepanel.html`, not `popup.html`
- Both files should stay in sync for now
- Pro status stored in `chrome.storage.local` under `isPro` key
- Word limit is 90 words (constant `WORD_LIMIT` in popup.js)

## Testing

1. Go to `chrome://extensions`
2. Enable Developer mode
3. Load unpacked → select this folder
4. Click extension icon to open side panel
5. Test on any page with input fields (e.g., google.com)
