import React from 'react';
import { MapPin, Building2, Globe } from 'lucide-react';
import LeafletMap from '@/components/marketplace/LeafletMap';

const CompanyProfileLocationTab = ({ products }: { products: any }) => {
  const { storeProfile, latitude, longitude, selected_state, selected_country_name } = products || {};

  // Use product coordinates as a fallback if specific company coordinates aren't provided
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  return (
    <div className="py-8 w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-600 p-3 rounded-2xl shadow-lg shadow-green-100">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">{storeProfile?.company_name || 'Company Location'}</h3>
              <div className="flex items-center gap-2 text-gray-500 font-medium">
                <MapPin size={16} className="text-green-600" />
                <span>{selected_state ? `${selected_state}, ` : ''}{selected_country_name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Operational Status</span>
              <span className="text-sm font-bold text-green-600">Verified HQ</span>
            </div>
          </div>
        </div>

        <div className="p-2">
          {hasValidCoords ? (
            <LeafletMap
              lat={lat}
              lng={lng}
              zoom={12}
              popupText={storeProfile?.company_name || "Company Location"}
              height="500px"
              className="rounded-2xl"
            />
          ) : (
            <div className="w-full h-[400px] bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-center p-12">
              <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                <Globe className="w-12 h-12 text-gray-200 animate-pulse" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Map Preview Restricted</h4>
              <p className="text-gray-500 max-w-sm font-medium">
                The precise HQ location for <span className="text-green-600">{storeProfile?.company_name}</span> is verified by MINMEG but not publically pinned.
              </p>
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50/50 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Region</span>
            <span className="font-bold text-gray-800">{selected_country_name || 'Global'}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Business Type</span>
            <span className="font-bold text-gray-800">{storeProfile?.business_type || 'Exporters'}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Years Active</span>
            <span className="font-bold text-gray-800">{storeProfile?.year_established ? `${new Date().getFullYear() - storeProfile.year_established} Years` : 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyProfileLocationTab;
