# Human Typer - Chrome Extension

A Chrome extension that takes pasted text and types it out character by character with realistic human-like timing. Perfect for:

- Forms that detect and block paste
- Making automated input look more natural
- Testing typing-based interfaces
- Bypassing anti-bot paste detection

## Features

- ⌨️ **Realistic timing** - Variable delays between keystrokes
- 🎲 **Natural variance** - Occasional pauses (thinking) and bursts (fast typing)
- 🔤 **Optional typos** - Adds and corrects typos for extra realism
- ⚙️ **Speed presets** - Slow, Medium, Fast, and Turbo modes
- ⏯️ **Pause/Resume** - Control typing mid-stream
- 📋 **Clipboard integration** - One-click paste from clipboard
- ⌨️ **Keyboard shortcuts** - Start, pause, stop without opening popup
- 📊 **Progress bar** - See typing progress in real-time
- 💾 **Saved settings** - Your preferences persist between sessions

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+T` | Start typing from clipboard |
| `Alt+Shift+P` | Pause/Resume typing |
| `Alt+Shift+S` | Stop typing |

> **Tip:** Customize shortcuts at `chrome://extensions/shortcuts`

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `human-typer-extension` folder

## Usage

### Via Popup
1. Click on an input field, textarea, or contenteditable element
2. Click the Human Typer extension icon
3. Paste your text (or click 📋 to paste from clipboard)
4. Select a speed preset or customize timing
5. Click "Start Typing"
6. Use Pause/Stop buttons to control typing

### Via Keyboard Shortcut
1. Copy text to clipboard
2. Click on an input field
3. Press `Alt+Shift+T` to start typing
4. Press `Alt+Shift+P` to pause/resume
5. Press `Alt+Shift+S` to stop

## Speed Presets

| Preset | Min Delay | Max Delay | Use Case |
|--------|-----------|-----------|----------|
| 🐢 Slow | 80ms | 200ms | Very human-like, careful typing |
| 🚶 Medium | 30ms | 120ms | Normal typing speed (default) |
| 🏃 Fast | 15ms | 50ms | Quick but still realistic |
| ⚡ Turbo | 5ms | 20ms | Speed typing, minimal delays |

## How It Works

- Each character is typed with a random delay between your min and max settings
- 10% chance of a longer "thinking" pause (3x normal delay)
- 20% chance of a "burst" of faster typing (0.5x normal delay)
- Punctuation triggers slightly longer pauses
- End of sentences (. ! ?) have extra pause before the next word
- When typos are enabled, ~3% chance of hitting an adjacent key, then backspacing to fix it

## Permissions

- `activeTab` - To access the currently active tab for typing
- `scripting` - To execute the typing simulation script on the page
- `clipboardRead` - To read text from clipboard (optional, for quick paste)
- `storage` - To save your settings

## Troubleshooting

**"No input field focused"**
- Click on an input field before starting
- Make sure the field is actually editable

**Clipboard button doesn't work**
- Some sites block clipboard access
- Use Ctrl+V to paste manually instead

**Shortcuts not working**
- Check `chrome://extensions/shortcuts` for conflicts
- Make sure no other extension uses the same shortcuts

## License

MIT
