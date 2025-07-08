import React, { useEffect, useRef, useCallback } from 'react';

interface PhonePreviewProps {
  htmlContent: string;
  onPreviewInteraction: (actionId: string, actionDescription: string) => void;
  size?: 'tiny' | 'small' | 'default' | 'mini';
  className?: string;
  isLoading?: boolean;
  isRotated?: boolean;
  onRotate?: () => void;
  isGenerating?: boolean;
  onPreviewReady?: () => void;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({ 
  htmlContent, 
  onPreviewInteraction, 
  size = 'default', 
  className, 
  isLoading = false,
  isRotated = false,
  onRotate,
  isGenerating = false,
  onPreviewReady
}) => {
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Size configurations for both portrait and landscape
  const sizeConfig = {
    mini: {
      portrait: {
        container: 'bg-neutral-200 p-0.5 rounded-lg shadow-md w-[120px] h-[240px] md:w-[140px] md:h-[280px] flex-shrink-0',
        screen: 'bg-neutral-800 w-full h-full rounded-md overflow-hidden relative'
      },
      landscape: {
        container: 'bg-neutral-200 p-0.5 rounded-lg shadow-md w-[240px] h-[120px] md:w-[280px] md:h-[140px] flex-shrink-0',
        screen: 'bg-neutral-800 w-full h-full rounded-md overflow-hidden relative'
      }
    },
    tiny: {
      portrait: {
        container: 'bg-neutral-200 p-1 rounded-xl shadow-lg w-[180px] h-[360px] md:w-[200px] md:h-[400px] flex-shrink-0',
        screen: 'bg-neutral-800 w-full h-full rounded-lg overflow-hidden relative'
      },
      landscape: {
        container: 'bg-neutral-200 p-1 rounded-xl shadow-lg w-[360px] h-[180px] md:w-[400px] md:h-[200px] flex-shrink-0',
        screen: 'bg-neutral-800 w-full h-full rounded-lg overflow-hidden relative'
      }
    },
    small: {
      portrait: {
        container: 'bg-neutral-200 p-1.5 rounded-2xl shadow-xl w-[240px] h-[480px] md:w-[260px] md:h-[520px] flex-shrink-0',
        screen: 'bg-neutral-800 w-full h-full rounded-xl overflow-hidden relative'
      },
      landscape: {
        container: 'bg-neutral-200 p-1.5 rounded-2xl shadow-xl w-[480px] h-[240px] md:w-[520px] md:h-[260px] flex-shrink-0',
        screen: 'bg-neutral-800 w-full h-full rounded-xl overflow-hidden relative'
      }
    },
    default: {
      portrait: {
        container: 'bg-neutral-200 p-2 rounded-3xl shadow-2xl w-[320px] h-[650px] md:w-[350px] md:h-[700px] flex-shrink-0',
        screen: 'bg-neutral-800 w-full h-full rounded-2xl overflow-hidden relative'
      },
      landscape: {
        container: 'bg-neutral-200 p-2 rounded-3xl shadow-2xl w-[650px] h-[320px] md:w-[700px] md:h-[350px] flex-shrink-0',
        screen: 'bg-neutral-800 w-full h-full rounded-2xl overflow-hidden relative'
      }
    }
  };

  const config = isRotated ? sizeConfig[size].landscape : sizeConfig[size].portrait;

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
    console.log('PhonePreview: HTML content updated, length:', htmlContent.length);
    console.log('PhonePreview: HTML content preview:', htmlContent.substring(0, 200) + '...');
    
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
            console.log(`PhonePreview: Interaction detected:`, { actionId, actionDescription });
            console.log(`PhonePreview: Element clicked:`, el);
            
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
            
            // Add click handler for elements without data-action-id
            const clickHandler = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              
              console.log('PhonePreview: Clicked element without data-action-id:', input);
              
              // Determine action based on element type and content
              let actionId = 'default';
              let actionDescription = 'Element interaction';
              
              if (input.tagName === 'BUTTON') {
                const buttonText = input.textContent?.toLowerCase() || '';
                if (buttonText.includes('add') || buttonText.includes('new')) {
                  actionId = 'addItem';
                  actionDescription = 'Add new item';
                } else if (buttonText.includes('delete') || buttonText.includes('remove')) {
                  actionId = 'deleteItem';
                  actionDescription = 'Delete item';
                } else if (buttonText.includes('save')) {
                  actionId = 'saveData';
                  actionDescription = 'Save data';
                } else if (buttonText.includes('submit')) {
                  actionId = 'submitForm';
                  actionDescription = 'Submit form';
                } else if (buttonText.includes('edit')) {
                  actionId = 'editItem';
                  actionDescription = 'Edit item';
                } else {
                  actionId = 'buttonClick';
                  actionDescription = `Clicked ${buttonText || 'button'}`;
                }
              } else if (input.tagName === 'INPUT') {
                const inputElement = input as HTMLInputElement;
                if (inputElement.type === 'checkbox') {
                  actionId = 'toggleItem';
                  actionDescription = 'Toggle checkbox';
                } else if (inputElement.type === 'text' || inputElement.type === 'email') {
                  actionId = 'inputChange';
                  actionDescription = 'Text input';
                }
              }
              
              // Call the interaction handler
              onPreviewInteraction(actionId, actionDescription);
            };
            
            input.addEventListener('click', clickHandler);
            input.addEventListener('touchstart', clickHandler, { passive: false });
            
            listenersToRemove.push({ el: input, listener: clickHandler });
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

    // Notify that preview is ready after content is rendered
    if (onPreviewReady && htmlContent && !isGenerating) {
      const readyTimeoutId = setTimeout(() => {
        onPreviewReady();
      }, 200); // Small delay to ensure everything is fully rendered
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(readyTimeoutId);
      };
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [htmlContent, handleInteraction, onPreviewReady, isGenerating]);

  return (
    <div className={`${config.container} ${className || ''} transition-all duration-700 ease-in-out`}>
      <div className={config.screen}>
        {/* Dynamic notch positioning based on rotation */}
        <div className={`absolute ${isRotated ? 'top-1/2 left-0 transform -translate-y-1/2 w-5 h-24' : 'top-0 left-1/2 transform -translate-x-1/2 w-24 h-5'} bg-neutral-800 ${isRotated ? 'rounded-r-lg' : 'rounded-b-lg'} z-10`} aria-hidden="true"></div>
        
        {isGenerating ? (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-sm text-gray-600 font-medium">Generating your app...</div>
            <div className="text-xs text-gray-500 mt-2">This will take a few moments</div>
          </div>
        ) : (
          <div 
            ref={previewContainerRef}
            className={`w-full h-full overflow-y-auto overflow-x-hidden bg-white text-neutral-800 relative`}
            dangerouslySetInnerHTML={{ __html: htmlContent || '<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-blue-50 to-indigo-100"><div class="max-w-xs"><h3 class="text-lg font-semibold text-gray-800 mb-2">App Preview</h3><p class="text-sm text-gray-600">Your app preview will appear here</p></div></div>' }}
            aria-live="polite"
            style={{ 
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              WebkitOverflowScrolling: 'touch',
              transform: 'scale(1)',
              transformOrigin: 'top left',
              minHeight: '100%'
            }}
          />
        )}
        
        {/* Loading Overlay - Only show for AI interactions, not initial generation */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-700">Processing interaction...</span>
            </div>
          </div>
        )}
        
        {/* Dynamic home indicator positioning based on rotation */}
        <div className={`absolute ${isRotated ? 'bottom-1/2 right-2 transform translate-y-1/2 w-1 h-28' : 'bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1'} bg-neutral-500 rounded-full`} aria-hidden="true"></div>
      </div>
    </div>
  );
};
