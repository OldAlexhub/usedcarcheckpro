# Proveh Server

Self-hosted API for Used Car Check Pro. It deliberately contains no LLM or
hosted AI integration. Current smart features use validation, NHTSA vehicle
data, and OpenCV image-quality checks.

Production URL: `https://proveh.server.oldalexhub.com`

## Included

- VIN check-digit validation and privacy-preserving NHTSA response cache
- OpenCV blur, exposure, glare, darkness, and resolution checks
- Anonymous encrypted-secret vault creation
- Batch inspection sync with soft-delete tombstones
- Batched, allowlisted product analytics with automatic retention cleanup
- Versioned inspection-outcomes dataset with strict field allowlisting and automatic retention
- Anonymous installation credentials and authenticated dataset deletion
- PostgreSQL migrations, health checks, Docker packaging, and an nginx example
- Secure administrator portal at `/admin`, including dataset catalog and CSV export
- Swagger/OpenAPI documentation at `/docs`

The VIN cache stores a SHA-256 digest rather than the VIN itself. Inspection
sync is authenticated and opt-in; the mobile app does not upload inspection
records merely because the API exists.

The mobile app sends only a curated outcome record to the dataset endpoint.
VINs, seller names, listing URLs, notes, precise location, and photos are not in
the request schema. If Proveh Server is offline, the app keeps using its local
inspection workflow and retains a bounded retry queue; server availability never
blocks saves, comparisons, or exports.

## Local development

```sh
python -m venv .venv
.venv/Scripts/activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
$env:DATABASE_URL="sqlite+aiosqlite:///./proveh-dev.db"
$env:AUTO_CREATE_SCHEMA="true"
uvicorn app.main:app --reload --port 8080
```

Run checks:

```sh
pytest
ruff check .
```

## Nexus deployment

1. Point the `proveh.server.oldalexhub.com` DNS record at Nexus.
2. Copy `.env.example` to `.env`; replace the PostgreSQL password, admin password,
   and admin session secret. Use a URL-safe PostgreSQL password. Keep this file
   only on Nexus.
3. From this directory run `docker compose up -d --build`.
4. Configure the existing Nexus reverse proxy to forward HTTPS traffic to
   `127.0.0.1:8080`. An nginx example is in `deploy/nginx-proveh.conf.example`.
5. Verify both `/api/v1/health/live` and `/api/v1/health/ready`.
6. Sign in at `https://proveh.server.oldalexhub.com/admin`, then open Datasets
   to verify collection and download the versioned analysis CSV.

The API container runs `alembic upgrade head` before each start. PostgreSQL is
not exposed publicly by the compose file. Deployment also creates the
`ADMIN_USERNAME` portal account or updates its password from `ADMIN_PASSWORD`.
The example already sets the requested administrator username; the password is
intentionally supplied only through the untracked Nexus `.env` file.

`MAX_UPLOAD_BYTES` is reserved by Nexus and may contain a storage path. The
server deliberately ignores it. To change the API image-upload limit from the
10 MiB default, set `PROVEH_MAX_UPLOAD_BYTES` to a positive integer number of
bytes. If Nexus injects its storage path into that variable too, the server
safely uses the 10 MiB default instead of failing startup.

If Nexus already provides PostgreSQL, run only the API service and supply a
`postgresql+asyncpg://...` `DATABASE_URL`. Do not commit `.env`.

## Backup

Back up the Docker volume with `pg_dump`, or use the existing Nexus PostgreSQL
backup system. Test restoration before enabling mobile cloud backup.

## Privacy and security notes

- Put TLS at the Nexus reverse proxy; never expose port 8080 directly.
- Preserve the rate limit on public VIN and vault-creation routes.
- Vault secrets are returned once and stored only as SHA-256 hashes.
- Do not log request bodies, VIN values, vault secrets, or inspection payloads.
- Image-quality uploads are processed in memory and are not retained.
- Update the Play Data Safety form before publishing a build with dataset collection.

