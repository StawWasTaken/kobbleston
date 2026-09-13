"use client";

import { useEffect, useRef, useState } from "react";

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

export default function StatCounter({
  value,
  label,
  loading,
  numberClassName,
  labelClassName,
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (loading) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateTo(value);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, loading]);

  function animateTo(target) {
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  return (
    <div ref={ref}>
      <div className={numberClassName} style={{ fontVariantNumeric: "tabular-nums" }}>
        {loading ? "—" : formatCompact(displayValue)}
      </div>
      <div className={labelClassName}>{label}</div>
    </div>
  );
}
