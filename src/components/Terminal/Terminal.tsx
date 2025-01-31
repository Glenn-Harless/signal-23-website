import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioStreamer } from './AudioStreamer';

interface TerminalProps {
  isMobile: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ isMobile }) => {
  const navigate = useNavigate();
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
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
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  const frequencies = [
    { 
      name: 'FREQ-23.1',
      segments: [
        { start: 0, end: 15000000 },           // 0:00-2:00
        { start: 15000000, end: 30000000 },    // 2:00-4:00
        { start: 30000000, end: 45000000 },    // 4:00-6:00
        { start: 45000000, end: 60000000 },    // 6:00-8:00
        { start: 60000000, end: 75000000 },    // 8:00-10:00
        { start: 75000000, end: 90000000 },    // 10:00-12:00
        { start: 90000000, end: 105000000 },   // 12:00-14:00
        { start: 105000000, end: 120000000 },  // 14:00-16:00
        { start: 120000000, end: 135000000 },  // 16:00-18:00
        { start: 135000000, end: 150000000 },  // 18:00-20:00
        { start: 150000000, end: 165000000 },  // 20:00-22:00
        { start: 165000000, end: 180000000 },  // 22:00-24:00
        { start: 180000000, end: 195000000 },  // 24:00-26:00
        { start: 195000000, end: 210000000 },  // 26:00-28:00
        { start: 210000000, end: 225000000 },  // 28:00-30:00
        { start: 225000000, end: 240000000 },  // 30:00-32:00
        { start: 240000000, end: 255000000 },  // 32:00-34:00
        { start: 255000000, end: 270000000 },  // 34:00-36:00
        { start: 270000000, end: 285000000 },  // 36:00-38:00
        { start: 285000000, end: 300000000 },  // 38:00-40:00
        { start: 300000000, end: 315000000 },  // 40:00-42:00
        { start: 315000000, end: 330000000 },  // 42:00-44:00
        { start: 330000000, end: 345000000 },  // 44:00-46:00
        { start: 345000000, end: 360000000 },  // 46:00-48:00
        { start: 360000000, end: 375000000 },  // 48:00-50:00
        { start: 375000000, end: 390000000 },  // 50:00-52:00
        { start: 390000000, end: 405000000 },  // 52:00-54:00
        { start: 405000000, end: 420000000 },  // 54:00-56:00
        { start: 420000000, end: 435000000 },  // 56:00-58:00
        { start: 435000000, end: 450000000 },  // 58:00-60:00 (1:00:00)
        { start: 450000000, end: 465000000 },  // 1:00:00-1:02:00
        { start: 465000000, end: 480000000 },  // 1:02:00-1:04:00
        { start: 480000000, end: 495000000 },  // 1:04:00-1:06:00
        { start: 495000000, end: 510000000 },  // 1:06:00-1:08:00
        { start: 510000000, end: 525000000 },  // 1:08:00-1:10:00
        { start: 525000000, end: 540000000 },  // 1:10:00-1:12:00
        { start: 540000000, end: 555000000 },  // 1:12:00-1:14:00
        { start: 555000000, end: 570000000 },  // 1:14:00-1:16:00
        { start: 570000000, end: 585000000 },  // 1:16:00-1:18:00
        { start: 585000000, end: 600000000 },  // 1:18:00-1:20:00
        { start: 600000000, end: 615000000 },  // 1:20:00-1:22:00
        { start: 615000000, end: 630000000 },  // 1:22:00-1:24:00
        { start: 630000000, end: 645000000 },  // 1:24:00-1:26:00
        { start: 645000000, end: 660000000 },  // 1:26:00-1:28:00
        { start: 660000000, end: 675000000 },  // 1:28:00-1:30:00
        { start: 675000000, end: 690000000 },  // 1:30:00-1:32:00
        { start: 690000000, end: 705000000 },  // 1:32:00-1:34:00
        { start: 705000000, end: 720000000 },  // 1:34:00-1:36:00
        { start: 720000000, end: 735000000 },  // 1:36:00-1:38:00
        { start: 735000000, end: 750000000 },  // 1:38:00-1:40:00
        { start: 750000000, end: 765000000 },  // 1:40:00-1:42:00
        { start: 765000000, end: 780000000 },  // 1:42:00-1:44:00
        { start: 780000000, end: 795000000 },  // 1:44:00-1:46:00
        { start: 795000000, end: 810000000 },  // 1:46:00-1:48:00
        { start: 810000000, end: 825000000 },  // 1:48:00-1:50:00
        { start: 825000000, end: 840000000 },  // 1:50:00-1:52:00
        { start: 840000000, end: 855000000 },  // 1:52:00-1:54:00
        { start: 855000000, end: 870000000 },  // 1:54:00-1:56:00
        { start: 870000000, end: 885000000 },  // 1:56:00-1:58:00
        { start: 885000000, end: 900000000 },  // 1:58:00-2:00:00
        { start: 900000000, end: 915000000 },  // 2:00:00-2:02:00
        { start: 915000000, end: 930000000 },  // 2:02:00-2:04:00
        { start: 930000000, end: 945000000 },  // 2:04:00-2:06:00
        { start: 945000000, end: 960000000 },  // 2:06:00-2:08:00
        { start: 960000000, end: 975000000 },  // 2:08:00-2:10:00
        { start: 975000000, end: 990000000 },  // 2:10:00-2:12:00
        { start: 990000000, end: 1005000000 },  // 2:12:00-2:14:00
        { start: 1005000000, end: 1020000000 }, // 2:14:00-2:16:00
        { start: 1020000000, end: 1035000000 }, // 2:16:00-2:18:00
        { start: 1035000000, end: 1050000000 }, // 2:18:00-2:20:00
        { start: 1050000000, end: 1065000000 }, // 2:20:00-2:22:00
        { start: 1065000000, end: 1080000000 }, // 2:22:00-2:24:00
        { start: 1080000000, end: 1095000000 }, // 2:24:00-2:26:00
        { start: 1095000000, end: 1110000000 }, // 2:26:00-2:28:00
        { start: 1110000000, end: 1125000000 }, // 2:28:00-2:30:00
        { start: 1125000000, end: 1140000000 }, // 2:30:00-2:32:00
        { start: 1140000000, end: 1155000000 }, // 2:32:00-2:34:00
        { start: 1155000000, end: 1170000000 }, // 2:34:00-2:36:00
        { start: 1170000000, end: 1185000000 }, // 2:36:00-2:38:00
        { start: 1185000000, end: 1200000000 }, // 2:38:00-2:40:00
        { start: 1200000000, end: 1215000000 }, // 2:40:00-2:42:00
        { start: 1215000000, end: 1230000000 }, // 2:42:00-2:44:00
        { start: 1230000000, end: 1245000000 }, // 2:44:00-2:46:00
        { start: 1245000000, end: 1260000000 }, // 2:46:00-2:48:00
        { start: 1260000000, end: 1275000000 }, // 2:48:00-2:50:00
        { start: 1275000000, end: 1290000000 }, // 2:50:00-2:52:00
        { start: 1290000000, end: 1305000000 }, // 2:52:00-2:54:00
        { start: 1305000000, end: 1320000000 }, // 2:54:00-2:56:00
        { start: 1320000000, end: 1335000000 }, // 2:56:00-2:58:00
        { start: 1335000000, end: 1350000000 }, // 2:58:00-3:00:00
        { start: 1350000000, end: 1365000000 }, // 3:00:00-3:02:00
        { start: 1365000000, end: 1380000000 }, // 3:02:00-3:04:00
        { start: 1380000000, end: 1395000000 }, // 3:04:00-3:06:00
        { start: 1395000000, end: 1410000000 }, // 3:06:00-3:08:00
        { start: 1410000000, end: 1425000000 }, // 3:08:00-3:10:00
        { start: 1425000000, end: 1440000000 }, // 3:10:00-3:12:00
        { start: 1440000000, end: 1455000000 }, // 3:12:00-3:14:00
        { start: 1455000000, end: 1470000000 }, // 3:14:00-3:16:00
        { start: 1470000000, end: 1485000000 }, // 3:16:00-3:18:00
        { start: 1485000000, end: 1500000000 }, // 3:18:00-3:20:00
        { start: 1500000000, end: 1515000000 }, // 3:20:00-3:22:00
        { start: 1515000000, end: 1530000000 }, // 3:22:00-3:24:00
        { start: 1530000000, end: 1545000000 }, // 3:24:00-3:26:00
        { start: 1545000000, end: 1560000000 }, // 3:26:00-3:28:00
        { start: 1560000000, end: 1575000000 }, // 3:28:00-3:30:00
        { start: 1575000000, end: 1590000000 }, // 3:30:00-3:32:00
        { start: 1590000000, end: 1605000000 }, // 3:32:00-3:34:00
        { start: 1605000000, end: 1620000000 }, // 3:34:00-3:36:00
        { start: 1620000000, end: 1635000000 }, // 3:36:00-3:38:00
        { start: 1635000000, end: 1650000000 }, // 3:38:00-3:40:00
        { start: 1650000000, end: 1665000000 }, // 3:40:00-3:42:00
        { start: 1665000000, end: 1680000000 }, // 3:42:00-3:44:00
        { start: 1680000000, end: 1695000000 }, // 3:44:00-3:46:00
        { start: 1695000000, end: 1710000000 }, // 3:46:00-3:48:00
      ],
      url: 'https://dl.dropboxusercontent.com/scl/fi/cylqe5y0yf8q9bw28k72p/glitch-noise-alt-wip1.mp3?rlkey=rv0ho4psnmsg124fh1sgiavv7&raw=1&dl=1'
    }
  ];

  const [currentFrequency, setCurrentFrequency] = useState<string | null>(null);

  const menuItems = [
    { command: 'help', label: 'Available Commands' },
    { command: 'social', label: 'Social Media Links' },
    { command: 'signal', label: 'About SIGNAL-23' },
    { command: 'scan frequency', label: 'Scan Frequency' },
    { command: 'clear', label: 'Clear Terminal' },
    { command: 'exit', label: 'Exit Terminal' }
  ];

  const socialLinks = [
    { name: 'SoundCloud', url: 'https://soundcloud.com/signal-23' },
    { name: 'YouTube', url: 'https://youtube.com/@signal-23' },
  ];

  useEffect(() => {
    const handleResize = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(height);
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
              { type: 'error', content: `Transmission error: ${error.message}` },
              { type: 'prompt', content: '>' }
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
      className={`bg-black text-green-500 font-mono flex flex-col`}
      style={{
        height: isMobile ? `${viewportHeight}px` : '100vh',
        maxHeight: isMobile ? `${viewportHeight}px` : '100vh',
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : '1rem',
      }}
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
      <div className={`flex-1 overflow-auto p-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
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
                  line.type === 'command' ? 'text-blue-400' : 
                  line.type === 'error' ? 'text-red-500' :
                  'text-green-500'
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
        <div className="border-t border-green-500/30 bg-black p-4 grid grid-cols-2 gap-2">
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