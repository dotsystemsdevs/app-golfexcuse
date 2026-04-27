'use client';

import { useEffect, useRef, useState } from 'react';

export default function CountUp({ value, duration = 3500 }) {
  const [display, setDisplay] = useState(0);
  const lastValueRef = useRef(0);

  useEffect(() => {
    if (value === null || value === undefined) return;
    const target = Number(value) || 0;
    const start = lastValueRef.current;
    lastValueRef.current = target;

    if (start === target) {
      setDisplay(target);
      return;
    }

    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display.toLocaleString('en-US')}</>;
}
