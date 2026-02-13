'use client';

import { useEffect, useState } from 'react';

export interface UserLocation {
  country: string | null;
  countryCode?: string | null;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  ip: string | null;
  postal?: string | null;
  timezone?: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to detect user's location
 * Uses multiple methods: IP-based geolocation and browser geolocation API
 */
export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation>({
    country: null,
    state: null,
    city: null,
    latitude: null,
    longitude: null,
    ip: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    detectUserLocation();
  }, []);

  const detectUserLocation = async () => {
    try {
      // Method 1: IP-based geolocation (Most reliable for getting country/state)
      await getLocationFromIP();
    } catch (error) {
      console.error('Failed to get location from IP:', error);

      // Method 2: Fallback to browser geolocation API
      try {
        await getLocationFromBrowser();
      } catch (browserError) {
        console.error('Failed to get location from browser:', browserError);
        setLocation((prev) => ({
          ...prev,
          loading: false,
          error: 'Unable to detect location',
        }));
      }
    }
  };

  // Method 1: Get location from IP using ipapi.co (free, no API key needed)
  const getLocationFromIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');

      if (!response.ok) {
        throw new Error('IP location API failed');
      }

      const data = await response.json();

      const locationData: UserLocation = {
        country: data.country_name,
        countryCode: data.country_code,
        state: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        ip: data.ip,
        postal: data.postal,
        timezone: data.timezone,
        loading: false,
        error: null,
      };

      setLocation(locationData);

      // Save to localStorage for future use
      localStorage.setItem(
        'userLocation',
        JSON.stringify({
          ...locationData,
          timestamp: Date.now(),
        })
      );

      return data;
    } catch (error) {
      throw error;
    }
  };

  // Method 2: Get location from browser's geolocation API
  const getLocationFromBrowser = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get address
          try {
            const address = await reverseGeocode(latitude, longitude);

            setLocation({
              country: address.country,
              state: address.state,
              city: address.city,
              latitude,
              longitude,
              ip: null,
              loading: false,
              error: null,
            });

            resolve(address);
          } catch (error) {
            // Even if reverse geocoding fails, we have coordinates
            setLocation({
              country: null,
              state: null,
              city: null,
              latitude,
              longitude,
              ip: null,
              loading: false,
              error: null,
            });
            resolve({ latitude, longitude });
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      // Using OpenStreetMap's Nominatim (free, no API key)
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();

      return {
        country: data.address.country,
        state: data.address.state,
        city: data.address.city || data.address.town || data.address.village,
      };
    } catch (error) {
      throw error;
    }
  };

  return location;
};

/**
 * Alternative: Get location from localStorage if exists (cached)
 */
export const getCachedLocation = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('userLocation');
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is less than 24 hours old
      const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
      return isRecent ? data : null;
    }
  } catch (error) {
    console.error('Error reading cached location:', error);
  }
  return null;
};

/**
 * Component wrapper example for showing location-based content
 */
export const LocationDetector = ({ children, onLocationDetected }: { children: React.ReactNode, onLocationDetected?: (loc: UserLocation) => void }) => {
  const location = useUserLocation();

  useEffect(() => {
    if (!location.loading && location.country && onLocationDetected) {
      onLocationDetected(location);
    }
  }, [location, onLocationDetected]);

  if (location.loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Detecting your location...</p>
      </div>
    );
  }

  return <>{children}</>;
};
