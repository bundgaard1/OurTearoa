# 🗄️ AWS RDS PostgreSQL Setup & Access Guide

This guide explains how to whitelist your local IP address to access the **OurTearoa** cloud database during development, and how to inspect the database using standard GUI tools.

---

## 🔒 1. Adding Your IP to the AWS RDS Security Group

Because our RDS instance is firewalled, your local machine must be explicitly whitelisted in the AWS Security Group to connect from your laptop.

### Step-by-Step Instructions:

1. Log into the **[AWS Management Console](https://console.aws.amazon.com/rds/)**.
2. Select the **Asia Pacific (Sydney) `ap-southeast-2`** region in the top-right header.
3. In the left navigation pane, click **Databases** and select our database instance (`ourtearoa-db`).
4. Scroll down to the **Connectivity & security** tab. First confirm the instance is reachable from the internet at all:
   * **Publicly accessible** must be set to **Yes**. If it is **No**, no security group rule will help — the instance has no public IP.
5. Click the link under **VPC security groups** (e.g., `sg-0a1b2c3d4e5f`). Confirm the group you are editing is the one actually attached to this instance.
6. In the Security Group details panel:
   * Select the **Inbound rules** tab.
   * Click **Edit inbound rules**.
7. Click **Add rule**:
   * **Type:** `PostgreSQL` (Port `5432`)
   * **Source:** type your address manually as `<your.ip.v4>/32`. You can find it at [checkip.amazonaws.com](https://checkip.amazonaws.com) or `curl checkip.amazonaws.com`.
   * **Description:** Add your name (e.g., `Dev - laptop`).
8. Click **Save rules**.

> **⚠️ On the "My IP" dropdown:** AWS can populate it from a different address than the one you are actually using — most often when you are on a VPN, behind a split tunnel, or a captive network. Type the `/32` by hand and confirm it with `curl checkip.amazonaws.com`. A rule pointing at the wrong address fails silently: the connection attempt is *dropped*, not refused, so tools report a generic timeout with no hint that the security group is at fault.

> **Note:** Your public IP changes whenever you move between networks (home Wi-Fi, campus, mobile hotspot). Repeat this step each time.

---

## 👁️ 2. How to Access and Inspect the RDS Database

You can connect to and view database tables using any standard PostgreSQL client (such as **DBeaver**, **pgAdmin**, **TablePlus**, or VS Code extensions).

### Required Connection Details (`.env`)

These live in `backend/.env` as a single `DATABASE_URL`, not as separate fields:

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Host / Server** | `ourtearoa-db.cvmcgkcgaf7o.ap-southeast-2.rds.amazonaws.com` | RDS Endpoint |
| **Port** | `5432` | Default PostgreSQL port |
| **Database Name** | `postgres` | Active database name |
| **User** | `postgres` | Master DB username |
| **Password** | *(See `backend/.env`)* | Never commit this. It is gitignored. |
| **SSL Mode** | `verify-full` | See the note below — `require` is *not* sufficient. |

### Why `verify-full` and not `require`

AWS RDS terminates TLS with certificates issued by the **Amazon RDS** CA, which is not in the system trust store. The repository ships the CA bundle at the repo root:

```
global-bundle.pem
```

`sslmode=require` encrypts the traffic but does **not** verify the certificate, so the connection is still exposed to man-in-the-middle attacks. `verify-full` checks the certificate against the bundle and also confirms the hostname matches. Your `DATABASE_URL` carries both parameters:

```
?sslmode=verify-full&sslrootcert=../global-bundle.pem
```

> **Note:** `sslrootcert` is resolved relative to the process working directory. Because the path is `../global-bundle.pem`, the backend must be started from `backend/` (`cd backend && npm run dev`). Starting it from the repo root will fail to find the bundle.

---

### Option A: Connecting via GUI (DBeaver / TablePlus / pgAdmin)

1. Open your database management tool (e.g., [DBeaver](https://dbeaver.io/) or [TablePlus](https://tableplus.com/)).
2. Create a new **PostgreSQL** connection.
3. Paste the **Host**, **Port**, **Database**, **User**, and **Password** from above.
4. In your tool's SSL settings, enable SSL with mode `verify-full` and point **SSL root certificate** at the repo's `global-bundle.pem`.
5. Click **Test Connection**.
   * ✅ **Success:** You will see a green confirmation badge. You can now browse tables and run SQL queries directly.
   * ❌ **Timeout / hangs:** Verify your IP was correctly saved in the AWS Security Group (Step 1). This is the failure mode described above.
   * ❌ **Certificate error:** SSL mode is set to `require`/`prefer`, or the root certificate path is wrong.

---

### Option B: Terminal Command (CLI)

If you have `postgresql-client` installed, connect directly from your terminal. Run from the repo root so the relative certificate path resolves:

```bash
psql "host=ourtearoa-db.cvmcgkcgaf7o.ap-southeast-2.rds.amazonaws.com port=5432 dbname=postgres user=postgres sslmode=verify-full sslrootcert=global-bundle.pem" -c 'SELECT 1'
```

`psql` will prompt for the password — take it from `backend/.env`. Expect a single row containing `1`.

A **hang** means packets are being dropped (security group, or wrong public IP). A **password authentication failed** error means the network is fine and only the credentials are wrong — a useful way to tell the two apart, because a GUI client reports both as "cannot connect".

---

## 🩺 3. Verifying via the Health Endpoint

The fastest end-to-end check is `GET /api/health`, which runs a real `SELECT 1` against RDS and reports the round-trip time:

```bash
cd backend && npm run dev
curl -i http://localhost:3000/api/health
```

A healthy response:

```json
{
  "status": "UP",
  "timestamp": "2026-09-29T00:18:23.886Z",
  "database": "UP",
  "latencyMs": 34.9,
  "reason": null
}
```

The `latencyMs` value differs on every call, which is what demonstrates the value is genuinely live from the database rather than a constant.

### Reading a failure

When the check fails the endpoint returns **HTTP 503** with `status: "DOWN"`. The `reason` field identifies the cause:

| `reason` | Meaning | Fix |
| :--- | :--- | :--- |
| `misconfigured` | `DATABASE_URL` is not set | Add it to `backend/.env` |
| `timeout` | No response within `HEALTH_DB_TIMEOUT_MS` (default 3000) | Packets are being dropped — check the security group and that **Publicly accessible** is **Yes** |
| `unreachable` | Connection failed fast, so the port is open | Check the password, SSL mode, and the certificate path |

`timeout` versus `unreachable` is the useful split: `timeout` is always a network-layer problem, `unreachable` is always a configuration or credential problem. Tune the timeout with `HEALTH_DB_TIMEOUT_MS` in `backend/.env` if your link is slow enough that 3 s is too aggressive.

---

## ⚠️ Do not seed against RDS

`npm run db:seed` runs `prisma/seed.ts`, which calls `deleteMany()` on all five tables before inserting.

`backend/.env` points at the **local** Docker Postgres by default, so `npm run db:seed` is safe as written. It only becomes destructive once the RDS `DATABASE_URL` is uncommented in that file — from then on running it **will wipe the cloud database**. Confirm which host `prisma migrate status` names before running anything that writes:

```bash
npx prisma migrate status   # run from backend/; must say localhost:5432
```

To put it back afterwards, re-comment the RDS line and re-enable the local one.

Use the local Docker Postgres for anything that writes:

```bash
npm run db:up      # from repo root
```
