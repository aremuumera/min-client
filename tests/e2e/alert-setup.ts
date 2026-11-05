import { expect, type APIRequestContext } from '@playwright/test';

/*
 * Step 2.13 test setup, in-app only (decision #113 D10: no test sends an email). Email and phone
 * are switched off for the test supplier, buyer and both staff accounts first (a company's notices
 * follow its owner's settings; staff with alerts:manage receive new alerts). Then a real WARNING
 * alert is raised, whose notices stay in the app: MINMEG dispatches a test shipment of an existing
 * accepted trade without its inspection ("dispatch readiness overridden"). No new trade is made (a new
 * inquiry emails staff) and no checkpoint is scanned (a failed scan at a planned checkpoint is a HIGH
 * alert, which emails). Each run leaves its test shipment on its way: a dispatched shipment cannot
 * be cancelled.
 */
export const API = 'http://localhost:8081/api';
export type Party = { headers: Record<string, string>; id: string };
const key = () => ({ 'Idempotency-Key': crypto.randomUUID() });

export async function login(api: APIRequestContext, env: Record<string, string>, pathName: string, identifier: string): Promise<Party> {
  const res = await (await api.post(`${API}/v1/auth/${pathName}`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
  const user = res.user ?? res.data?.user;
  return { headers: { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET }, id: user?.id };
}

export async function emailOff(api: APIRequestContext, ...parties: Party[]) {
  for (const p of parties) {
    const res = await api.patch(`${API}/v1/users/me/settings`, { headers: p.headers, data: { channels: { email: false, push: false } } });
    expect(res.ok(), await res.text()).toBeTruthy();
  }
}

/** Raises a WARNING alert on a new test shipment of the supplier; its message carries `run` */
export async function raiseTestAlert(api: APIRequestContext, supplier: Party, buyer: Party, staff: Party, run: string) {
  // From the supplier's own site to the buyer's yard (made once, reused between runs)
  type Place = { id: string; name: string; organizationId: string | null; active: boolean };
  const site = ((await (await api.get(`${API}/v1/locations?limit=100`, { headers: supplier.headers })).json()).data as Place[]).find((l) => l.organizationId && l.active);
  expect(site, 'the test supplier needs an active site').toBeTruthy();
  let destination = ((await (await api.get(`${API}/v1/locations?limit=100`, { headers: buyer.headers })).json()).data as Place[]).find((l) => l.organizationId === buyer.id && l.active);
  if (!destination) {
    const made = await api.post(`${API}/v1/locations`, { headers: { ...buyer.headers, ...key() }, data: { countryCode: 'NG', name: 'E2E buyer yard', locationType: 'WAREHOUSE' } });
    expect(made.status(), await made.text()).toBe(201);
    destination = (await made.json()).data;
  }

  const trades = (await (await api.get(`${API}/v1/trades?status=ACCEPTED&limit=100`, { headers: supplier.headers })).json()).data as { id: string; buyerOrganizationId: string }[];
  let shipment: { id: string; shipmentNumber: string } | null = null;
  let refused = '';
  for (const trade of trades.filter((t) => t.buyerOrganizationId === buyer.id)) {
    const [allocation] = ((await (await api.get(`${API}/v1/trades/${trade.id}/allocations`, { headers: supplier.headers })).json()).data as { id: string; status: string; quantityAllocated: string }[]).filter((a) => a.status === 'ACTIVE');
    if (!allocation) continue;
    const planned = await api.post(`${API}/v1/shipments`, {
      headers: { ...supplier.headers, ...key() },
      data: { tradeId: trade.id, originLocationId: site!.id, destinationLocationId: destination!.id, carrierName: 'E2E Haulage Ltd', vehicle: { driverName: 'E2E Driver', plateNumber: 'LAG-123-XY' }, lines: [{ allocationId: allocation.id, quantity: allocation.quantityAllocated }] },
    });
    if (planned.status() === 201) {
      shipment = (await planned.json()).data;
      break;
    }
    refused = await planned.text();
  }
  expect(shipment, `the test supplier needs an accepted trade with stock left to ship (run the shipments test once). Last refusal: ${refused}`).toBeTruthy();

  const dispatched = await api.post(`${API}/v1/shipments/${shipment!.id}/dispatch`, { headers: staff.headers, data: { readinessOverrideReason: `E2E ${run}: notifications and alerts test` } });
  // still planned: cancel it so a failed setup leaves nothing behind
  if (!dispatched.ok()) await api.post(`${API}/v1/shipments/${shipment!.id}/cancel`, { headers: supplier.headers, data: { reason: 'E2E: setup failed, test shipment not needed' } });
  expect(dispatched.ok(), await dispatched.text()).toBeTruthy();
  const alerts = (await (await api.get(`${API}/v1/alerts?shipmentId=${shipment!.id}&open=true`, { headers: staff.headers })).json()).data as { id: string; title: string; alertType: string; severity: string }[];
  const alert = alerts.find((a) => a.alertType === 'DISPATCH_READINESS_OVERRIDDEN');
  expect(alert?.severity, 'the override raises a WARNING alert').toBe('WARNING');
  return { alert: alert!, shipmentNumber: shipment!.shipmentNumber };
}
