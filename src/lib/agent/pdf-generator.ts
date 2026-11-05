import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import type { FullInvestigationResult } from '@/types/seized-agent';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BLACK = rgb(0.08, 0.08, 0.08);
const DARK_GRAY = rgb(0.25, 0.25, 0.25);
const MID_GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.88, 0.88, 0.88);
const PALE_GRAY = rgb(0.97, 0.97, 0.97);
const WHITE = rgb(1, 1, 1);

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (value: string, size: number) => number },
  size: number,
  maxWidth: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

export async function generateSeizedVehiclePdf(
  result: FullInvestigationResult
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const mono = await pdfDoc.embedFont(StandardFonts.Courier);
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const addPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const ensure = (height: number) => {
    if (y - height < MARGIN) addPage();
  };

  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color = LIGHT_GRAY,
    thickness = 0.7
  ) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness });
  };

  const paragraph = (
    text: string,
    options: {
      font?: typeof regular;
      size?: number;
      color?: typeof BLACK;
      indent?: number;
      leading?: number;
      gap?: number;
    } = {}
  ) => {
    const font = options.font ?? regular;
    const size = options.size ?? 9;
    const leading = options.leading ?? size * 1.35;
    const indent = options.indent ?? 0;
    const lines = wrapText(text, font, size, CONTENT_WIDTH - indent);
    ensure(lines.length * leading + (options.gap ?? 0));
    lines.forEach((textLine) => {
      page.drawText(textLine, {
        x: MARGIN + indent,
        y,
        size,
        font,
        color: options.color ?? DARK_GRAY,
      });
      y -= leading;
    });
    y -= options.gap ?? 0;
  };

  const heading = (number: string, title: string) => {
    ensure(32);
    y -= 8;
    page.drawText(`${number}  ${title.toUpperCase()}`, {
      x: MARGIN,
      y,
      size: 10,
      font: bold,
      color: BLACK,
    });
    y -= 7;
    line(MARGIN, y, PAGE_WIDTH - MARGIN, y, BLACK, 0.8);
    y -= 16;
  };

  const labelValue = (label: string, value: string, x: number, width: number) => {
    page.drawText(label.toUpperCase(), { x, y, size: 7, font: bold, color: MID_GRAY });
    const lines = wrapText(value, regular, 9, width);
    lines.forEach((valueLine, index) => {
      page.drawText(valueLine, { x, y: y - 12 - index * 11, size: 9, font: regular, color: BLACK });
    });
  };

  const drawCaseHeader = () => {
    page.drawText('BHARATTRACK', { x: MARGIN, y, size: 9, font: bold, color: DARK_GRAY });
    page.drawText('SEIZED VEHICLE REVIEW', {
      x: MARGIN,
      y: y - 25,
      size: 20,
      font: bold,
      color: BLACK,
    });
    page.drawText('Statutory compliance and custody memorandum', {
      x: MARGIN,
      y: y - 40,
      size: 9,
      font: italic,
      color: MID_GRAY,
    });
    page.drawText('STUDY COPY', {
      x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize('STUDY COPY', 8),
      y,
      size: 8,
      font: bold,
      color: MID_GRAY,
    });
    y -= 60;
    line(MARGIN, y, PAGE_WIDTH - MARGIN, y, BLACK, 1);
    y -= 20;
  };

  const drawMetadata = () => {
    ensure(120);
    page.drawRectangle({
      x: MARGIN,
      y: y - 108,
      width: CONTENT_WIDTH,
      height: 108,
      color: PALE_GRAY,
      borderColor: LIGHT_GRAY,
      borderWidth: 0.8,
    });
    const columns = [MARGIN + 12, MARGIN + 172, MARGIN + 340];
    labelValue('Vehicle registration', result.record.vehicle_no, columns[0], 145);
    labelValue('Make and model', result.record.make_model, columns[1], 150);
    labelValue('Vehicle type', result.record.type, columns[2], 130);
    y -= 34;
    labelValue('FIR number', result.record.fir_no, columns[0], 145);
    labelValue(
      'Police jurisdiction',
      `${result.record.police_station}, ${result.record.district}`,
      columns[1],
      150
    );
    labelValue(
      'Estimated value',
      `Rs. ${result.record.est_value.toLocaleString('en-IN')}`,
      columns[2],
      130
    );
    y -= 34;
    labelValue('Seizure date', result.record.seizure_date, columns[0], 145);
    labelValue('Court production', result.record.production_in_court_date, columns[1], 150);
    labelValue('Physical custody', result.location.current_location, columns[2], 130);
    y -= 40;
  };

  const drawStatus = () => {
    ensure(52);
    page.drawText('LEGAL STATUS', { x: MARGIN, y, size: 7, font: bold, color: MID_GRAY });
    page.drawText(result.status.status.toUpperCase(), {
      x: MARGIN,
      y: y - 16,
      size: 12,
      font: bold,
      color: BLACK,
    });
    page.drawText(
      `Department reuse: ${result.status.can_reuse_by_department ? 'YES' : 'NO'}   |   Auction: ${result.disposal_route.auction_eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`,
      { x: MARGIN, y: y - 31, size: 8.5, font: regular, color: DARK_GRAY }
    );
    y -= 52;
  };

  const drawTable = (headers: string[], rows: string[][], widths: number[]) => {
    const rowHeight = 28;
    ensure(rowHeight * (rows.length + 1) + 10);
    let x = MARGIN;
    headers.forEach((header, index) => {
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: widths[index],
        height: rowHeight,
        color: LIGHT_GRAY,
      });
      page.drawText(header.toUpperCase(), {
        x: x + 5,
        y: y - 17,
        size: 7,
        font: bold,
        color: BLACK,
      });
      x += widths[index];
    });
    y -= rowHeight;
    rows.forEach((row) => {
      x = MARGIN;
      const height =
        rowHeight +
        Math.max(
          0,
          ...row.map((cell, index) => wrapText(cell, regular, 7.5, widths[index] - 10).length - 1)
        ) *
          10;
      ensure(height);
      row.forEach((cell, index) => {
        page.drawRectangle({
          x,
          y: y - height,
          width: widths[index],
          height,
          color: WHITE,
          borderColor: LIGHT_GRAY,
          borderWidth: 0.5,
        });
        const cellLines = wrapText(cell, regular, 7.5, widths[index] - 10);
        cellLines.forEach((cellLine, lineIndex) => {
          page.drawText(cellLine, {
            x: x + 5,
            y: y - 13 - lineIndex * 10,
            size: 7.5,
            font: regular,
            color: DARK_GRAY,
          });
        });
        x += widths[index];
      });
      y -= height;
    });
    y -= 12;
  };

  const drawTimeline = () => {
    const items = result.deadlines.items.map((item) => [
      item.label,
      item.actual_date ?? 'Not recorded',
      item.status === 'overdue' ? `OVERDUE (${item.days_overdue} days)` : item.status.toUpperCase(),
      item.notes,
    ]);
    drawTable(['Requirement', 'Date', 'Status', 'Notes'], items, [
      130,
      90,
      100,
      CONTENT_WIDTH - 320,
    ]);
  };

  drawCaseHeader();
  drawMetadata();
  drawStatus();

  heading('1', 'Legal basis');
  paragraph(`Offence: ${result.legal_map.bns_section} — ${result.legal_map.offence_brief}`, {
    font: regular,
    size: 9,
    gap: 4,
  });
  paragraph(`Governing law: ${result.legal_map.seizure_disposal_law}`, {
    font: mono,
    size: 8.5,
    color: DARK_GRAY,
    gap: 4,
  });
  paragraph(result.legal_map.plain_explanation, { size: 9, gap: 4 });
  paragraph(`Government reuse rule: ${result.legal_map.government_use_rule}`, { size: 9 });

  heading('2', 'Custody and statutory deadlines');
  drawTable(
    ['Measure', 'Value', 'Reference'],
    [
      ['Days in custody', String(result.custody.days_since_seizure), result.custody.reference_date],
      [
        'Days since court production',
        String(result.custody.days_since_production),
        'Six-month outer limit',
      ],
      [
        'Months since seizure',
        String(result.custody.months_since_seizure),
        'Calculated from fixed reference date',
      ],
    ],
    [190, 110, CONTENT_WIDTH - 300]
  );
  drawTimeline();

  heading('3', 'Recommended next action');
  paragraph(`Action: ${result.reasoning.next_action}`, {
    font: bold,
    size: 10,
    color: BLACK,
    gap: 5,
  });
  paragraph(`Authority: ${result.reasoning.action_authority}`, { font: bold, size: 9, gap: 7 });
  result.reasoning.action_steps.forEach((step, index) => {
    paragraph(`${index + 1}. ${step}`, { size: 9, indent: 12, gap: 2 });
  });

  if (result.reasoning.alerts.length > 0) {
    heading('4', 'Procedural alerts');
    result.reasoning.alerts.forEach((alert) => {
      paragraph(`${alert.level.toUpperCase()} — ${alert.title} (${alert.statutory_ref})`, {
        font: bold,
        size: 8.5,
        gap: 2,
      });
      paragraph(alert.description, { size: 8.5, indent: 12, gap: 5 });
    });
  }

  heading(result.reasoning.alerts.length > 0 ? '5' : '4', 'Investigation record');
  result.trace.forEach((trace, index) => {
    const title = [
      'Fetched FIR record',
      'Matched legal sections',
      'Calculated custody days',
      'Checked statutory deadlines',
      'Selected disposal route',
      'Classified legal status',
      'Verified physical custody',
      'Prepared next action',
    ][index];
    paragraph(`${index + 1}. ${title}`, { font: bold, size: 8.5, gap: 1 });
    paragraph(trace.summary_result ?? trace.thinking, { size: 8, indent: 14, gap: 4 });
  });

  ensure(55);
  y -= 8;
  line(MARGIN, y, PAGE_WIDTH - MARGIN, y, BLACK, 0.8);
  y -= 14;
  paragraph(
    'DISCLAIMER: Study tool, not legal advice. Verify with the official Gazette and an advocate.',
    {
      font: italic,
      size: 8,
      color: DARK_GRAY,
    }
  );
  paragraph(
    `Generated for ${result.record.vehicle_no}. This report is based on the demonstration dataset.`,
    {
      size: 7.5,
      color: MID_GRAY,
    }
  );

  const pages = pdfDoc.getPages();
  pages.forEach((pdfPage, index) => {
    pdfPage.drawLine({
      start: { x: MARGIN, y: 34 },
      end: { x: PAGE_WIDTH - MARGIN, y: 34 },
      color: LIGHT_GRAY,
      thickness: 0.6,
    });
    pdfPage.drawText('BharatTrack · Seized Vehicle Review · Study copy', {
      x: MARGIN,
      y: 22,
      size: 7,
      font: regular,
      color: MID_GRAY,
    });
    const pageLabel = `${index + 1} / ${pages.length}`;
    pdfPage.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(pageLabel, 7),
      y: 22,
      size: 7,
      font: regular,
      color: MID_GRAY,
    });
  });

  return pdfDoc.save();
}
