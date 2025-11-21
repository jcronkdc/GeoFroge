// Collaborative Cursor Overlay Component
// Shows other users' cursors on geological maps in real-time
// ANT TEST: Can multiple geologists point at the same feature simultaneously?

import React, { useEffect, useState, useRef } from 'react';
import { cursorControlService, CursorPosition, CursorClick } from '../../lib/services/CursorControlService';
import { useAuth } from '../../hooks/useAuth';

interface CollaborativeCursorOverlayProps {
  sessionId: string;
  containerRef: React.RefObject<HTMLElement>;
  enabled?: boolean;
  showClickAnnotations?: boolean;
}

export const CollaborativeCursorOverlay: React.FC<CollaborativeCursorOverlayProps> = ({
  sessionId,
  containerRef,
  enabled = true,
  showClickAnnotations = true
}) => {
  const { session } = useAuth();
  const [remoteCursors, setRemoteCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [clickAnnotations, setClickAnnotations] = useState<CursorClick[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef<number>(0);
  const throttleMs = 50; // Update every 50ms (20fps for smooth but efficient)

  // Subscribe to remote cursors
  useEffect(() => {
    if (!enabled || !cursorControlService.isConfigured() || !session?.user?.id) {
      return;
    }

    let unsubscribeMovements: (() => void) | null = null;
    let unsubscribeClicks: (() => void) | null = null;

    const setup = async () => {
      try {
        // Subscribe to cursor movements
        unsubscribeMovements = await cursorControlService.subscribeToCursorMovements(
          sessionId,
          (position) => {
            // Don't show our own cursor
            if (position.userId === session.user.id) return;

            setRemoteCursors((prev) => {
              const updated = new Map(prev);
              
              if (position.isActive) {
                updated.set(position.userId, position);
                
                // Remove inactive cursors after 3 seconds
                setTimeout(() => {
                  setRemoteCursors((current) => {
                    const newMap = new Map(current);
                    const cursor = newMap.get(position.userId);
                    if (cursor && Date.now() - cursor.timestamp > 3000) {
                      newMap.delete(position.userId);
                    }
                    return newMap;
                  });
                }, 3000);
              } else {
                updated.delete(position.userId);
              }
              
              return updated;
            });
          }
        );

        // Subscribe to cursor clicks (for annotations)
        if (showClickAnnotations) {
          unsubscribeClicks = await cursorControlService.subscribeToCursorClicks(
            sessionId,
            (click) => {
              if (click.userId === session.user.id) return;

              setClickAnnotations((prev) => [...prev, click]);

              // Remove annotation after 5 seconds
              setTimeout(() => {
                setClickAnnotations((current) =>
                  current.filter((c) => c.timestamp !== click.timestamp)
                );
              }, 5000);
            }
          );
        }

        console.log('✅ Cursor control active for session:', sessionId);
      } catch (err) {
        console.error('Failed to setup cursor control:', err);
      }
    };

    setup();

    // Cleanup
    return () => {
      if (unsubscribeMovements) unsubscribeMovements();
      if (unsubscribeClicks) unsubscribeClicks();
      
      // Send "inactive" cursor on unmount
      if (session?.user) {
        cursorControlService.leaveCursorSession(
          sessionId,
          session.user.id,
          session.user.email || 'Anonymous'
        ).catch(console.error);
      }
    };
  }, [sessionId, enabled, showClickAnnotations, session]);

  // Track local cursor and publish to remote users
  useEffect(() => {
    if (!enabled || !cursorControlService.isConfigured() || !session?.user?.id || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < throttleMs) return;
      lastUpdateRef.current = now;

      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Only publish if cursor is within bounds
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        cursorControlService.publishCursorPosition(
          sessionId,
          session.user.id,
          session.user.email || 'Anonymous',
          x,
          y,
          true
        ).catch(console.error);
      }
    };

    const handleMouseLeave = () => {
      cursorControlService.publishCursorPosition(
        sessionId,
        session.user.id,
        session.user.email || 'Anonymous',
        0,
        0,
        false
      ).catch(console.error);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Double-click to add annotation (example - could be enhanced with UI)
      if (e.detail === 2 && x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        const annotation = prompt('Add note (optional):');
        cursorControlService.publishCursorClick(
          sessionId,
          session.user.id,
          session.user.email || 'Anonymous',
          x,
          y,
          annotation || undefined
        ).catch(console.error);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('click', handleClick);
    };
  }, [sessionId, enabled, session, containerRef]);

  if (!enabled || !cursorControlService.isConfigured()) {
    return null;
  }

  return (
    <div 
      ref={overlayRef}
      className="collaborative-cursor-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {/* Remote cursors */}
      {Array.from(remoteCursors.values()).map((cursor) => (
        <RemoteCursor key={cursor.userId} cursor={cursor} />
      ))}

      {/* Click annotations */}
      {showClickAnnotations && clickAnnotations.map((click, idx) => (
        <ClickAnnotation key={`${click.userId}-${click.timestamp}`} click={click} />
      ))}
    </div>
  );
};

// Individual remote cursor
const RemoteCursor: React.FC<{ cursor: CursorPosition }> = ({ cursor }) => {
  return (
    <div
      className="remote-cursor"
      style={{
        position: 'absolute',
        left: `${cursor.x * 100}%`,
        top: `${cursor.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.1s linear, top 0.1s linear',
        pointerEvents: 'none',
        zIndex: 10000,
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        }}
      >
        <path
          d="M5 3L19 12L12 13L9 19L5 3Z"
          fill={cursor.userColor}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* User name label */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '12px',
          backgroundColor: cursor.userColor,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {cursor.userName}
      </div>
    </div>
  );
};

// Click annotation marker
const ClickAnnotation: React.FC<{ click: CursorClick }> = ({ click }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out after 4 seconds
    const timer = setTimeout(() => setIsVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="click-annotation"
      style={{
        position: 'absolute',
        left: `${click.x * 100}%`,
        top: `${click.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        animation: 'pulse 0.5s ease-out, fadeOut 1s ease-out 4s forwards',
      }}
    >
      {/* Pulse ring */}
      <div
        style={{
          position: 'absolute',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid #4ECDC4',
          animation: 'expandRing 0.6s ease-out',
        }}
      />

      {/* Annotation text */}
      {click.annotation && (
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '0',
            transform: 'translateX(-50%)',
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            border: '1px solid #4ECDC4',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '2px' }}>
            {click.userName}
          </div>
          {click.annotation}
        </div>
      )}

      <style>{`
        @keyframes expandRing {
          from {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 1;
          }
          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
          }
        }

        @keyframes fadeOut {
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CollaborativeCursorOverlay;

