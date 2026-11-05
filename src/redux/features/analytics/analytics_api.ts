import { createApi } from '@reduxjs/toolkit/query/react';
import type { AlertsAnalytics, CertificatesAnalytics, ComplianceAnalytics, EsgCarbonAnalytics, HardwareAnalytics, InspectionsAnalytics, LogisticsAnalytics, MeasurementsAnalytics, SuppliersAnalytics, TraceabilityAnalytics, TradeAnalytics } from '@/lib/analytics';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Step 2.14: analytics for the company (Group 27, decision #115). Read-only; the backend limits each company to its own records. */
type Query = { from?: string; to?: string; interval?: string; measurementTypeId?: string };
const params = (q: Query) => Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '' && v !== undefined));
const view = (path: string) => ({ query: (q: Query) => ({ url: `/analytics/${path}`, params: params(q) }), keepUnusedDataFor: 120 }) as const;

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getTradeAnalytics: builder.query<TradeAnalytics, Query>(view('trade')),
    getTraceabilityAnalytics: builder.query<TraceabilityAnalytics, Query>(view('traceability')),
    getLogisticsAnalytics: builder.query<LogisticsAnalytics, Query>(view('realtime-logistics')),
    getSupplierAnalytics: builder.query<SuppliersAnalytics, Query>(view('suppliers')),
    getInspectionAnalytics: builder.query<InspectionsAnalytics, Query>(view('inspections')),
    getMeasurementAnalytics: builder.query<MeasurementsAnalytics, Query>(view('measurements')),
    getCertificateAnalytics: builder.query<CertificatesAnalytics, Query>(view('certificates')),
    getComplianceAnalytics: builder.query<ComplianceAnalytics, Query>(view('compliance')),
    getEsgCarbonAnalytics: builder.query<EsgCarbonAnalytics, Query>(view('esg-carbon')),
    getAlertAnalytics: builder.query<AlertsAnalytics, Query>(view('alerts')),
    getHardwareAnalytics: builder.query<HardwareAnalytics, Query>(view('hardware')),
  }),
});

export const {
  useGetTradeAnalyticsQuery,
  useGetTraceabilityAnalyticsQuery,
  useGetLogisticsAnalyticsQuery,
  useGetSupplierAnalyticsQuery,
  useGetInspectionAnalyticsQuery,
  useGetMeasurementAnalyticsQuery,
  useGetCertificateAnalyticsQuery,
  useGetComplianceAnalyticsQuery,
  useGetEsgCarbonAnalyticsQuery,
  useGetAlertAnalyticsQuery,
  useGetHardwareAnalyticsQuery,
} = analyticsApi;
