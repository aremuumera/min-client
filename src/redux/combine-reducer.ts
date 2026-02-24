import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import AuthReducer from './features/AuthFeature/auth_slice';
import blogApi from './features/blogs/blog_api';
import businessVerificationApi from './features/business_verification_feature/bv_api';
import businessCompanyInfoReducer from './features/business_verification_feature/bv_slice';
import businessVerificationApiV1 from './features/business_verification_feature/bv_v1_api';
import rfqApi from './features/buyer-rfq/rfq-api';
import rfqProductReducer from './features/buyer-rfq/rfq-slice';
import categoryApi from './features/categories/cat_api';
import chatApi from './features/chatFeature/chatApi';
import enquiryApi from './features/enquiry/enquiry_api';
import inspectorApi from './features/inspector/inspector_api';
import invoiceApi from './features/invoice/invoice_api';
import marketplaceReducer from './features/marketplace/marketplace_slice';
import reviewApi from './features/reviewFeature/review_api';
import savedItemsApi from './features/savedFeature/saved_api';
import supplierProductApi from './features/supplier-products/products_api';
import productReducer from './features/supplier-products/products_slice';
import supplierProfileApi from './features/supplier-profile/supplier_profile_api';
import supplierProfileReducer from './features/supplier-profile/supplier_profile_slice';
import waitlistReducer from './features/waitlist/waitlist_slice';
import { authApi } from './features/AuthFeature/auth_api_rtk';
import { teamApi } from './features/team/teamApi';
import activityApi from './features/activity/activityApi';
import definitionApi from './features/definitions/definition_api';
import tradeApi from './features/trade/trade_api';
import comparisonReducer from './features/comparison/comparison-slice';

// Persist configuration for auth reducer only (1:1 with original)
const authPersistConfig = {
    key: 'auth',
    storage,
    whitelist: [
        'email',
        'isAuth',
        'isInitialized',
        'user',
        'awaitingOTPVerification',
        'reginfo',
        'vType',
        'rtype',
        'phone',
        'appData',
        'numb',
        'token'
    ],
};

const rootReducer = combineReducers({
    auth: persistReducer(authPersistConfig, AuthReducer),
    waitlist: waitlistReducer,
    product: productReducer,
    businessCompanyInfo: businessCompanyInfoReducer,
    [supplierProductApi.reducerPath]: supplierProductApi.reducer,
    [rfqApi.reducerPath]: rfqApi.reducer,
    supplierProfile: supplierProfileReducer,
    rfqProduct: rfqProductReducer,
    marketplace: marketplaceReducer,
    [enquiryApi.reducerPath]: enquiryApi.reducer,
    [supplierProfileApi.reducerPath]: supplierProfileApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [savedItemsApi.reducerPath]: savedItemsApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [businessVerificationApi.reducerPath]: businessVerificationApi.reducer,
    [blogApi.reducerPath]: blogApi.reducer,
    [businessVerificationApiV1.reducerPath]: businessVerificationApiV1.reducer,
    [inspectorApi.reducerPath]: inspectorApi.reducer,
    [invoiceApi.reducerPath]: invoiceApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [activityApi.reducerPath]: activityApi.reducer,
    [definitionApi.reducerPath]: definitionApi.reducer,
    [tradeApi.reducerPath]: tradeApi.reducer,
    comparison: comparisonReducer,

});

export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;
