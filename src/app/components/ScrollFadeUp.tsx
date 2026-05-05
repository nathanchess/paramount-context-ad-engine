"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const TOP_ORDER_EXTRA_MS = 200;
const DEFAULT_DURATION_MS = 750;
/** Start this many pixels below the final position, then move up with the fade. */
const REVEAL_OFFSET_PX = 48;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

type Props = {
  children: ReactNode;
  className?: string;
  /**
   * Lower numbers = higher on the page. The first blocks (0–2) get a short extra delay
   * so above-the-fold content does not pop in instantly on load.
   */
  order?: number;
  /** Additional delay before the fade starts (ms). */
  delayMs?: number;
};

export default function ScrollFadeUp({ children, className = "", order = 0, delayMs = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || doneRef.current) return;

    let timer: number | undefined;

    const runReveal = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const topBias = order <= 2 && !reduceMotion ? TOP_ORDER_EXTRA_MS : 0;
      const wait = reduceMotion ? 0 : delayMs + topBias;
      timer = window.setTimeout(() => {
        // Ensure the browser paints the initial translate + opacity before transitioning.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setVisible(true));
        });
      }, wait);
    };

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setReducedMotion(true);
      setVisible(true);
      doneRef.current = true;
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        runReveal();
        io.disconnect();
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );

    io.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      io.disconnect();
    };
  }, [order, delayMs]);

  const transition =
    reducedMotion ? "none" : visible
      ? `opacity ${DEFAULT_DURATION_MS}ms ${EASING}, transform ${DEFAULT_DURATION_MS}ms ${EASING}`
      : "none";

  const transform =
    reducedMotion || visible
      ? "translate3d(0, 0, 0)"
      : `translate3d(0, ${REVEAL_OFFSET_PX}px, 0)`;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: reducedMotion || visible ? 1 : 0,
        transform,
        transition,
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </div>
  );
}
