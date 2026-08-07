# 🗄️ AWS RDS PostgreSQL Setup & Access Guide

This guide explains how to whitelist your local IP address to access the **OurTearoa** cloud database during development, and how to inspect the database using standard GUI tools.

---

## 🔒 1. Adding Your IP to the AWS RDS Security Group

Because our RDS instance is firewalled, your local machine must be explicitly whitelisted in the AWS Security Group to connect from your laptop.

### Step-by-Step Instructions:

1. Log into the **[AWS Management Console](https://console.aws.amazon.com/rds/)**.
2. Select the **Asia Pacific (Sydney) `ap-southeast-2`** region in the top-right header.
3. In the left navigation pane, click **Databases** and select our database instance (`ouraotearoa-db-dev`).
4. Scroll down to the **Connectivity & security** tab and click the link under **VPC security groups** (e.g., `sg-0a1b2c3d4e5f`).
5. In the Security Group details panel:
   * Select the **Inbound rules** tab.
   * Click **Edit inbound rules**.
6. Click **Add rule**:
   * **Type:** `PostgreSQL` (Port `5432`)
   * **Source:** Select **My IP** from the dropdown. *(AWS automatically detects your current public IPv4 address, formatted as `xx.xx.xx.xx/32`)*.
   * **Description:** Add your name (e.g., `Dev - Alex Laptop`).
7. Click **Save rules**.

> **Note:** If your internet connection changes (e.g., switching from home Wi-Fi to a coffee shop or campus network), your public IP will change, and you will need to repeat this step.

---

## 👁️ 2. How to Access and Inspect the RDS Database

You can connect to and view database tables using any standard PostgreSQL client (such as **DBeaver**, **pgAdmin**, **TablePlus**, or VS Code extensions).

### Required Connection Details (`.env`)

Obtain these values from your local `server/.env` file:

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Host / Server** | `ouraotearoa-db-dev.cxxxxxxxxxxx.ap-southeast-2.rds.amazonaws.com` | Found under RDS Endpoint |
| **Port** | `5432` | Default PostgreSQL port |
| **Database Name** | `postgres` (or `ourtearoa-db`) | Active database name |
| **User** | `postgres` | Master DB username |
| **Password** | *(See server/.env)* | Store securely; do not commit to Git |
| **SSL Mode** | `Require` or `Prefer` | Recommended for AWS RDS |

---

### Option A: Connecting via GUI (DBeaver / TablePlus / pgAdmin)

1. Open your database management tool (e.g., [DBeaver](https://dbeaver.io/) or [TablePlus](https://tableplus.com/)).
2. Create a new **PostgreSQL** connection.
3. Paste the **Host**, **Port**, **Database**, **User**, and **Password** from above.
4. Click **Test Connection**. 
   * ✅ **Success:** You will see a green confirmation badge. You can now browse tables, inspect spatial data, and run SQL queries directly.
   * ❌ **Timeout / Connection Refused:** Verify that your IP address was correctly saved in the AWS Security Group (Step 1).

---

### Option B: Terminal Command (CLI)

If you have `postgresql-client` installed, connect directly from your terminal:

```bash
psql -h <YOUR_RDS_ENDPOINT> -U postgres -d postgres