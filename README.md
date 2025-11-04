# ClubSync – Department Utility App

A modern club management app for directors and clubs. It covers registrations, events, budgets, and file reports, with a clean dark UI.

This README intentionally avoids any sensitive details (no real emails, passwords, tokens, or private endpoints). All examples use placeholders you should change locally.

## Features

- Director portal: approve/reject clubs, manage events, review and act on budget requests, view reports
- Club portal: manage members, create events, submit budget requests, upload/download reports
- Calendars: month view for planning and oversight
- Dark theme UI with responsive layout

## Tech stack

- Framework: Next.js 15 (App Router), React 18, TypeScript
- Styling: Tailwind CSS 3, PostCSS + Autoprefixer
- Calendars: FullCalendar v6, React Big Calendar + date-fns
- Auth: JWT (manual, with bcrypt password hashing)
- Data: MongoDB (primary) with an in‑memory mock fallback for development
- Icons: lucide-react

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud). If MongoDB is not reachable, the app falls back to an in‑memory mock DB for development.

## Quick start

1) Install dependencies

```bash
npm install
```

2) Create an environment file `.env.local` (placeholders shown)

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=clubsync
JWT_SECRET=replace-with-a-long-random-string
```

3) Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

## Scripts

- Reset to stock development data (clears Mongo collections if reachable, or calls the dev reset API):

```bash
npm run reset
```

## Project layout (selected)

- `src/app` – App Router pages and API routes
  - `api/**` – server route handlers (auth, dashboards, director/club actions, dev reset)
  - `dashboard/**` – director and club UIs
  - `globals.css`, `calendar.css` – global and calendar styles
- `src/components` – UI components (Sidebar, calendars, Modal)
- `src/hooks` – client hooks (e.g., director dashboard data)
- `src/lib` – database connection (Mongo + mock), utilities (currency formatting)
- `src/types` – TypeScript interfaces
- `public/uploads/<clubId>` – development storage for uploaded reports

## Configuration and data

- The app connects to MongoDB using `MONGODB_URI` and `MONGODB_DB`.
- If MongoDB is not available, a mock in‑memory database is used for development. Use the reset script or the dev reset API to return to a clean state.
- File uploads (club reports) are stored under `public/uploads/<clubId>` and served statically in development. For production, replace this with durable object storage.

## Security notes

- Do not commit `.env.local` or any secrets.
- Always use a strong, unique `JWT_SECRET` in production.
- Validate and sanitize all user inputs. File uploads are type-checked server-side for PDFs and Word documents.

## License

Add your preferred license file (e.g., `LICENSE`).

---

Built with Next.js, TypeScript, and Tailwind CSS.
