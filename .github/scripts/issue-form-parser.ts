// Shared helpers for parsing GitHub issue-form output.
// Issue forms produce markdown bodies like:
//   ### Gym name
//
//   SBG Ireland
//
//   ### Website
//
//   https://example.com
//
//   ### Classes offered
//
//   - [x] BJJ Gi — All Levels
//   - [ ] Wrestling
//
// Empty fields are rendered as `_No response_`.
//
// Runs directly under Node's native TypeScript type-stripping (Node >= 23.6),
// which the issue-to-pr workflow provides via the node:26 container.

import crypto from 'node:crypto';
import fs from 'node:fs';

/** Heading (lowercased) -> trimmed section body. */
export type Sections = Record<string, string>;

export function parseIssueForm(body: string): Sections {
  const sections: Sections = {};
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  let currentHeading: string | null = null;
  let buffer: string[] = [];

  const flush = (): void => {
    if (currentHeading) {
      sections[currentHeading] = buffer.join('\n').trim();
    }
  };

  for (const line of lines) {
    const m = line.match(/^###\s+(.*?)\s*$/);
    if (m) {
      flush();
      currentHeading = m[1].toLowerCase();
      buffer = [];
    } else if (currentHeading) {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

export function value(sections: Sections, key: string, fallback: string | null = null): string | null {
  const v = sections[key.toLowerCase()];
  if (!v || v === '_No response_') return fallback;
  return v;
}

export function checkboxList(sections: Sections, key: string): string[] {
  const v = sections[key.toLowerCase()];
  if (!v || v === '_No response_') return [];
  const out: string[] = [];
  for (const line of v.split('\n')) {
    const m = line.match(/^-\s*\[x\]\s+(.+?)\s*$/i);
    if (m) out.push(m[1]);
  }
  return out;
}

// Mongo-style ObjectId: 4-byte seconds timestamp + 8 random bytes (24 hex).
// Time-ordered like ObjectId.GenerateNewId() and a valid BsonType.ObjectId.
// Generated once at authoring time and persisted in the JSON so the seeder's
// upsert-by-Id + prune stays idempotent across re-seeds — never regenerate.
export function newObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');
  return timestamp + crypto.randomBytes(8).toString('hex');
}

export function nowIsoUtc(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

// Strict slug: lowercase, ascii alphanumeric, hyphens, max 80 chars.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Extract coordinates from a raw pair OR a pasted Google Maps link, returning
// [lng, lat] in GeoJSON order. Accepts, in order of preference:
//   - a Maps place URL:  ...!3d53.3178!4d-6.3731
//   - a Maps view/share URL:  .../@53.3178,-6.3731,15z
//   - a query URL:  ?q=53.3178,-6.3731  (also query=/ll=/daddr=)
//   - a bare pair:  "53.3178, -6.3731"  or  "-6.3731, 53.3178"
// Order is normalised using Ireland's sign signature (lng always negative, lat
// always positive), so contributors can paste either order — including the
// lat,lng that Google Maps copies by default — and still get valid GeoJSON.
export function parseCoordinates(raw: string | null | undefined): [number, number] | null {
  if (!raw) return null;
  const text = String(raw).trim();

  let a: number;
  let b: number;
  const url =
    text.match(/!3d(-?\d[\d.]*)!4d(-?\d[\d.]*)/) || // place URL (lat, lng)
    text.match(/@(-?\d[\d.]*),(-?\d[\d.]*)/) || //     @lat,lng
    text.match(/[?&#](?:q|query|ll|daddr)=(-?\d[\d.]*),(-?\d[\d.]*)/i); // q=lat,lng
  if (url) {
    a = parseFloat(url[1]);
    b = parseFloat(url[2]);
  } else {
    const parts = text
      .split(/[,\s]+/)
      .map((p) => parseFloat(p))
      .filter((n) => !Number.isNaN(n));
    if (parts.length !== 2) return null;
    [a, b] = parts;
  }
  if (Number.isNaN(a) || Number.isNaN(b)) return null;

  // Normalise to [lng, lat] via Ireland's sign heuristic.
  if (a < 0 && b >= 0) return [a, b]; // (lng, lat) already
  if (a >= 0 && b < 0) return [b, a]; // (lat, lng) -> flip
  return [a, b]; // ambiguous (same sign) — bbox check will reject if wrong
}

// GitHub Action output helper.
export function setOutput(name: string, value: string): void {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) {
    console.log(`(no GITHUB_OUTPUT) ${name}=${value}`);
    return;
  }
  // Multiline-safe via heredoc.
  const delim = `EOF_${crypto.randomBytes(8).toString('hex')}`;
  fs.appendFileSync(file, `${name}<<${delim}\n${value}\n${delim}\n`);
}
