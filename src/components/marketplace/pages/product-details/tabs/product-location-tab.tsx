import React from 'react';
import { MapPin } from 'lucide-react';

const ProductLocationTab = ({ products }: { products: any }) => {
  const { latitude, longitude, selected_state, selected_country_name, product_name } = products || {};

  // Parse coordinates
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  // Compute map location query for Google Maps embed
  const locationString = [selected_state, selected_country_name].filter(Boolean).join(', ') || 'Nigeria';
  const mapSearchQuery = hasValidCoords ? `${lat},${lng}` : locationString;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&t=&z=${hasValidCoords ? 12 : 9}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="py-6 w-full">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded-xl border border-green-100">
              <MapPin className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight">Product Location & Origin</h3>
              <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">
                {selected_state ? `${selected_state}, ` : ''}{selected_country_name || 'Location Varies'}
              </p>
            </div>
          </div>
        </div>

        {/* Embedded Google Map */}
        <div className="w-full h-[320px] sm:h-[400px] rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 relative">
          <iframe
            title={`${product_name || 'Product'} Location Map`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={mapEmbedUrl}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Origin / State</span>
            <span className="text-sm font-semibold text-gray-800">{selected_state ? `${selected_state}, ` : ''}{selected_country_name || 'N/A'}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Global Delivery</span>
            <span className="text-sm font-semibold text-gray-800">Worldwide Freight & Shipping Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductLocationTab;
