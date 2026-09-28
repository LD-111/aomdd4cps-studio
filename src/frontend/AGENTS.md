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
│   ├── QuestionnaireModal.tsx
│   └── DiagramEditor/      # Subdir for large editor (post 2026-09-28 modularization)
│       ├── index.tsx
│       ├── DiagramEditor.tsx  # Coordinator (state, handlers, composition)
│       ├── Toolbar.tsx
│       ├── Sidebar.tsx
│       ├── Canvas.tsx
│       ├── Node.tsx
│       └── Handles.tsx
│   └── DiagramEditor.tsx   # Re-export shim (keeps import paths stable in page.tsx)
├── lib/                    # Shared types, utilities, pure logic (no UI)
│   ├── types.ts            # Mode, Step, future model types (Zod later)
│   └── diagram/            # Pure diagram model + utils (types, parseXmlToModel, modelToXml, geom, styles, palettes)
│       ├── index.ts
│       ├── types.ts
│       ├── model.ts
│       └── utils.ts
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
- Separate Diagram Editor screen (embed path) for full visual i*/PIM editing with direct apply back to process XML.
- Drag-and-drop + live editing of draw.io XML (raw + visual).
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

DiagramEditor (now in subdir components/DiagramEditor/ with re-export shim) implements separate full-screen editor view toggled via screen state in page; supports initialXML roundtrip and onApply to feed process seamlessly. Reusable for MDD phases via `phase` prop ('cim'|'pim') + onChange live. Same engine, different palettes/links. Pure logic extracted to lib/diagram/ (types, parseXmlToModel/modelToXml, utils, palettes). UI split into Toolbar/Sidebar/Canvas/Node/Handles for maintainability. All prior behavior and contracts preserved. Containers use resizable dashed boundary + parentId grouping. In-app visual SVG+DOM. Zero external deps, fully offline. 

## Nested AGENTS.md Rule (Mandatory)

**Upon ANY change to code or structure in a directory that has (or should have) an AGENTS.md, the respective AGENTS.md file(s) MUST be updated in the same change.**

- Root `AGENTS.md` for cross-cutting decisions.
- `src/frontend/AGENTS.md` for frontend-specific architecture, components, styling, Next.js patterns.
- Future: `src/backend/AGENTS.md`, `src/frontend/components/AGENTS.md` (if subdirs grow), etc.
- This maximizes Agentic efficiency by keeping context localized and up-to-date.
- When editing, also ensure root attribution/citation language is preserved in any new UI text ("AOMDD4CPS: An Agent-Oriented Model-Driven Development Process for Cyber-Physical Systems").

## Current State & Next Priorities (UI)

- Modularized (post initial setup + 2026-09-28 DiagramEditor split into subdir + lib/diagram pure layer).
- First-pass modern dark UI with mode switching, DnD, demo questionnaire, mock transform.
  - Separate Diagram Editor screen: phase-aware reusable engine for CIM (i*) + PIM (DSL) diagrams (now modularized: lib/diagram for model+parse+utils, components/DiagramEditor/* for Toolbar/Sidebar/Canvas/Node/Handles + coordinator). SVG canvas, dynamic palette/links per phase, node/edge sticky selection+delete, drag, phase-specific connect, label edit, custom aesthetics + rect/ellipse boundaries for containers, drag-to-group + auto parentId, visual cues). Parses/serializes draw.io XML (supports PIM nested parents on load). Live sync + keyed for phase switch in page; no raw XML, offline. Apply feeds back to process input. 
- Still demo-only (no real XSLT calls). Diagram Editor is now local/offline XML roundtrip helper (ideal for i* only, independent of external calls).
- Next: real backend transforms, rule-driven forms, validation panel, per-component previews.

See root AGENTS.md Future Development Priorities and UX overhaul items.

## References

- Root: `/AGENTS.md`
- Legacy behavior oracle: `legacy-src/frontend/static/...` (read-only)
- Example models: `example/models/`
- Process: `MDD4CPS_process_overview.md`, `MDD4CPS_repository_structure_and_transformations.md`

Update this file whenever frontend scope, component boundaries, or conventions change.
