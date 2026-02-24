import React from 'react';
import { MapPin } from 'lucide-react';
import LeafletMap from '@/components/marketplace/LeafletMap';

const ProductLocationTab = ({ products }: { products: any }) => {
  const { latitude, longitude, selected_state, selected_country_name, product_name } = products || {};

  // Parse coordinates, ensuring they are valid numbers
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  return (
    <div className="py-8 w-full min-h-[400px]">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded-xl">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Product Origin</h3>
              <p className="text-sm text-gray-500 font-medium">
                {selected_state ? `${selected_state}, ` : ''}{selected_country_name || 'Location Varies'}
              </p>
            </div>
          </div>
        </div>

        {hasValidCoords ? (
          <LeafletMap
            lat={lat}
            lng={lng}
            zoom={10}
            popupText={`${product_name} Location`}
            height="450px"
          />
        ) : (
          <div className="w-full h-[400px] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-8">
            <div className="bg-white p-5 rounded-full shadow-sm mb-4">
              <MapPin className="w-12 h-12 text-gray-300" />
            </div>
            <h4 className="text-gray-900 font-bold mb-1">Precise Coordinates Not Available</h4>
            <p className="text-gray-500 text-sm max-w-sm">
              While the precise GPS coordinates aren't provided, this product is sourced from
              <span className="font-bold text-gray-700"> {selected_state ? `${selected_state}, ` : ''}{selected_country_name || 'various locations'}</span>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Processing Port</span>
            <span className="text-sm font-semibold text-gray-800">Lagos Port, Nigeria (Primary)</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Global Shipping</span>
            <span className="text-sm font-semibold text-gray-800">Available to 150+ Countries</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductLocationTab;
