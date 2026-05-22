import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, Inspection, StorageSchema } from '../types';
import { STORAGE_KEY, SCHEMA_VERSION } from '../config/constants';

const DEFAULT_SETTINGS: AppSettings = {
  hasCompletedOnboarding: false,
  lastInterstitialShownDate: null,
  interstitialShownThisSession: false,
};

const DEFAULT_SCHEMA: StorageSchema = {
  version: SCHEMA_VERSION,
  inspections: [],
  settings: DEFAULT_SETTINGS,
};

async function loadSchema(): Promise<StorageSchema> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SCHEMA, settings: { ...DEFAULT_SETTINGS } };
    const parsed = JSON.parse(raw) as StorageSchema;
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_SCHEMA, settings: { ...DEFAULT_SETTINGS } };
    }
    return {
      version: parsed.version ?? SCHEMA_VERSION,
      inspections: Array.isArray(parsed.inspections) ? parsed.inspections : [],
      settings: parsed.settings
        ? { ...DEFAULT_SETTINGS, ...parsed.settings }
        : { ...DEFAULT_SETTINGS },
    };
  } catch {
    return { ...DEFAULT_SCHEMA, settings: { ...DEFAULT_SETTINGS } };
  }
}

async function saveSchema(schema: StorageSchema): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
  } catch {
    // Silently fail - caller does not receive thrown errors
  }
}

export const StorageService = {
  async getSettings(): Promise<AppSettings> {
    try {
      const schema = await loadSchema();
      return schema.settings;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const schema = await loadSchema();
      schema.settings = settings;
      await saveSchema(schema);
    } catch {
      // Silently fail
    }
  },

  async getInspections(): Promise<Inspection[]> {
    try {
      const schema = await loadSchema();
      return schema.inspections;
    } catch {
      return [];
    }
  },

  async getInspection(id: string): Promise<Inspection | null> {
    try {
      const schema = await loadSchema();
      const found = schema.inspections.find((i) => i.id === id);
      return found ?? null;
    } catch {
      return null;
    }
  },

  async saveInspection(inspection: Inspection): Promise<void> {
    try {
      const schema = await loadSchema();
      const idx = schema.inspections.findIndex((i) => i.id === inspection.id);
      if (idx >= 0) {
        schema.inspections[idx] = inspection;
      } else {
        schema.inspections.push(inspection);
      }
      await saveSchema(schema);
    } catch {
      // Silently fail
    }
  },

  async deleteInspection(id: string): Promise<void> {
    try {
      const schema = await loadSchema();
      schema.inspections = schema.inspections.filter((i) => i.id !== id);
      await saveSchema(schema);
    } catch {
      // Silently fail
    }
  },

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently fail
    }
  },
};
