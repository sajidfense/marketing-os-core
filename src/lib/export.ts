export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) return;

  const cols = columns ?? Object.keys(data[0] as object).map((key) => ({ key: key as keyof T, label: String(key) }));
  const header = cols.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const val = (row as Record<string, unknown>)[c.key as string];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
