import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import type { FullInvestigationResult } from '@/types/seized-agent';

export async function generateSeizedVehiclePdf(
  result: FullInvestigationResult
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let y = height - 40;

  const checkPageBreak = (neededHeight: number) => {
    if (y - neededHeight < 40) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - 40;
    }
  };

  // Header Banner
  page.drawRectangle({
    x: 35,
    y: y - 55,
    width: width - 70,
    height: 60,
    color: rgb(0.08, 0.12, 0.22), // Dark Navy
  });

  page.drawText('BHARATTRACK - SEIZED VEHICLE LEGAL REPORT', {
    x: 50,
    y: y - 24,
    size: 15,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('STATUTORY COMPLIANCE & LEGAL INVESTIGATION MEMORANDUM', {
    x: 50,
    y: y - 42,
    size: 9,
    font: fontRegular,
    color: rgb(0.85, 0.88, 0.95),
  });

  page.drawText('DEMO - SIMULATED CCTNS', {
    x: width - 210,
    y: y - 24,
    size: 9,
    font: fontBold,
    color: rgb(1, 0.75, 0.2),
  });

  y -= 75;

  // Case Metadata Grid
  page.drawRectangle({
    x: 35,
    y: y - 85,
    width: width - 70,
    height: 85,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.82, 0.86, 0.92),
    borderWidth: 1,
  });

  const drawField = (label: string, val: string, xPos: number, yPos: number) => {
    page.drawText(label, {
      x: xPos,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0.35, 0.4, 0.5),
    });
    page.drawText(val, {
      x: xPos,
      y: yPos - 12,
      size: 9,
      font: fontRegular,
      color: rgb(0.1, 0.12, 0.16),
    });
  };

  drawField('VEHICLE REGISTRATION', result.record.vehicle_no, 50, y - 18);
  drawField('MAKE & MODEL', result.record.make_model, 210, y - 18);
  drawField('VEHICLE TYPE', result.record.type, 410, y - 18);

  drawField('FIR NUMBER', result.record.fir_no, 50, y - 48);
  drawField(
    'POLICE JURISDICTION',
    `${result.record.police_station}, ${result.record.district}`,
    210,
    y - 48
  );
  drawField(
    'ESTIMATED VALUE',
    `Rs. ${result.record.est_value.toLocaleString('en-IN')}`,
    410,
    y - 48
  );

  drawField('SEIZURE DATE', result.record.seizure_date, 50, y - 76);
  drawField('COURT PRODUCTION', result.record.production_in_court_date, 210, y - 76);
  drawField('PHYSICAL STATE', result.location.physical_custody_summary.slice(0, 32), 410, y - 76);

  y -= 105;

  // Legal Status Section
  const statusColor =
    result.status.status === 'Fully Usable (Rajyasaat)'
      ? rgb(0.05, 0.6, 0.35)
      : result.status.status === 'Conditionally Usable'
        ? rgb(0.15, 0.45, 0.85)
        : rgb(0.85, 0.45, 0.1);

  page.drawRectangle({
    x: 35,
    y: y - 45,
    width: width - 70,
    height: 45,
    color: rgb(0.98, 0.98, 1),
    borderColor: statusColor,
    borderWidth: 1.5,
  });

  page.drawText('LEGAL STATUS CLASSIFICATION (SECTION 8)', {
    x: 50,
    y: y - 16,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.35, 0.45),
  });

  page.drawText(result.status.status.toUpperCase(), {
    x: 50,
    y: y - 34,
    size: 13,
    font: fontBold,
    color: statusColor,
  });

  page.drawText(
    `Can Dept Reuse: ${result.status.can_reuse_by_department ? 'YES' : 'NO'} | Auction: ${result.disposal_route.auction_eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`,
    {
      x: 270,
      y: y - 32,
      size: 9,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.35),
    }
  );

  y -= 60;

  // Legal Mapping Section
  page.drawText('1. STATUTORY CHARGES & GOVERNING PROCEDURE', {
    x: 35,
    y: y,
    size: 10,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.22),
  });
  y -= 16;

  page.drawText(
    `Offence Section: ${result.legal_map.bns_section}  |  Special Law: ${result.record.special_law}`,
    {
      x: 35,
      y: y,
      size: 9,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.3),
    }
  );
  y -= 14;

  page.drawText(`Governing Seizure & Disposal: ${result.legal_map.seizure_disposal_law}`, {
    x: 35,
    y: y,
    size: 9,
    font: fontBold,
    color: rgb(0.25, 0.3, 0.4),
  });
  y -= 14;

  const plainLines = [
    `Summary: ${result.legal_map.plain_explanation}`,
    `Government Rule: ${result.legal_map.government_use_rule}`,
    `Elapsed Time Rule: ${result.status.elapsed_time_disclaimer}`,
  ];

  plainLines.forEach((line) => {
    const wrapped = line.slice(0, 105);
    page.drawText(wrapped, {
      x: 35,
      y: y,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45),
    });
    y -= 12;
  });

  y -= 8;

  // Procedural Deadlines Table
  checkPageBreak(120);
  page.drawText('2. STATUTORY DEADLINE COMPLIANCE MONITOR (SECTION 4)', {
    x: 35,
    y: y,
    size: 10,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.22),
  });
  y -= 16;

  result.deadlines.items.forEach((item) => {
    const isOverdue = item.status === 'overdue';
    const tagColor = isOverdue
      ? rgb(0.85, 0.15, 0.15)
      : item.status === 'on-time'
        ? rgb(0.05, 0.55, 0.25)
        : rgb(0.4, 0.45, 0.55);

    page.drawText(`• ${item.label}:`, {
      x: 35,
      y: y,
      size: 8.5,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.28),
    });

    page.drawText(
      `[${item.status.toUpperCase()}${item.days_overdue > 0 ? ` by ${item.days_overdue} days` : ''}]`,
      {
        x: 310,
        y: y,
        size: 8.5,
        font: fontBold,
        color: tagColor,
      }
    );

    y -= 12;

    page.drawText(`   ${item.notes.slice(0, 100)}`, {
      x: 35,
      y: y,
      size: 7.5,
      font: fontOblique,
      color: rgb(0.4, 0.45, 0.55),
    });
    y -= 14;
  });

  y -= 8;

  // Agent Findings & Reasoning
  checkPageBreak(160);
  page.drawText('3. AGENT INVESTIGATION FINDINGS & NEXT ACTION', {
    x: 35,
    y: y,
    size: 10,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.22),
  });
  y -= 16;

  page.drawText(`Recommended Next Action: ${result.reasoning.next_action}`, {
    x: 35,
    y: y,
    size: 9,
    font: fontBold,
    color: rgb(0.08, 0.35, 0.75),
  });
  y -= 14;

  page.drawText(`Competent Authority: ${result.reasoning.action_authority}`, {
    x: 35,
    y: y,
    size: 8.5,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });
  y -= 14;

  result.reasoning.action_steps.forEach((step, idx) => {
    page.drawText(`Step ${idx + 1}: ${step}`, {
      x: 45,
      y: y,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.35),
    });
    y -= 12;
  });

  y -= 10;

  // Statutory Alerts
  if (result.reasoning.alerts.length > 0) {
    checkPageBreak(80);
    page.drawText('Identified Statutory Defaults / Procedural Alerts:', {
      x: 35,
      y: y,
      size: 8.5,
      font: fontBold,
      color: rgb(0.8, 0.15, 0.15),
    });
    y -= 14;

    result.reasoning.alerts.forEach((alert) => {
      page.drawText(`[${alert.level.toUpperCase()}] ${alert.title} - ${alert.statutory_ref}`, {
        x: 45,
        y: y,
        size: 8,
        font: fontBold,
        color: alert.level === 'critical' ? rgb(0.8, 0.1, 0.1) : rgb(0.6, 0.4, 0.1),
      });
      y -= 11;
      page.drawText(`   ${alert.description.slice(0, 105)}`, {
        x: 45,
        y: y,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.35, 0.4, 0.45),
      });
      y -= 13;
    });
  }

  y -= 12;

  // Mandatory Statutory Disclaimer
  checkPageBreak(50);
  page.drawRectangle({
    x: 35,
    y: y - 35,
    width: width - 70,
    height: 35,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });

  page.drawText('LEGAL DISCLAIMER:', {
    x: 45,
    y: y - 14,
    size: 7.5,
    font: fontBold,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(
    'Study tool, not legal advice. Verify with official Gazette and an advocate. Indian law recognizes no automated property forfeiture by passage of time.',
    {
      x: 45,
      y: y - 26,
      size: 7,
      font: fontRegular,
      color: rgb(0.45, 0.45, 0.45),
    }
  );

  return await pdfDoc.save();
}
