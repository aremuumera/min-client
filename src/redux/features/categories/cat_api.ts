import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/baseApi';

export const categoryApi = createApi({
    reducerPath: 'categoryApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['category'],
    endpoints: (builder) => ({
        // gat all main category (level 1)
        getMainCategory: builder.query<any, void>({
            query: () => `/allCategories`,
            providesTags: ['category'],
        }),

        // gat all category, sub category (level 2) with tag as id
        getCategory: builder.query<any, string>({
            query: (tag) => `/allCategories/tag/${tag}`,
            providesTags: ['category'],
        }),

        getSubCategory: builder.query<any, string>({
            query: (id) => `/allCategories/${id}`,
            providesTags: ['category'],
        }),
    }),
});

export const {
    useGetMainCategoryQuery,
    useGetCategoryQuery,
    useGetSubCategoryQuery
} = categoryApi;

export default categoryApi;
