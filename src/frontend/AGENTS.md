# AGENTS.md — AOMDD4CPS Studio Frontend (Next.js)

This is the **frontend-specific** agent specification, nested under the root `AGENTS.md`. It takes precedence for all work inside `src/frontend/`.

**Always read the root `AGENTS.md` first** for project mission, licensing (CC BY-NC 4.0 + required citation), process fidelity, and high-level rules. Never modify anything under `legacy-src/`.

## Directory Structure (Authoritative for Frontend)

```
src/frontend/
├── app/                    # Next.js App Router (pages, layouts, routes)
│   ├── layout.tsx          # Root layout, metadata, fonts, global dark theme
│   ├── page.tsx            # Main orchestrator (thin, state + composition)
│   └── globals.css         # Tailwind + custom design tokens (dark-only zinc palette)
├── components/             # Reusable, composable UI pieces (modular since 2026-09)
│   ├── Header.tsx
│   ├── ProcessStepper.tsx
│   ├── TransformationControls.tsx
│   ├── XmlInputPanel.tsx
│   ├── XmlOutputPanel.tsx
│   └── QuestionnaireModal.tsx
├── lib/                    # Shared types, utilities, pure logic (no UI)
│   └── types.ts            # Mode, Step, future model types (Zod later)
├── public/
│   ├── input/              # Copied from legacy (CIM-PIM-Rules.json, PIM-PSM-Rules.json, XSLs) — reference only for now
│   └── examples/           # Sample CIM/PIM models for demo loading
├── package.json
├── tsconfig.json
├── next.config.ts
└── AGENTS.md               # This file (update on any frontend scope/arch change)
```

- `app/` is for routing + top-level composition only. Keep page.tsx minimal.
- `components/` for presentational + interactive building blocks. Each should be small, prop-driven, and testable in isolation.
- `lib/` for non-UI concerns (types, helpers, future API clients).
- Static assets live in `public/`. Do **not** import XSL/JSON logic here yet — transformations are backend responsibility.
- No `pages/`, no `src/` inside frontend (Next app dir convention).

## Technology & Conventions

- Next.js 16 + React 19 + TypeScript + Tailwind v4 (app-tw template).
- Dark-only theme enforced (`dark` class, CSS vars in globals.css).
- "use client" **only** on components that need hooks/events (prefer lift state to page.tsx orchestrator).
- No inline comments in `.tsx`/`.ts` source (per root rules). Documentation belongs in AGENTS.md, READMEs, or commit messages.
- Strong preference for composition over complex state in leaves. Use controlled props.
- CSS: extend globals.css with `.panel`, `.btn-*`, `.dropzone`, `.modal*`, `.step*` tokens. Avoid ad-hoc styles.
- File naming: PascalCase for components, camel for lib.
- Imports: relative within frontend; from `../lib/types`, `../components/XXX`.
- State for the MDD flow (mode, XMLs, step, answers) lives in `app/page.tsx` until a global store (Zustand?) is introduced.

## UI/UX Goals (from root)

- Guided multi-step wizards (current stepper + modal is first iteration).
- Drag-and-drop + live editing of draw.io XML.
- Replace one-shot modals with in-context + progressive disclosure.
- Visual feedback for transformations, future: diff views, progress, undo.
- Platform selectors, data structure builders, operation mode editors.
- Accessibility, responsive, keyboard friendly.

When adding features:
- Update the stepper or introduce new step components.
- Make questionnaire truly dynamic (parse loaded XML + rules JSON) in a future `Questionnaire/` subdir.
- Add preview panes for generated artifacts.

## Adding / Changing Components

1. Create or edit under `components/`.
2. Export default React functional component receiving all data via props (no internal global state).
3. Add or extend types in `lib/types.ts`.
4. Wire in `app/page.tsx` (keep orchestration logic here).
5. Update this `AGENTS.md` (see rule below).
6. Run `npm run lint && npx tsc --noEmit && npm run build` from `src/frontend/`.

## Nested AGENTS.md Rule (Mandatory)

**Upon ANY change to code or structure in a directory that has (or should have) an AGENTS.md, the respective AGENTS.md file(s) MUST be updated in the same change.**

- Root `AGENTS.md` for cross-cutting decisions.
- `src/frontend/AGENTS.md` for frontend-specific architecture, components, styling, Next.js patterns.
- Future: `src/backend/AGENTS.md`, `src/frontend/components/AGENTS.md` (if subdirs grow), etc.
- This maximizes Agentic efficiency by keeping context localized and up-to-date.
- When editing, also ensure root attribution/citation language is preserved in any new UI text ("AOMDD4CPS: An Agent-Oriented Model-Driven Development Process for Cyber-Physical Systems").

## Current State & Next Priorities (UI)

- Modularized (post initial setup).
- First-pass modern dark UI with mode switching, DnD, demo questionnaire, mock transform.
- Still demo-only (no real XSLT calls).
- Future: embed diagrams.net, real rule-driven forms using the JSONs in public/input, validation panel, per-component code preview downloads.

See root AGENTS.md Future Development Priorities and UX overhaul items.

## References

- Root: `/AGENTS.md`
- Legacy behavior oracle: `legacy-src/frontend/static/...` (read-only)
- Example models: `example/models/`
- Process: `MDD4CPS_process_overview.md`, `MDD4CPS_repository_structure_and_transformations.md`

Update this file whenever frontend scope, component boundaries, or conventions change.
