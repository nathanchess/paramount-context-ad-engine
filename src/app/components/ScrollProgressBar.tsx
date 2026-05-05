"use client";

import { useEffect, useState } from "react";

function getScrollProgress(): number {
  if (typeof document === "undefined") return 0;
  const root = document.documentElement;
  const maxScroll = root.scrollHeight - root.clientHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(1, Math.max(0, root.scrollTop / maxScroll));
}

/**
 * Fixed top bar that fills with black proportional to vertical scroll depth.
 * Shrinks when scrolling back up. Hidden when the page is not scrollable.
 */
export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const update = () => {
      setProgress(getScrollProgress());
      const root = document.documentElement;
      setScrollable(root.scrollHeight > root.clientHeight + 1);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(document.documentElement);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, []);

  if (!scrollable) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent"
      aria-hidden
    >
      <div
        className="h-full w-full origin-left bg-black will-change-[transform]"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
