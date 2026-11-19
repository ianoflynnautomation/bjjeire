#!/usr/bin/env node
// SessionStart: give the agent the git state and the spec-driven flow before its first step, so it
// neither starts work on `main` nor builds on top of a half-finished merge or rebase. Output is a few
// lines of context; it never blocks the session.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const git = (...args) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
};

const lines = [];
const branch = git('branch', '--show-current');
const gitDir = git('rev-parse', '--absolute-git-dir');
if (gitDir) {
  const inProgress = [
    ['MERGE_HEAD', 'a merge'],
    ['rebase-merge', 'a rebase'],
    ['rebase-apply', 'a rebase'],
    ['CHERRY_PICK_HEAD', 'a cherry-pick'],
  ].find(([marker]) => existsSync(path.join(gitDir, marker)));
  if (inProgress) {
    lines.push(`WARNING: ${inProgress[1]} is in progress. Resolve or abort it with the person before changing files.`);
  }
}
if (!branch) {
  lines.push('Git: detached HEAD. Ask which branch to work on before changing files.');
} else if (branch === 'main') {
  lines.push('Git: on main. Create a feature branch before changing files (AGENTS.md).');
} else {
  const counts = git('rev-list', '--left-right', '--count', `origin/main...HEAD`).split(/\s+/);
  const behind = Number(counts[0] ?? 0);
  lines.push(`Git: branch ${branch}${behind > 0 ? `, ${behind} commit(s) behind origin/main (update with \`git pull --rebase origin main\`)` : ''}.`);
}
lines.push(
  'Flow (AGENTS.md): no behaviour change without a spec. /spec <feature> -> /clear -> /build-feature <spec path>; Spec Kit (/speckit-specify … /speckit-tasks) for a large change. A bug fix names the requirement issue its failing test protects.',
);

process.stdout.write(
  JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: lines.join('\n') } }),
);
