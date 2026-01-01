import React, { useState, useEffect } from 'react';
import '../../styles/instruments.css';

interface AbletonPack {
    id: string;
    title: string;
    tag: string;
    size: string;
    macros: number;
    samples: number;
    price: string;
    description: string;
    specs: {
        latency: string;
        bitDepth: string;
        sampleRate: string;
        status: string;
    };
}

const MOCK_PACKS: AbletonPack[] = [
    {
        id: 'S23-01',
        title: 'VINTAGE SYNTHESIZER ARRAY',
        tag: '/STUDIO/SYNTHS/S23',
        size: '142MB',
        macros: 8,
        samples: 12,
        price: '$49.00',
        description: 'A collection of vintage synthesizer patches processed through custom tape saturation chains.',
        specs: { latency: '<1ms', bitDepth: '24-BIT', sampleRate: '96kHz', status: 'LOGGED' }
    },
    {
        id: 'D90-05',
        title: 'MODULAR DRUM MACHINES',
        tag: '/STUDIO/DRUMS/D90',
        size: '320MB',
        macros: 16,
        samples: 124,
        price: '$29.00',
        description: 'Raw, aggressive modular drum hits and processed sequences.',
        specs: { latency: '2.4ms', bitDepth: '24-BIT', sampleRate: '44.1kHz', status: 'VERIFIED' }
    },
    {
        id: 'E45-02',
        title: 'EXPERIMENTAL TEXTURES',
        tag: '/STUDIO/FX/E45',
        size: '210MB',
        macros: 12,
        samples: 0,
        price: '$19.00',
        description: 'Abstract granular textures and evolving drones for atmospheric sound design.',
        specs: { latency: '<1ms', bitDepth: '32-BIT FLOAT', sampleRate: '48kHz', status: 'ENCRYPTED' }
    }
];

const WaveformDisplay: React.FC = () => {
    const [dots, setDots] = useState<number[]>(new Array(40).fill(10));

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.map(() => Math.random() * 80 + 20));
        }, 150);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="waveform-dots">
            {dots.map((h, i) => (
                <div
                    key={i}
                    className="waveform-dot"
                    style={{ height: `${h}%`, opacity: h / 100 }}
                />
            ))}
        </div>
    );
};

export const InstrumentsPage: React.FC = () => {
    const [selectedPack, setSelectedPack] = useState<AbletonPack>(MOCK_PACKS[0]);
    const [flicker, setFlicker] = useState(false);

    const handlePackSelect = (pack: AbletonPack) => {
        setFlicker(true);
        setSelectedPack(pack);
        setTimeout(() => setFlicker(false), 200);
    };

    return (
        <div className={`archival-ledger-container ${flicker ? 'ledger-flicker-active' : ''}`}>
            <div className="data-mesh-bg">
                {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i}>{Math.random().toString(16).substring(2, 10).toUpperCase()} 0x{Math.floor(Math.random() * 1000).toString(16)} COORDINATE: {Math.random().toFixed(4)}N {Math.random().toFixed(4)}E</div>
                ))}
            </div>

            <div className="rhythmic-nav top">
                <span>ARCHIVE</span>
                <span>INSTRUMENTS</span>
                <span>SIGNAL-23</span>
                <span>LOG-001</span>
            </div>

            <div className="mt-8">
                <h1 className="ledger-h1">ARCHIVAL MUSIC DATA LEDGER - v.2.4</h1>

                <div className="ledger-grid">
                    {/* Panel 1: Catalog */}
                    <div className="ledger-panel">
                        <span className="ledger-label">INSTRUMENT RACKS / ABLETON PACKS</span>
                        {MOCK_PACKS.map(pack => (
                            <div
                                key={pack.id}
                                className={`ledger-entry ${selectedPack.id === pack.id ? 'active' : ''}`}
                                onClick={() => handlePackSelect(pack)}
                            >
                                <div className="text-xs font-bold mb-1">[RACK ID: {pack.id}] -- "{pack.title}"</div>
                                <div className="ledger-metadata">
                                    {pack.tag} | {pack.size} | {pack.macros} MACROS
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Panel 2: Analysis */}
                    <div className="ledger-panel">
                        <span className="ledger-label">SIGNAL FLOW VISUALIZATION</span>
                        <WaveformDisplay />

                        <div className="mt-8 border-t border-white/20 pt-4">
                            <span className="ledger-label">ANALYSIS UNIT</span>
                            <div className="grid grid-cols-2 gap-4 ledger-metadata">
                                <div>LATENCY: {selectedPack.specs.latency}</div>
                                <div>BIT DEPTH: {selectedPack.specs.bitDepth}</div>
                                <div>SAMPLE RATE: {selectedPack.specs.sampleRate}</div>
                                <div>STATUS: {selectedPack.specs.status}</div>
                            </div>
                            <div className="mt-4 text-sm leading-relaxed opacity-80">
                                {selectedPack.description}
                            </div>
                        </div>
                    </div>

                    {/* Panel 3: Acquisition */}
                    <div className="ledger-panel">
                        <span className="ledger-label">MARKETPLACE & ACQUISITIONS</span>
                        <div className="bg-white/5 p-4 border border-white/10">
                            <div className="text-lg mb-4 text-white font-neo-brutalist tracking-widest uppercase">
                                {selectedPack.title}
                            </div>
                            <div className="flex justify-between items-end mb-6">
                                <span className="ledger-label p-0 m-0">ACQUISITION PRICE:</span>
                                <span className="text-2xl text-red-500 font-bold">{selectedPack.id === 'S23-01' ? '$49.00' : selectedPack.id === 'D90-05' ? '$29.00' : '$19.00'}</span>
                            </div>
                            <button className="w-full py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors uppercase tracking-widest text-sm font-bold">
                                INITIATE DOWNLOAD
                            </button>
                            <div className="mt-4 text-[10px] opacity-40 leading-tight">
                                BY INITIATING DOWNLOAD, YOU AGREE TO THE SIGNAL-23 TERMS OF SERVICE. ALL DATA IS VERIFIED FOR INTEGRITY BEFORE TRANSMISSION.
                            </div>
                        </div>

                        <div className="mt-8">
                            <span className="ledger-label">LOCATION DATA</span>
                            <div className="ledger-metadata font-mono opacity-30">
                                LAT: 51° 30' N<br />
                                LONG: 0° 07' W<br />
                                BUFFER: 512<br />
                                SYNC: ACTIVE
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rhythmic-nav bottom">
                <span>ARCHIVE</span>
                <span>SUPPORT</span>
                <span>NEWSLETTER</span>
                <span>LEGAL</span>
            </div>
        </div>
    );
};
