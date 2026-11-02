import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { getVehicles } from '@/lib/automobiles-service';

export async function GET() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 530, width: 842, height: 65, color: rgb(0.04, 0.33, 0.57) });
  page.drawText('NationTrack Automobile Utilization Summary', {
    x: 32,
    y: 560,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(`Generated: ${new Date().toLocaleString('en-IN')}`, {
    x: 32,
    y: 540,
    size: 10,
    font,
    color: rgb(0.9, 0.97, 1),
  });

  const vehicles = getVehicles().slice(0, 24);
  let y = 505;

  page.drawText('Vehicle', { x: 30, y, size: 10, font: bold });
  page.drawText('Department', { x: 175, y, size: 10, font: bold });
  page.drawText('Status', { x: 400, y, size: 10, font: bold });
  page.drawText('Hours Today', { x: 500, y, size: 10, font: bold });
  page.drawText('Idle %', { x: 620, y, size: 10, font: bold });

  y -= 18;

  for (const vehicle of vehicles) {
    if (y < 45) break;
    page.drawText(vehicle.registrationNumber, { x: 30, y, size: 9, font });
    page.drawText(vehicle.departmentName, { x: 175, y, size: 9, font });
    page.drawText(vehicle.status, { x: 400, y, size: 9, font });
    page.drawText(String(vehicle.utilization.hoursToday), { x: 510, y, size: 9, font });
    page.drawText(`${vehicle.utilization.idlePercent}%`, { x: 625, y, size: 9, font });
    y -= 16;
  }

  const bytes = await pdf.save();
  const normalizedBytes = new Uint8Array(bytes.length);
  normalizedBytes.set(bytes);
  const body = new Blob([normalizedBytes], { type: 'application/pdf' });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="nationtrack-utilization.pdf"',
    },
  });
}
