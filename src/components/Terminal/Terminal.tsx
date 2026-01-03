import React from 'react';
import { useTerminal } from './useTerminal';
import { TerminalMessage } from './terminalTypes';
import HeatmapVisualizer from './HeatmapVisualizer';
import './Terminal.css';

interface TerminalProps {
  isMobile: boolean;
}

const TERMINAL_CLASS_BY_TYPE: Record<TerminalMessage['type'], string> = {
  command: 'text-blue-400 font-bold',
  error: 'text-red-500 font-bold',
  warning: 'text-yellow-500 font-bold',
  separator: 'text-green-700 opacity-50',
  link: 'text-green-400 cursor-pointer hover:text-white underline decoration-green-800 underline-offset-4 block transition-colors duration-200',
  typing: 'text-green-500 opacity-80 italic',
  system: 'text-green-500 font-semibold',
  output: 'text-green-400',
  prompt: 'text-green-500',
};

interface TerminalLineProps {
  message: TerminalMessage;
  isMobile: boolean;
  isLastPrompt: boolean;
  inputValue: string;
  onChangeInput: (value: string) => void;
  onSubmit: () => void;
  onLinkClick: (content: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const TerminalLine: React.FC<TerminalLineProps> = ({
  message,
  isMobile,
  isLastPrompt,
  inputValue,
  onChangeInput,
  onSubmit,
  onLinkClick,
  inputRef,
}) => {
  if (message.type === 'prompt') {
    return (
      <div className="flex whitespace-pre-wrap break-words">
        {!isMobile && <span className="text-green-500 mr-2">{message.content}</span>}
        {isLastPrompt && !isMobile ? (
          <form
            className="flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(event) => onChangeInput(event.target.value)}
              className="bg-transparent text-green-500 focus:outline-none w-full"
            />
          </form>
        ) : null}
      </div>
    );
  }

  const className = TERMINAL_CLASS_BY_TYPE[message.type] ?? 'text-green-500';

  return (
    <div className="terminal-line flex whitespace-pre-wrap break-words">
      <span
        className={className}
        onClick={() => {
          if (message.type === 'link') {
            onLinkClick(message.content);
          }
        }}
      >
        {message.content}
      </span>
    </div>
  );
};

export const Terminal: React.FC<TerminalProps> = ({ isMobile }) => {
  const {
    input,
    setInput,
    output,
    visualizerData,
    isScanning,
    handleSubmit: baseHandleSubmit,
    handleLinkClick,
    handleKeyDown,
    terminalRef,
    outputRef,
    inputRef,
    menuItems,
  } = useTerminal({ isMobile });

  const handleSubmit = (cmd?: string) => {
    (window as any)._audioStreamer?.resumeContext();
    baseHandleSubmit(cmd);
  };

  const lastIndex = output.length - 1;
  const [timestamp, setTimestamp] = React.useState('');

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toISOString().split('T')[1].split('.')[0] + 'Z');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden select-none">
      <div
        className="terminal-container"
        onClick={() => !isMobile && inputRef.current?.focus()}
        onKeyDown={handleKeyDown}
        ref={terminalRef}
        tabIndex={0}
      >
        <div className="terminal-scanlines" />

        <header className="terminal-header">
          <div className="flex items-center">
            <div className="terminal-status-dot" />
            <span className="truncate">B.A.N.I.S // STATION:23</span>
          </div>
          <div className="hidden md:flex items-center gap-6 opacity-80">
            <span>{timestamp}</span>
            <span className="text-green-500/50">ENC:AES-256</span>
            <span>NODE:0x{Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0')}</span>
          </div>
          <div className="font-bold text-green-400">
            SECURE
          </div>
        </header>

        <div
          ref={outputRef}
          className="terminal-output flex flex-col"
        >
          <div className="flex-1">
            {output.map((message, index) => (
              <TerminalLine
                key={`${message.type}-${index}-${message.content}`}
                message={message}
                isMobile={isMobile}
                isLastPrompt={message.type === 'prompt' && index === lastIndex}
                inputValue={input}
                onChangeInput={setInput}
                onSubmit={handleSubmit}
                onLinkClick={handleLinkClick}
                inputRef={inputRef}
              />
            ))}
          </div>
        </div>

        {isScanning && (
          <div className="visualizer-container z-50">
            <HeatmapVisualizer data={visualizerData} isMobile={isMobile} />
          </div>
        )}
      </div>

      {isMobile && (
        <div
          className="absolute bottom-[52px] left-0 right-0 z-60 bg-black/95 backdrop-blur-md p-4 pb-12 grid grid-cols-2 gap-3 border-t border-green-500/20"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
        >
          {menuItems.map((item) => (
            <button
              key={item.command}
              className="terminal-command-btn"
              onClick={() => handleSubmit(item.command)}
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


