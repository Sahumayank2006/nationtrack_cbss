'use client';

import { useEffect, useRef, useState } from 'react';

export function ASCIICanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderTime, setRenderTime] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas = canvasEl as HTMLCanvasElement;

    const ctxMaybe = canvas.getContext('2d');
    if (!ctxMaybe) return;
    const ctx = ctxMaybe as CanvasRenderingContext2D;

    const charSize = 12;
    const densityChars = " .'`^,:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current.x = e.clientX - rect.left;
      mousePosRef.current.y = e.clientY - rect.top;
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const simpleNoise = (x: number, y: number, t: number) => {
      return (
        Math.sin(x * 0.05 + t) * Math.cos(y * 0.05 + t) +
        Math.sin(x * 0.01 - t) * Math.cos(y * 0.12) * 0.5
      );
    };

    function resize() {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;

      const width = rect.width;
      const height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }

    function render() {
      const start = performance.now();
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);
      ctx.font = `${charSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const colsCount = Math.ceil(width / charSize);
      const rowsCount = Math.ceil(height / charSize);

      for (let y = 0; y < rowsCount; y++) {
        if (y < rowsCount * 0.4) continue;

        for (let x = 0; x < colsCount; x++) {
          const posX = x * charSize;
          const posY = y * charSize;

          const dx = posX - mousePosRef.current.x;
          const dy = posY - mousePosRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const normalizedY = (rowsCount - y) / rowsCount;
          const noiseVal = simpleNoise(x, y, timeRef.current * 0.5);
          const mountainHeight =
            0.3 + Math.sin(x * 0.05 + timeRef.current * 0.1) * 0.1 + Math.cos(x * 0.2) * 0.05;

          let char = '';
          let alpha = 0;

          if (normalizedY < mountainHeight + noiseVal * 0.1) {
            const index = Math.floor(Math.abs(noiseVal) * densityChars.length);
            char = densityChars[index % densityChars.length];
            alpha = 1 - normalizedY * 2;
          }

          if (dist < 150 && char) {
            const lensStrength = 1 - dist / 150;
            if (Math.random() > 0.5) {
              char = Math.random() > 0.5 ? '0' : '1';
              ctx.fillStyle = `rgba(0, 0, 0, ${lensStrength})`;
            } else {
              ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
            }

            const shiftX = (dx / dist) * 10 * lensStrength;
            const shiftY = (dy / dist) * 10 * lensStrength;

            ctx.fillText(char, posX + charSize / 2 - shiftX, posY + charSize / 2 - shiftY);
          } else if (char) {
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
            ctx.fillText(char, posX + charSize / 2, posY + charSize / 2);
          }
        }
      }

      timeRef.current += 0.01;
      const duration = performance.now() - start;
      setRenderTime(duration);

      requestAnimationFrame(render);
    }

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);

    render();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative h-96 w-full overflow-hidden border-b border-gray-200 bg-white">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute bottom-6 left-6">
        <h2 className="mb-2 text-3xl font-light tracking-tight">
          System Architecture &
          <br />
          Visual Displacement
        </h2>
        <p className="font-mono text-xs text-gray-600">
          Exploring the delta between signal and noise.
        </p>
      </div>
      <div className="pointer-events-none absolute bottom-4 right-6 text-right font-mono text-xs text-gray-500">
        RENDER: <span>{renderTime.toFixed(1)}</span>ms
        <br />
        X: <span>{mousePos.x}</span> Y: <span>{mousePos.y}</span>
      </div>
    </div>
  );
}
