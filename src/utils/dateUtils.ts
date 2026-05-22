const MONTH_ABBREVS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Formats an ISO date string to "MMM D, YYYY" (e.g. "Jan 5, 2024").
 * Works with both full ISO timestamps and date-only strings (YYYY-MM-DD).
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '';
  try {
    // Parse as local date to avoid off-by-one from UTC interpretation
    const [datePart] = isoString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const monthName = MONTH_ABBREVS[month - 1] ?? '';
    return `${monthName} ${day}, ${year}`;
  } catch {
    return isoString;
  }
}

/**
 * Formats an ISO date string to "MM/DD/YYYY" (e.g. "01/05/2024").
 */
export function formatDateShort(isoString: string): string {
  if (!isoString) return '';
  try {
    const [datePart] = isoString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${mm}/${dd}/${year}`;
  } catch {
    return isoString;
  }
}

/**
 * Returns today's date as a date-only ISO string (YYYY-MM-DD).
 */
export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns true if the given ISO date string represents today's date.
 */
export function isToday(isoString: string): boolean {
  if (!isoString) return false;
  try {
    const [datePart] = isoString.split('T');
    return datePart === getTodayISO();
  } catch {
    return false;
  }
}
