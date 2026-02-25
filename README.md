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
- ⚙️ **Configurable speed** - Adjust min/max delay between characters
- 📝 **Works everywhere** - Supports input, textarea, and contenteditable elements

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `human-typer-extension` folder

### Generate Icons (Optional)

The extension needs icon files. You can create simple ones or use any 16x16, 48x48, and 128x128 PNG files:

```bash
# Using ImageMagick to create placeholder icons
convert -size 16x16 xc:#5956e9 icons/icon16.png
convert -size 48x48 xc:#5956e9 icons/icon48.png  
convert -size 128x128 xc:#5956e9 icons/icon128.png
```

## Usage

1. Click on an input field, textarea, or contenteditable element on any webpage
2. Click the Human Typer extension icon
3. Paste your text in the popup
4. Adjust timing settings if needed:
   - **Min delay**: Minimum milliseconds between keystrokes (default: 30ms)
   - **Max delay**: Maximum milliseconds between keystrokes (default: 120ms)
   - **Add typos**: Enable for occasional typos that get corrected (more human-like)
5. Click "Start Typing"

The text will be typed out character by character with realistic timing!

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

## License

MIT
