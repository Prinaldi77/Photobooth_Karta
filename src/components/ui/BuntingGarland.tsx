'use client';

import React from 'react';

export const BuntingGarland: React.FC = () => {
  const flags = Array.from({ length: 34 }).map((_, i) => {
    const t = i / 33;
    const x = t * 1200;
    const flagY = 6 + 28 * (4 * t * (1 - t));
    const colors = ['#C8102E', '#FFFBF2', '#D9A441'];
    const color = colors[i % 3];
    const delay = `${(i % 5) * 0.2}s`;

    return (
      <g
        key={i}
        className="flag origin-top animate-sway"
        style={{
          transform: `translate(${x}px, ${flagY}px)`,
          animationDelay: delay,
        }}
      >
        <path
          d="M-7,0 L7,0 L0,15 Z"
          fill={color}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="0.5"
        />
      </g>
    );
  });

  return (
    <div className="w-full h-[46px] overflow-hidden relative bg-[#161F33]" aria-hidden="true">
      <svg viewBox="0 0 1200 46" preserveAspectRatio="none" className="w-full h-full block">
        <path d="M0,6 Q600,34 1200,6" fill="none" stroke="#D9A441" strokeWidth="2" opacity="0.7" />
      </svg>
      <svg viewBox="0 0 1200 46" className="absolute top-0 left-0 w-full h-full block pointer-events-none">
        {flags}
      </svg>
    </div>
  );
};
