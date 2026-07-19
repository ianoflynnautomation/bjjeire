import fs from 'node:fs';
import path from 'node:path';

import {
  parseIssueForm,
  value,
  checkboxList,
  newObjectId,
  nowIsoUtc,
  slugify,
  setOutput,
} from './issue-form-parser.ts';
import type { Competition } from './types.ts';

const body = process.env.ISSUE_BODY ?? '';
const author = process.env.ISSUE_AUTHOR ?? 'community';

const sections = parseIssueForm(body);

const name = value(sections, 'Competition name');
if (!name) {
  console.error('::error::Issue body is missing "Competition name". Was it submitted via the competition issue form?');
  process.exit(1);
}

const organisation = value(sections, 'Organisation');
if (!organisation) {
  console.error('::error::Issue body is missing "Organisation".');
  process.exit(1);
}

const websiteUrl = value(sections, 'Website URL');
if (!websiteUrl) {
  console.error('::error::Issue body is missing "Website URL".');
  process.exit(1);
}

// "YYYY-MM-DD" -> "YYYY-MM-DDT00:00:00Z"; null if absent/malformed (validate-data will flag).
function toIsoDate(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[0]}T00:00:00Z` : null;
}

const TAG_MAP: Record<string, string> = {
  Gi: 'gi',
  'No-Gi': 'no-gi',
  Kids: 'kids',
  Adults: 'adults',
  IBJJF: 'ibjjf',
  ADCC: 'adcc',
  Open: 'open',
};
const tags = checkboxList(sections, 'Tags')
  .map((t) => TAG_MAP[t])
  .filter((t): t is string => Boolean(t));

const slug = slugify(name);
const competition: Competition = {
  id: newObjectId(),
  slug: slug || newObjectId(),
  name,
  description: value(sections, 'Short description'),
  organisation,
  country: 'Ireland',
  websiteUrl,
  registrationUrl: value(sections, 'Registration URL (optional)'),
  logoUrl: null,
  tags,
  startDate: toIsoDate(value(sections, 'Start date (YYYY-MM-DD)')),
  endDate: toIsoDate(value(sections, 'End date (YYYY-MM-DD, optional)')),
  isActive: true,
  createdBy: `community:@${author}`,
  createdAt: nowIsoUtc(),
  updatedBy: null,
  updatedAt: null,
};

const outPath = path.join('seeder/data/competitions', `${slug || competition.id}.json`);

if (fs.existsSync(outPath)) {
  console.error(`::error::A file already exists at ${outPath}. The competition may already be in the directory.`);
  process.exit(1);
}

fs.writeFileSync(outPath, `${JSON.stringify([competition], null, 2)}\n`);
console.log(`Wrote ${outPath}`);

setOutput('name', name);
setOutput('path', outPath);
