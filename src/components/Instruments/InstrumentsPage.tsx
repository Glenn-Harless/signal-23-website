import React, { useState, useEffect, useRef } from 'react';
import '../../styles/instruments.css';
import { PricePoint } from './PricePoint';

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
    const [checkoutState, setCheckoutState] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');
    const acquisitionRef = useRef<HTMLDivElement>(null);

    // Ensure body is scrollable on this page
    useEffect(() => {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        // Remove any common scroll lock classes if they exist
        document.body.classList.remove('antigravity-scroll-lock');
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    const handlePackSelect = (pack: AbletonPack) => {
        setCheckoutState('IDLE');
        setFlicker(true);
        setSelectedPack(pack);
        setTimeout(() => setFlicker(false), 200);

        // Scroll to acquisition panel on mobile
        if (window.innerWidth <= 1024) {
            setTimeout(() => {
                acquisitionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const handleInitiateCheckout = async (amount: number) => {
        setCheckoutState('LOADING');
        console.log(`Initializing checkout for ${selectedPack.title} at $${amount}`);

        // Simulate network delay for Stripe session creation
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In a real implementation, we would redirect here:
        // window.location.href = checkoutUrl;

        setCheckoutState('SUCCESS');
    };

    return (
        <div className={`archival-ledger-container ${flicker ? 'ledger-flicker-active' : ''}`}>
            <div className="data-mesh-bg">
                {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i}>{Math.random().toString(16).substring(2, 10).toUpperCase()} 0x{Math.floor(Math.random() * 1000).toString(16)} COORDINATE: {Math.random().toFixed(4)}N {Math.random().toFixed(4)}E</div>
                ))}
            </div>

            <div className="mt-4">
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
                    <div className="ledger-panel" ref={acquisitionRef}>
                        <span className="ledger-label">MARKETPLACE & ACQUISITIONS</span>

                        {checkoutState === 'IDLE' && (
                            <PricePoint
                                key={selectedPack.id}
                                initialPrice={selectedPack.price}
                                onInitiateCheckout={handleInitiateCheckout}
                            />
                        )}

                        {checkoutState === 'LOADING' && (
                            <div className="bg-white/5 p-8 border border-white/10 flex flex-col items-center justify-center animate-pulse">
                                <div className="text-red-500 font-mono text-sm mb-4">TRANSMITTING DATA...</div>
                                <div className="w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        {checkoutState === 'SUCCESS' && (
                            <div className="bg-red-500/10 p-6 border border-red-500 flex flex-col items-center text-center">
                                <div className="text-red-500 font-neo-brutalist text-xl mb-4 tracking-widest">DATA PACKET DECODED</div>
                                <div className="text-xs opacity-70 mb-6 font-mono">
                                    VERIFICATION COMPLETE. DOWNLOAD LINK GENERATED FOR:<br />
                                    {selectedPack.title}
                                </div>
                                <button
                                    className="w-full py-3 bg-red-500 text-white font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-colors"
                                    onClick={() => alert(`Simulated Download of ${selectedPack.id}`)}
                                >
                                    GET ARCHIVE
                                </button>
                                <button
                                    className="mt-4 text-[10px] uppercase underline opacity-40 hover:opacity-100"
                                    onClick={() => setCheckoutState('IDLE')}
                                >
                                    RETURN TO MARKETPLACE
                                </button>
                            </div>
                        )}

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

        </div>
    );
};
