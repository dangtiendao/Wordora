export type NavigationItem = {
  label: string;
  href: string;
  iconName: string;
  exact?: boolean;
};

/**
 * Ràng buộc cơ bản cho các entity lưu trữ bền vững (persisted entity) trong hệ thống Wordora.
 *
 * @remarks
 * - **CONTRACT**: Mỗi entity lưu trữ đều sở hữu ID định danh duy nhất (chuỗi UUID v4) cùng các mốc thời gian tạo/cập nhật.
 * - **INVARIANT**: `createdAt` và `updatedAt` bắt buộc phải sử dụng định dạng ISO 8601 chuẩn UTC (ví dụ: `2026-08-04T12:00:00.000Z`).
 */
export type BaseEntity = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

