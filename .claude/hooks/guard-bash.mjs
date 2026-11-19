#!/usr/bin/env node
// PreToolUse guard for Bash. `permissions.deny` on Read and guard-edit.mjs on Edit/Write do not see
// shell commands, so this closes the same two holes there, for the main session and every subagent:
//   1. No command may touch a local `.env` file (any repository; `.env.example` is public) or `secrets/`.
//   2. No command may write to a file guard-edit.mjs protects (generated API types, compiled gh-aw
//      lock files). Regenerating them through their own tool (`npm run gen:api-types`, `gh aw compile`)
//      does not name the file, so it is not blocked.
// A heuristic, not a sandbox: it stops the agent's ordinary commands, not a determined bypass.
import { readFileSync } from 'node:fs';

const deny = reason => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `${reason} (blocked by .claude/hooks/guard-bash.mjs)`,
      },
    }),
  );
  process.exit(0);
};

const input = JSON.parse(readFileSync(0, 'utf8'));
const command = input.tool_input?.command;
if (typeof command !== 'string') process.exit(0);

// A token boundary before and after, so `.envrc`, `foo.env` and `.env.example` do not match.
const BEFORE = String.raw`(?:^|[\s'"=:/(<>|;&])`;
const AFTER = String.raw`(?=$|[\s'"):;|&<>*])`;
const ENV_FILE = new RegExp(`${BEFORE}\\.env(?:\\.(?!example${AFTER})[\\w.-]+)?${AFTER}`);
const SECRETS = new RegExp(`${BEFORE}(?:\\./)?secrets/`);

if (ENV_FILE.test(command)) {
  deny('Do not read or touch local .env files; ask the person for the value you need. .env.example is fine');
}
if (SECRETS.test(command)) deny('Do not read or touch secrets/; a person manages those files');

const PROTECTED = String.raw`(?:\S*src/bjjeire-app/src/types/generated/\S*|\S*\.github/workflows/\S*\.lock\.yml)`;
const WRITES = [
  new RegExp(String.raw`>{1,2}\s*['"]?${PROTECTED}`), // redirect into it
  new RegExp(String.raw`\btee\s+(?:-a\s+)?['"]?${PROTECTED}`),
  new RegExp(String.raw`\b(?:sed|perl)\s+(?:-\w+\s+)*-i\b[^|;&]*${PROTECTED}`), // in-place edit
  new RegExp(String.raw`\b(?:cp|mv|install|rm|truncate)\b[^|;&]*${PROTECTED}\s*(?:$|[|;&])`), // as the target
];
if (WRITES.some(re => re.test(command))) {
  deny(
    'Do not write generated files from the shell: regenerate API types with `npm run gen:api-types` and lock files with `gh aw compile`',
  );
}
