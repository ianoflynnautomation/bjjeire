#!/usr/bin/env node
// PostToolUse (Edit|MultiEdit|Write): format the file just written the way CI checks it, so a
// change cannot reach CI unformatted.
//   SPA (src/bjjeire-app): prettier --write, then oxlint --fix for script files. CI's
//     frontend_lint job runs `oxlint src --max-warnings 0` and `prettier --check src/`.
//   API (src/bjjeire-api): spotless:apply (palantir-java-format) on that one file. `mvn verify`
//     fails in the validate phase on an unformatted file.
// Oxlint problems --fix cannot repair are handed back to the agent ("decision": "block" on a
// PostToolUse only reports; the edit itself stands). A tool that cannot run (on the Mac host:
// no node_modules, no JDK 25) is skipped silently; verify-changed.mjs reports that at Stop.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const APP_DIR = 'src/bjjeire-app';
const API_DIR = 'src/bjjeire-api';
const LINT_FILE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const MAX_OUTPUT = 4000;

const input = JSON.parse(readFileSync(0, 'utf8'));
const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const filePath = input.tool_response?.filePath ?? input.tool_input?.file_path;
if (!filePath || !existsSync(filePath)) process.exit(0);

const relative = path.relative(root, path.resolve(filePath)).split(path.sep).join('/');
if (relative.startsWith('..') || relative.includes('/node_modules/') || relative.includes('/generated/')) {
  process.exit(0);
}

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
};

const report = text => {
  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason: `${relative} was formatted, but problems remain that CI will fail on. Fix them:\n${text}`.slice(
        0,
        MAX_OUTPUT
      ),
    })
  );
};

const formatApp = () => {
  const appRoot = path.join(root, APP_DIR);
  const bin = name => path.join(appRoot, 'node_modules', '.bin', name);
  if (!existsSync(bin('prettier'))) return;
  const file = path.relative(appRoot, path.resolve(filePath));

  // --ignore-unknown: a file prettier has no parser for (an image, a .txt) is left alone.
  const prettier = run(bin('prettier'), ['--write', '--ignore-unknown', '--log-level', 'warn', file], appRoot);
  if (!prettier.ok) return report(`prettier --write\n${prettier.output}`);

  if (LINT_FILE.test(file) && existsSync(bin('oxlint'))) {
    const lint = run(
      bin('oxlint'),
      ['--fix', '--max-warnings', '0', '--no-error-on-unmatched-pattern', file],
      appRoot
    );
    // node_modules is installed in the Linux dev container. On the Mac the
    // oxlint binary is present but its native binding is not; skip, as with a missing tool.
    if (!lint.ok && !lint.output.includes('Cannot find native binding')) {
      report(`oxlint --max-warnings 0\n${lint.output}`);
    }
  }
};

const javaMajor = () => {
  const home = process.env.JAVA_HOME;
  const java = home && existsSync(path.join(home, 'bin', 'java')) ? path.join(home, 'bin', 'java') : 'java';
  const match = run(java, ['-version'], root).output.match(/version "(\d+)/);
  return match ? Number(match[1]) : 0;
};

const formatApi = () => {
  if (javaMajor() < 25) return;
  // spotlessFiles is a regex matched against the absolute path: escape it so only this file is touched.
  const pattern = path.resolve(filePath).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const spotless = run(
    path.join(root, 'mvnw'),
    ['-q', '-pl', API_DIR, 'spotless:apply', `-DspotlessFiles=${pattern}`],
    root
  );
  if (!spotless.ok) report(`spotless:apply (palantir-java-format)\n${spotless.output}`);
};

if (relative.startsWith(`${APP_DIR}/`)) formatApp();
else if (relative.startsWith(`${API_DIR}/src/`) && relative.endsWith('.java')) formatApi();
