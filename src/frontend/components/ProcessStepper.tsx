import React from 'react';
import { Step } from '../lib/types';

interface ProcessStepperProps {
  steps: Step[];
  currentStep: number;
}

export default function ProcessStepper({ steps, currentStep }: ProcessStepperProps) {
  const getStepClass = (stepId: number) => {
    if (stepId < currentStep) return 'step-done';
    if (stepId === currentStep) return 'step-active';
    return 'step-pending';
  };

  return (
    <div className="flex gap-2 mb-6">
      {steps.map((step, idx) => (
        <div key={step.id} className={`step flex-1 px-3 py-2 rounded panel text-sm ${getStepClass(step.id)}`}>
          <div className="step-dot">{step.id}</div>
          <div className="font-medium">{step.label}</div>
          {idx < steps.length - 1 && <div className="flex-1 h-px bg-[#33334d] mx-2" />}
        </div>
      ))}
    </div>
  );
}
