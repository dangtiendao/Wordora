import { AppSettings, UpdateAppSettingsInput } from '../entities/app-settings';

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  update(input: UpdateAppSettingsInput): Promise<AppSettings>;
  resetToDefault(): Promise<AppSettings>;
}
