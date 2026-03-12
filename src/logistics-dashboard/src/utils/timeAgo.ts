/**
 * Returns a human-readable relative time string for the given ISO date.
 *
 * - < 60 seconds  -> "Just now"
 * - < 60 minutes  -> "Xm ago"
 * - < 24 hours    -> "Xh ago"
 * - < 48 hours    -> "Yesterday"
 * - otherwise     -> short date (e.g. "Mar 12")
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return "Just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffHours < 48) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
