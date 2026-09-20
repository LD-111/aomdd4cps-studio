"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

interface DiagramEditorProps {
  initialXML?: string;
  onApply: (xml: string) => void;
  onBack: () => void;
}

type NodeType = 'actor' | 'goal' | 'task' | 'resource' | 'softgoal' | 'role';
type EdgeType = 'refinement' | 'dependency' | 'contribution';

interface DiagNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
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
      return { borderRadius: '30% 30% 30% 30% / 50% 50% 50% 50%', background: '#dae8fc', border: '1px solid #6c8ebf' };
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
      const valAttr = el.getAttribute('value') || '';
      if (style.includes('ERone') || style.includes('block')) etype = 'refinement';
      else if (style.includes('open') || valAttr) etype = 'contribution';
      else etype = 'dependency';
      if (el.getAttribute('type') === 'refinement') etype = 'refinement';
      model.edges.push({ id, source, target, type: etype, value: valAttr || undefined });
    });
    model.nextId = Math.max(100, ...model.nodes.map(n => parseInt(n.id.replace(/\D/g,'')) || 100)) + 1;
  } catch {}
  if (model.nodes.length === 0) {
    model.nodes = [
      { id: 'a1', type: 'actor', label: 'System', x: 120, y: 80, w: 80, h: 80 },
      { id: 'g1', type: 'goal', label: 'Goal', x: 280, y: 100, w: 140, h: 40 },
    ];
    model.edges = [{ id: 'e1', source: 'a1', target: 'g1', type: 'refinement' }];
  }
  return model;
}

function modelToXml(model: DiagramModel, diagramName = 'Diagram'): string {
  let cells = '<mxCell id="0"/><mxCell id="1" parent="0"/>';
  model.nodes.forEach(n => {
    const style = getStyleForType(n.type);
    cells += `<object label="${escapeXml(n.label)}" type="${n.type}" id="${n.id}"><mxCell style="${style}" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry"/></mxCell></object>`;
  });
  model.edges.forEach(e => {
    const style = getStyleForEdge(e.type, e.value);
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
  return 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;';
}

function getStyleForEdge(t: EdgeType, v?: string): string {
  if (t === 'refinement') return v === 'or' ? 'endArrow=block;html=1;rounded=0;endFill=1;endSize=10;' : 'endArrow=ERone;html=1;rounded=0;endFill=0;endSize=10;';
  if (t === 'contribution') return 'endArrow=open;html=1;rounded=0;endFill=0;endSize=10;';
  return 'endArrow=classic;html=1;rounded=0;endFill=0;endSize=10;';
}

function escapeXml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export default function DiagramEditor({ initialXML = '', onApply, onBack }: DiagramEditorProps) {
  const [model, setModel] = useState<DiagramModel>(() => parseXmlToModel(initialXML));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [connectMode, setConnectMode] = useState<EdgeType | null>(null);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const currentXml = useMemo(() => modelToXml(model), [model]);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (initialXML && !didInitRef.current) {
      didInitRef.current = true;
      const m = parseXmlToModel(initialXML);
      setModel(m);
    }
  }, [initialXML]);

  const updateModel = (updater: (m: DiagramModel) => DiagramModel) => {
    setModel(prev => updater({ ...prev, nodes: [...prev.nodes], edges: [...prev.edges] }));
  };

  const addNode = (type: NodeType) => {
    const p = PALETTE.find(p => p.type === type)!;
    const x = 80 + (model.nodes.length % 4) * 60;
    const y = 60 + Math.floor(model.nodes.length / 4) * 50;
    let newId = '';
    updateModel(m => {
      newId = 'n' + m.nextId;
      m.nodes.push({ id: newId, type, label: p.label, x, y, w: p.w, h: p.h });
      m.nextId++;
      return m;
    });
    setSelectedId(newId);
  };

  const startConnect = (etype: EdgeType) => {
    setConnectMode(etype);
    setConnectSource(null);
  };

  const onNodePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (connectMode) {
      if (!connectSource) {
        setConnectSource(id);
        setSelectedId(id);
      } else if (connectSource !== id) {
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
    setSelectedId(id);
    const node = model.nodes.find(n => n.id === id)!;
    const rect = canvasRef.current!.getBoundingClientRect();
    dragRef.current = { id, offsetX: e.clientX - rect.left - node.x, offsetY: e.clientY - rect.top - node.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!connectMode) {
      setSelectedId(id);
    }
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const nx = Math.max(0, e.clientX - rect.left - dragRef.current.offsetX);
    const ny = Math.max(0, e.clientY - rect.top - dragRef.current.offsetY);
    updateModel(m => {
      const n = m.nodes.find(nn => nn.id === dragRef.current!.id);
      if (n) { n.x = Math.round(nx); n.y = Math.round(ny); }
      return m;
    });
  };

  const onCanvasPointerUp = () => {
    dragRef.current = null;
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (connectMode) {
        setConnectMode(null);
        setConnectSource(null);
      } else {
        setSelectedId(null);
      }
    }
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    updateModel(m => {
      m.nodes = m.nodes.filter(n => n.id !== selectedId);
      m.edges = m.edges.filter(e => e.source !== selectedId && e.target !== selectedId);
      return m;
    });
    setSelectedId(null);
  }, [selectedId]);

  const startEdit = (id: string, label: string) => {
    setEditingId(id);
    setEditValue(label);
  };

  const commitEdit = () => {
    if (!editingId) return;
    updateModel(m => {
      const n = m.nodes.find(nn => nn.id === editingId);
      if (n) n.label = editValue.trim() || n.label;
      return m;
    });
    setEditingId(null);
  };

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    if (e.key === 'Escape') {
      setConnectMode(null);
      setConnectSource(null);
      setEditingId(null);
    }
  }, [deleteSelected]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const apply = () => {
    onApply(currentXml);
  };

  const newIStar = () => {
    setModel(parseXmlToModel(''));
    setSelectedId(null);
  };

  const newBlank = () => {
    setModel({ nodes: [], edges: [], nextId: 100 });
    setSelectedId(null);
  };

  const loadProcess = () => {
    if (initialXML) setModel(parseXmlToModel(initialXML));
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
          <button onClick={() => startConnect('refinement')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>Refine</button>
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
            Click node to select (sticky) • Drag to move • Double-click label • Tap link button then click source then target • Click grid to deselect • Del to remove
          </div>
          {connectMode && <div className="mt-2 text-amber-400 text-xs">Link mode ({connectMode}): click SOURCE then TARGET node</div>}
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
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#6c8ebf" />
              </marker>
            </defs>
            {model.edges.map(e => {
              const s = model.nodes.find(n => n.id === e.source);
              const t = model.nodes.find(n => n.id === e.target);
              if (!s || !t) return null;
              const x1 = s.x + s.w / 2, y1 = s.y + s.h / 2;
              const x2 = t.x + t.w / 2, y2 = t.y + t.h / 2;
              return (
                <g key={e.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6c8ebf" strokeWidth="2" markerEnd="url(#arrow)" />
                  {e.value && <text x={(x1+x2)/2} y={(y1+y2)/2 - 4} fill="#aaa" fontSize="10">{e.value}</text>}
                </g>
              );
            })}
          </svg>

          {model.nodes.map(node => {
            const isSel = selectedId === node.id;
            const style = getNodeStyle(node.type);
            return (
              <div
                key={node.id}
                className="absolute flex items-center justify-center text-[11px] text-center border box-border shadow-sm"
                style={{
                  left: node.x, top: node.y, width: node.w, height: node.h,
                  ...style,
                  outline: isSel ? '2px solid #6366f1' : 'none',
                  zIndex: 1,
                  fontSize: 11,
                  color: '#1f2937',
                  overflow: 'hidden',
                  padding: 4,
                  cursor: connectMode ? 'crosshair' : 'move',
                }}
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
        </div>
      </div>

      <div className="px-4 py-1 text-[10px] border-t border-[#33334d] text-[#9ca3af] flex justify-between flex-shrink-0">
        <span>{model.nodes.length} elements • {model.edges.length} links • {connectMode ? `link mode: ${connectMode}` : selectedId ? 'selected' : 'ready'}</span>
        <span>Visual i* editor (reduced draw.io style) • fully in-app &amp; offline • Apply to feed MDD process</span>
      </div>
    </div>
  );
}
