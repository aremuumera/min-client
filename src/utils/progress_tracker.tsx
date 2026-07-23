'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/helper';

interface ProgressBarProps {
  progress: number;
  steps: string[];
  onStepClick?: (index: number) => void;
  activeStep?: number;
}

const ProgressBar = ({ progress, steps, onStepClick, activeStep = 0 }: ProgressBarProps) => {
  const displaySteps = steps;
  const currentStep = Math.min(activeStep, displaySteps.length - 1);

  return (
    <div className="w-full mb-6">
      {/* Mobile Stepper Header (< sm screen) */}
      <div className="sm:hidden mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            Step {currentStep + 1} of {displaySteps.length}
          </span>
          <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">
            {displaySteps[currentStep] || ''}
          </span>
        </div>

        {/* Mobile Segmented Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 w-full">
          {displaySteps.map((stepTitle, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            return (
              <div key={index} className="flex flex-col gap-1">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    isCompleted && "bg-green-600",
                    isActive && "bg-green-600 ring-2 ring-green-100",
                    !isCompleted && !isActive && "bg-gray-200"
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] text-center font-medium truncate",
                    isActive && "text-green-700 font-bold",
                    isCompleted && "text-gray-600",
                    !isCompleted && !isActive && "text-gray-400"
                  )}
                >
                  {stepTitle.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop & Tablet Stepper (>= sm screen) */}
      <div className="hidden sm:block">
        <div className="relative flex items-center justify-between w-full">
          {displaySteps.map((stepLabel, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isClickable = onStepClick && index <= currentStep;

            return (
              <React.Fragment key={index}>
                {/* Step Item */}
                <div
                  onClick={() => isClickable && onStepClick(index)}
                  className={cn(
                    "flex items-center gap-2.5 relative z-10 bg-white px-2 py-1 rounded-lg transition-all",
                    isClickable ? "cursor-pointer hover:opacity-90" : "cursor-default"
                  )}
                >
                  {/* Circle Badge */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 border-2 shrink-0",
                      isCompleted && "bg-green-600 border-green-600 text-white",
                      isActive && "bg-white border-green-600 text-green-700 ring-4 ring-green-50 font-bold",
                      !isCompleted && !isActive && "bg-gray-50 border-gray-300 text-gray-400"
                    )}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : index + 1}
                  </div>

                  {/* Step Title */}
                  <span
                    className={cn(
                      "text-xs md:text-sm font-medium transition-colors whitespace-nowrap",
                      isActive && "text-green-700 font-semibold",
                      isCompleted && "text-gray-800",
                      !isCompleted && !isActive && "text-gray-400"
                    )}
                  >
                    {stepLabel}
                  </span>
                </div>

                {/* Connecting Line between steps */}
                {index < displaySteps.length - 1 && (
                  <div className="flex-1 mx-1.5 h-0.5 bg-gray-200">
                    <div
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: index < currentStep ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
