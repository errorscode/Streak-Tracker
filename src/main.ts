import { App, Plugin, PluginSettingTab, Setting, TFile, Notice } from 'obsidian';

interface StreakPluginSettings {
	lastUsedDate: string; // ISO date string of last usage
	streak: number;
}

const DEFAULT_SETTINGS: StreakPluginSettings = {
	lastUsedDate: '',
	streak: 0,
};

export default class StreakPlugin extends Plugin {
	settings!: StreakPluginSettings;

	async onload() {
		await this.loadSettings();

		// Track usage when app is opened
		this.trackStreak();

		// Add a settings tab
		this.addSettingTab(new StreakSettingTab(this.app, this));
	}

	async trackStreak() {
		const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		const lastDate = this.settings.lastUsedDate;

		if (!lastDate) {
			// First time using the plugin
			this.settings.streak = 1;
			new Notice(`Welcome! Your streak is ${this.settings.streak} day(s).`);
		} else {
			const last = new Date(lastDate);
			const diffDays = this.dateDiffInDays(last, new Date());

			if (diffDays === 0) {
				// Already used today, do nothing
				return;
			} else if (diffDays === 1) {
				// Streak continues
				this.settings.streak += 1;
				new Notice(`Great! Your streak continues: ${this.settings.streak} day(s).`);
			} else if (diffDays > 1) {
				// Streak broken
				this.settings.streak = 1;
				new Notice(`You missed ${diffDays - 1} day(s). Streak reset to 1.`);
			}
		}

		this.settings.lastUsedDate = today;
		await this.saveSettings();
	}

	// Helper to calculate difference in full days
	dateDiffInDays(a: Date, b: Date) {
		const _MS_PER_DAY = 1000 * 60 * 60 * 24;
		const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
		const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
		return Math.floor((utc2 - utc1) / _MS_PER_DAY);
	}

	onunload() {
		console.log('Streak Plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class StreakSettingTab extends PluginSettingTab {
	plugin: StreakPlugin;

	constructor(app: App, plugin: StreakPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'Streak Plugin Settings' });

		new Setting(containerEl)
			.setName('Current Streak')
			.setDesc('Shows your current streak in days')
			.addButton(button => button
				.setButtonText(`${this.plugin.settings.streak} day(s)`)
				.setDisabled(true)
			);

		new Setting(containerEl)
			.setName('Reset Streak')
			.setDesc('Manually reset your streak to 0')
			.addButton(button => button
				.setButtonText('Reset')
				.onClick(async () => {
					this.plugin.settings.streak = 0;
					this.plugin.settings.lastUsedDate = '';
					await this.plugin.saveSettings();
					new Notice('Streak reset to 0.');
					this.display();
				})
			);
	}
}
