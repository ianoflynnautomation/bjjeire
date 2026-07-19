import fs from 'node:fs';
import path from 'node:path';

import { parseIssueForm, value, newObjectId, nowIsoUtc, slugify, setOutput } from './issue-form-parser.ts';
import type { Store } from './types.ts';

const body = process.env.ISSUE_BODY ?? '';
const author = process.env.ISSUE_AUTHOR ?? 'community';

const sections = parseIssueForm(body);

const name = value(sections, 'Store name');
if (!name) {
  console.error('::error::Issue body is missing "Store name". Was it submitted via the store issue form?');
  process.exit(1);
}

const websiteUrl = value(sections, 'Website URL');
if (!websiteUrl) {
  console.error('::error::Issue body is missing "Website URL".');
  process.exit(1);
}

const store: Store = {
  id: newObjectId(),
  name,
  description: value(sections, 'Short description (optional)'),
  websiteUrl,
  logoUrl: null,
  isActive: true,
  createdBy: `community:@${author}`,
  createdAt: nowIsoUtc(),
  updatedBy: null,
  updatedAt: null,
};

const slug = slugify(name) || store.id;
const outPath = path.join('seeder/data/stores', `${slug}.json`);

if (fs.existsSync(outPath)) {
  console.error(`::error::A file already exists at ${outPath}. The store may already be in the directory.`);
  process.exit(1);
}

fs.writeFileSync(outPath, `${JSON.stringify([store], null, 2)}\n`);
console.log(`Wrote ${outPath}`);

setOutput('name', name);
setOutput('path', outPath);
