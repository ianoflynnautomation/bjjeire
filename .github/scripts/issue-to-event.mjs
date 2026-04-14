import fs from 'node:fs';
import path from 'node:path';

import {
  parseIssueForm,
  value,
  newObjectId,
  nowIsoUtc,
  slugify,
  setOutput,
} from './issue-form-parser.mjs';

const body = process.env.ISSUE_BODY ?? '';
const author = process.env.ISSUE_AUTHOR ?? 'community';

const sections = parseIssueForm(body);

const name = value(sections, 'Event name');
if (!name) {
  console.error('::error::Issue body is missing "Event name". Was it submitted via the event issue form?');
  process.exit(1);
}

const event = {
  id: newObjectId(),
  name,
  description: value(sections, 'Short description') ?? '',
  status: 'Active',
  // The Domain may evolve to add date/venue/website fields. We attach what we have
  // as additional properties; the schema validator (if it sets additionalProperties=false)
  // will surface mismatches in CI for a maintainer to clean up before merge.
  date: value(sections, 'Date (YYYY-MM-DD)'),
  venue: value(sections, 'Venue (city and/or full address)'),
  website: value(sections, 'Event website or registration link'),
  createdBy: `community:@${author}`,
  createdAt: nowIsoUtc(),
  updatedBy: null,
  updatedAt: null,
};

const slug = slugify(name) || event.id;
const outPath = path.join('src/BjjEire.Seeder/data/bjj-events', `${slug}.json`);

if (fs.existsSync(outPath)) {
  console.error(`::error::A file already exists at ${outPath}. The event may already be in the directory.`);
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify([event], null, 2) + '\n');
console.log(`Wrote ${outPath}`);

setOutput('event_name', name);
setOutput('event_path', outPath);
