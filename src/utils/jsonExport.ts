import RNFS from 'react-native-fs';
import { Inspection } from '../types';

// ---------------------------------------------------------------------------
// Single inspection export
// ---------------------------------------------------------------------------

export async function exportInspectionJSON(inspection: Inspection): Promise<string> {
  const payload = {
    exportedAt: new Date().toISOString(),
    appName: 'Used Car Check Pro',
    developer: 'Old Alex Hub',
    inspection,
  };

  const path = `${RNFS.DocumentDirectoryPath}/usedcarcheckpro-inspection-${Date.now()}.json`;

  try {
    await RNFS.writeFile(path, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to write inspection JSON to disk: ${message}`);
  }

  return path;
}

// ---------------------------------------------------------------------------
// All inspections export
// ---------------------------------------------------------------------------

export async function exportAllInspectionsJSON(inspections: Inspection[]): Promise<string> {
  const payload = {
    exportedAt: new Date().toISOString(),
    appName: 'Used Car Check Pro',
    developer: 'Old Alex Hub',
    inspections,
  };

  const path = `${RNFS.DocumentDirectoryPath}/usedcarcheckpro-all-inspections-${Date.now()}.json`;

  try {
    await RNFS.writeFile(path, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to write inspections JSON to disk: ${message}`);
  }

  return path;
}
