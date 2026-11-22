/** 明信片故事：同一张明信片永远用同一个模板。 */

export function hashText(text: string): number {
  let value = 0;
  for (const ch of text) value = (value * 31 + ch.codePointAt(0)!) >>> 0;
  return value;
}

export function pickTemplate(tripId: string, templates: string[]): string {
  if (templates.length === 0) return '';
  return templates[hashText(tripId) % templates.length];
}

export function visitedCount(destinationIds: string[]): number {
  return new Set(destinationIds).size;
}