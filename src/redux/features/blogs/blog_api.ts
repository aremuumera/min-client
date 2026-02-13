import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '@/lib/config';

export const blogApi = createApi({
    reducerPath: 'blogApi',
    baseQuery: fetchBaseQuery({ baseUrl: config.api.baseUrl, credentials: 'include' }),
    tagTypes: ['blogs'],
    endpoints: (builder) => ({
        getAllBlogs: builder.query<any, any>({
            query: (params) => {
                const { limit, search, page, status, is_featured, is_pinned, category, tags } = params;
                const queryParams = new URLSearchParams();
                if (page) queryParams.append('page', page.toString());
                if (limit) queryParams.append('limit', limit.toString());
                if (status) queryParams.append('status', status);
                if (search) queryParams.append('search', `${search || ''}`);
                if (is_featured) queryParams.append('is_featured', is_featured);
                if (is_pinned) queryParams.append('is_pinned', is_pinned);
                if (category) queryParams.append('category', category);
                if (tags) queryParams.append('tags', tags);
                return `/why/blogs?${queryParams.toString()}`;
            },
            providesTags: ['blogs'],
        }),

        getBlogById: builder.query<any, string>({
            query: (id) => `/why/blog/${id}`,
            providesTags: (result, error, id) => [{ type: 'blogs', id }],
        }),

        getBlogCategories: builder.query<any, any>({
            query: (params) => {
                const { limit, search, page, status } = params;
                const queryParams = new URLSearchParams();
                if (page) queryParams.append('page', page.toString());
                if (limit) queryParams.append('limit', limit.toString());
                if (status) queryParams.append('status', status);
                if (search) queryParams.append('search', `${search || ''}`);

                return `/admin/why/blogscategory?${queryParams.toString()}`;
            },
            providesTags: ['blogs'],
        }),

        getBlogCategoriesById: builder.query<any, string>({
            query: (id) => `/admin/why/blogcategory/${id}`,
            providesTags: (result, error, id) => [{ type: 'blogs', id }],
        }),
    }),
});

export const {
    useGetAllBlogsQuery,
    useGetBlogByIdQuery,
    useGetBlogCategoriesQuery,
    useGetBlogCategoriesByIdQuery
} = blogApi;

export default blogApi;
