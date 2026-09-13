"use client";

import { useEffect, useRef } from "react";
import styles from "./PixelField.module.css";

const CELL_SIZE = 22;
const BRAND_BLUE = [27, 52, 232];

// A designed drift, not noise: each cell pulses on its own slow sine wave,
// offset by its position, so the whole field reads as one calm current
// moving through the grid rather than random flicker.
export default function PixelField({ className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let animationFrame;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL_SIZE) + 1;
      rows = Math.ceil(height / CELL_SIZE) + 1;
    }

    function drawFrame(time) {
      ctx.clearRect(0, 0, width, height);
      const t = time / 1400;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const wave =
            Math.sin(t + x * 0.35 + y * 0.5) * 0.5 +
            Math.sin(t * 0.6 - x * 0.2 + y * 0.15) * 0.5;
          const intensity = (wave + 1) / 2; // 0..1
          const alpha = 0.02 + intensity * 0.16;

          if (alpha < 0.03) continue;

          ctx.fillStyle = `rgba(${BRAND_BLUE[0]}, ${BRAND_BLUE[1]}, ${BRAND_BLUE[2]}, ${alpha})`;
          ctx.fillRect(
            x * CELL_SIZE + 1,
            y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          );
        }
      }

      animationFrame = requestAnimationFrame(drawFrame);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const wave = Math.sin(x * 0.35 + y * 0.5) * 0.5 + 0.5;
          const alpha = 0.03 + wave * 0.08;
          ctx.fillStyle = `rgba(${BRAND_BLUE[0]}, ${BRAND_BLUE[1]}, ${BRAND_BLUE[2]}, ${alpha})`;
          ctx.fillRect(
            x * CELL_SIZE + 1,
            y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          );
        }
      }
    }

    resize();
    if (prefersReducedMotion) {
      drawStatic();
    } else {
      animationFrame = requestAnimationFrame(drawFrame);
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) drawStatic();
    });
    resizeObserver.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvas} ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}
