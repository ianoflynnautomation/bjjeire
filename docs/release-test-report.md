# Audit-ready compliance release report

The pack lives in **bjjeire-ci-templates**:

- merge workflow: `audit-report.yml` (PR / main — does not re-run tests)
- dedicated re-run: `audit-release.yml` (release / workflow_dispatch)
- generator: `actions/generate-executive-test-report`

This repo calls the shared `package-test-report.yml` after each test job in
[`ci-pr.yml`](../.github/workflows/ci-pr.yml) and
[`ci-main.yml`](../.github/workflows/ci-main.yml), then `audit-report.yml`.
Other teams opt in via `package-audit-reports` / `audit-packages` on the
golden-path test workflows instead of copying these jobs.
The release-time caller is [`.github/workflows/audit-release.yml`](../.github/workflows/audit-release.yml).

Release ID: `REL-[YYYYMMDD]-[GIT_COMMIT_SHORT_SHA]` (UTC date + 7-char SHA).

| Job | Evidence | Format |
| --- | --- | --- |
| Unit | Maven Surefire + Vitest unit (PR + main) | JUnit XML |
| Integration | Maven Failsafe + Vitest integration (PR + main) | JUnit XML |
| Acceptance | Cucumber JSON (still staged/seeded until a live exporter is wired) | Cucumber JSON |
| System / E2E | Playwright from compose smoke (PR) or AKS acceptance (main) | Playwright JSON |
| Audit | PDF + Step Summary + SHA-256 catalog | `reportlab` |

Path-filtered PR/main runs set `strict-missing: false`: skipped suites still show
as **MISSING / CRITICAL FAILURE** in the PDF, but the merge job fails only when
a packaged suite has failing tests. The dedicated release pack keeps
`strict-missing: true`.

Callers set every `package-test-report.yml` / `audit-report.yml` input explicitly
so a GitHub Actions run shows the pipeline that produced the PDF:

| Workflow | Job name in the run | `environment` | Artifact |
| --- | --- | --- | --- |
| `ci-main.yml` | Generate executive test report (main release pipeline) | `Main release pipeline` | `bjjeire-main-audit-release-report` |
| `ci-pr.yml` | Generate executive test report (PR validation) | `PR validation` | `bjjeire-pr-audit-release-report` |
| `audit-release.yml` | Generate executive test report (GitHub Release) | Staging (or dispatch choice) | `bjjeire-github-release-audit-report` |

On a published GitHub Release the PDF is attached to the tag (`attach-to-tag`).

Pin the callers to a templates SHA after `audit-report.yml` is merged (`@v1` until then).

## Preview the PDF locally

From `bjjeire-ci-templates`:

```sh
cd actions/generate-executive-test-report
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/python preview_report.py --clean
```

Opens `out/audit-release-report.pdf` and prints the Step Summary. Use `--no-open` if you only want the files.
