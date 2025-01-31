// AudioDebugger.ts
export class AudioDebugger {
    private logs: string[] = [];
    private maxLogs = 50;
  
    log(message: string, data?: any) {
      const timestamp = new Date().toISOString();
      let logMessage = `[${timestamp}] ${message}`;
      if (data) {
        logMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
      }
      this.logs.push(logMessage);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      console.log(logMessage);
    }
  
    getDeviceInfo() {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        memory: (performance as any).memory?.jsHeapSizeLimit,
        connection: (navigator as any).connection?.effectiveType,
        online: navigator.onLine,
        maxTouchPoints: navigator.maxTouchPoints,
        hardwareConcurrency: navigator.hardwareConcurrency,
      };
    }
  
    getAudioContextInfo() {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        return {
          sampleRate: audioContext.sampleRate,
          state: audioContext.state,
          baseLatency: audioContext.baseLatency,
          maxChannelCount: audioContext.destination.maxChannelCount,
        };
      } catch (error) {
        return { error: `Failed to create AudioContext: ${error.message}` };
      }
    }
  
    getLogs() {
      return this.logs;
    }
  
    getFullReport() {
      return {
        deviceInfo: this.getDeviceInfo(),
        audioContext: this.getAudioContextInfo(),
        logs: this.logs,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  export const audioDebugger = new AudioDebugger();