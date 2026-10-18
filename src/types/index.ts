export type PowertrainType = 'gasoline' | 'diesel' | 'hybrid' | 'electric';
export type SellerType = 'private' | 'dealer' | 'other';
export type ChecklistStatus =
  | 'good'
  | 'concern'
  | 'critical'
  | 'not_checked'
  | 'not_applicable';
export type DecisionStatus =
  | 'still_reviewing'
  | 'ask_mechanic'
  | 'request_info'
  | 'considering'
  | 'pass'
  | 'purchased';

export interface VehicleDetails {
  nickname: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  odometer: string;
  askingPrice: string;
  powertrainType: PowertrainType;
  sellerType: SellerType | '';
  sellerLabel: string;
  vin: string;
  listingUrl: string;
  exteriorColor: string;
  inspectionDate: string;
  generalNotes: string;
}

export interface ChecklistItemData {
  id: string;
  label: string;
  description: string;
  status: ChecklistStatus;
  notes: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItemData[];
  powertrainTypes: PowertrainType[] | null; // null = all types
}

export interface Inspection {
  id: string;
  createdAt: string;
  updatedAt: string;
  vehicle: VehicleDetails;
  sections: ChecklistSection[];
  decisionStatus: DecisionStatus;
}

export interface AppSettings {
  hasCompletedOnboarding: boolean;
  hasAcceptedDataUse: boolean;
  lastInterstitialShownDate: string | null;
  interstitialShownThisSession: boolean;
}

export interface StorageSchema {
  version: number;
  inspections: Inspection[];
  settings: AppSettings;
}

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  VehicleDetails: { inspectionId?: string };
  Checklist: {
    inspectionId: string;
    sectionIndex: number;
    totalSections: number;
  };
  InspectionSummary: { inspectionId: string; isNew?: boolean };
  CompareResult: { inspectionIds: string[] };
  PrivacyPolicy: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Saved: undefined;
  Compare: undefined;
  Settings: undefined;
};
