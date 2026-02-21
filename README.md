# Code Block Paste

An Obsidian plugin that lets you paste clipboard content as an auto-detected fenced code block — or wrap selected text the same way.

## Features

- **Paste as Code Block** — Reads your clipboard, detects the programming language, and inserts a properly fenced code block.
- **Wrap Selection** — Highlight existing text and wrap it in a code block with auto-detected language.
- **Right-Click Menu** — "Paste as code block" is available directly from the editor context menu.
- **Configurable Detection** — Adjust the confidence threshold to control how aggressively language detection guesses. Set a fallback language for when detection isn't confident enough.
- **Searchable Language Settings** — Enable or disable specific languages for detection. Includes bulk Select All / Deselect All.

## Usage

### Paste from Clipboard

1. Copy some code to your clipboard.
2. In Obsidian, open the Command Palette (`Ctrl/Cmd + P`).
3. Run **"Paste as code block"**.
4. The code is inserted as a fenced block with the detected language.

Alternatively, **right-click** in the editor and select **"Paste as code block"**.

### Wrap Selected Text

1. Highlight some text in your note.
2. Open the Command Palette (`Ctrl/Cmd + P`).
3. Run **"Wrap selection as code block"**.

If nothing is selected, an empty code block is inserted with your cursor placed inside.

## Settings

| Setting | Description | Default |
| --- | --- | --- |
| **Confidence Threshold** | Minimum relevance score (0–25) for auto-detection. Higher = more cautious. | `5` |
| **Fallback Language** | Language tag used when detection confidence is too low. | `text` |
| **Enabled Languages** | Toggle individual languages on/off for detection. Searchable with bulk actions. | All common languages enabled |

## Installation

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/Conner1209/obsidian-codeblock-paste/releases).
2. Create a folder: `<your-vault>/.obsidian/plugins/obsidian-codeblock-paste/`
3. Place the downloaded files in that folder.
4. Reload Obsidian and enable the plugin in Settings → Community Plugins.

## Development

```bash
# Install dependencies
npm install

# Development build (watches for changes)
npm run dev

# Production build
npm run build
```

## Credits

Language detection powered by [highlight.js](https://highlightjs.org/).
