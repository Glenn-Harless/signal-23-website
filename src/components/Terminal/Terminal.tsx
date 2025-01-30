import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioStreamer } from './AudioStreamer';

interface TerminalProps {
  isMobile: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ isMobile }) => {
  const navigate = useNavigate();
  
  const handleExit = () => {
    navigate('/', { state: { isMobile } });
  };

  const [input, setInput] = useState('');
  const [output, setOutput] = useState([
    { type: 'system', content: 'SIGNAL-23 Terminal [Version 1.0.0]' },
    { type: 'system', content: '(c) 2025 SIGNAL-23. All rights reserved.' },
    { type: 'system', content: isMobile ? 'Tap menu items below to navigate' : 'Type "help" for available commands.' },
    { type: 'prompt', content: '>' }
  ]);
  const [selectedLink, setSelectedLink] = useState(-1);
  const [lastSocialIndex, setLastSocialIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const frequencies = [
    { 
      name: 'FREQ-23.1', 
      url: 'https://www.dropbox.com/scl/fi/cylqe5y0yf8q9bw28k72p/glitch-noise-alt-wip1.mp3?rlkey=rv0ho4psnmsg124fh1sgiavv7&dl=1'
    }
  ];
  const [currentFrequency, setCurrentFrequency] = useState<string | null>(null);

  const menuItems = [
    { command: 'help', label: 'Available Commands' },
    { command: 'social', label: 'Social Media Links' },
    { command: 'signal', label: 'About SIGNAL-23' },
    // { command: 'date', label: 'Current Time' },
    { command: 'clear', label: 'Clear Terminal' },
    { command: 'exit', label: 'Exit Terminal' }
  ];

  const socialLinks = [
    { name: 'SoundCloud', url: 'https://soundcloud.com/signal-23' },
    { name: 'YouTube', url: 'https://youtube.com/@signal-23' },
    // { name: 'Spotify', url: 'https://open.spotify.com/artist/signal-23' }
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedLink >= 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedLink(prev => (prev > 0 ? prev - 1 : socialLinks.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedLink(prev => (prev < socialLinks.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        window.open(socialLinks[selectedLink].url, '_blank');
        setSelectedLink(-1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedLink(-1);
      }
      // Prevent any other key actions while in social navigation mode
      e.stopPropagation();
      return;
    }
  };

  const commands = {
    help: () => [
      'Available commands:',
      '----------------',
      'help           - Show this help message',
      'social         - View social media links',
      'signal         - About SIGNAL-23',
      'date           - Show current date/time',
      'scan frequency - Scan random transmission frequency',
      'clear          - Clear the terminal',
      'exit           - Exit terminal'
    ],
    social: () => {
      setSelectedLink(0);
      return [
        'INTERCEPTED BROADCAST CHANNELS',
        '----------------------------',
        ...socialLinks.map((link, index) => 
          `${index === selectedLink ? '>' : ' '} ${link.name}: ${link.url}`
        )
      ];
    },
    signal: () => [
      'SIGNAL-23 DOSSIER',
      '----------------',
      'Electronic music producer based in California.',
      'Specializing in dark, atmospheric soundscapes.',
      'Currently active. Status: Producing new material.'
    ],
    date: () => {
      const now = new Date();
      return [`Current timestamp: ${now.toLocaleString()}`];
    },
    scan: (args: string[]) => {
      if (args[0]?.toLowerCase() === 'frequency') {
        if (audioStreamer.isPlaying()) {
          audioStreamer.stop();
          setCurrentFrequency(null);
          return ['Frequency scan terminated.'];
        }

        const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
        setCurrentFrequency(randomFreq.name);

        audioStreamer.playRandomSegment({
          url: randomFreq.url,
          onError: (error) => {
            setOutput(prev => [
              ...prev,
              { type: 'error', content: `Transmission error: ${error.message}` }
            ]);
          }
        });

        return [
          'INITIATING FREQUENCY SCAN',
          '------------------------',
          `Intercepting transmission on ${randomFreq.name}`,
          'Decoding signal...',
          '[Press CTRL+C or type "scan frequency" again to terminate]'
        ];
      }
      return ['Usage: scan frequency'];
    },
    clear: () => {
      // Reset to initial state
      setOutput([
        { type: 'system', content: 'SIGNAL-23 Terminal [Version 1.0.0]' },
        { type: 'system', content: '(c) 2025 SIGNAL-23. All rights reserved.' },
        { type: 'system', content: isMobile ? 'Tap menu items below to navigate' : 'Type "help" for available commands.' },
        { type: 'prompt', content: '>' }
      ]);
      setSelectedLink(-1);
      setLastSocialIndex(-1);
      return [];
    },
    exit: () => {
      handleExit();
      return ['Terminating secure connection...'];
    }
  };

  const handleCommand = (cmd: string) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    if (command === '') {
      return [''];
    }
    
    if (command === 'social') {
      setLastSocialIndex(output.length + 1);
    } else {
      setLastSocialIndex(-1);
    }
    setSelectedLink(-1);
    
    if (commands[command]) {
      return commands[command](args);
    }
    
    return [`Command not found: ${command}`];
  };

  const executeCommand = (command: string) => {
    console.log('Executing command:', command);
    const result = handleCommand(command);
    console.log('Command result:', result);
    
    if (command.toLowerCase() === 'clear') {
      commands.clear();
      return;
    }

    const newOutput = [
      ...output,
      { type: 'command', content: command },
      ...result.map(line => ({ type: 'output', content: line }))
    ];

    if (command.toLowerCase() !== 'clear') {
      newOutput.push({ type: 'prompt', content: '>' });
    }

    setOutput(newOutput);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
    setInput('');
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
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
      className={`bg-black text-green-500 p-4 font-mono h-screen ${
        isMobile ? 'text-sm flex flex-col' : 'text-base'
      }`}
      onClick={() => !isMobile && inputRef.current?.focus()}
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'c' && currentFrequency) {
          audioStreamer.stop();
          setCurrentFrequency(null);
          setOutput(prev => [
            ...prev,
            { type: 'system', content: 'Frequency scan terminated.' },
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
      <div className={`${isMobile ? 'flex-1 overflow-auto' : 'h-screen overflow-auto'} pb-4`}>
        {output.map((line, i) => (
          <div key={i} className="flex">
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
                  line.type === 'command' ? 'text-blue-400' : ''
                } ${
                  line.content.includes('http') ? 'cursor-pointer hover:text-green-300' : ''
                } ${
                  selectedLink >= 0 && line.content.includes(socialLinks[selectedLink].url) 
                    ? 'text-green-300 font-bold'
                    : ''
                }`}
                onClick={() => {
                  if (line.content.includes('http')) {
                    const link = socialLinks.find(l => line.content.includes(l.url));
                    if (link) window.open(link.url, '_blank');
                  }
                }}
              >
                {line.content}
              </span>
            )}
          </div>
        ))}
      </div>

      {isMobile && (
        <div className="mt-4 border-t border-green-500/30 pt-4 grid grid-cols-2 gap-2">
          {[
            ...menuItems,
            { command: 'scan frequency', label: 'Scan Frequency' }
          ].map((item, index) => (
            <button
              key={index}
              className="p-3 border border-green-500/30 rounded text-center hover:bg-green-500/10 active:bg-green-500/20 transition-colors"
              onClick={() => {
                console.log('Button clicked:', item.command);
                executeCommand(item.command);
              }}
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