// Modern helper function for resolving latest dynamic update timestamps
export function getLatestUpdatedAt(items = []) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const validTimestamps = items
    .map((item) => (item?.updated_at ? new Date(item.updated_at).getTime() : NaN))
    .filter((time) => Number.isFinite(time) && !Number.isNaN(time));

  if (validTimestamps.length === 0) return null;

  return new Date(Math.max(...validTimestamps)).toISOString();
}
