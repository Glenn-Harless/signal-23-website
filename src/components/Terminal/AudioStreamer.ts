class AudioStreamer {
  private audio: HTMLAudioElement | null = null;
  private currentTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.audio = new Audio();
  }

  private getDirectDropboxLink(url: string): string {
    // Convert www.dropbox.com to dl.dropboxusercontent.com and keep the rlkey
    const match = url.match(/\/scl\/fi\/([^?]+)/);
    if (!match) return url;
    
    const filePath = match[1];
    const rlkeyMatch = url.match(/rlkey=([^&]+)/);
    const rlkey = rlkeyMatch ? rlkeyMatch[1] : '';
    
    return `https://dl.dropboxusercontent.com/scl/fi/${filePath}?rlkey=${rlkey}&dl=1`; // Added dl=1
  }

  async playRandomSegment(options: AudioStreamOptions) {
    try {
      this.stop();
      this.audio = new Audio();
      
      const directUrl = this.getDirectDropboxLink(options.url);
      console.log('Playing from URL:', directUrl);
      
      this.audio.crossOrigin = 'anonymous';
      this.audio.preload = 'auto'; // Changed to 'auto' for better buffering
      this.audio.src = directUrl;
      
      // Set up buffering
      this.audio.addEventListener('waiting', () => {
        console.log('Buffering...');
      });

      this.audio.addEventListener('playing', () => {
        console.log('Playback resumed');
      });
      
      await new Promise((resolve, reject) => {
        if (!this.audio) return reject(new Error('No audio element'));
        
        const onCanPlay = () => {
          this.audio?.removeEventListener('canplay', onCanPlay);
          this.audio?.removeEventListener('error', onError);
          resolve(true);
        };
        
        const onError = (e: Event) => {
          console.error('Audio error:', e);
          this.audio?.removeEventListener('canplay', onCanPlay);
          this.audio?.removeEventListener('error', onError);
          reject(new Error('Failed to load audio'));
        };
        
        this.audio.addEventListener('canplay', onCanPlay);
        this.audio.addEventListener('error', onError);
      });

      if (this.audio.duration) {
        // Play a random 2-minute segment (or full duration if shorter)
        const segmentLength = 120; // 2 minutes in seconds
        const maxTime = Math.max(0, this.audio.duration - segmentLength);
        const randomStart = Math.random() * maxTime;
        this.audio.currentTime = randomStart;
        console.log(`Starting playback at ${randomStart}s`);
        
        // Set timeout for segment length
        if (this.currentTimeout) {
          clearTimeout(this.currentTimeout);
        }
        
        this.currentTimeout = setTimeout(() => {
          this.stop();
        }, segmentLength * 1000);
      }

      this.audio.addEventListener('timeupdate', () => {
        if (options.onProgress && this.audio) {
          options.onProgress(this.audio.currentTime);
        }
      });

      this.audio.addEventListener('ended', () => {
        if (this.currentTimeout) {
          clearTimeout(this.currentTimeout);
        }
      });

      await this.audio.play();
      console.log('Audio playing successfully');
    } catch (error) {
      console.error('Audio playback error:', error);
      if (options.onError) {
        options.onError(error as Error);
      }
    }
  }

  stop() {
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
}

export const audioStreamer = new AudioStreamer();