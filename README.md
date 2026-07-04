# NBRRMD Commo Tracker

Web application to monitor outgoing communication letters from NBRRMD — replacing the Google Sheets tracker with a persistent database, reference uploads, Claude AI assistance, admin locking, and monthly exports.

## Features

- **Communication tracker** — columns match the original sheet (LN, Date Drafted, Commo Type, Subject, To, PIC, Received By/Date, Status, Remarks)
- **Admin portal** — lock/unlock records so they cannot be edited
- **User portal** — encode letters, update remarks, upload references; locked records require an **edit request**
- **Reference letter upload** — PDF, DOCX, TXT stored on Vercel Blob; text extracted for AI context
- **Claude AI assistant** — draft or reply to letters using uploaded references
- **Monthly stats** — count of letters per month, by status and commo type
- **Export** — Excel or CSV with creation dates

## Tech stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Neon Postgres + Prisma
- Vercel Blob (file storage)
- Anthropic Claude via Vercel AI SDK

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `ADMIN_PASSWORD` | Default: `admin.viv` |
| `USER_PASSWORD` | Default: `viv.md` |
| `SESSION_SECRET` | Long random string for JWT sessions |
| `ANTHROPIC_API_KEY` | Claude API key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (optional for local dev) |

### 3. Database

```bash
npx prisma db push
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the environment variables above.
4. Create a [Neon](https://neon.tech) database and paste `DATABASE_URL`.
5. Enable [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) and add `BLOB_READ_WRITE_TOKEN`.
6. Deploy — run `prisma db push` against production once (or use migrations).

## Portal passwords

| Role | Default password | Access |
|------|------------------|--------|
| Admin | `admin.viv` | Lock/unlock, review edit requests, full edit |
| User | `viv.md` | Encode, remarks, references; request edits when locked |

Change these via `ADMIN_PASSWORD` and `USER_PASSWORD` in production.

## Project structure

```
src/
  app/
    dashboard/          Main tracker table
    communications/     New letter + detail (AI chat, references)
    stats/              Monthly counts
    export/             Download XLSX/CSV
    requests/           Admin edit request queue
    api/                REST + Claude streaming
  components/           NavBar, shared UI
  lib/                  Auth, Prisma, constants, text extraction
prisma/schema.prisma    Database models
```
