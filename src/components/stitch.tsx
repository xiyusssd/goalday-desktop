import clsx from "clsx";
import { useStore } from "../store";
import type { View } from "./Sidebar";

// Original, Stitch-inspired artwork — hand-drawn SVG, NOT Disney assets.
// Everything here renders only while the "stitch" palette is active.

/** True when the cartoon Stitch styling should be shown. */
export function useStitch(): boolean {
  return useStore((s) => s.settings.palette === "stitch");
}

/** Little round big-eared blue creature — the app mark. Sits in the brand box. */
export function StitchLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      {/* ears (symmetric, gently tilted) */}
      <ellipse cx="7.2" cy="6.6" rx="2.1" ry="3.6" transform="rotate(-22 7.2 6.6)" fill="currentColor" />
      <ellipse cx="16.8" cy="6.6" rx="2.1" ry="3.6" transform="rotate(22 16.8 6.6)" fill="currentColor" />
      {/* head */}
      <ellipse cx="12" cy="13.8" rx="6.9" ry="6.1" fill="currentColor" />
      {/* eyes (big + round) */}
      <ellipse cx="9.4" cy="13" rx="1.8" ry="2.3" fill="#12354a" />
      <ellipse cx="14.6" cy="13" rx="1.8" ry="2.3" fill="#12354a" />
      <circle cx="10.05" cy="12.2" r="0.62" fill="#fff" />
      <circle cx="15.25" cy="12.2" r="0.62" fill="#fff" />
      {/* smile */}
      <path d="M9.7 16.4c1.3 1.2 3.3 1.2 4.6 0" stroke="#12354a" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** The cat logo as a clean circular badge — home hero + empty states. */
export function StitchMascot({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-block shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img src="/cat-logo.png" alt="mascot" className="h-full w-full scale-110 object-cover" />
    </span>
  );
}

/** Rounded, island-flavored nav glyphs (stroke paths) keyed by view. */
export const STITCH_NAV_ICONS: Record<View, string> = {
  // beach hut
  home: "M3 11l9-6 9 6M6 10v9h12v-9M10 19v-4h4v4",
  // sun
  daily: "M12 4.5V6M12 18v1.5M5 12H3.5M20.5 12H19M6.5 6.5l1 1M16.5 16.5l1 1M17.5 6.5l-1 1M7.5 16.5l-1 1M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z",
  // calendar with a wave
  week: "M4 6h16v13H4zM4 10h16M7 15c1-1.2 2-1.2 3 0s2 1.2 3 0 2-1.2 3 0",
  // open book
  journal: "M12 6c-2-1.5-5-1.5-7 0v12c2-1.5 5-1.5 7 0m0-12c2-1.5 5-1.5 7 0v12c-2-1.5-5-1.5-7 0m0-12v12",
  // coconut / piggy coin
  money: "M4 9c0-1.5 3-2.5 6-2.5S16 7.5 16 9v4c0 1.5-3 2.5-6 2.5S4 14.5 4 13V9zM16 10.5l3-1v4l-3-1M9 6.5V5",
  // dumbbell
  fitness: "M6.5 7v10M17.5 7v10M4 9.5v5M20 9.5v5M6.5 12h11",
  // palm-leaf notepad
  notes: "M7 4h8l3 3v13H7zM10 9c2 .5 4 .5 5 0M10 13c2 .5 4 .5 5 0M10 17c1.5.4 2.5.4 3 0",
  // rounded bars
  stats: "M5 20v-6M12 20V6M19 20v-9",
  // hibiscus flower
  settings: "M12 11.5a2 2 0 100 1 2 2 0 000-1zM12 10c-1-3 1-5 0-6.5C11 5 13 7 12 10zM12 14c1 3-1 5 0 6.5C13 19 11 17 12 14zM10.5 12c-3 1-5-1-6.5 0C5 13 7 11 10.5 12zM13.5 12c3-1 5 1 6.5 0C19 11 17 13 13.5 12z",
};

/** Paw print — replaces the checkmark inside a completed checkbox. */
export function PawMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} fill="currentColor">
      <ellipse cx="6" cy="8" rx="2.6" ry="2.1" />
      <circle cx="2.9" cy="5.2" r="1" />
      <circle cx="5" cy="3.6" r="1" />
      <circle cx="7" cy="3.6" r="1" />
      <circle cx="9.1" cy="5.2" r="1" />
    </svg>
  );
}
