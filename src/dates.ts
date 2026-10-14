// Pure date helpers. No I/O.

/** Calendar date in the device's time zone, as YYYY-MM-DD. */
export function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local time as HH:MM:SS. */
export function localTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Device's IANA time zone, e.g. "America/Los_Angeles" or "Asia/Kolkata". */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
}

/** Device's offset from UTC at instant d, as "UTC-07:00" or "UTC+05:30". */
export function utcOffset(d: Date): string {
  const minutes = -d.getTimezoneOffset();
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
