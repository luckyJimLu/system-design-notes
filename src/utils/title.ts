/** Keep navigation and compact headers readable without changing source metadata. */
export function truncateTitle(title: string, maxLength = 20): string {
  const characters = Array.from(title);
  if (characters.length <= maxLength) return title;
  return `${characters.slice(0, Math.max(0, maxLength - 1)).join('')}…`;
}
