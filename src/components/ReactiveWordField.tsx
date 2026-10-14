"use client";

import { useEffect, useRef } from "react";

const WORDS = [
  "GitHub",
  "Profile",
  "Stats",
  "Commits",
  "Stars",
  "PullRequests",
  "Issues",
  "Contributions",
  "Repositories",
  "Followers",
  "Streak",
  "Languages",
  "OpenSource",
  "README",
  "Build",
  "Share",
  "Create",
  "Explore",
];

type WordParticle = {
  word: string;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
};

type Ripple = {
  x: number;
  y: number;
  radius: number;
  strength: number;
};

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

export default function ReactiveWordField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: -1000, y: -1000, down: false, active: false };
    let particles: WordParticle[] = [];
    let ripples: Ripple[] = [];
    let frame = 0;
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let lastTrailAt = 0;

    const buildField = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.font = '500 6px "Segoe UI", Ubuntu, sans-serif';
      context.textBaseline = "middle";

      const random = seededRandom(width * 73856093 + height * 19349663);
      const nextParticles: WordParticle[] = [];
      const rowHeight = 10;

      for (let row = 0, y = 4; y < height + rowHeight; row += 1, y += rowHeight) {
        let x = row % 2 === 0 ? -18 : -42;

        while (x < width + 50) {
          const word = WORDS[Math.floor(random() * WORDS.length)];
          const measured = context.measureText(word).width;
          const jitter = (random() - 0.5) * 1.7;
          nextParticles.push({
            word,
            baseX: x,
            baseY: y + jitter,
            x,
            y: y + jitter,
            vx: 0,
            vy: 0,
            opacity: 0.1 + random() * 0.14,
          });
          x += measured + 3 + random() * 5;
        }
      }

      particles = nextParticles;
      ripples = [];
    };

    const addRipple = (x: number, y: number, strength = 1) => {
      ripples.push({ x, y, radius: 0, strength });
      if (ripples.length > 8) ripples.shift();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;

      if (pointer.down && event.timeStamp - lastTrailAt > 42) {
        addRipple(pointer.x, pointer.y, 0.38);
        lastTrailAt = event.timeStamp;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.down = true;
      pointer.active = true;
      addRipple(pointer.x, pointer.y, 1.15);
    };

    const onPointerUp = () => {
      pointer.down = false;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.down = false;
    };

    const render = () => {
      animationFrame = window.requestAnimationFrame(render);

      // A 30fps cap keeps the field inexpensive behind a content-heavy page.
      frame += 1;
      if (frame % 2 !== 0 && !reducedMotion.matches) return;

      context.clearRect(0, 0, width, height);
      context.font = '500 6px "Segoe UI", Ubuntu, sans-serif';
      context.textBaseline = "middle";

      if (!reducedMotion.matches) {
        for (const ripple of ripples) {
          ripple.radius += 10;
          ripple.strength *= 0.94;
        }
        ripples = ripples.filter(
          (ripple) => ripple.radius < 210 && ripple.strength > 0.035,
        );
      }

      for (const particle of particles) {
        if (!reducedMotion.matches) {
          if (pointer.active) {
            const dx = particle.x - pointer.x;
            const dy = particle.y - pointer.y;
            const distance = Math.hypot(dx, dy) || 1;
            const radius = pointer.down ? 150 : 105;

            if (distance < radius) {
              const force = (1 - distance / radius) * (pointer.down ? 2.1 : 0.72);
              particle.vx += (dx / distance) * force;
              particle.vy += (dy / distance) * force;
            }
          }

          for (const ripple of ripples) {
            const dx = particle.x - ripple.x;
            const dy = particle.y - ripple.y;
            const distance = Math.hypot(dx, dy) || 1;
            const edgeDistance = Math.abs(distance - ripple.radius);

            if (edgeDistance < 18) {
              const force = (1 - edgeDistance / 18) * ripple.strength * 1.9;
              particle.vx += (dx / distance) * force;
              particle.vy += (dy / distance) * force;
            }
          }

          particle.vx += (particle.baseX - particle.x) * 0.025;
          particle.vy += (particle.baseY - particle.y) * 0.025;
          particle.vx *= 0.86;
          particle.vy *= 0.86;
          particle.x += particle.vx;
          particle.y += particle.vy;
        }

        const displacement = Math.hypot(
          particle.x - particle.baseX,
          particle.y - particle.baseY,
        );
        const alpha = Math.min(0.42, particle.opacity + displacement * 0.004);
        context.fillStyle = `rgba(201, 209, 217, ${alpha})`;
        context.fillText(particle.word, particle.x, particle.y);
      }

      if (reducedMotion.matches) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };

    buildField();
    render();

    const onResize = () => {
      buildField();
      if (reducedMotion.matches) render();
    };
    const onMotionPreferenceChange = () => {
      if (!reducedMotion.matches && !animationFrame) render();
      if (reducedMotion.matches) render();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    reducedMotion.addEventListener("change", onMotionPreferenceChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="reactive-word-field"
      aria-hidden="true"
    />
  );
}
