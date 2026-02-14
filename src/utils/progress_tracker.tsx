'use client';

import React from 'react';
import { Box, Typography } from '@/components/ui';
import { Stepper, Step, StepLabel } from '@/components/ui/stepper';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ProgressBarProps {
  progress: number;
  steps: string[];
  onStepClick?: (index: number) => void;
  activeStep?: number;
}

const ProgressBar = ({ progress, steps, onStepClick, activeStep }: ProgressBarProps) => {
  // Use media query to determine screen size
  const isSmallScreen = useMediaQuery('down', 'sm');

  return (
    <Box sx={{ mb: 3 }}>
      {/* Linear Progress Bar (Customised using Tailwind for new project) */}
      <div className="w-full bg-[#CCE6CC] rounded-full h-[10px] mb-4">
        <div
          className="bg-[#2A952A] h-[10px] rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Responsive Stepper */}
      <Stepper
        activeStep={activeStep !== undefined ? activeStep : Math.floor((progress / 100) * steps.length)}
        orientation={isSmallScreen ? 'vertical' : 'horizontal'}
      >
        {steps.map((label, index) => (
          <Step
            key={index}
            onClick={() => onStepClick && onStepClick(index)}
            className={onStepClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
          >
            <StepLabel>
              <Typography variant={isSmallScreen ? "caption" : "body2"}>
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default ProgressBar;
