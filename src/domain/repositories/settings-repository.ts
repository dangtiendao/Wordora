import { AppSettings, UpdateAppSettingsInput } from '../entities/app-settings';

/**
 * Hợp đồng Repository quản lý lưu trữ Cấu hình ứng dụng Singleton (AppSettings).
 *
 * @remarks
 * - **CONTRACT & SINGLETON PATTERN**:
 *   - `get()`: Truy xuất cấu hình duy nhất của ứng dụng. Nếu cơ sở dữ liệu chưa có bản ghi cấu hình nào (lần đầu khởi chạy), BẮT BUỘC tự động khởi tạo bản ghi `DEFAULT_APP_SETTINGS` và trả về.
 *   - `update(input)`: Cập nhật một phần cấu hình và tự động gán mốc thời gian `updatedAt` hiện tại chuẩn ISO 8601 UTC.
 *   - `resetToDefault()`: Khôi phục cấu hình ứng dụng về trạng thái mặc định ban đầu (`DEFAULT_APP_SETTINGS`).
 */
export interface SettingsRepository {
  get(): Promise<AppSettings>;
  update(input: UpdateAppSettingsInput): Promise<AppSettings>;
  resetToDefault(): Promise<AppSettings>;
}

