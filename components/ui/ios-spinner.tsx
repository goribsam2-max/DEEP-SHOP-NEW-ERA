import React from 'react';
import { cn } from '../../lib/utils';

interface IosSpinnerProps {
  className?: string;
  size?: number;
  color?: string;
}

export const IosSpinner: React.FC<IosSpinnerProps> = ({ className, size = 18, color = 'currentColor' }) => {
  return (
    <div 
        className={cn("inline-block", className)} 
        style={{ width: size, height: size, color }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid"
        className="w-full h-full animate-[spin_1s_steps(12)_infinite]"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <g key={i} transform={`rotate(${i * 30} 50 50)`}>
            <rect
              x="47"
              y="20"
              rx="3"
              ry="3"
              width="6"
              height="16"
              fill="currentColor"
              opacity={1 - i / 12}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
