'use client';

import * as React from 'react';
import { DEFAULT_WINDOW, windowQuery, type WindowChoice } from '@/lib/analytics';
import { useGetInspectionAnalyticsQuery } from '@/redux/features/analytics/analytics_api';
import { InspectionBody } from './sections';
import { Section } from './charts';
import { WindowFilter } from './window-filter';

/** The inspector's own inspection work for a chosen period (step 2.14, D2): assignments, time to complete, results, lab grades */
export function MyInspections() {
  const [choice, setChoice] = React.useState<WindowChoice>(DEFAULT_WINDOW);
  const query = React.useMemo(() => windowQuery(choice), [choice]);
  const result = useGetInspectionAnalyticsQuery(query ?? {}, { skip: !query });
  const d = result.data?.data;
  return (
    <div className="space-y-3">
      <WindowFilter value={choice} onChange={setChoice} shown={d?.window} />
      <Section title="My inspections" description="Your inspection assignments, how long they took, and the results and lab grades you recorded." query={result} testId="analytics-my-inspections">
        {d && <InspectionBody data={d} window={d.window} />}
      </Section>
    </div>
  );
}
