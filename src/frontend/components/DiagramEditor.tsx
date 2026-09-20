"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

interface DiagramEditorProps {
  initialXML?: string;
  onApply: (xml: string) => void;
  onBack: () => void;
}

type NodeType = 'actor' | 'goal' | 'task' | 'resource' | 'softgoal' | 'role';
type EdgeType = 'and-refinement' | 'or-refinement' | 'dependency' | 'contribution';

interface DiagNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  boundaryX?: number;
  boundaryY?: number;
  boundaryW?: number;
  boundaryH?: number;
  parentId?: string;
}

interface DiagEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  value?: string;
}

interface DiagramModel {
  nodes: DiagNode[];
  edges: DiagEdge[];
  nextId: number;
}

const PALETTE: { type: NodeType; label: string; w: number; h: number }[] = [
  { type: 'actor', label: 'Actor', w: 80, h: 80 },
  { type: 'goal', label: 'Goal', w: 140, h: 40 },
  { type: 'task', label: 'Task', w: 120, h: 42 },
  { type: 'resource', label: 'Resource', w: 100, h: 44 },
  { type: 'softgoal', label: 'Softgoal', w: 120, h: 50 },
  { type: 'role', label: 'Role', w: 80, h: 80 },
];

function getNodeStyle(type: NodeType) {
  switch (type) {
    case 'actor':
    case 'role':
      return { borderRadius: '50%', background: '#dae8fc', border: '1px solid #6c8ebf' };
    case 'goal':
      return { borderRadius: '20px', background: '#dae8fc', border: '1px solid #6c8ebf' };
    case 'task':
      return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', background: '#dae8fc', border: '1px solid #6c8ebf' };
    case 'resource':
      return { background: '#dae8fc', border: '1px solid #6c8ebf' };
    case 'softgoal':
      return { borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%', background: '#dae8fc', border: '1px solid #6c8ebf' };
    default:
      return { background: '#dae8fc', border: '1px solid #6c8ebf' };
  }
}

function parseXmlToModel(xml: string): DiagramModel {
  const model: DiagramModel = { nodes: [], edges: [], nextId: 100 };
  if (!xml) return model;
  try {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const cells = doc.querySelectorAll('mxCell, object');
    const idMap = new Map<string, DiagNode>();
    cells.forEach((el) => {
      const isObj = el.tagName === 'object';
      const mx = isObj ? el.querySelector('mxCell') : el;
      if (!mx) return;
      const id = el.getAttribute('id') || mx.getAttribute('id') || '';
      const parent = mx.getAttribute('parent') || '';
      if (parent !== '1') return;
      const geo = mx.querySelector('mxGeometry');
      if (!geo) return;
      const x = parseFloat(geo.getAttribute('x') || '0');
      const y = parseFloat(geo.getAttribute('y') || '0');
      const w = parseFloat(geo.getAttribute('width') || '100');
      const h = parseFloat(geo.getAttribute('height') || '40');
      const label = (el.getAttribute('label') || mx.getAttribute('value') || '').replace(/<[^>]*>/g, '');
      const typ = (el.getAttribute('type') || '').toLowerCase() as NodeType;
      if (mx.getAttribute('vertex') === '1' && typ && ['actor','goal','task','resource','softgoal','role'].includes(typ)) {
        const node: DiagNode = { id, type: typ, label: label || typ, x, y, w, h };
        model.nodes.push(node);
        idMap.set(id, node);
      }
    });
    cells.forEach((el) => {
      const mx = el.tagName === 'object' ? el.querySelector('mxCell') : el;
      if (!mx || mx.getAttribute('edge') !== '1') return;
      const id = el.getAttribute('id') || mx.getAttribute('id') || '';
      const source = mx.getAttribute('source') || '';
      const target = mx.getAttribute('target') || '';
      if (!source || !target || !idMap.has(source) || !idMap.has(target)) return;
      const style = mx.getAttribute('style') || '';
      let etype: EdgeType = 'dependency';
      const typeAttr = (el.getAttribute('type') || '').toLowerCase();
      const valAttr = el.getAttribute('value') || '';
      if (typeAttr === 'and-refinement' || typeAttr === 'or-refinement') {
        etype = typeAttr as EdgeType;
      } else if (typeAttr === 'refinement') {
        etype = (valAttr === 'or' || style.includes('block')) ? 'or-refinement' : 'and-refinement';
      } else if (style.includes('ERone') || style.includes('block')) {
        etype = (valAttr === 'or' || style.includes('block')) ? 'or-refinement' : 'and-refinement';
      } else if (style.includes('open') || valAttr) {
        etype = 'contribution';
      } else {
        etype = 'dependency';
      }
      model.edges.push({ id, source, target, type: etype, value: etype === 'contribution' ? (valAttr || undefined) : undefined });
    });
    model.nextId = Math.max(100, ...model.nodes.map(n => parseInt(n.id.replace(/\D/g,'')) || 100)) + 1;

    cells.forEach((el) => {
      const isObj = el.tagName === 'object';
      const mx = isObj ? el.querySelector('mxCell') : el;
      if (!mx) return;
      const bfor = el.getAttribute('boundaryFor') || mx.getAttribute('boundaryFor') || '';
      if (!bfor) return;
      const geo = mx.querySelector('mxGeometry');
      if (!geo) return;
      const x = parseFloat(geo.getAttribute('x') || '0');
      const y = parseFloat(geo.getAttribute('y') || '0');
      const w = parseFloat(geo.getAttribute('width') || '200');
      const h = parseFloat(geo.getAttribute('height') || '150');
      const actor = model.nodes.find(nn => nn.id === bfor);
      if (actor) {
        actor.boundaryX = x;
        actor.boundaryY = y;
        actor.boundaryW = w;
        actor.boundaryH = h;
      }
    });
  } catch {}
  if (model.nodes.length === 0) {
    model.nodes = [
      { id: 'a1', type: 'actor', label: 'System', x: 120, y: 80, w: 80, h: 80 },
      { id: 'g1', type: 'goal', label: 'Goal', x: 280, y: 100, w: 140, h: 40 },
    ];
    model.edges = [{ id: 'e1', source: 'a1', target: 'g1', type: 'and-refinement' }];
  }
  model.nodes.forEach(n => {
    if ((n.type === 'actor' || n.type === 'role') && n.boundaryW == null) {
      n.boundaryW = 220;
      n.boundaryH = 160;
      n.boundaryX = n.x + 45;
      n.boundaryY = n.y - 35;
    }
    const sz = getMinSizeForNode(n.type, n.label);
    n.w = Math.max(n.w, sz.w);
    n.h = Math.max(n.h, sz.h);
  });
  model.nodes.forEach(n => {
    if (n.type === 'actor' || n.type === 'role' || n.parentId != null) return;
    const cx = n.x + n.w / 2;
    const cy = n.y + n.h / 2;
    const cont = findContainingActor(cx, cy, model.nodes);
    if (cont) n.parentId = cont.id;
  });
  return model;
}

function modelToXml(model: DiagramModel, diagramName = 'Diagram'): string {
  let cells = '<mxCell id="0"/><mxCell id="1" parent="0"/>';
  model.nodes.forEach(n => {
    if ((n.type === 'actor' || n.type === 'role') && n.boundaryW != null) {
      const bstyle = 'ellipse;whiteSpace=wrap;html=1;dashed=1;dashPattern=3 2;strokeWidth=2;fillColor=none;strokeColor=#6c8ebf;';
      const bx = n.boundaryX ?? (n.x + 45);
      const by = n.boundaryY ?? (n.y - 35);
      const bw = n.boundaryW;
      const bh = n.boundaryH;
      cells += `<object label="" boundaryFor="${n.id}" id="bnd-${n.id}"><mxCell style="${bstyle}" vertex="1" parent="1"><mxGeometry x="${bx}" y="${by}" width="${bw}" height="${bh}" as="geometry"/></mxCell></object>`;
    }
  });
  model.nodes.forEach(n => {
    const style = getStyleForType(n.type);
    cells += `<object label="${escapeXml(n.label)}" type="${n.type}" id="${n.id}"><mxCell style="${style}" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry"/></mxCell></object>`;
  });
  model.edges.forEach(e => {
    const style = getStyleForEdge(e.type);
    const val = e.value ? ` value="${escapeXml(e.value)}"` : '';
    cells += `<object label="" type="${e.type}"${val} id="${e.id}"><mxCell style="${style}" edge="1" parent="1" source="${e.source}" target="${e.target}"><mxGeometry relative="1" as="geometry"/></mxCell></object>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net"><diagram name="${diagramName}" id="d1"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0"><root>${cells}</root></mxGraphModel></diagram></mxfile>`;
}

function getStyleForType(t: NodeType): string {
  if (t === 'actor' || t === 'role') return 'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#dae8fc;strokeColor=#6c8ebf;';
  if (t === 'goal') return 'rounded=1;whiteSpace=wrap;html=1;arcSize=50;fillColor=#dae8fc;strokeColor=#6c8ebf;';
  if (t === 'task') return 'shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;strokeWidth=1;fillColor=#dae8fc;strokeColor=#6c8ebf;size=10;';
  if (t === 'resource') return 'rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;';
  if (t === 'softgoal') return 'rounded=1;whiteSpace=wrap;html=1;arcSize=80;fillColor=#dae8fc;strokeColor=#6c8ebf;';
  return 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;';
}

function getStyleForEdge(t: EdgeType): string {
  if (t === 'and-refinement') return 'endArrow=ERone;html=1;rounded=0;endFill=0;endSize=10;';
  if (t === 'or-refinement') return 'endArrow=block;html=1;rounded=0;endFill=1;endSize=10;';
  if (t === 'contribution') return 'endArrow=open;html=1;rounded=0;endFill=0;endSize=10;';
  return 'endArrow=classic;html=1;rounded=0;endFill=0;endSize=10;';
}

function escapeXml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function cloneModel(m: DiagramModel): DiagramModel {
  return { nodes: m.nodes.map(n => ({...n})), edges: m.edges.map(e => ({...e})), nextId: m.nextId };
}

function measureTextWidth(text: string): number {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (!ctx) return (text || '').length * 7;
  ctx.font = '11px sans-serif';
  return ctx.measureText(text || '').width;
}

function getMinSizeForNode(type: NodeType, label: string): {w: number, h: number} {
  const tw = measureTextWidth(label || ' ');
  const pad = 20;
  const reqW = Math.ceil(tw + pad);
  const p = PALETTE.find(pp => pp.type === type)!;
  if (type === 'actor' || type === 'role') {
    const d = Math.max(p.w, reqW, 60);
    return {w: d, h: d};
  }
  const aspect = p.h / p.w;
  let w = Math.max(p.w, reqW);
  let h = Math.ceil(w * aspect);
  if (h < 32) h = 32;
  if (type === 'task') {
    w = Math.max(w, reqW + 10);
  }
  if (type === 'softgoal') {
    w = Math.max(w, reqW + 4);
  }
  return {w, h};
}

function isInsideEllipse(px: number, py: number, ex: number, ey: number, ew: number, eh: number): boolean {
  const cx = ex + ew / 2;
  const cy = ey + eh / 2;
  const rx = ew / 2;
  const ry = eh / 2;
  if (rx <= 0 || ry <= 0) return false;
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return (dx * dx + dy * dy) <= 1;
}

function findContainingActor(px: number, py: number, nodes: DiagNode[]): DiagNode | undefined {
  const cands = nodes.filter(n => (n.type === 'actor' || n.type === 'role') && n.boundaryW != null && isInsideEllipse(px, py, n.boundaryX ?? 0, n.boundaryY ?? 0, n.boundaryW, n.boundaryH!));
  if (cands.length === 0) return undefined;
  return cands.reduce((best, cur) => {
    const ba = best.boundaryW! * best.boundaryH!;
    const ca = cur.boundaryW! * cur.boundaryH!;
    return ca < ba ? cur : best;
  });
}

function getRectBoundaryIntersection(cx: number, cy: number, tx: number, ty: number, rect: {x: number, y: number, w: number, h: number}): {x: number, y: number} {
  const dx = tx - cx;
  const dy = ty - cy;
  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
    return { x: cx, y: cy };
  }
  const left = rect.x;
  const right = rect.x + rect.w;
  const top = rect.y;
  const bottom = rect.y + rect.h;
  let minT = Infinity;
  let ix = cx, iy = cy;
  const check = (t: number, ixCalc: number, iyCalc: number) => {
    if (t > 0 && t < minT) {
      minT = t;
      ix = ixCalc;
      iy = iyCalc;
    }
  };
  if (Math.abs(dx) > 0.0001) {
    let t = (left - cx) / dx;
    let y = cy + t * dy;
    if (y >= top && y <= bottom) check(t, left, y);
    t = (right - cx) / dx;
    y = cy + t * dy;
    if (y >= top && y <= bottom) check(t, right, y);
  }
  if (Math.abs(dy) > 0.0001) {
    let t = (top - cy) / dy;
    let x = cx + t * dx;
    if (x >= left && x <= right) check(t, x, top);
    t = (bottom - cy) / dy;
    x = cx + t * dx;
    if (x >= left && x <= right) check(t, x, bottom);
  }
  if (minT === Infinity) {
    return { x: cx, y: cy };
  }
  return { x: ix, y: iy };
}

export default function DiagramEditor({ initialXML = '', onApply, onBack }: DiagramEditorProps) {
  const [model, setModel] = useState<DiagramModel>(() => parseXmlToModel(initialXML));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [connectMode, setConnectMode] = useState<EdgeType | null>(null);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [dragOverActor, setDragOverActor] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const liveDragPosRef = useRef<{ id: string; x: number; y: number; w: number; h: number } | null>(null);
  const boundaryDragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const boundaryResizeRef = useRef<{ id: string; corner: 'nw'|'ne'|'sw'|'se'; startMX: number; startMY: number; orig: {bx:number;by:number;bw:number;bh:number} } | null>(null);
  const undoStackRef = useRef<DiagramModel[]>([]);
  const redoStackRef = useRef<DiagramModel[]>([]);
  const modelRef = useRef<DiagramModel>(model);

  const currentXml = useMemo(() => modelToXml(model), [model]);
  const didInitRef = useRef(false);
  const bounds = useMemo(() => {
    let maxX = 400, maxY = 300;
    model.nodes.forEach(n => {
      maxX = Math.max(maxX, n.x + n.w + 100);
      maxY = Math.max(maxY, n.y + n.h + 100);
      if ((n.type === 'actor' || n.type === 'role') && n.boundaryW != null) {
        maxX = Math.max(maxX, (n.boundaryX || 0) + n.boundaryW + 60);
        maxY = Math.max(maxY, (n.boundaryY || 0) + (n.boundaryH || 0) + 60);
      }
    });
    return { w: Math.max(800, Math.ceil(maxX)), h: Math.max(600, Math.ceil(maxY)) };
  }, [model.nodes]);

  useEffect(() => {
    if (initialXML && !didInitRef.current) {
      didInitRef.current = true;
      undoStackRef.current = [];
      redoStackRef.current = [];
      const m = parseXmlToModel(initialXML);
      setModel(m);
    }
  }, [initialXML]);

  useEffect(() => { modelRef.current = model; }, [model]);

  const updateModel = (updater: (m: DiagramModel) => DiagramModel) => {
    setModel(prev => updater({ ...prev, nodes: [...prev.nodes], edges: [...prev.edges] }));
  };

  const undo = useCallback(() => {
    const us = undoStackRef.current;
    if (us.length === 0) return;
    setModel(curr => {
      redoStackRef.current = [...redoStackRef.current, cloneModel(curr)];
      const lastIdx = us.length - 1;
      const prev = us[lastIdx];
      undoStackRef.current = us.slice(0, lastIdx);
      return cloneModel(prev);
    });
  }, []);

  const redo = useCallback(() => {
    const rs = redoStackRef.current;
    if (rs.length === 0) return;
    setModel(curr => {
      undoStackRef.current = [...undoStackRef.current, cloneModel(curr)];
      const lastIdx = rs.length - 1;
      const next = rs[lastIdx];
      redoStackRef.current = rs.slice(0, lastIdx);
      return cloneModel(next);
    });
  }, []);

  const addNode = (type: NodeType) => {
    undoStackRef.current = [...undoStackRef.current.slice(-49), cloneModel(modelRef.current)];
    redoStackRef.current = [];
    const p = PALETTE.find(p => p.type === type)!;
    const x = 80 + (model.nodes.length % 4) * 60;
    const y = 60 + Math.floor(model.nodes.length / 4) * 50;
    let newId = '';
    updateModel(m => {
      newId = 'n' + m.nextId;
      const node: DiagNode = { id: newId, type, label: p.label, x, y, w: p.w, h: p.h };
      if (type === 'actor' || type === 'role') {
        node.boundaryW = 240;
        node.boundaryH = 180;
        node.boundaryX = x + 55;
        node.boundaryY = y - 50;
      } else {
        const cx = x + p.w / 2;
        const cy = y + p.h / 2;
        const cont = findContainingActor(cx, cy, m.nodes);
        if (cont) node.parentId = cont.id;
      }
      m.nodes.push(node);
      m.nextId++;
      return m;
    });
    setSelectedId(newId);
  };

  const startConnect = (etype: EdgeType) => {
    setConnectMode(etype);
    setConnectSource(null);
    setSelectedId(null);
    setSelectedEdgeId(null);
  };

  const startBoundaryResize = (e: React.PointerEvent, id: string, corner: 'nw'|'ne'|'sw'|'se') => {
    e.stopPropagation();
    const node = modelRef.current.nodes.find(nn => nn.id === id);
    if (!node || node.boundaryW == null) return;
    undoStackRef.current = [...undoStackRef.current.slice(-49), cloneModel(modelRef.current)];
    redoStackRef.current = [];
    const rect = canvasRef.current!.getBoundingClientRect();
    const sl = canvasRef.current!.scrollLeft;
    const st = canvasRef.current!.scrollTop;
    const mx = e.clientX - rect.left + sl;
    const my = e.clientY - rect.top + st;
    boundaryResizeRef.current = {
      id,
      corner,
      startMX: mx,
      startMY: my,
      orig: { bx: node.boundaryX!, by: node.boundaryY!, bw: node.boundaryW!, bh: node.boundaryH! }
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onNodePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (connectMode) {
      if (!connectSource) {
        setConnectSource(id);
        setSelectedId(id);
      } else if (connectSource !== id) {
        undoStackRef.current = [...undoStackRef.current.slice(-49), cloneModel(modelRef.current)];
        redoStackRef.current = [];
        let eid = '';
        updateModel(m => {
          eid = 'e' + m.nextId;
          m.edges.push({ id: eid, source: connectSource, target: id, type: connectMode });
          m.nextId++;
          return m;
        });
        setConnectMode(null);
        setConnectSource(null);
        setSelectedId(id);
      }
      return;
    }
    undoStackRef.current = [...undoStackRef.current.slice(-49), cloneModel(modelRef.current)];
    redoStackRef.current = [];
    setSelectedId(id);
    setSelectedEdgeId(null);
    const node = modelRef.current.nodes.find(n => n.id === id)!;
    const rect = canvasRef.current!.getBoundingClientRect();
    const sl = canvasRef.current!.scrollLeft;
    const st = canvasRef.current!.scrollTop;
    dragRef.current = { id, offsetX: e.clientX - rect.left + sl - node.x, offsetY: e.clientY - rect.top + st - node.y };
    liveDragPosRef.current = { id, x: node.x, y: node.y, w: node.w, h: node.h };
    if (node.type !== 'actor' && node.type !== 'role') {
      const cx = node.x + node.w / 2;
      const cy = node.y + node.h / 2;
      const over = findContainingActor(cx, cy, modelRef.current.nodes);
      setDragOverActor(over ? over.id : null);
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!connectMode) {
      setSelectedId(id);
      setSelectedEdgeId(null);
    }
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (boundaryResizeRef.current) {
      const r = boundaryResizeRef.current;
      const rect = canvasRef.current!.getBoundingClientRect();
      const sl = canvasRef.current!.scrollLeft;
      const st = canvasRef.current!.scrollTop;
      const mx = e.clientX - rect.left + sl;
      const my = e.clientY - rect.top + st;
      const dx = mx - r.startMX;
      const dy = my - r.startMY;
      updateModel(m => {
        const n = m.nodes.find(nn => nn.id === r.id);
        if (!n || n.boundaryW == null) return m;
        let newBx = r.orig.bx;
        let newBy = r.orig.by;
        let newBw = r.orig.bw;
        let newBh = r.orig.bh;
        if (r.corner.includes('e')) newBw = Math.max(50, newBw + dx);
        if (r.corner.includes('w')) {
          newBx = r.orig.bx + dx;
          newBw = Math.max(50, r.orig.bw - dx);
        }
        if (r.corner.includes('s')) newBh = Math.max(50, newBh + dy);
        if (r.corner.includes('n')) {
          newBy = r.orig.by + dy;
          newBh = Math.max(50, r.orig.bh - dy);
        }
        if (newBw < 50) {
          if (r.corner.includes('w')) newBx = r.orig.bx + r.orig.bw - 50;
          newBw = 50;
        }
        if (newBh < 50) {
          if (r.corner.includes('n')) newBy = r.orig.by + r.orig.bh - 50;
          newBh = 50;
        }
        n.boundaryX = Math.max(0, Math.round(newBx));
        n.boundaryY = Math.max(0, Math.round(newBy));
        n.boundaryW = Math.round(newBw);
        n.boundaryH = Math.round(newBh);
        return m;
      });
      return;
    }
    if (boundaryDragRef.current) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const sl = canvasRef.current!.scrollLeft;
      const st = canvasRef.current!.scrollTop;
      const targetBX = Math.max(0, e.clientX - rect.left + sl - boundaryDragRef.current.offsetX);
      const targetBY = Math.max(0, e.clientY - rect.top + st - boundaryDragRef.current.offsetY);
      updateModel(m => {
        const n = m.nodes.find(nn => nn.id === boundaryDragRef.current!.id);
        if (n && n.boundaryX !== undefined && n.boundaryY !== undefined) {
          const dx = Math.round(targetBX) - n.boundaryX;
          const dy = Math.round(targetBY) - n.boundaryY;
          n.boundaryX = Math.round(targetBX);
          n.boundaryY = Math.round(targetBY);
          n.x += dx;
          n.y += dy;
          m.nodes.forEach(ch => {
            if (ch.parentId === n.id) {
              ch.x += dx;
              ch.y += dy;
            }
          });
        }
        return m;
      });
      return;
    }
    if (!dragRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const sl = canvasRef.current!.scrollLeft;
    const st = canvasRef.current!.scrollTop;
    const nx = Math.max(0, e.clientX - rect.left + sl - dragRef.current.offsetX);
    const ny = Math.max(0, e.clientY - rect.top + st - dragRef.current.offsetY);
    updateModel(m => {
      const n = m.nodes.find(nn => nn.id === dragRef.current!.id);
      if (n) {
        const dx = Math.round(nx) - n.x;
        const dy = Math.round(ny) - n.y;
        n.x = Math.round(nx);
        n.y = Math.round(ny);
        if ((n.type === 'actor' || n.type === 'role') && n.boundaryX !== undefined && n.boundaryY !== undefined) {
          n.boundaryX += dx;
          n.boundaryY += dy;
          m.nodes.forEach(ch => {
            if (ch.parentId === n.id) {
              ch.x += dx;
              ch.y += dy;
            }
          });
        }
        liveDragPosRef.current = { id: n.id, x: n.x, y: n.y, w: n.w, h: n.h };
        return m;
      }
      return m;
    });
    const lp = liveDragPosRef.current;
    if (lp && lp.id === dragRef.current.id) {
      const dnode = modelRef.current.nodes.find(nn => nn.id === lp.id);
      if (dnode && dnode.type !== 'actor' && dnode.type !== 'role') {
        const pcx = lp.x + lp.w / 2;
        const pcy = lp.y + lp.h / 2;
        const over = findContainingActor(pcx, pcy, modelRef.current.nodes);
        const overId = over ? over.id : null;
        if (overId !== dragOverActor) setDragOverActor(overId);
      }
    }
  };

  const onCanvasPointerUp = () => {
    const draggedId = dragRef.current?.id;
    const finalPos = liveDragPosRef.current;
    dragRef.current = null;
    liveDragPosRef.current = null;
    boundaryDragRef.current = null;
    boundaryResizeRef.current = null;
    setDragOverActor(null);
    if (draggedId && finalPos && finalPos.id === draggedId) {
      const node = modelRef.current.nodes.find(nn => nn.id === draggedId);
      if (node && node.type !== 'actor' && node.type !== 'role') {
        const cx = finalPos.x + finalPos.w / 2;
        const cy = finalPos.y + finalPos.h / 2;
        const cont = findContainingActor(cx, cy, modelRef.current.nodes);
        const newPid = cont ? cont.id : undefined;
        if (node.parentId !== newPid) {
          updateModel(m => {
            const nn = m.nodes.find(k => k.id === draggedId);
            if (nn) nn.parentId = newPid;
            return m;
          });
        }
      }
    }
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const tgt = e.target as Element;
    if (e.target === e.currentTarget || tgt.tagName === 'svg') {
      if (connectMode) {
        setConnectMode(null);
        setConnectSource(null);
      } else {
        setSelectedId(null);
        setSelectedEdgeId(null);
        setDragOverActor(null);
      }
    }
  };

  const deleteSelected = useCallback(() => {
    if (selectedId || selectedEdgeId) {
      undoStackRef.current = [...undoStackRef.current.slice(-49), cloneModel(modelRef.current)];
      redoStackRef.current = [];
      updateModel(m => {
        if (selectedId) {
          m.nodes.forEach(ch => { if (ch.parentId === selectedId) ch.parentId = undefined; });
          m.nodes = m.nodes.filter(n => n.id !== selectedId);
          m.edges = m.edges.filter(e => e.source !== selectedId && e.target !== selectedId);
        } else if (selectedEdgeId) {
          m.edges = m.edges.filter(e => e.id !== selectedEdgeId);
        }
        return m;
      });
      setSelectedId(null);
      setSelectedEdgeId(null);
      dragRef.current = null;
      liveDragPosRef.current = null;
      boundaryDragRef.current = null;
      boundaryResizeRef.current = null;
      setDragOverActor(null);
    }
  }, [selectedId, selectedEdgeId]);

  const startEdit = (id: string, label: string) => {
    setEditingId(id);
    setEditValue(label);
  };

  const commitEdit = () => {
    if (!editingId) return;
    undoStackRef.current = [...undoStackRef.current.slice(-49), cloneModel(modelRef.current)];
    redoStackRef.current = [];
    updateModel(m => {
      const n = m.nodes.find(nn => nn.id === editingId);
      if (n) {
        const newLabel = editValue.trim() || n.label;
        n.label = newLabel;
        const sz = getMinSizeForNode(n.type, n.label);
        n.w = Math.max(n.w, sz.w);
        n.h = Math.max(n.h, sz.h);
      }
      return m;
    });
    setEditingId(null);
  };

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active.tagName === 'INPUT') {
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelected();
    } else if (e.key === 'Escape') {
      setConnectMode(null);
      setConnectSource(null);
      setEditingId(null);
      setDragOverActor(null);
      liveDragPosRef.current = null;
    }
  }, [deleteSelected, undo, redo]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const apply = () => {
    onApply(currentXml);
  };

  const newIStar = () => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setModel(parseXmlToModel(''));
    setSelectedId(null);
    setSelectedEdgeId(null);
    setDragOverActor(null);
    liveDragPosRef.current = null;
  };

  const newBlank = () => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setModel({ nodes: [], edges: [], nextId: 100 });
    setSelectedId(null);
    setSelectedEdgeId(null);
    setDragOverActor(null);
    liveDragPosRef.current = null;
  };

  const loadProcess = () => {
    if (initialXML) {
      undoStackRef.current = [];
      redoStackRef.current = [];
      setModel(parseXmlToModel(initialXML));
      setSelectedId(null);
      setSelectedEdgeId(null);
      setDragOverActor(null);
      liveDragPosRef.current = null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 editor-area">
      <div className="px-4 py-2 border-b border-[#33334d] flex items-center justify-between text-sm flex-shrink-0">
        <div>
          <span className="font-medium">Diagram Editor</span>
          <span className="ml-2 text-[#9ca3af] text-xs">in-app visual • i* only • offline</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={newIStar} className="btn btn-secondary text-xs py-1 px-2">New i* Starter</button>
          <button onClick={newBlank} className="btn btn-secondary text-xs py-1 px-2">Blank</button>
          <button onClick={loadProcess} className="btn btn-secondary text-xs py-1 px-2" disabled={!initialXML}>Load from Process</button>
          {PALETTE.map(p => (
            <button key={p.type} onClick={() => addNode(p.type)} className="btn btn-secondary text-xs py-1 px-2">{p.label}</button>
          ))}
           <button onClick={() => startConnect('and-refinement')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>AND Refine</button>
           <button onClick={() => startConnect('or-refinement')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>OR Refine</button>
           <button onClick={() => startConnect('dependency')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>Depends</button>
           <button onClick={() => startConnect('contribution')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>Contrib</button>
          <button onClick={deleteSelected} className="btn btn-secondary text-xs py-1 px-2" disabled={!selectedId}>Delete</button>
          <button onClick={apply} className="btn btn-primary text-xs py-1 px-2">Use in MDD Process</button>
          <button onClick={onBack} className="btn btn-secondary text-xs py-1 px-2">Back to Process</button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-48 border-r border-[#33334d] p-2 text-xs overflow-auto bg-[#0a0a12]">
          <div className="mb-2 font-medium text-[#9ca3af]">Palette (click to add)</div>
          {PALETTE.map(p => (
            <div key={p.type} onClick={() => addNode(p.type)} className="cursor-pointer mb-1 px-2 py-1 rounded hover:bg-[#23233a] border border-[#33334d] flex items-center gap-2 text-[11px]">
              <span className="inline-block w-4 h-3" style={getNodeStyle(p.type)} /> {p.label}
            </div>
          ))}
            <div className="mt-3 text-[10px] text-[#9ca3af]">
              Click node/edge to select • Drag nodes • Double-click label • Tap link button then source then target • Grid click deselects • Del removes selected
            </div>
          {connectMode && <div className="mt-2 text-amber-400 text-xs">Link mode ({connectMode === 'and-refinement' ? 'AND Refine' : connectMode === 'or-refinement' ? 'OR Refine' : connectMode}): click SOURCE then TARGET node</div>}
        </div>

        <div
          ref={canvasRef}
          className="flex-1 relative overflow-auto bg-[#111] select-none"
          style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 0)', backgroundSize: '20px 20px' }}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onPointerLeave={onCanvasPointerUp}
          onClick={onCanvasClick}
        >
          <div style={{ position: 'relative', width: bounds.w, height: bounds.h }}>
            <svg width={bounds.w} height={bounds.h} style={{ position: 'absolute', left: 0, top: 0, zIndex: 0 }}>
              <defs>
                <marker id="arrow-dep" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#6c8ebf" />
                </marker>
                <marker id="arrow-and" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#6c8ebf" />
                </marker>
                <marker id="arrow-or" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
                  <g stroke="#6c8ebf" strokeWidth="1.5" fill="none">
                    <line x1="1" y1="4" x2="5" y2="4" />
                    <line x1="3" y1="1" x2="3" y2="7" />
                  </g>
                </marker>
                <marker id="arrow-contrib" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3" fill="none" stroke="#6c8ebf" strokeWidth="1" />
                </marker>
              </defs>
              {model.nodes.filter(n => (n.type === 'actor' || n.type === 'role') && n.boundaryW != null).map(n => {
                const bx = n.boundaryX ?? n.x + 45;
                const by = n.boundaryY ?? n.y - 35;
                const bw = n.boundaryW!;
                const bh = n.boundaryH!;
                const isSel = selectedId === n.id;
                const isOver = dragOverActor === n.id;
                const onBClick = (ev: React.MouseEvent) => { ev.stopPropagation(); setSelectedId(n.id); setSelectedEdgeId(null); };
                return (
                  <ellipse
                    key={`bound-${n.id}`}
                    cx={bx + bw / 2}
                    cy={by + bh / 2}
                    rx={bw / 2}
                    ry={bh / 2}
                    fill={isOver ? '#166534' : 'none'}
                    fillOpacity={isOver ? 0.12 : undefined}
                    stroke={isSel ? '#6366f1' : isOver ? '#22c55e' : '#6c8ebf'}
                    strokeWidth={isSel || isOver ? 3 : 2}
                    strokeDasharray={isOver ? '3 2' : '5 3'}
                    onClick={onBClick}
                    onPointerDown={(e) => {
                      if (connectMode) return;
                      undoStackRef.current = [...undoStackRef.current.slice(-49), cloneModel(modelRef.current)];
                      redoStackRef.current = [];
                      setSelectedId(n.id);
                      setSelectedEdgeId(null);
                      const rect = canvasRef.current!.getBoundingClientRect();
                      const sl = canvasRef.current!.scrollLeft;
                      const st = canvasRef.current!.scrollTop;
                      boundaryDragRef.current = { id: n.id, offsetX: e.clientX - rect.left + sl - bx, offsetY: e.clientY - rect.top + st - by };
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    style={{ pointerEvents: 'all', cursor: connectMode ? 'crosshair' : 'move' }}
                  />
                );
              })}
              {model.edges.map(e => {
                const s = model.nodes.find(n => n.id === e.source);
                const t = model.nodes.find(n => n.id === e.target);
                if (!s || !t) return null;
                const cx1 = s.x + s.w / 2, cy1 = s.y + s.h / 2;
                const cx2 = t.x + t.w / 2, cy2 = t.y + t.h / 2;
                const p1 = getRectBoundaryIntersection(cx1, cy1, cx2, cy2, s);
                const p2 = getRectBoundaryIntersection(cx1, cy1, cx2, cy2, t);
                const x1 = p1.x, y1 = p1.y;
                const x2 = p2.x, y2 = p2.y;
                const isSel = selectedEdgeId === e.id;
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                let label = '';
                if (e.type === 'and-refinement') label = 'AND';
                else if (e.type === 'or-refinement') label = 'OR';
                else if (e.type === 'dependency') label = 'D';
                else if (e.value) label = e.value;
                const marker = e.type === 'and-refinement' ? 'arrow-and' : e.type === 'or-refinement' ? 'arrow-or' : e.type === 'dependency' ? 'arrow-dep' : 'arrow-contrib';
                const selectEdge = (ev: React.MouseEvent) => { ev.stopPropagation(); setSelectedEdgeId(e.id); setSelectedId(null); };
                return (
                  <g key={e.id}>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="transparent"
                      strokeWidth="14"
                      onClick={selectEdge}
                      style={{ cursor: 'pointer' }}
                    />
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={isSel ? '#6366f1' : '#6c8ebf'}
                      strokeWidth={isSel ? '3' : '2'}
                      markerEnd={`url(#${marker})`}
                      pointerEvents="none"
                    />
                    {label && (
                      <text
                        x={midX} y={midY - 4}
                        fill={isSel ? '#6366f1' : '#aaa'}
                        fontSize="10"
                        textAnchor="middle"
                        onClick={selectEdge}
                        style={{ cursor: 'pointer', pointerEvents: 'all' }}
                      >{label}</text>
                    )}
                  </g>
                );
              })}
            </svg>

            {model.nodes.map(node => {
              const isSel = selectedId === node.id;
              const style = getNodeStyle(node.type);
              const nodeStyle: React.CSSProperties = {
                left: node.x, top: node.y, width: node.w, height: node.h,
                ...style,
                outline: isSel ? '2px solid #6366f1' : 'none',
                zIndex: 1,
                fontSize: 11,
                color: '#1f2937',
                overflow: 'hidden',
                padding: 4,
                cursor: connectMode ? 'crosshair' : 'move',
              };
              if (node.parentId && !isSel) {
                nodeStyle.boxShadow = 'inset 0 0 0 1.5px #6c8ebf';
              }
              return (
                <div
                  key={node.id}
                  className="absolute flex items-center justify-center text-[11px] text-center border box-border shadow-sm"
                  style={nodeStyle}
                  onPointerDown={(e) => onNodePointerDown(e, node.id)}
                  onClick={(e) => onNodeClick(e, node.id)}
                  onDoubleClick={() => startEdit(node.id, node.label)}
                >
                  {editingId === node.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                      className="bg-white text-black text-xs w-full text-center outline-none"
                    />
                  ) : node.label}
                </div>
              );
            })}
            {(() => {
              const sel = model.nodes.find(n => n.id === selectedId);
              if (!sel || (sel.type !== 'actor' && sel.type !== 'role') || sel.boundaryW == null || sel.boundaryH == null) return null;
              const bx = sel.boundaryX ?? 0;
              const by = sel.boundaryY ?? 0;
              const bw = sel.boundaryW;
              const bh = sel.boundaryH;
              const hs = 9;
              const mk = (cx: number, cy: number, c: 'nw'|'ne'|'sw'|'se') => (
                <div
                  key={c}
                  onPointerDown={(e) => startBoundaryResize(e, sel.id, c)}
                  style={{
                    position: 'absolute',
                    left: cx,
                    top: cy,
                    width: hs,
                    height: hs,
                    backgroundColor: '#6366f1',
                    border: '1px solid #fff',
                    boxSizing: 'border-box',
                    zIndex: 20,
                    cursor: (c === 'nw' || c === 'se') ? 'nwse-resize' : 'nesw-resize',
                  }}
                />
              );
              return (
                <>
                  {mk(bx - hs/2 + 1, by - hs/2 + 1, 'nw')}
                  {mk(bx + bw - hs/2 - 1, by - hs/2 + 1, 'ne')}
                  {mk(bx - hs/2 + 1, by + bh - hs/2 - 1, 'sw')}
                  {mk(bx + bw - hs/2 - 1, by + bh - hs/2 - 1, 'se')}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="px-4 py-1 text-[10px] border-t border-[#33334d] text-[#9ca3af] flex justify-between flex-shrink-0">
        <span>{model.nodes.length} elements • {model.edges.length} links • {connectMode ? `link mode: ${connectMode}` : selectedEdgeId ? 'edge selected' : selectedId ? 'selected' : 'ready'}</span>
        <span>Visual i* editor (reduced draw.io style) • fully in-app &amp; offline • Apply to feed MDD process</span>
      </div>
    </div>
  );
}
