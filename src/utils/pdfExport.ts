import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Inspection, ChecklistStatus, DecisionStatus, PowertrainType } from '../types';
import { formatDate } from './dateUtils';
import { getCompletionStats, getCompletionPercentage } from './inspectionUtils';

// ---------------------------------------------------------------------------
// Label and color maps
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<ChecklistStatus, string> = {
  good: 'Good',
  concern: 'Concern',
  critical: 'Critical Attention',
  not_checked: 'Not Checked',
  not_applicable: 'N/A',
};

const STATUS_COLORS: Record<ChecklistStatus, string> = {
  good: '#22C55E',
  concern: '#F59E0B',
  critical: '#EF4444',
  not_checked: '#64748B',
  not_applicable: '#475569',
};

const DECISION_LABELS: Record<DecisionStatus, string> = {
  still_reviewing: 'Still Reviewing',
  ask_mechanic: 'Ask a Mechanic',
  request_info: 'Request More Information',
  considering: 'Considering Purchase',
  pass: 'Pass on This Vehicle',
  purchased: 'Purchased - Personal Record',
};

const DECISION_COLORS: Record<DecisionStatus, string> = {
  still_reviewing: '#64748B',
  ask_mechanic: '#8B5CF6',
  request_info: '#3B82F6',
  considering: '#F59E0B',
  pass: '#EF4444',
  purchased: '#22C55E',
};

const POWERTRAIN_LABELS: Record<PowertrainType, string> = {
  gasoline: 'Gasoline',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  electric: 'Electric',
};

// ---------------------------------------------------------------------------
// HTML utilities
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlHead(title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      font-size: 12px;
      line-height: 1.5;
      padding: 30px;
    }
    h1 { font-size: 22px; color: #1a1a1a; margin-bottom: 4px; }
    h2 { font-size: 15px; color: #1a1a1a; margin-bottom: 10px; }
    h3 { font-size: 13px; color: #374151; margin-bottom: 6px; }
    .company-name {
      font-size: 11px;
      font-weight: bold;
      color: #3B82F6;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .report-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #3B82F6;
    }
    .generated-date { font-size: 11px; color: #6B7280; margin-top: 6px; }
    .card {
      background: #ffffff;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 18px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .card-title {
      font-size: 11px;
      font-weight: bold;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #F3F4F6;
    }
    .detail-row {
      display: flex;
      margin-bottom: 5px;
    }
    .detail-label {
      font-weight: bold;
      color: #374151;
      width: 140px;
      flex-shrink: 0;
      font-size: 11px;
    }
    .detail-value {
      color: #1a1a1a;
      font-size: 11px;
      flex: 1;
    }
    .stats-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .stat-cell {
      flex: 1;
      min-width: 80px;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }
    .stat-number {
      font-size: 20px;
      font-weight: bold;
      display: block;
    }
    .stat-label {
      font-size: 10px;
      color: #6B7280;
      margin-top: 2px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      color: #ffffff;
      font-weight: bold;
      font-size: 12px;
    }
    .section-block {
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      color: #3B82F6;
      margin-bottom: 8px;
      padding: 6px 10px;
      background: #EFF6FF;
      border-left: 4px solid #3B82F6;
      border-radius: 0 4px 4px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background: #F3F4F6;
      color: #374151;
      font-weight: bold;
      padding: 7px 8px;
      text-align: left;
      border: 1px solid #D1D5DB;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #E5E7EB;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #F9FAFB; }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      color: #ffffff;
      font-size: 10px;
      font-weight: bold;
      white-space: nowrap;
    }
    .muted { color: #9CA3AF; }
    .disclaimer-card {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 8px;
      padding: 14px 16px;
      margin-top: 24px;
      font-size: 10px;
      color: #78350F;
      line-height: 1.6;
    }
    .disclaimer-title {
      font-weight: bold;
      margin-bottom: 6px;
      font-size: 11px;
    }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>`;
}

const HTML_FOOT = '</body></html>';

// ---------------------------------------------------------------------------
// Inspection PDF
// ---------------------------------------------------------------------------

function buildInspectionHtml(inspection: Inspection): string {
  const { vehicle, sections, decisionStatus } = inspection;
  const stats = getCompletionStats(inspection);
  const completionPct = getCompletionPercentage(inspection);
  const generatedDate = formatDate(new Date().toISOString());

  const yearMakeModel = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(' ');

  function detailRow(label: string, value: string): string {
    if (!value) {
      return '';
    }
    return `<div class="detail-row">
      <span class="detail-label">${escapeHtml(label)}</span>
      <span class="detail-value">${escapeHtml(value)}</span>
    </div>`;
  }

  const vehicleInfoRows = [
    detailRow('Nickname', vehicle.nickname),
    detailRow('Vehicle', yearMakeModel),
    detailRow('Odometer', vehicle.odometer ? `${vehicle.odometer} mi` : ''),
    detailRow('Asking Price', vehicle.askingPrice ? `$${vehicle.askingPrice}` : ''),
    detailRow(
      'Powertrain',
      POWERTRAIN_LABELS[vehicle.powertrainType] ?? vehicle.powertrainType,
    ),
    detailRow(
      'Inspection Date',
      vehicle.inspectionDate ? formatDate(vehicle.inspectionDate) : '',
    ),
    detailRow('Exterior Color', vehicle.exteriorColor),
    detailRow('VIN', vehicle.vin),
    detailRow('Seller', vehicle.sellerLabel || (vehicle.sellerType as string)),
    detailRow('Listing URL', vehicle.listingUrl),
  ]
    .filter(Boolean)
    .join('\n');

  const generalNotesBlock = vehicle.generalNotes
    ? `<div class="detail-row" style="margin-top:8px;padding-top:8px;border-top:1px solid #F3F4F6;">
        <span class="detail-label">General Notes</span>
        <span class="detail-value" style="white-space:pre-wrap;">${escapeHtml(vehicle.generalNotes)}</span>
      </div>`
    : '';

  function statCell(
    value: number | string,
    label: string,
    color?: string,
  ): string {
    const colorStyle = color ? `color:${color};` : '';
    return `<div class="stat-cell">
      <span class="stat-number" style="${colorStyle}">${value}</span>
      <span class="stat-label">${label}</span>
    </div>`;
  }

  const statsBlock = `<div class="stats-grid">
    ${statCell(stats.total, 'Total Items')}
    ${statCell(stats.good, 'Good', '#22C55E')}
    ${statCell(stats.concern, 'Concerns', '#F59E0B')}
    ${statCell(stats.critical, 'Critical', '#EF4444')}
    ${statCell(stats.notChecked, 'Not Checked', '#64748B')}
    ${statCell(stats.notApplicable, 'N/A', '#475569')}
    ${statCell(`${completionPct}%`, 'Completion', '#3B82F6')}
  </div>`;

  const decisionColor = DECISION_COLORS[decisionStatus] ?? '#64748B';
  const decisionLabel = DECISION_LABELS[decisionStatus] ?? decisionStatus;

  const sectionsHtml = sections
    .map(section => {
      if (section.items.length === 0) {
        return '';
      }

      const rows = section.items
        .map(item => {
          const isNA = item.status === 'not_applicable';
          const statusColor = STATUS_COLORS[item.status];
          const statusLabel = STATUS_LABELS[item.status];
          const mutedStyle = isNA ? ' style="color:#9CA3AF;"' : '';

          return `<tr>
            <td${mutedStyle}>${escapeHtml(item.label)}</td>
            <td style="text-align:center;">
              <span class="status-badge" style="background:${statusColor};">${escapeHtml(statusLabel)}</span>
            </td>
            <td${mutedStyle} style="white-space:pre-wrap;">${escapeHtml(item.notes)}</td>
          </tr>`;
        })
        .join('\n');

      return `<div class="section-block">
        <div class="section-title">${escapeHtml(section.title)}</div>
        <table>
          <thead>
            <tr>
              <th style="width:35%;">Item</th>
              <th style="width:20%;">Status</th>
              <th style="width:45%;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>`;
    })
    .join('\n');

  return `${htmlHead('Inspection Report - Used Car Check Pro')}

  <div class="report-header">
    <div class="company-name">Used Car Check Pro</div>
    <h1>Inspection Report</h1>
    <div class="generated-date">Generated: ${escapeHtml(generatedDate)}</div>
  </div>

  <div class="card">
    <div class="card-title">Vehicle Information</div>
    ${vehicleInfoRows}
    ${generalNotesBlock}
  </div>

  <div class="card">
    <div class="card-title">Inspection Summary</div>
    ${statsBlock}
  </div>

  <div class="card">
    <div class="card-title">Decision Status</div>
    <span class="badge" style="background:${decisionColor};">${escapeHtml(decisionLabel)}</span>
  </div>

  <div class="card">
    <div class="card-title">Checklist Details</div>
    ${sectionsHtml}
  </div>

  <div class="disclaimer-card">
    <div class="disclaimer-title">Disclaimer</div>
    This report was generated using Used Car Check Pro by Old Alex Hub. It is based solely on the
    user's recorded visual observations and is not a professional mechanical inspection, safety
    evaluation, vehicle history report, or purchase recommendation. No warranty or certification is
    implied. Always consult a qualified mechanic and review official records before making a purchase
    decision.
  </div>

${HTML_FOOT}`;
}

export async function generateInspectionPDF(inspection: Inspection): Promise<string> {
  const html = buildInspectionHtml(inspection);
  const fileName = `inspection-report-${Date.now()}`;
  const result = await RNHTMLtoPDF.convert({
    html,
    fileName,
    directory: 'Documents',
    width: 612,
    height: 792,
    padding: 30,
  });
  return result.filePath || '';
}

// ---------------------------------------------------------------------------
// Comparison PDF
// ---------------------------------------------------------------------------

function buildComparisonHtml(inspections: Inspection[]): string {
  const generatedDate = formatDate(new Date().toISOString());
  const capped = inspections.slice(0, 3);
  const colWidth = Math.floor(60 / capped.length);

  const vehicleHeaders = capped
    .map(ins => {
      const label =
        ins.vehicle.nickname ||
        [ins.vehicle.year, ins.vehicle.make, ins.vehicle.model]
          .filter(Boolean)
          .join(' ') ||
        'Vehicle';
      return `<th style="width:${colWidth}%;">${escapeHtml(label)}</th>`;
    })
    .join('\n');

  const nicknamesList = capped
    .map((ins, i) => {
      const label =
        ins.vehicle.nickname ||
        [ins.vehicle.year, ins.vehicle.make, ins.vehicle.model]
          .filter(Boolean)
          .join(' ') ||
        `Vehicle ${i + 1}`;
      return `<li>${escapeHtml(label)}</li>`;
    })
    .join('\n');

  function compRow(rowLabel: string, cells: string[]): string {
    const tds = cells.map(c => `<td>${c}</td>`).join('\n');
    return `<tr>
      <th style="background:#F9FAFB;font-weight:bold;color:#374151;width:20%;padding:6px 8px;border:1px solid #D1D5DB;">${escapeHtml(rowLabel)}</th>
      ${tds}
    </tr>`;
  }

  const priceValues = capped.map(ins =>
    ins.vehicle.askingPrice
      ? escapeHtml(`$${ins.vehicle.askingPrice}`)
      : '<span style="color:#9CA3AF;">N/A</span>',
  );

  const odometerValues = capped.map(ins =>
    ins.vehicle.odometer
      ? escapeHtml(`${ins.vehicle.odometer} mi`)
      : '<span style="color:#9CA3AF;">N/A</span>',
  );

  const yearValues = capped.map(ins =>
    ins.vehicle.year
      ? escapeHtml(ins.vehicle.year)
      : '<span style="color:#9CA3AF;">N/A</span>',
  );

  const powertrainValues = capped.map(ins =>
    escapeHtml(POWERTRAIN_LABELS[ins.vehicle.powertrainType] ?? ins.vehicle.powertrainType),
  );

  const inspDateValues = capped.map(ins =>
    ins.vehicle.inspectionDate
      ? escapeHtml(formatDate(ins.vehicle.inspectionDate))
      : '<span style="color:#9CA3AF;">N/A</span>',
  );

  const completionValues = capped.map(
    ins =>
      `<span style="font-weight:bold;color:#3B82F6;">${getCompletionPercentage(ins)}%</span>`,
  );

  const criticalValues = capped.map(ins => {
    const count = getCompletionStats(ins).critical;
    return count > 0
      ? `<span style="color:#EF4444;font-weight:bold;">${count}</span>`
      : `${count}`;
  });

  const concernValues = capped.map(ins => {
    const count = getCompletionStats(ins).concern;
    return count > 0
      ? `<span style="color:#F59E0B;font-weight:bold;">${count}</span>`
      : `${count}`;
  });

  const notCheckedValues = capped.map(ins =>
    String(getCompletionStats(ins).notChecked),
  );

  const decisionValues = capped.map(ins => {
    const color = DECISION_COLORS[ins.decisionStatus] ?? '#64748B';
    const label = DECISION_LABELS[ins.decisionStatus] ?? ins.decisionStatus;
    return `<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:${color};color:#fff;font-size:10px;font-weight:bold;">${escapeHtml(label)}</span>`;
  });

  const notesValues = capped.map(ins => {
    const notes = ins.vehicle.generalNotes || '';
    const preview = notes.length > 80 ? `${notes.substring(0, 80)}...` : notes;
    return preview
      ? escapeHtml(preview)
      : '<span style="color:#9CA3AF;">None</span>';
  });

  const tableRows = [
    compRow('Asking Price', priceValues),
    compRow('Odometer', odometerValues),
    compRow('Year', yearValues),
    compRow('Powertrain', powertrainValues),
    compRow('Inspection Date', inspDateValues),
    compRow('Completion %', completionValues),
    compRow('Critical Items', criticalValues),
    compRow('Concerns', concernValues),
    compRow('Not Checked', notCheckedValues),
    compRow('Decision', decisionValues),
    compRow('Notes Preview', notesValues),
  ].join('\n');

  return `${htmlHead('Vehicle Comparison Report - Used Car Check Pro')}

  <div class="report-header">
    <div class="company-name">Used Car Check Pro</div>
    <h1>Vehicle Comparison Report</h1>
    <div class="generated-date">Generated: ${escapeHtml(generatedDate)}</div>
  </div>

  <div class="card">
    <div class="card-title">Vehicles Being Compared</div>
    <ul style="padding-left:18px;font-size:12px;line-height:2;">
      ${nicknamesList}
    </ul>
  </div>

  <div class="card">
    <div class="card-title">Side-by-Side Comparison</div>
    <table>
      <thead>
        <tr>
          <th style="width:20%;background:#F3F4F6;">Category</th>
          ${vehicleHeaders}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

  <div class="disclaimer-card">
    <div class="disclaimer-title">Disclaimer</div>
    This comparison is based solely on user-recorded observations. This tool does not evaluate
    vehicle condition or recommend a purchase. Always consult a qualified professional.
  </div>

${HTML_FOOT}`;
}

export async function generateComparisonPDF(inspections: Inspection[]): Promise<string> {
  const html = buildComparisonHtml(inspections);
  const fileName = `comparison-report-${Date.now()}`;
  const result = await RNHTMLtoPDF.convert({
    html,
    fileName,
    directory: 'Documents',
    width: 612,
    height: 792,
    padding: 30,
  });
  return result.filePath || '';
}
