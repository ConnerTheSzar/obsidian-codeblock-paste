import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { CodeBlockPasteSettings, CodeBlockPasteSettingTab, DEFAULT_SETTINGS } from "./settings";

// We use the "common" subset (~30 languages) to keep bundle size small
import hljs from "highlight.js/lib/common";

export default class CodeBlockPaste extends Plugin {
	settings: CodeBlockPasteSettings;

	async onload() {
		await this.loadSettings();

		// ── Command: Paste as Code Block ────────────────────────────
		// Reads clipboard text, detects language, pastes as fenced code block.
		this.addCommand({
			id: "paste-as-code-block",
			name: "Paste as code block",
			editorCallback: async (editor: Editor) => {
				try {
					const clipboardText = await navigator.clipboard.readText();
					if (!clipboardText) {
						new Notice("Clipboard is empty or contains non-text data.");
						return;
					}
					if (this.isInsideCodeBlock(editor)) {
						editor.replaceSelection(clipboardText.trim());
						new Notice("Pasted raw text (already inside a code block).");
						return;
					}
					const language = this.detectLanguage(clipboardText);
					const codeBlock = this.wrapInCodeBlock(clipboardText, language);
					editor.replaceSelection(codeBlock);
				} catch (err) {
					console.error("Code Block Paste: clipboard error", err);
					new Notice("Could not read clipboard.");
				}
			},
		});

		// ── Command: Wrap Selection as Code Block ───────────────────
		// Takes highlighted text, detects language, replaces with fenced code block.
		this.addCommand({
			id: "wrap-selection-as-code-block",
			name: "Wrap selection as code block",
			editorCallback: (editor: Editor) => {
				if (this.isInsideCodeBlock(editor)) {
					new Notice("Already inside a code block.");
					return;
				}
				const selection = editor.getSelection();
				if (!selection) {
					const cursor = editor.getCursor();
					editor.replaceRange("```\n\n```\n", cursor);
					editor.setCursor({ line: cursor.line + 1, ch: 0 });
					return;
				}
				const language = this.detectLanguage(selection);
				editor.replaceSelection(this.wrapInCodeBlock(selection, language));
			},
		});

		// ── Right-Click Context Menu ────────────────────────────────
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				menu.addItem((item) => {
					item.setTitle("Paste as code block")
						.setIcon("code")
						.onClick(async () => {
							try {
								const clipboardText = await navigator.clipboard.readText();
								if (!clipboardText) {
									new Notice("Clipboard is empty or contains non-text data.");
									return;
								}
								if (this.isInsideCodeBlock(editor)) {
									editor.replaceSelection(clipboardText.trim());
									new Notice("Pasted raw text (already inside a code block).");
									return;
								}
								const language = this.detectLanguage(clipboardText);
								editor.replaceSelection(this.wrapInCodeBlock(clipboardText, language));
							} catch (err) {
								console.error("Code Block Paste: clipboard error", err);
								new Notice("Could not read clipboard.");
							}
						});
				});
			})
		);

		// ── Settings Tab ────────────────────────────────────────────
		this.addSettingTab(new CodeBlockPasteSettingTab(this.app, this));
	}

	onunload() {
		// Obsidian automatically cleans up commands, events, and settings tabs.
	}
	// ── Helpers ─────────────────────────────────────────────────────

	/**
	 * Check if the cursor is currently inside a fenced code block.
	 * Scans upward from the cursor, counting opening/closing fences.
	 */
	isInsideCodeBlock(editor: Editor): boolean {
		const cursor = editor.getCursor();
		let fenceCount = 0;

		for (let i = 0; i <= cursor.line; i++) {
			const line = editor.getLine(i).trim();
			if (line.match(/^`{3,}/)) {
				fenceCount++;
			}
		}

		// Odd count = we're inside an open fence
		return fenceCount % 2 === 1;
	}

	// ── Core Logic ──────────────────────────────────────────────────

	/**
	 * Detect the programming language of a text snippet.
	 * Returns the detected language tag or the configured fallback.
	 */
	detectLanguage(text: string): string {
		// If no languages enabled, skip detection entirely
		if (this.settings.enabledLanguages.length === 0) {
			return this.settings.fallbackLanguage;
		}

		const result = hljs.highlightAuto(text, this.settings.enabledLanguages);

		if (result.relevance < this.settings.confidenceThreshold) {
			return this.settings.fallbackLanguage;
		}

		return result.language ?? this.settings.fallbackLanguage;
	}

	/**
	 * Wrap text in a Markdown fenced code block.
	 */
	wrapInCodeBlock(text: string, language: string): string {
		const trimmed = text.trim();

		// Find the longest consecutive run of backticks in the text
		const backtickRuns = trimmed.match(/`+/g);
		const maxRun = backtickRuns
			? Math.max(...backtickRuns.map(r => r.length))
			: 0;

		// Use at least 3 backticks, or one more than the longest run found
		const fenceLength = Math.max(3, maxRun + 1);
		const fence = "`".repeat(fenceLength);

		return `${fence}${language}\n${trimmed}\n${fence}\n`;
	}

	/**
	 * Get the full list of languages registered with highlight.js.
	 */
	getAllLanguages(): string[] {
		return hljs.listLanguages();
	}

	// ── Settings Persistence ────────────────────────────────────────

	async loadSettings() {
		const saved = await this.loadData() as Partial<CodeBlockPasteSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);

		// First-time setup: enable all common languages by default
		if (this.settings.enabledLanguages.length === 0) {
			this.settings.enabledLanguages = hljs.listLanguages();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
