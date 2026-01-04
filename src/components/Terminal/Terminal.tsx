import React from 'react';
import { useTerminal } from './useTerminal';
import { TerminalMessage } from './terminalTypes';
import HeatmapVisualizer from './HeatmapVisualizer';
import './Terminal.css';

interface TerminalProps {
  isMobile: boolean;
}

const TERMINAL_CLASS_BY_TYPE: Record<TerminalMessage['type'], string> = {
  command: 'text-green-300 font-bold',
  error: 'text-red-600 font-bold',
  warning: 'text-yellow-600 font-bold',
  separator: 'text-green-900 opacity-60',
  link: 'text-green-400 cursor-pointer hover:text-white underline decoration-green-900 underline-offset-4 block transition-colors duration-200',
  typing: 'text-green-500 opacity-80 italic',
  system: 'text-green-400 font-semibold',
  output: 'text-green-500',
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
    isFlashing,
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
    <div className={`relative h-full w-full bg-[#000b00] overflow-hidden select-none transition-colors duration-200 ${isFlashing ? 'bg-red-900/30' : ''}`}>
      <div className="terminal-scanlines" />
      <div className="terminal-noise" />
      <div
        className={`terminal-container ${isFlashing ? 'terminal-flash' : ''}`}
        onClick={() => !isMobile && inputRef.current?.focus()}
        onKeyDown={handleKeyDown}
        ref={terminalRef}
        tabIndex={0}
      >

        <div
          ref={outputRef}
          className={`terminal-output flex flex-col ${isScanning && isMobile ? 'scanning-active' : ''}`}
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

        {isScanning && !isMobile && (
          <div className="visualizer-container z-50">
            <HeatmapVisualizer data={visualizerData} isMobile={isMobile} />
          </div>
        )}
      </div>

      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 terminal-mobile-tray border-t border-green-900/40"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {isScanning && (
            <div className="visualizer-container-mobile border-b border-green-900/20">
              <HeatmapVisualizer data={visualizerData} isMobile={true} />
            </div>
          )}
          <div className="p-4 grid grid-cols-2 gap-3">
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
        </div>
      )}
    </div>
  );
};

export default Terminal;


