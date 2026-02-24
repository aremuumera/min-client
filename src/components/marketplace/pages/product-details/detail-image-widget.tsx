"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X, ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface MediaItem {
    url: string;
    type: 'image' | 'video' | 'document';
    position?: number;
}

interface DetailImageWidgetProps {
    images: (string | MediaItem)[];
}

export default function DetailImageWidget({ images }: DetailImageWidgetProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [verticalIndex, setVerticalIndex] = useState(0);
    const router = useRouter();

    // Safe check and formatting for images
    const validMedia: MediaItem[] = images?.length > 0
        ? images.map(img => typeof img === 'string' ? { url: img, type: 'image' } : img)
        : [{ url: '/assets/placeholder.png', type: 'image' }];

    const thumbnailHeight = 100; // Increased a bit for spacing
    const visibleThumbnails = 3;

    const verticalSliderStyle = {
        transform: `translateY(-${verticalIndex * thumbnailHeight}px)`,
        transition: "transform 0.5s ease-in-out",
    };

    const imageContainerStyle = {
        transform: `translateX(-${currentIndex * (100 / validMedia.length)}%)`,
        transition: "transform 0.5s ease-in-out",
    };

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % validMedia.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + validMedia.length) % validMedia.length);

    return (
        <div className="w-full h-full max-w-[800px] mx-auto">
            <div className="flex relative flex-col lg:flex-row justify-center gap-[20px] h-full">

                {/* Vertical Thumbs Desktop */}
                <div className="hidden lg:flex flex-col items-center gap-4 w-[110px] h-[400px] relative group/thumbs">
                    <button
                        onClick={() => setVerticalIndex(prev => Math.max(0, prev - 1))}
                        className={`absolute -top-4 bg-white shadow-lg p-1.5 z-20 rounded-full left-1/2 -translate-x-1/2 transition-opacity duration-200 ${verticalIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
                    >
                        <ChevronLeft className="rotate-90 text-gray-800" size={18} />
                    </button>

                    <div className="w-full h-full overflow-hidden py-1">
                        <div
                            style={verticalSliderStyle}
                            className="flex flex-col gap-4 items-center transition-transform duration-500"
                        >
                            {validMedia.map((media, j) => (
                                <div
                                    key={j}
                                    className={`w-20 h-20 rounded-xl cursor-pointer border-2 transition-all duration-200 overflow-hidden bg-gray-50 shrink-0 ${currentIndex === j ? 'border-green-600 shadow-md ring-2 ring-green-100' : 'border-transparent hover:border-gray-200'}`}
                                    onClick={() => setCurrentIndex(j)}
                                >
                                    {media.type === 'video' ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <video src={media.url} className="w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                <div className="bg-white/80 p-1.5 rounded-full">
                                                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-8 border-l-green-600 border-b-[5px] border-b-transparent ml-0.5" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={media.url}
                                            alt="Thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => setVerticalIndex(prev => Math.min(Math.max(0, validMedia.length - visibleThumbnails), prev + 1))}
                        className={`absolute -bottom-4 bg-white shadow-lg p-1.5 z-20 rounded-full left-1/2 -translate-x-1/2 transition-opacity duration-200 ${verticalIndex >= validMedia.length - visibleThumbnails ? 'opacity-0' : 'opacity-100'}`}
                    >
                        <ChevronLeft className="-rotate-90 text-gray-800" size={18} />
                    </button>
                </div>

                {/* Main Image Area */}
                <div className="relative flex-1 h-[400px] lg:h-[450px] rounded-3xl overflow-hidden bg-gray-50 group shadow-sm border border-gray-100">
                    {/* Mobile Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="sm:hidden absolute top-4 left-4 z-30 bg-black/40 hover:bg-black/60 rounded-full p-2.5 text-white backdrop-blur-md transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {/* Main Slider */}
                    <div className="w-full h-full flex" style={{ width: `${validMedia.length * 100}%`, ...imageContainerStyle }}>
                        {validMedia.map((media, i) => (
                            <div
                                className="relative w-full h-full flex items-center justify-center overflow-hidden"
                                style={{ width: `${100 / validMedia.length}%` }}
                                key={i}
                            >
                                {media.type === 'video' ? (
                                    <video
                                        src={media.url}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        controls
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src={media.url}
                                        alt="Product"
                                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Navigation Arrows */}
                    {validMedia.length > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute bg-white/90 hover:bg-white p-3 rounded-full left-4 top-1/2 -translate-y-1/2 border border-black/5 shadow-xl transition-all duration-300 transform -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 z-20"
                            >
                                <ChevronLeft className="text-gray-900" size={24} />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute bg-white/90 hover:bg-white p-3 rounded-full right-4 top-1/2 -translate-y-1/2 border border-black/5 shadow-xl transition-all duration-300 transform translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 z-20"
                            >
                                <ChevronRight className="text-gray-900" size={24} />
                            </button>
                        </>
                    )}

                    {/* Dots Indicator Overlay */}
                    <div className="absolute bottom-6 w-full flex justify-center gap-2 z-20">
                        {validMedia.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`h-1.5 transition-all duration-500 rounded-full ${currentIndex === i ? "bg-white w-8" : "bg-white/40 w-1.5 hover:bg-white/60"}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
