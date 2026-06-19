# Clevr Discord Bot

An automated community administration, onboarding, and analytics gateway designed for the Clevr Discord ecosystem. The application utilizes Node.js, TypeScript, and Prisma to manage multi-step interactive onboarding flows, role allocations, scheduled/branded server announcements, and community growth analytics.

---

## Functional Features

### Interactive Member Onboarding Gateway
Restricts new members to a single onboarding channel until they complete a private, ephemeral setup flow, then unlocks the rest of the server with the correct roles.
* **Automatic Channel Lockdown:** `/setup-onboarding` configures permission overwrites across every channel, denying view access to the `@unverified` role everywhere except the designated onboarding channel.
* **Join Gateway:** New members are automatically assigned `@unverified` on join (`guildMemberAdd`), so they only ever see the onboarding channel until they finish setup.
* **Persistent, Per-User Anchor:** A single "Start Setup" button stays posted in the onboarding channel permanently. Each member who clicks it gets their own private, ephemeral stepper — the anchor message itself never changes, so it works correctly for every new joiner without resetting.
* **Stateful User Tracking:** Records each step — discovery source (YouTube/Twitter/TikTok/Instagram/Friend/Discord Server), platform edition (Java/Bedrock), specialization (Development/Modeler/Texture Artist/Key Artist/Builder), and notification preferences (Network Updates/General Announcements/None) — into PostgreSQL.
* **Automated Role Management:** On completion, resolves all answers to real Discord role IDs (via environment variables), assigns them along with a base `@member` role, and removes `@unverified` so the member can see the full server. Unrecognized or unmapped answers are skipped safely rather than erroring.
* **Optional Notification Roles:** Members can select "None" at the notification step and receive no notification role at all.

### Member Profiles
* **`/myprofile`:** Shows the full onboarding profile (discovery source, platform, specialization, notifications) for the command user only. Ephemeral — nobody else can see it.
* **`/profile @user`:** Looks up another member's public profile — platform and specialization only, plus avatar, account creation date, and server join date. Discovery source and notification preferences are intentionally never shown for other users.

### Server Info
* **`/info`:** Posts a static info panel (rules, links, support info) ephemerally to the command user. Content lives in a hardcoded array at the top of `info.ts` — admins update it by editing the source and redeploying. No database or admin command involved yet.

### Dynamic Modal Announcement System
Enables administrative teams to publish uniformly branded, markdown-supported updates across guild communication channels via an abstracted, menu-guided workflow.
* **Centralized Color Registry:** `/announce-config` binds custom brand hex codes to specific operational categories (e.g., updates, events, network) inside the database.
* **Guided Category Selection:** `/announce` opens an ephemeral select menu populated from registered categories — no need to remember or type category names.
* **Native Input Canvas:** Selecting a category triggers a full-screen Discord modal sheet for title/body input.
* **Dynamic Embed Compilers:** Resolves parsed input against stored database color token maps to output clean, timestamped embeds.

### Scheduled & Recurring Announcements
Allows administrators to queue branded announcements for future delivery instead of posting immediately.
* **Guided Scheduling Flow:** `/announce-schedule` reuses the same category-select → modal pattern as `/announce`, with additional fields for send time and repeat interval.
* **Flexible Time Input:** Accepts relative shorthand (`30m`, `2h`, `1d`) or absolute timestamps (`2026-06-20 18:00`).
* **Repeat Support:** One-off, daily, or weekly — tracked via a `RepeatInterval` enum.
* **Background Dispatch Engine:** A polling scheduler checks for due announcements every 60 seconds and dispatches them to their original target channel.

### Community Analytics & Status Reporting
* **`/analytics`:** Admin-only breakdown of discovery source and platform edition, rendered as percentage bars plus exact counts.
* **`/serverstatus`:** Reports the current Discord server member count. Ephemeral — only visible to the command user.

---

## Available Commands

| Command              | Access     | Description                                                                              |
| --------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `/setup-onboarding`   | Admin      | Locks all channels for `@unverified` and deploys the persistent onboarding start button.   |
| `/announce-config`    | Admin      | Registers/updates a brand hex color for an announcement category.                         |
| `/announce`           | Admin      | Opens the category select menu → modal flow to post an announcement now.                   |
| `/announce-schedule`  | Admin      | Same flow as `/announce`, but queues delivery for a future time (optionally recurring).    |
| `/analytics`          | Admin      | Reports onboarding discovery-source and platform-edition breakdowns.                       |
| `/serverstatus`       | Public     | Reports current Discord server member count (ephemeral).                                   |
| `/info`               | Public     | Shows server rules, links, and support info (ephemeral, content set in source).            |
| `/myprofile`          | Public     | Shows your own full onboarding profile (ephemeral).                                         |
| `/profile`            | Public     | Shows another member's platform + specialization + avatar + account/join dates.            |

---

## Architectural Overview

The framework is architected as a modular, event-driven system built on top of `discord.js`. Rather than utilizing large monolithic interaction routing files, it uses a dynamic loading engine to register slash commands, gateway event listeners, and interactive components on application startup.

### Core Systems Summary

| System                  | Primary Mechanism                              | Data Interaction                            | Runtime Resolution                              |
| ----------------------- | ----------------------------------------------- | --------------------------------------------- | -------------------------------------------------- |
| Dynamic Module Loader   | Directory scanning with dynamic ESM imports     | Caches modules into client collections        | Executed on boot sequence                          |
| Join Gateway            | `guildMemberAdd` event listener                 | Assigns `@unverified` on member join          | Fires once per new member                          |
| State-Driven Onboarding | Button-triggered, per-user ephemeral stepper    | Commits selections to PostgreSQL              | Computes final role assignment + unlock on completion |
| Profile Lookup          | Slash commands reading `OnboardingState`        | Reads completed onboarding rows               | `/myprofile` (full, private) and `/profile` (partial, public) |
| Announcement Engine     | Select-menu-guided modal form processing        | Fetches category color configurations          | Generates branded Markdown embeds                  |
| Scheduling Engine       | Interval-based polling against PostgreSQL       | Reads/updates `ScheduledAnnouncement` rows      | Dispatches due announcements, advances repeats     |
| Analytics Engine        | Aggregation queries against onboarding data     | Reads `OnboardingState` rows                   | Computes breakdowns on demand via `/analytics`     |

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
* A Discord server with the following created ahead of time: an `@unverified` role, a `@member` role, an onboarding channel, and one role per onboarding answer (see Environment Variables below)

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

7. Run `/setup-onboarding` once in your target onboarding channel. This locks down every other channel for `@unverified` and posts the persistent "Start Setup" button. Safe to re-run if channels are added later (it re-applies overwrites and re-posts the anchor).

> **Note:** Steps 4–5 must be re-run any time `prisma/schema.prisma` changes (e.g. new models, or new columns like `discoverySource` / `completedAt` on `OnboardingState`).

---

## Configuration Management

### Environment Variables

```env
# Discord Gateway Credentials
DISCORD_BOT_TOKEN=your_secret_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_application_client_id_here
DISCORD_GUILD_ID=your_target_development_guild_id_here

# Database Secret Parameters
DB_USER=clevr_admin
DB_PASSWORD=super_secret_password
DB_NAME=clevr_bot_db
DATABASE_URL=postgresql://clevr_admin:super_secret_password@clevr-db:5432/clevr_bot_db?schema=public

# Onboarding Gateway Configuration
ONBOARDING_CHANNEL_ID=
UNVERIFIED_ROLE_ID=
MEMBER_ROLE_ID=

# Discovery Source Roles (Step 1)
ROLE_DISCOVERY_YOUTUBE=
ROLE_DISCOVERY_TWITTER=
ROLE_DISCOVERY_TIKTOK=
ROLE_DISCOVERY_INSTAGRAM=
ROLE_DISCOVERY_FRIEND=
ROLE_DISCOVERY_DISCORD=

# Platform Edition Roles (Step 2)
ROLE_PLATFORM_JAVA=
ROLE_PLATFORM_BEDROCK=

# Specialization Roles (Step 3)
ROLE_SPEC_DEV=
ROLE_SPEC_MODELER=
ROLE_SPEC_TEXTURE_ARTIST=
ROLE_SPEC_KEY_ARTIST=
ROLE_SPEC_BUILDER=

# Notification Preference Roles (Step 4) — optional, "None" is a valid choice
ROLE_NOTI_NETWORK_UPDATES=
ROLE_NOTI_GENERAL_ANNOUNCEMENTS=
```

All variables above `ONBOARDING_CHANNEL_ID` through `ROLE_SPEC_BUILDER` are required — the bot will refuse to boot and log exactly which one is missing if any are unset. The two `ROLE_NOTI_*` variables are optional; leaving them blank just means that notification role is never assigned, and members can still pick "None" regardless.

---

## Docker Infrastructure Layout

| Environment | Configuration File        | Intended Environment          | Key Characteristics                                                                          |
| ----------- | ------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Development | `docker-compose.yml`      | Local Workspace                | Builds code from local Dockerfile context and links directly to a local PostgreSQL container    |
| Production  | `docker-compose.prod.yml` | Remote Virtual Private Server  | Deploys using pre-built images from GHCR and restricts database exposure to localhost            |

---

## Deployment Pipeline

The repository utilizes GitHub Actions for continuous delivery to production infrastructure. The workflow is split into two specialized jobs.

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
- Onboarding channel lockdown — `/setup-onboarding` now auto-applies permission overwrites so `@unverified` members only see the onboarding channel.
- Persistent, per-user onboarding flow — a single button in the channel spawns an independent ephemeral stepper for every member, instead of one shared select menu.
- Real role assignment — discovery source, platform, specialization, and notification answers now map to actual role IDs via environment variables, with a base `@member` role granted on completion and `@unverified` removed.
- Discovery source options expanded to YouTube/Twitter/TikTok/Instagram/Friend/Discord Server.
- Specialization options updated to Development/Modeler/Texture Artist/Key Artist/Builder.
- Notification step now offers "None" as a real choice with no role assigned.
- `/serverstatus` made ephemeral (personal, not posted publicly).
- New `/info` command for static server info/rules/links (admin-edited in source).
- New `/myprofile` command — full private onboarding profile, ephemeral.
- New `/profile` command — public lookup of another member's platform + specialization + avatar + account/join dates, excluding their private discovery/notification data.

**Known issues / not yet verified in this pass:**
- Whether `startAnnouncementScheduler` is wired into `src/index.ts`'s startup sequence has not been re-confirmed since the original report that it wasn't — treat as still open unless separately verified.
- `/analytics` has not been re-reviewed against the new discovery-source/specialization option sets (Discord Server, Texture Artist, Key Artist, Builder) — its breakdown logic may need updating to include the new values.
- New channels created after `/setup-onboarding` has been run are not automatically locked down for `@unverified` — re-run `/setup-onboarding` after adding channels, or set the deny overwrite manually at the category level.
- `/info` content requires a code change + redeploy to update; there is no in-Discord admin command for it yet (by design, for now).

**Next up:**
- Confirm scheduler wiring and `/analytics` option coverage.
- Consider an admin command for `/info` content if editing source becomes a bottleneck.
- Consider auto-locking newly created channels via a `channelCreate` listener.