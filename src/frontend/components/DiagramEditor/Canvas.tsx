"use client";

import React from 'react';
import { DiagramModel, EdgeType, DiagNode, DiagEdge } from '../../lib/diagram/types';
import { isContainerType } from '../../lib/diagram/utils';
import { getRectBoundaryIntersection } from '../../lib/diagram/utils';

interface DiagramCanvasProps {
  model: DiagramModel;
  bounds: { w: number; h: number };
  selectedId: string | null;
  selectedEdgeId: string | null;
  dragOverContainer: string | null;
  connectMode: EdgeType | null;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onCanvasPointerMove: (e: React.PointerEvent) => void;
  onCanvasPointerUp: () => void;
  onCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSelectEdge: (id: string) => void;
  onStartBoundaryDrag: (e: React.PointerEvent, id: string, bx: number, by: number) => void;
  children?: React.ReactNode;
}

function getMarker(etype: EdgeType) {
  if (etype === 'and-refinement') return 'arrow-and';
  if (etype === 'or-refinement') return 'arrow-or';
  if (etype === 'contribution') return 'arrow-contrib';
  return 'arrow-dep';
}

export default function DiagramCanvas({
  model, bounds, selectedId, selectedEdgeId, dragOverContainer, connectMode,
  canvasRef, onCanvasPointerMove, onCanvasPointerUp, onCanvasClick,
  onSelectEdge, onStartBoundaryDrag, children
}: DiagramCanvasProps) {
  return (
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
          {model.nodes.filter((n: DiagNode) => isContainerType(n.type) && n.boundaryW != null).map((n: DiagNode) => {
            const bx = n.boundaryX ?? (n.type === 'cps_component' ? n.x - 20 : n.x + 45);
            const by = n.boundaryY ?? (n.type === 'cps_component' ? n.y - 20 : n.y - 35);
            const bw = n.boundaryW!;
            const bh = n.boundaryH!;
            const isSel = selectedId === n.id;
            const isOver = dragOverContainer === n.id;
            const onBClick = (ev: React.MouseEvent) => { ev.stopPropagation(); };
            const isRect = n.type === 'cps_component';
            const commonProps = {
              fill: isOver ? '#166534' : 'none',
              fillOpacity: isOver ? 0.12 : undefined,
              stroke: isSel ? '#6366f1' : isOver ? '#22c55e' : (n.type === 'cps_component' ? '#0369a1' : '#6c8ebf'),
              strokeWidth: isSel || isOver ? 3 : 2,
              strokeDasharray: isOver ? '3 2' : '5 3',
              onClick: onBClick,
              onPointerDown: (e: React.PointerEvent) => {
                if (connectMode) return;
                onStartBoundaryDrag(e, n.id, bx, by);
              },
              style: { pointerEvents: 'all' as const, cursor: connectMode ? 'crosshair' : 'move' as const },
            };
            return isRect ? (
              <rect key={`bound-${n.id}`} x={bx} y={by} width={bw} height={bh} {...commonProps} />
            ) : (
              <ellipse key={`bound-${n.id}`} cx={bx + bw / 2} cy={by + bh / 2} rx={bw / 2} ry={bh / 2} {...commonProps} />
            );
          })}
          {model.edges.map((e: DiagEdge) => {
            const s = model.nodes.find((n: DiagNode) => n.id === e.source);
            const t = model.nodes.find((n: DiagNode) => n.id === e.target);
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
            else if (e.type === 'comm_relation') label = 'msg';
            else if (e.value) label = e.value;
            const marker = getMarker(e.type);
            const selectEdge = (ev: React.MouseEvent) => { ev.stopPropagation(); onSelectEdge(e.id); };
            return (
              <g key={e.id}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="14" onClick={selectEdge} style={{ cursor: 'pointer' }} />
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isSel ? '#6366f1' : '#6c8ebf'} strokeWidth={isSel ? '3' : '2'} markerEnd={`url(#${marker})`} pointerEvents="none" />
                {label && (
                  <text x={midX} y={midY - 4} fill={isSel ? '#6366f1' : '#aaa'} fontSize="10" textAnchor="middle" onClick={selectEdge} style={{ cursor: 'pointer', pointerEvents: 'all' }}>{label}</text>
                )}
              </g>
            );
          })}
        </svg>
        {children}
      </div>
    </div>
  );
}

