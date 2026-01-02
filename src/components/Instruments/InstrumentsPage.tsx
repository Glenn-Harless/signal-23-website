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

const PACKS: AbletonPack[] = [
    {
        id: 'arps',
        title: 'ARPEGGIATOR COLLECTION',
        tag: '/STUDIO/INSTRUMENTS/ARPS',
        size: '~5MB',
        macros: 8,
        samples: 0,
        price: '$0.00',
        description: 'Dark, experimental, and percussive arpeggiator racks for melodic sequencing and rhythmic patterns.',
        specs: { latency: '<1ms', bitDepth: '32-BIT FLOAT', sampleRate: '48kHz', status: 'VERIFIED' }
    },
    {
        id: 'audio-fx',
        title: 'AUDIO EFFECT RACKS',
        tag: '/STUDIO/FX/AUDIO',
        size: '~2MB',
        macros: 8,
        samples: 0,
        price: '$0.00',
        description: 'Crystal gates, dust bloom, glass textures, and shadow pulse effects for creative sound design.',
        specs: { latency: '<1ms', bitDepth: '32-BIT FLOAT', sampleRate: '48kHz', status: 'LOGGED' }
    },
    {
        id: 'bass',
        title: 'BASS INSTRUMENT RACKS',
        tag: '/STUDIO/INSTRUMENTS/BASS',
        size: '~3MB',
        macros: 8,
        samples: 0,
        price: '$0.00',
        description: 'Digital and grit bass racks for deep low-end synthesis and aggressive bass tones.',
        specs: { latency: '<1ms', bitDepth: '32-BIT FLOAT', sampleRate: '48kHz', status: 'ENCRYPTED' }
    },
    {
        id: 'keys',
        title: 'KEYS INSTRUMENT RACKS',
        tag: '/STUDIO/INSTRUMENTS/KEYS',
        size: '~4MB',
        macros: 8,
        samples: 0,
        price: '$0.00',
        description: 'Entropy Keys with lo-fi tape warble textures and Berlin Pluck for warm melodic techno leads.',
        specs: { latency: '<1ms', bitDepth: '32-BIT FLOAT', sampleRate: '48kHz', status: 'LOGGED' }
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
    const [selectedPack, setSelectedPack] = useState<AbletonPack>(PACKS[0]);
    const [flicker, setFlicker] = useState(false);
    const [checkoutState, setCheckoutState] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        setErrorMessage(null);
        console.log(`Initializing checkout for ${selectedPack.title} at $${amount}`);

        try {
            // $0 = free download, skip Stripe
            if (amount === 0) {
                const response = await fetch('/.netlify/functions/free-download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ packId: selectedPack.id }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Download failed');
                }

                const data = await response.json();
                setDownloadUrl(data.downloadUrl);
                setCheckoutState('SUCCESS');
            } else {
                // $1+ = Stripe checkout
                const response = await fetch('/.netlify/functions/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        packId: selectedPack.id,
                        packTitle: selectedPack.title,
                        amount: amount,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Checkout failed');
                }

                const data = await response.json();
                // Redirect to Stripe Checkout
                window.location.href = data.checkoutUrl;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
            setCheckoutState('ERROR');
        }
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
                        {PACKS.map(pack => (
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

                        {checkoutState === 'SUCCESS' && downloadUrl && (
                            <div className="bg-red-500/10 p-6 border border-red-500 flex flex-col items-center text-center">
                                <div className="text-red-500 font-neo-brutalist text-xl mb-4 tracking-widest">DATA PACKET DECODED</div>
                                <div className="text-xs opacity-70 mb-6 font-mono">
                                    VERIFICATION COMPLETE. DOWNLOAD LINK GENERATED FOR:<br />
                                    {selectedPack.title}
                                </div>
                                <a
                                    href={downloadUrl}
                                    download
                                    className="w-full py-3 bg-red-500 text-white font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-colors text-center block"
                                >
                                    DOWNLOAD ARCHIVE
                                </a>
                                <div className="mt-2 text-[10px] opacity-40">
                                    Link expires in 30 minutes
                                </div>
                                <button
                                    className="mt-4 text-[10px] uppercase underline opacity-40 hover:opacity-100"
                                    onClick={() => {
                                        setCheckoutState('IDLE');
                                        setDownloadUrl(null);
                                    }}
                                >
                                    RETURN TO MARKETPLACE
                                </button>
                            </div>
                        )}

                        {checkoutState === 'ERROR' && (
                            <div className="bg-red-900/20 p-6 border border-red-900 flex flex-col items-center text-center">
                                <div className="text-red-500 font-neo-brutalist text-xl mb-4 tracking-widest">TRANSMISSION ERROR</div>
                                <div className="text-xs opacity-70 mb-6 font-mono">
                                    {errorMessage || 'An unknown error occurred'}
                                </div>
                                <button
                                    className="w-full py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold uppercase tracking-widest text-sm transition-colors"
                                    onClick={() => {
                                        setCheckoutState('IDLE');
                                        setErrorMessage(null);
                                    }}
                                >
                                    RETRY
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
