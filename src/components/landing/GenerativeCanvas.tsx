'use client';

import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  isAgent: boolean;
  agentPhase: number;
  agentSpeed: number;
}

const COLORS = ['#FF3366', '#00FFCC', '#FFFF00', '#7000FF'];

export function GenerativeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiFreq, setUiFreq] = useState('432Hz');
  const [uiVel, setUiVel] = useState('0.00');

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas = canvasEl as HTMLCanvasElement;

    const ctxMaybe = canvas.getContext('2d', { alpha: false });
    if (!ctxMaybe) return;
    const ctx = ctxMaybe as CanvasRenderingContext2D;

    let width = canvas.parentElement?.clientWidth || 0;
    let height = canvas.parentElement?.clientHeight || 0;
    let particles: Particle[] = [];
    let time = 0;

    const mouse = {
      x: -1000,
      y: -1000,
      vx: 0,
      vy: 0,
      active: false,
    };
    let lastMouse = { x: -1000, y: -1000 };

    const config = {
      particleCount: typeof window !== 'undefined' && window.innerWidth > 768 ? 1500 : 800,
      baseSpeed: 1.5,
      mouseForce: 0.15,
      trailDecay: 0.08,
      colors: COLORS,
    };

    function resize() {
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight * 0.65;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      initParticles();
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < config.particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          size: Math.random() * 1.5 + 0.5,
          isAgent: i < config.particleCount * 0.1,
          agentPhase: Math.random() * Math.PI * 2,
          agentSpeed: Math.random() * 0.02 + 0.01,
        });
      }
    }

    function updateParticle(p: Particle, audioModulator: number) {
      let angle = p.x * 0.005 + p.y * 0.005 + time * 0.001;

      let chaos = Math.sin(time * 0.005) * audioModulator * 2;

      let fx = Math.cos(angle + chaos);
      let fy = Math.sin(angle - chaos);

      let dx = mouse.x - p.x;
      let dy = mouse.y - p.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 200 && mouse.active) {
        let force = (200 - dist) / 200;
        fx += mouse.vx * force * config.mouseForce;
        fy += mouse.vy * force * config.mouseForce;

        if (Math.random() > 0.95) {
          p.color = config.colors[Math.floor(Math.random() * config.colors.length)];
        }
      }

      if (p.isAgent) {
        p.agentPhase += p.agentSpeed;
        fx += Math.cos(p.agentPhase) * 2;
        fy += Math.sin(p.agentPhase * 0.8) * 2;
      }

      p.vx += fx * 0.1;
      p.vy += fy * 0.1;

      p.vx *= 0.95;
      p.vy *= 0.95;

      p.x += p.vx * config.baseSpeed;
      p.y += p.vy * config.baseSpeed;

      if (p.x < -50) p.x = width + 50;
      if (p.x > width + 50) p.x = -50;
      if (p.y < -50) p.y = height + 50;
      if (p.y > height + 50) p.y = -50;
    }

    function drawParticle(p: Particle) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    function animate() {
      time += 16;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(0, 0, 0, ${config.trailDecay})`;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'screen';

      let audioSim = Math.abs(Math.sin(time * 0.002) * Math.cos(time * 0.0005));

      if (time % 100 < 20) {
        let freq = 100 + Math.floor(audioSim * 800);
        setUiFreq(freq + 'Hz');
        let avgVel = Math.abs(mouse.vx) + Math.abs(mouse.vy);
        setUiVel((avgVel * 0.1).toFixed(2));
      }

      particles.forEach((p) => {
        updateParticle(p, audioSim);
        drawParticle(p);
      });

      mouse.vx *= 0.8;
      mouse.vy *= 0.8;

      requestAnimationFrame(animate);
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.vx = mouse.x - lastMouse.x;
      mouse.vy = mouse.y - lastMouse.y;
      mouse.active = true;
    }

    function handleMouseLeave() {
      mouse.active = false;
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
      mouse.vx = mouse.x - lastMouse.x;
      mouse.vy = mouse.y - lastMouse.y;
      mouse.active = true;
    }

    resize();

    const resizeObserver = new ResizeObserver(() => resize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    animate();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div
      className="relative w-full border-b border-black bg-black"
      style={{ minHeight: '500px', height: '65vh' }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" style={{ display: 'block' }} />
      <div className="pointer-events-none absolute bottom-4 right-4 text-right font-mono text-xs text-white/70">
        FREQ_BAND: <span>{uiFreq}</span>
        <br />
        VELOCITY_AVG: <span>{uiVel}</span>
        <br />
        [INTERACT TO INFLUENCE FIELD]
      </div>
    </div>
  );
}
