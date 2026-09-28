"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { DiagramEditorProps, DiagramModel, DiagNode, EdgeType, NodeType } from '../../lib/diagram/types';
import { parseXmlToModel, modelToXml, CIM_PALETTE, PIM_PALETTE } from '../../lib/diagram/model';
import { isContainerType, cloneModel, getMinSizeForNode, findContainingContainer } from '../../lib/diagram/utils';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import Node from './Node';
import Handles from './Handles';

function getBounds(model: DiagramModel) {
  let maxX = 400, maxY = 300;
  model.nodes.forEach(n => {
    maxX = Math.max(maxX, n.x + n.w + 100);
    maxY = Math.max(maxY, n.y + n.h + 100);
    if (isContainerType(n.type) && n.boundaryW != null) {
      maxX = Math.max(maxX, (n.boundaryX || 0) + n.boundaryW + 60);
      maxY = Math.max(maxY, (n.boundaryY || 0) + (n.boundaryH || 0) + 60);
    }
  });
  return { w: Math.max(800, Math.ceil(maxX)), h: Math.max(600, Math.ceil(maxY)) };
}

export default function DiagramEditor({ initialXML = '', onApply, onBack, phase = 'cim', onChange }: DiagramEditorProps) {
  const [model, setModel] = useState<DiagramModel>(() => parseXmlToModel(initialXML, phase));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [connectMode, setConnectMode] = useState<EdgeType | null>(null);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [dragOverContainer, setDragOverContainer] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const liveDragPosRef = useRef<{ id: string; x: number; y: number; w: number; h: number } | null>(null);
  const boundaryDragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const boundaryResizeRef = useRef<{ id: string; corner: 'nw'|'ne'|'sw'|'se'; startMX: number; startMY: number; orig: {bx:number;by:number;bw:number;bh:number} } | null>(null);
  const undoStackRef = useRef<DiagramModel[]>([]);
  const redoStackRef = useRef<DiagramModel[]>([]);
  const modelRef = useRef<DiagramModel>(model);

  const currentPhase = phase;
  const palette = currentPhase === 'pim' ? PIM_PALETTE : CIM_PALETTE;

  const currentXml = useMemo(() => modelToXml(model), [model]);
  const didInitRef = useRef(false);
  const onChangeRef = useRef<((xml: string) => void) | undefined>(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (onChangeRef.current) onChangeRef.current(currentXml);
  }, [currentXml]);
  const bounds = useMemo(() => getBounds(model), [model]);

  useEffect(() => {
    if (initialXML && !didInitRef.current) {
      didInitRef.current = true;
      undoStackRef.current = [];
      redoStackRef.current = [];
      const m = parseXmlToModel(initialXML, phase);
      setModel(m);
    }
  }, [initialXML, phase]);

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
    const p = palette.find(p => p.type === type)!;
    const x = 80 + (model.nodes.length % 4) * 60;
    const y = 60 + Math.floor(model.nodes.length / 4) * 50;
    let newId = '';
    updateModel(m => {
      newId = 'n' + m.nextId;
      const node: DiagNode = { id: newId, type, label: p.label, x, y, w: p.w, h: p.h };
      if (isContainerType(type)) {
        if (type === 'cps_component') {
          node.boundaryW = 280;
          node.boundaryH = 200;
          node.boundaryX = x - 20;
          node.boundaryY = y - 20;
        } else {
          node.boundaryW = 240;
          node.boundaryH = 180;
          node.boundaryX = x + 55;
          node.boundaryY = y - 50;
        }
      } else {
        const cx = x + p.w / 2;
        const cy = y + p.h / 2;
        const cont = findContainingContainer(cx, cy, m.nodes);
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
    if (!isContainerType(node.type)) {
      const cx = node.x + node.w / 2;
      const cy = node.y + node.h / 2;
      const over = findContainingContainer(cx, cy, modelRef.current.nodes);
      setDragOverContainer(over ? over.id : null);
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
        if (isContainerType(n.type) && n.boundaryX !== undefined && n.boundaryY !== undefined) {
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
      if (dnode && !isContainerType(dnode.type)) {
        const pcx = lp.x + lp.w / 2;
        const pcy = lp.y + lp.h / 2;
        const over = findContainingContainer(pcx, pcy, modelRef.current.nodes);
        const overId = over ? over.id : null;
        if (overId !== dragOverContainer) setDragOverContainer(overId);
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
    setDragOverContainer(null);
    if (draggedId && finalPos && finalPos.id === draggedId) {
      const node = modelRef.current.nodes.find(nn => nn.id === draggedId);
      if (node && !isContainerType(node.type)) {
        const cx = finalPos.x + finalPos.w / 2;
        const cy = finalPos.y + finalPos.h / 2;
        const cont = findContainingContainer(cx, cy, modelRef.current.nodes);
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
        setDragOverContainer(null);
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
      setDragOverContainer(null);
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
      setDragOverContainer(null);
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
    setModel(parseXmlToModel('', currentPhase));
    setSelectedId(null);
    setSelectedEdgeId(null);
    setDragOverContainer(null);
    liveDragPosRef.current = null;
  };

  const newBlank = () => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setModel({ nodes: [], edges: [], nextId: 100 });
    setSelectedId(null);
    setSelectedEdgeId(null);
    setDragOverContainer(null);
    liveDragPosRef.current = null;
  };

  const loadProcess = () => {
    if (initialXML) {
      undoStackRef.current = [];
      redoStackRef.current = [];
      setModel(parseXmlToModel(initialXML, currentPhase));
      setSelectedId(null);
      setSelectedEdgeId(null);
      setDragOverContainer(null);
      liveDragPosRef.current = null;
    }
  };

  const handleStartBoundaryDragFromCanvas = (e: React.PointerEvent, id: string, bx: number, by: number) => {
    undoStackRef.current = [...undoStackRef.current.slice(-49), cloneModel(modelRef.current)];
    redoStackRef.current = [];
    setSelectedId(id);
    setSelectedEdgeId(null);
    const rect = canvasRef.current!.getBoundingClientRect();
    const sl = canvasRef.current!.scrollLeft;
    const st = canvasRef.current!.scrollTop;
    boundaryDragRef.current = { id, offsetX: e.clientX - rect.left + sl - bx, offsetY: e.clientY - rect.top + st - by };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 editor-area">
      <Toolbar
        phase={currentPhase}
        connectMode={connectMode}
        hasInitial={!!initialXML}
        onNewStarter={newIStar}
        onNewBlank={newBlank}
        onLoadProcess={loadProcess}
        onAddNode={addNode}
        onStartConnect={startConnect}
        onDelete={deleteSelected}
        onApply={apply}
        onBack={onBack}
        deleteDisabled={!selectedId && !selectedEdgeId}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar phase={currentPhase} connectMode={connectMode} onAddNode={addNode} />

        <div className="flex-1 relative">
          <Canvas
            model={model}
            bounds={bounds}
            selectedId={selectedId}
            selectedEdgeId={selectedEdgeId}
            dragOverContainer={dragOverContainer}
            connectMode={connectMode}
            canvasRef={canvasRef}
            onCanvasPointerMove={onCanvasPointerMove}
            onCanvasPointerUp={onCanvasPointerUp}
            onCanvasClick={onCanvasClick}
            onSelectEdge={(id) => { setSelectedEdgeId(id); setSelectedId(null); }}
            onStartBoundaryDrag={handleStartBoundaryDragFromCanvas}
          >
          {model.nodes.map(node => {
            const isSel = selectedId === node.id;
            return (
              <Node
                key={node.id}
                node={node}
                isSelected={isSel}
                isEditing={editingId === node.id}
                editValue={editValue}
                connectMode={!!connectMode}
                onPointerDown={onNodePointerDown}
                onClick={onNodeClick}
                onDoubleClick={() => startEdit(node.id, node.label)}
                onEditChange={setEditValue}
                onEditBlur={commitEdit}
                onEditKey={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
              />
            );
          })}

          {(() => {
            const sel = model.nodes.find(n => n.id === selectedId);
            if (!sel) return null;
            return <Handles node={sel} onStartResize={startBoundaryResize} />;
          })()}
          </Canvas>
        </div>
      </div>

      <div className="px-4 py-1 text-[10px] border-t border-[#33334d] text-[#9ca3af] flex justify-between flex-shrink-0">
        <span>{model.nodes.length} elements • {model.edges.length} links • {connectMode ? `link mode: ${connectMode}` : selectedEdgeId ? 'edge selected' : selectedId ? 'selected' : 'ready'}</span>
        <span>Visual editor (reduced draw.io style) • {currentPhase.toUpperCase()} • fully in-app &amp; offline • Apply to feed MDD process</span>
      </div>
    </div>
  );
}
