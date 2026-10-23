"use client";

import React, { useState } from "react";
import { LogoLoader, FullscreenLogoLoader } from "@/components/ui/logo-loader";
import { Play, RefreshCw, Sun, Moon, Maximize2 } from "lucide-react";

export default function TestLogoLoaderPage() {
  const [isDark, setIsDark] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isLooping, setIsLooping] = useState(true);

  const handleReplay = () => {
    setReplayKey((prev) => prev + 1);
  };

  return (
    <div className={`min-h-screen p-6 md:p-12 transition-colors duration-300 ${isDark ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SVG Logo Loader Demo</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Active self-forming brandmark: faceted diamond on left + <span className="font-bold text-emerald-700">Minmeg</span> typography + beam & pickaxe head on right.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReplay}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
            >
              <RefreshCw size={14} />
              Replay
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                isLooping
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-white text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-200"
              }`}
            >
              <Play size={14} />
              Loop: {isLooping ? "ON" : "OFF"}
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-colors"
              title="Toggle Dark/Light"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => setShowFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-colors"
            >
              <Maximize2 size={14} />
              Splash Modal
            </button>
          </div>
        </div>

        {/* Big Featured Preview (XL) */}
        <div
          key={`featured-${replayKey}`}
          className={`p-12 rounded-2xl border flex flex-col items-center justify-center min-h-[300px] transition-all ${
            isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
          }`}
        >
          <LogoLoader
            size="xl"
            loop={isLooping}
            label="Authenticating Platform..."
          />
          <p className="mt-8 text-xs font-medium uppercase tracking-widest text-gray-400">
            Extra Large (XL) Hero / Splash Variant
          </p>
        </div>

        {/* Size Variations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large */}
          <div
            key={`lg-${replayKey}`}
            className={`p-8 rounded-xl border flex flex-col items-center justify-center min-h-[220px] ${
              isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
            }`}
          >
            <LogoLoader
              size="lg"
              loop={isLooping}
              label="Loading Details..."
            />
            <span className="mt-6 text-xs text-gray-400 font-semibold">Large (LG)</span>
          </div>

          {/* Medium */}
          <div
            key={`md-${replayKey}`}
            className={`p-8 rounded-xl border flex flex-col items-center justify-center min-h-[220px] ${
              isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
            }`}
          >
            <LogoLoader
              size="md"
              loop={isLooping}
              label="Fetching Data..."
            />
            <span className="mt-6 text-xs text-gray-400 font-semibold">Medium (MD) — Standard</span>
          </div>

          {/* Small */}
          <div
            key={`sm-${replayKey}`}
            className={`p-8 rounded-xl border flex flex-col items-center justify-center min-h-[220px] ${
              isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
            }`}
          >
            <LogoLoader
              size="sm"
              loop={isLooping}
            />
            <span className="mt-6 text-xs text-gray-400 font-semibold">Small (SM) — Inline / Button</span>
          </div>
        </div>

      </div>

      {/* Fullscreen Splash Modal */}
      {showFullscreen && (
        <div onClick={() => setShowFullscreen(false)} className="cursor-pointer">
          <FullscreenLogoLoader text="Click anywhere to exit splash preview" />
        </div>
      )}
    </div>
  );
}
