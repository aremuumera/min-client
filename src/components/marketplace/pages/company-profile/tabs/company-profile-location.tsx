
import React from 'react';
import { MapPin } from 'lucide-react';

const CompanyProfileLocationTab = ({ products }: { products: any }) => {
  return (
    <div className="py-12 flex flex-col items-center justify-center bg-white rounded-lg border border-dashed border-gray-200">
        <div className="p-4 bg-green-50 rounded-full mb-4">
             <MapPin className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-1">Company Location</h3>
        <p className="text-gray-500">Map view is currently unavailable</p>
    </div>
  )
}

export default CompanyProfileLocationTab;
