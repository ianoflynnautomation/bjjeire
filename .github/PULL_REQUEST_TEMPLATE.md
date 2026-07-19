<!--
Thanks for contributing to BJJ Éire! 🥋
Fill in the sections below and delete anything that doesn't apply.
PR titles follow Conventional Commits, e.g. `feat: add county filter` or `fix: correct gym coordinates`.
-->

## Type of change

<!-- Check the one that best describes this PR. -->

- [ ] 📊 Data — add or update a gym, event, competition, or store
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] ♻️ Refactor / tech debt
- [ ] 📝 Docs / tooling

## Summary

<!--
What does this PR change, and why?
For data PRs: name the entity and link its website or social media.
-->

## Related issues

<!-- e.g. Closes #123 — or delete this section. -->

---

## Checklist — data PRs

<!-- Delete this section for code-only PRs. -->

- [ ] Based on the template in `seeder/data/<entity>/_template.json`
- [ ] Coordinates use GeoJSON order: `[longitude, latitude]`
- [ ] Validated locally: `mvn -pl src/bjjeire-api package -DskipTests && java -jar src/bjjeire-api/target/bjjeire-api-*.jar --spring.profiles.active=seeder --validate`
- [ ] The information is publicly available on the entity's own channels (link in the summary)
- [ ] **Affiliation disclosure**: I am not an owner/employee of the listed entity, or I have disclosed my affiliation in the summary

## Checklist — code PRs

<!-- Delete this section for data-only PRs. -->

- [ ] `mvn -pl src/bjjeire-api verify` passes (backend changes)
- [ ] `npm run lint && npm run typecheck && npm test` passes (frontend changes)
- [ ] Tests added or updated to cover the change
- [ ] Both light and dark themes verified (UI changes) — screenshots below
- [ ] No unrelated changes bundled in

## Screenshots

<!-- For UI changes: before/after in light and dark mode. Delete otherwise. -->
