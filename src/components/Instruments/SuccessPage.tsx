import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import '../../styles/instruments.css';

interface DownloadData {
    downloadUrl: string;
    expiresAt: string;
    packTitle: string;
    amount?: number;
    customerEmail?: string;
}

export const SuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            setErrorMessage('No session ID provided');
            return;
        }

        const verifyPayment = async () => {
            try {
                const response = await fetch('/.netlify/functions/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Verification failed');
                }

                const data = await response.json();
                setDownloadData(data);
                setStatus('success');
            } catch (error) {
                console.error('Verification error:', error);
                setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
                setStatus('error');
            }
        };

        verifyPayment();
    }, [sessionId]);

    return (
        <div className="archival-ledger-container">
            <div className="data-mesh-bg">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div key={i}>{Math.random().toString(16).substring(2, 10).toUpperCase()}</div>
                ))}
            </div>

            <div className="mt-4">
                <h1 className="ledger-h1">TRANSACTION VERIFICATION</h1>

                <div className="max-w-xl mx-auto">
                    {status === 'loading' && (
                        <div className="ledger-panel flex flex-col items-center justify-center p-12">
                            <div className="text-red-500 font-mono text-sm mb-4">VERIFYING TRANSACTION...</div>
                            <div className="w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {status === 'success' && downloadData && (
                        <div className="ledger-panel">
                            <div className="text-center mb-8">
                                <div className="text-red-500 font-neo-brutalist text-2xl mb-2 tracking-widest">
                                    TRANSMISSION COMPLETE
                                </div>
                                <div className="text-xs opacity-50 font-mono">
                                    PAYMENT VERIFIED • ARCHIVE DECRYPTED
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 border border-white/10 mb-6">
                                <span className="ledger-label">PACKAGE DETAILS</span>
                                <div className="text-lg font-bold mb-2">{downloadData.packTitle}</div>
                                {downloadData.amount && (
                                    <div className="ledger-metadata">
                                        AMOUNT: ${downloadData.amount.toFixed(2)} USD
                                    </div>
                                )}
                                {downloadData.customerEmail && (
                                    <div className="ledger-metadata">
                                        RECEIPT SENT TO: {downloadData.customerEmail}
                                    </div>
                                )}
                            </div>

                            <a
                                href={downloadData.downloadUrl}
                                download
                                className="w-full py-4 bg-red-500 text-white font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-colors text-center block mb-4"
                            >
                                DOWNLOAD ARCHIVE
                            </a>

                            <div className="text-center text-[10px] opacity-40 mb-6">
                                Link expires at {new Date(downloadData.expiresAt).toLocaleTimeString()}
                            </div>

                            <Link
                                to="/instruments"
                                className="block text-center text-xs uppercase underline opacity-40 hover:opacity-100"
                            >
                                RETURN TO MARKETPLACE
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="ledger-panel">
                            <div className="text-center mb-8">
                                <div className="text-red-500 font-neo-brutalist text-2xl mb-2 tracking-widest">
                                    TRANSMISSION ERROR
                                </div>
                                <div className="text-xs opacity-50 font-mono">
                                    {errorMessage || 'VERIFICATION FAILED'}
                                </div>
                            </div>

                            <Link
                                to="/instruments"
                                className="w-full py-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold uppercase tracking-widest text-sm transition-colors text-center block"
                            >
                                RETURN TO MARKETPLACE
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
