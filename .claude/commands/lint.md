Run all code quality checks across the project.

TypeScript check:
```
$(!cd src/bjjeire-app && npm run typecheck 2>&1)
```

ESLint:
```
$(!cd src/bjjeire-app && npm run lint 2>&1)
```

Java quality gate (Spotless format check, Checkstyle, Error Prone, compile):
```
$(!mvn -q -pl src/bjjeire-api verify -DskipTests 2>&1 | tail -30)
```

Report all errors grouped by tool. If there are no errors say "All checks passed".
