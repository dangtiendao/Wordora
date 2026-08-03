import { SettingsRepository } from '@/domain/repositories/settings-repository';
import { AppSettings, DEFAULT_APP_SETTINGS, UpdateAppSettingsInput } from '@/domain/entities/app-settings';
import { WordoraDatabase } from '../database/wordora-db';
import { getCurrentISOString } from '@/lib/date';

export class DexieSettingsRepository implements SettingsRepository {
  private readonly SETTINGS_ID = 'default';

  constructor(private db: WordoraDatabase) {}

  async get(): Promise<AppSettings> {
    const existing = await this.db.settings.get(this.SETTINGS_ID);
    if (!existing) {
      const initial: AppSettings = {
        ...DEFAULT_APP_SETTINGS,
        updatedAt: getCurrentISOString(),
      };
      await this.db.settings.put(initial);
      return initial;
    }
    return existing;
  }

  async update(input: UpdateAppSettingsInput): Promise<AppSettings> {
    const current = await this.get();
    const updated: AppSettings = {
      ...current,
      ...input,
      id: this.SETTINGS_ID,
      updatedAt: getCurrentISOString(),
    };

    await this.db.settings.put(updated);
    return updated;
  }

  async resetToDefault(): Promise<AppSettings> {
    const reset: AppSettings = {
      ...DEFAULT_APP_SETTINGS,
      updatedAt: getCurrentISOString(),
    };
    await this.db.settings.put(reset);
    return reset;
  }
}
