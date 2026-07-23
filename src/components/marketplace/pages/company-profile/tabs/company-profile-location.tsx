import React from 'react';
import { MapPin, Store, Globe, ShieldCheck, Navigation } from 'lucide-react';
import LeafletMap from '@/components/marketplace/LeafletMap';

const CompanyProfileLocationTab = ({ products }: { products: any }) => {
  const { company_name, latitude, longitude, selected_state, selected_countryName, full_address, business_type, year_established } = products || {};

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const countryName = Array.isArray(selected_countryName) ? selected_countryName.join(', ') : (selected_countryName || 'Global');
  const locationQuery = full_address || `${company_name ? `${company_name}, ` : ''}${selected_state ? `${selected_state}, ` : ''}${countryName}`;
  const googleMapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(locationQuery)}&t=&z=12&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2  sm:px-6 md:px-0">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Location Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-2xl text-green-700">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{company_name || 'Verified Headquarters'}</h3>
              <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mt-1">
                <MapPin size={15} className="text-green-600 shrink-0" />
                <span>{full_address || `${selected_state ? `${selected_state}, ` : ''}${countryName}`}</span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200/60 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified HQ Location</span>
          </div>
        </div>

        {/* Map Container - Leaflet or Google Map Embed */}
        <div className="p-3 bg-gray-50/50">
          {hasValidCoords ? (
            <LeafletMap
              lat={lat}
              lng={lng}
              zoom={12}
              popupText={company_name || "Company Location"}
              height="420px"
              className="rounded-xl overflow-hidden"
            />
          ) : (
            <div className="w-full h-[420px] rounded-xl overflow-hidden border border-gray-200/80 bg-white">
              <iframe
                title={`${company_name || 'Supplier'} Location Map`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={googleMapsUrl}
              />
            </div>
          )}
        </div>

        {/* Metadata Footer Grid */}
        <div className="p-6 md:p-8 bg-white grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-gray-100">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Country / Region</span>
            <span className="font-semibold text-gray-900 text-sm">{countryName}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Business Type</span>
            <span className="font-semibold text-gray-900 text-sm">{business_type || 'Supplier / Exporter'}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Established</span>
            <span className="font-semibold text-gray-900 text-sm">{year_established ? `${year_established}` : 'Verified Partner'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileLocationTab;
