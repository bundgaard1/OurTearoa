# Evidence pack

Evidence for the report, collected for #12. Logs were captured on 2026-10-11
(UTC) against the public deployment at `https://ourtearoa.duckdns.org`, commit
`9ab6365` on `main`. Screenshots in `docs/report/media/screenshots/` were taken during setup
(August and September 2026) and show the state at that time.

## Public URLs

| What | URL |
| :--- | :--- |
| Client | https://ourtearoa.duckdns.org |
| API base | https://ourtearoa.duckdns.org/api |
| Health | https://ourtearoa.duckdns.org/api/health |
| Repository | https://github.com/bundgaard1/OurTearoa |
| Image bucket (public objects only) | https://ourtearoa-storage.s3.ap-southeast-2.amazonaws.com/public/places/... |

## Logs

| File | Shows | Re-run with |
| :--- | :--- | :--- |
| `api-smoke-test-public.log` | All 25 endpoints, 45 checks, 45 passed: status codes, auth (`401`), ownership (`404`), validation (`400`), conflicts (`409`), cleanup. The two image endpoints are covered for error cases only; their success path is in `s3-upload-public.log` | `bash scripts/api-smoke-test.sh https://ourtearoa.duckdns.org/api` |
| `infra-public-checks.log` | Health with RDS round-trip, HTTP to HTTPS redirect, Let's Encrypt certificate, SPA deep link, no `http://` URLs in the bundle, DNS, live images served by S3, bucket listing denied | Commands are in the log |
| `s3-upload-public.log` | End-to-end image upload on the live system: presigned POST signed with temporary role credentials (`X-Amz-Security-Token`), direct browser-style upload to S3 (`204`), upload over 5 MB rejected by S3 (`400`), confirm, public read (`200`, `Server: AmazonS3`), cleanup | Temporary user and place, deleted afterwards |
| `ci-deploy-runs.log` | The last 15 deploy runs, and a trivial change (new favicon) live without anyone touching the server | `gh run list --workflow deploy.yaml` |

## Skeleton Definition of Done

Each line still needs to be checked by someone other than the implementer
(#12). Status is what the evidence below shows today.

| Issue | DoD line | Evidence | Status |
| :--- | :--- | :--- | :--- |
| #3 | Monorepo, `.gitignore`, `.env.example`, README, apps boot locally | `client/`, `backend/`, `.gitignore`, `backend/.env.example`, `readme.md` (local development steps); architecture in `DESIGN.md` section 3 | Met, except: branch and PR rules are not written down in the repository |
| #5 | Free-tier RDS in Sydney | `report/media/screenshots/1-03-rds-running.png`: `ourtearoa-db`, `db.t4g.micro`, PostgreSQL, `ap-southeast-2a`, Available | Met |
| #5 | Private, no public endpoint, security group locked down | `report/media/screenshots/3-rds-ec2-security.png` (EC2 to RDS security groups); `report/media/screenshots/1-02-rds-connection.png` shows port 5432 reachable from a developer machine | **Not met**: RDS is publicly reachable for development; tracked in #15 |
| #6 | Health returns a live value from RDS; credentials from env only | `infra-public-checks.log` section 1 (`"database":"UP"`, `latencyMs`); `report/media/screenshots/8-2-connection to the database.png`; `backend/.env.example` | Met |
| #7 | `t3.micro` with Node, Nginx, process manager; setup logged with screenshots | `docs/cloud-ec2-setup.md` with `report/media/screenshots/2-01` to `2-07` (instance, versions, swap, PM2, Nginx test) | Met. The guide is `cloud-ec2-setup.md`, not `cloud-setup.md`. `2-01` shows the old public IP and no IAM role, and `2-03` shows Node 18; both changed later |
| #8 | `/api/health` returns `200` from any network | `infra-public-checks.log` section 1, `api-smoke-test-public.log` | Met |
| #8 | Reboot survival verified | None in the repository | **Evidence missing**: needs `uptime` and `pm2 status` after a reboot (@bundgaard1) |
| #9 | Angular build on Nginx, Certbot, free domain, page loads publicly | `infra-public-checks.log` sections 2 to 5 and 7; `report/media/screenshots/9-certificate_deployed.png` | Met |
| #9 | Calls the API with no mixed content | `infra-public-checks.log` section 6: API base is `https://ourtearoa.duckdns.org/api`, no `http://` URLs in the bundle | Met by static check; a browser console check by @bundgaard1 is still open |
| #11 | A trivial change merged appears on the public URL without touching the server | `ci-deploy-runs.log`: favicon in commit `9ab6365` and the live file have the same SHA-256 | Met. Failed runs at `e0d3d03` and `3223432` were fixed in the workflow (#104, #105) |
| S3 (#71, #87) | Images stored in cloud object storage | `s3-upload-public.log`, `infra-public-checks.log` sections 8 to 10 | Met |

`report/media/screenshots/1-01-healthcheck-proof.png` shows the local hello-world slice (#4)
on `localhost`, not the deployment.

## Known side effect

`s3-upload-public.log` left one 70-byte PNG under `public/places/5e32c946-.../`
in the bucket, because replaced or orphaned images are not deleted yet
(`DESIGN.md` section 3.4).
