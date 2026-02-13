import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/baseApi';

export const supplierProductApi = createApi({
    reducerPath: 'supplierProductApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Product', 'StoreProfile'],
    endpoints: (builder) => ({
        validateProductStep: builder.mutation({
            query: ({ supplierId, body }) => ({
                url: `/suppliers/${supplierId}/products/validate`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Product'],
        }),
        createProduct: builder.mutation({
            query: ({ supplierId, body }) => ({
                url: `/suppliers/${supplierId}/products/publish`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Product'],
        }),
        getAllProduct: builder.query({
            query: (params) => {
                const {
                    limit,
                    page,
                    sort,
                    search,
                    category,
                    mainCategory,
                    country,
                    state,
                    subCategory,
                    supplierId,
                    minPrice,
                    maxPrice,
                    profileId,
                    measure,
                    quantity,
                    review,
                } = params;
                const queryParams = new URLSearchParams();
                if (limit) queryParams.append('limit', typeof limit === 'string' ? limit : limit.toString());
                if (page) queryParams.append('page', typeof page === 'string' ? page : page.toString());
                if (sort) queryParams.append('sort', sort);
                if (category) queryParams.append('category', category);
                if (mainCategory) queryParams.append('mainCategory', mainCategory);
                if (subCategory) queryParams.append('subCategory', subCategory);
                if (supplierId) queryParams.append('supplierId', supplierId);
                if (profileId) queryParams.append('profileId', profileId);
                if (search) queryParams.append('search', search);
                if (country) queryParams.append('country', country);
                if (state) queryParams.append('state', state);
                if (minPrice) queryParams.append('minPrice', minPrice);
                if (maxPrice) queryParams.append('maxPrice', maxPrice);
                if (measure) queryParams.append('measure', measure);
                if (quantity) queryParams.append('minQuantity', quantity);
                if (review) queryParams.append('review', review);

                return `/products/all?${queryParams.toString()}`;
            },
            providesTags: ['Product'],
        }),
        getAllProductBySupplierId: builder.query({
            query: (params) => {
                const { limit, page, sort, q, category, supplierId } = params;
                const queryParams = new URLSearchParams();
                if (limit) queryParams.append('limit', typeof limit === 'string' ? limit : limit.toString());
                if (page) queryParams.append('page', typeof page === 'string' ? page : page.toString());
                if (sort) queryParams.append('sort', sort);
                if (category) queryParams.append('category', category);
                if (q) queryParams.append('q', q);

                return `/suppliers/${supplierId}/products?${queryParams.toString()}`;
            },
            providesTags: ['Product'],
        }),
        getAllProductDetails: builder.query({
            query: ({ productId }) => `/products/${productId}/detail`,
            providesTags: ['Product'],
        }),
        getAllProductDetailsForSup: builder.query({
            query: ({ productId }) => `/products/${productId}/for-sup`,
            providesTags: ['Product'],
        }),
        updateProduct: builder.mutation({
            query: ({ supplierId, productId, productData }) => ({
                url: `/suppliers/${supplierId}/products/${productId}/update`,
                method: 'PUT',
                body: productData,
            }),
            invalidatesTags: ['Product'],
        }),
        updateProductMedia: builder.mutation({
            query: ({ supplierId, productId, productData, mediaType }) => ({
                url: `/suppliers/${supplierId}/products/${productId}/media/${mediaType}`,
                method: 'PUT',
                body: productData,
            }),
            invalidatesTags: ['Product'],
        }),
        deleteProduct: builder.mutation({
            query: ({ supplierId, productId }) => ({
                url: `/suppliers/${supplierId}/products/${productId}/delete`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Product'],
        }),
        deleteProductMedia: builder.mutation({
            query: ({ supplierId, productId, mediaType, publicId }) => ({
                url: `/suppliers/${supplierId}/products/${productId}/media/${mediaType}?publicId=${publicId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Product'],
        }),
    }),
});

export const {
    useCreateProductMutation,
    useValidateProductStepMutation,
    useUpdateProductMutation,
    useUpdateProductMediaMutation,
    useDeleteProductMutation,
    useGetAllProductBySupplierIdQuery,
    useGetAllProductQuery,
    useGetAllProductDetailsQuery,
    useGetAllProductDetailsForSupQuery,
    useDeleteProductMediaMutation,
} = supplierProductApi;

export default supplierProductApi;
