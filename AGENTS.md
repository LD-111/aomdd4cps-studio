# AGENTS.md — AOMDD4CPS Studio Development Specification

## Project Mission
Rebuild the Agent-Oriented Model-Driven Development for Cyber-Physical Systems (AOMDD4CPS) tool from the ground up for vastly improved UI/UX, usability, and maintainability.

- **New stack (target)**: FastAPI (Python) backend + Next.js (React/TypeScript) frontend.
- **Goal**: Modern, intuitive web application that guides users through the full CIM → PIM → PSM → Code MDD process with excellent visual feedback, validation, and automation.
- **Full rebuild**: The legacy implementation is retired as active code. All new development happens in `src/`.

## Directory Layout (Authoritative)
```
/
├── AGENTS.md
├── README.md
├── LICENSE
├── MDD4CPS_process_overview.md
├── MDD4CPS_repository_structure_and_transformations.md
├── legacy-src/                 # READ-ONLY REFERENCE (original Flask + XSLT + Python)
│   ├── backend/
│   │   ├── backend.py          # XSLT transformation service (Saxon)
│   │   └── psm_to_code-arduinomkr1010.py  # Full PSM→Arduino code generator (~1300 LOC)
│   └── frontend/
│       ├── app.py
│       ├── templates/index.html
│       └── static/...
│           ├── input/xsl/      # CIM-PIM.xsl, CIM-PIM-Aux.xsl, PIM-PSM.xsl
│           └── input/json/     # CIM-PIM-Rules.json, PIM-PSM-Rules.json
├── src/                        # NEW IMPLEMENTATION (FastAPI + Next.js)
│   ├── backend/
│   └── frontend/
│       ├── AGENTS.md           # Frontend-specific: Next.js structure, components, UI conventions (see summary below)
│       ├── app/
│       ├── components/         # Modular UI (post-2026-09 refactor)
│       ├── lib/
│       └── public/...
├── semantics/                  # PRESERVE (validation artifacts)
│   ├── draw.io_models/
│   ├── structural_validations/ # OWL + HermiT cases
│   └── semantic_validations/   # SHACL + pySHACL cases
├── example/                    # Example CIM/PIM models + generated Arduino code
├── scratchpads/                # iStar 2.0 and PIM DSL draw.io libraries
├── images/
└── .gitignore
```

**Rules**:
- Never modify files under `legacy-src/`. Treat as frozen specification of exact transformation behavior.
- All new source lives under `src/`.
- `semantics/`, documentation, examples, and scratchpads are assets to be reused/integrated into the new tool.

## Core Domain (MDD4CPS Process) — Specification for Reimplementation
Preserve and faithfully reimplement the established process (see `MDD4CPS_process_overview.md` and `MDD4CPS_repository_structure_and_transformations.md` for authoritative details):

1. **CIM Phase**: iStar 2.0 models (agents/roles/actors as CPCs, goals, tasks, resources, softgoals, dependencies) created in diagrams.net using custom scratchpad libraries.
2. **CIM→PIM Transformation** (automated after user input):
   - Uses user-provided attributes via JSON-driven questionnaires (CIM-PIM-Rules.json).
   - XSLT logic (CIM-PIM.xsl + Aux) maps to PIM DSL constructs:
     - CPCs, `operational_goal`, `action`, `hw_resource`/`sw_resource`, refinement relations, communication threads/listeners/relations, data structures, timing, operation modes.
3. **PIM→PSM Transformation**:
   - Additional platform-specific input (PIM-PSM-Rules.json).
   - Restructures to intermediate XML ready for codegen (cpc, thread, function, commThread, etc.).
4. **PSM→Code**:
   - Currently targets Arduino MKR WiFi 1010 + FreeRTOS + MQTT.
   - Generates per-component folders with .ino, secrets.h, comm_utils.h, data structs, tasks, callbacks, etc.
   - Future: extensible to other platforms.
5. **Validation (future integration priority)**:
   - Structural (OWL/HermiT) and semantic (SHACL) checks from `semantics/`.
   - Detect missing messaging, invalid timing, multiple refinements, conflicting resource types, incomplete operation modes, etc.

Key artifacts whose behavior must be reproduced exactly (use legacy-src as oracle):
- Transformation rules in JSON.
- XSLT templates (especially element mappings, geometry handling, comm generation, qualification/contribution arrays, operation mode logic).
- Python codegen logic (type mapping, task/function generation, MQTT comm, AND/OR refinement encoding, traceability comments).

## Technology & Architecture Goals (New Implementation)
- **Backend (FastAPI)**:
  - REST/WS APIs for model upload, rule-driven questionnaires, transformation orchestration (port XSLT or reimplement in Python for transparency), PSM→Code generation, validation invocation.
  - Stateless or session-light design; support large XML models.
  - Include endpoints to run semantic/structural validations (integrate pySHACL, rdflib, etc.).
- **Frontend (Next.js + modern UI)**:
  - Drag-and-drop XML/model loading, live editing/preview of draw.io-compatible models.
  - Beautiful, guided multi-step wizards replacing crude modals.
  - Real-time transformation feedback, diff views, downloadable artifacts.
  - Platform selector, operation mode editors, data structure builders.
  - Integrated or embedded diagrams.net editor support (or equivalent visual modeling).
  - Validation results panel with actionable feedback.
  - Modern UX: dark mode, responsive, accessibility, progress indicators, history/undo for transformations.
- **Shared**:
  - Keep XSLT as optional engine (via subprocess or saxonche equivalent) or migrate logic to maintainable Python for better debuggability and extensibility.
  - Strong typing for models (Pydantic + Zod/TypeScript).
  - Clear separation: transformation engine, code generators (plugin architecture), validators.
- **Docker / Deployment**: Modern compose or standalone; easy local dev.

## Future Development Priorities (Spec)
1. **Fidelity first**: Reproduce 100% of current transformation + codegen outputs for existing example models.
2. **Full automation**: Eliminate the manual "run Python script" step; PSM→Code runs inside the tool and offers multi-platform targets.
3. **Validation as first-class**: Embed `semantics/` checks before/after each transformation stage with clear reporting.
4. **Superior UX overhaul** (primary project goal):
   - Visual model explorer.
   - Step-by-step guided process with context-sensitive help.
   - In-browser editing of attributes instead of one-shot modals.
   - Preview of generated code + download per component.
5. **Extensibility**:
   - Pluggable code generators (Arduino, ESP, other RTOS, etc.).
   - Custom rule/JSON extensions.
   - Import/export for various model formats.
6. **Quality**:
   - Comprehensive tests against legacy outputs (golden files from example/ and legacy runs).
   - Linting, type safety, CI.
   - Preserve and enhance all documentation.
7. **Long-term**:
   - WebSocket live collaboration or incremental transforms.
   - AI-assisted modeling suggestions (later).
   - Packaging as desktop app or hosted service (license permitting).

## License & Attribution Requirements (Mandatory)
This project is licensed under **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.

**Strict requirements** (see full `LICENSE`):
- **Attribution**: Every distribution, adaptation, or derivative must give appropriate credit, provide a link to the license, and indicate changes.
- **Required citation** (exact form):
  > AOMDD4CPS: An Agent-Oriented Model-Driven Development Process for Cyber-Physical Systems
- This is a continuation/fork of the original [`LD-111/MDD4CPS`](https://github.com/LD-111/MDD4CPS). Credit must be maintained in README, docs, and any UI "About" sections.
- Non-commercial use only without explicit permission.
- Third-party components (e.g., Saxon-HE under MPL-2.0) retain their own licenses.

**For all agents and contributors**:
- Never remove or weaken attribution notices when modifying or generating files.
- When porting docs, code comments, or generated artifacts, retain original element traceability comments where they exist.
- Update `README.md` and any new "About" pages to restate the background and citation.
- Contact for commercial licensing: aomdd4cps@gmail.com

## Agent Guidelines
- Scan `README.md`, `MDD4CPS_*.md`, `semantics/**/README.md`, `legacy-src/` (code + XSL + JSON + templates), `example/`, and `scratchpads/` before implementing transformations or UI flows.
- Use legacy-src behavior as the ground truth for output equivalence.
- Prioritize clean, well-documented, testable reimplementation over quick ports.
- Keep `legacy-src/` untouched.
- When editing docs or adding features, reinforce attribution and process fidelity.
- For UI work: focus on dramatically better experience than the original minimal Flask templates + basic JS.
- Update this AGENTS.md when scope, priorities, or architecture decisions evolve.
- **Nested AGENTS.md rule (mandatory)**: Upon ANY code or structure change in a directory containing (or requiring) an AGENTS.md, update the corresponding AGENTS.md file(s) in the same edit. This applies recursively: root for global, `src/frontend/AGENTS.md` for frontend, future `src/backend/AGENTS.md`, component subdirs, etc. This keeps agent context accurate and efficient.

## Nested AGENTS.md Files

- `src/frontend/AGENTS.md`: Frontend-specific specification for the Next.js implementation. Covers authoritative directory structure (`app/` for routing/orchestration, `components/` for reusable modular UI pieces, `lib/` for shared types), conventions (dark-only Tailwind theme via globals.css, no source comments in .ts/.tsx, prop-driven components, "use client" only where needed), modularization approach (see components: Header, ProcessStepper, TransformationControls, XmlInputPanel, XmlOutputPanel, QuestionnaireModal), wiring in thin `app/page.tsx`, and requirement to keep the file updated on every frontend change. It references the root AGENTS.md for licensing, process fidelity (CIM→PIM etc.), and overall rules. Created to maximize agentic efficiency by providing localized context.

## Initial State (as of rebuild start)
- `AGENTS.md` initialized as this spec.
- `src/backend` and `src/frontend` began as empty directories ready for FastAPI/Next.js scaffolding (frontend now contains modular Next.js implementation + nested AGENTS.md).
- Legacy code and all supporting artifacts (semantics, examples, docs) are present and must be respected.

This document takes precedence for agent behavior on future development of AOMDD4CPS Studio.
