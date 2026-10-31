"use client";

import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  loop?: boolean;
  label?: string;
}

export function LogoLoader({
  size = "md",
  className = "",
  loop = true,
  label,
}: LogoLoaderProps) {
  const [animationKey, setAnimationKey] = useState(0);

  // 4096 x 1398 (~2.93 : 1) aspect ratio of /MINMEG-logo-svg.svg
  const sizeMap = {
    sm: { width: 140, height: 48 },
    md: { width: 220, height: 75 },
    lg: { width: 320, height: 109 },
    xl: { width: 440, height: 150 },
  };

  const currentSize = typeof size === "number"
    ? { width: size * 2.93, height: size }
    : sizeMap[size] || sizeMap.md;

  // Auto-loop trigger
  useEffect(() => {
    if (!loop) return;
    const timer = setInterval(() => {
      setAnimationKey((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [loop]);

  // Logo Materialization & Forming Animation
  const logoFormVariants: Variants = {
    hidden: {
      clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
      opacity: 0,
      filter: "brightness(1.8) contrast(1.2)",
      scale: 0.94,
    },
    visible: {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      opacity: 1,
      filter: "brightness(1) contrast(1)",
      scale: 1,
      transition: {
        clipPath: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.4 },
        filter: { duration: 1.6, ease: "easeOut" },
        scale: { duration: 1.4, ease: "easeOut" },
      },
    },
  };

  // Light sweep ray scanning across the logo as it forms
  const sweepRayVariants: Variants = {
    hidden: {
      left: "-40%",
      opacity: 0,
    },
    visible: {
      left: "140%",
      opacity: [0, 0.8, 1, 0],
      transition: {
        delay: 0.6,
        duration: 1.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div
      key={animationKey}
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Exact SVG Logo Container */}
      <div
        className="relative overflow-hidden flex items-center justify-center"
        style={{
          width: currentSize.width,
          height: currentSize.height,
        }}
      >
        {/* Animated Forming of exact /MINMEG-logo-svg.svg */}
        <motion.div
          variants={logoFormVariants}
          initial="hidden"
          animate="visible"
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/MINMEG-logo-svg.svg"
            alt="MINMEG Logo"
            width={currentSize.width}
            height={currentSize.height}
            className="w-full h-full object-contain block pointer-events-none"
          />

          {/* Sweeping Light Ray */}
          <motion.div
            variants={sweepRayVariants}
            initial="hidden"
            animate="visible"
            className="absolute top-0 bottom-0 w-24 pointer-events-none bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg]"
          />
        </motion.div>
      </div>

      {/* Optional Subtitle / Loading label */}
      {label && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-3 text-xs font-semibold tracking-widest text-primary-700 uppercase text-center"
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}

/**
 * Fullscreen / Splash Overlay Logo Loader
 */
export function FullscreenLogoLoader({ text = "Loading Minmeg Platform..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[99999] bg-white/95 flex flex-col items-center justify-center p-4">
      <LogoLoader size="lg" loop={true} />
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="mt-6 text-sm font-bold text-primary-700 tracking-widest uppercase"
      >
        {text}
      </motion.p>
    </div>
  );
}
