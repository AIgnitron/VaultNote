// ─── Checklist Parsing Utilities ──────────────────────────────
// Checkbox lines in the note body use markdown-style syntax:
//   - [ ] unchecked item
//   - [x] checked item
// All other lines are plain text.

export interface ChecklistItem {
  checked: boolean;
  text: string;
}

const CHECKBOX_REGEX = /^- \[([ x])\] (.*)$/;

/** Check whether the note body contains at least one checkbox line. */
export function hasChecklist(body: string): boolean {
  return body.split('\n').some((line) => CHECKBOX_REGEX.test(line));
}

/** Parse the full body into an ordered list of segments (text blocks & checkbox items). */
export interface BodySegment {
  type: 'text' | 'checklist';
  /** For type=text: the raw lines joined. For type=checklist: unused. */
  content: string;
  /** Only present when type=checklist */
  items?: ChecklistItem[];
}

export function parseBody(body: string): BodySegment[] {
  const lines = body.split('\n');
  const segments: BodySegment[] = [];
  let textBuffer: string[] = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      segments.push({ type: 'text', content: textBuffer.join('\n') });
      textBuffer = [];
    }
  };

  let checklistBuffer: ChecklistItem[] = [];

  const flushChecklist = () => {
    if (checklistBuffer.length > 0) {
      segments.push({ type: 'checklist', content: '', items: checklistBuffer });
      checklistBuffer = [];
    }
  };

  for (const line of lines) {
    const match = line.match(CHECKBOX_REGEX);
    if (match) {
      flushText();
      checklistBuffer.push({ checked: match[1] === 'x', text: match[2] });
    } else {
      flushChecklist();
      textBuffer.push(line);
    }
  }
  flushText();
  flushChecklist();

  return segments;
}

/** Serialize segments back to a plain body string. */
export function serializeBody(segments: BodySegment[]): string {
  return segments
    .map((seg) => {
      if (seg.type === 'text') return seg.content;
      if (seg.type === 'checklist' && seg.items) {
        return seg.items
          .map((item) => `- [${item.checked ? 'x' : ' '}] ${item.text}`)
          .join('\n');
      }
      return '';
    })
    .join('\n');
}

/** Quick helper: toggle a specific checkbox by its global index across all segments. */
export function toggleChecklistItem(segments: BodySegment[], globalIndex: number): BodySegment[] {
  let counter = 0;
  return segments.map((seg) => {
    if (seg.type !== 'checklist' || !seg.items) return seg;
    const newItems = seg.items.map((item) => {
      const idx = counter++;
      if (idx === globalIndex) return { ...item, checked: !item.checked };
      return item;
    });
    return { ...seg, items: newItems };
  });
}

/** Update the text of a specific checkbox by global index. */
export function updateChecklistItemText(segments: BodySegment[], globalIndex: number, text: string): BodySegment[] {
  let counter = 0;
  return segments.map((seg) => {
    if (seg.type !== 'checklist' || !seg.items) return seg;
    const newItems = seg.items.map((item) => {
      const idx = counter++;
      if (idx === globalIndex) return { ...item, text };
      return item;
    });
    return { ...seg, items: newItems };
  });
}

/** Remove a checklist item by global index. */
export function removeChecklistItem(segments: BodySegment[], globalIndex: number): BodySegment[] {
  let counter = 0;
  return segments
    .map((seg) => {
      if (seg.type !== 'checklist' || !seg.items) return seg;
      const newItems = seg.items.filter(() => {
        const idx = counter++;
        return idx !== globalIndex;
      });
      // Remove the segment entirely if no items remain
      if (newItems.length === 0) return null;
      return { ...seg, items: newItems };
    })
    .filter(Boolean) as BodySegment[];
}

/** Append a new empty checklist item. If the last segment is a checklist, add to it; otherwise create a new segment. */
export function addChecklistItem(segments: BodySegment[], text = ''): BodySegment[] {
  const newSegments = [...segments];
  const last = newSegments[newSegments.length - 1];
  if (last && last.type === 'checklist' && last.items) {
    return [
      ...newSegments.slice(0, -1),
      { ...last, items: [...last.items, { checked: false, text }] },
    ];
  }
  return [
    ...newSegments,
    { type: 'checklist', content: '', items: [{ checked: false, text }] },
  ];
}

/** Get summary counts for preview display. */
export function getChecklistSummary(body: string): { total: number; checked: number } | null {
  const lines = body.split('\n');
  let total = 0;
  let checked = 0;
  for (const line of lines) {
    const match = line.match(CHECKBOX_REGEX);
    if (match) {
      total++;
      if (match[1] === 'x') checked++;
    }
  }
  return total > 0 ? { total, checked } : null;
}
