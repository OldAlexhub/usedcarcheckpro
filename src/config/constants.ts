import { ChecklistStatus, DecisionStatus, PowertrainType } from '../types';

export const APP_NAME = 'Used Car Check Pro';
export const APP_VERSION = '1.0.0';
export const DEVELOPER = 'Old Alex Hub';
export const STORAGE_KEY = 'usedcarcheckpro_v1';
export const SCHEMA_VERSION = 1;
export const MAX_COMPARE_VEHICLES = 3;

export const DISCLAIMER =
  'Used Car Check Pro is an observation and organization tool only. It is not a substitute for a professional pre-purchase inspection by a qualified mechanic, a vehicle history report (such as CARFAX or AutoCheck), a title search, an open recall check, or any other professional evaluation service. This app does not certify the condition or value of any vehicle and does not recommend purchasing or passing on any vehicle. Full inspection records remain on your device; a limited, pseudonymous outcome dataset is collected as described in the Privacy Policy. Always consult qualified professionals before making any vehicle purchase decision.';

export const DECISION_STATUS_LABELS: Record<DecisionStatus, string> = {
  still_reviewing: 'Still Reviewing',
  ask_mechanic: 'Ask Mechanic',
  request_info: 'Request Info',
  considering: 'Considering',
  pass: 'Pass',
  purchased: 'Purchased',
};

export const POWERTRAIN_LABELS: Record<PowertrainType, string> = {
  gasoline: 'Gasoline',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  electric: 'Electric',
};

export const STATUS_LABELS: Record<ChecklistStatus, string> = {
  good: 'Good',
  concern: 'Concern',
  critical: 'Critical',
  not_checked: 'Not Checked',
  not_applicable: 'Not Applicable',
};
