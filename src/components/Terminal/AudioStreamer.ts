class AudioStreamer {
  private audio: HTMLAudioElement | null = null;
  private currentTimeout: NodeJS.Timeout | null = null;
  private debugMode: boolean = true;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private isMobile: boolean;
  private isIOS: boolean;
  private isChrome: boolean;

  constructor() {
    this.debugLog('Initializing AudioStreamer');
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.isChrome = /Chrome/.test(navigator.userAgent);
    this.debugLog(`Platform: ${this.isMobile ? 'Mobile' : 'Desktop'} (iOS: ${this.isIOS}, Chrome: ${this.isChrome})`);
  }

  private debugLog(message: string, data?: any) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${message}`, data || '');
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
    
    // Add dl=1 to force download mode and raw=1 to get direct file
    return `https://dl.dropboxusercontent.com/scl/fi/${filePath}?rlkey=${rlkey}&raw=1&dl=1`;
  }

  private async validateAudioURL(url: string): Promise<boolean> {
    // Skip validation for mobile Chrome as it doesn't handle range requests well for large files
    if (this.isMobile && this.isChrome) {
      this.debugLog('Skipping URL validation for mobile Chrome');
      return true;
    }

    try {
      // For Safari, use a simple HEAD request
      if (this.isIOS) {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'cors',
          credentials: 'omit'
        });
        return response.ok;
      }

      // For other browsers, use a minimal range request
      const response = await fetch(url, {
        headers: { 'Range': 'bytes=0-0' },
        mode: 'cors',
        credentials: 'omit'
      });

      return response.status === 206 || response.ok;
    } catch (error) {
      this.debugLog('URL validation failed:', error);
      return false;
    }
  }

  async playRandomSegment(options: AudioStreamOptions) {
    try {
      this.debugLog('Starting playRandomSegment');
      this.stop();

      const directUrl = this.getDirectDropboxLink(options.url);
      this.debugLog('Processing URL:', directUrl);

      // Create new audio element
      this.audio = new Audio();
      
      if (this.isIOS) {
        // iOS-specific settings
        this.audio.preload = 'metadata';
        this.debugLog('Using iOS-specific audio settings');
      } else if (this.isMobile && this.isChrome) {
        // Chrome mobile specific settings
        this.audio.preload = 'auto';
        this.audio.crossOrigin = 'anonymous';
        this.debugLog('Using Chrome mobile settings');
      } else {
        // Desktop settings
        this.audio.preload = 'auto';
        this.debugLog('Using desktop audio settings');
      }

      // Set up event logging
      const events = ['loadstart', 'loadedmetadata', 'canplay', 'error'];
      events.forEach(event => {
        this.audio?.addEventListener(event, () => {
          this.debugLog(`Audio event: ${event}`, {
            currentTime: this.audio?.currentTime,
            readyState: this.audio?.readyState,
            error: this.audio?.error
          });
        });
      });

      // Set the source
      this.audio.src = directUrl;

      // For iOS, we need to explicitly load
      if (this.isIOS) {
        this.audio.load();
      }

      // Wait for the audio to be ready
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
        
        const onError = () => {
          clearTimeout(timeout);
          this.audio?.removeEventListener('canplay', onCanPlay);
          this.audio?.removeEventListener('error', onError);
          reject(new Error('Audio loading failed'));
        };
        
        this.audio.addEventListener('canplay', onCanPlay);
        this.audio.addEventListener('error', onError);
      });

      // Start playback
      await this.audio.play();
      this.debugLog('Playback started successfully');

    } catch (error) {
      this.debugLog('Playback error:', error);
      let errorMessage = 'Failed to load audio';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
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