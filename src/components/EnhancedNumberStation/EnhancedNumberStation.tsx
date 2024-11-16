import React, { useState, useCallback, useEffect } from 'react';


interface NumberStationProps {
    isMobile: boolean;
  }

export const EnhancedNumberStation: React.FC<NumberStationProps> = ({ isMobile }) => {
    const BASE_OPACITY = 0.7;
    const HIDDEN_OPACITY = 0;
    
    // Expanded state to handle more complex display
    const [sequence, setSequence] = useState([]);
    const [warning, setWarning] = useState('');
    const [glitchEffect, setGlitchEffect] = useState(false);
    
    // Nuclear warning messages that occasionally appear
    const warnings = [
      "THIS PLACE IS A MESSAGE AND PART OF A SYSTEM OF MESSAGES",
      "WHAT IS HERE IS DANGEROUS AND REPULSIVE TO US",
      "THE DANGER IS STILL PRESENT IN YOUR TIME AS IT WAS IN OURS",
      "DO NOT DISTURB",
      "SIGNAL DETECTED",
      "TRANSMISSION ACTIVE",
      "DATA CORRUPTION DETECTED"
    ];
  
    // Generate binary-like sequence with special characters
    const generateSequence = () => {
      const specialChars = ['0', '1', '█', '▓', '▒', '░'];
      return Array.from({ length: 8 }, () => ({
        value: specialChars[Math.floor(Math.random() * specialChars.length)],
        opacity: BASE_OPACITY,
        isGlitched: Math.random() > 0.8
      }));
    };
  
    // Simulate data corruption effect
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
  
    // Neural network-inspired pattern generation
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
      // Flash with glitch probability
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
  
    // Randomly display warning messages
    useEffect(() => {
      const warningInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          setWarning(warnings[Math.floor(Math.random() * warnings.length)]);
          setTimeout(() => setWarning(''), 3000);
        }
      }, 5000);
      
      return () => clearInterval(warningInterval);
    }, []);
  
    // Main sequence effect
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
              className={`text-xs text-red-500 opacity-70 tracking-wider
                ${isMobile ? 'ml-4 max-w-[160px]' : 'mt-2'}`}
              style={{
                animation: 'fadeInOut 3s ease-in-out'
              }}
            >
              {warning}
            </div>
          )}
        </div>
      </div>
    );
  };
  