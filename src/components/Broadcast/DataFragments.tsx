import React, { useEffect, useRef } from 'react';
import { RingParams } from './types';

interface DataFragmentsProps {
    rings: RingParams[];
}

const dataPayloads = [
    "4 7 2 9 0 3 8 1 6 5",
    "ECHO DELTA FOXTROT",
    "MESSAGE FOLLOWS",
    "BINARY SEARCH COMPLETE",
    "NEURAL PATHWAY DETECTED",
    "SIGNAL EPHEMERAL",
    "NOTHING IN BETWEEN",
    "THIS PLACE IS NOT HONORED",
    "WHAT IS HERE IS DANGEROUS",
    "THE DANGER IS STILL PRESENT",
];

export const corruptText = (text: string, progress: number): string => {
    const glitchChars = "█▓▒░╔╗╚╝║═";
    return text.split('').map((char, i) => {
        const threshold = Math.random();
        if (progress > threshold * 0.8) {
            return Math.random() > 0.5
                ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
                : String.fromCharCode(char.charCodeAt(0) + Math.floor(Math.random() * 10 - 5));
        }
        return char;
    }).join('');
};

export const DataFragments: React.FC<DataFragmentsProps> = ({ rings }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.font = '14px "IBM Plex Mono", monospace';
            ctx.textAlign = 'center';

            rings.forEach(ring => {
                const text = corruptText(ring.payload, ring.progress);
                const opacity = 1 - ring.progress;

                ctx.fillStyle = `rgba(0, 255, 102, ${opacity})`;

                // Position along the ring
                const radius = ring.progress * (canvas.width * 0.4);
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;

                // Draw multiple copies around the circumference
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI / 2) + ring.progress * 2;
                    const x = centerX + Math.cos(angle) * (radius + 20);
                    const y = centerY + Math.sin(angle) * (radius + 20);

                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle + Math.PI / 2);
                    ctx.fillText(text, 0, 0);
                    ctx.restore();
                }
            });

            animationFrame = requestAnimationFrame(render);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        render();

        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', handleResize);
        };
    }, [rings]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 10
            }}
        />
    );
};
