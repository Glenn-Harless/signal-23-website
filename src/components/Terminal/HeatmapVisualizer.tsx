import React, { useEffect, useRef } from 'react';

interface HeatmapVisualizerProps {
    data: number[];
    isMobile: boolean;
}

const HeatmapVisualizer: React.FC<HeatmapVisualizerProps> = ({ data, isMobile }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Define Viridis-like color palette: Dark Purple -> Teal -> Yellow
    const getColor = (value: number) => {
        // value is 0-100
        const v = value / 100;
        // Monochromatic Cold War Green Scale
        const r = Math.round(0);
        const g = Math.round(20 + 235 * v);
        const b = Math.round(0);
        return `rgb(${r},${g},${b})`;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            // Skip if container hasn't been laid out yet
            if (rect.width === 0 || rect.height === 0) return;

            // On mobile, use full viewport width to ensure edge-to-edge coverage
            const targetWidth = isMobile ? window.innerWidth : rect.width;
            const targetHeight = rect.height;

            canvas.width = targetWidth * dpr;
            canvas.height = targetHeight * dpr;
            ctx.scale(dpr, dpr);

            // Re-initialize buffer if size changed significantly
            if (!bufferCanvasRef.current || bufferCanvasRef.current.width !== canvas.width) {
                const newBuffer = document.createElement('canvas');
                newBuffer.width = canvas.width;
                newBuffer.height = canvas.height;
                const bCtx = newBuffer.getContext('2d', { alpha: false });
                if (bCtx) {
                    bCtx.fillStyle = '#000b00';
                    bCtx.fillRect(0, 0, newBuffer.width, newBuffer.height);
                    // Copy old content if possible
                    if (bufferCanvasRef.current) {
                        bCtx.drawImage(bufferCanvasRef.current, 0, 0);
                    }
                }
                bufferCanvasRef.current = newBuffer;
            }
        };

        // Initial sizing with delay to ensure container is laid out
        handleResize();
        const retryTimeout = setTimeout(handleResize, 100);

        // Use ResizeObserver for more reliable sizing on mobile
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(canvas.parentElement || canvas);

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            clearTimeout(retryTimeout);
        };
    }, [isMobile]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const buffer = bufferCanvasRef.current;
        if (!canvas || !buffer) return;

        const ctx = canvas.getContext('2d');
        const bCtx = buffer.getContext('2d');
        if (!ctx || !bCtx) return;

        const width = canvas.width;
        const height = canvas.height;
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = width / dpr;
        const displayHeight = height / dpr;

        // 1. Shift buffer down
        const shiftAmount = 2; // Pixels to scroll each update
        bCtx.drawImage(buffer, 0, 0, width, height - shiftAmount, 0, shiftAmount, width, height - shiftAmount);

        // 2. Draw new top line with signal degradation across whole width
        const barWidth = displayWidth / data.length;
        data.forEach((val, i) => {
            let adjustedVal = val;

            // Apply signal degradation effect across entire heatmap
            // Random dropout chance (sparse static bursts)
            if (Math.random() < 0.15) {
                adjustedVal = Math.random() * 20; // Static burst
            } else if (Math.random() < 0.25) {
                // Signal flutter - random intensity variation
                adjustedVal = val * (0.5 + Math.random() * 0.5);
            }
            // Occasional signal spikes
            if (Math.random() < 0.05) {
                adjustedVal = Math.min(100, val + Math.random() * 40);
            }

            bCtx.fillStyle = getColor(adjustedVal);
            bCtx.fillRect(i * barWidth * dpr, 0, barWidth * dpr, shiftAmount);
        });

        // 3. Draw buffer to main canvas
        ctx.drawImage(buffer, 0, 0, width, height, 0, 0, displayWidth, displayHeight);
    }, [data]);

    return (
        <canvas
            ref={canvasRef}
            className="heatmap-canvas"
            style={{
                width: isMobile ? '100vw' : '100%',
                height: '100%',
                display: 'block',
            }}
        />
    );
};

export default HeatmapVisualizer;
