"use client";

import React from 'react';
import { DiagNode } from '../../lib/diagram/types';

interface ResizeHandlesProps {
  node: DiagNode;
  onStartResize: (e: React.PointerEvent, id: string, corner: 'nw'|'ne'|'sw'|'se') => void;
}

export default function ResizeHandles({ node, onStartResize }: ResizeHandlesProps) {
  if (!node.boundaryW || node.boundaryH == null) return null;
  const bx = node.boundaryX ?? 0;
  const by = node.boundaryY ?? 0;
  const bw = node.boundaryW;
  const bh = node.boundaryH;
  const hs = 9;
  const mk = (cx: number, cy: number, c: 'nw'|'ne'|'sw'|'se') => (
    <div
      key={c}
      onPointerDown={(e) => onStartResize(e, node.id, c)}
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
}
