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
				const selection = editor.getSelection();
				if (!selection) {
					// Nothing selected — insert an empty code block and place cursor inside
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

	// ── Core Logic ──────────────────────────────────────────────────

	/**
	 * Detect the programming language of a text snippet.
	 * Returns the detected language tag or the configured fallback.
	 */
	detectLanguage(text: string): string {
		const subset = this.settings.enabledLanguages.length > 0
			? this.settings.enabledLanguages
			: undefined; // undefined = use all registered languages

		const result = hljs.highlightAuto(text, subset);

		if (result.relevance < this.settings.confidenceThreshold) {
			return this.settings.fallbackLanguage;
		}

		return result.language ?? this.settings.fallbackLanguage;
	}

	/**
	 * Wrap text in a Markdown fenced code block.
	 */
	wrapInCodeBlock(text: string, language: string): string {
		return `\`\`\`${language}\n${text}\n\`\`\`\n`;
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
