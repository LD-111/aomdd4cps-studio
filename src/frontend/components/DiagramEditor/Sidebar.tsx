"use client";

import React from 'react';
import { NodeType } from '../../lib/diagram/types';
import { getNodeStyle } from '../../lib/diagram/utils';
import { CIM_PALETTE, PIM_PALETTE } from '../../lib/diagram/model';

interface PaletteItem { type: NodeType; label: string; w: number; h: number; }

interface DiagramSidebarProps {
  phase: 'cim' | 'pim';
  connectMode: string | null;
  onAddNode: (type: NodeType) => void;
}

export default function DiagramSidebar({ phase, connectMode, onAddNode }: DiagramSidebarProps) {
  const palette = phase === 'pim' ? PIM_PALETTE : CIM_PALETTE;
  return (
    <div className="w-48 border-r border-[#33334d] p-2 text-xs overflow-auto bg-[#0a0a12]">
      <div className="mb-2 font-medium text-[#9ca3af]">Palette (click to add)</div>
      {palette.map((p: PaletteItem) => (
        <div key={p.type} onClick={() => onAddNode(p.type)} className="cursor-pointer mb-1 px-2 py-1 rounded hover:bg-[#23233a] border border-[#33334d] flex items-center gap-2 text-[11px]">
          <span className="inline-block w-4 h-3" style={getNodeStyle(p.type)} /> {p.label}
        </div>
      ))}
      <div className="mt-3 text-[10px] text-[#9ca3af]">
        Click node/edge to select • Drag nodes • Double-click label • Tap link button then source then target • Grid click deselects • Del removes selected • Containers auto-group on drag in
      </div>
      {connectMode && <div className="mt-2 text-amber-400 text-xs">Link mode ({connectMode}): click SOURCE then TARGET node</div>}
    </div>
  );
}
