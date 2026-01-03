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

        // Simple 3-stop gradient
        if (v < 0.5) {
            // Interpolate Purple (#240b36) to Teal (#25858e)
            const t = v * 2;
            const r = Math.round(36 * (1 - t) + 37 * t);
            const g = Math.round(11 * (1 - t) + 133 * t);
            const b = Math.round(54 * (1 - t) + 142 * t);
            return `rgb(${r},${g},${b})`;
        } else {
            // Interpolate Teal (#25858e) to Yellow (#fde725)
            const t = (v - 0.5) * 2;
            const r = Math.round(37 * (1 - t) + 253 * t);
            const g = Math.round(133 * (1 - t) + 231 * t);
            const b = Math.round(142 * (1 - t) + 37 * t);
            return `rgb(${r},${g},${b})`;
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            // Re-initialize buffer if size changed significantly
            if (!bufferCanvasRef.current || bufferCanvasRef.current.width !== canvas.width) {
                const newBuffer = document.createElement('canvas');
                newBuffer.width = canvas.width;
                newBuffer.height = canvas.height;
                const bCtx = newBuffer.getContext('2d', { alpha: false });
                if (bCtx) {
                    bCtx.fillStyle = '#0a001a';
                    bCtx.fillRect(0, 0, newBuffer.width, newBuffer.height);
                    // Copy old content if possible
                    if (bufferCanvasRef.current) {
                        bCtx.drawImage(bufferCanvasRef.current, 0, 0);
                    }
                }
                bufferCanvasRef.current = newBuffer;
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

        // 2. Draw new top line
        const barWidth = displayWidth / data.length;
        data.forEach((val, i) => {
            bCtx.fillStyle = getColor(val);
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
                width: '100%',
                height: '100%',
                display: 'block',
            }}
        />
    );
};

export default HeatmapVisualizer;
