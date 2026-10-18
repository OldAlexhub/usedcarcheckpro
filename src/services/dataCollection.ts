import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { APP_VERSION } from '../config/constants';
import {
  SERVER_API_BASE_URL,
  SERVER_REQUEST_TIMEOUT_MS,
} from '../config/server';
import { Inspection } from '../types';
import { StorageService } from '../storage/storage';

const CONSENT_VERSION = '2026-10-18';
const DATASET_SCHEMA_VERSION = 1;
const IDENTITY_KEY = 'proveh_data_identity_v1';
const EVENT_QUEUE_KEY = 'proveh_event_queue_v1';
const DATASET_QUEUE_KEY = 'proveh_dataset_queue_v1';
const PENDING_DELETION_KEY = 'proveh_pending_deletion_v1';
const MAX_EVENT_QUEUE = 200;
const MAX_DATASET_QUEUE = 100;

type SupportedPlatform = 'android' | 'ios';
type AnalyticsValue = boolean | number | string;
type AnalyticsProperties = Record<string, AnalyticsValue>;

export type AnalyticsEventName =
  | 'app_opened'
  | 'onboarding_completed'
  | 'vin_lookup_completed'
  | 'inspection_started'
  | 'inspection_completed'
  | 'report_exported'
  | 'comparison_created';

interface DataIdentity {
  install_id: string;
  secret: string;
}

interface QueuedEvent {
  id: string;
  name: AnalyticsEventName;
  occurred_at: string;
  properties: AnalyticsProperties;
}

interface DatasetItemResult {
  item_id: string;
  status: string;
}

interface InspectionDatasetRecord {
  source_id: string;
  inspection_updated_at: string;
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_trim: string | null;
  powertrain: string;
  seller_type: string | null;
  odometer_band: string;
  asking_price_band: string;
  decision_status: string;
  item_results: DatasetItemResult[];
}

let identityPromise: Promise<DataIdentity | null> | null = null;
let flushPromise: Promise<void> | null = null;
let storageLock: Promise<void> = Promise.resolve();

function supportedPlatform(): SupportedPlatform | null {
  return Platform.OS === 'android' || Platform.OS === 'ios'
    ? Platform.OS
    : null;
}

function clientId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

async function withStorageLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = storageLock;
  let release: () => void = () => undefined;
  storageLock = new Promise<void>(resolve => {
    release = resolve;
  });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

async function readArray<T>(key: string): Promise<T[]> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function request(path: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    SERVER_REQUEST_TIMEOUT_MS,
  );
  try {
    return await fetch(`${SERVER_API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function createIdentity(): Promise<DataIdentity | null> {
  const platform = supportedPlatform();
  if (!platform) return null;
  try {
    const response = await request('/data/installations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_version: APP_VERSION,
        platform,
        consent_version: CONSENT_VERSION,
      }),
    });
    if (!response.ok) return null;
    const identity = (await response.json()) as DataIdentity;
    if (!identity.install_id || !identity.secret) return null;
    await AsyncStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    return identity;
  } catch {
    return null;
  }
}

async function getIdentity(): Promise<DataIdentity | null> {
  try {
    const value = await AsyncStorage.getItem(IDENTITY_KEY);
    if (value) {
      const parsed = JSON.parse(value) as Partial<DataIdentity>;
      if (parsed.install_id && parsed.secret) {
        return parsed as DataIdentity;
      }
    }
  } catch {
    // A replacement identity will be requested when online.
  }

  if (!identityPromise) {
    identityPromise = createIdentity().finally(() => {
      identityPromise = null;
    });
  }
  return identityPromise;
}

function authHeaders(identity: DataIdentity): Record<string, string> {
  return {
    Authorization: `Bearer ${identity.secret}`,
    'Content-Type': 'application/json',
    'X-Install-ID': identity.install_id,
  };
}

async function tryPendingDeletion(): Promise<boolean> {
  const pending = await AsyncStorage.getItem(PENDING_DELETION_KEY);
  if (pending !== 'true') return true;

  let identity: DataIdentity | null = null;
  try {
    const rawIdentity = await AsyncStorage.getItem(IDENTITY_KEY);
    identity = rawIdentity ? (JSON.parse(rawIdentity) as DataIdentity) : null;
  } catch {
    identity = null;
  }
  if (!identity?.install_id || !identity.secret) {
    await AsyncStorage.multiRemove([IDENTITY_KEY, PENDING_DELETION_KEY]);
    return true;
  }

  try {
    const response = await request('/data/installation', {
      method: 'DELETE',
      headers: authHeaders(identity),
    });
    if (!response.ok && response.status !== 404 && response.status !== 401) {
      return false;
    }
    await AsyncStorage.multiRemove([IDENTITY_KEY, PENDING_DELETION_KEY]);
    return true;
  } catch {
    return false;
  }
}

async function flushQueues(): Promise<void> {
  if (!(await tryPendingDeletion())) return;

  const settings = await StorageService.getSettings();
  const platform = supportedPlatform();
  if (!settings.hasAcceptedDataUse || !platform) return;

  const [events, records] = await withStorageLock(async () =>
    Promise.all([
      readArray<QueuedEvent>(EVENT_QUEUE_KEY),
      readArray<InspectionDatasetRecord>(DATASET_QUEUE_KEY),
    ]),
  );
  if (events.length === 0 && records.length === 0) return;

  const identity = await getIdentity();
  if (!identity) return;

  const eventBatch = events.slice(0, 50);
  if (eventBatch.length > 0) {
    try {
      const response = await request('/events/batch', {
        method: 'POST',
        headers: authHeaders(identity),
        body: JSON.stringify({
          app_version: APP_VERSION,
          platform,
          consent_version: CONSENT_VERSION,
          events: eventBatch,
        }),
      });
      if (response.ok) {
        const sent = new Set(eventBatch.map(event => event.id));
        await withStorageLock(async () => {
          const current = await readArray<QueuedEvent>(EVENT_QUEUE_KEY);
          await AsyncStorage.setItem(
            EVENT_QUEUE_KEY,
            JSON.stringify(current.filter(event => !sent.has(event.id))),
          );
        });
      }
    } catch {
      // The queue is retained for the next app session.
    }
  }

  const datasetBatch = records.slice(0, 25);
  if (datasetBatch.length > 0) {
    try {
      const response = await request('/datasets/inspection-outcomes/batch', {
        method: 'POST',
        headers: authHeaders(identity),
        body: JSON.stringify({
          schema_version: DATASET_SCHEMA_VERSION,
          app_version: APP_VERSION,
          platform,
          consent_version: CONSENT_VERSION,
          records: datasetBatch,
        }),
      });
      if (response.ok) {
        const sentVersions = new Map(
          datasetBatch.map(record => [
            record.source_id,
            record.inspection_updated_at,
          ]),
        );
        await withStorageLock(async () => {
          const current = await readArray<InspectionDatasetRecord>(
            DATASET_QUEUE_KEY,
          );
          await AsyncStorage.setItem(
            DATASET_QUEUE_KEY,
            JSON.stringify(
              current.filter(
                record =>
                  sentVersions.get(record.source_id) !==
                  record.inspection_updated_at,
              ),
            ),
          );
        });
      }
    } catch {
      // The queue is retained for the next app session.
    }
  }
}

async function flush(): Promise<void> {
  if (flushPromise) {
    await flushPromise;
    await flush();
    return;
  }
  flushPromise = flushQueues()
    .catch(() => undefined)
    .finally(() => {
      flushPromise = null;
    });
  await flushPromise;
}

function numberBand(
  raw: string,
  bands: Array<[number, string]>,
  fallback: string,
): string {
  const value = Number(raw.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(value) || value < 0) return 'unknown';
  return bands.find(([maximum]) => value <= maximum)?.[1] ?? fallback;
}

function buildDatasetRecord(
  inspection: Inspection,
): InspectionDatasetRecord | null {
  const year = Number(inspection.vehicle.year);
  const make = inspection.vehicle.make.trim().slice(0, 64);
  const model = inspection.vehicle.model.trim().slice(0, 64);
  if (
    !Number.isInteger(year) ||
    year < 1886 ||
    year > 2100 ||
    !make ||
    !model
  ) {
    return null;
  }

  return {
    source_id: inspection.id,
    inspection_updated_at: inspection.updatedAt,
    vehicle_year: year,
    vehicle_make: make,
    vehicle_model: model,
    vehicle_trim: inspection.vehicle.trim.trim().slice(0, 64) || null,
    powertrain: inspection.vehicle.powertrainType,
    seller_type: inspection.vehicle.sellerType || null,
    odometer_band: numberBand(
      inspection.vehicle.odometer,
      [
        [24999, '0-24,999'],
        [49999, '25,000-49,999'],
        [74999, '50,000-74,999'],
        [99999, '75,000-99,999'],
        [149999, '100,000-149,999'],
        [199999, '150,000-199,999'],
      ],
      '200,000+',
    ),
    asking_price_band: numberBand(
      inspection.vehicle.askingPrice,
      [
        [4999, '0-4,999'],
        [9999, '5,000-9,999'],
        [14999, '10,000-14,999'],
        [24999, '15,000-24,999'],
        [39999, '25,000-39,999'],
      ],
      '40,000+',
    ),
    decision_status: inspection.decisionStatus,
    item_results: inspection.sections.flatMap(section =>
      section.items.map(item => ({
        item_id: `${section.id}__${item.id}`.slice(0, 80),
        status: item.status,
      })),
    ),
  };
}

async function isCollectionAllowed(): Promise<boolean> {
  if ((await AsyncStorage.getItem(PENDING_DELETION_KEY)) === 'true') {
    if (!(await tryPendingDeletion())) return false;
  }
  return (await StorageService.getSettings()).hasAcceptedDataUse;
}

export const DataCollectionService = {
  consentVersion: CONSENT_VERSION,

  async trackEvent(
    name: AnalyticsEventName,
    properties: AnalyticsProperties = {},
  ): Promise<void> {
    try {
      if (!(await isCollectionAllowed())) return;
      const event: QueuedEvent = {
        id: clientId('evt'),
        name,
        occurred_at: new Date().toISOString(),
        properties,
      };
      await withStorageLock(async () => {
        const queue = await readArray<QueuedEvent>(EVENT_QUEUE_KEY);
        queue.push(event);
        await AsyncStorage.setItem(
          EVENT_QUEUE_KEY,
          JSON.stringify(queue.slice(-MAX_EVENT_QUEUE)),
        );
      });
      await flush();
    } catch {
      // Data collection is always non-blocking for the app workflow.
    }
  },

  async submitInspectionOutcome(inspection: Inspection): Promise<void> {
    try {
      if (!(await isCollectionAllowed())) return;
      const record = buildDatasetRecord(inspection);
      if (!record) return;
      await withStorageLock(async () => {
        const queue = await readArray<InspectionDatasetRecord>(
          DATASET_QUEUE_KEY,
        );
        const withoutOlderVersion = queue.filter(
          item => item.source_id !== record.source_id,
        );
        withoutOlderVersion.push(record);
        await AsyncStorage.setItem(
          DATASET_QUEUE_KEY,
          JSON.stringify(withoutOlderVersion.slice(-MAX_DATASET_QUEUE)),
        );
      });
      await flush();
    } catch {
      // Inspection save/summary must continue even if queueing fails.
    }
  },

  async flush(): Promise<void> {
    await flush();
  },

  async deleteCollectedData(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(PENDING_DELETION_KEY, 'true');
      await AsyncStorage.multiRemove([EVENT_QUEUE_KEY, DATASET_QUEUE_KEY]);
      const deleted = await tryPendingDeletion();
      if (deleted) identityPromise = null;
      return deleted;
    } catch {
      return false;
    }
  },
};
