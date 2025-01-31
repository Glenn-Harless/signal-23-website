class AudioStreamer {
  private audio: HTMLAudioElement | null = null;
  private currentTimeout: NodeJS.Timeout | null = null;
  private debugMode: boolean = true; // Enable debug logging

  constructor() {
    // Check if running on mobile
    this.debugLog('Initializing AudioStreamer');
    this.debugLog(`User Agent: ${navigator.userAgent}`);
  }

  private errorCallbacks: ((error: string) => void)[] = [];
  
  addErrorCallback(callback: (error: string) => void) {
    this.errorCallbacks.push(callback);
  }

  private debugLog(message: string, error?: any) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [AudioStreamer] ${message}`;
      
      if (error) {
        console.error(logMessage, error);
        // Notify error callbacks with detailed error information
        const errorDetail = error instanceof Error ? 
          `${error.name}: ${error.message}` : 
          JSON.stringify(error);
        this.errorCallbacks.forEach(callback => 
          callback(`${logMessage}\n${errorDetail}\nUser Agent: ${navigator.userAgent}`)
        );
      } else {
        console.log(logMessage);
      }
    }
  }

  private getDirectDropboxLink(url: string): string {
    const match = url.match(/\/scl\/fi\/([^?]+)/);
    if (!match) {
      this.debugLog('Invalid Dropbox URL format');
      return url;
    }
    
    const filePath = match[1];
    const rlkeyMatch = url.match(/rlkey=([^&]+)/);
    const rlkey = rlkeyMatch ? rlkeyMatch[1] : '';
    
    return `https://dl.dropboxusercontent.com/scl/fi/${filePath}?rlkey=${rlkey}&raw=1&dl=1`;
  }

  private async testStreaming(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          Range: 'bytes=0-0'
        }
      });
      
      this.debugLog('Streaming test response:', response.status, response.headers);
      return response.status === 206;
    } catch (error) {
      this.debugLog('Streaming test failed:', error);
      return false;
    }
  }

  async playRandomSegment(options: AudioStreamOptions) {
    try {
      this.debugLog('Starting playRandomSegment');
      this.stop();

      const directUrl = this.getDirectDropboxLink(options.url);
      this.debugLog('Attempting to play from URL:', directUrl);
      
      try {
        const response = await fetch(directUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`URL check failed with status ${response.status}`);
        }
        this.debugLog('URL check successful:', response.status);
      } catch (fetchError) {
        throw new Error(`Cannot access audio file: ${fetchError.message}`);
      }
      
      const streamingSupported = await this.testStreaming(directUrl);
      this.debugLog(`Streaming support: ${streamingSupported}`);

      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.audio.crossOrigin = 'anonymous';
      
      if (streamingSupported) {
        this.audio.preload = 'metadata';
      }
      
      this.audio.setAttribute('playsinline', '');
      this.audio.setAttribute('webkit-playsinline', '');
      
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'SIGNAL-23 Transmission',
          artist: 'SIGNAL-23',
          album: 'Frequency Scan'
        });
      }

      this.audio.src = directUrl;

      const events = [
        'loadstart', 'durationchange', 'loadedmetadata', 'loadeddata',
        'progress', 'canplay', 'canplaythrough', 'waiting', 'playing',
        'error', 'stalled', 'suspend'
      ];

      events.forEach(event => {
        this.audio?.addEventListener(event, () => {
          this.debugLog(`Audio event: ${event}`);
          if (event === 'error' && this.audio?.error) {
            this.debugLog('Audio error details:', this.audio.error);
          }
        });
      });

      let lastBuffered = 0;
      this.audio.addEventListener('progress', () => {
        if (this.audio?.buffered.length) {
          const buffered = this.audio.buffered.end(this.audio.buffered.length - 1);
          if (buffered > lastBuffered) {
            this.debugLog(`Buffered: ${Math.round(buffered)}s`);
            lastBuffered = buffered;
          }
        }
      });

      await new Promise((resolve, reject) => {
        if (!this.audio) return reject(new Error('No audio element'));
        
        const timeout = setTimeout(() => {
          reject(new Error('Audio loading timeout'));
        }, 30000);

        const onCanPlay = () => {
          clearTimeout(timeout);
          this.audio?.removeEventListener('canplay', onCanPlay);
          this.audio?.removeEventListener('error', onError);
          resolve(true);
        };
        
        const onError = (e: Event) => {
          clearTimeout(timeout);
          this.audio?.removeEventListener('canplay', onCanPlay);
          this.audio?.removeEventListener('error', onError);
          this.debugLog('Audio loading error:', e);
          reject(new Error('Failed to load audio'));
        };
        
        this.audio.addEventListener('canplay', onCanPlay);
        this.audio.addEventListener('error', onError);
      });

      if (this.audio.duration) {
        const segmentLength = 60;
        const maxTime = Math.max(0, this.audio.duration - segmentLength);
        const randomStart = Math.random() * maxTime;
        
        this.debugLog(`Audio duration: ${this.audio.duration}s`);
        this.debugLog(`Starting playback at: ${randomStart}s`);
        
        this.audio.currentTime = randomStart;

        if (this.currentTimeout) {
          clearTimeout(this.currentTimeout);
        }
        
        this.currentTimeout = setTimeout(() => {
          this.debugLog('Segment timeout reached');
          this.stop();
        }, segmentLength * 1000);
      }

      try {
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          this.debugLog('Playback started successfully');
        }
      } catch (playError) {
        this.debugLog('Play error:', playError);
        throw playError;
      }

    } catch (error) {
      this.debugLog('Playback error:', error);
      let errorMessage = 'Failed to load audio: ';
      if (error instanceof Error) {
        errorMessage += error.message;
        if ((error as any).name === 'NotSupportedError') {
          errorMessage += ' (Browser may not support this audio format)';
        } else if ((error as any).name === 'NotAllowedError') {
          errorMessage += ' (Autoplay may be blocked)';
        } else if ((error as any).name === 'AbortError') {
          errorMessage += ' (Loading was aborted - possibly due to slow connection)';
        }
      }
      
      this.debugLog('Detailed playback error:', {
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        userAgent: navigator.userAgent,
        audioState: this.audio ? {
          currentTime: this.audio.currentTime,
          readyState: this.audio.readyState,
          networkState: this.audio.networkState,
          error: this.audio.error ? this.audio.error.code : null
        } : null
      });

      if (options.onError) {
        options.onError(new Error(errorMessage));
      }
    }
  }

  stop() {
    this.debugLog('Stopping playback');
    
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
      this.audio.remove();
      this.audio = null;
    }
  }

  isPlaying() {
    return this.audio ? !this.audio.paused : false;
  }
}

export const audioStreamer = new AudioStreamer();