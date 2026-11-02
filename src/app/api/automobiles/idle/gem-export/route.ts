import { getGemExportRows } from '@/lib/automobiles-service';

const escapeCsv = (value: string | number): string => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export async function GET() {
  const rows = getGemExportRows();
  const header = [
    'Registration Number',
    'Make/Model',
    'Year',
    'Fuel Type',
    'Department',
    'Idle Days',
    'Estimated Value',
    'Contact Officer',
  ];

  const csvRows = [
    header.join(','),
    ...rows.map((row) =>
      [
        row.registrationNumber,
        row.makeModel,
        row.year,
        row.fuelType,
        row.department,
        row.idleDays,
        row.estimatedValue,
        row.contactOfficer,
      ]
        .map(escapeCsv)
        .join(',')
    ),
  ];

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csvRows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="nationtrack-gem-export-${date}.csv"`,
    },
  });
}
