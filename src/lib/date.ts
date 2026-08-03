/**
 * Returns current timestamp formatted strictly as ISO 8601 UTC string.
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Safely converts Date, timestamp string, or number to ISO 8601 UTC string.
 */
export function toISOString(date: Date | string | number): string {
  return new Date(date).toISOString();
}

/**
 * Formats date for display in Vietnamese standard format (DD/MM/YYYY).
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
