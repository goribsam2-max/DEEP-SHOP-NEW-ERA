import React from 'react';
import Icon from '../components/Icon';

const Logo: React.FC<{ className?: string, scale?: number, centerOrigin?: boolean }> = ({ className = '', scale = 1, centerOrigin = false }) => {
  return (
    <div 
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ transform: `scale(${scale})`, transformOrigin: centerOrigin ? 'center center' : 'left center' }}
    >
      <h1 
        className="lowercase text-[28px] tracking-tight mt-0.5 text-zinc-900 dark:text-white"
        style={{ 
          fontFamily: "'Comfortaa', 'Righteous', cursive", 
          fontWeight: 800, 
          letterSpacing: '-0.02em'
        }}
      >
        deep shop
      </h1>
    </div>
  );
};

export default Logo;
