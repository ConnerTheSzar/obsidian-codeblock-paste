import { App, PluginSettingTab, Setting } from "obsidian";
import CodeBlockPaste from "./main";

// ── Settings Interface ──────────────────────────────────────────────
export interface CodeBlockPasteSettings {
	/** Languages enabled for auto-detection */
	enabledLanguages: string[];
	/** Minimum relevance score to accept a detection (0 = accept anything) */
	confidenceThreshold: number;
	/** Fallback language tag when detection confidence is too low */
	fallbackLanguage: string;
}

export const DEFAULT_SETTINGS: CodeBlockPasteSettings = {
	enabledLanguages: [],   // populated on first load from hljs.listLanguages()
	confidenceThreshold: 5,
	fallbackLanguage: "text",
};

// ── Settings Tab ────────────────────────────────────────────────────
export class CodeBlockPasteSettingTab extends PluginSettingTab {
	plugin: CodeBlockPaste;
	private searchQuery = "";

	constructor(app: App, plugin: CodeBlockPaste) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// ── Header ──
		containerEl.createEl("h2", { text: "Code Block Paste Settings" });

		// ── General Settings ──
		new Setting(containerEl)
			.setName("Confidence threshold")
			.setDesc(
				"Minimum relevance score (0–25) for auto-detection. " +
				"Lower = more aggressive guessing. Higher = more cautious."
			)
			.addSlider(slider => slider
				.setLimits(0, 25, 1)
				.setValue(this.plugin.settings.confidenceThreshold)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.confidenceThreshold = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Fallback language")
			.setDesc("Used when detection confidence is below the threshold.")
			.addText(text => text
				.setPlaceholder("text")
				.setValue(this.plugin.settings.fallbackLanguage)
				.onChange(async (value) => {
					this.plugin.settings.fallbackLanguage = value || "text";
					await this.plugin.saveSettings();
				}));

		// ── Language List ──
		containerEl.createEl("h3", { text: "Enabled Languages" });
		containerEl.createEl("p", {
			text: "Select languages for auto-detection. Fewer languages = faster and more accurate.",
			cls: "setting-item-description",
		});

		// Search bar
		new Setting(containerEl)
			.setName("Search languages")
			.addSearch(search => search
				.setPlaceholder("Filter...")
				.setValue(this.searchQuery)
				.onChange(value => {
					this.searchQuery = value.toLowerCase();
					this.renderLanguageList(listContainer);
				}));

		// Bulk actions
		const bulkRow = containerEl.createDiv({ cls: "cbp-bulk-actions" });
		const selectAllBtn = bulkRow.createEl("button", { text: "Select All" });
		selectAllBtn.addEventListener("click", async () => {
			this.plugin.settings.enabledLanguages = [...this.plugin.getAllLanguages()];
			await this.plugin.saveSettings();
			this.renderLanguageList(listContainer);
		});
		const deselectAllBtn = bulkRow.createEl("button", { text: "Deselect All" });
		deselectAllBtn.addEventListener("click", async () => {
			this.plugin.settings.enabledLanguages = [];
			await this.plugin.saveSettings();
			this.renderLanguageList(listContainer);
		});

		// Language toggles container
		const listContainer = containerEl.createDiv({ cls: "cbp-language-list" });
		this.renderLanguageList(listContainer);
	}

	private renderLanguageList(container: HTMLElement): void {
		container.empty();

		const allLanguages = this.plugin.getAllLanguages().sort();
		const filtered = this.searchQuery
			? allLanguages.filter(lang => lang.toLowerCase().includes(this.searchQuery))
			: allLanguages;

		for (const language of filtered) {
			const isEnabled = this.plugin.settings.enabledLanguages.includes(language);

			new Setting(container)
				.setName(language)
				.addToggle(toggle => toggle
					.setValue(isEnabled)
					.onChange(async (value) => {
						if (value) {
							this.plugin.settings.enabledLanguages.push(language);
						} else {
							this.plugin.settings.enabledLanguages =
								this.plugin.settings.enabledLanguages.filter(l => l !== language);
						}
						await this.plugin.saveSettings();
					}));
		}

		if (filtered.length === 0) {
			container.createEl("p", {
				text: "No languages match your search.",
				cls: "cbp-no-results",
			});
		}
	}
}
