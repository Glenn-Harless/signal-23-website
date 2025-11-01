import React, { useEffect } from 'react';
import { useTerminal } from './useTerminal';
import { TerminalMessage } from './terminalTypes';
import { SpectrogramVisualizer } from './SpectrogramVisualizer';

interface TerminalProps {
  isMobile: boolean;
}

const TERMINAL_CLASS_BY_TYPE: Record<TerminalMessage['type'], string> = {
  command: 'text-blue-400',
  error: 'text-red-500',
  warning: 'text-yellow-500 font-bold',
  separator: 'text-green-700',
  link: 'cursor-pointer hover:text-green-300 block',
  typing: 'text-green-500',
  system: 'text-green-500',
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
    <div className="flex whitespace-pre-wrap break-words">
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
    viewportHeight,
    menuItems,
    handleSubmit,
    handleLinkClick,
    handleKeyDown,
    terminalRef,
    outputRef,
    inputRef,
    isScanActive,
    currentFrequency,
  } = useTerminal({ isMobile });

  const lastIndex = output.length - 1;

  const isDesktop = !isMobile;
  const outputClasses = `flex-1 overflow-y-auto p-4 flex flex-col ${isMobile ? 'text-sm' : 'text-base'} ${
    isMobile && isScanActive ? 'pt-4' : ''
  }`;

  useEffect(() => {
    if (!isDesktop && isScanActive && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [isDesktop, isScanActive, outputRef]);

  return (
    <div
      className="bg-black text-green-500 font-mono flex flex-col relative"
      style={{
        height: isMobile ? `${viewportHeight}px` : '100vh',
        maxHeight: isMobile ? `${viewportHeight}px` : '100vh',
      }}
      onClick={() => !isMobile && inputRef.current?.focus()}
      onKeyDown={handleKeyDown}
      ref={terminalRef}
      tabIndex={0}
    >
      {isDesktop ? (
        <div
          className="absolute inset-x-4 top-4 sm:top-1/2 sm:-translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:right-6 md:right-12 lg:right-16 xl:right-24 z-20 pointer-events-none flex justify-center"
        >
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
            <SpectrogramVisualizer isActive={isScanActive} frequencyLabel={currentFrequency} />
          </div>
        </div>
      ) : null}

      <div
        ref={outputRef}
        className={outputClasses}
        style={{ minHeight: 0 }}
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
          {!isDesktop && isScanActive ? (
            <div className="mt-4">
              <SpectrogramVisualizer
                isActive={isScanActive}
                frequencyLabel={currentFrequency}
                variant="compact"
              />
            </div>
          ) : null}
        </div>
      </div>

      {isMobile && (
        <div
          className="border-t border-green-500/30 bg-black p-4 grid grid-cols-2 gap-2"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
          {menuItems.map((item) => (
            <button
              key={item.command}
              className="p-3 text-green-500 border border-green-500/30 rounded text-center hover:bg-green-500/10 active:bg-green-500/20 transition-colors"
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
