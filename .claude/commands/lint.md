Run all code quality checks across the project.

TypeScript check:
```
$(!cd src/bjjeire-app && npm run typecheck 2>&1)
```

ESLint:
```
$(!cd src/bjjeire-app && npm run lint 2>&1)
```

.NET build (catches C# errors):
```
$(!dotnet build --no-restore -v quiet 2>&1 | grep -E "error|warning" | head -30)
```

Report all errors grouped by tool. If there are no errors say "All checks passed".
