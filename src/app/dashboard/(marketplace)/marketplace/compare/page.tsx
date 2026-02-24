"use client";

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/redux';
import { clearComparison, removeFromComparison } from '@/redux/features/comparison/comparison-slice';
import { X, ArrowLeft, Heart, ShoppingCart, Info } from 'lucide-react';
import Link from 'next/link';

const ComparisonPage = () => {
    const { comparisonList } = useAppSelector((state) => state.comparison);
    const dispatch = useAppDispatch();

    const getCurrencySymbol = (currency: string | undefined) => {
        switch (currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'NGN': return '₦';
            default: return '₦';
        }
    };

    const formatPrice = (price: any) => {
        if (!price) return '0.00';
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        if (isNaN(numPrice)) return '0.00';
        return numPrice.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    if (comparisonList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Info className="text-gray-400" size={40} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">No products to compare</h1>
                <p className="text-gray-600 mb-8 max-w-md">
                    Add some products from the marketplace to start comparing them side-by-side.
                </p>
                <Link
                    href="/dashboard/products/all-mineral-cp"
                    className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                >
                    <ArrowLeft size={18} />
                    Back to Marketplace
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link href="/dashboard/products/all-mineral-cp" className="text-sm text-green-600 font-medium flex items-center gap-1 hover:underline mb-2">
                        <ArrowLeft size={14} />
                        Back to Marketplace
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Compare Products</h1>
                </div>
                <button
                    onClick={() => dispatch(clearComparison())}
                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                >
                    Remove all items
                </button>
            </div>

            <div className="overflow-x-auto scrollbar-hide bg-white rounded-2xl shadow-sm border border-gray-100">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-gray-50/80 backdrop-blur-md p-6 text-left border-b border-gray-100 min-w-[200px] w-1/4">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Product Info</span>
                            </th>
                            {comparisonList.map((product) => (
                                <th key={product.id} className="p-6 border-b border-gray-100 min-w-[250px] relative group bg-white">
                                    <button
                                        onClick={() => dispatch(removeFromComparison(product.id))}
                                        className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-1.5 shadow-sm hover:bg-red-600 transition-colors z-10"
                                    >
                                        <X size={20} />
                                    </button>
                                    <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-4 border border-gray-100 flex items-center justify-center">
                                        {(() => {
                                            const firstImage: any = product?.images?.find(
                                                (img: any) => img?.url && !img.url.toLowerCase().endsWith('.mp4') && !img.url.toLowerCase().endsWith('.webm')
                                            ) || product?.images?.[0]; // Fallback to first if all are videos or none found

                                            const imgUrl: string = typeof firstImage === 'string' ? firstImage : firstImage?.url;

                                            if (imgUrl?.toLowerCase().endsWith('.mp4') || imgUrl?.toLowerCase().endsWith('.webm')) {
                                                return (
                                                    <video
                                                        src={imgUrl}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                                        muted
                                                    />
                                                );
                                            }
                                            return (
                                                <img
                                                    src={imgUrl || '/assets/logo5.png'}
                                                    alt={product.product_name}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                                />
                                            );
                                        })()}
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                                        {product.product_name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-2xl font-black text-green-700">
                                            {getCurrencySymbol(product.unitCurrency)}{formatPrice(product.real_price)}
                                        </span>
                                        <span className="text-sm text-gray-400">/ {product.measure}</span>
                                    </div>
                                    <Link
                                        href={`/dashboard/products/details/${product.id}/${product.product_name.replace(/\s+/g, '-')}`}
                                        className="block w-full text-center bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100 active:scale-95"
                                    >
                                        Contact Now
                                    </Link>
                                </th>
                            ))}
                            {/* Fill remaining slots up to 4 */}
                            {Array.from({ length: 4 - comparisonList.length }).map((_, i) => (
                                <th key={`empty-th-${i}`} className="p-6 border-b border-gray-100 min-w-[250px] bg-gray-50/30">
                                    <div className="aspect-square w-full rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 gap-2">
                                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-100 flex items-center justify-center text-2xl font-light">
                                            +
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-widest">Available slot</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <ComparisonRow label="Category" products={comparisonList} field="product_category" />
                        <ComparisonRow label="Sub Category" products={comparisonList} field="product_sub_category" placeholder="Not specified" />
                        <ComparisonRow label="Supplier" products={comparisonList} render={(p: any) => p.supplier?.company_name || 'Individual Supplier'} />
                        <ComparisonRow label="M.O.Q" products={comparisonList} render={(p: any) => `${p.quantity} ${p.measure}`} />
                        <ComparisonRow label="Delivery Period" products={comparisonList} field="delivery_period" placeholder="Not specified" />
                        <ComparisonRow label="Color" products={comparisonList} field="color" placeholder="Not specified" />
                        <ComparisonRow label="Composition" products={comparisonList} field="composition" placeholder="Not specified" />
                        <ComparisonRow label="Density" products={comparisonList} field="density" placeholder="Not specified" />
                        <ComparisonRow label="Hardness" products={comparisonList} field="hardness" placeholder="Not specified" />
                        <ComparisonRow label="Purity / Grade" products={comparisonList} field="purity_grade" placeholder="Not specified" />
                        <ComparisonRow label="Max Moisture" products={comparisonList} render={(p: any) => p.moisture_max ? `${p.moisture_max}%` : 'N/A'} />
                        <ComparisonRow label="Supply Type" products={comparisonList} render={(p: any) => p.supply_type ? p.supply_type.charAt(0).toUpperCase() + p.supply_type.slice(1) : 'Immediate'} />
                        <ComparisonRow label="Trade Scope" products={comparisonList} render={(p: any) => p.trade_scope ? p.trade_scope.charAt(0).toUpperCase() + p.trade_scope.slice(1) : 'Local'} />
                        <ComparisonRow label="Packaging" products={comparisonList} field="packaging" placeholder="Standard" />
                        <ComparisonRow label="Sampling" products={comparisonList} field="sampling_method" placeholder="Available on request" />
                        <ComparisonRow
                            label="Location"
                            products={comparisonList}
                            render={(p: any) => (
                                <div className="flex items-center gap-2">
                                    {p.country?.flagImage && <img src={p.country.flagImage} className="w-6 h-4 object-cover rounded-sm shadow-sm" alt="Flag" />}
                                    <span className="text-sm text-gray-700">
                                        {p.selected_state ? `${p.selected_state}, ` : ''}{p.selected_country_name || p.country?.name || 'Varies'}
                                    </span>
                                </div>
                            )}
                        />
                    </tbody>
                </table>
            </div>

            <div className="mt-12 bg-green-50 rounded-3xl p-8 border border-green-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="max-w-xl text-center md:text-left">
                    <h2 className="text-2xl font-extrabold text-green-900 mb-2">Need project-specific quotes?</h2>
                    <p className="text-green-700 font-medium">Create a Request for Quotation (RFQ) and let suppliers submit their best offers.</p>
                </div>
                <Link
                    href="/dashboard/rfqs/create"
                    className="bg-green-700 text-white px-10 py-4 rounded-2xl font-black hover:bg-green-800 transition-all shadow-xl shadow-green-200 active:scale-95 whitespace-nowrap"
                >
                    Create Multi-Product RFQ
                </Link>
            </div>
        </div>
    );
};

const ComparisonRow = ({ label, products, field, render, placeholder = '—' }: any) => (
    <tr className="hover:bg-gray-50/50 transition-colors">
        <td className="sticky left-0 z-10 bg-white p-6 border-b border-gray-50 font-bold text-gray-500 text-sm align-top shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
            {label}
        </td>
        {products.map((product: any) => (
            <td key={`row-${label}-${product.id}`} className="p-6 border-b border-gray-50 text-gray-900 font-semibold align-top">
                {render ? render(product) : (product[field] || placeholder)}
            </td>
        ))}
        {Array.from({ length: 4 - products.length }).map((_, i) => (
            <td key={`row-empty-${label}-${i}`} className="p-6 border-b border-gray-50 bg-gray-50/10"></td>
        ))}
    </tr>
);

export default ComparisonPage;
