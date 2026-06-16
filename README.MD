# Clevr Network Discord Bot

An automated community administration and onboarding gateway designed for the Clevr Network Discord ecosystem. The application utilizes Node.js, TypeScript, and Prisma to manage multi-step interactive onboarding flows, role allocations, and database-driven branded server announcements.

---

## Architectural Overview

The framework is architected as a modular, event-driven system built on top of `discord.js`. Rather than utilizing large monolithic interaction routing files, it uses a dynamic loading engine to register slash commands, gateway event listeners, and interactive components on application startup.

### Core Systems Summary

| System                  | Primary Mechanism                           | Data Interaction                       | Runtime Resolution                           |
| ----------------------- | ------------------------------------------- | -------------------------------------- | -------------------------------------------- |
| Dynamic Module Loader   | Directory scanning with dynamic ESM imports | Caches modules into client collections | Executed on boot sequence                    |
| State-Driven Onboarding | Interactive select menu workflow engines    | Commits selections to PostgreSQL       | Computes final role assignment on completion |
| Announcement Engine     | Native Discord modal form input processing  | Fetches category color configurations  | Generates branded Markdown embeds            |

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
| ----------- | ------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| Development | `docker-compose.yml`      | Local Workspace               | Builds code from local Dockerfile context and links directly to a local PostgreSQL container |
| Production  | `docker-compose.prod.yml` | Remote Virtual Private Server | Deploys using pre-built images from GHCR and restricts database exposure to localhost        |

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

Current focus is on testing, validation, and verification of onboarding workflows, role assignment logic, announcement generation, and deployment reliability.

Future development cycles will concentrate on expanding automation capabilities and improving operational observability.
