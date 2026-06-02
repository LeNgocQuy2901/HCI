# SmartSignLanguage k6 tests

This project contains API-level functional checks for the SmartSignLanguage
application. It is separate from the Vitest unit tests.

## Prerequisites

1. Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/).
2. Start the web app at `http://localhost:8080`.
3. Start the recognition service at `http://localhost:8000` before running the
   recognition suite.
4. Set an existing admin account for admin scenarios. The app server must have
   that email in `ADMIN_EMAILS`.

```powershell
$env:APP_BASE_URL = "http://localhost:8080"
$env:AI_BASE_URL = "http://localhost:8000"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "your-password"
```

## Run

```powershell
.\tests\k6\run.ps1 smoke
.\tests\k6\run.ps1 app
.\tests\k6\run.ps1 recognition
.\tests\k6\run.ps1 all
```

Each command automatically saves a timestamped JSON summary in
`tests/k6/results`, for example:

```text
tests/k6/results/app-20260602-201500-summary.json
```

The admin group is skipped when `ADMIN_EMAIL` or `ADMIN_PASSWORD` is missing.
Set `$env:STREAM_VIDEO = "true"` to include a Google Drive range request while
testing Lookup video playback. It is off by default because it depends on Drive
credentials and network access.

Set `$env:VERIFY_TRANSLATE_DATASET = "true"` to download and validate the full
Translate landmark dataset. It is off by default because the current JSON asset
is about 451 MB.

## Scope notes

k6 tests HTTP behavior. It cannot click React components, open a physical
camera, or validate animation rendering. The recognition suite simulates camera
frames with multipart image requests. Lookup and Translate are frontend-only
features, so their k6 coverage verifies published content, video metadata, and
the landmark dataset. Use browser E2E tests for visual interaction coverage.

The app suite creates uniquely named users and cleans up temporary admin sign
and lesson records. Registered functional users remain in the local database so
that auth and profile behavior can be inspected after a run.
