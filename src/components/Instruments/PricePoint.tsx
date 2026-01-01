import React, { useState } from 'react';

interface PricePointProps {
    initialPrice: string;
    onInitiateCheckout: (amount: number) => void;
}

export const PricePoint: React.FC<PricePointProps> = ({ initialPrice, onInitiateCheckout }) => {
    const [amount, setAmount] = useState<string>(initialPrice.replace('$', ''));
    const [isHovered, setIsHovered] = useState(false);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        setAmount(value);
    };

    const handleCheckout = () => {
        const numericAmount = parseFloat(amount) || 0;
        onInitiateCheckout(numericAmount);
    };

    return (
        <div className="bg-white/5 p-4 border border-white/10">
            <div className="flex justify-between items-end mb-4">
                <span className="ledger-label p-0 m-0">VALUATION ENTRY (USD)</span>
                <span className="text-[10px] opacity-40">STATION_AUTH: 0x23</span>
            </div>

            <div className="price-input-container">
                <span className="currency-symbol">$</span>
                <input
                    type="text"
                    className="value-entry"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                />
            </div>

            <button
                className="w-full py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors uppercase tracking-widest text-sm font-bold relative overflow-hidden"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleCheckout}
            >
                <span className="relative z-10">INITIATE ACQUISITION</span>
                {isHovered && (
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                )}
            </button>

            <div className="mt-4 text-[10px] opacity-40 leading-tight">
                BY INITIATING DOWNLOAD, YOU AGREE TO THE SIGNAL-23 TERMS OF SERVICE. ALL DATA IS VERIFIED FOR INTEGRITY BEFORE TRANSMISSION. SECURE STRIPE GATEWAY WILL BE INITIALIZED.
            </div>
        </div>
    );
};
