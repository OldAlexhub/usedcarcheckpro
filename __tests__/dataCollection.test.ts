import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataCollectionService } from '../src/services/dataCollection';
import { StorageService } from '../src/storage/storage';
import { createNewInspection } from '../src/utils/inspectionUtils';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('server offline'));
  await StorageService.saveSettings({
    hasCompletedOnboarding: true,
    hasAcceptedDataUse: true,
    lastInterstitialShownDate: null,
    interstitialShownThisSession: false,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('server failure never rejects and retains a bounded event queue', async () => {
  await expect(
    DataCollectionService.trackEvent('app_opened'),
  ).resolves.toBeUndefined();

  const rawQueue = await AsyncStorage.getItem('proveh_event_queue_v1');
  expect(rawQueue).not.toBeNull();
  expect(JSON.parse(rawQueue ?? '[]')).toHaveLength(1);
});

test('inspection dataset excludes VIN and free-text fields', async () => {
  const inspection = createNewInspection({
    nickname: 'Private nickname',
    year: '2020',
    make: 'Honda',
    model: 'Civic',
    trim: 'EX',
    odometer: '52000',
    askingPrice: '18500',
    powertrainType: 'gasoline',
    sellerType: 'dealer',
    sellerLabel: 'Private seller name',
    vin: '1HGCM82633A004352',
    listingUrl: 'https://example.com/private-listing',
    exteriorColor: 'Blue',
    inspectionDate: '2026-10-18',
    generalNotes: 'Private general note',
  });
  inspection.sections[0].items[0].notes = 'Private checklist note';
  inspection.sections[0].items[0].status = 'concern';

  await expect(
    DataCollectionService.submitInspectionOutcome(inspection),
  ).resolves.toBeUndefined();

  const rawQueue = await AsyncStorage.getItem('proveh_dataset_queue_v1');
  expect(rawQueue).not.toBeNull();
  expect(rawQueue).not.toContain(inspection.vehicle.vin);
  expect(rawQueue).not.toContain('Private');
  const [record] = JSON.parse(rawQueue ?? '[]');
  expect(record.odometer_band).toBe('50,000-74,999');
  expect(record.asking_price_band).toBe('15,000-24,999');
  expect(record.item_results[0].status).toBe('concern');
});
