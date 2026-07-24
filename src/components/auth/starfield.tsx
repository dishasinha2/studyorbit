import { memo } from "react";

const stars = [
  [5, 9, 1], [16, 27, 1], [27, 12, 2], [49, 7, 1], [61, 23, 2], [74, 11, 1],
  [94, 66, 2], [81, 82, 1], [66, 73, 1], [42, 68, 1], [29, 83, 1], [14, 72, 2],
  [7, 46, 1], [72, 49, 1],
] as const;

export const Starfield = memo(function Starfield() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="auth-nebula" />
      {stars.map(([left, top, size], index) => (
        <span
          key={index}
          className="absolute rounded-full bg-[var(--ink)] opacity-[0.14]"
          style={{ width: size, height: size, left: `${left}%`, top: `${top}%` }}
        />
      ))}
    </div>
  );
});
