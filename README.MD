# Clevr Discord Bot

An automated community administration, onboarding, and analytics gateway designed for the Clevr Discord ecosystem. The application utilizes Node.js, TypeScript, and Prisma to manage multi-step interactive onboarding flows, role allocations, scheduled/branded server announcements, and community growth analytics.

---

## Functional Features

### Interactive Member Onboarding Gateway
Provides a structured validation sequence for incoming server members to establish target demographics and profile metrics before granting access permissions.
* **Persistent Anchor Components:** Deploys interactive select menus within designated onboarding channels to initiate the tracking loop.
* **Stateful User Tracking:** Records individual selection steps — discovery source (YouTube/Twitter/TikTok/Instagram/Friend), platform edition (Java/Bedrock), specialization roles, and notification preferences — securely into PostgreSQL.
* **Automated Role Management:** Evaluates submission matrices upon completion to automatically apply corresponding guild roles and remove restriction flags. *(Currently non-functional — see Development Status.)*

### Dynamic Modal Announcement System
Enables administrative teams to publish uniformly branded, markdown-supported updates across guild communication channels via an abstracted, menu-guided workflow.
* **Centralized Color Registry:** Offers an administrative command (`/announce-config`) to bind custom brand hex codes to specific operational categories (e.g., updates, events, network) inside the database.
* **Guided Category Selection:** `/announce` opens an ephemeral select menu populated from registered categories — no need to remember or type category names.
* **Native Input Canvas:** Selecting a category triggers a full-screen Discord modal sheet for title/body input, eliminating the layout restrictions of standard slash command option fields.
* **Dynamic Embed Compilers:** Resolves the parsed input strings against the stored database color token maps at runtime to output clean, timestamped informational embeds.

### Scheduled & Recurring Announcements
Allows administrators to queue branded announcements for future delivery instead of posting immediately.
* **Guided Scheduling Flow:** `/announce-schedule` reuses the same category-select → modal pattern as `/announce`, with additional fields for send time and repeat interval.
* **Flexible Time Input:** Accepts relative shorthand (`30m`, `2h`, `1d`) or absolute timestamps (`2026-06-20 18:00`).
* **Repeat Support:** Announcements can be one-off, daily, or weekly — tracked via a `RepeatInterval` enum in the database.
* **Background Dispatch Engine:** A polling scheduler checks for due announcements every 60 seconds and dispatches them to their original target channel.

### Community Analytics & Status Reporting
Surfaces growth and engagement metrics derived from onboarding data.
* **`/analytics`:** Admin-only breakdown of discovery source (YouTube/Twitter/TikTok/Instagram/Friend) and platform edition (Java/Bedrock), rendered as percentage bars plus exact counts.
* **`/serverstatus`:** Minimal public command reporting live Discord guild member count.

---

## Available Commands

| Command              | Access     | Description                                                                 |
| --------------------- | ---------- | ----------------------------------------------------------------------------- |
| `/setup-onboarding`   | Admin      | Deploys the onboarding anchor embed into the current channel.                 |
| `/announce-config`    | Admin      | Registers/updates a brand hex color for an announcement category.            |
| `/announce`           | Admin      | Opens the category select menu → modal flow to post an announcement now.      |
| `/announce-schedule`  | Admin      | Same flow as `/announce`, but queues delivery for a future time (optionally recurring). |
| `/analytics`          | Admin      | Reports onboarding discovery-source and platform-edition breakdowns.          |
| `/serverstatus`       | Public     | Reports current Discord server member count.                                  |

---

## Architectural Overview

The framework is architected as a modular, event-driven system built on top of `discord.js`. Rather than utilizing large monolithic interaction routing files, it uses a dynamic loading engine to register slash commands, gateway event listeners, and interactive components on application startup.

### Core Systems Summary

| System                  | Primary Mechanism                           | Data Interaction                       | Runtime Resolution                           |
| ----------------------- | ------------------------------------------- | --------------------------------------- | --------------------------------------------- |
| Dynamic Module Loader   | Directory scanning with dynamic ESM imports | Caches modules into client collections  | Executed on boot sequence                     |
| State-Driven Onboarding | Interactive select menu workflow engines    | Commits selections to PostgreSQL        | Computes final role assignment on completion  |
| Announcement Engine     | Select-menu-guided modal form processing    | Fetches category color configurations   | Generates branded Markdown embeds              |
| Scheduling Engine       | Interval-based polling against PostgreSQL   | Reads/updates `ScheduledAnnouncement` rows | Dispatches due announcements, advances repeats |
| Analytics Engine        | Aggregation queries against onboarding data | Reads `OnboardingState` rows             | Computes breakdowns on demand via `/analytics` |

---

## Technical Stack

* **Runtime Environment:** Node.js (configured for native Node16 ECMAScript Modules)
* **Language:** TypeScript
* **API Wrapper:** discord.js
* **Database Object-Relational Mapping:** Prisma 7
* **Database Engine:** PostgreSQL
* **Containerization and Deployment:** Docker, Docker Compose, GitHub Actions

---

## Local Development Setup

### Prerequisites

* Node.js (v20 or higher)
* pnpm package manager
* Active PostgreSQL database instance
* Discord Application Bot token with Server Members and Message Content gateway intents enabled

### Installation Sequence

1. Clone the repository to the local workspace.
2. Create a `.env` file in the root directory matching the configuration layout specified below.
3. Install project dependencies:

```bash
pnpm install
```

4. Generate the type-safe Prisma client definitions:

```bash
pnpm prisma generate
```

5. Synchronize the database schema to PostgreSQL:

```bash
pnpm prisma db push
```

6. Build and start the bot:

```bash
pnpm run build && pnpm start
```

> **Note:** Steps 4–5 must be re-run any time `prisma/schema.prisma` changes (e.g. after pulling updates that add new models like `ScheduledAnnouncement`).

---

## Configuration Management

### Environment Variables

The application expects a `.env` file at the root level containing the following configuration values:

```env
DISCORD_TOKEN=your_discord_bot_application_token
DATABASE_URL=postgresql://db_user:db_password@localhost:5432/db_name

DB_USER=clevr_admin
DB_PASSWORD=super_secret_password
DB_NAME=clevr_bot_db
```

---

## Docker Infrastructure Layout

| Environment | Configuration File        | Intended Environment          | Key Characteristics                                                                          |
| ----------- | ------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Development | `docker-compose.yml`      | Local Workspace                | Builds code from local Dockerfile context and links directly to a local PostgreSQL container    |
| Production  | `docker-compose.prod.yml` | Remote Virtual Private Server  | Deploys using pre-built images from GHCR and restricts database exposure to localhost            |

---

## Deployment Pipeline

The repository utilizes GitHub Actions for continuous delivery to production infrastructure. The workflow is split into two specialized jobs.

### Automation Stage Specifications

```text
[Push to Main Branch]
          │
          ▼
┌──────────────────────────────────────┐
│       Job 1: Build and Package       │
├──────────────────────────────────────┤
│ 1. Check out repository code         │
│ 2. Authenticate with GHCR Registry   │
│ 3. Compile assets & build container  │
│ 4. Push image artifact to GitHub     │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│      Job 2: Remote Deployment        │
├──────────────────────────────────────┤
│ 1. Transfer docker-compose.prod.yml  │
│ 2. SSH establish remote shell access │
│ 3. Docker compose pull new images    │
│ 4. Execute prisma db push migrations │
│ 5. Perform zero-downtime app restart │
└──────────────────────────────────────┘
```

---

## ⚠️ Development Status

**Recently completed:**
- Two-step `/announce` flow (category select menu → modal), replacing the old manual category-typing requirement.
- `/announce-schedule` for one-off and recurring announcements, with background dispatch polling.
- `/analytics` command for discovery-source and platform-edition reporting.
- `/serverstatus` minimal member-count command.

**Known issues:**
- **Role assignment is non-functional.** The final onboarding step (`onboarding.ts`) attempts to assign roles using hardcoded placeholder strings instead of real role IDs, so `member.roles.add(...)` silently fails. Fix is scoped (env-var-based role IDs) but intentionally deferred for now.
- The announcement scheduler (`startAnnouncementScheduler`) is implemented but **not yet wired into `src/index.ts`'s startup sequence** — needs to be called once inside the `clientReady` handler.

**Next up:**
- Wire the scheduler into bootstrap.
- Fix role assignment via environment-variable-based role IDs.
- Expand onboarding's discovery-source options to match analytics needs (TikTok, Instagram, Friend/Word of Mouth) going forward.