import React from 'react';
import { formatNumberWithCommas } from '@/lib/number-format';

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
    material,
    fulfillment_type,
    minimum_order_quantity,
    selected_shipping,
    selected_payments,
    paymentsTermsDescribed,
    shippingTermsDescribed,
  } = products || {};
  const listOf = (v: unknown) => (Array.isArray(v) && v.length ? v.join(', ') : null);
  const FULFILMENT: Record<string, string> = { pickup: 'Pickup', delivery: 'Delivery', both: 'Pickup and delivery' };

  const specifications = [
    { label: 'Material', value: material?.name },
    { label: 'Composition', value: composition },
    { label: 'Density', value: density },
    { label: 'Hardness', value: hardness },
    { label: 'Color', value: color },
    { label: 'Purity / Grade', value: purity_grade },
    { label: 'Max Moisture (%)', value: moisture_max === null || moisture_max === undefined ? null : `${moisture_max}%` },
    { label: 'Packaging', value: packaging },
    { label: 'Sampling Method', value: sampling_method },
    { label: 'Location', value: selected_state && selected_country_name ? `${selected_state}, ${selected_country_name}` : (selected_country_name || selected_state || 'N/A') },
    { label: 'Available Quantity', value: `${formatNumberWithCommas(quantity ?? 0)} ${measure || ''}` },
    { label: 'Minimum Order', value: minimum_order_quantity ? `${formatNumberWithCommas(Number(minimum_order_quantity))} ${measure || ''}` : null },
    { label: 'Fulfilment', value: FULFILMENT[fulfillment_type] },
    { label: 'Payment Terms', value: listOf(selected_payments) },
    { label: 'Payment Details', value: paymentsTermsDescribed },
    { label: 'Shipping Terms', value: listOf(selected_shipping) },
    { label: 'Shipping Details', value: shippingTermsDescribed },
  ];

  return (
    <div className="w-full py-6">
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/80 text-gray-700 uppercase text-xs font-bold border-b border-gray-200">
            <tr>
              <th className="px-6 py-3.5 w-1/2">Specifications</th>
              <th className="px-6 py-3.5 w-1/2 bg-white">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {specifications.map((spec, index) => (
              <tr key={index} className="hover:bg-gray-50/40 transition-colors">
                <td className="px-6 py-4 bg-gray-50/40 font-medium text-gray-600 border-b border-gray-100">
                  {spec.label}
                </td>
                <td className="px-6 py-4 bg-white text-gray-800 font-medium border-b border-gray-100">
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
