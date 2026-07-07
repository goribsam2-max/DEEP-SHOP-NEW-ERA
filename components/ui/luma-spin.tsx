import React from "react";

export const LumaSpin = () => {
  return (
    <div className="relative w-[65px] aspect-square flex items-center justify-center font-black text-xl text-gray-800 dark:text-gray-100 tracking-tighter transform scale-125">
        <span className="absolute rounded-[50px] animate-loaderAnim shadow-[inset_0_0_0_3px] shadow-[#ea580c] dark:shadow-[#ea580c]" />
        <span className="absolute rounded-[50px] animate-loaderAnim animation-delay shadow-[inset_0_0_0_3px] shadow-[#ea580c] dark:shadow-[#ea580c]" />
        
        <span className="z-10 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">VG</span>

        <style dangerouslySetInnerHTML={{__html:`
        @keyframes loaderAnim {
          0% {
            inset: 0 35px 35px 0;
          }
          12.5% {
            inset: 0 35px 0 0;
          }
          25% {
            inset: 35px 35px 0 0;
          }
          37.5% {
            inset: 35px 0 0 0;
          }
          50% {
            inset: 35px 0 0 35px;
          }
          62.5% {
            inset: 0 0 0 35px;
          }
          75% {
            inset: 0 0 35px 35px;
          }
          87.5% {
            inset: 0 0 35px 0;
          }
          100% {
            inset: 0 35px 35px 0;
          }
        }
        .animate-loaderAnim {
          animation: loaderAnim 2.5s infinite;
        }
        .animation-delay {
          animation-delay: -1.25s;
        }
      `}} />
  </div>
  );
};
