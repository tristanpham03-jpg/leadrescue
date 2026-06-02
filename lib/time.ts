const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absMs < minute) return "Just now";
  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  return rtf.format(Math.round(diffMs / day), "day");
}

export function formatFullTimestamp(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const datePart = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
  return `${datePart} • ${timePart}`;
}

export function formatLeadAge(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Math.max(0, Date.now() - date.getTime());
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  if (diffMs < hour) return "Lead age: less than 1 hour";
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `Lead age: ${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  const days = Math.floor(diffMs / day);
  return `Lead age: ${days} ${days === 1 ? "day" : "days"}`;
}

export function formatWaitingDuration(value: string | Date) {
  return formatLeadAge(value).replace("Lead age:", "Waiting:").trim();
}
