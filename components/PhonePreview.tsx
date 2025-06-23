import React, { useEffect, useRef } from 'react';

interface PhonePreviewProps {
  htmlContent: string;
  onPreviewInteraction: (actionId: string, actionDescription: string) => void;
  size?: 'tiny' | 'small' | 'default' | 'mini';
  className?: string;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({ htmlContent, onPreviewInteraction, size = 'default', className }) => {
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
            
            // Add visual feedback
            if (el instanceof HTMLElement) {
              el.style.transform = 'scale(0.95)';
              el.style.transition = 'transform 0.1s ease';
              setTimeout(() => {
                el.style.transform = 'scale(1)';
              }, 100);
            }
            
            // Ensure attribute still exists
            const currentActionId = el.getAttribute('data-action-id');
            const currentActionDescription = el.getAttribute('data-action-description');
            if (currentActionId) {
              onPreviewInteraction(currentActionId, currentActionDescription || currentActionId);
            }
          };
          
          // Add both click and touchstart events for better mobile support
          el.addEventListener('click', eventListener);
          el.addEventListener('touchstart', eventListener, { passive: false });
          
          // Make the element look clickable and ensure proper styling
          if (el instanceof HTMLElement) {
            el.style.cursor = 'pointer';
            el.style.userSelect = 'none';
            
            // Add hover effects if not already present
            if (!el.classList.contains('hover:opacity-80')) {
              el.classList.add('hover:opacity-80');
            }
            if (!el.classList.contains('transition-opacity')) {
              el.classList.add('transition-opacity');
            }
          }
          
          listenersToRemove.push({ el, listener: eventListener });
        }
      });

      return () => {
        listenersToRemove.forEach(({ el, listener }) => {
          el.removeEventListener('click', listener);
          el.removeEventListener('touchstart', listener);
        });
      };
    }, 100); // Small delay to ensure content is rendered

    return () => {
      clearTimeout(timeoutId);
    };
  }, [htmlContent, onPreviewInteraction]); 

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
        
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-neutral-500 rounded-full" aria-hidden="true"></div>
      </div>
    </div>
  );
};
