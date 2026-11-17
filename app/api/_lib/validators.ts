const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Kiểm tra chuỗi ngày dạng YYYY-MM-DD và là ngày hợp lệ. */
export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

export function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
