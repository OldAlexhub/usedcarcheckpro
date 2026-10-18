import {
  SERVER_API_BASE_URL,
  SERVER_REQUEST_TIMEOUT_MS,
} from '../config/server';
import { PowertrainType } from '../types';

export interface VinDecodeResult {
  valid: boolean;
  cached: boolean;
  year: string | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vehicle_type: string | null;
  body_class: string | null;
  fuel_type: string | null;
  electrification_level: string | null;
  engine_cylinders: string | null;
  displacement_liters: string | null;
  error_code: string | null;
  error_text: string | null;
}

interface ApiErrorBody {
  detail?: string;
}

export class ServerApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ServerApiError';
  }
}

export async function decodeVin(
  vin: string,
  externalSignal?: AbortSignal,
): Promise<VinDecodeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    SERVER_REQUEST_TIMEOUT_MS,
  );
  const abortFromExternal = () => controller.abort();
  externalSignal?.addEventListener('abort', abortFromExternal);

  try {
    const response = await fetch(`${SERVER_API_BASE_URL}/vin/decode`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vin }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = 'Vehicle lookup failed';
      try {
        const body = (await response.json()) as ApiErrorBody;
        if (body.detail) message = body.detail;
      } catch {
        // The response did not contain a JSON error body.
      }
      throw new ServerApiError(message, response.status);
    }

    return (await response.json()) as VinDecodeResult;
  } catch (error) {
    if (error instanceof ServerApiError) throw error;
    if (controller.signal.aborted) {
      throw new ServerApiError('Vehicle lookup timed out');
    }
    throw new ServerApiError('Could not reach the vehicle lookup service');
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
}

export function inferPowertrain(result: VinDecodeResult): PowertrainType {
  const description = `${result.fuel_type ?? ''} ${
    result.electrification_level ?? ''
  }`.toLowerCase();

  if (description.includes('hybrid') || description.includes('phev')) {
    return 'hybrid';
  }
  if (description.includes('electric') || description.includes('bev')) {
    return 'electric';
  }
  if (description.includes('diesel')) {
    return 'diesel';
  }
  return 'gasoline';
}
