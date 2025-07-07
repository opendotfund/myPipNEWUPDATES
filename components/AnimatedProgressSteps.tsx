import React, { useState, useEffect } from 'react';

interface AnimatedProgressStepsProps {
  isLoading: boolean;
  currentStep: number;
  steps: string[];
  isDarkMode?: boolean;
}

export const AnimatedProgressSteps: React.FC<AnimatedProgressStepsProps> = ({
  isLoading,
  currentStep,
  steps,
  isDarkMode = false
}) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (isLoading && currentStep > 0) {
      // Animate the completion of steps up to currentStep
      const newCompletedSteps = [];
      for (let i = 0; i < currentStep; i++) {
        setTimeout(() => {
          setCompletedSteps(prev => [...prev, i]);
        }, i * 800); // 800ms delay between each step
      }
    } else if (!isLoading) {
      // Reset when not loading
      setCompletedSteps([]);
    }
  }, [isLoading, currentStep]);

  if (!isLoading) return null;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = index === currentStep - 1;
          
          return (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-500 ${
                isCompleted 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : isCurrent 
                    ? 'bg-blue-500/20 border border-blue-500/30' 
                    : 'bg-white/10 border border-white/20'
              }`}
            >
              {/* Step indicator */}
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-white/20 text-white/60'
              }`}>
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              
              {/* Step text */}
              <div className="flex-1">
                <p className={`text-sm font-medium transition-all duration-500 ${
                  isCompleted 
                    ? 'text-green-300' 
                    : isCurrent 
                      ? 'text-blue-300' 
                      : 'text-white/60'
                }`}>
                  {step}
                </p>
              </div>
              
              {/* Progress bar */}
              <div className="flex-shrink-0 w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${
                    isCompleted 
                      ? 'bg-green-500 w-full' 
                      : isCurrent 
                        ? 'bg-blue-500 w-1/2 animate-pulse' 
                        : 'bg-transparent w-0'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 