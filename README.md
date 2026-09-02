# Planner Website CY — Improved

This version keeps the original visual design and page structure while fixing data, interaction and backend-integration problems.

## Main improvements

- A new Dashboard brings today's events, open tasks, habit progress and quick actions together.
- Todo completion is locked to one operation and removes one row once, so rapid clicking cannot duplicate tasks.
- Completed todos now have their own section with restore, permanent delete and one-click undo.
- Todo, event and habit records use stable IDs rather than sorted array indexes.
- Calendar, Daily Planner, Todo and Habit Tracker now share one data layer and consistent storage keys.
- The original local data (`myTodos` and `myHabits`) is migrated automatically.
- When logged in, pages use the Express/MySQL APIs; without a login they continue to work locally.
- Login and registration use the backend, bcrypt password hashes and JWT tokens. Plain-text password lists are no longer created in browser storage.
- Event update/delete APIs, current-user API, input validation, safe text rendering and duplicate-submit guards were added.
- Daily Planner now uses a full 24-hour timeline, a live current-time marker and automatic current-time scrolling.
- Habit Tracker shows daily/weekly completion and per-habit streaks while keeping checkboxes aligned to dates.
- Dark mode, mobile bottom navigation, active-page highlighting and non-blocking toast messages were added.
- A reproducible MySQL schema and automated validation tests were added.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the database with `Planner_backend/database/schema.sql`.

3. Copy `.env.example` to `.env` and set the database credentials and a long random `JWT_SECRET`.

4. Start the website:

   ```bash
   npm run dev
   ```

5. Open `http://127.0.0.1:3000/`.

Run the automated checks with:

```bash
npm test
```

## Project structure

- `Web9/`: original HTML/CSS pages plus the shared browser data and authentication modules.
- `Planner_backend/`: Express routes, controllers, authentication and MySQL access.
- `Planner_backend/database/schema.sql`: database tables and indexes.
- `test/`: automated validation tests.

Do not commit `.env` or `node_modules`; both are intentionally excluded.
