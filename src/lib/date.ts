/**
 * Lấy mốc thời gian hiện tại định dạng chuẩn ISO 8601 UTC string.
 *
 * @returns Chuỗi thời gian (ví dụ: "2026-08-05T00:00:00.000Z").
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Chuyển đổi an toàn đối tượng Date, timestamp string hoặc number thành chuỗi chuẩn ISO 8601 UTC.
 *
 * @param date - Thời gian đầu vào.
 * @returns Chuỗi ISO 8601 UTC.
 */
export function toISOString(date: Date | string | number): string {
  return new Date(date).toISOString();
}

/**
 * Định dạng mốc thời gian phục vụ hiển thị người dùng theo chuẩn Việt Nam (DD/MM/YYYY).
 *
 * @param dateInput - Thời gian đầu vào.
 * @param options - Tùy chọn định dạng Intl.DateTimeFormat.
 * @returns Chuỗi ngày hiển thị hoặc `'N/A'` nếu dữ liệu thời gian không hợp lệ.
 */
export function formatDate(dateInput: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options,
    };
    return new Intl.DateTimeFormat('vi-VN', defaultOptions).format(date);
  } catch {
    return 'N/A';
  }
}

