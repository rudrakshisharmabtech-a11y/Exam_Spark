# ExamSpark Frontend Integration Guide

## Project overview

ExamSpark is a role-based examination platform with a React frontend, Express API, MySQL persistence, and Supabase Auth. Some dashboards retain sample data, while account, exam, question, assignment, and attempt flows use the API.

## Technology and setup

- React 19 and TypeScript
- Vite 8 with the React plugin
- Tailwind CSS 4 through `@tailwindcss/vite`; the product styles are primarily in `src/index.css`
- Express 5 API, MySQL (`mysql2`), and Supabase Auth (`@supabase/supabase-js`)
- pnpm, pinned with Node.js 22 and pnpm 10.34.3 in `.mise.toml`

Copy `.env.example` to `.env`. Configure MySQL, a random `JWT_SECRET` of at least 32 characters, and the Supabase project URL/public anon key in both `SUPABASE_*` and `VITE_SUPABASE_*` variables. Enable Email, Google, and GitHub providers in Supabase; allow `http://localhost:8443/?auth=callback` as a redirect. Keep service-role keys and OAuth client secrets out of frontend variables.

```sh
pnpm install --frozen-lockfile
mysql -u root -p < server/schema.sql
```

Start `pnpm server:dev` and `pnpm dev` in separate terminals. Vite serves on port 8443 and proxies `/api` to port 3001. Student registration requires a reachable MySQL database. Teacher and administrator users must be provisioned in the `users` table before sign-in.

Useful checks and preview commands:

```sh
pnpm run typecheck
pnpm run build
pnpm preview
```

The development server uses port 8443 by default. `PORT` can override it. `vite.config.ts` also reads `.figma/make/site.json` and contains Figma preview/build plugins; keep `.figma/make` and the Vite configuration when maintaining that workflow.

## Source layout

- `index.html` is the Vite document shell.
- `src/main.tsx` mounts React and imports the global stylesheet.
- `src/App.tsx` owns the 16-route hash router and maps routes to page components.
- `src/components/ui.tsx` contains shared `Button`, `Icon`, `Logo`, route/role types, and hash navigation.
- `src/components/workspace.tsx` contains role navigation, the shared `Shell`, `PageTitle`, `Metric`, and the role menu definitions.
- `src/components/useDialogFocus.ts` gives modal dialogs and drawers initial focus, traps Tab within the open dialog, handles Escape when allowed, and restores focus on close.
- `src/pages/Marketing.tsx` and `src/pages/Auth.tsx` contain public screens and Supabase/legacy sign-in flows.
- `src/pages/Student.tsx`, `Attempt.tsx`, and `Results.tsx` contain the student dashboard/catalogue/preparation, attempt, and result experiences.
- `src/pages/Teacher.tsx` contains exam management, question bank, and analytics views.
- `src/pages/Admin.tsx` contains admin overview, user management, oversight, and settings views.
- `src/data.ts` is the typed source for sample exams, questions, and users.
- `src/state.ts` stores the selected exam and latest submission in memory, and the signed-in display name in local storage.
- `src/supabase.ts` configures the public Supabase client and exchanges validated Supabase sessions with the API.
- `server/auth.js` verifies Supabase sessions, checks MySQL roles, handles legacy bcrypt accounts, and issues HTTP-only session cookies.
- `server/schema.sql` defines MySQL account, student profile, exam, question, attempt, assignment, and study-resource tables.
- `src/index.css` holds the visual system, responsive rules, and component styles.
- `public/` contains static assets such as the favicon.

## Routes and modules

Routes use the URL hash so each screen can be opened directly without a routing package.

| Area | Hash routes |
| --- | --- |
| Public | `#/` (home), `#/login`, `#/register` |
| Student | `#/student`, `#/study`, `#/discover`, `#/analysis`, `#/assignments`, `#/prepare`, `#/attempt`, `#/results` |
| Teacher | `#/teacher`, `#/create`, `#/bank`, `#/analytics` |
| Admin | `#/admin`, `#/users`, `#/oversight`, `#/settings` |

The root URL without a hash opens the public homepage; a Supabase OAuth callback is routed through sign-in for session exchange. Email/password student registration and Google/GitHub provider login use Supabase when configured; existing bcrypt-backed local accounts remain supported for password login. The API maps the verified Supabase email to an active MySQL user and role.

## Data and demo behavior

`src/data.ts` exports sample class and analytics records. `src/demoData.ts` seeds browser-local exams and questions for demo users. The sign-in screen can enter the student demo as Rudrakshi Sharma or the teacher demo as Dr. Elias Ford without a password or account creation. Demo teachers can create exams, add questions, and publish them; demo students can take those exams and see browser-calculated results. Demo assignments also share four sample daily tasks through browser local storage; completion updates a progress report but does not grade submitted work. These demo records are not sent to or shared through the API.

Configured accounts continue to use the API for exam/question records, attempts, and server-side grading. Demo records remain local to the current browser. The countdown and browser tab-switch warning are demonstrations, not exam security controls.

There is no frontend test framework installed in this project.

## Backend integration points

The Express routes are defined in `server/auth.js` and `server/routes.js`. `src/api.ts` is the frontend API helper. The API health check is `GET /api/health`.

The backend should own:

- Supabase token verification, legacy bcrypt credential verification, account profile persistence, role enforcement, and cookie sessions.
- Exam/question/user CRUD, scheduling, publication, and durable search/filter/pagination.
- Server-authoritative attempt start/end times, answer saves, submission acceptance, and anti-cheating policy.
- Grading, published results, analytics aggregation, and exports.
- File/import handling and admin actions.

Never store plaintext passwords, Supabase access tokens, provider secrets, or service-role keys in `server/schema.sql`. Supabase Auth stores Supabase credentials; MySQL stores account/profile and exam records. Existing teacher/admin users must be provisioned with the correct role in MySQL before they can exchange a Supabase session.

## Current assumptions and limitations

- The backend requires `.env`, reachable MySQL, and a valid Supabase project configuration for full sign-in.
- Some dashboard and analytics panels still use sample data.
- The countdown and tab-switch notice are demonstrations, not exam security controls.
- Teacher and administrator account provisioning does not yet have a dedicated UI.
- The settings screen is a placeholder for several backend-owned capabilities.
- Hash routing is intentionally lightweight. Adopt a routing library only if the product needs nested routes, route guards, or richer history behavior.

## Continuing development

1. Use the feature-specific page module and shared components rather than adding another screen to a single application file.
2. Keep shared presentation and keyboard behavior in `src/components`; keep domain sample data in `src/data.ts` until service contracts are agreed.
3. Preserve the current ExamSpark visual identity in `src/index.css`. Verify any layout changes at desktop, tablet, and narrow mobile widths.
4. Add backend service contracts and tests when the backend team provides approved API shapes. Do not infer endpoint URLs from the mock UI.
5. Run `pnpm run typecheck` and `pnpm run build` before handing off frontend changes.
