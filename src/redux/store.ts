import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './combine-reducer';

import { authApi } from './features/AuthFeature/auth_api_rtk';
import { teamApi } from './features/team/teamApi';
import inquiryApi from './features/enquiry/enquiry_api';
import supplierProductApi from './features/supplier-products/products_api';
import rfqApi from './features/buyer-rfq/rfq-api';
import supplierProfileApi from './features/supplier-profile/supplier_profile_api';
import categoryApi from './features/categories/cat_api';
import savedItemsApi from './features/savedFeature/saved_api';
import reviewApi from './features/reviewFeature/review_api';
import chatApi from './features/chatFeature/chatApi';
import businessVerificationApi from './features/business_verification_feature/bv_api';
import blogApi from './features/blogs/blog_api';
import businessVerificationApiV1 from './features/business_verification_feature/bv_v1_api';
import inspectorApi from './features/inspector/inspector_api';
import activityApi from './features/activity/activityApi';
import invoiceApi from './features/invoice/invoice_api';
import tradeApi from './features/trade/trade_api';
import definitionApi from './features/definitions/definition_api';

const persistConfig = {
    key: 'root',
    storage,
    blacklist: [
        'auth',
        'authApi',
        'supplierProfileApi',
        'rfqApi',
        'supplierProductApi',
        'marketplace',
        'categoryApi',
        'savedItemsApi',
        'reviewApi',
        'chatApi',
        'businessVerificationApi',
        'businessVerificationApiV1',
        'blogApi',
        'enquiryApi',
        'inspectorApi',
        'invoiceApi',
        'tradeApi',
        'definitionApi',
    ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
    return configureStore({
        reducer: persistedReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
                },
            }).concat(
                authApi.middleware,
                inquiryApi.middleware,
                supplierProductApi.middleware,
                rfqApi.middleware,
                supplierProfileApi.middleware,
                categoryApi.middleware,
                savedItemsApi.middleware,
                reviewApi.middleware,
                chatApi.middleware,
                businessVerificationApi.middleware,
                blogApi.middleware,
                businessVerificationApiV1.middleware,
                inspectorApi.middleware,
                invoiceApi.middleware,
                teamApi.middleware,
                activityApi.middleware,
                tradeApi.middleware,
                definitionApi.middleware
            ) as any,
    });
};

export const createPersistor = (store: any) => persistStore(store);

export type AppStore = ReturnType<typeof makeStore>;
// export type RootState = ReturnType<AppStore['getState']>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];
