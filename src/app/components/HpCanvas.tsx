"use client";

import { useEffect, useRef } from 'react';

export default function HpCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener('resize', resize);

    const rand = (a: number, b: number) => Math.random() * (b - a) + a;

    // ── Stars ──
    const stars: { x: number; y: number; r: number; a: number; da: number; gold: boolean }[] = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: rand(0, W), y: rand(0, H),
        r: rand(0.4, 2.2),
        a: rand(0.2, 1),
        da: rand(0.003, 0.012) * (Math.random() < 0.5 ? 1 : -1),
        gold: Math.random() < 0.6,
      });
    }

    // ── Floating orbs ──
    const orbs: { x: number; y: number; vx: number; vy: number; r: number; a: number; gold: boolean }[] = [];
    for (let i = 0; i < 18; i++) {
      orbs.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.2, 0.2), vy: rand(-0.4, -0.1),
        r: rand(3, 10),
        a: rand(0.05, 0.25),
        gold: Math.random() < 0.65,
      });
    }

    // ── Shooting stars ──
    const shoots: { x: number; y: number; vx: number; vy: number; len: number; a: number; life: number }[] = [];
    let nextShoot = rand(60, 150);

    // ── Magic sparks ──
    const sparks: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; gold: boolean }[] = [];
    for (let i = 0; i < 40; i++) {
      sparks.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.3, 0.3), vy: rand(-0.6, -0.1),
        life: rand(0, 120), maxLife: rand(80, 160),
        gold: Math.random() < 0.7,
      });
    }

    let frame = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.25, 0, W * 0.5, H * 0.6, Math.max(W, H) * 0.9);
      bg.addColorStop(0, '#1a1030');
      bg.addColorStop(0.4, '#0d0820');
      bg.addColorStop(0.8, '#060410');
      bg.addColorStop(1, '#020108');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle purple nebula
      const neb = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.4);
      neb.addColorStop(0, 'rgba(80,30,140,0.12)');
      neb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, W, H);

      const neb2 = ctx.createRadialGradient(W * 0.75, H * 0.6, 0, W * 0.75, H * 0.6, W * 0.35);
      neb2.addColorStop(0, 'rgba(140,80,20,0.08)');
      neb2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (const s of stars) {
        s.a += s.da;
        if (s.a > 1 || s.a < 0.1) s.da *= -1;
        ctx.save();
        ctx.globalAlpha = s.a;
        ctx.fillStyle = s.gold ? '#f0d080' : '#c8b0ff';
        ctx.shadowBlur = s.r * 4;
        ctx.shadowColor = s.gold ? 'rgba(201,168,76,0.8)' : 'rgba(166,125,232,0.8)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Floating orbs
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy;
        if (o.y < -20) { o.y = H + 20; o.x = rand(0, W); }
        if (o.x < -20) o.x = W + 20;
        if (o.x > W + 20) o.x = -20;
        ctx.save();
        ctx.globalAlpha = o.a;
        const og = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 5);
        og.addColorStop(0, o.gold ? 'rgba(201,168,76,0.9)' : 'rgba(124,77,189,0.9)');
        og.addColorStop(0.3, o.gold ? 'rgba(201,168,76,0.3)' : 'rgba(124,77,189,0.3)');
        og.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = og;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Sparks
      for (const sp of sparks) {
        sp.x += sp.vx; sp.y += sp.vy;
        sp.life++;
        if (sp.life > sp.maxLife || sp.y < -10) {
          sp.x = rand(0, W); sp.y = H + 5;
          sp.life = 0; sp.maxLife = rand(80, 160);
          sp.vx = rand(-0.3, 0.3); sp.vy = rand(-0.6, -0.1);
        }
        const progress = sp.life / sp.maxLife;
        const alpha = progress < 0.2 ? progress * 5 : progress > 0.8 ? (1 - progress) * 5 : 1;
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = sp.gold ? 'rgba(240,208,128,0.9)' : 'rgba(180,140,255,0.9)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 4;
        ctx.shadowColor = sp.gold ? 'rgba(201,168,76,0.6)' : 'rgba(124,77,189,0.6)';
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x - sp.vx * 6, sp.y - sp.vy * 6);
        ctx.stroke();
        ctx.restore();
      }

      // Shooting stars
      nextShoot--;
      if (nextShoot <= 0) {
        shoots.push({
          x: rand(W * 0.1, W * 0.8), y: rand(0, H * 0.35),
          vx: rand(5, 10), vy: rand(2, 5),
          len: rand(100, 200), a: 1, life: 0,
        });
        nextShoot = rand(90, 220);
      }
      for (let i = shoots.length - 1; i >= 0; i--) {
        const s = shoots[i];
        s.x += s.vx; s.y += s.vy; s.life++;
        s.a = Math.max(0, 1 - s.life / 40);
        if (s.a <= 0 || s.x > W + 100) { shoots.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = s.a;
        const sg = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 15, s.y - s.vy * 15);
        sg.addColorStop(0, 'rgba(255,240,180,1)');
        sg.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.strokeStyle = sg;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(201,168,76,0.8)';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 15, s.y - s.vy * 15);
        ctx.stroke();
        ctx.restore();
      }

      // Vignette
      const vig = ctx.createRadialGradient(W/2, H/2, H * 0.25, W/2, H/2, H * 0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none', display: 'block',
      }}
    />
  );
}
