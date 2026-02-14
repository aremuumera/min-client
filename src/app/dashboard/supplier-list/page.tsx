import React from 'react';
import ListedProducts from '@/components/dashboard/Supplier/ListedProducts';

export const metadata = {
    title: 'Listed Products | MINMEG',
    description: 'Manage your listed products on MINMEG.',
};

export default function ListedProductsPage() {
    return <ListedProducts />;
}
