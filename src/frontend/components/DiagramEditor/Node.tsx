"use client";

import React from 'react';
import { DiagNode } from '../../lib/diagram/types';
import { getNodeStyle } from '../../lib/diagram/utils';

interface DiagramNodeProps {
  node: DiagNode;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  connectMode: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onClick: (e: React.MouseEvent, id: string) => void;
  onDoubleClick: () => void;
  onEditChange: (v: string) => void;
  onEditBlur: () => void;
  onEditKey: (e: React.KeyboardEvent) => void;
}

export default function DiagramNode({
  node,
  isSelected,
  isEditing,
  editValue,
  connectMode,
  onPointerDown,
  onClick,
  onDoubleClick,
  onEditChange,
  onEditBlur,
  onEditKey,
}: DiagramNodeProps) {
  const style = getNodeStyle(node.type);
  const nodeStyle: React.CSSProperties = {
    left: node.x, top: node.y, width: node.w, height: node.h,
    ...style,
    outline: isSelected ? '2px solid #6366f1' : 'none',
    zIndex: 1,
    fontSize: 11,
    color: '#1f2937',
    overflow: 'hidden',
    padding: 4,
    cursor: connectMode ? 'crosshair' : 'move',
  };
  if (node.parentId && !isSelected) {
    nodeStyle.boxShadow = 'inset 0 0 0 1.5px #6c8ebf';
  }
  return (
    <div
      className="absolute flex items-center justify-center text-[11px] text-center border box-border shadow-sm"
      style={nodeStyle}
      onPointerDown={(e) => onPointerDown(e, node.id)}
      onClick={(e) => onClick(e, node.id)}
      onDoubleClick={onDoubleClick}
    >
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={e => onEditChange(e.target.value)}
          onBlur={onEditBlur}
          onKeyDown={onEditKey}
          className="bg-white text-black text-xs w-full text-center outline-none"
        />
      ) : node.label}
    </div>
  );
}
