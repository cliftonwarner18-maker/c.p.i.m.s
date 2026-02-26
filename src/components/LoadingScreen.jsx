import React, { useEffect, useState } from 'react';
import { Bus } from 'lucide-react';

export default function LoadingScreen({ isLoading, message = 'INITIALIZING SYSTEM...' }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 30;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'hsl(220,15%,92%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: "'Courier Prime', monospace"
    }}>
      {/* Outer panel */}
      <div style={{
        border: '2px solid',
        borderColor: 'hsl(220,15%,96%) hsl(220,15%,50%) hsl(220,15%,50%) hsl(220,15%,96%)',
        background: 'hsl(220,15%,90%)',
        padding: '24px',
        width: '500px',
        boxShadow: '0 0 0 1px hsl(220,15%,50%)'
      }}>
        {/* Title bar */}
        <div style={{
          background: 'linear-gradient(to right, hsl(220,70%,30%), hsl(220,60%,50%))',
          color: 'white',
          fontWeight: 'bold',
          padding: '3px 6px',
          fontSize: '13px',
          marginBottom: '16px',
          textAlign: 'center',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          NHCS System Loading
        </div>

        {/* Content panel */}
        <div style={{
          border: '2px solid',
          borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)',
          background: 'white',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'hsl(220,70%,35%)',
            marginBottom: '16px',
            textAlign: 'center',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            minHeight: '20px'
          }}>
            {message}
          </div>

          {/* Loading bar container */}
          <div style={{
            border: '2px solid',
            borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)',
            background: 'hsl(220,20%,88%)',
            padding: '2px',
            marginBottom: '12px',
            position: 'relative',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            {/* Blue progress bar */}
            <div style={{
              height: '30px',
              background: 'linear-gradient(to right, hsl(220,70%,40%), hsl(220,70%,50%))',
              width: `${progress}%`,
              transition: 'width 0.1s ease-out',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: '4px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              {progress > 5 && (
                <Bus style={{
                  width: '24px',
                  height: '24px',
                  color: 'white',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                  flexShrink: 0
                }} />
              )}
            </div>
          </div>

          {/* Progress percentage */}
          <div style={{
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'hsl(220,70%,35%)',
            fontFamily: "'Courier Prime', monospace"
          }}>
            {Math.round(progress)}%
          </div>
        </div>

        {/* Status messages */}
        <div style={{
          border: '2px solid',
          borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)',
          background: 'hsl(220,20%,10%)',
          color: 'hsl(140,60%,50%)',
          padding: '8px',
          fontSize: '10px',
          fontFamily: "'VT323', 'Courier New', monospace",
          lineHeight: '1.5',
          minHeight: '60px',
          overflow: 'hidden'
        }}>
          <div>&gt; System initialization in progress...</div>
          <div>&gt; Loading database connections...</div>
          <div>&gt; Initializing user interface...</div>
        </div>
      </div>
    </div>
  );
}