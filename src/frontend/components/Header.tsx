"use client";

import React from 'react';
import { Screen } from '../lib/types';

interface HeaderProps {
  screen: Screen;
  onSwitch: (s: Screen) => void;
}

export default function Header({ screen, onSwitch }: HeaderProps) {
  return (
    <header className="border-b border-[#33334d] bg-[#0f0f1a]/95 backdrop-blur px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#6366f1] flex items-center justify-center text-white font-bold text-sm">A</div>
        <div>
          <div className="font-semibold tracking-tight text-xl">AOMDD4CPS Studio</div>
          <div className="text-[10px] text-[#9ca3af] -mt-1">Agent-Oriented MDD for Cyber-Physical Systems</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded overflow-hidden border border-[#33334d] text-sm mr-4">
          <button onClick={() => onSwitch('process')} className={`px-3 py-1 ${screen === 'process' ? 'bg-[#6366f1] text-white' : 'hover:bg-[#23233a] text-[#9ca3af]'}`}>MDD Process</button>
          <button onClick={() => onSwitch('editor')} className={`px-3 py-1 ${screen === 'editor' ? 'bg-[#6366f1] text-white' : 'hover:bg-[#23233a] text-[#9ca3af]'}`}>Diagram Editor</button>
        </div>
        <a href="https://github.com/mdd4cps/aomdd4cps" target="_blank" className="text-[#9ca3af] hover:text-white">GitHub</a>
        <span className="text-[#33334d]">|</span>
        <span className="text-[#9ca3af]">CC BY-NC 4.0</span>
      </div>
    </header>
  );
}
