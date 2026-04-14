import fs from 'node:fs';
import path from 'node:path';

import {
  parseIssueForm,
  value,
  checkboxList,
  newObjectId,
  nowIsoUtc,
  slugify,
  parseCoordinates,
  setOutput,
} from './issue-form-parser.mjs';

const body = process.env.ISSUE_BODY ?? '';
const author = process.env.ISSUE_AUTHOR ?? 'community';

const sections = parseIssueForm(body);

const name = value(sections, 'Gym name');
if (!name) {
  console.error('::error::Issue body is missing "Gym name". Was it submitted via the gym issue form?');
  process.exit(1);
}

const coords = parseCoordinates(value(sections, 'Coordinates (longitude, latitude)'));
if (!coords) {
  console.error('::error::Could not parse "Coordinates (longitude, latitude)". Expected two numbers separated by comma.');
  process.exit(1);
}

// Map the issue-form checkbox labels to the OfferedClasses enum values used in Domain.
const CLASS_MAP = {
  'BJJ Gi — All Levels': 'BJJGiAllLevels',
  'BJJ No-Gi — All Levels': 'BJJNoGiAllLevels',
  'BJJ Gi — Fundamentals': 'BJJGiFundamentals',
  'Wrestling': 'Wrestling',
  'Muay Thai': 'MuayThai',
  'Kids BJJ': 'KidsBJJ',
  'Competition Training': 'CompetitionTraining',
};
const offeredClasses = checkboxList(sections, 'Classes offered')
  .map((c) => CLASS_MAP[c])
  .filter(Boolean);

const trialNotes = value(sections, 'Free trial offer (optional)');
const trialOffer = trialNotes
  ? { isAvailable: true, freeClasses: null, freeDays: null, notes: trialNotes }
  : { isAvailable: false, freeClasses: null, freeDays: null, notes: null };

const address = value(sections, 'Full address');
const gym = {
  id: newObjectId(),
  name,
  description: value(sections, 'Short description') ?? '',
  status: 'Active',
  county: value(sections, 'County'),
  affiliation: value(sections, 'Affiliation (optional)')
    ? { name: value(sections, 'Affiliation (optional)'), website: null }
    : null,
  trialOffer,
  location: {
    address,
    venue: name,
    coordinates: {
      type: 'Point',
      placeName: address,
      placeId: null,
      coordinates: coords,
    },
  },
  socialMedia: {
    instagram: value(sections, 'Instagram URL (optional)'),
    facebook: value(sections, 'Facebook URL (optional)'),
    x: null,
    youTube: null,
  },
  offeredClasses,
  website: value(sections, 'Website'),
  timetableUrl: null,
  imageUrl: null,
  createdBy: `community:@${author}`,
  createdAt: nowIsoUtc(),
  updatedBy: null,
  updatedAt: null,
};

const slug = slugify(name) || gym.id;
const outPath = path.join('src/BjjEire.Seeder/data/gyms', `${slug}.json`);

if (fs.existsSync(outPath)) {
  console.error(`::error::A file already exists at ${outPath}. The gym may already be in the directory.`);
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify([gym], null, 2) + '\n');
console.log(`Wrote ${outPath}`);

setOutput('gym_name', name);
setOutput('gym_path', outPath);
