"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

interface LeafletMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    popupText?: string;
    height?: string;
    className?: string;
}

const LeafletMap = ({
    lat,
    lng,
    zoom = 13,
    popupText,
    height = '400px',
    className = ""
}: LeafletMapProps) => {
    const [isClient, setIsClient] = React.useState(false);

    useEffect(() => {
        setIsClient(true);
        // Fix Leaflet icon issue in Next.js
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });
        }
    }, []);

    if (!isClient) {
        return (
            <div
                style={{ height }}
                className={`w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center ${className}`}
            >
                <span className="text-gray-400 font-medium">Loading Map...</span>
            </div>
        );
    }

    return (
        <div className={`w-full rounded-xl overflow-hidden shadow-sm border border-gray-100 ${className}`} style={{ height }}>
            <MapContainer
                center={[lat, lng]}
                zoom={zoom}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                {/* <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                /> */}
                <Marker position={[lat, lng]}>
                    {popupText && (
                        <Popup>
                            <div className="text-sm font-medium">{popupText}</div>
                        </Popup>
                    )}
                </Marker>
            </MapContainer>
        </div>
    );
};

export default LeafletMap;
