#!/usr/bin/env node
// PreToolUse guard for Edit / MultiEdit / Write. Turns the AGENTS.md guardrails that
// lint cannot see into hard denials, for the main session and every subagent:
//   1. Generated files and local secrets are never hand-edited.
//   2. Seeder JSON never gains `"isAvailable": null`.
// The seeder check compares counts before and after, so editing a file that already
// contains the pattern is still allowed.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const PROTECTED = [
  { re: /^src\/bjjeire-app\/src\/types\/generated\/api\.ts$/, why: 'generated from OpenAPI; run `npm run gen:api-types`' },
  { re: /^\.github\/workflows\/.*\.lock\.yml$/, why: 'compiled; edit the .md source and run `gh aw compile`' },
  { re: /^\.env$/, why: 'local configuration; a person changes it' },
  { re: /^secrets\//, why: 'local secrets; a person changes them' },
];

const SEEDER_FILE = /^seeder\/data\/.*\.json$/;
const SEEDER_NULL = /"isAvailable"\s*:\s*null/g;

const deny = reason => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `${reason} (blocked by .claude/hooks/guard-edit.mjs)`,
      },
    }),
  );
  process.exit(0);
};

const count = (text, re) => (text.match(re) ?? []).length;

const input = JSON.parse(readFileSync(0, 'utf8'));
const toolInput = input.tool_input ?? {};
const filePath = toolInput.file_path;
if (typeof filePath !== 'string') process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const absolute = path.resolve(root, filePath);
const rel = path.relative(root, absolute).split(path.sep).join('/');
if (rel.startsWith('..')) process.exit(0);

const guarded = PROTECTED.find(({ re }) => re.test(rel));
if (guarded) deny(`Do not edit ${rel}: ${guarded.why}.`);

if (!SEEDER_FILE.test(rel)) process.exit(0);

let before = '';
let after = '';
if (input.tool_name === 'Write') {
  before = existsSync(absolute) ? readFileSync(absolute, 'utf8') : '';
  after = toolInput.content ?? '';
} else {
  const edits = input.tool_name === 'MultiEdit' ? (toolInput.edits ?? []) : [toolInput];
  before = edits.map(e => e.old_string ?? '').join('\n');
  after = edits.map(e => e.new_string ?? '').join('\n');
}

if (count(after, SEEDER_NULL) > count(before, SEEDER_NULL)) {
  deny(`Adding \`"isAvailable": null\` to ${rel}: seeder JSON uses false, never null.`);
}
