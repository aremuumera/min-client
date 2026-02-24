
import React from 'react';

const ProductDetailTab = ({ products }: { products: any }) => {
  const {
    composition,
    density,
    hardness,
    selected_state,
    color,
    measure,
    quantity,
    selected_country_name,
    purity_grade,
    moisture_max,
    packaging,
    sampling_method,
  } = products || {};

  const specifications = [
    { label: 'Composition', value: composition },
    { label: 'Density', value: density },
    { label: 'Hardness', value: hardness },
    { label: 'Color', value: color },
    { label: 'Purity / Grade', value: purity_grade },
    { label: 'Max Moisture (%)', value: moisture_max ? `${moisture_max}%` : null },
    { label: 'Packaging', value: packaging },
    { label: 'Sampling Method', value: sampling_method },
    { label: 'Location', value: selected_state && selected_country_name ? `${selected_state}, ${selected_country_name}` : 'N/A' },
    { label: 'Available Quantity', value: quantity ? `${quantity} ${measure || ''}` : 'N/A' }
  ];

  return (
    <div className="w-full py-6">
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b">
            <tr>
              <th className="px-6 py-3 w-1/2">Specifications</th>
              <th className="px-6 py-3 w-1/2 bg-white">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {specifications.map((spec, index) => (
              <tr key={index}>
                <td className="px-6 py-4 bg-gray-50 font-medium text-gray-600 border-b border-white">
                  {spec.label}
                </td>
                <td className="px-6 py-4 bg-white text-gray-800">
                  {spec.value || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductDetailTab;
