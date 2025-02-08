import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioStreamer } from './AudioStreamer';

interface TerminalProps {
  isMobile: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ isMobile }) => {
  const navigate = useNavigate();
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const outputRef = useRef<HTMLDivElement>(null);
  
  const handleExit = () => {
    navigate('/', { state: { isMobile } });
  };

  const [input, setInput] = useState('');
  const initialMessages = [
    { content: '█ █ █ █ █ █ █ █ █ █ █ █ █ █ ', type: 'separator' },
    { content: 'ENCRYPTION ESTABLISHED, CONNECTION SECURE', type: 'system' },
    { content: '...........................', type: 'separator' },
    { content: 'PROPRIETARY BROADCAST ACTIVITY NETWORKED INFORMATION SYSTEM TERMINAL', type: 'system' },
    { content: '---------------------------', type: 'separator' },
    { content: 'FOR USE ON DESIGNATED INFORMATION SYSTEMS ONLY', type: 'system' },
    { content: 'AUTHORIZED USE ONLY', type: 'system' },
    { content: 'UNAUTHORIZED RECORDING OR DISTRIBUTION OF MATERIAL IS UNLAWFUL', type: 'system' },
    { content: '---------------------------', type: 'separator' },
    { content: 'OPERATOR CREDENTIALS NOT FOUND', type: 'warning' },
    { content: 'SOME PERMISSIONS RESTRICTED', type: 'warning' },
    { content: '............................', type: 'separator' }
  ];

  const [output, setOutput] = useState<Array<{ type: string; content: string }>>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    const typeMessage = async (message: { content: string, type: string }, index: number) => {
      // Add empty message first
      setOutput(prev => [...prev, { type: message.type, content: '' }]);
      
      if (message.type === 'warning') {
        // For warning messages, add glitch effect
        const glitchDelay = 50; // Faster typing for warnings
        const chars = message.content.split('');
        
        for (let i = 0; i <= message.content.length; i++) {
          await new Promise(resolve => setTimeout(resolve, glitchDelay));
          
          // Occasionally add glitch characters that get replaced
          const shouldGlitch = Math.random() < 0.3; // 30% chance of glitch
          
          setOutput(prev => {
            const newOutput = [...prev];
            if (newOutput[index]) {
              let displayContent = message.content.slice(0, i);
              if (shouldGlitch && i < message.content.length) {
                displayContent += '█▓▒░';
              }
              newOutput[index] = { type: message.type, content: displayContent };
            }
            return newOutput;
          });
        }
      } else if (message.type === 'separator') {
        // Slower typing for separators
        for (let i = 0; i <= message.content.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          setOutput(prev => {
            const newOutput = [...prev];
            if (newOutput[index]) {
              newOutput[index] = { type: message.type, content: message.content.slice(0, i) };
            }
            return newOutput;
          });
        }
      } else {
        // Normal typing for system messages
        for (let i = 0; i <= message.content.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 10));
          setOutput(prev => {
            const newOutput = [...prev];
            if (newOutput[index]) {
              newOutput[index] = { type: message.type, content: message.content.slice(0, i) };
            }
            return newOutput;
          });
        }
      }

      // Longer pause after warnings and separators
      await new Promise(resolve => 
        setTimeout(resolve, message.type === 'warning' ? 400 : 
                            message.type === 'separator' ? 300 : 200)
      );
    };

    const initializeTerminal = async () => {
      for (let i = 0; i < initialMessages.length; i++) {
        await typeMessage(initialMessages[i], i);
      }
      // Add prompt after all messages are typed
      setOutput(prev => [...prev, { type: 'prompt', content: '>' }]);
      setIsInitialized(true);
      
      // Auto-execute commands after initialization
      setTimeout(() => {
        const result = handleCommand('commands');
        setOutput(prev => [
          ...prev,
          { type: 'command', content: 'commands' },
          ...result.map(line => ({ type: 'output', content: line })),
          { type: 'prompt', content: '>' }
        ]);
      }, 500);
    };

    initializeTerminal();
  }, [isInitialized]);

  const [selectedLink, setSelectedLink] = useState(-1);
  const [lastSocialIndex, setLastSocialIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAwaitingLogin, setIsAwaitingLogin] = useState(false);
  const [loginStep, setLoginStep] = useState<'operator' | 'passcode' | null>(null);

  const frequencies = [
    { 
      name: 'FREQ-23.1',
      playlist: 'https://www.dropbox.com/scl/fo/28pt5wp84wm4lzp94hh3m/h?rlkey=ovmnqgdantgtxjykz4e8lh1l3'
    }
  ];

  const [currentFrequency, setCurrentFrequency] = useState<string | null>(null);

  const menuItems = [
    { command: 'commands', label: 'View Commands' },
    { command: 'audiovisual', label: 'Audio Visual' },
    { command: 'scan', label: 'Scan Frequencies' },
    { command: 'login', label: 'Operator Login' },
    { command: 'clear', label: 'Clear Terminal' },
    { command: 'exit', label: 'Exit Terminal' }
  ];

  const mediaLinks = [
    { name: 'SPOTIFY', url: 'https://open.spotify.com/artist/yourid' },
    { name: 'YOUTUBE', url: 'https://youtube.com/@signal-23' },
    { name: 'SOUNDCLOUD', url: 'https://soundcloud.com/signal-23' },
    { name: 'BANDCAMP', url: 'https://yourid.bandcamp.com' },
    { name: 'INSTAGRAM', url: 'https://instagram.com/yourid' },
  ];

  useEffect(() => {
    const handleResize = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(height);
      
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);
    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedLink >= 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedLink(prev => (prev > 0 ? prev - 1 : mediaLinks.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedLink(prev => (prev < mediaLinks.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        window.open(mediaLinks[selectedLink].url, '_blank');
        setSelectedLink(-1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedLink(-1);
      }
      e.stopPropagation();
      return;
    }
  };

  const commands = {
    commands: () => [
      'TERMINAL COMMANDS DIRECTORY',
      '————————————————————————————',
      'COMMANDS      - Display this directory',
      'AUDIOVISUAL   - Access media archives',
      'SCAN          - Scan frequencies',
      'LOGIN         - Access restricted content',
      'CLEAR         - Clear terminal buffer',
      'EXIT          - Terminate connection',
      '————————————————————————————'
    ],
    
    audiovisual: () => {
      setSelectedLink(0);
      setLastSocialIndex(output.length + 1);
      return [
        'SEARCHING AVAILABLE ARCHIVES...',
        '————————————————————————————',
        ...mediaLinks.map((link, index) => 
          `${index === selectedLink ? '>' : ' '} ${link.name}`
        )
      ];
    },

    scan: () => {
      if (audioStreamer.getIsPlaying()) {
        audioStreamer.stop();
        setCurrentFrequency(null);
        return ['SCAN TERMINATED.'];
      }

      const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
      setCurrentFrequency(randomFreq.name);

      audioStreamer.playRandomSegment({
        onError: (error) => {
          setOutput(prev => [
            ...prev,
            { type: 'error', content: `TRANSMISSION ERROR: ${error.message}` },
            { type: 'prompt', content: '>' }
          ]);
        }
      });

      return [
        'SCAN>STATIONS>ALL>FREQ>ALL',
        'DURATION: 60 SEC',
        `TIMESTAMP: ${new Date().toLocaleString()}`,
        'SCANNING...',
        'DECODING SIGNAL...',
        '[CTRL+C TO TERMINATE]'
      ];
    },

    login: () => {
      setIsAwaitingLogin(true);
      setLoginStep('operator');
      return [
        'LOGIN SEQUENCE INITIATED',
        'OPERATOR:'
      ];
    },

    clear: () => {
      setOutput([
        { type: 'system', content: 'ENCRYPTION ESTABLISHED, CONNECTION SECURE' },
        { type: 'system', content: 'PROPRIETARY BROADCAST ACTIVITY NETWORKED INFORMATION SYSTEM TERMINAL' },
        { type: 'system', content: 'FOR USE ON DESIGNATED INFORMATION SYSTEMS ONLY' },
        { type: 'prompt', content: '>' }
      ]);
      setSelectedLink(-1);
      setLastSocialIndex(-1);
      setIsAwaitingLogin(false);
      setLoginStep(null);
      return [];
    },

    exit: () => {
      handleExit();
      return ['TERMINATING SECURE CONNECTION...'];
    }
  };

  const handleCommand = (cmd: string) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    
    if (command === '') {
      return [''];
    }

    if (isAwaitingLogin) {
      if (loginStep === 'operator') {
        setLoginStep('passcode');
        return ['PASSCODE:'];
      } else if (loginStep === 'passcode') {
        setIsAwaitingLogin(false);
        setLoginStep(null);
        return ['INVALID CREDENTIALS', 'ACCESS DENIED'];
      }
    }
    
    if (command === 'audiovisual') {
      setLastSocialIndex(output.length + 1);
    } else {
      setLastSocialIndex(-1);
    }
    setSelectedLink(-1);
    
    if (commands[command]) {
      return commands[command]();
    }
    
    return [`COMMAND NOT RECOGNIZED: ${command.toUpperCase()}`];
  };

  const executeCommand = (command: string) => {
    const result = handleCommand(command);
    
    if (command.toLowerCase() === 'clear') {
      commands.clear();
      return;
    }

    const newOutput = [
      ...output,
      { type: 'command', content: command },
      ...result.map(line => ({ type: 'output', content: line })),
      { type: 'prompt', content: '>' }
    ];

    setOutput(newOutput);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
    setInput('');
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [output]);

  useEffect(() => {
    return () => {
      audioStreamer.stop();
    };
  }, []);

  return (
    <div 
      className="bg-black text-green-500 font-mono flex flex-col"
      style={{
        height: isMobile ? `${viewportHeight}px` : '100vh',
        maxHeight: isMobile ? `${viewportHeight}px` : '100vh',
      }}
      onClick={() => !isMobile && inputRef.current?.focus()}
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'c' && currentFrequency) {
          audioStreamer.stop();
          setCurrentFrequency(null);
          setOutput(prev => [
            ...prev,
            { type: 'system', content: 'SCAN TERMINATED.' },
            { type: 'prompt', content: '>' }
          ]);
          return;
        }
        if (!isMobile) {
          handleKeyDown(e);
        }
      }}
      ref={terminalRef}
      tabIndex={0}
    >
      <div 
        ref={outputRef}
        className={`flex-1 overflow-y-auto p-4 flex flex-col ${isMobile ? 'text-sm' : 'text-base'}`}
        style={{
          minHeight: 0,
        }}
      >
        <div className="flex-1">
          {output.map((line, i) => (
            <div key={i} className="flex whitespace-pre-wrap break-words">
              {line.type === 'prompt' ? (
                <>
                  {!isMobile && <span className="text-green-500 mr-2">{line.content}</span>}
                  {i === output.length - 1 && !isMobile && (
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => {
                          if (selectedLink >= 0) return;
                          setInput(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !selectedLink >= 0) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                        className="bg-transparent text-green-500 focus:outline-none w-full"
                        autoFocus
                        disabled={selectedLink >= 0}
                      />
                      {selectedLink >= 0 && (
                        <div className="absolute top-0 left-0 w-full text-yellow-500">
                          Press ESC to return to command mode
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <span 
                  className={`${
                    line.type === 'command' ? 'text-blue-400' : 
                    line.type === 'error' ? 'text-red-500' :
                    line.type === 'warning' ? 'text-yellow-500 font-bold' :
                    line.type === 'separator' ? 'text-green-700' :
                    'text-green-500'
                  } ${
                    i > lastSocialIndex && i <= lastSocialIndex + mediaLinks.length ? 'cursor-pointer hover:text-green-300' : ''
                  } ${
                    i === lastSocialIndex + selectedLink + 1 && selectedLink >= 0 ? 'text-green-300 font-bold' : ''
                  }`}
                  onClick={() => {
                    if (i > lastSocialIndex && i <= lastSocialIndex + mediaLinks.length) {
                      const linkIndex = i - lastSocialIndex - 1;
                      if (mediaLinks[linkIndex]) {
                        window.open(mediaLinks[linkIndex].url, '_blank');
                      }
                    }
                  }}
                >
                  {line.content}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isMobile && (
        <div 
          className="border-t border-green-500/30 bg-black p-4 grid grid-cols-2 gap-2"
          style={{
            paddingBottom: `calc(env(safe-area-inset-bottom) + 1rem)`
          }}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="p-3 border border-green-500/30 rounded text-center hover:bg-green-500/10 active:bg-green-500/20 transition-colors"
              onClick={() => executeCommand(item.command)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Terminal;