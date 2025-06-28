import React, { useEffect, useRef, useCallback } from 'react';

interface PhonePreviewProps {
  htmlContent: string;
  onPreviewInteraction: (actionId: string, actionDescription: string) => void;
  size?: 'tiny' | 'small' | 'default' | 'mini';
  className?: string;
  isLoading?: boolean;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({ htmlContent, onPreviewInteraction, size = 'default', className, isLoading = false }) => {
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Size configurations
  const sizeConfig = {
    mini: {
      container: 'bg-neutral-200 p-0.5 rounded-lg shadow-md w-[120px] h-[240px] md:w-[140px] md:h-[280px] flex-shrink-0',
      screen: 'bg-neutral-800 w-full h-full rounded-md overflow-hidden relative'
    },
    tiny: {
      container: 'bg-neutral-200 p-1 rounded-xl shadow-lg w-[180px] h-[360px] md:w-[200px] md:h-[400px] flex-shrink-0',
      screen: 'bg-neutral-800 w-full h-full rounded-lg overflow-hidden relative'
    },
    small: {
      container: 'bg-neutral-200 p-1.5 rounded-2xl shadow-xl w-[240px] h-[480px] md:w-[260px] md:h-[520px] flex-shrink-0',
      screen: 'bg-neutral-800 w-full h-full rounded-xl overflow-hidden relative'
    },
    default: {
      container: 'bg-neutral-200 p-2 rounded-3xl shadow-2xl w-[320px] h-[650px] md:w-[350px] md:h-[700px] flex-shrink-0',
      screen: 'bg-neutral-800 w-full h-full rounded-2xl overflow-hidden relative'
    }
  };

  const config = sizeConfig[size];

  const handleInteraction = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const actionId = target.getAttribute('data-action-id');
    const actionDescription = target.getAttribute('data-action-description');
    
    if (actionId) {
      event.preventDefault();
      event.stopPropagation();
      
      // Provide immediate visual feedback
      target.style.transform = 'scale(0.95)';
      setTimeout(() => {
        target.style.transform = '';
      }, 150);
      
      // Call the interaction handler
      onPreviewInteraction(actionId, actionDescription || actionId);
    }
  }, [onPreviewInteraction]);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    // Add a small delay to ensure the HTML content is fully rendered
    const timeoutId = setTimeout(() => {
      const interactiveElements = container.querySelectorAll('[data-action-id]');
      console.log(`Found ${interactiveElements.length} interactive elements in preview`);
      
      const listenersToRemove: Array<{ el: Element, listener: (e: Event) => void }> = [];

      interactiveElements.forEach((el, index) => {
        const actionId = el.getAttribute('data-action-id');
        const actionDescription = el.getAttribute('data-action-description');
        
        console.log(`Setting up listener for element ${index}:`, { actionId, actionDescription });

        if (actionId) {
          const eventListener = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Interaction detected:`, { actionId, actionDescription });
            
            // Enhanced visual feedback
            if (el instanceof HTMLElement) {
              el.style.transform = 'scale(0.95)';
              el.style.transition = 'transform 0.1s ease';
              
              setTimeout(() => {
                el.style.transform = 'scale(1)';
              }, 100);
            }
            
            // Call the interaction handler immediately
            handleInteraction(e as MouseEvent);
          };
          
          // Add multiple event listeners for better interaction coverage
          el.addEventListener('click', eventListener);
          el.addEventListener('touchstart', eventListener, { passive: false });
          el.addEventListener('mousedown', eventListener);
          
          // Enhanced styling for interactive elements
          if (el instanceof HTMLElement) {
            el.style.cursor = 'pointer';
            el.style.userSelect = 'none';
            el.style.transition = 'all 0.2s ease';
            el.style.position = 'relative';
            
            // Add hover effects if not already present
            if (!el.classList.contains('hover:opacity-80')) {
              el.classList.add('hover:opacity-80');
            }
            if (!el.classList.contains('transition-opacity')) {
              el.classList.add('transition-opacity');
            }
            if (!el.classList.contains('active:scale-95')) {
              el.classList.add('active:scale-95');
            }
            
            // Add focus styles for accessibility
            el.setAttribute('tabindex', '0');
            el.addEventListener('focus', () => {
              el.style.outline = '2px solid #3b82f6';
              el.style.outlineOffset = '2px';
            });
            el.addEventListener('blur', () => {
              el.style.outline = 'none';
            });
            
            // Add hover state management
            el.addEventListener('mouseenter', () => {
              el.style.transform = 'scale(1.02)';
            });
            el.addEventListener('mouseleave', () => {
              el.style.transform = 'scale(1)';
            });
          }
          
          listenersToRemove.push({ el, listener: eventListener });
        }
      });

      // Also handle form inputs and other interactive elements without data-action-id
      const formInputs = container.querySelectorAll('input, textarea, select, button');
      formInputs.forEach((input) => {
        if (!input.hasAttribute('data-action-id')) {
          // Add basic interactivity to form elements
          if (input instanceof HTMLElement) {
            input.style.transition = 'all 0.2s ease';
            
            // Add focus styles
            input.addEventListener('focus', () => {
              input.style.outline = '2px solid #3b82f6';
              input.style.outlineOffset = '2px';
            });
            input.addEventListener('blur', () => {
              input.style.outline = 'none';
            });
          }
        }
      });

      return () => {
        listenersToRemove.forEach(({ el, listener }) => {
          el.removeEventListener('click', listener);
          el.removeEventListener('touchstart', listener);
          el.removeEventListener('mousedown', listener);
        });
      };
    }, 100); // Small delay to ensure content is rendered

    return () => {
      clearTimeout(timeoutId);
    };
  }, [htmlContent, handleInteraction]);

  return (
    <div className={`${config.container} ${className || ''}`}>
      <div className={config.screen}>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-neutral-800 rounded-b-lg z-10" aria-hidden="true"></div>
        
        <div 
          ref={previewContainerRef}
          className="w-full h-full overflow-y-auto bg-white text-neutral-800 relative"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          aria-live="polite"
          style={{ 
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            WebkitOverflowScrolling: 'touch'
          }}
        />
        
        {/* Loading Overlay - Only show for AI interactions, not initial generation */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-700">Processing interaction...</span>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-neutral-500 rounded-full" aria-hidden="true"></div>
      </div>
    </div>
  );
};
