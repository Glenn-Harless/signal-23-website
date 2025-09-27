import Hls from 'hls.js';

interface AudioStreamOptions {
  reuseElement?: HTMLAudioElement;
  onError?: (error: Error) => void;
}

const PLAYLIST_URL = 'https://www.dropbox.com/scl/fi/19upvjkgjmcpsqzadfsuj/playlist.m3u8?rlkey=ayaqpygc1e3iup4knh1p5uojk';
const SEGMENT_FILE_ID = 'ub356bile8ozsuwes1h8y';
const SEGMENT_RL_KEY = 'zqz775il1yqoqghiyibdwso4f';

class AudioStreamer {
  private audio: HTMLAudioElement | null = null;

  private hls: Hls | null = null;

  private isPlaying = false;

  private debugMode = true;

  private platformInitialized = false;

  private isMobile = false;

  private readonly console = typeof window !== 'undefined' ? window.console : console;

  private debugLog(message: string, data?: unknown) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      this.console.log(`[${timestamp}] ${message}`, data ?? '');
    }
  }

  private initializePlatform() {
    if (this.platformInitialized) {
      return;
    }

    if (typeof window === 'undefined') {
      throw new Error('AudioStreamer requires a browser environment');
    }

    const userAgent = navigator.userAgent;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    this.platformInitialized = true;
    this.debugLog(`Platform initialized as ${this.isMobile ? 'mobile' : 'desktop'}`);
  }

  private ensureAudioElement(reuseElement?: HTMLAudioElement) {
    if (typeof window === 'undefined') {
      throw new Error('Audio playback not available in this environment');
    }

    if (reuseElement) {
      this.audio = reuseElement;
    }

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous';
    }

    return this.audio;
  }

  private getDropboxDirectUrl(url: string) {
    const fileMatch = url.match(/\/scl\/fi\/([^?]+)/);
    const rlkeyMatch = url.match(/rlkey=([^&]+)/);

    if (!fileMatch || !rlkeyMatch) {
      this.debugLog('Invalid Dropbox URL format');
      return url;
    }

    const fileId = fileMatch[1];
    const rlkey = rlkeyMatch[1];
    return `https://dl.dropboxusercontent.com/scl/fi/${fileId}?rlkey=${rlkey}&raw=1`;
  }

  private getSegmentUrl(segmentName: string) {
    return `https://dl.dropboxusercontent.com/scl/fi/${SEGMENT_FILE_ID}/${segmentName}?rlkey=${SEGMENT_RL_KEY}&raw=1`;
  }

  async playRandomSegment(options: AudioStreamOptions = {}): Promise<void> {
    try {
      this.initializePlatform();
      const reuseCandidate = options.reuseElement ?? this.audio ?? undefined;
      this.stop();
      const audio = this.ensureAudioElement(reuseCandidate);

      const playlistUrl = this.getDropboxDirectUrl(PLAYLIST_URL);
      this.debugLog('Playlist URL', playlistUrl);

      if (!Hls.isSupported()) {
        throw new Error('HLS playback not supported on this device');
      }

      this.hls = new Hls({
        debug: this.debugMode,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        xhrSetup: (xhr, url) => {
          if (url.includes('segment')) {
            const segmentName = url.split('/').pop() || '';
            const segmentUrl = this.getSegmentUrl(segmentName);
            this.debugLog('Loading segment', segmentUrl);
            xhr.open('GET', segmentUrl, true);
          } else {
            xhr.open('GET', url, true);
          }
        },
      });

      this.hls.loadSource(playlistUrl);
      this.hls.attachMedia(audio);

      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        this.debugLog('HLS media attached');
      });

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.debugLog('HLS manifest parsed');
        if (!audio) {
          return;
        }
        const totalDuration = this.hls?.levels[0]?.details?.totalduration ?? 0;
        const randomStart = Math.floor(Math.random() * Math.max(0, totalDuration - 60));
        audio.currentTime = randomStart;
        audio
          .play()
          .then(() => {
            this.isPlaying = true;
            this.debugLog('Playback started', { randomStart });
          })
          .catch((error) => {
            throw error;
          });
      });

      this.hls.on(Hls.Events.ERROR, (_event, data) => {
        this.debugLog('HLS error', data);
        if (!data.fatal) {
          return;
        }

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            this.debugLog('Recovering from network error');
            this.hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            this.debugLog('Recovering from media error');
            this.hls?.recoverMediaError();
            break;
          default:
            this.debugLog('Fatal error encountered, stopping playback');
            this.stop();
            options.onError?.(new Error(data.details));
        }
      });
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error('Unknown error');
      this.debugLog('Playback error', normalized);
      options.onError?.(normalized);
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
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getCurrentTime() {
    return this.audio?.currentTime ?? 0;
  }
}

export const audioStreamer = new AudioStreamer();
