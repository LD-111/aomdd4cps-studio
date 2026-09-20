"use client";

import React from 'react';
import { Mode } from '../lib/types';

interface XmlOutputPanelProps {
  mode: Mode;
  outputXML: string;
  onDownload: () => void;
}

export default function XmlOutputPanel({ mode, outputXML, onDownload }: XmlOutputPanelProps) {
  const isPsm = mode === 'pim-psm';
  return (
    <div className="flex-1 flex flex-col panel rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-[#33334d] flex items-center justify-between text-sm">
        <div className="font-medium">Output {isPsm ? 'PSM Intermediate' : 'PIM'}</div>
        {outputXML && <button onClick={onDownload} className="btn btn-secondary text-xs py-1 px-3">Download</button>}
      </div>
      <div className="flex-1 m-3 rounded border border-[#33334d] bg-[#161626] overflow-auto">
        {outputXML ? (
          <textarea 
            className="w-full h-full resize-none bg-transparent p-4 text-sm font-mono leading-relaxed" 
            value={outputXML} 
            readOnly 
            spellCheck={false}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-[#9ca3af] text-sm">
            Transformed model will appear here
          </div>
        )}
      </div>
    </div>
  );
}
