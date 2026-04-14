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

import crypto from 'node:crypto';
import fs from 'node:fs';

export function parseIssueForm(body) {
  const sections = {};
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  let currentHeading = null;
  let buffer = [];

  const flush = () => {
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

export function value(sections, key, fallback = null) {
  const v = sections[key.toLowerCase()];
  if (!v || v === '_No response_') return fallback;
  return v;
}

export function checkboxList(sections, key) {
  const v = sections[key.toLowerCase()];
  if (!v || v === '_No response_') return [];
  const out = [];
  for (const line of v.split('\n')) {
    const m = line.match(/^-\s*\[x\]\s+(.+?)\s*$/i);
    if (m) out.push(m[1]);
  }
  return out;
}

export function newObjectId() {
  return crypto.randomBytes(12).toString('hex');
}

export function nowIsoUtc() {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

// Strict slug: lowercase, ascii alnum, hyphens, max 80 chars.
export function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Parse "lng, lat" or "lat, lng" — returns [lng, lat] in GeoJSON order.
// Heuristic: Ireland longitude is in [-10.8, -5.2]. If the first number is
// negative, treat input as already (lng, lat). Otherwise treat as (lat, lng).
export function parseCoordinates(raw) {
  if (!raw) return null;
  const parts = raw.split(/[,\s]+/).map((p) => parseFloat(p)).filter((n) => !Number.isNaN(n));
  if (parts.length !== 2) return null;
  const [a, b] = parts;
  if (a < 0) return [a, b]; // already (lng, lat)
  return [b, a]; // (lat, lng) → flip
}

// GitHub Action output helper.
export function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) {
    console.log(`(no GITHUB_OUTPUT) ${name}=${value}`);
    return;
  }
  // Multiline-safe via heredoc.
  const delim = `EOF_${crypto.randomBytes(8).toString('hex')}`;
  fs.appendFileSync(file, `${name}<<${delim}\n${value}\n${delim}\n`);
}
