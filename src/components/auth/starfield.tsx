"use client";

import { useState } from "react";

type Star = {
  id: number;
  size: number;
  top: number;
  left: number;
  delay: number;
};

export function Starfield() {
  const [stars] = useState<Star[]>(() => {
    const generated: Star[] = [];
    for (let i = 0; i < 90; i++) {
      generated.push({
        id: i,
        size: Math.random() * 2 + 0.6,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 3.5,
      });
    }
    return generated;
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white opacity-20 animate-pulse"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            animationDelay: `${star.delay}s`,
            animationDuration: "3.5s",
          }}
        />
      ))}
    </div>
  );
}


