#!/usr/bin/env node
// Stop: run targeted checks on the sources changed in the working tree and hand failures
// back so the agent fixes them before it finishes. It blocks once per stop; if the retry
// still fails it reports and lets the session stop, so a broken check cannot trap it.
// A check that could not run (on the Mac host: no JDK 25, Linux node_modules) is reported, never a failure.
// A passing tree is fingerprinted so unchanged work is not checked again on later turns.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const APP_DIR = 'src/bjjeire-app';
const APP_SOURCE = /^src\/bjjeire-app\/(src\/|package\.json$|tsconfig.*\.json$|vite.*\.ts$|vitest.*\.ts$)/;
const API_SOURCE = /^src\/bjjeire-api\/(src\/|pom\.xml$)/;
const LINTABLE = /\.(ts|tsx)$/;
const STARTUP_ERROR = /Startup Error|Cannot find native binding/;
const MIN_JAVA = 25;
const MAX_OUTPUT = 6000;

const input = JSON.parse(readFileSync(0, 'utf8'));
const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const appRoot = path.join(root, APP_DIR);

const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
};
const lines = text => text.split('\n').filter(Boolean);
const git = (...args) => run('git', args).output;

const changed = [...lines(git('diff', '--name-only', 'HEAD')), ...lines(git('ls-files', '--others', '--exclude-standard'))];
const appFiles = changed.filter(file => APP_SOURCE.test(file));
const apiFiles = changed.filter(file => API_SOURCE.test(file));
const sources = [...appFiles, ...apiFiles];
if (sources.length === 0) process.exit(0);

const fingerprint = createHash('sha256')
  .update(git('diff', 'HEAD', '--', ...sources))
  .update(sources.map(file => (existsSync(path.join(root, file)) ? readFileSync(path.join(root, file)) : '')).join('\0'))
  .digest('hex');
const passFile = path.resolve(root, git('rev-parse', '--git-path', 'claude-verify-pass').trim());
if (existsSync(passFile) && readFileSync(passFile, 'utf8') === fingerprint) process.exit(0);

const failures = [];
const skipped = [];

const checkApp = () => {
  const bin = name => path.join(appRoot, 'node_modules', '.bin', name);
  if (!existsSync(bin('tsc'))) return skipped.push(`SPA: no node_modules in ${APP_DIR}; run checks in the dev container`);

  const lintable = appFiles.filter(file => LINTABLE.test(file) && existsSync(path.join(root, file)));
  if (lintable.length > 0) {
    const relative = lintable.map(file => path.relative(APP_DIR, file));
    const lint = run(bin('eslint'), ['--no-warn-ignored', '--max-warnings', '0', ...relative], appRoot);
    if (!lint.ok) failures.push(`eslint\n${lint.output}`);
  }
  const types = run(bin('tsc'), ['--noEmit'], appRoot);
  if (!types.ok) failures.push(`tsc --noEmit\n${types.output}`);

  const unit = run(bin('vitest'), ['run', '--project', 'unit', '--changed', 'HEAD', '--passWithNoTests'], appRoot);
  if (STARTUP_ERROR.test(unit.output)) skipped.push('vitest could not start; run checks in the dev container');
  else if (!unit.ok) failures.push(`vitest (unit, changed)\n${unit.output}`);
};

const javaMajor = () => {
  const home = process.env.JAVA_HOME;
  const java = home && existsSync(path.join(home, 'bin', 'java')) ? path.join(home, 'bin', 'java') : 'java';
  const match = run(java, ['-version']).output.match(/version "(\d+)/);
  return match ? Number(match[1]) : 0;
};

const checkApi = () => {
  if (javaMajor() < MIN_JAVA) return skipped.push(`API: JDK ${MIN_JAVA} not found; run checks in the dev container`);
  const tests = run(path.join(root, 'mvnw'), ['-q', '-pl', 'src/bjjeire-api', 'test']);
  if (!tests.ok) failures.push(`mvnw -pl src/bjjeire-api test\n${tests.output}`);
};

if (appFiles.length > 0) checkApp();
if (apiFiles.length > 0) checkApi();

const notes = skipped.length > 0 ? `Not verified: ${skipped.join('; ')}.` : '';

if (failures.length > 0) {
  const report = `Checks failed on changed sources.\n\n${failures.join('\n\n')}`.slice(-MAX_OUTPUT);
  if (!input.stop_hook_active) {
    process.stderr.write(`${report}\n${notes}`);
    process.exit(2);
  }
  process.stdout.write(JSON.stringify({ systemMessage: `Stopping with failing checks. ${report} ${notes}` }));
  process.exit(0);
}

if (notes) process.stdout.write(JSON.stringify({ systemMessage: notes }));
else writeFileSync(passFile, fingerprint);
