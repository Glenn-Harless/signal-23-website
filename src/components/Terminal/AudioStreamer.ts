import Hls from 'hls.js';

interface AudioStreamOptions {
  onError?: (error: Error) => void;
}

class AudioStreamer {
  private audio: HTMLAudioElement | null = null;
  private hls: Hls | null = null;
  private debugMode: boolean = true;
  private isMobile: boolean;
  private isIOS: boolean;
  private isPlaying: boolean = false;
  private segmentFileId: string = 'ub356bile8ozsuwes1h8y';
  private segmentRlkey: string = 'zqz775il1yqoqghiyibdwso4f';

  constructor() {
    this.debugLog('Initializing AudioStreamer');
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.debugLog(`Platform: ${this.isMobile ? 'Mobile' : 'Desktop'} (iOS: ${this.isIOS})`);
  }

  private debugLog(message: string, data?: any) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${message}`, data || '');
    }
  }

  private getDropboxDirectUrl(url: string): string {
    // Extract file ID and rlkey from URL
    const fileMatch = url.match(/\/scl\/fi\/([^?]+)/);
    const rlkeyMatch = url.match(/rlkey=([^&]+)/);
    
    if (!fileMatch || !rlkeyMatch) {
      this.debugLog('Invalid Dropbox URL format');
      return url;
    }
    
    const fileId = fileMatch[1];
    const rlkey = rlkeyMatch[1];
    
    // Return direct download link
    return `https://dl.dropboxusercontent.com/scl/fi/${fileId}?rlkey=${rlkey}&raw=1`;
  }

  private getSegmentUrl(segmentName: string): string {
    // Construct URL for segments using their file ID and rlkey
    return `https://dl.dropboxusercontent.com/scl/fi/${this.segmentFileId}/${segmentName}?rlkey=${this.segmentRlkey}&raw=1`;
  }

  async playRandomSegment(options: AudioStreamOptions): Promise<void> {
    try {
      this.debugLog('Starting playback');
      this.stop();

      const playlistUrl = this.getDropboxDirectUrl('https://www.dropbox.com/scl/fi/19upvjkgjmcpsqzadfsuj/playlist.m3u8?rlkey=ayaqpygc1e3iup4knh1p5uojk');
      this.debugLog('Playlist URL:', playlistUrl);

      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous';

      if (Hls.isSupported()) {
        this.hls = new Hls({
          debug: this.debugMode,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          xhrSetup: (xhr, url) => {
            // If this is a segment request, rewrite the URL
            if (url.includes('segment')) {
              const segmentName = url.split('/').pop() || '';
              const segmentUrl = this.getSegmentUrl(segmentName);
              this.debugLog('Loading segment:', segmentUrl);
              xhr.open('GET', segmentUrl, true);
            } else {
              xhr.open('GET', url, true);
            }
          }
        });

        this.hls.loadSource(playlistUrl);
        this.hls.attachMedia(this.audio);

        this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          this.debugLog('HLS Media Attached');
        });

        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          this.debugLog('HLS Manifest Parsed');
          if (this.audio) {
            const totalDuration = this.hls?.levels[0].details.totalduration || 0;
            const randomStart = Math.floor(Math.random() * (Math.max(0, totalDuration - 60)));
            this.audio.currentTime = randomStart;
            this.audio.play()
              .then(() => {
                this.isPlaying = true;
                this.debugLog('Playback started at time:', randomStart);
              })
              .catch(error => {
                this.debugLog('Play failed:', error);
                throw error;
              });
          }
        });

        this.hls.on(Hls.Events.ERROR, (event, data) => {
          this.debugLog('HLS Error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                this.debugLog('Network error, attempting to recover');
                this.hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                this.debugLog('Media error, attempting to recover');
                this.hls?.recoverMediaError();
                break;
              default:
                this.debugLog('Fatal error, stopping');
                this.stop();
                if (options.onError) {
                  options.onError(new Error(data.details));
                }
                break;
            }
          }
        });
      } else {
        throw new Error('HLS playback not supported on this device');
      }
    } catch (error) {
      this.debugLog('Playback error:', error);
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    }
  }

  stop() {
    this.debugLog('Stopping playback');
    this.isPlaying = false;
    
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio.remove();
      this.audio = null;
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getCurrentTime() {
    return this.audio?.currentTime || 0;
  }
}

export const audioStreamer = new AudioStreamer();