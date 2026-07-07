import React from "react";
import { motion } from "framer-motion";

export type MascotState =
  | "idle"
  | "name-empty"
  | "name-typed"
  | "email"
  | "password"
  | "success"
  | "error"
  | "refer-idle"
  | "refer-hover";

interface MascotProps {
  state?: MascotState;
  showPassword?: boolean;
}

export const VibeMascot: React.FC<MascotProps> = ({
  state = "idle",
  showPassword,
}) => {
  const activeState = state === "password" && showPassword ? "password-peek" : state;

  const cBlue = "#0190D4";
  const cRed = "#E3001B";
  const cYellow = "#FCE300";
  const cWhite = "#FFFFFF";
  const cStroke = "#1a1a1a";

  // Simple bobbing animations
  const idleBob = {
    y: [0, 3, 0],
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
  };

  const typingBob = {
    y: [0, 2, 0],
    transition: { repeat: Infinity, duration: 0.3 }
  };

  const successJump = {
    y: [0, -15, 0],
    transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" }
  };

  const errorShake = {
    x: [-2, 2, -2, 2, 0],
    transition: { duration: 0.4 }
  };
  
  const getAnimation = () => {
    if (activeState === "success") return successJump;
    if (activeState === "error") return errorShake;
    if (["email", "name-empty", "name-typed"].includes(activeState)) return typingBob;
    return idleBob;
  };

  const isPeek = activeState === "password-peek";
  const isBlind = activeState === "password";
  const isHappy = activeState === "success";

  return (
    <div className="w-full flex justify-center mt-2 -mb-6 relative z-10 pointer-events-none select-none">
      <motion.svg
        width="200"
        height="230"
        viewBox="0 0 200 230"
        className="overflow-visible drop-shadow-xl"
        animate={getAnimation()}
      >
        <defs>
          <radialGradient id="pocketBase" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f4f4f5" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="100" cy="210" rx="45" ry="6" fill="rgba(0,0,0,0.15)" />

        {/* Legs / Feet */}
        <g style={{ transform: "translateY(5px)" }}>
           {/* Left Leg */}
           <path d="M 70 165 L 86 165 L 86 188 L 70 188 Z" fill={cBlue} stroke={cStroke} strokeWidth="2" strokeLinejoin="round" />
           <ellipse cx="78" cy="188" rx="14" ry="10" fill={cWhite} stroke={cStroke} strokeWidth="2" />
           {/* Right Leg */}
           <path d="M 114 165 L 130 165 L 130 188 L 114 188 Z" fill={cBlue} stroke={cStroke} strokeWidth="2" strokeLinejoin="round" />
           <ellipse cx="122" cy="188" rx="14" ry="10" fill={cWhite} stroke={cStroke} strokeWidth="2" />
        </g>

        {/* Body Group */}
        <g>
          {/* Torso */}
          <rect x="68" y="115" width="64" height="60" rx="15" fill={cBlue} stroke={cStroke} strokeWidth="2" />
          {/* Belly */}
          <circle cx="100" cy="145" r="23" fill={cWhite} stroke={cStroke} strokeWidth="2" />
          {/* Pocket */}
          <path d="M 83 145 A 17 17 0 0 0 117 145 Z" fill="url(#pocketBase)" stroke={cStroke} strokeWidth="2" />
        </g>

        {/* Head Group */}
        <g>
          {/* Blue Head */}
          <circle cx="100" cy="80" r="46" fill={cBlue} stroke={cStroke} strokeWidth="2" />
          {/* White Face */}
          <circle cx="100" cy="90" r="38" fill={cWhite} stroke={cStroke} strokeWidth="2" />

          {/* Eyes Base */}
          <g>
             <ellipse cx="89" cy="62" rx="10" ry="13" fill={cWhite} stroke={cStroke} strokeWidth="2" />
             <ellipse cx="111" cy="62" rx="10" ry="13" fill={cWhite} stroke={cStroke} strokeWidth="2" />
          </g>

          {/* Pupils / Expressions */}
          {isHappy ? (
            <g>
               <path d="M 83 62 Q 89 50 95 62" fill="none" stroke={cStroke} strokeWidth="2.5" strokeLinecap="round" />
               <path d="M 105 62 Q 111 50 117 62" fill="none" stroke={cStroke} strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : isPeek ? (
            <g>
               {/* Left eye closed */}
               <path d="M 83 62 Q 89 65 95 62" fill="none" stroke={cStroke} strokeWidth="2.5" strokeLinecap="round" />
               {/* Right eye peeking */}
               <circle cx="111" cy="62" r="2.5" fill={cStroke} />
            </g>
          ) : isBlind ? (
            <g>
               {/* Both eyes closed tightly */}
               <path d="M 81 62 L 97 62 M 85 58 L 93 66 M 85 66 L 93 58" fill="none" stroke={cStroke} strokeWidth="2" strokeLinecap="round" />
               <path d="M 103 62 L 119 62 M 107 58 L 115 66 M 107 66 L 115 58" fill="none" stroke={cStroke} strokeWidth="2" strokeLinecap="round" />
            </g>
          ) : (
            <g>
               <circle cx="89" cy="62" r="2.5" fill={cStroke} />
               <circle cx="111" cy="62" r="2.5" fill={cStroke} />
            </g>
          )}

          {/* Nose */}
          <circle cx="100" cy="74" r="6" fill={cRed} stroke={cStroke} strokeWidth="2" />
          <circle cx="98" cy="72" r="2" fill={cWhite} opacity="0.8" />

          {/* Philtrum */}
          <line x1="100" y1="80" x2="100" y2="98" stroke={cStroke} strokeWidth="2" />

          {/* Mouth */}
          <path 
            d={isHappy ? "M 70 95 Q 100 145 130 95 Z" : "M 75 95 Q 100 120 125 95"} 
            fill={isHappy ? cRed : "none"} 
            stroke={cStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
          />
          {isHappy && <path d="M 87 132 Q 100 120 113 132 Q 100 145 87 132 Z" fill="#ff7da2" />}

          {/* Whiskers */}
          <g stroke={cStroke} strokeWidth="1.5" strokeLinecap="round">
             <line x1="62" y1="75" x2="84" y2="80" />
             <line x1="60" y1="84" x2="84" y2="84" />
             <line x1="62" y1="93" x2="84" y2="88" />
             <line x1="138" y1="75" x2="116" y2="80" />
             <line x1="140" y1="84" x2="116" y2="84" />
             <line x1="138" y1="93" x2="116" y2="88" />
          </g>
        </g>

        {/* Collar & Bell */}
        <g>
          <rect x="62" y="117" width="76" height="7" rx="3.5" fill={cRed} stroke={cStroke} strokeWidth="2" />
          <circle cx="100" cy="127" r="7" fill={cYellow} stroke={cStroke} strokeWidth="2" />
          <line x1="94" y1="124" x2="106" y2="124" stroke={cStroke} strokeWidth="1.5" />
          <circle cx="100" cy="129" r="1.5" fill={cStroke} />
          <line x1="100" y1="131" x2="100" y2="134" stroke={cStroke} strokeWidth="1.5" />
        </g>

        {/* Arms */}
        <g>
           {/* Left Arm */}
           {isBlind || isPeek ? (
             <g>
                {/* Arm raised to eye */}
                <path d="M 75 135 Q 55 90 89 62" fill="none" stroke={cStroke} strokeWidth="20" strokeLinecap="round" />
                <path d="M 75 135 Q 55 90 89 62" fill="none" stroke={cBlue} strokeWidth="16" strokeLinecap="round" />
                <circle cx="89" cy="62" r="12" fill={cWhite} stroke={cStroke} strokeWidth="2" />
             </g>
           ) : isHappy ? (
             <g>
                <path d="M 75 135 Q 45 120 40 85" fill="none" stroke={cStroke} strokeWidth="20" strokeLinecap="round" />
                <path d="M 75 135 Q 45 120 40 85" fill="none" stroke={cBlue} strokeWidth="16" strokeLinecap="round" />
                <circle cx="40" cy="85" r="12" fill={cWhite} stroke={cStroke} strokeWidth="2" />
             </g>
           ) : (
             <g>
                <path d="M 75 135 Q 60 145 42 150" fill="none" stroke={cStroke} strokeWidth="20" strokeLinecap="round" />
                <path d="M 75 135 Q 60 145 42 150" fill="none" stroke={cBlue} strokeWidth="16" strokeLinecap="round" />
                <circle cx="42" cy="150" r="12" fill={cWhite} stroke={cStroke} strokeWidth="2" />
             </g>
           )}

           {/* Right Arm */}
           {isBlind ? (
             <g>
                {/* Arm raised to eye */}
                <path d="M 125 135 Q 145 90 111 62" fill="none" stroke={cStroke} strokeWidth="20" strokeLinecap="round" />
                <path d="M 125 135 Q 145 90 111 62" fill="none" stroke={cBlue} strokeWidth="16" strokeLinecap="round" />
                <circle cx="111" cy="62" r="12" fill={cWhite} stroke={cStroke} strokeWidth="2" />
             </g>
           ) : isHappy ? (
             <g>
                <path d="M 125 135 Q 155 120 160 85" fill="none" stroke={cStroke} strokeWidth="20" strokeLinecap="round" />
                <path d="M 125 135 Q 155 120 160 85" fill="none" stroke={cBlue} strokeWidth="16" strokeLinecap="round" />
                <circle cx="160" cy="85" r="12" fill={cWhite} stroke={cStroke} strokeWidth="2" />
             </g>
           ) : (
             <g>
                <path d="M 125 135 Q 140 145 158 150" fill="none" stroke={cStroke} strokeWidth="20" strokeLinecap="round" />
                <path d="M 125 135 Q 140 145 158 150" fill="none" stroke={cBlue} strokeWidth="16" strokeLinecap="round" />
                <circle cx="158" cy="150" r="12" fill={cWhite} stroke={cStroke} strokeWidth="2" />
             </g>
           )}
        </g>
      </motion.svg>
    </div>
  );
};

