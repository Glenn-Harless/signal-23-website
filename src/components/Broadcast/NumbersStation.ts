import * as Tone from 'tone';

export class NumbersStation {
    private carrier: Tone.Oscillator;
    private noise: Tone.Noise;
    private pip: Tone.MembraneSynth;
    private analyzer: Tone.Analyser;
    private initialized = false;

    constructor() {
        this.carrier = new Tone.Oscillator({
            frequency: 60,
            type: "sine",
            volume: -40
        }).toDestination();

        this.noise = new Tone.Noise({
            type: "brown",
            volume: -50
        }).toDestination();

        this.pip = new Tone.MembraneSynth({
            volume: -25
        }).toDestination();

        this.analyzer = new Tone.Analyser("fft", 256);
        Tone.getDestination().connect(this.analyzer);
    }

    async init() {
        if (this.initialized) return;
        await Tone.start();
        this.carrier.start();
        this.noise.start();
        this.initialized = true;
    }

    triggerBurst() {
        const now = Tone.now();
        // Eerie rhythmic pips
        for (let i = 0; i < 4; i++) {
            this.pip.triggerAttackRelease("C2", "8n", now + i * 0.25);
        }

        // Briefly increase noise
        this.noise.volume.rampTo(-35, 0.1);
        this.noise.volume.rampTo(-50, 0.5, now + 1);
    }

    getFrequencyData() {
        return this.analyzer.getValue() as Float32Array;
    }

    getAverageFrequency() {
        const data = this.getFrequencyData();
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        // Convert from dB-ish to 0-1 range roughly
        const avg = sum / data.length;
        return Math.max(0, (avg + 100) / 100);
    }

    stop() {
        this.carrier.stop();
        this.noise.stop();
    }
}
