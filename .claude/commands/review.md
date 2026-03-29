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
1. Clean Architecture violations (e.g. Infrastructure referenced from Domain/Application directly)
2. Missing `CancellationToken` propagation in async .NET methods
3. Hardcoded UI strings that should be in `ui-content.ts`
4. Components not using `memo(function Name())` pattern
5. `data ?? []` not wrapped in `useMemo` (causes exhaustive-deps lint errors)
6. Missing `dataTestId` on new interactive components
7. Any `isAvailable: null` in seeder JSON files
8. Security issues: exposed secrets, SQL/NoSQL injection, XSS

Summarise findings by severity: Critical / Warning / Suggestion.
