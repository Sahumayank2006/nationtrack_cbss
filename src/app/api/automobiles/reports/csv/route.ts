import { getUtilizationReport } from '@/lib/automobiles-service';

const escapeCsv = (value: string | number): string => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export async function GET() {
  const report = getUtilizationReport(30);
  const header = ['Date', 'Active KM', 'Idle KM', 'Trips'];
  const lines = [
    header.join(','),
    ...report.points.map((point) =>
      [point.date, point.activeKm, point.idleKm, point.trips].map(escapeCsv).join(',')
    ),
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="nationtrack-utilization.csv"',
    },
  });
}
