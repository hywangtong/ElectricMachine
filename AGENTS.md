# Repository Guidelines

## 1. Think Before Working

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Surgical Changes

**Change only what you must. Clean up only your own mess.**

When editing existing work:

- Don’t “improve” adjacent content, wording, structure, or formatting unless asked.
- Don’t reorganize things that aren’t part of the problem.
- Match the existing style, even if you would do it differently.
- If you notice an unrelated issue, mention it — don’t fix it without permission.

When your changes create loose ends:

- Remove or update only the parts made unnecessary by YOUR changes.
- Don’t remove pre-existing unused, outdated, or questionable material unless asked.

The test: Every change should trace directly to the user’s request.

## 3. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs and clarifying questions come before implementation rather than after mistakes.

## Project Structure & Module Organization

This is a Chinese-language electric machines course presented as a static React/TypeScript slide site using Vite/Vinext and Tailwind CSS.

- `app/`: page entry point, metadata, and global styles.
- `content/course.ts`: chapter definitions, learning objectives, and slide order.
- `components/course-player.tsx`: slide templates, navigation, keyboard shortcuts, and fullscreen behavior.
- `components/chapter-galaxy.tsx`: interactive chapter map; `components/ui/`: reusable shadcn components.
- `hooks/` and `lib/`: shared hooks and utilities; `public/`: local static assets.
- `scripts/build.mjs`: build and prerender checks. Deployable output is `dist/client/`; `dist/server/` is intermediate output.

## Build, Test, and Development Commands

Use Node.js 22.13+ and npm. Run commands from the repository root:

- `npm ci`: install dependencies from the lockfile.
- `npm run dev -- --port 5173`: start development at `http://127.0.0.1:5173`.
- `npm run typecheck`: run strict TypeScript checks without emitting code.
- `npm run lint`: run Oxlint on course code and selected active components; unused scaffold components are excluded.
- `npm run format -- AGENTS.md`: format a specific file with Oxfmt; substitute changed paths.
- `npm run build`: build, prerender, and verify the static course HTML. Preserve this custom entry point for Windows compatibility.
- `npm start`: preview the build at `http://127.0.0.1:4173`.

## Coding Style & Naming Conventions

Use two-space indentation, semicolons, single quotes, and Oxfmt's 80-column target. Follow strict TypeScript; avoid explicit `any`. Use PascalCase for components and types, camelCase for functions and variables, and kebab-case filenames such as `course-player.tsx`. Prefer `@/` imports for repository modules. Retain `'use client'` boundaries for interactive components.

## Course Content Guidelines

Keep slide IDs unique, stable, and kebab-case; `chapterId` must reference an existing chapter. Preserve Chinese teaching copy and the 1600 × 900 canvas. Split overflowing content into slides instead of adding internal scrolling. Keep assets local. See `README.md` for slide examples.

## Testing Guidelines

No automated test framework, test naming convention, or coverage threshold is configured. Before submitting code, run typecheck, lint, and build. Manually verify chapter navigation, keyboard/touch controls, fullscreen, hash-link refresh/back/forward, and desktop/mobile scaling. Check projection and fullscreen on classroom equipment when relevant.

## Commit & Pull Request Guidelines

There is no commit history yet. Use concise imperative subjects, for example `Add transformer lesson slides`. Keep changes focused. PRs should explain the change, link relevant issues, list validation performed, and include screenshots for visual changes. Exclude generated output and unrelated scaffold edits.
