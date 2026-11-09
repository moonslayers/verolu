export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export interface HighlightSegment {
  readonly text: string;
  readonly isMatch: boolean;
}

export function getHighlightSegments(text: string, query: string): HighlightSegment[] {
  if (!query) return [{ text, isMatch: false }];
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [{ text, isMatch: false }];
  const normalizedText = normalizeText(text);
  const qLen = normalizedQuery.length;
  if (qLen === 0) return [{ text, isMatch: false }];

  const segments: HighlightSegment[] = [];
  let pos = 0;
  let idx = normalizedText.indexOf(normalizedQuery);

  // Map normalized index back to original: since accent stripping preserves length (NFD removes marks), indices align.
  // For safety, assume 1:1 length after strip (true for our data).
  while (idx !== -1) {
    if (idx > pos) {
      segments.push({ text: text.slice(pos, idx), isMatch: false });
    }
    segments.push({ text: text.slice(idx, idx + qLen), isMatch: true });
    pos = idx + qLen;
    idx = normalizedText.indexOf(normalizedQuery, pos);
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), isMatch: false });
  }
  if (segments.length === 0) return [{ text, isMatch: false }];
  return segments;
}

export function isCellMatching(
  params: { room?: string; dayLabel: string; periodLabel: string; subject: string },
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return false;
  const fields = [params.room ?? '', params.dayLabel, params.periodLabel, params.subject];
  return fields.some((f) => normalizeText(f).includes(normalizedQuery));
}
