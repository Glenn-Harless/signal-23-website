// In your AudioStreamer.ts
import { audioDebugger } from './AudioDebugger';

class AudioStreamer {
  private audio: HTMLAudioElement | null = null;
  private currentTimeout: NodeJS.Timeout | null = null;

  constructor() {
    audioDebugger.log('AudioStreamer initialized', {
      deviceInfo: audioDebugger.getDeviceInfo(),
      audioContext: audioDebugger.getAudioContextInfo()
    });
  }

  private getDirectDropboxLink(url: string): string {
    const match = url.match(/\/scl\/fi\/([^?]+)/);
    if (!match) {
      audioDebugger.log('Invalid Dropbox URL format', { url });
      return url;
    }
    
    const filePath = match[1];
    const rlkeyMatch = url.match(/rlkey=([^&]+)/);
    const rlkey = rlkeyMatch ? rlkeyMatch[1] : '';
    
    const directUrl = `https://dl.dropboxusercontent.com/scl/fi/${filePath}?rlkey=${rlkey}&raw=1&dl=1`;
    audioDebugger.log('Generated direct URL', { directUrl });
    return directUrl;
  }

  async playRandomSegment(options: AudioStreamOptions) {
    try {
      audioDebugger.log('Starting playRandomSegment');
      this.stop();

      // First test URL accessibility
      const directUrl = this.getDirectDropboxLink(options.url);
      try {
        audioDebugger.log('Testing URL accessibility');
        const response = await fetch(directUrl, { 
          method: 'HEAD',
          headers: {
            'Range': 'bytes=0-0' // Test byte-range support
          }
        });
        audioDebugger.log('URL test response', {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
      } catch (fetchError) {
        audioDebugger.log('URL test failed', { error: fetchError.message });
        throw new Error(`Cannot access audio file: ${fetchError.message}`);
      }

      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.audio.crossOrigin = 'anonymous';

      // Add all relevant event listeners
      const events = [
        'loadstart', 'durationchange', 'loadedmetadata', 'loadeddata',
        'progress', 'canplay', 'canplaythrough', 'playing', 'waiting',
        'stalled', 'error', 'abort'
      ];

      events.forEach(event => {
        this.audio?.addEventListener(event, () => {
          audioDebugger.log(`Audio event: ${event}`, {
            currentTime: this.audio?.currentTime,
            readyState: this.audio?.readyState,
            networkState: this.audio?.networkState,
            error: this.audio?.error ? {
              code: this.audio.error.code,
              message: this.audio.error.message
            } : null
          });
        });
      });

      this.audio.src = directUrl;
      audioDebugger.log('Set audio source');

      await new Promise((resolve, reject) => {
        if (!this.audio) return reject(new Error('No audio element'));
        
        const timeout = setTimeout(() => {
          audioDebugger.log('Audio loading timeout');
          reject(new Error('Audio loading timeout after 30s'));
        }, 30000);

        const onCanPlay = () => {
          clearTimeout(timeout);
          this.audio?.removeEventListener('canplay', onCanPlay);
          this.audio?.removeEventListener('error', onError);
          audioDebugger.log('Audio can play');
          resolve(true);
        };
        
        const onError = (e: Event) => {
          clearTimeout(timeout);
          this.audio?.removeEventListener('canplay', onCanPlay);
          this.audio?.removeEventListener('error', onError);
          const errorDetails = this.audio?.error ? {
            code: this.audio.error.code,
            message: this.audio.error.message
          } : 'Unknown error';
          audioDebugger.log('Audio error occurred', errorDetails);
          reject(new Error(`Audio error: ${JSON.stringify(errorDetails)}`));
        };
        
        this.audio.addEventListener('canplay', onCanPlay);
        this.audio.addEventListener('error', onError);
      });

      // Add the debug command to your terminal
      try {
        await this.audio.play();
        audioDebugger.log('Audio playback started');
      } catch (playError) {
        audioDebugger.log('Play error occurred', { error: playError.message });
        throw playError;
      }

    } catch (error) {
      audioDebugger.log('Playback error in playRandomSegment', { error });
      if (options.onError) {
        options.onError(error as Error);
      }
    }
  }

  stop() {
    audioDebugger.log('Stopping audio');
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
      this.audio = null;
    }
  }

  isPlaying() {
    return this.audio ? !this.audio.paused : false;
  }

  // Add method to get debug logs
  getDebugLogs() {
    return audioDebugger.getFullReport();
  }
}

export const audioStreamer = new AudioStreamer();