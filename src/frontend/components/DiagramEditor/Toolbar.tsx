"use client";

import React from 'react';
import { NodeType, EdgeType } from '../../lib/diagram/types';
import { CIM_PALETTE, PIM_PALETTE } from '../../lib/diagram/model';

interface PaletteItem { type: NodeType; label: string; w: number; h: number; }

interface DiagramToolbarProps {
  phase: 'cim' | 'pim';
  connectMode: EdgeType | null;
  hasInitial: boolean;
  onNewStarter: () => void;
  onNewBlank: () => void;
  onLoadProcess: () => void;
  onAddNode: (t: NodeType) => void;
  onStartConnect: (t: EdgeType) => void;
  onDelete: () => void;
  onApply: () => void;
  onBack: () => void;
  deleteDisabled?: boolean;
}

export default function DiagramToolbar({
  phase, connectMode, hasInitial,
  onNewStarter, onNewBlank, onLoadProcess, onAddNode,
  onStartConnect, onDelete, onApply, onBack, deleteDisabled
}: DiagramToolbarProps) {
  const palette = phase === 'pim' ? PIM_PALETTE : CIM_PALETTE;
  return (
    <div className="px-4 py-2 border-b border-[#33334d] flex items-center justify-between text-sm flex-shrink-0">
      <div>
        <span className="font-medium">Diagram Editor</span>
        <span className="ml-2 text-[#9ca3af] text-xs">in-app visual • {phase} • offline</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={onNewStarter} className="btn btn-secondary text-xs py-1 px-2">{phase === 'cim' ? 'New i* Starter' : 'New PIM Starter'}</button>
        <button onClick={onNewBlank} className="btn btn-secondary text-xs py-1 px-2">Blank</button>
        <button onClick={onLoadProcess} className="btn btn-secondary text-xs py-1 px-2" disabled={!hasInitial}>Load from Process</button>
        {palette.map((p: PaletteItem) => (
          <button key={p.type} onClick={() => onAddNode(p.type)} className="btn btn-secondary text-xs py-1 px-2">{p.label}</button>
        ))}
        {phase === 'cim' ? (
          <>
           <button onClick={() => onStartConnect('and-refinement')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>AND Refine</button>
           <button onClick={() => onStartConnect('or-refinement')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>OR Refine</button>
           <button onClick={() => onStartConnect('dependency')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>Depends</button>
           <button onClick={() => onStartConnect('contribution')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>Contrib</button>
          </>
        ) : (
          <>
           <button onClick={() => onStartConnect('relation_from_to')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>Relate</button>
           <button onClick={() => onStartConnect('comm_relation')} className="btn btn-secondary text-xs py-1 px-2" disabled={!!connectMode}>Comm</button>
          </>
        )}
        <button onClick={onDelete} className="btn btn-secondary text-xs py-1 px-2" disabled={deleteDisabled}>Delete</button>
        <button onClick={onApply} className="btn btn-primary text-xs py-1 px-2">Use in MDD Process</button>
        <button onClick={onBack} className="btn btn-secondary text-xs py-1 px-2">Back to Process</button>
      </div>
    </div>
  );
}
