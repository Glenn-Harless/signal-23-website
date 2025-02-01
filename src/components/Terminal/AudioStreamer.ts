class AudioStreamer {
  private audio: HTMLAudioElement | null = null;
  private currentTimeout: NodeJS.Timeout | null = null;
  private debugMode: boolean = true;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private isMobile: boolean;
  private isIOS: boolean;

  constructor() {
    this.debugLog('Initializing AudioStreamer');
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.debugLog(`Platform: ${this.isMobile ? 'Mobile' : 'Desktop'} (iOS: ${this.isIOS})`);
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
        const errorDetail = error instanceof Error ? 
          `${error.name}: ${error.message}` : 
          JSON.stringify(error);
        this.errorCallbacks.forEach(callback => 
          callback(`${logMessage}\n${errorDetail}`)
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

  private async checkAudioSupport(): Promise<boolean> {
    const audio = new Audio();
    const formats = {
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      wav: 'audio/wav',
      aac: 'audio/aac'
    };

    for (const [format, mimeType] of Object.entries(formats)) {
      const canPlay = audio.canPlayType(mimeType);
      this.debugLog(`Format ${format} support: ${canPlay}`);
      if (canPlay) return true;
    }
    return false;
  }

  private async validateAudioURL(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: this.isIOS ? {} : { Range: 'bytes=0-1' }
      });
      
      this.debugLog(`URL validation response: ${response.status}`, {
        headers: Array.from(response.headers.entries()),
        ok: response.ok,
        statusText: response.statusText
      });
      
      return response.ok;
    } catch (error) {
      this.debugLog('URL validation failed:', error);
      return false;
    }
  }

  async playRandomSegment(options: AudioStreamOptions) {
    try {
      this.debugLog('Starting playRandomSegment');
      this.stop();

      const hasSupport = await this.checkAudioSupport();
      if (!hasSupport) {
        throw new Error('Audio format not supported on this device');
      }

      const directUrl = this.getDirectDropboxLink(options.url);
      this.debugLog('Attempting to play from URL:', directUrl);

      // Validate URL before attempting to play
      const isValid = await this.validateAudioURL(directUrl);
      if (!isValid) {
        throw new Error('Cannot access audio file - URL validation failed');
      }

      // Create new audio element with mobile-specific settings
      this.audio = new Audio();
      
      if (this.isIOS) {
        // iOS-specific settings
        this.audio.preload = 'metadata';
        this.audio.autoplay = false;
        this.debugLog('Using iOS-specific audio settings');
      } else if (this.isMobile) {
        // Other mobile settings
        this.audio.preload = 'auto';
        this.debugLog('Using general mobile audio settings');
      } else {
        // Desktop settings
        this.audio.preload = 'auto';
        this.debugLog('Using desktop audio settings');
      }

      this.audio.crossOrigin = 'anonymous';
      this.audio.setAttribute('playsinline', '');
      this.audio.setAttribute('webkit-playsinline', '');

      // Set up media session
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'SIGNAL-23 Transmission',
          artist: 'SIGNAL-23',
          album: 'Frequency Scan'
        });
      }

      // Set up comprehensive event logging
      const events = [
        'loadstart', 'durationchange', 'loadedmetadata', 'loadeddata',
        'progress', 'canplay', 'canplaythrough', 'error', 'stalled',
        'waiting', 'playing', 'timeupdate', 'ended', 'pause'
      ];

      events.forEach(event => {
        this.audio?.addEventListener(event, () => {
          this.debugLog(`Audio event: ${event}`, {
            currentTime: this.audio?.currentTime,
            duration: this.audio?.duration,
            readyState: this.audio?.readyState,
            networkState: this.audio?.networkState,
            paused: this.audio?.paused,
            ended: this.audio?.ended,
            error: this.audio?.error
          });
        });
      });

      // Monitor buffering
      this.audio.addEventListener('progress', () => {
        if (this.audio?.buffered.length) {
          const buffered = this.audio.buffered.end(this.audio.buffered.length - 1);
          this.debugLog(`Buffer status:`, {
            buffered: buffered,
            duration: this.audio.duration,
            percentage: ((buffered / this.audio.duration) * 100).toFixed(2) + '%'
          });
        }
      });

      // Add the source after all event listeners are set up
      this.audio.src = directUrl;

      // iOS requires explicit load() call
      if (this.isIOS) {
        this.debugLog('Calling load() for iOS');
        this.audio.load();
      }

      // Wait for audio to be ready with detailed error handling
      await new Promise((resolve, reject) => {
        if (!this.audio) return reject(new Error('No audio element'));
        
        const timeout = setTimeout(() => {
          const state = {
            readyState: this.audio?.readyState,
            networkState: this.audio?.networkState,
            error: this.audio?.error,
            currentTime: this.audio?.currentTime,
            duration: this.audio?.duration
          };
          reject(new Error(`Audio loading timeout. State: ${JSON.stringify(state)}`));
        }, this.isMobile ? 45000 : 30000);

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
          const audioError = this.audio?.error;
          reject(new Error(`Audio error: ${audioError?.code} - ${audioError?.message}`));
        };
        
        this.audio.addEventListener('canplay', onCanPlay);
        this.audio.addEventListener('error', onError);
      });

      // Set random start time if duration is available
      if (this.audio.duration) {
        const segmentLength = 60; // 60 seconds
        const maxTime = Math.max(0, this.audio.duration - segmentLength);
        const randomStart = Math.random() * maxTime;
        
        this.debugLog(`Setting random start time: ${randomStart}s / ${this.audio.duration}s`);
        this.audio.currentTime = randomStart;

        // Set timeout to stop after segment length
        if (this.currentTimeout) {
          clearTimeout(this.currentTimeout);
        }
        
        this.currentTimeout = setTimeout(() => {
          this.debugLog('Segment timeout reached');
          this.stop();
        }, segmentLength * 1000);
      }

      // Start playback with user interaction handling for iOS
      try {
        if (this.isIOS) {
          this.debugLog('Attempting iOS playback');
          await this.audio.play().catch(async (error) => {
            this.debugLog('iOS initial play failed, retrying:', error);
            // On iOS, we might need a user interaction
            await new Promise(resolve => setTimeout(resolve, 500));
            return this.audio?.play();
          });
        } else {
          await this.audio.play();
        }
        this.debugLog('Playback started successfully');
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
          errorMessage += ' (Format not supported)';
        } else if ((error as any).name === 'NotAllowedError') {
          errorMessage += ' (Autoplay blocked - try tapping again)';
        }
      }
      
      if (options.onError) {
        options.onError(new Error(errorMessage));
      }
    }
  }

  stop() {
    this.debugLog('Stopping playback');
    this.retryCount = 0;
    
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio.remove();
      this.audio = null;
    }
  }

  isPlaying() {
    return this.audio ? !this.audio.paused : false;
  }
}

export const audioStreamer = new AudioStreamer();