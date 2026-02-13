
import React from 'react';
import { MapPin } from 'lucide-react';

const ProductLocationTab = ({ products }: { products: any }) => {
    //  const { selected_state, selected_country_name } = products || {};
    // Note: The original generic code just rendered the map image.
    // I will keep it simple but could be expanded.

  return (
    <div className="py-8 flex flex-col items-center justify-center w-full min-h-[300px] bg-gray-50 rounded-lg">
         <div className="flex flex-col items-center gap-4">
             <div className="bg-white p-4 rounded-full shadow-sm">
                 <MapPin className="w-10 h-10 text-green-600" />
             </div>
             <p className="text-gray-500 font-medium">Map View Integration Coming Soon</p>
             {/* Use specific map image if available */}
             {/* <img src={'/mapInfo.png'} alt="Map Location" className="max-w-full rounded-lg shadow-md" />   */}
         </div>
    </div>
  )
}

export default ProductLocationTab
