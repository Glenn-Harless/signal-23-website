import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioStreamer } from './AudioStreamer';
import { TerminalMediaLink, TerminalMenuItem, TerminalMessage } from './terminalTypes';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { useAudio } from '../../hooks/useAudio';

const INITIAL_MESSAGES: TerminalMessage[] = [
  { type: 'separator', content: '█ █ █ █ █ █ █ █ █ █ █ █ █ █ ' },
  { type: 'system', content: 'ENCRYPTION ESTABLISHED, CONNECTION SECURE' },
  { type: 'separator', content: '...........................' },
  { type: 'system', content: 'PROPRIETARY BROADCAST ACTIVITY NETWORKED INFORMATION SYSTEM TERMINAL' },
  { type: 'separator', content: '---------------------------' },
  { type: 'system', content: 'FOR USE ON DESIGNATED INFORMATION SYSTEMS ONLY' },
  { type: 'system', content: 'AUTHORIZED USE ONLY' },
  { type: 'system', content: 'UNAUTHORIZED RECORDING OR DISTRIBUTION OF MATERIAL IS UNLAWFUL' },
  { type: 'separator', content: '---------------------------' },
  { type: 'warning', content: 'PHYSICAL ACCESS KEY NOT DETECTED' },
  { type: 'warning', content: 'OPERATOR CREDENTIALS NOT FOUND' },
  { type: 'warning', content: 'SOME PERMISSIONS RESTRICTED' },
  { type: 'separator', content: '............................' },
];

const MEDIA_LINKS: TerminalMediaLink[] = [
  { name: 'YOUTUBE', url: 'https://youtube.com/@signal-23-music' },
  { name: 'SPOTIFY', url: 'https://open.spotify.com/artist/3ZKXfUCXvaZbEdCRx9sWD6' },
  { name: 'SOUNDCLOUD', url: 'https://soundcloud.com/signal-23' },
  { name: 'BANDCAMP', url: 'https://signal-23.bandcamp.com/' },
  { name: 'INSTAGRAM', url: 'https://www.instagram.com/signal23music/' },
  { name: 'HYPERFOLLOW // RESET', url: 'https://distrokid.com/hyperfollow/signal23/reset' },
];

const MENU_ITEMS: TerminalMenuItem[] = [
  { command: 'commands', label: 'View Commands' },
  { command: 'archives', label: 'Access Archives' },
  { command: 'data', label: 'DATA' },
  { command: 'scan', label: 'Scan Frequencies' },
  { command: 'broadcast', label: 'Operator Broadcast' },
  { command: 'clear', label: 'Clear Terminal' },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const INITIAL_PROMPT: TerminalMessage = { type: 'prompt', content: '>' };

interface UseTerminalResult {
  input: string;
  setInput: (value: string) => void;
  output: TerminalMessage[];
  viewportHeight: number;
  menuItems: TerminalMenuItem[];
  handleSubmit: (command?: string) => void;
  handleLinkClick: (content: string) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  terminalRef: React.RefObject<HTMLDivElement>;
  outputRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  visualizerData: number[];
  isScanning: boolean;
  isFlashing: boolean;
}

interface UseTerminalOptions {
  isMobile: boolean;
}

export function useTerminal({ isMobile }: UseTerminalOptions): UseTerminalResult {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<TerminalMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(64).fill(0));
  const [isFlashing, setIsFlashing] = useState(false);
  const viewportHeight = useViewportHeight();
  const [currentFrequency, setCurrentFrequency] = useState<string | null>(null);
  const { audioElement, isPlaying: isHomePlaying } = useAudio();

  const terminalRef = useRef<HTMLDivElement>(null);
  const outputContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  const appendMessage = useCallback((message: TerminalMessage) => {
    setOutput((prev) => [...prev, message]);
  }, []);

  const appendPrompt = useCallback(() => {
    setOutput((prev) => {
      if (prev[prev.length - 1]?.type === 'prompt') {
        return prev;
      }
      return [...prev, INITIAL_PROMPT];
    });
  }, []);

  const appendCommandMessage = useCallback((command: string) => {
    setOutput((prev) => {
      const next = [...prev];
      if (next[next.length - 1]?.type === 'prompt') {
        next.pop();
      }
      next.push({ type: 'command', content: command });
      return next;
    });
  }, []);

  const appendPlaceholder = useCallback(
    (message: TerminalMessage) =>
      new Promise<number>((resolve) => {
        setOutput((prev) => {
          const index = prev.length;
          resolve(index);
          return [...prev, message];
        });
      }),
    [],
  );

  const updateMessageAt = useCallback((index: number, updater: (message: TerminalMessage) => TerminalMessage) => {
    setOutput((prev) => {
      if (!prev[index]) {
        return prev;
      }
      const next = [...prev];
      next[index] = updater(prev[index]);
      return next;
    });
  }, []);

  const typeMessage = useCallback(
    async (message: TerminalMessage) => {
      if (message.type === 'warning' || message.type === 'separator' || message.type === 'typing') {
        const index = await appendPlaceholder({ type: message.type, content: '' });
        const delay = message.type === 'warning' ? 50 : message.type === 'separator' ? 15 : 5;

        for (let i = 0; i <= message.content.length; i += 1) {
          const charDelay = message.type === 'warning' ? Math.random() * delay * 2 : delay;
          await wait(charDelay);

          const shouldGlitch = (message.type === 'warning' || message.type === 'typing') && Math.random() < 0.1 && i < message.content.length;
          const partial = message.content.slice(0, i);
          const glitchChars = ['█', '▓', '▒', '░', '$', '&', '#', '@'];
          const randomGlitch = glitchChars[Math.floor(Math.random() * glitchChars.length)];
          const content = shouldGlitch ? `${partial}${randomGlitch}` : partial;

          updateMessageAt(index, (existing) => ({ ...existing, content }));
        }

        const pause = message.type === 'warning' ? 400 : message.type === 'separator' ? 300 : 100;
        await wait(pause);
        return;
      }

      appendMessage(message);
    },
    [appendMessage, appendPlaceholder, updateMessageAt],
  );

  const resetTerminal = useCallback(() => {
    setOutput([
      { type: 'system', content: 'ENCRYPTION ESTABLISHED, CONNECTION SECURE' },
      { type: 'system', content: 'PROPRIETARY BROADCAST ACTIVITY NETWORKED INFORMATION SYSTEM TERMINAL' },
      { type: 'system', content: 'FOR USE ON DESIGNATED INFORMATION SYSTEMS ONLY' },
      { type: 'separator', content: '---------------------------' },
      INITIAL_PROMPT,
    ]);
    setCurrentFrequency(null);
    setInput('');
  }, []);

  const exitTerminal = useCallback(() => {
    navigate('/', { state: { isMobile } });
  }, [isMobile, navigate]);

  const stopScan = useCallback(() => {
    audioStreamer.stop();
    setCurrentFrequency(null);
  }, []);

  const executeArchive = useCallback(async (): Promise<TerminalMessage[]> => {
    const typingMessages: TerminalMessage[] = [
      { type: 'typing', content: 'SEARCHING ARCHIVES...' },
      { type: 'typing', content: 'VERIFYING PERMISSIONS...' },
      { type: 'typing', content: 'RETRIEVING AVAILABLE ARCHIVES...' },
    ];

    for (const message of typingMessages) {
      // eslint-disable-next-line no-await-in-loop
      await typeMessage(message);
    }

    const linkMessages: TerminalMessage[] = [
      { type: 'separator', content: '————————————————————————————' },
      ...MEDIA_LINKS.map<TerminalMessage>((link) => ({ type: 'link', content: ` ${link.name}` })),
      { type: 'separator', content: '————————————————————————————' },
    ];

    return linkMessages;
  }, [typeMessage]);

  const executeScan = useCallback(async (): Promise<TerminalMessage[]> => {
    if (audioStreamer.getIsPlaying()) {
      stopScan();
      return [{ type: 'system', content: 'SCAN TERMINATED.' }];
    }

    try {
      const frequencies = [
        {
          name: 'FREQ-23.1',
          playlist: 'https://www.dropbox.com/scl/fo/28pt5wp84wm4lzp94hh3m/h?rlkey=ovmnqgdantgtxjykz4e8lh1l3',
        },
      ];

      const randomFrequency = frequencies[Math.floor(Math.random() * frequencies.length)];
      setCurrentFrequency(randomFrequency.name);

      await audioStreamer.playRandomSegment({
        reuseElement: audioElement ?? undefined,
        onError: (error) => {
          appendMessage({ type: 'error', content: `TRANSMISSION ERROR: ${error.message}` });
          appendPrompt();
        },
      });

      const now = new Date();
      const hours = now.getUTCHours().toString().padStart(2, '0');
      const minutes = now.getUTCMinutes().toString().padStart(2, '0');
      const seconds = now.getUTCSeconds().toString().padStart(2, '0');
      const timeString = `${hours}${minutes}:${seconds}Z`;

      return [
        { type: 'output', content: 'SCAN>STATIONS>ALL>FREQ>ALL' },
        { type: 'output', content: `TIMESTAMP: ${timeString}` },
        { type: 'typing', content: 'SCANNING...' },
        { type: 'typing', content: 'DECODING SIGNAL...' },
        { type: 'output', content: isMobile ? 'PRESS SCAN TO STOP' : '[CTRL+C TO TERMINATE]' },
        ...(isHomePlaying
          ? [
            {
              type: 'warning',
              content: 'HOME AUDIO SUPPRESSED DURING SCAN',
            } as TerminalMessage,
          ]
          : []),
      ];
    } catch (error) {
      stopScan();
      return [{ type: 'error', content: `TRANSMISSION ERROR: ${(error as Error).message}` }];
    }
  }, [appendMessage, audioElement, isHomePlaying, isMobile, stopScan, typeMessage]);

  const commandHandlers = useMemo<Record<string, () => Promise<TerminalMessage[]>>>(
    () => ({
      commands: async () => [
        { type: 'output', content: 'TERMINAL COMMANDS DIRECTORY' },
        { type: 'separator', content: '————————————————————————————' },
        { type: 'output', content: 'COMMANDS      - Display this directory' },
        { type: 'output', content: 'ARCHIVES      - Access media archives' },
        { type: 'output', content: 'DATA          - Access restricted datasets' },
        { type: 'output', content: 'SCAN          - Scan frequencies' },
        { type: 'output', content: 'BROADCAST     - Operator broadcast' },
        { type: 'output', content: 'CLEAR         - Clear terminal buffer' },
        { type: 'output', content: 'EXIT          - Terminate connection' },
        { type: 'separator', content: '————————————————————————————' },
      ],
      archives: () => executeArchive(),
      data: async () => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 200);
        return [
          { type: 'error', content: 'ACCESS DENIED: ENCRYPTION LEVEL INSUFFICIENT' },
          { type: 'error', content: 'SYSTEM LOCKDOWN INITIATED...' },
          { type: 'error', content: 'ERROR: CRITICAL SECURITY BREACH PREVENTED' },
        ];
      },
      scan: () => executeScan(),
      broadcast: async () => [
        { type: 'warning', content: 'PHYSICAL ACCESS KEY NOT DETECTED' },
        { type: 'warning', content: 'OPERATOR CREDENTIALS NOT FOUND' },
        { type: 'warning', content: 'SOME PERMISSIONS RESTRICTED' },
        { type: 'separator', content: '---------------------------' },
        { type: 'system', content: 'AUX RELAY UNLOCKED: RESET SIGNAL' },
        { type: 'link', content: ' HYPERFOLLOW // RESET' },
      ],
      clear: async () => {
        stopScan();
        resetTerminal();
        return [];
      },
    }),
    [executeArchive, executeScan, exitTerminal, resetTerminal, stopScan],
  );

  const executeCommand = useCallback(
    async (commandRaw: string) => {
      const command = commandRaw.trim().toLowerCase();
      if (!command) {
        return;
      }

      appendCommandMessage(command);
      setHistory((prev) => [command, ...prev.filter((h) => h !== command)].slice(0, 50));
      setHistoryIndex(-1);

      const handler = commandHandlers[command as keyof typeof commandHandlers];
      if (!handler) {
        appendMessage({ type: 'output', content: `COMMAND NOT RECOGNIZED: ${command.toUpperCase()}` });
        appendPrompt();
        return;
      }

      const result = await handler();
      for (const message of result) {
        // eslint-disable-next-line no-await-in-loop
        await typeMessage(message);
      }

      appendPrompt();
    },
    [appendCommandMessage, appendMessage, appendPrompt, commandHandlers, typeMessage],
  );

  const initializeOutput = useCallback(async () => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    for (const message of INITIAL_MESSAGES) {
      // eslint-disable-next-line no-await-in-loop
      await typeMessage(message);
    }
    appendPrompt();
    setIsInitialized(true);

    // Auto execute commands listing
    setTimeout(() => {
      executeCommand('commands');
    }, 500);
  }, [appendPrompt, executeCommand, typeMessage]);

  useEffect(() => {
    if (isInitialized) {
      return;
    }
    initializeOutput();
  }, [initializeOutput, isInitialized]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentFrequency) {
      interval = setInterval(() => {
        setVisualizerData(audioStreamer.getFrequencyData());
      }, 50); // Faster update for smoother visualization
    } else {
      setVisualizerData(new Array(32).fill(0));
    }
    return () => clearInterval(interval);
  }, [currentFrequency]);

  useEffect(() => () => {
    audioStreamer.stop();
  }, []);

  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [output]);

  const handleSubmit = useCallback(
    (manualCommand?: string) => {
      const commandToRun = manualCommand ?? input;
      executeCommand(commandToRun);
      setInput('');
    },
    [executeCommand, input],
  );

  const handleLinkClick = useCallback((content: string) => {
    if (content === ' ACCESS LEDGER') {
      navigate('/instruments');
      return;
    }
    const link = MEDIA_LINKS.find((item) => ` ${item.name}` === content);
    if (link) {
      window.open(link.url, '_blank');
    }
  }, [navigate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Ctrl+C to stop scan
      if (event.ctrlKey && event.key === 'c' && currentFrequency) {
        stopScan();
        appendMessage({ type: 'system', content: 'SCAN TERMINATED.' });
        appendPrompt();
        return;
      }

      // Command History
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (history.length > 0) {
          const nextIndex = Math.min(historyIndex + 1, history.length - 1);
          setHistoryIndex(nextIndex);
          setInput(history[nextIndex]);
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex > 0) {
          const nextIndex = historyIndex - 1;
          setHistoryIndex(nextIndex);
          setInput(history[nextIndex]);
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setInput('');
        }
      }

      // Tab Completion
      if (event.key === 'Tab') {
        event.preventDefault();
        const availableCommands = Object.keys(commandHandlers);
        const matches = availableCommands.filter((c) => c.startsWith(input.toLowerCase()));
        if (matches.length === 1) {
          setInput(matches[0]);
        }
      }
    },
    [appendMessage, appendPrompt, commandHandlers, currentFrequency, history, historyIndex, input, stopScan],
  );

  return {
    input,
    setInput,
    output,
    viewportHeight,
    menuItems: MENU_ITEMS,
    handleSubmit,
    handleLinkClick,
    handleKeyDown,
    terminalRef,
    outputRef: outputContainerRef,
    inputRef,
    visualizerData,
    isScanning: !!currentFrequency,
    isFlashing,
  };
}
