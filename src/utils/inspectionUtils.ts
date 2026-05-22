import {
  ChecklistItemData,
  DecisionStatus,
  Inspection,
  PowertrainType,
  VehicleDetails,
} from '../types';
import { getInspectionSections } from '../data/checklist';
import { DECISION_STATUS_LABELS, POWERTRAIN_LABELS } from '../config/constants';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function createNewInspection(vehicle: VehicleDetails): Inspection {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    vehicle,
    sections: getInspectionSections(vehicle.powertrainType),
    decisionStatus: 'still_reviewing',
  };
}

export function getCompletionStats(inspection: Inspection): {
  total: number;
  good: number;
  concern: number;
  critical: number;
  notChecked: number;
  notApplicable: number;
} {
  let total = 0;
  let good = 0;
  let concern = 0;
  let critical = 0;
  let notChecked = 0;
  let notApplicable = 0;

  for (const section of inspection.sections) {
    for (const item of section.items) {
      total += 1;
      switch (item.status) {
        case 'good':
          good += 1;
          break;
        case 'concern':
          concern += 1;
          break;
        case 'critical':
          critical += 1;
          break;
        case 'not_checked':
          notChecked += 1;
          break;
        case 'not_applicable':
          notApplicable += 1;
          break;
      }
    }
  }

  return { total, good, concern, critical, notChecked, notApplicable };
}

export function getCompletionPercentage(inspection: Inspection): number {
  const { total, notChecked, notApplicable } = getCompletionStats(inspection);
  const applicable = total - notApplicable;
  if (applicable <= 0) return 0;
  const checked = applicable - notChecked;
  return Math.round((checked / applicable) * 100);
}

export function getCriticalItems(
  inspection: Inspection,
): Array<{ sectionTitle: string; item: ChecklistItemData }> {
  const results: Array<{ sectionTitle: string; item: ChecklistItemData }> = [];
  for (const section of inspection.sections) {
    for (const item of section.items) {
      if (item.status === 'critical') {
        results.push({ sectionTitle: section.title, item });
      }
    }
  }
  return results;
}

export function getConcernItems(
  inspection: Inspection,
): Array<{ sectionTitle: string; item: ChecklistItemData }> {
  const results: Array<{ sectionTitle: string; item: ChecklistItemData }> = [];
  for (const section of inspection.sections) {
    for (const item of section.items) {
      if (item.status === 'concern') {
        results.push({ sectionTitle: section.title, item });
      }
    }
  }
  return results;
}

export function getNotCheckedItems(
  inspection: Inspection,
): Array<{ sectionTitle: string; item: ChecklistItemData }> {
  const results: Array<{ sectionTitle: string; item: ChecklistItemData }> = [];
  for (const section of inspection.sections) {
    for (const item of section.items) {
      if (item.status === 'not_checked') {
        results.push({ sectionTitle: section.title, item });
      }
    }
  }
  return results;
}

export function getDecisionLabel(status: DecisionStatus): string {
  return DECISION_STATUS_LABELS[status] ?? status;
}

export function getPowertrainLabel(type: PowertrainType): string {
  return POWERTRAIN_LABELS[type] ?? type;
}
