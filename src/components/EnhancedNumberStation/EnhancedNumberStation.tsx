import React, { useState, useCallback, useEffect } from 'react';

interface NumberStationProps {
    isMobile: boolean;
    onGlitchChange: (isGlitching: boolean) => void;  // Added this prop
}

export const EnhancedNumberStation: React.FC<NumberStationProps> = ({ 
    isMobile, 
    onGlitchChange 
}) => {
    const BASE_OPACITY = 0.7;
    const HIDDEN_OPACITY = 0;
    
    const [sequence, setSequence] = useState([]);
    const [warning, setWarning] = useState('');
    const [glitchEffect, setGlitchEffect] = useState(false);
    
    const warnings = [
      "THIS PLACE IS A MESSAGE AND PART OF A SYSTEM OF MESSAGES",
      "WHAT IS HERE IS DANGEROUS AND REPULSIVE TO US",
      "THE DANGER IS STILL PRESENT IN YOUR TIME AS IT WAS IN OURS",
      "DO NOT DISTURB",
      "SIGNAL DETECTED",
      "TRANSMISSION ACTIVE",
      "DATA CORRUPTION DETECTED"
    ];
  
    // ... other functions remain the same ...
    const generateSequence = () => {
      const specialChars = ['0', '1', '█', '▓', '▒', '░'];
      return Array.from({ length: 8 }, () => ({
        value: specialChars[Math.floor(Math.random() * specialChars.length)],
        opacity: BASE_OPACITY,
        isGlitched: Math.random() > 0.8
      }));
    };
  
    const createGlitchEffect = useCallback((index) => {
      setSequence(prev => 
        prev.map((num, i) => 
          i === index ? {
            ...num,
            value: ['█', '▓', '▒', '░'][Math.floor(Math.random() * 4)],
            opacity: Math.random() * BASE_OPACITY + 0.3
          } : num
        )
      );
    }, []);
  
    const generatePattern = useCallback(async () => {
      const patternLength = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < patternLength; i++) {
        const indices = Array.from(
          { length: Math.floor(Math.random() * 3) + 1 },
          () => Math.floor(Math.random() * sequence.length)
        );
        await flashNumbers(indices, 200);
      }
    }, [sequence.length]);
  
    const flashNumbers = async (indices, duration) => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) setGlitchEffect(true);
      
      indices.forEach(index => {
        setSequence(prev => 
          prev.map((num, i) => 
            i === index ? { ...num, opacity: BASE_OPACITY } : num
          )
        );
        if (shouldGlitch) createGlitchEffect(index);
      });
      
      await new Promise(r => setTimeout(r, duration));
      
      indices.forEach(index => {
        setSequence(prev => 
          prev.map((num, i) => 
            i === index ? { ...num, opacity: HIDDEN_OPACITY } : num
          )
        );
      });
      
      setGlitchEffect(false);
      await new Promise(r => setTimeout(r, duration * 0.5));
    };

    // Single warning interval effect
    useEffect(() => {
      const warningInterval = setInterval(() => {
        if (Math.random() > 0.1) {
          const newWarning = warnings[Math.floor(Math.random() * warnings.length)];
          console.log('Showing warning:', newWarning);
          setWarning(newWarning);
          onGlitchChange(true);  // Notify parent

          setTimeout(() => {
            setWarning('');
            onGlitchChange(false);  // Notify parent
          }, 2000);
        }
      }, 3000);
      
      return () => clearInterval(warningInterval);
    }, [onGlitchChange]);
  
    useEffect(() => {
      const runSequence = async () => {
        setSequence(generateSequence());
        await generatePattern();
        setTimeout(runSequence, Math.random() * 1000 + 2000);
      };
      
      runSequence();
    }, [generatePattern]);
  
    return (
      <div className="fixed top-0 left-0 w-full h-16 px-6 font-mono pointer-events-none">
        <div className={`h-full ${isMobile ? 'flex justify-between items-center' : 'flex flex-col justify-center'}`}>
          <div 
            className={`flex space-x-2 ${glitchEffect ? 'animate-pulse' : ''}`}
            style={{ 
              textShadow: glitchEffect ? '2px 2px 8px rgba(255,255,255,0.5)' : 'none',
              transform: glitchEffect ? 'translateX(-1px)' : 'none',
              transition: 'transform 0.1s'
            }}
          >
            {sequence.map((num, index) => (
              <span
                key={index}
                className="transition-all duration-100"
                style={{
                  opacity: num.opacity,
                  color: 'white',
                  transform: num.isGlitched ? 'translateY(1px)' : 'none',
                  textShadow: num.isGlitched ? '1px 1px 4px rgba(255,255,255,0.3)' : 'none'
                }}
              >
                {num.value}
              </span>
            ))}
          </div>
          {warning && (
            <div 
              className={`
                text-xs text-red-500 opacity-70 tracking-wider animate-fadeInOut
                ${isMobile ? 'ml-4 max-w-[160px]' : 'mt-2'}
              `}
            >
              {warning}
            </div>
          )}
        </div>
      </div>
    );
};