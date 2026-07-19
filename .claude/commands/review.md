Review the staged and unstaged changes in this PR for correctness, architecture compliance, and potential issues.

Git diff:
```
$(!git diff HEAD)
```

Staged changes:
```
$(!git diff --cached)
```

Check for:
1. Package-by-feature violations (code added to shared packages that belongs in a feature package, or cross-feature imports that should go through `common`/`audit`/`deactivation`)
2. Renamed DTO/command/response/domain classes — their names are OpenAPI schema names and a public contract (CI breaking-change gate + frontend generated types)
3. Hardcoded UI strings that should be in `ui-content.ts`
4. Components not using `memo(function Name())` pattern
5. `data ?? []` not wrapped in `useMemo` (causes exhaustive-deps lint errors)
6. Missing `dataTestId` on new interactive components
7. Any `isAvailable: null` in seeder JSON files
8. Security issues: exposed secrets, SQL/NoSQL injection, XSS

Summarise findings by severity: Critical / Warning / Suggestion.
