import { SettingsRepository } from '@/domain/repositories/settings-repository';
import { AppSettings, DEFAULT_APP_SETTINGS, UpdateAppSettingsInput } from '@/domain/entities/app-settings';
import { WordoraDatabase } from '../database/wordora-db';
import { getCurrentISOString } from '@/lib/date';

/**
 * Lớp triển khai Repository Cấu hình ứng dụng (SettingsRepository) lưu trữ dạng Singleton trên Dexie.js.
 */
export class DexieSettingsRepository implements SettingsRepository {
  private readonly SETTINGS_ID = 'default';

  constructor(private db: WordoraDatabase) {}

  /**
   * Truy xuất bản ghi cấu hình Singleton duy nhất (`id = 'default'`).
   *
   * @remarks
   * - **AUTO INITIALIZATION**: Nếu cơ sở dữ liệu mới khởi tạo (chưa có bản ghi `default`), hàm tự động ghi nhận `DEFAULT_APP_SETTINGS` kèm mốc `updatedAt` hiện tại xuống IndexedDB và trả về.
   */
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

  /**
   * Cập nhật một phần cấu hình và lưu lại.
   */
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

  /**
   * Khôi phục cài đặt ứng dụng về giá trị mặc định ban đầu (`DEFAULT_APP_SETTINGS`).
   */
  async resetToDefault(): Promise<AppSettings> {
    const reset: AppSettings = {
      ...DEFAULT_APP_SETTINGS,
      updatedAt: getCurrentISOString(),
    };
    await this.db.settings.put(reset);
    return reset;
  }
}

