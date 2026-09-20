"use client";

import React from 'react';
import { Mode } from '../lib/types';

interface TransformationControlsProps {
  mode: Mode;
  setMode: (m: Mode) => void;
  isPsm: boolean;
  platform: string;
  setPlatform: (p: string) => void;
  commTech: string;
  setCommTech: (c: string) => void;
  openQuestionnaire: () => void;
  transform: () => void;
  downloadOutput: () => void;
  inputXML: string;
  outputXML: string;
  rulesApplied: boolean;
}

export default function TransformationControls({
  mode,
  setMode,
  isPsm,
  platform,
  setPlatform,
  commTech,
  setCommTech,
  openQuestionnaire,
  transform,
  downloadOutput,
  inputXML,
  outputXML,
  rulesApplied,
}: TransformationControlsProps) {
  return (
    <div className="w-72 flex-shrink-0 panel rounded-lg p-4 flex flex-col gap-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-[#9ca3af] mb-2">Transformation Mode</div>
        <div className="flex rounded overflow-hidden border border-[#33334d]">
          <button
            onClick={() => { setMode('cim-pim'); }}
            className={`flex-1 py-2 text-sm font-medium transition ${mode === 'cim-pim' ? 'bg-[#6366f1] text-white' : 'hover:bg-[#23233a]'}`}
          >
            CIM → PIM
          </button>
          <button
            onClick={() => { setMode('pim-psm'); }}
            className={`flex-1 py-2 text-sm font-medium transition ${mode === 'pim-psm' ? 'bg-[#6366f1] text-white' : 'hover:bg-[#23233a]'}`}
          >
            PIM → PSM
          </button>
        </div>
      </div>

      {isPsm && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9ca3af] mb-1">Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-[#23233a] border border-[#33334d] rounded px-3 py-2 text-sm">
              <option value="arduino">Arduino MKR WiFi 1010</option>
              <option value="esp32">ESP32 (future)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#9ca3af] mb-1">Communication</label>
            <select value={commTech} onChange={e => setCommTech(e.target.value)} className="w-full bg-[#23233a] border border-[#33334d] rounded px-3 py-2 text-sm">
              <option value="mqtt">MQTT + FreeRTOS</option>
              <option value="other">Other (future)</option>
            </select>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-[#33334d] space-y-2">
        <button onClick={openQuestionnaire} className="btn btn-secondary w-full justify-center" disabled={!inputXML}>
          Apply Rules
        </button>
        <div className="text-[10px] text-[#9ca3af] px-1">
          Loads {mode === 'cim-pim' ? 'CIM-PIM' : 'PIM-PSM'}-Rules.json questionnaire
        </div>
        {rulesApplied && <div className="text-[10px] text-[#22c55e] px-1">✓ Attributes captured</div>}
      </div>

      <div className="mt-auto pt-4 border-t border-[#33334d] space-y-2">
        <button 
          onClick={transform} 
          disabled={!inputXML} 
          className="btn btn-primary w-full justify-center disabled:opacity-50"
        >
          Transform
        </button>
        <button 
          onClick={downloadOutput} 
          disabled={!outputXML} 
          className="btn btn-secondary w-full justify-center disabled:opacity-50"
        >
          Download Output
        </button>
      </div>
    </div>
  );
}
