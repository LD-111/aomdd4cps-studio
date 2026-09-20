"use client";

import React from 'react';
import { Mode } from '../lib/types';

interface QuestionnaireModalProps {
  mode: Mode;
  answers: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function QuestionnaireModal({ mode, answers, onUpdate, onSubmit, onClose }: QuestionnaireModalProps) {
  const isPsm = mode === 'pim-psm';
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-semibold">Apply Transformation Rules</div>
            <div className="text-xs text-[#9ca3af]">Demo questionnaire • Full version uses {mode === 'cim-pim' ? 'CIM-PIM-Rules.json' : 'PIM-PSM-Rules.json'} + model elements</div>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-[#9ca3af] hover:text-white">&times;</button>
        </div>

        <div className="space-y-5 text-sm">
          <div>
            <label className="block mb-1 text-[#9ca3af]">CPC Classification (example)</label>
            <select className="w-full bg-[#23233a] border border-[#33334d] rounded px-3 py-2" value={answers.is_cpc || ''} onChange={e => onUpdate('is_cpc', e.target.value)}>
              <option value="">Select...</option>
              <option value="true">true — is a Cyber Physical Component</option>
              <option value="false">false</option>
            </select>
            {answers.is_cpc === 'true' && (
              <textarea placeholder="Why is it a CPC? (description)" className="mt-2 w-full h-16 bg-[#23233a] border border-[#33334d] rounded p-2 text-sm" value={answers.cpc_desc || ''} onChange={e => onUpdate('cpc_desc', e.target.value)} />
            )}
          </div>

          <div>
            <label className="block mb-1 text-[#9ca3af]">Goal Check Interval (ms)</label>
            <input type="number" className="w-full bg-[#23233a] border border-[#33334d] rounded px-3 py-2" placeholder="e.g. 1000" value={answers.interval || ''} onChange={e => onUpdate('interval', e.target.value)} />
          </div>

          <div>
            <label className="block mb-1 text-[#9ca3af]">Operation Modes Enabled</label>
            <select className="w-full bg-[#23233a] border border-[#33334d] rounded px-3 py-2" value={answers.op_modes || ''} onChange={e => onUpdate('op_modes', e.target.value)}>
              <option value="">Select...</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>

          {isPsm && (
            <div>
              <label className="block mb-1 text-[#9ca3af]">PSM Data Structure Sample</label>
              <textarea className="w-full h-20 bg-[#23233a] border border-[#33334d] rounded p-2 text-sm font-mono" placeholder="name,description,type\n..." value={answers.psm_ds || ''} onChange={e => onUpdate('psm_ds', e.target.value)} />
            </div>
          )}

          <div className="pt-3 border-t border-[#33334d] text-xs text-[#9ca3af]">
            Real implementation will dynamically render tables for parameters, conditionals, and per-element forms matching loaded model objects.
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onSubmit} className="btn btn-primary flex-1 justify-center">Submit Attributes</button>
        </div>
      </div>
    </div>
  );
}
