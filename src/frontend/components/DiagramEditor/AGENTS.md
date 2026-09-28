# AGENTS.md — DiagramEditor subdir (modular visual i*/PIM editor)

This is a nested AGENTS.md for the DiagramEditor component group.

**Context**: Extracted 2026-09-28 from monolithic ~1146 LOC file to improve maintainability per frontend AGENTS "small, prop-driven" rule.

## Structure
- DiagramEditor.tsx: owns all state (model, selection, drag refs, undo stacks), handlers, effects, key handling, updateModel. Composes Toolbar + Sidebar + Canvas (with children for nodes/handles).
- Toolbar.tsx, Sidebar.tsx: presentational controls (phase aware buttons/palette list).
- Canvas.tsx: scroll + relative container + SVG layer for boundaries + edges (uses lib utils for intersect). Accepts children for overlaid nodes/handles.
- Node.tsx: single absolutely positioned node (supports edit input).
- Handles.tsx: 4 resize handles for selected container.
- index.tsx + ../DiagramEditor.tsx (shim): keep public import `from '../components/DiagramEditor'` stable in app/page.tsx.

## Rules for this subdir
- All changes here require update of this AGENTS.md + parent src/frontend/AGENTS.md in same edit (nested rule).
- Pure non-UI logic lives in ../../lib/diagram/* (do not duplicate).
- Keep external contract identical: DiagramEditorProps, phase-driven, XML roundtrip fidelity (use legacy/examples as oracle), no behavior change to drag/resize/group/undo/connect/edit/apply.
- No source comments in .tsx.
- Subcomponents receive data+callbacks via props (controlled).
- When editing Canvas/Node etc, ensure pointer event capture, liveDrag, parent propagation, boundary math, and getRectBoundaryIntersection stay correct.
- After edit: from src/frontend/ run `npm run lint && npx tsc --noEmit && npm run build`.

## Fidelity
The parseXmlToModel + modelToXml in lib/diagram/model.ts + utils must reproduce exact draw.io XML structure used by the MDD process (flat cells + boundaryFor objects, styles, types).

See root + src/frontend/AGENTS.md for overall, licensing (CC BY-NC 4.0 + citation), and process.

Update this file on any structural or behavioral change inside DiagramEditor/.
