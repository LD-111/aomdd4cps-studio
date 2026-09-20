"use client";

import React from 'react';
import { Mode } from '../lib/types';

interface XmlInputPanelProps {
  mode: Mode;
  inputXML: string;
  isDragging: boolean;
  onInputChange: (value: string) => void;
  onLoadExample: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onClear: () => void;
}

export default function XmlInputPanel({
  mode,
  inputXML,
  isDragging,
  onInputChange,
  onLoadExample,
  onFileSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  onClear,
}: XmlInputPanelProps) {
  return (
    <div className="flex-1 flex flex-col panel rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-[#33334d] flex items-center justify-between text-sm">
        <div className="font-medium">Input {mode === 'cim-pim' ? 'CIM' : 'PIM'} (XML / draw.io)</div>
        <div className="flex gap-2">
          <button onClick={onLoadExample} className="btn btn-secondary text-xs py-1 px-2">Load Example</button>
          <label className="btn btn-secondary text-xs py-1 px-2 cursor-pointer">
            Load File
            <input type="file" accept=".xml,.drawio" onChange={onFileSelect} className="hidden" />
          </label>
        </div>
      </div>

      <div 
        className={`flex-1 m-3 rounded border ${isDragging ? 'border-[#6366f1] bg-[#1a1a2e]' : 'border-[#33334d]'} dropzone relative`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {!inputXML ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="text-4xl mb-3 opacity-50">📄</div>
            <div className="font-medium">Drop XML here or use Load buttons</div>
            <div className="text-xs text-[#9ca3af] mt-1">Supports draw.io / diagrams.net export XML</div>
          </div>
        ) : (
          <textarea 
            className="w-full h-full resize-none bg-transparent p-4 text-sm outline-none font-mono leading-relaxed"
            value={inputXML} 
            onChange={e => onInputChange(e.target.value)}
            spellCheck={false}
          />
        )}
      </div>
      <div className="px-4 py-1 text-[10px] text-[#9ca3af] border-t border-[#33334d] flex justify-between">
        <span>{inputXML ? `${Math.round(inputXML.length/1024)} KB loaded` : 'No model loaded'}</span>
        {inputXML && <button onClick={onClear} className="hover:text-white">clear</button>}
      </div>
    </div>
  );
}
