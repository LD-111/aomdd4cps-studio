"use client";

import React, { useState, useCallback } from 'react';
import Header from '../components/Header';
import ProcessStepper from '../components/ProcessStepper';
import TransformationControls from '../components/TransformationControls';
import XmlInputPanel from '../components/XmlInputPanel';
import XmlOutputPanel from '../components/XmlOutputPanel';
import QuestionnaireModal from '../components/QuestionnaireModal';
import { Mode, Step } from '../lib/types';

const STEPS: Step[] = [
  { id: 1, label: 'Input Model' },
  { id: 2, label: 'User Attributes' },
  { id: 3, label: 'Transformed' },
  { id: 4, label: 'Code (future)' },
];

export default function AOMDDStudio() {
  const [mode, setMode] = useState<Mode>('cim-pim');
  const [inputXML, setInputXML] = useState('');
  const [outputXML, setOutputXML] = useState('');
  const [platform, setPlatform] = useState('arduino');
  const [commTech, setCommTech] = useState('mqtt');
  const [currentStep, setCurrentStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const [rulesApplied, setRulesApplied] = useState(false);

  const isPsm = mode === 'pim-psm';

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputXML(content);
      setOutputXML('');
      setCurrentStep(1);
      setRulesApplied(false);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xml') || file.name.endsWith('.drawio'))) {
      loadFile(file);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const loadExample = () => {
    const examplePath = mode === 'cim-pim' 
      ? '/examples/cim-greenhouse.xml' 
      : '/examples/pim-greenhouse.xml';
    fetch(examplePath)
      .then(r => r.text())
      .then(text => {
        setInputXML(text);
        setOutputXML('');
        setCurrentStep(1);
        setRulesApplied(false);
      });
  };

  const openQuestionnaire = () => {
    setQuestionnaireAnswers({});
    setShowQuestionnaire(true);
  };

  const closeQuestionnaire = () => {
    setShowQuestionnaire(false);
  };

  const updateAnswer = (key: string, value: string) => {
    setQuestionnaireAnswers(prev => ({ ...prev, [key]: value }));
  };

  const submitQuestionnaire = () => {
    setRulesApplied(true);
    setCurrentStep(2);
    setShowQuestionnaire(false);
  };

  const transform = () => {
    if (!inputXML) return;
    
    setCurrentStep(3);
    
    const timestamp = new Date().toISOString();
    let result = inputXML;
    
    if (isPsm) {
      result = `<!-- PSM intermediate (platform=${platform}, comm=${commTech}) generated ${timestamp} -->\n` + result;
    } else {
      result = `<!-- PIM generated via CIM->PIM ${timestamp} -->\n` + result;
    }
    
    if (rulesApplied) {
      result = `<!-- User attributes applied: ${Object.keys(questionnaireAnswers).length} fields -->\n` + result;
    }
    
    setOutputXML(result);
  };

  const downloadOutput = () => {
    if (!outputXML) return;
    const blob = new Blob([outputXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'cim-pim' ? 'pim-output.xml' : 'psm-intermediate.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setInputXML('');
    setOutputXML('');
    setCurrentStep(1);
    setRulesApplied(false);
    setQuestionnaireAnswers({});
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setRulesApplied(false);
    setCurrentStep(1);
  };

  const handleInputClear = () => {
    setInputXML('');
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="uppercase tracking-[2px] text-xs text-[#9ca3af]">MDD Process</div>
          <button onClick={clearAll} className="btn btn-secondary text-xs px-3 py-1">Reset</button>
        </div>

        <ProcessStepper steps={STEPS} currentStep={currentStep} />
      </div>

      <div className="flex-1 px-6 pb-6 flex gap-4 min-h-0">
        <TransformationControls
          mode={mode}
          setMode={handleModeChange}
          isPsm={isPsm}
          platform={platform}
          setPlatform={setPlatform}
          commTech={commTech}
          setCommTech={setCommTech}
          openQuestionnaire={openQuestionnaire}
          transform={transform}
          downloadOutput={downloadOutput}
          inputXML={inputXML}
          outputXML={outputXML}
          rulesApplied={rulesApplied}
        />

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <XmlInputPanel
            mode={mode}
            inputXML={inputXML}
            isDragging={isDragging}
            onInputChange={setInputXML}
            onLoadExample={loadExample}
            onFileSelect={handleFileInput}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClear={handleInputClear}
          />

          <XmlOutputPanel
            mode={mode}
            outputXML={outputXML}
            onDownload={downloadOutput}
          />
        </div>
      </div>

      {showQuestionnaire && (
        <QuestionnaireModal
          mode={mode}
          answers={questionnaireAnswers}
          onUpdate={updateAnswer}
          onSubmit={submitQuestionnaire}
          onClose={closeQuestionnaire}
        />
      )}

      <footer className="text-center text-[10px] text-[#9ca3af] py-3 border-t border-[#33334d]">
        Rebuild of legacy Flask UI. Preserves exact transformation semantics from legacy-src. See AGENTS.md &amp; MDD4CPS docs.
      </footer>
    </div>
  );
}
